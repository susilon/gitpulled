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
      ${p.dockerRebuild ? '<div class="project-detail">Docker: Rebuild after merge</div>' : ''}
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

function showProjectForm(project = null) {
  const isEdit = project !== null;
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
      <div class="swal-form-group" style="flex:2">
        <label>Compose File (optional)</label>
        <input type="text" id="swal-proj-compose" class="swal2-input" placeholder="docker-compose.yml" value="${isEdit ? esc(project.composeFile || 'docker-compose.yml') : 'docker-compose.yml'}">
      </div>
      <div class="swal-form-group" style="flex:1; display:flex; align-items:center; gap:8px; padding-top:24px">
        <input type="checkbox" id="swal-proj-docker" ${isEdit && project.dockerRebuild ? 'checked' : ''}>
        <label for="swal-proj-docker" style="margin:0; font-size:0.9em; color:#aaa">Docker Rebuild</label>
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
        composeFile: popup.querySelector('#swal-proj-compose').value || 'docker-compose.yml',
        dockerRebuild: popup.querySelector('#swal-proj-docker').checked
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
    if (data.dockerRebuild) msg += ' + Docker rebuild';
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
