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
  const result = { success: false, steps: [], logs: [], error: null };

  try {
    log(`Starting git operations on ${folderPath}`);

    log('Fetching from origin...');
    const fetchResult = await git.fetch('origin');
    result.steps.push('fetch');
    log(`Fetch complete. Output: ${JSON.stringify(fetchResult.summary || 'ok')}`);

    log(`Current branch before checkout...`);
    const statusBefore = await git.status();
    log(`Current branch: ${statusBefore.current}`);

    log(`Checking out target branch: ${targetBranch}`);
    await git.checkout(targetBranch);
    result.steps.push(`checkout ${targetBranch}`);

    log(`Merging origin/${sourceBranch} into ${targetBranch}`);
    const mergeResult = await git.merge([`origin/${sourceBranch}`]);
    result.steps.push(`merge origin/${sourceBranch}`);
    log(`Merge result: ${JSON.stringify(mergeResult)}`);

    log(`Status after merge...`);
    const statusAfter = await git.status();
    log(`Branch: ${statusAfter.current}, ahead: ${statusAfter.ahead}, behind: ${statusAfter.behind}, dirty: ${statusAfter.isClean()}`);
    result.status = {
      branch: statusAfter.current,
      ahead: statusAfter.ahead,
      behind: statusAfter.behind,
      clean: statusAfter.isClean()
    };

    result.success = true;
    log('Git operations completed successfully');
  } catch (err) {
    result.error = err.message;
    log(`Error: ${err.message}`);

    try {
      await git.merge(['--abort']);
    } catch (_) {}
  }

  result.logs = logs.slice(-20);
  return result;
}

function getLogs() {
  return logs;
}

module.exports = { triggerGitOperations, getLogs };
