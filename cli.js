#!/usr/bin/env node
const [, , ...commands] = process.argv;
const shell = require('shelljs');
const CliHelper = require('./src/cliHelper');
const HederaUtils = require('./src/hederaUtils');
const PingerHelper = require('./src/pingerHelper');

(async function () {
  if (!commands.length) {
    console.log(`
Local Hedera Plugin - Runs consensus and mirror nodes on localhost:
- consensus node url - 127.0.0.1:50211
- node id - 0.0.3
- mirror node url - http://127.0.0.1:5551

Available commands:
    start - Starts the local hedera network.
    stop - Stops the local hedera network and delete all the existing data.
    restart - Restart the local hedera network.
    generate-accounts <n> - Generates N accounts, default 10.
  `);

    process.exit();
  }

  switch (commands[0]) {
    case 'start': {
      await start(commands);
      break;
    }
    case 'stop': {
      await stop(commands);
      break;
    }
    case 'restart': {
      await stop(commands);
      await start(commands);
      break;
    }
    case 'generate-accounts': {
      await HederaUtils.generateAccounts(commands[1] || 10);
      break;
    }
    default: {
      console.log(`Undefined command. Check available commands at "npx local-hedera"`);
    }
  }

  async function start(commands) {
    console.log('Starting the docker images...');
    shell.cd(__dirname + '/hedera-network-e2e');
    shell.exec('docker-compose up -d 2>/dev/null');
    shell.cd('../');
    await CliHelper.waitForFiringUp(5600);
    console.log('Starting the pinger...');
    PingerHelper.run();
    console.log('Generating accounts...');
    await HederaUtils.generateAccounts(CliHelper.getArgValue(commands, 'accounts', 10), true);
  }

  async function stop() {
    console.log('Stopping the pinger...');
    PingerHelper.stop();
    shell.cd(__dirname + '/hedera-network-e2e');
    console.log('Stopping the docker images...');
    shell.exec('docker-compose down -v 2>/dev/null');
    console.log('Cleaning the volumes and temp files...')
    shell.exec(`git clean -xfd 2>/dev/null`);
    shell.exec('sed -i \'s/JAVA_OPTS/#JAVA_OPTS/\' .env');
    shell.cd('../');
  }

  process.exit();
})();