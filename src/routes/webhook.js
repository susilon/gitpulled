const express = require('express');
const fs = require('fs');
const path = require('path');
const { triggerGitOperations } = require('../services/git');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/projects.json');

function loadProjects() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

router.post('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const projects = loadProjects();
    const project = projects.find(p => p.webhookToken === token);

    if (!project) {
      return res.status(404).json({ error: 'Invalid webhook token' });
    }

    console.log(`Webhook triggered for project: ${project.name}`);

    const result = await triggerGitOperations(
      project.folderPath,
      project.sourceBranch,
      project.targetBranch
    );

    res.json({ project: project.name, ...result });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
