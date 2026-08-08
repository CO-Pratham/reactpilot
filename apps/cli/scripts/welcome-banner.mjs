// Post-install welcome banner for @reactpilot/cli
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.join(__dirname, '..', 'package.json');

let version = '1.1.0';
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  version = pkg.version || '1.1.0';
} catch { /* fallback */ }

const cyan = (str) => `\x1b[36m${str}\x1b[0m`;
const bold = (str) => `\x1b[1m${str}\x1b[0m`;
const dim = (str) => `\x1b[2m${str}\x1b[0m`;
const magenta = (str) => `\x1b[35m${str}\x1b[0m`;

const title = `⚡ ReactPilot CLI v${version} — AI-Powered React Assistant`;
const lines = [
  `${bold('👉 First Command:')}  reactpilot features`,
  `${bold('✨ Pro Plan:')}       reactpilot dashboard → Click "Join Pro Waitlist"`,
  `${bold('📚 Documentation:')}  https://co-pratham.github.io/reactpilot-docs/`
];

const width = 76;
const top = '┌' + '─'.repeat(width - 2) + '┐';
const mid = '├' + '─'.repeat(width - 2) + '┤';
const bot = '└' + '─'.repeat(width - 2) + '┘';

console.log('\n' + cyan(top));
console.log(cyan('│  ') + bold(title).padEnd(width - 4 + 8) + cyan('│'));
console.log(cyan(mid));
for (const line of lines) {
  // Strip ANSI color escape codes to compute length correctly
  const cleanLine = line.replace(/\u001b\[\d+m/g, '');
  const padding = width - 4 - cleanLine.length;
  console.log(cyan('│  ') + line + ' '.repeat(Math.max(0, padding)) + cyan('│'));
}
console.log(cyan(bot) + '\n');
