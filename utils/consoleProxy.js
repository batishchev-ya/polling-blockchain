
const overrideConsoleWithTimestamp = function () {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  function logWithTimestamp(method, args) {
      const now = new Date().toISOString(); 
      let timestampedArgs = [`[${now}]`, ...args]; 
      method.apply(console, timestampedArgs); 
  }

  console.log = (...args) => logWithTimestamp(originalConsoleLog, args);
  console.error = (...args) => logWithTimestamp(originalConsoleError, args);
  console.warn = (...args) => logWithTimestamp(originalConsoleWarn, args);
  console.info = (...args) => logWithTimestamp(originalConsoleInfo, args);
}

module.exports = {
  overrideConsoleWithTimestamp
};