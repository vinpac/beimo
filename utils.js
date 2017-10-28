/* eslint-disable */
const chalk = require('chalk');

module.exports = {
  logEvent: function(eventName, success = true, message, styleMessage = true) {
    const statusMessage = success ? ' DONE ' : ' FAILED ';
    const chalkMessage = success ? chalk.white.bgGreen : chalk.white.bgRed;

    console.info(
      chalk.white.bgMagenta(' ' + eventName.toUpperCase() + ' ') + '' +
      (success
        ? chalkMessage(statusMessage)
        : chalk.white.bgRed(statusMessage)
      ),
      arguments.length < 3
        ? ''
        : (styleMessage ? (success ? chalk.green(message) : chalk.red(message) ) : message)
    );
  },

  clearConsole: function() {
    process.stdout.write(
      process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H'
    );
  }

}
