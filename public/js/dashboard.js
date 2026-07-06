let projects = [];

async function init() {
  const res = await fetch('/api/auth/status');
  const data = await res.json();

  if (!data.loggedIn) {
    window.location.href = '/index.html';
    return;
  }

  document.getElementById('username-display').textContent = data.username;
  if (data.admin) {
    document.getElementById('admin-link').style.display = 'inline-block';
  }
  loadProjects();
}

async function loadProjects() {
  const res = await fetch('/api/projects');
  projects = await res.json();
  renderProjects();
}

function renderProjects() {
  const el = document.getElementById('projects-list');

  if (projects.length === 0) {
    el.innerHTML = '<p>No projects configured yet. Click "Add Project" to get started.</p>';
    return;
  }

  el.innerHTML = projects.map(p => `
    <div class="project-item">
      <h3>${esc(p.name)}</h3>
      <div class="project-detail">Folder: ${esc(p.folderPath)}</div>
      <div class="project-detail">Source: ${esc(p.sourceBranch)} → Target: ${esc(p.targetBranch)}</div>
      <div class="project-detail">Webhook: <span class="webhook-token">${esc(p.webhookToken)}</span></div>
      <div class="project-actions">
        <button class="btn btn-sm" onclick="triggerProject('${p.id}')">Trigger</button>
        <button class="btn btn-sm btn-secondary" onclick="editProject('${p.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProject('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function showAddForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('form-title').textContent = 'Add Project';
  document.getElementById('proj-name').value = '';
  document.getElementById('proj-folder').value = '';
  document.getElementById('proj-source').value = '';
  document.getElementById('proj-target').value = '';
  document.getElementById('project-form').style.display = 'block';
}

function editProject(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;

  document.getElementById('edit-id').value = id;
  document.getElementById('form-title').textContent = 'Edit Project';
  document.getElementById('proj-name').value = p.name;
  document.getElementById('proj-folder').value = p.folderPath;
  document.getElementById('proj-source').value = p.sourceBranch;
  document.getElementById('proj-target').value = p.targetBranch;
  document.getElementById('project-form').style.display = 'block';
}

function hideForm() {
  document.getElementById('project-form').style.display = 'none';
}

async function saveProject() {
  const id = document.getElementById('edit-id').value;
  const payload = {
    name: document.getElementById('proj-name').value,
    folderPath: document.getElementById('proj-folder').value,
    sourceBranch: document.getElementById('proj-source').value,
    targetBranch: document.getElementById('proj-target').value
  };

  if (!payload.name || !payload.folderPath || !payload.sourceBranch || !payload.targetBranch) {
    showToast('All fields are required', 'error');
    return;
  }

  if (id) {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  hideForm();
  loadProjects();
  showToast(id ? 'Project updated' : 'Project added', 'success');
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;

  await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  loadProjects();
  showToast('Project deleted', 'success');
}

async function triggerProject(id) {
  showToast('Running git operations...', 'success');
  const res = await fetch(`/api/projects/${id}/trigger`, { method: 'POST' });
  const data = await res.json();

  if (data.success) {
    showToast('Git operations completed successfully', 'success');
  } else {
    showToast('Error: ' + (data.error || 'Unknown error'), 'error');
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/index.html';
}

function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

init();
