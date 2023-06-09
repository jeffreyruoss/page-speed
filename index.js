require('dotenv').config();
const fetch = require('cross-fetch');
const chalk = require('chalk');
const fs = require('fs');

const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Create data directory if it does not exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

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

const currentDate = new Date();
const dateStr = `${currentDate.getMonth()+1}-${currentDate.getDate()}-${currentDate.getFullYear()}`;
const jsonFilename = path.join(DATA_DIR, `${dateStr}_${DOMAIN}.json`);


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

  let output = {};

  console.log(strategy.toUpperCase());
  output["Page Speed Score: "] = data.lighthouseResult.categories.performance.score * 100;

  if (METRICS === 'default') {
    displayMetrics(data, output);
  }

  // for the values of output, remove non-numeric characters and convert to number
  for (let key in output) {
    if (typeof output[key] === 'string') { // check if the value is a string
      output[key] = parseFloat(output[key].replace(/[^0-9.]/g, ''));
    }
  }

  console.table(output);

  try {
    // Check if file exists
    if (!fs.existsSync(jsonFilename)) {
      // If file does not exist, create it with the output as the first element of an array
      fs.writeFileSync(jsonFilename, JSON.stringify({[strategy]: [output]}, null, 2));
    } else {
      const fileContent = JSON.parse(fs.readFileSync(jsonFilename));
      // If the strategy does not exist in the file content, add it
      if (!fileContent[strategy]) {
        fileContent[strategy] = [output];
      } else {
        // If the strategy exists, append the output to its array
        fileContent[strategy].push(output);
      }
      fs.writeFileSync(jsonFilename, JSON.stringify(fileContent, null, 2));
    }
  } catch (error) {
    console.error(chalk.red('Error writing to file:', jsonFilename));
    console.error(error);
  }
  
}

function displayMetrics(data, output) {
  output["First Contentful Paint: "] = data.lighthouseResult.audits['first-contentful-paint'].displayValue;
  output["Total Blocking Time: "] = data.lighthouseResult.audits['total-blocking-time'].displayValue;
  output["Largest Contentful Paint: "] = data.lighthouseResult.audits['largest-contentful-paint'].displayValue;
  output["Speed Index: "] = data.lighthouseResult.audits['speed-index'].displayValue;
  output["Cumulative Layout Shift: "] = data.lighthouseResult.audits['cumulative-layout-shift'].displayValue;

  // console.log('Metrics:');
  // for (let metric in metrics) {
    // console.log(metric + ': ' + metrics[metric]);
  // }
  // console.table(metrics);
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