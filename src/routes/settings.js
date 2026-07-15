const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/settings.json');

function loadSettings() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '{}');
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveSettings(settings) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2));
}

router.use(requireAuth);

router.get('/', (req, res) => {
  const settings = loadSettings();
  res.json({
    githubToken: settings.githubToken ? '••••••••' : '',
    hasToken: !!settings.githubToken
  });
});

router.put('/', (req, res) => {
  const { githubToken } = req.body;
  const settings = loadSettings();

  if (githubToken !== undefined) {
    settings.githubToken = githubToken;
  }

  saveSettings(settings);
  res.json({ success: true });
});

module.exports = router;
