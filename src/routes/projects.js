const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { triggerGitOperations } = require('../services/git');
const { dockerRebuild } = require('../services/docker');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/projects.json');

function loadProjects() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveProjects(projects) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
}

router.use(requireAuth);

router.get('/', (req, res) => {
  const projects = loadProjects();
  res.json(projects);
});

router.post('/', (req, res) => {
  const { name, folderPath, sourceBranch, targetBranch, dockerRebuild: doDockerRebuild, composeFile } = req.body;
  if (!name || !folderPath || !sourceBranch || !targetBranch) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const projects = loadProjects();
  const project = {
    id: crypto.randomUUID(),
    name,
    folderPath,
    sourceBranch,
    targetBranch,
    dockerRebuild: doDockerRebuild || false,
    composeFile: composeFile || 'docker-compose.yml',
    webhookToken: crypto.randomBytes(16).toString('hex'),
    createdAt: new Date().toISOString()
  };

  projects.push(project);
  saveProjects(projects);
  res.json(project);
});

router.put('/:id', (req, res) => {
  const { name, folderPath, sourceBranch, targetBranch, dockerRebuild: doDockerRebuild, composeFile } = req.body;
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  projects[index] = {
    ...projects[index],
    name: name || projects[index].name,
    folderPath: folderPath || projects[index].folderPath,
    sourceBranch: sourceBranch || projects[index].sourceBranch,
    targetBranch: targetBranch || projects[index].targetBranch,
    dockerRebuild: doDockerRebuild !== undefined ? doDockerRebuild : projects[index].dockerRebuild,
    composeFile: composeFile || projects[index].composeFile
  };

  saveProjects(projects);
  res.json(projects[index]);
});

router.delete('/:id', (req, res) => {
  const projects = loadProjects();
  const filtered = projects.filter(p => p.id !== req.params.id);

  if (filtered.length === projects.length) {
    return res.status(404).json({ error: 'Project not found' });
  }

  saveProjects(filtered);
  res.json({ success: true });
});

router.post('/:id/trigger', async (req, res) => {
  try {
    const projects = loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await triggerGitOperations(
      project.folderPath,
      project.sourceBranch,
      project.targetBranch
    );

    if (result.success && project.dockerRebuild) {
      try {
        await dockerRebuild(project.folderPath, project.composeFile);
        result.dockerRebuild = true;
      } catch (dockerErr) {
        result.dockerRebuild = false;
        result.dockerError = dockerErr.message;
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Trigger error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
