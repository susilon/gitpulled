async function init() {
  const res = await fetch('/api/auth/status');
  const data = await res.json();

  if (!data.loggedIn || !data.admin) {
    window.location.href = '/dashboard.html';
    return;
  }
}

async function createAccount() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const msgEl = document.getElementById('msg');

  msgEl.textContent = '';
  msgEl.className = 'error';

  if (!username || !password) {
    msgEl.textContent = 'Please fill in all fields';
    return;
  }

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.success) {
    msgEl.textContent = 'Account created successfully';
    msgEl.className = 'success';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
  } else {
    msgEl.textContent = data.error || 'Failed to create account';
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/index.html';
}

document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') createAccount();
});

init();
