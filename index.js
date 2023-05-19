require('dotenv').config();
const fetch = require('cross-fetch');
const chalk = require('chalk');

if (!process.argv[2]) {
  console.log(chalk.yellow('Please provide a URL to test'));
  console.log(chalk.yellow('Example: npm start -- mysite.com'));
  process.exit(1);
}

const url = 'https://' + encodeURIComponent(process.argv[2]);
const apiKey = process.env.API_KEY;
let firstRun = true;

async function checkPageSpeed(strategy) {
  const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&strategy=${strategy}`;

  if (firstRun) {
    console.log(chalk.gray(`Running ${strategy.toUpperCase()} Page Speed Test on:`)); 
    console.log(chalk.blue(url));
    console.log();
    console.log(chalk.gray('API Endpoint:')); 
    console.log(chalk.blue(apiEndpoint));
    console.log();
    console.log(chalk.gray('Checking every')); 
    console.log(chalk.blue(`${freqency / oneMinute} minutes`));
    console.log();
    
    firstRun = false;
  }

  try {
    const response = await fetch(apiEndpoint);
    const data = await response.json();

    console.log(`${strategy.toUpperCase()} Page Speed Score: `, data.lighthouseResult.categories.performance.score * 100);

    // You can now store this score and timestamp in a database to keep track over time
  } catch (error) {
    console.log(error);
  }
}

// Schedule the function to run daily or however frequently you want
const oneMinute = 60000;
const oneHour = oneMinute * 60;
const oneDay = oneHour * 24;
const freqency = oneMinute;

// First run
checkPageSpeed('mobile', freqency);
// checkPageSpeed('desktop');

// Run periodically
setInterval(() => {
  checkPageSpeed('mobile', freqency);
  // checkPageSpeed('desktop');
}, freqency);