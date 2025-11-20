import { analyzeProject } from '@reactpilot/analyzer';
import { proposeFix } from '@reactpilot/ai-engine';
import { applyPatchToCode, createPatchPreview } from '@reactpilot/patcher';
import fs from 'node:fs';
import path from 'node:path';

// Test the complete workflow
async function testFullWorkflow() {
    console.log('🔍 Step 1: Analyzing project...\n');

    // Analyze the test component
    const report = analyzeProject('./examples');

    console.log(`✅ Found ${report.issues.length} issues:`);
    console.log(`  - Errors: ${report.summary.errors}`);
    console.log(`  - Warnings: ${report.summary.warnings}`);
    console.log(`  - Info: ${report.summary.info}\n`);

    // Show a few issues
    report.issues.slice(0, 5).forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.type} at line ${issue.line}`);
        console.log(`   ${issue.suggestion}\n`);
    });

    console.log('\n🤖 Step 2: Generating AI fixes...\n');

    // Get the code
    const filePath = path.resolve('./examples/test-component.tsx');
    const code = fs.readFileSync(filePath, 'utf-8');

    // Get AI fixes
    const aiResponse = await proposeFix({
        filePath,
        code,
        instructions: 'Fix all performance and code quality issues',
        issues: report.issues.filter(i => i.file === filePath).slice(0, 10)
    });

    console.log('📝 AI Analysis:');
    console.log(aiResponse.explanation);

    if (aiResponse.suggestions) {
        console.log('\n💡 Specific Suggestions:');
        aiResponse.suggestions.forEach((s, i) => {
            console.log(`${i + 1}. ${s.issue}: ${s.fix}`);
        });
    }

    console.log('\n\n🔧 Step 3: Applying patches...\n');

    // Apply patch
    const patchResult = applyPatchToCode({
        filePath,
        originalCode: code,
        patchedCode: aiResponse.patchedCode
    });

    console.log(`Patch status: ${patchResult.applied ? '✅ Applied' : '❌ Failed'}`);
    console.log(`Summary: ${patchResult.summary}`);

    if (patchResult.diff) {
        console.log('\n📄 Diff Preview (first 500 chars):');
        console.log(patchResult.diff.substring(0, 500) + '...');
    }

    console.log('\n✨ Workflow completed successfully!');
}

testFullWorkflow().catch(console.error);
