const fs = require('fs');
const childProcess = require('child_process');

module.exports = class PingerHelper {
  static run() {
    this.stop();
    const pingerProcess = childProcess.spawn('node', ['../pinger.js'], {detached: true});

    fs.writeFileSync('../pid', pingerProcess.pid + '');
  }

  static stop() {
    const pidFilePath = '../pid';
    if (fs.existsSync(pidFilePath)) {
      try {
        process.kill(fs.readFileSync(pidFilePath));
        fs.unlinkSync(pidFilePath);
      } catch (e) {
        // the process doesn't exist
      }
    }
  }
}