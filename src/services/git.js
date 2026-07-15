const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const logs = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}`;
  logs.push(entry);
  if (logs.length > 1000) logs.shift();
  console.log(entry);
}

function getGithubToken() {
  const settingsFile = path.join(__dirname, '../../data/settings.json');
  if (!fs.existsSync(settingsFile)) return null;
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  return settings.githubToken || null;
}

function getTokenUrl(url) {
  const token = getGithubToken();
  if (!token || !url) return url;
  if (url.startsWith('https://')) {
    return url.replace('https://', `https://${token}@`);
  }
  return url;
}

async function triggerGitOperations(folderPath, sourceBranch, targetBranch, gitUrl) {
  const result = { success: false, steps: [], logs: [], error: null };

  try {
    log(`Starting git operations on ${folderPath}`);

    const isGitRepo = fs.existsSync(path.join(folderPath, '.git'));

    if (!isGitRepo) {
      if (!gitUrl) {
        result.error = 'Directory does not exist and no git URL configured';
        log('Error: Directory is not a git repo and no git URL provided');
        return result;
      }

      log(`Directory is not a git repo. Cloning from ${gitUrl}...`);

      const parentDir = path.dirname(folderPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const authUrl = getTokenUrl(gitUrl);
      await simpleGit(parentDir).clone(authUrl, path.basename(folderPath));
      result.steps.push('clone');
      log('Clone complete');
    }

    const git = simpleGit(folderPath);

    const token = getGithubToken();
    if (token) {
      log('Using token authentication for fetch');
      await git.remote(['set-url', 'origin', getTokenUrl(await getRemoteUrl(git))]);
    }

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
      const git = simpleGit(folderPath);
      await git.merge(['--abort']);
    } catch (_) {}
  }

  result.logs = logs.slice(-20);
  return result;
}

async function getRemoteUrl(git) {
  const remotes = await git.remote(['get-url', 'origin']);
  return remotes.trim();
}

function getLogs() {
  return logs;
}

module.exports = { triggerGitOperations, getLogs };
