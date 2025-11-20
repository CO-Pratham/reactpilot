import { FileCode } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';

export const FileTree = () => {
  const { files, selectedFilePath, selectFile } = useFileStore();

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
      <h3 className="mb-3 text-sm font-semibold text-white">Project Files</h3>
      <ul className="space-y-2">
        {files.map((file) => {
          const isActive = selectedFilePath === file.path;
          return (
            <li key={file.path}>
              <button
                onClick={() => selectFile(file.path)}
                className={[
                  'flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-left transition',
                  isActive ? 'border-brand/40 bg-brand/10 text-white' : 'hover:bg-slate-900/60'
                ].join(' ')}
              >
                <FileCode size={16} />
                <span className="flex-1 truncate">{file.path}</span>
                <span className="text-xs text-slate-400">{file.size.toFixed(1)} kb</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

