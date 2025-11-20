import { useState } from "react";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import { FileUploader } from "../../../shared/components";
import { api } from "../../../shared/services/api";
import { useProjectStore } from "../../../shared/stores/projectStore";

export const ProjectUploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { fetchProjects } = useProjectStore();

  const handleUpload = async (files: File[]) => {
    setUploadedFiles(files);
    setUploadError(null);
    setIsUploading(true);

    try {
      const file = files[0];
      if (!file) return;

      const extractedFiles: { path: string; content: string }[] = [];
      let projectName = file.name.replace(/\.(zip|rar|7z)$/i, "");

      if (file.name.endsWith(".zip")) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
          if (!zipEntry.dir && !relativePath.includes("node_modules") && !relativePath.includes(".git") && !relativePath.includes("dist") && !relativePath.includes("build")) {
            // Only process text files (simplified check)
            if (/\.(js|jsx|ts|tsx|css|html|json|md|txt)$/i.test(relativePath)) {
              const content = await zipEntry.async("string");
              extractedFiles.push({
                path: relativePath,
                content: content,
              });
            }
          }
        }
      } else {
        // Handle single file upload (if supported) or folder drop if browser supports it
        // For now, we'll assume zip for the main flow as requested
        setUploadError("Please upload a .zip file of your project.");
        setIsUploading(false);
        return;
      }

      if (extractedFiles.length === 0) {
        setUploadError("No valid source files found in the zip.");
        setIsUploading(false);
        return;
      }

      // Send to backend
      const newProject = await api.uploadProject({
        name: projectName,
        description: "Uploaded via dashboard",
        files: extractedFiles,
      });

      // Trigger analysis immediately
      await api.analyzeProject(newProject.id);

      // Refresh projects and redirect
      await fetchProjects();
      navigate("/");

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("Failed to upload project. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Upload</p>
        <h1 className="text-2xl font-semibold text-white">Analyze a React project</h1>
        <p className="text-sm text-slate-400">
          Drag & drop a .zip file of your project to run ReactPilot analysis.
        </p>
      </div>
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
          <p className="mt-4 text-slate-300">Processing and uploading files...</p>
        </div>
      ) : (
        <FileUploader onUpload={handleUpload} />
      )}

      {uploadError && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-400 border border-red-500/20">
          {uploadError}
        </div>
      )}

      {uploadedFiles.length > 0 && !isUploading && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
          <p className="mb-3 font-semibold text-white">Selected File</p>
          <ul className="space-y-2">
            {uploadedFiles.map((file) => (
              <li key={file.name} className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2">
                <span>{file.name}</span>
                <span className="text-slate-500">{(file.size / 1024).toFixed(1)} kb</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

