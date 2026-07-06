async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('error-msg');

  errorEl.textContent = '';

  if (!username || !password) {
    errorEl.textContent = 'Please fill in all fields';
    return;
  }

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.success) {
    window.location.href = '/dashboard.html';
  } else {
    errorEl.textContent = data.error || 'Login failed';
  }
}

document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});
