const { exec } = require('child_process');

function log(message) {
  console.log(`[Docker] ${message}`);
}

function dockerComposeUp(folderPath, containerName) {
  return new Promise((resolve, reject) => {
    const cmd = `cd ${folderPath} && docker-compose down && docker-compose up -d --build`;
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

function dockerRestart(containerName) {
  return new Promise((resolve, reject) => {
    const cmd = `docker restart ${containerName}`;
    log(`Running: ${cmd}`);

    exec(cmd, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`);
        return reject(error);
      }
      log(`Output: ${stdout}`);
      resolve({ stdout, stderr });
    });
  });
}

function dockerRebuild(folderPath, composeFile) {
  return new Promise((resolve, reject) => {
    const file = composeFile || 'docker-compose.yml';
    const cmd = `cd ${folderPath} && docker-compose -f ${file} down && docker-compose -f ${file} up -d --build`;
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

module.exports = { dockerComposeUp, dockerRestart, dockerRebuild };
