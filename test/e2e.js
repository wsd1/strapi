const fs = require('fs');
const path = require('path');
const { cleanTestApp, generateTestApp, startTestApp } = require('./helpers/testAppGenerator');

const appName = 'testApp';

const databases = {
  mongo: `--dbclient=mongo --dbhost=127.0.0.1 --dbport=27017 --dbname=strapi-test-${new Date().getTime()} --dbusername= --dbpassword=`,
  postgres:
    '--dbclient=postgres --dbhost=127.0.0.1 --dbport=5432 --dbname=strapi_test --dbusername=strapi --dbpassword=strapi',
  mysql:
    '--dbclient=mysql --dbhost=127.0.0.1 --dbport=3306 --dbname=strapi-test --dbusername=root --dbpassword=root',
  sqlite: '--dbclient=sqlite --dbfile=./tmp/data.db',
};

const { runCLI: jest } = require('jest-cli/build/cli');

const test = () => {
  return new Promise(async resolve => {
    // Run setup tests to generate the app.
    await jest(
      {
        passWithNoTests: true,
        testURL: 'http://localhost/',
      },
      [process.cwd()]
    );

    const packagesPath = path.resolve(process.cwd(), 'packages');

    const packages = fs.readdirSync(packagesPath).filter(file => file.indexOf('strapi') !== -1);

    // Run tests in every packages.
    for (let i in packages) {
      await jest(
        {
          passWithNoTests: true,
          testURL: 'http://localhost/',
        },
        [path.resolve(packagesPath, packages[i])]
      );
    }

    resolve();
  });
};

const main = async () => {
  const database = process.argv.length > 2 ? process.argv.slice(2).join(' ') : databases.postgres;

  try {
    await cleanTestApp(appName);
    await generateTestApp({ appName, database });
    const testApp = await startTestApp({ appName });
    await test();

    process.kill(testApp.pid);
  } catch (error) {
    console.error(error);
  }
};

main();
