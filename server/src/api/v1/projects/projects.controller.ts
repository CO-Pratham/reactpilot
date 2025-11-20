import type { Request, Response } from "express";
import { projectModel } from "../../../models/projectModel.js";
import { reportModel } from "../../../models/reportModel.js";
import { fileModel } from "../../../models/fileModel.js";
import { analyzeProject } from "@reactpilot/analyzer";
import { proposeFix } from "@reactpilot/ai-engine";
import { applyPatchToCode } from "@reactpilot/patcher";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

/**
 * Get all projects
 */
export async function getAllProjects(req: Request, res: Response) {
  try {
    const projects = await projectModel.getAll();
    return res.json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    return res.status(500).json({ message: 'Failed to fetch projects', error: String(error) });
  }
}

/**
 * Create/upload a new project
 */
export async function uploadProject(req: Request, res: Response) {
  try {
    const { name, description, files = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Create project
    // @ts-ignore - path is required in schema but we generate it or it's optional in partial
    const project = await projectModel.create({ 
      name, 
      description,
      path: `/projects/${name.toLowerCase().replace(/\s+/g, '-')}` // Mock path for now
    });
    
    // Save files if provided
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file.path && file.content) {
          await fileModel.saveFile(project.id, {
            path: file.path,
            content: file.content,
            size: file.content.length
          });
        }
      }
      
      // Update file count
      await projectModel.updateStats(project.id, files.length);
    }

    return res.status(201).json(project);
  } catch (error) {
    console.error('Error uploading project:', error);
    return res.status(500).json({ message: 'Failed to upload project', error: String(error) });
  }
}

/**
 * Get a specific project with files
 */
export async function getProject(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    
    const project = await projectModel.getById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const files = await fileModel.getFiles(projectId);

    return res.json({
      ...project,
      files
    });
  } catch (error) {
    console.error('Error getting project:', error);
    return res.status(500).json({ message: 'Failed to fetch project', error: String(error) });
  }
}

/**
 * Analyze a project
 */
export async function analyzeProjectController(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    
    const project = await projectModel.getById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project files
    const files = await fileModel.getFiles(projectId);
    
    if (files.length === 0) {
      return res.status(400).json({ message: 'No files to analyze' });
    }

    // Create temporary directory for analysis
    const tempDir = path.join(os.tmpdir(), `reactpilot-${projectId}-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Write files to temp directory
      for (const file of files) {
        // Need to fetch content for analysis
        const fileDoc = await fileModel.getFileContent(projectId, file.path);
        if (fileDoc) {
          const filePath = path.join(tempDir, file.path);
          const dir = path.dirname(filePath);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(filePath, fileDoc.content);
        }
      }

      // Run analysis
      const report = analyzeProject(tempDir);
      
      // Calculate performance score
      const performanceScore = Math.max(0, 100 - (report.summary.errors * 10 + report.summary.warnings * 5 + report.summary.info * 2));

      // Save report to database
      const dbReport = await reportModel.saveReport(projectId, {
        issues: report.issues,
        suggestions: [], // Analyzer might not return suggestions yet
        patches: [],
        performanceScore
      });
      
      // Update project performance score
      await projectModel.update(projectId, { performance_score: performanceScore });

      return res.json({
        report: dbReport,
        files: files.map(f => ({ path: f.path, size: f.size }))
      });
    } finally {
      // Cleanup temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Error analyzing project:', error);
    return res.status(500).json({ message: 'Failed to analyze project', error: String(error) });
  }
}

/**
 * Apply AI fixes to a file
 */
export async function fixProjectController(req: Request, res: Response) {
  try {
    const { projectId, filePath, code, instructions } = req.body;

    if (!projectId || !filePath || !code) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get AI fix
    const aiResponse = await proposeFix({
      filePath,
      code,
      instructions: instructions || 'Fix all detected issues and improve code quality'
    });

    // Apply patch
    const patchResult = applyPatchToCode({
      filePath,
      originalCode: code,
      patchedCode: aiResponse.patchedCode
    });

    // Save to database if successful
    if (patchResult.applied) {
      await fileModel.saveFile(projectId, {
        path: filePath,
        content: aiResponse.patchedCode,
        size: aiResponse.patchedCode.length
      });
    }

    return res.json({
      aiResponse,
      patchResult,
      applied: patchResult.applied
    });
  } catch (error) {
    console.error('Error fixing project:', error);
    return res.status(500).json({ message: 'Failed to apply fixes', error: String(error) });
  }
}

/**
 * Get analysis report for a project
 */
export async function getReportController(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    
    const report = await reportModel.getLatestReport(projectId);
    if (!report) {
      return res.status(404).json({ message: 'No report found for this project' });
    }

    return res.json(report);
  } catch (error) {
    console.error('Error getting report:', error);
    return res.status(500).json({ message: 'Failed to fetch report', error: String(error) });
  }
}

/**
 * Get all reports for a project
 */
export async function getProjectReports(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    const reports = await reportModel.getReports(projectId);
    return res.json(reports);
  } catch (error) {
    console.error('Error getting reports:', error);
    return res.status(500).json({ message: 'Failed to fetch reports', error: String(error) });
  }
}

/**
 * Delete a project
 */
export async function deleteProjectController(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    const deleted = await projectModel.delete(projectId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Clean up related data
    await fileModel.deleteProjectFiles(projectId);
    // await reportModel.deleteProjectReports(projectId); // If implemented

    return res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ message: 'Failed to delete project', error: String(error) });
  }
}
