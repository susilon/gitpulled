const simpleGit = require('simple-git');
const path = require('path');

const logs = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}`;
  logs.push(entry);
  if (logs.length > 1000) logs.shift();
  console.log(entry);
}

async function triggerGitOperations(folderPath, sourceBranch, targetBranch) {
  const git = simpleGit(folderPath);
  const result = { success: false, steps: [], error: null };

  try {
    log(`Starting git operations on ${folderPath}`);

    log('Fetching from origin...');
    await git.fetch('origin');
    result.steps.push('fetch');

    log(`Checking out target branch: ${targetBranch}`);
    await git.checkout(targetBranch);
    result.steps.push(`checkout ${targetBranch}`);

    log(`Merging origin/${sourceBranch} into ${targetBranch}`);
    await git.merge([`origin/${sourceBranch}`]);
    result.steps.push(`merge origin/${sourceBranch}`);

    result.success = true;
    log('Git operations completed successfully');
  } catch (err) {
    result.error = err.message;
    log(`Error: ${err.message}`);

    try {
      await git.merge(['--abort']);
    } catch (_) {}
  }

  return result;
}

function getLogs() {
  return logs;
}

module.exports = { triggerGitOperations, getLogs };
