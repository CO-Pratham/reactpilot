import { useFileStore } from '../../stores/fileStore';

export const CodeViewer = () => {
  const { selectedFilePath } = useFileStore();

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <p>{selectedFilePath ?? 'Select a file to preview code'}</p>
        <button className="text-brand hover:underline">Open full diff</button>
      </div>
      <pre className="overflow-auto rounded-lg bg-slate-900/80 p-4 text-xs text-slate-100">
        <code>
          {`// Example snippet – replace with AST powered code preview
const Example = () => {
  return <div>ReactPilot will render file diffs here.</div>;
};`}
        </code>
      </pre>
    </section>
  );
};

