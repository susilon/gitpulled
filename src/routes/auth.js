const express = require('express');
const fs = require('fs');
const path = require('path');
const { hashPassword, verifyPassword } = require('../utils/crypto');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/accounts.json');

function loadAccounts() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveAccounts(accounts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(accounts, null, 2));
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const accounts = loadAccounts();
  const account = accounts.find(a => a.username === username);

  if (!account || !verifyPassword(password, account.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.user = { username: account.username };
  res.json({ success: true, username: account.username });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/status', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ loggedIn: true, username: req.session.user.username });
  }
  res.json({ loggedIn: false });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const accounts = loadAccounts();
  if (accounts.find(a => a.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  accounts.push({
    username,
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  });
  saveAccounts(accounts);

  req.session.user = { username };
  res.json({ success: true, username });
});

module.exports = router;
