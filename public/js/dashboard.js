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

  el.innerHTML = projects.map(p => {
    const dockerLabel = p.dockerAction === 'rebuild' ? 'Docker: Rebuild' :
                        p.dockerAction === 'restart' ? 'Docker: Restart' : '';
    return `
    <div class="project-item">
      <h3>${esc(p.name)}</h3>
      <div class="project-detail">Folder: ${esc(p.folderPath)}</div>
      <div class="project-detail">Source: ${esc(p.sourceBranch)} → Target: ${esc(p.targetBranch)}</div>
      ${dockerLabel ? `<div class="project-detail">${dockerLabel}</div>` : ''}
      <div class="project-detail">Webhook: <span class="webhook-token">${esc(p.webhookToken)}</span></div>
      <div class="project-actions">
        <button class="btn btn-sm" onclick="triggerProject('${p.id}')">Trigger</button>
        <button class="btn btn-sm btn-secondary" onclick="editProject('${p.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProject('${p.id}')">Delete</button>
      </div>
    </div>
  `}).join('');
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function showProjectForm(project = null) {
  const isEdit = project !== null;
  const currentAction = isEdit ? (project.dockerAction || 'none') : 'none';
  const html = `
    <div class="swal-form-row">
      <div class="swal-form-group">
        <label>Project Name</label>
        <input type="text" id="swal-proj-name" class="swal2-input" placeholder="My Project" value="${isEdit ? esc(project.name) : ''}">
      </div>
      <div class="swal-form-group">
        <label>Folder Path</label>
        <input type="text" id="swal-proj-folder" class="swal2-input" placeholder="/path/to/repo" value="${isEdit ? esc(project.folderPath) : ''}">
      </div>
    </div>
    <div class="swal-form-row">
      <div class="swal-form-group">
        <label>Source Branch</label>
        <input type="text" id="swal-proj-source" class="swal2-input" placeholder="main" value="${isEdit ? esc(project.sourceBranch) : ''}">
      </div>
      <div class="swal-form-group">
        <label>Target Branch</label>
        <input type="text" id="swal-proj-target" class="swal2-input" placeholder="develop" value="${isEdit ? esc(project.targetBranch) : ''}">
      </div>
    </div>
    <div class="swal-form-row">
      <div class="swal-form-group">
        <label>Git URL (for auto-clone if folder missing)</label>
        <input type="text" id="swal-proj-giturl" class="swal2-input" placeholder="https://github.com/user/repo.git" value="${isEdit ? esc(project.gitUrl || '') : ''}">
      </div>
    </div>
    <div class="swal-form-row">
      <div class="swal-form-group" style="flex:2">
        <label>Compose File</label>
        <input type="text" id="swal-proj-compose" class="swal2-input" placeholder="docker-compose.yml" value="${isEdit ? esc(project.composeFile || 'docker-compose.yml') : 'docker-compose.yml'}">
      </div>
      <div class="swal-form-group" style="flex:1">
        <label>Docker Action</label>
        <select id="swal-proj-docker" class="swal2-select">
          <option value="none" ${currentAction === 'none' ? 'selected' : ''}>None</option>
          <option value="restart" ${currentAction === 'restart' ? 'selected' : ''}>Restart</option>
          <option value="rebuild" ${currentAction === 'rebuild' ? 'selected' : ''}>Rebuild</option>
        </select>
      </div>
    </div>
  `;

  Swal.fire({
    title: isEdit ? 'Edit Project' : 'Add Project',
    html: html,
    showCancelButton: true,
    confirmButtonText: 'Save',
    customClass: 'swal-popup-wide',
    preConfirm: () => {
      const popup = Swal.getPopup();
      const name = popup.querySelector('#swal-proj-name').value;
      const folderPath = popup.querySelector('#swal-proj-folder').value;
      const sourceBranch = popup.querySelector('#swal-proj-source').value;
      const targetBranch = popup.querySelector('#swal-proj-target').value;

      if (!name || !folderPath || !sourceBranch || !targetBranch) {
        Swal.showValidationMessage('All fields are required');
        return false;
      }

      return {
        name,
        folderPath,
        sourceBranch,
        targetBranch,
        gitUrl: popup.querySelector('#swal-proj-giturl').value,
        composeFile: popup.querySelector('#swal-proj-compose').value || 'docker-compose.yml',
        dockerAction: popup.querySelector('#swal-proj-docker').value
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const payload = result.value;

      if (isEdit) {
        await fetch(`/api/projects/${project.id}`, {
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

      loadProjects();
      Swal.fire('Saved', isEdit ? 'Project updated' : 'Project added', 'success');
    }
  });
}

function showAddForm() {
  showProjectForm();
}

function editProject(id) {
  const p = projects.find(x => x.id === id);
  if (p) showProjectForm(p);
}

async function deleteProject(id) {
  const result = await Swal.fire({
    title: 'Delete Project?',
    text: 'This action cannot be undone',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e94560',
    confirmButtonText: 'Delete'
  });

  if (result.isConfirmed) {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadProjects();
    Swal.fire('Deleted', 'Project deleted', 'success');
  }
}

async function triggerProject(id) {
  Swal.fire({ title: 'Running git operations...', didOpen: () => Swal.showLoading() });

  const res = await fetch(`/api/projects/${id}/trigger`, { method: 'POST' });
  const data = await res.json();

  if (data.success) {
    let msg = 'Git operations completed';
    if (data.dockerAction === 'rebuild') msg += ' + Docker rebuild';
    else if (data.dockerAction === 'restart') msg += ' + Docker restart';
    Swal.fire('Success', msg, 'success');
  } else {
    Swal.fire('Error', data.error || 'Unknown error', 'error');
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/index.html';
}

init();
