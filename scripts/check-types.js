#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function checkTypes() {
  // Allow skipping type checks for CI/deploys when explicitly requested
  if (process.env.SKIP_TYPECHECK === '1' || process.env.SKIP_TYPECHECK === 'true') {
    console.log('⏭️  Skipping TypeScript type checking (SKIP_TYPECHECK set)\n');
    return true;
  }
  console.log('🔍 Running TypeScript type checking...\n');
  
  try {
    // Run TypeScript compiler in no-emit mode to just check types
    const { stdout, stderr } = await execAsync('npx tsc --noEmit');
    
    if (stdout) {
      console.log(stdout);
    }
    
    console.log('✅ No TypeScript errors found!\n');
    return true;
  } catch (error) {
    console.error('❌ TypeScript errors found:\n');
    console.error(error.stdout || error.message);
    
    // Parse the error to provide helpful suggestions
    if (error.stdout) {
      const errors = error.stdout.toString();
      
      if (errors.includes("implicitly has type 'any'")) {
        console.log('\n💡 Tip: Add explicit type annotations to variables:');
        console.log('   let collections: any[] = [];');
        console.log('   let data: Record<string, any> = {};');
      }
      
      if (errors.includes("is possibly 'null'") || errors.includes("is possibly 'undefined'")) {
        console.log('\n💡 Tip: Use optional chaining or null checks:');
        console.log('   value?.property');
        console.log('   value || defaultValue');
      }
      
      if (errors.includes("Cannot find name")) {
        console.log('\n💡 Tip: Make sure all variables are defined before use');
        console.log('   Check for typos in variable names');
      }
      
      if (errors.includes("No index signature")) {
        console.log('\n💡 Tip: Use type assertion or proper typing:');
        console.log('   (obj as any)[key]');
        console.log('   obj as Record<string, any>');
      }
    }
    
    return false;
  }
}

async function checkLinting() {
  console.log('🔍 Running ESLint checks...\n');
  
  try {
    const { stdout } = await execAsync('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0');
    console.log('✅ No linting issues found!\n');
    return true;
  } catch (error) {
    // ESLint returns non-zero exit code when there are issues
    if (error.stdout) {
      console.log('⚠️  Linting issues found:\n');
      console.log(error.stdout);
    }
    return false;
  }
}

async function main() {
  console.log('=================================');
  console.log('Pre-Build Type & Lint Checking');
  console.log('=================================\n');
  
  let success = true;
  
  // Check TypeScript types
  const typesOk = await checkTypes();
  if (!typesOk) success = false;
  
  // Check linting (optional, can be commented out if no ESLint config)
  // const lintOk = await checkLinting();
  // if (!lintOk) success = false;
  
  if (success) {
    console.log('=================================');
    console.log('✅ All checks passed!');
    console.log('=================================');
    process.exit(0);
  } else {
    console.log('=================================');
    console.log('❌ Some checks failed. Please fix the issues above.');
    console.log('=================================');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error running checks:', error);
  process.exit(1);
});
