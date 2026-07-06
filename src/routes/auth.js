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

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.admin) return next();
  return res.status(403).json({ error: 'Admin access required' });
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

  const isAdmin = account.admin || accounts[0].username === account.username;
  req.session.user = { username: account.username, admin: isAdmin };
  res.json({ success: true, username: account.username, admin: isAdmin });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/status', (req, res) => {
  if (req.session && req.session.user) {
    const accounts = loadAccounts();
    const account = accounts.find(a => a.username === req.session.user.username);
    const isAdmin = account && (account.admin || accounts[0].username === account.username);
    return res.json({
      loggedIn: true,
      username: req.session.user.username,
      admin: isAdmin
    });
  }
  res.json({ loggedIn: false });
});

router.post('/setup', (req, res) => {
  const accounts = loadAccounts();
  if (accounts.length > 0) {
    return res.status(400).json({ error: 'Admin account already exists' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  accounts.push({
    username,
    password: hashPassword(password),
    admin: true,
    createdAt: new Date().toISOString()
  });
  saveAccounts(accounts);

  req.session.user = { username, admin: true };
  res.json({ success: true, username });
});

router.post('/register', requireAuth, requireAdmin, (req, res) => {
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
    admin: false,
    createdAt: new Date().toISOString()
  });
  saveAccounts(accounts);

  res.json({ success: true, username });
});

module.exports = router;
