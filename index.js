require('dotenv').config();
const fetch = require('cross-fetch');
const chalk = require('chalk');

const URL_ARG_INDEX = 2;
const MINUTE = 60000;
const DEFAULT_STRATEGY = 'mobile';

if (!process.argv[URL_ARG_INDEX]) {
  console.log(chalk.yellow('Please provide a URL to test'));
  console.log(chalk.yellow('Example: npm start -- mysite.com'));
  process.exit(1);
}

const url = `https://${encodeURIComponent(process.argv[URL_ARG_INDEX])}`;
const apiKey = process.env.API_KEY;
let firstRun = true;

async function fetchFromEndpoint(apiEndpoint) {
  try {
    const response = await fetch(apiEndpoint);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(chalk.red('Failed to fetch data from endpoint:', apiEndpoint));
    throw error;
  }
}

function displayFirstRunDetails(strategy, apiEndpoint, frequencyInMinutes) {
  console.log(chalk.gray(`Running ${strategy.toUpperCase()} Page Speed Test on:`)); 
  console.log(chalk.blue(url));
  console.log();
  console.log(chalk.gray('API Endpoint:')); 
  console.log(chalk.blue(apiEndpoint));
  console.log();
  console.log(chalk.gray('Checking every')); 
  console.log(chalk.blue(`${frequencyInMinutes} minutes`));
  console.log();
}

async function checkPageSpeed(strategy = DEFAULT_STRATEGY) {
  const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&strategy=${strategy}`;

  if (firstRun) {
    const frequencyInMinutes = MINUTE / MINUTE;
    displayFirstRunDetails(strategy, apiEndpoint, frequencyInMinutes);
    firstRun = false;
  }

  const data = await fetchFromEndpoint(apiEndpoint);

  console.log(`${strategy.toUpperCase()} Page Speed Score: `, data.lighthouseResult.categories.performance.score * 100);
  // You can now store this score and timestamp in a database to keep track over time
}

// First run
checkPageSpeed();

// Run periodically
setInterval(checkPageSpeed, MINUTE);
