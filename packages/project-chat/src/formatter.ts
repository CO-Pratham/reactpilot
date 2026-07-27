import path from 'node:path';

/**
 * Format helper for project chat.
 * Cleans up and verifies markdown links with file:// schemes.
 */
export function formatResponse(text: string, projectRoot: string): string {
  // Regex to match relative links if the LLM generated them
  // e.g. [index.ts](src/index.ts#L10-L20) or [index.ts](file://src/index.ts#L10)
  const relativeLinkRegex = /\[([^\]]+)\]\((file:\/\/)?([\w\-./\\]+)(#L\d+(-L\d+)?)?\)/g;

  return text.replace(relativeLinkRegex, (match, label, protocol, filePath, hash) => {
    // If it's already absolute, leave it
    if (filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath)) {
      const urlPath = filePath.replace(/\\/g, '/');
      return `[${label}](file://${urlPath}${hash ?? ''})`;
    }

    // Convert relative to absolute based on project root
    const absolute = path.resolve(projectRoot, filePath);
    const urlPath = absolute.replace(/\\/g, '/');
    return `[${label}](file://${urlPath}${hash ?? ''})`;
  });
}
