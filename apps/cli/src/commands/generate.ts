import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';

type GenerateType = 'component' | 'hook' | 'context' | 'page' | 'layout';

export async function runGenerate(type: string, name: string) {
  if (!['component', 'hook', 'context', 'page', 'layout'].includes(type)) {
    console.error(chalk.red(`Invalid type: ${type}. Supported types: component, hook, context, page, layout`));
    process.exit(1);
  }

  const spinner = ora(`Generating ${type} named ${name}`).start();
  
  try {
    const cwd = process.cwd();
    const srcDir = path.join(cwd, 'src');
    
    // Ensure src directory exists
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }

    let targetDir = '';
    let fileName = '';
    let content = '';
    let testContent = '';
    let cssContent = '';

    switch (type as GenerateType) {
      case 'component':
        targetDir = path.join(srcDir, 'components', name);
        fileName = `${name}.tsx`;
        content = generateComponentTemplate(name);
        testContent = generateTestTemplate(name);
        cssContent = generateCssTemplate(name);
        break;
      case 'hook':
        targetDir = path.join(srcDir, 'hooks');
        fileName = `${name}.ts`;
        content = generateHookTemplate(name);
        break;
      case 'context':
        targetDir = path.join(srcDir, 'contexts');
        fileName = `${name}Context.tsx`;
        content = generateContextTemplate(name);
        break;
      case 'page':
        targetDir = path.join(srcDir, 'pages');
        fileName = `${name}Page.tsx`;
        content = generatePageTemplate(name);
        break;
      case 'layout':
        targetDir = path.join(srcDir, 'layouts');
        fileName = `${name}Layout.tsx`;
        content = generateLayoutTemplate(name);
        break;
    }

    // Create directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write main file
    const filePath = path.join(targetDir, fileName);
    if (fs.existsSync(filePath)) {
      spinner.fail(`File ${filePath} already exists`);
      return;
    }
    fs.writeFileSync(filePath, content);

    // Write test file if applicable
    if (testContent) {
      const testPath = path.join(targetDir, `${name}.test.tsx`);
      fs.writeFileSync(testPath, testContent);
    }

    // Write CSS file if applicable
    if (cssContent) {
      const cssPath = path.join(targetDir, `${name}.css`);
      fs.writeFileSync(cssPath, cssContent);
    }

    spinner.succeed(`Generated ${type} ${chalk.bold(name)} at ${targetDir}`);
  } catch (error) {
    spinner.fail(`Failed to generate ${type}`);
    console.error(error);
  }
}

function generateComponentTemplate(name: string): string {
  return `import React from 'react';
import './${name}.css';

export interface ${name}Props {
  children?: React.ReactNode;
}

export const ${name}: React.FC<${name}Props> = ({ children }) => {
  return (
    <div className="${name.toLowerCase()}-container">
      <h1>${name}</h1>
      {children}
    </div>
  );
};
`;
}

function generateTestTemplate(name: string): string {
  return `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders correctly', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });
});
`;
}

function generateCssTemplate(name: string): string {
  return `.${name.toLowerCase()}-container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}
`;
}

function generateHookTemplate(name: string): string {
  return `import { useState, useEffect } from 'react';

export function ${name}() {
  const [value, setValue] = useState(null);

  useEffect(() => {
    // TODO: Implement hook logic
  }, []);

  return value;
}
`;
}

function generateContextTemplate(name: string): string {
  return `import React, { createContext, useContext, useState } from 'react';

interface ${name}ContextType {
  // TODO: Define context shape
}

const ${name}Context = createContext<${name}ContextType | undefined>(undefined);

export function ${name}Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(null);

  return (
    <${name}Context.Provider value={{}}>
      {children}
    </${name}Context.Provider>
  );
}

export function use${name}() {
  const context = useContext(${name}Context);
  if (context === undefined) {
    throw new Error('use${name} must be used within a ${name}Provider');
  }
  return context;
}
`;
}

function generatePageTemplate(name: string): string {
  return `import React from 'react';

export const ${name}Page: React.FC = () => {
  return (
    <div className="page-container">
      <h1>${name} Page</h1>
    </div>
  );
};
`;
}

function generateLayoutTemplate(name: string): string {
  return `import React from 'react';
import { Outlet } from 'react-router-dom';

export const ${name}Layout: React.FC = () => {
  return (
    <div className="layout-container">
      <header>Header</header>
      <main>
        <Outlet />
      </main>
      <footer>Footer</footer>
    </div>
  );
};
`;
}

