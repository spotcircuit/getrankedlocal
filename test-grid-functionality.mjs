#!/usr/bin/env node

/**
 * Playwright test script for grid search functionality
 */

import { chromium } from 'playwright';

const SITE_URL = 'http://localhost:3001/grid-test';
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testGridFunctionality() {
  console.log('🚀 Starting Grid Search Functionality Tests');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    permissions: ['geolocation']
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Load the page
    console.log('\n📋 Test 1: Loading Grid Test Page');
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded correctly
    const title = await page.locator('h1').textContent();
    if (title.includes('Grid Search Analysis')) {
      console.log('✅ Page loaded successfully');
    } else {
      console.log('❌ Page title not found');
    }
    
    // Wait for Google Maps to load
    console.log('⏳ Waiting for Google Maps API to load...');
    await wait(3000);
    
    // Test 2: Test "All Businesses" mode (default)
    console.log('\n📋 Test 2: Testing All Businesses Mode');
    
    // Check default mode
    const allBusinessesRadio = await page.locator('input[value="all"]');
    const isChecked = await allBusinessesRadio.isChecked();
    console.log(`   Default mode is "All Businesses": ${isChecked ? '✅' : '❌'}`);
    
    // Enter city in autocomplete
    console.log('   Entering city: Denver, CO');
    const cityInput = await page.locator('input[placeholder*="Enter a city"]');
    await cityInput.click();
    await cityInput.fill('Denver');
    await wait(1500); // Wait for autocomplete suggestions
    
    // Look for and click Denver suggestion
    const denverSuggestion = await page.locator('.pac-item', { hasText: 'Denver' }).first();
    if (await denverSuggestion.isVisible()) {
      await denverSuggestion.click();
      console.log('   ✅ Selected Denver from autocomplete');
    } else {
      console.log('   ⚠️  No autocomplete suggestions appeared');
      // Fallback: manually set city
      await cityInput.fill('Denver, CO');
    }
    
    await wait(1000);
    
    // Enter search term
    console.log('   Entering search term: medical spa');
    await page.locator('input[placeholder*="medical spa"]').fill('medical spa');
    
    // Check if Configure button is enabled
    const configButton = await page.locator('button', { hasText: 'Configure Grid Search' });
    const isEnabled = await configButton.isEnabled();
    console.log(`   Configure button enabled: ${isEnabled ? '✅' : '❌'}`);
    
    // Click Configure Grid Search
    if (isEnabled) {
      console.log('   Clicking Configure Grid Search...');
      await configButton.click();
      await wait(2000);
      
      // Check if modal opened
      const modalTitle = await page.locator('h2', { hasText: 'Configure Your Grid Search' });
      if (await modalTitle.isVisible()) {
        console.log('   ✅ Grid Configuration Modal opened');
        
        // Check map is visible
        const mapContainer = await page.locator('.bg-gray-800 > div').first();
        if (await mapContainer.isVisible()) {
          console.log('   ✅ Map preview is visible');
        }
        
        // Test grid size buttons
        console.log('   Testing grid size selector...');
        const gridSize9 = await page.locator('button', { hasText: '9×9' });
        await gridSize9.click();
        console.log('   ✅ Selected 9×9 grid');
        
        // Test radius slider
        console.log('   Testing radius slider...');
        const slider = await page.locator('input[type="range"]');
        await slider.fill('7');
        console.log('   ✅ Set radius to 7 miles');
        
        // Check summary info
        const totalPoints = await page.locator('text=/Total Points/').locator('..').textContent();
        console.log(`   Grid info: ${totalPoints}`);
        
        // Close modal
        const cancelButton = await page.locator('button', { hasText: 'Cancel' }).first();
        await cancelButton.click();
        console.log('   ✅ Closed modal');
      }
    }
    
    await wait(2000);
    
    // Test 3: Test "Target Business" mode
    console.log('\n📋 Test 3: Testing Target Business Mode');
    
    const targetRadio = await page.locator('input[value="targeted"]');
    await targetRadio.click();
    console.log('   ✅ Switched to Target Business mode');
    
    await wait(1000);
    
    // Check if autocomplete placeholder changed
    const businessInput = await page.locator('input[placeholder*="Search for a specific business"]');
    if (await businessInput.isVisible()) {
      console.log('   ✅ Business autocomplete input is visible');
      
      // Enter a business name
      console.log('   Searching for: Starbucks Denver');
      await businessInput.click();
      await businessInput.fill('Starbucks Denver');
      await wait(2000);
      
      // Try to select from autocomplete
      const starbucksSuggestion = await page.locator('.pac-item').first();
      if (await starbucksSuggestion.isVisible()) {
        await starbucksSuggestion.click();
        console.log('   ✅ Selected business from autocomplete');
      } else {
        console.log('   ⚠️  No business suggestions appeared');
      }
    }
    
    await wait(1000);
    
    // Enter search term
    await page.locator('input[placeholder*="medical spa"]').fill('coffee shop');
    
    // Try to open config modal again
    const configButton2 = await page.locator('button', { hasText: 'Configure Grid Search' });
    if (await configButton2.isEnabled()) {
      await configButton2.click();
      await wait(2000);
      
      // Check if modal shows business name
      const businessInfo = await page.locator('text=/Center:/').locator('..').textContent();
      if (businessInfo) {
        console.log(`   Modal shows center: ${businessInfo}`);
      }
      
      // Close modal
      const xButton = await page.locator('button').filter({ has: page.locator('svg') }).first();
      await xButton.click();
    }
    
    // Test 4: Test "Load from database" option
    console.log('\n📋 Test 4: Testing Database Load Option');
    
    const testDataCheckbox = await page.locator('#useTestData');
    await testDataCheckbox.check();
    console.log('   ✅ Enabled "Load from database" option');
    
    // Check if button text changed
    const loadButton = await page.locator('button', { hasText: 'Load from Database' });
    if (await loadButton.isVisible()) {
      console.log('   ✅ Button changed to "Load from Database"');
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ All Grid Functionality Tests Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for 10 seconds for inspection...');
    await wait(10000);
    
    await browser.close();
  }
}

// Run the test
testGridFunctionality().catch(console.error);