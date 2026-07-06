async function init() {
  const res = await fetch('/api/auth/status');
  const data = await res.json();

  if (!data.loggedIn || !data.admin) {
    window.location.href = '/dashboard.html';
    return;
  }

  loadAccounts();
}

async function loadAccounts() {
  const res = await fetch('/api/auth/accounts');
  const accounts = await res.json();
  const el = document.getElementById('accounts-list');

  if (accounts.length === 0) {
    el.innerHTML = '<p>No accounts found.</p>';
    return;
  }

  el.innerHTML = accounts.map(a => `
    <div class="project-item">
      <h3>${esc(a.username)}</h3>
      <div class="project-detail">${a.admin ? 'Admin' : 'User'}</div>
      <div class="project-detail">Created: ${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'}</div>
      <div class="project-actions">
        ${!a.admin ? `<button class="btn btn-sm btn-danger" onclick="deleteAccount('${esc(a.username)}')">Delete</button>` : ''}
      </div>
    </div>
  `).join('');
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
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
    loadAccounts();
  } else {
    msgEl.textContent = data.error || 'Failed to create account';
  }
}

async function deleteAccount(username) {
  const result = await Swal.fire({
    title: 'Delete Account?',
    text: `Delete user "${username}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e94560',
    confirmButtonText: 'Delete'
  });

  if (result.isConfirmed) {
    await fetch(`/api/auth/accounts/${username}`, { method: 'DELETE' });
    loadAccounts();
    Swal.fire('Deleted', 'Account deleted', 'success');
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
