// scripts/export-pdf.js
import { spawn } from 'child_process';
import puppeteer from 'puppeteer';
import http from 'http';

const PORT = 4321;
const TARGET_URL = `http://localhost:${PORT}/memoria-pdf`;
const OUTPUT_PATH = 'documentacion_gamio_editorial.pdf';

// Helper to check if local server is active
function checkServer() {
  return new Promise((resolve) => {
    http.get(TARGET_URL, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Helper to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  let serverProcess = null;
  console.log("🚀 Starting A4 PDF Editorial Generation Pipeline...");

  // 1. Check if server is already running, else start it dynamically
  const isAlreadyRunning = await checkServer();
  if (!isAlreadyRunning) {
    console.log("📡 Astro local server is not active. Starting Astro dev server dynamically...");
    serverProcess = spawn('npx', ['astro', 'dev', '--port', PORT.toString()], {
      shell: true,
      stdio: 'ignore'
    });

    // Wait until server is up and responsive (poll every 500ms up to 20 times)
    let retries = 20;
    let up = false;
    while (retries > 0 && !up) {
      await wait(1000);
      up = await checkServer();
      retries--;
      if (!up) console.log(`⏳ Waiting for Astro server... (${retries} attempts remaining)`);
    }

    if (!up) {
      console.error("❌ Error: Failed to start Astro local server dynamically.");
      serverProcess.kill();
      process.exit(1);
    }
    console.log("✅ Astro server started successfully!");
  } else {
    console.log("🔌 Detected active Astro server already running on port 4321.");
  }

  // 2. Launch Puppeteer to capture and render page
  console.log("🌐 Launching headless browser via Puppeteer...");
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
 
  console.log("📐 Setting high-resolution viewport for A4 desktop rendering...");
  await page.setViewport({
    width: 1200,
    height: 1600,
    deviceScaleFactor: 2
  });

  console.log(`🔗 Navigating to printable endpoint: ${TARGET_URL}...`);
  await page.goto(TARGET_URL, {
    waitUntil: 'networkidle0', // Wait until all images, fonts, and assets are loaded
    timeout: 60000
  });

  // 3. Compile A4 Editorial PDF
  console.log("🖨️  Rendering and compiling high-fidelity PDF document...");
  await page.pdf({
    path: OUTPUT_PATH,
    format: 'A4',
    printBackground: true, // Crucial to render dark backgrounds and neon highlights
    displayHeaderFooter: false, // Use our high-fidelity HTML footers instead of Puppeteer's basic gray text
    margin: {
      top: '0',
      bottom: '0',
      left: '0',
      right: '0'
    }
  });

  console.log("✅ PDF compilation successful!");
  console.log(`📁 Professional editorial document saved as: ${OUTPUT_PATH}`);

  // 4. Cleanup
  console.log("🧹 Closing browser and cleaning up processes...");
  await browser.close();
  
  if (serverProcess) {
    console.log("🛑 Stopping dynamically started Astro server...");
    serverProcess.kill('SIGINT');
  }

  console.log("🏁 A4 Editorial PDF export pipeline completed successfully!");
}

main().catch(err => {
  console.error("❌ An unexpected error occurred in the PDF pipeline:", err);
  process.exit(1);
});
