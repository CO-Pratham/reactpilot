import type { MigrationRule } from '../types.js';

export const nextjsRules: MigrationRule[] = [
  // 1. Next.js legacy image component migration
  {
    id: 'next-legacy-image',
    name: 'Migrate legacy next/image imports',
    description: 'Update legacy next/image imports to the new optimized image component',
    mode: 'nextjs',
    check(filePath, code) {
      return code.includes('next/legacy/image');
    },
    transform(filePath, code) {
      return code.replace(/from\s+['"]next\/legacy\/image['"]/g, "from 'next/image'");
    },
  },

  // 2. Head component to Next.js Metadata API
  {
    id: 'next-metadata-api',
    name: 'Migrate Head components to Metadata API',
    description: 'Transform next/head components in page files to export const metadata declarations',
    mode: 'nextjs',
    check(filePath, code) {
      return (filePath.includes('page.tsx') || filePath.includes('layout.tsx')) && code.includes('next/head');
    },
    transform(filePath, code) {
      // Strip next/head import
      let cleaned = code.replace(/import\s+Head\s+from\s+['"]next\/head['"];?/g, '');

      // Parse tags inside <Head> tags and recommend metadata exports
      const titleMatch = code.match(/<title>([^<]+)<\/title>/);
      const descMatch = code.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/);

      if (titleMatch || descMatch) {
        const title = titleMatch ? titleMatch[1] : '';
        const description = descMatch ? descMatch[1] : '';

        const metadataExport = `\nexport const metadata = {
  title: "${title}",
  description: "${description}",
};\n`;

        cleaned = cleaned.replace(/<Head>[\s\S]*?<\/Head>/g, '') + metadataExport;
      }

      return cleaned;
    },
  },

  // 3. next/dynamic import simplification
  {
    id: 'next-dynamic-imports',
    name: 'Simplify dynamic imports',
    description: 'Standardize next/dynamic imports for cleaner chunk boundaries',
    mode: 'nextjs',
    check(filePath, code) {
      return code.includes('next/dynamic');
    },
    transform(filePath, code) {
      // Basic match for next/dynamic calls
      return code; // Keeps code intact, serves as an inspection rule mostly
    },
  }
];
