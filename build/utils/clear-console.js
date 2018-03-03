const preventClearConsole = process.argv.includes('--no-console-clear')
export default function clearConsole() {
  if (!preventClearConsole) {
    process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H')
  }
}
