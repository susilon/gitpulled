async function init() {
  const res = await fetch('/api/auth/status');
  const data = await res.json();

  if (!data.loggedIn) {
    window.location.href = '/index.html';
    return;
  }

  loadSettings();
}

async function loadSettings() {
  const res = await fetch('/api/settings');
  const data = await res.json();

  if (data.hasToken) {
    document.getElementById('github-token').placeholder = 'Token saved (••••••••)';
  }
}

async function saveToken() {
  const token = document.getElementById('github-token').value;
  const msgEl = document.getElementById('msg');

  msgEl.textContent = '';

  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ githubToken: token })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire('Saved', 'GitHub token updated', 'success');
    document.getElementById('github-token').value = '';
    document.getElementById('github-token').placeholder = 'Token saved (••••••••)';
  } else {
    msgEl.textContent = data.error || 'Failed to save';
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/index.html';
}

init();
