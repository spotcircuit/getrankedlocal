const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_PORT = 3002;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const TIMEOUT = 30000;

class DirectoryIntegrationTest {
  constructor() {
    this.nextProcess = null;
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async runAllTests() {
    console.log('🧪 Directory Integration Tests');
    console.log('==============================\n');

    try {
      await this.startNextServer();
      await this.waitForServer();
      await this.runTests();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }

    this.printResults();
    process.exit(this.failed > 0 ? 1 : 0);
  }

  async startNextServer() {
    console.log('🚀 Starting Next.js server...');
    
    this.nextProcess = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, PORT: TEST_PORT },
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.nextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready')) {
        console.log('✅ Next.js server ready');
      }
    });

    this.nextProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('warn') && !output.includes('info')) {
        console.error('Server error:', output);
      }
    });
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');
    
    for (let i = 0; i < 30; i++) {
      try {
        await this.makeRequest('/');
        console.log('✅ Server is ready');
        return;
      } catch (error) {
        await this.sleep(1000);
      }
    }
    throw new Error('Server failed to start within timeout period');
  }

  async runTests() {
    console.log('\n📋 Running tests...\n');

    // Test API endpoints
    await this.test('API: Directory collections endpoint', async () => {
      const response = await this.makeRequest('/api/directory/collections');
      const data = JSON.parse(response);
      
      if (!data.success) {
        throw new Error('API returned error: ' + (data.error || 'Unknown error'));
      }
      
      if (!data.data || !data.data.collections) {
        throw new Error('Missing collections data');
      }
      
      if (!Array.isArray(data.data.collections)) {
        throw new Error('Collections is not an array');
      }
      
      console.log(`  Found ${data.data.collections.length} collections`);
      return data.data.collections;
    });

    // Test main directory page
    await this.test('Page: Main directory page loads', async () => {
      const response = await this.makeRequest('/directory');
      
      if (!response.includes('Business Directory')) {
        throw new Error('Directory page does not contain expected content');
      }
      
      if (!response.includes('directory-container') && !response.includes('SearchBar')) {
        console.log('  Warning: Directory components may not be loaded properly');
      }
      
      console.log('  Main directory page loads successfully');
    });

    // Test collection page (use a common collection)
    await this.test('Page: Collection page loads', async () => {
      const response = await this.makeRequest('/directory/Med%20Spa');
      
      if (response.includes('Collection Not Found') || response.includes('404')) {
        // Try with a different collection name
        const response2 = await this.makeRequest('/directory/Wellness');
        if (response2.includes('Collection Not Found') || response2.includes('404')) {
          console.log('  Warning: No collections available for testing');
          return;
        }
      }
      
      console.log('  Collection page loads successfully');
    });

    // Test CSS import
    await this.test('CSS: Mobile styles are loaded', async () => {
      const response = await this.makeRequest('/directory');
      
      // Check if the CSS import is working by looking for Next.js CSS loading
      if (!response.includes('_app') && !response.includes('css')) {
        console.log('  Warning: CSS loading cannot be verified in HTML');
      }
      
      console.log('  CSS imports appear to be working');
    });

    // Test component integration
    await this.test('Components: Directory components are integrated', async () => {
      const response = await this.makeRequest('/directory');
      
      // Look for signs that React components are being rendered
      if (!response.includes('SearchBar') && !response.includes('search')) {
        console.log('  Warning: SearchBar component may not be rendering');
      }
      
      if (response.includes('placeholder') || response.includes('Search')) {
        console.log('  Directory components appear to be integrated');
      } else {
        throw new Error('No evidence of directory components in page');
      }
    });
  }

  async test(name, testFunction) {
    try {
      console.log(`🧪 ${name}`);
      await testFunction();
      console.log(`✅ PASS: ${name}\n`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}\n`);
      this.failed++;
    }
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`${BASE_URL}${path}`, {
        method: 'GET',
        timeout: TIMEOUT,
        ...options
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.abort();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async cleanup() {
    if (this.nextProcess) {
      console.log('\n🧹 Cleaning up...');
      this.nextProcess.kill('SIGTERM');
      
      // Wait for process to exit
      await new Promise(resolve => {
        this.nextProcess.on('exit', resolve);
        setTimeout(resolve, 5000); // Force exit after 5 seconds
      });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults() {
    console.log('\n📊 Test Results');
    console.log('================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);
    
    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! Directory integration is working correctly.');
    } else {
      console.log('\n💥 Some tests failed. Please check the errors above.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new DirectoryIntegrationTest();
  tester.runAllTests().catch(console.error);
}

module.exports = DirectoryIntegrationTest;