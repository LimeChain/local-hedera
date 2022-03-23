#!/usr/bin/env node
const shell = require('shelljs');
const hethers = require('@hashgraph/hethers');
const HederaSDK = require('@hashgraph/sdk');
const childProcess = require('child_process');
const fs = require('fs');
const [, , ...commands] = process.argv;

async function init() {
  if (!commands.length) {
    console.log(`
Local Hedera Plugin - Runs consensus and mirror nodes on localhost

Available commands:
    start - Starts the local hedera network.
    stop - Stops the local hedera network.
    reset - Delete all the existing data and starts the network.
    generate-accounts <n> - Generates N accounts, default 5.
  `);

    process.exit();
  }

  switch (commands[0]) {
    case 'start': {
      start();
      break;
    }
    case 'stop': {
      stop();
      break;
    }
    case 'reset': {
      reset();
      await generateAccounts();
      break;
    }
    case 'generate-accounts': {
      await generateAccounts(commands[1] || 10);
      break;
    }
    default: {
      console.log(`Undefined command. Check available commands at "npx local-hedera"`);
    }
  }

  function start() {
    runPinger();
    shell.cd(__dirname + '/hedera-network-e2e');
    shell.exec('docker-compose up -d');
    shell.cd('../');
  }

  function stop() {
    stopPinger();
    shell.cd(__dirname + '/hedera-network-e2e');
    shell.exec('docker-compose stop');
    shell.cd('../');
  }

  function reset() {
    stopPinger();
    shell.cd(__dirname + '/hedera-network-e2e');
    shell.exec('docker-compose down -v');
    shell.exec(`git clean -xfd`);
    shell.exec(`docker-compose up --build -d`);
    runPinger();
    shell.cd('../');
  }

  function runPinger() {
    stopPinger();
    const pingerProcess = childProcess.spawn('node', [__dirname + '/pinger.js'], {detached: true});

    fs.writeFileSync(__dirname + '/pid', pingerProcess.pid + '');
  }

  function stopPinger() {
    const pidFilePath = __dirname + '/pid';
    if (fs.existsSync(pidFilePath)) {
      try {
        process.kill(fs.readFileSync(pidFilePath));
        fs.unlinkSync(pidFilePath);
      } catch (e) {
        // the process doesn't exist
      }
    }
  }

  async function generateAccounts(num = 10) {
    const client = HederaSDK.Client
        .forNetwork({
          '127.0.0.1:50211': '0.0.3'
        })
        .setOperator('0.0.2', '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137');

    let accountsString = '';
    for (let i = 0; i < num; i++) {
      const randomWallet = hethers.Wallet.createRandom();
      const tx = await new HederaSDK.AccountCreateTransaction()
          .setKey(HederaSDK.PublicKey.fromString(randomWallet._signingKey().compressedPublicKey))
          .setInitialBalance(HederaSDK.Hbar.fromTinybars(100000000000))
          .execute(client);
      const getReceipt = await tx.getReceipt(client);

      accountsString += `${getReceipt.accountId.toString()} - ${randomWallet._signingKey().privateKey}\n`;
    }

    console.log(`${accountsString}Total: ${num}`);
  }

  process.exit();
}

init();