import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
}

export const FileUploader = ({ onUpload }: FileUploaderProps) => {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={[
        "rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-8 text-center transition",
        isDragActive ? "border-brand bg-brand/10 text-white" : "text-slate-400",
      ].join(" ")}
    >
      <input {...getInputProps()} />
      <p className="text-lg font-semibold text-white">
        Drop your React project
      </p>
      <p className="text-sm text-slate-400">
        Upload a .zip or entire folder to analyze.
      </p>
    </div>
  );
};
