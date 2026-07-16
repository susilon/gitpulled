const { exec } = require('child_process');

function log(message) {
  console.log(`[Docker] ${message}`);
}

function dockerCompose(folderPath, composeFile, action) {
  return new Promise((resolve, reject) => {
    const file = composeFile || 'docker-compose.yml';
    const withBuild = action === 'rebuild' ? ' --build' : '';
    const cmd = `cd ${folderPath} && docker-compose -f ${file} down && docker-compose -f ${file} up -d${withBuild}`;
    log(`Running: ${cmd}`);

    exec(cmd, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`);
        return reject(error);
      }
      log(`Output: ${stdout}`);
      if (stderr) log(`Stderr: ${stderr}`);
      resolve({ stdout, stderr });
    });
  });
}

module.exports = { dockerCompose };
