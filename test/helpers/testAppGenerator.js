const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const rimraf = require('rimraf');
const shell = require('shelljs');

const STRAPI_BIN = path.resolve('./packages/strapi/bin/strapi.js');

const cleanTestApp = appName => {
  return new Promise(async resolve => {
    rimraf(path.resolve(appName), () => {
      resolve();
    });
  });
};

const generateTestApp = ({ appName, database }) => {
  return new Promise((resolve, reject) => {
    const appCreation = spawn('node', `${STRAPI_BIN} new ${appName} --dev ${database}`.split(' '), {
      // detached: true,
    });

    appCreation.stdout.on('data', data => {
      console.log(data.toString().trim());

      if (data.includes('is ready at')) {
        process.kill(appCreation.pid);
        return resolve();
      }

      if (data.includes('Database connection has failed')) {
        process.kill(appCreation.pid);
        return reject(new Error('Database connection has failed'));
      }
    });
  });
};

const startTestApp = ({ appName }) => {
  let appStart;
  return new Promise((resolve, reject) => {
    try {
      appStart = shell.exec('strapi start', {
        async: true,
        silent: true,
        cwd: path.resolve(appName),
      });
      appStart.stdout.on('data', data => {
        if (data.includes('To shut down your server')) {
          return resolve(appStart);
        } else {
          console.log(data.trim());
        }
      });
    } catch (error) {
      console.log(error);
      if (typeof appStart !== 'undefined') {
        process.kill(appStart.pid);
      }
      return reject(error);
    }
  });
};

module.exports = {
  cleanTestApp,
  generateTestApp,
  startTestApp,
};
