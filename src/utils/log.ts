const old_console = console.log;

console.log = (...args) =>
  old_console(`${new Date().toISOString()}: `, ...args);
