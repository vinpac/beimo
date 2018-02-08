/* eslint-disable */
const chalk = require('chalk');

module.exports = {
  logEvent: function(eventName, message, color) {
    const prefix = chalk.bold.magenta(eventName.toUpperCase())
    if (!message) {
      console.log(prefix + ' ➜ ' + chalk[color || 'yellow']('Start'));
    }

    console.log(prefix + ' ➜ ' + (color === false ? message : chalk[color || 'green'](message)))
  },

  clearConsole: function() {
    process.stdout.write(
      process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H'
    );
  }

}
