const shell = require('shelljs');
const fs = require('fs');

if (!fs.existsSync('./hedera-local-node')) {
  shell.exec('git clone git@github.com:hashgraph/hedera-local-node.git');
}

shell.cd('./hedera-local-node');
shell.exec('git reset --hard HEAD');
shell.exec('sed -i \'s/JAVA_OPTS/#JAVA_OPTS/\' .env');
shell.exec('docker-compose build');