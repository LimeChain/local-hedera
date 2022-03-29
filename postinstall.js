const shell = require('shelljs');
const fs = require('fs');

if (!fs.existsSync('./hedera-network-e2e')) {
  shell.exec('git clone git@github.com:hashgraph/hedera-network-e2e.git');
}

shell.cd('./hedera-network-e2e');
shell.exec('git reset --hard HEAD');
shell.exec('sed -i \'s/JAVA_OPTS/#JAVA_OPTS/\' .env');
shell.exec('docker-compose build');