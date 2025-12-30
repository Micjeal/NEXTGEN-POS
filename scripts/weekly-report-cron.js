const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to send weekly reports
async function sendWeeklyReports() {
  try {
    console.log('Starting weekly report generation...');

    // Call the weekly report API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/weekly-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-job': 'true' // Special header to bypass auth for cron jobs
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Weekly reports sent successfully:', result);
    } else {
      console.error('Failed to send weekly reports:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error in weekly report cron:', error);
  }
}

// Schedule to run every Sunday at 9 AM
cron.schedule('0 9 * * 0', () => {
  console.log('Running weekly report cron job...');
  sendWeeklyReports();
}, {
  timezone: "Africa/Kampala" // Adjust timezone as needed
});

console.log('Weekly report cron job scheduled. Runs every Sunday at 9 AM EAT.');

// For testing, run immediately if called with --run-now
if (process.argv.includes('--run-now')) {
  console.log('Running weekly report now...');
  sendWeeklyReports();
}

// Keep the process running
process.stdin.resume();