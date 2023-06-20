require('dotenv').config();
const fetch = require('cross-fetch');
const chalk = require('chalk');

const URL_ARG_INDEX = 2;
const STRATEGY_ARG_INDEX = 3;
const METRICS_ARG_INDEX = 4;
const DOMAIN = process.argv[URL_ARG_INDEX];
const STRATEGY = process.argv[STRATEGY_ARG_INDEX] || 'mobile'; // defaults to 'mobile' if not provided
const METRICS = process.argv[METRICS_ARG_INDEX] || 'default'; // defaults to 'default' if not provided
const MINUTE = 60000;

if (!DOMAIN) {
  console.log(chalk.red('Please provide a URL to test'));
  console.log(chalk.red('Example: npm start -- mysite.com'));
  process.exit(1);
}

if (!DOMAIN.includes('.')) {
  console.log(chalk.red('Please provide a valid URL'));
  console.log(chalk.red(`You provided: ${DOMAIN}`));
  console.log();
  console.log(chalk.white(`Command should look like this: `));
  console.log(chalk.blue(`npm start -- mysite.com`));
  process.exit(1);
}

if (!['mobile', 'desktop', 'both'].includes(STRATEGY)) {
  console.log(chalk.red('Invalid strategy provided. It should be either "mobile", "desktop" or "both".'));
  process.exit(1);
}

if (process.argv.length > 5) {
  console.log(chalk.red('Too many arguments provided'));
  console.log();
  console.log(chalk.white(`Command should look like this: `));
  console.log(chalk.blue(`npm start -- mysite.com mobile`));
  process.exit(1);
}

const url = `https://${encodeURIComponent(DOMAIN)}`;
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

function displayFirstRunDetails(strategies, apiEndpoints, frequencyInMinutes) {
  strategies.forEach((strategy, index) => {
    console.log(chalk.gray(`Running ${strategy.toUpperCase()} Page Speed Test on:`)); 
    console.log(chalk.blue(url));
    console.log();
    console.log(chalk.gray('API Endpoint:')); 
    console.log(chalk.blue(apiEndpoints[index]));
    console.log();
  });
  console.log(chalk.gray('Checking every')); 
  console.log(chalk.blue(`${frequencyInMinutes} minutes`));
  console.log();
}

async function checkPageSpeed(strategy) {
  const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&strategy=${strategy}`;

  if (firstRun) {
    const frequencyInMinutes = MINUTE / MINUTE;
    displayFirstRunDetails([strategy], [apiEndpoint], frequencyInMinutes);
    firstRun = false;
  }

  const data = await fetchFromEndpoint(apiEndpoint);

  console.log(`${strategy.toUpperCase()} Page Speed Score: `, data.lighthouseResult.categories.performance.score * 100);
  // You can now store this score and timestamp in a database to keep track over time

  if (METRICS === 'default') {
    displayMetrics(data);
  }
}

function displayMetrics(data) {
  const metrics = {
    'First Contentful Paint': data.lighthouseResult.audits['first-contentful-paint'].displayValue,
    'Total Blocking Time': data.lighthouseResult.audits['total-blocking-time'].displayValue,
    'Largest Contentful Paint': data.lighthouseResult.audits['largest-contentful-paint'].displayValue,
    'Speed Index': data.lighthouseResult.audits['speed-index'].displayValue,
    'Cumulative Layout Shift': data.lighthouseResult.audits['cumulative-layout-shift'].displayValue
  };

  console.log('Metrics:');
  for (let metric in metrics) {
    console.log(metric + ': ' + metrics[metric]);
  }
}


if (STRATEGY === 'both') {
  // Run for both mobile and desktop if 'both' is provided as strategy
  const apiEndpointMobile = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&strategy=mobile`;
  const apiEndpointDesktop = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&strategy=desktop`;

  if (firstRun) {
    const frequencyInMinutes = MINUTE / MINUTE;
    displayFirstRunDetails(['mobile', 'desktop'], [apiEndpointMobile, apiEndpointDesktop], frequencyInMinutes);
    firstRun = false;
  }

  checkPageSpeed('mobile');
  checkPageSpeed('desktop');
  setInterval(() => {
    checkPageSpeed('mobile');
    checkPageSpeed('desktop');
  }, MINUTE);
} else {
  // Run only for the provided strategy
  const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&strategy=${STRATEGY}`;

  if (firstRun) {
    const frequencyInMinutes = MINUTE / MINUTE;
    displayFirstRunDetails([STRATEGY], [apiEndpoint], frequencyInMinutes);
    firstRun = false;
  }

  checkPageSpeed(STRATEGY);
  setInterval(checkPageSpeed, MINUTE, STRATEGY);
}