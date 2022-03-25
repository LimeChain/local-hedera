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
Local Hedera Plugin - Runs consensus and mirror nodes on localhost:
- consensus node url - 127.0.0.1:50211
- node id - 0.0.3
- mirror node url - http://127.0.0.1:5551

Available commands:
    start - Starts the local hedera network.
    stop - Stops the local hedera network.
    reset - Delete all the existing data and starts the network.
    generate-accounts <n> - Generates N accounts, default 10.
  `);

    process.exit();
  }

  switch (commands[0]) {
    case 'start': {
      await start();
      break;
    }
    case 'stop': {
      await stop();
      break;
    }
    case 'restart': {
      await stop();
      await start();
      break;
    }
    case 'generate-accounts': {
      await generateAccounts(commands[1] || 10);
      break;
    }
    default: {
      console.log(`Undefined command. Check available commands at "npx hedera"`);
    }
  }

  async function start() {
    shell.cd(__dirname + '/hedera-network-e2e');
    shell.exec('docker-compose up -d');
    runPinger();
    await generateAccounts(10);
    shell.cd('../');
  }

  async function stop() {
    stopPinger();
    shell.cd(__dirname + '/hedera-network-e2e');
    shell.exec('docker-compose down -v');
    shell.exec(`git clean -xfd`);
    shell.exec('sed -i \'s/JAVA_OPTS/#JAVA_OPTS/\' .env');
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
          .setInitialBalance(HederaSDK.Hbar.fromTinybars(10000000000000))
          .execute(client);
      const getReceipt = await tx.getReceipt(client);

      accountsString += `${getReceipt.accountId.toString()} - ${randomWallet._signingKey().privateKey} - ${HederaSDK.Hbar.fromTinybars(10000000000000)}\n`;
    }

    console.log(`${accountsString}Total: ${num}`);
  }

  process.exit();
}

init();