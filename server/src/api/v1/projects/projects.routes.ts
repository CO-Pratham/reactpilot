import { Router } from 'express';
import * as controller from './projects.controller.js';

const router = Router();

// Get all projects
router.get('/', controller.getAllProjects);

// Create/upload a new project
router.post('/', controller.uploadProject);

// Get a specific project
router.get('/:id', controller.getProject);

// Analyze a project
router.post('/:id/analyze', controller.analyzeProjectController);

// Get latest report for a project
router.get('/:id/report', controller.getReportController);

// Get all reports for a project
router.get('/:id/reports', controller.getProjectReports);

// Apply AI fixes
router.post('/fix', controller.fixProjectController);

// Delete a project
router.delete('/:id', controller.deleteProjectController);

export default router;
