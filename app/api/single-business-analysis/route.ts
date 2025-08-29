export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { niche, location, target_business } = body;

    if (!niche || !location || !target_business?.name) {
      return NextResponse.json(
        { error: 'Missing required fields: niche, location, target_business.name' },
        { status: 400 }
      );
    }

    console.log('🌐 Starting single business analysis:', {
      niche,
      location,
      target_business: target_business.name
    });

    // Call the Python single business orchestrator
    const result = await runSingleBusinessAnalysis(niche, location, target_business.name);

    if (result.error) {
      console.error('❌ Single business analysis failed:', result.error);
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 500 }
      );
    }

    console.log('✅ Single business analysis complete');
    return NextResponse.json({
      success: true,
      analysis: result,
      message: 'Single business analysis completed successfully'
    });

  } catch (error: any) {
    console.error('Single business API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function runSingleBusinessAnalysis(niche: string, location: string, businessName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Path to the Python orchestrator
    const scriptPath = path.join(process.cwd(), '..', 'production', 'single_business_orchestrator.py');
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3';

    console.log('🔧 Running Python orchestrator:', scriptPath);

    // Pass arguments to Python script
    const pythonProcess = spawn(pythonPath, [
      scriptPath,
      niche,
      location,
      businessName
    ], {
      cwd: path.join(process.cwd(), '..', 'production'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('Python process exit code:', code);

      if (code !== 0) {
        console.error('Python stderr:', stderr);
        resolve({
          error: 'Python process failed',
          details: stderr || stdout
        });
        return;
      }

      try {
        // Try to parse JSON output
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse Python output:', stdout);
        resolve({
          error: 'Invalid response format from Python script',
          details: stdout
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      resolve({
        error: 'Failed to execute Python script',
        details: error.message
      });
    });

    // Set timeout
    setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      resolve({
        error: 'Analysis timeout',
        details: 'Process took too long to complete'
      });
    }, 120000); // 2 minute timeout
  });
}
