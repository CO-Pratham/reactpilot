interface StoredFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
}

const fileStore: StoredFile[] = [];

export function saveFile(projectId: string, path: string, content: string) {
  const record: StoredFile = {
    id: `file-${fileStore.length + 1}`,
    projectId,
    path,
    content
  };
  fileStore.push(record);
  return record;
}

export function listFiles(projectId: string) {
  return fileStore.filter((file) => file.projectId === projectId);
}

