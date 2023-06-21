# Page Speed Check

This is a simple node script that checks the Google Page Speed Insights score of your webpage automatically / periodically. Uses the Google Page Speed Insights API. 

## Prerequisites

- Node.js
- npm

## Installation

1. Clone the repository or download the zip file and extract it.

   ```bash
   git clone {repository URL}
   ```

2. Navigate to the project directory.

   ```bash
   cd {project directory}
   ```

3. Install the dependencies.

   ```bash
   npm install
   ```

## Setup

1. This application requires an API key from Google's PageSpeed Insights API. You can get your API key by following the steps outlined in the [Google's API Documentation](https://developers.google.com/speed/docs/insights/v5/get-started).

2. Once you have your API key, create a `.env` file in the root of the project directory. Then, add your API key to this file as follows:

   ```bash
   API_KEY={your API key}
   ```

## Usage

1. To run the script, provide a URL to test. For example:

   ```bash
   npm start -- mysite.com
   ```

2. By default, the script tests the mobile strategy. If you want to test the desktop strategy or both, use the 2nd arg
   ```bash
   npm start -- mysite.com mobile
   or
   npm start -- mysite.com desktop
   or
   npm start -- mysite.com both
   ```

3. If you want just the score and no metrics add none as the 3rd arg
   ```bash
   npm start -- mysite.com mobile none
   ```

4. The script runs once and then every minute (or however frequently you set the `freqency` variable to).

5. Data is saved as json to the /data directory

## Troubleshooting

If you encounter any issues, please ensure that:

- You have provided a valid API key.
- You have provided a valid URL to test.
- Your system meets all prerequisites.
  
## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.