const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const logs = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  try {
    console.log('🔍 Checking dashboard overview page...');
    
    // Navigate to the page
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    // Wait for key elements
    await page.waitForSelector('h1:has-text("Dashboard Overview")', { timeout: 5000 });
    console.log('✅ Dashboard title found');
    
    // Check for KPI cards
    const kpiCards = await page.$$('.metric-card');
    console.log(`✅ Found ${kpiCards.length} KPI cards`);
    
    // Check for filter controls
    const timeRangeSelect = await page.$('select[value="today"]');
    if (timeRangeSelect) {
      console.log('✅ Time range filter found');
    }
    
    // Check for AI insights panel
    const aiPanel = await page.$('text=AI INSIGHTS & RECOMMENDATIONS');
    if (aiPanel) {
      console.log('✅ AI Insights panel found');
    }
    
    // Check for navigation cards
    const navCards = await page.$$('h4:has-text("TRENDS"), h4:has-text("PRODUCTS"), h4:has-text("BEHAVIOR"), h4:has-text("PROFILES")');
    console.log(`✅ Found ${navCards.length} navigation cards`);
    
    // Take a screenshot
    await page.screenshot({ path: 'dashboard-overview.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-overview.png');
    
    if (errors.length > 0) {
      console.error('❌ Console errors found:');
      errors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    } else {
      console.log('✅ No console errors detected');
      console.log('🎉 Dashboard Overview page is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();