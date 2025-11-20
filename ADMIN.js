// admin-firebase.js — realtime admin UI using Firebase Realtime Database (compat)
// Assumes firebase-config.js has already initialized firebase

const dbRef = firebase.database().ref('inventory');

// Helpers
function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateDashboardCounts(items) {
  const total = items.length;
  const low = items.filter(i => (Number(i.threshold) || 0) > 0 && Number(i.qty || 0) < Number(i.threshold || 0)).length;
  const pending = items.filter(i => (i.status || '').toLowerCase() === 'pending').length;
  document.getElementById('totalItems').innerText = total;
  document.getElementById('lowStock').innerText = low;
  document.getElementById('pendingCount').innerText = pending;
}

function render(items) {
  const tbody = document.getElementById('inventory-body');
  tbody.innerHTML = '';

  items.forEach((item) => {
    const tr = document.createElement('tr');
    const qty = Number(item.qty || 0);
    const threshold = Number(item.threshold || 0);
    if (threshold > 0 && qty < threshold) tr.classList.add('low-stock');

    const statusText = item.status || 'Active';

    tr.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category || '')}</td>
      <td>${escapeHtml(item.unit || '')}</td>
      <td>${qty}</td>
      <td>${threshold}</td>
      <td>${escapeHtml(item.location || '')}</td>
      <td>${escapeHtml(item.supplier || '')}</td>
      <td class="${(statusText).toLowerCase()}">${escapeHtml(statusText)}</td>
      <td>
        <button class="btn" onclick="openEdit('${item._id}')">Edit</button>
        <button class="btn" onclick="removeItem('${item._id}')">Delete</button>
        ${ (statusText.toLowerCase() === 'pending') ? `<button class="btn" onclick="approveItem('${item._id}')">Approve</button>
        <button class="btn" onclick="denyItem('${item._id}')">Deny</button>` : '' }
      </td>
    `;

    tbody.appendChild(tr);
  });

  updateDashboardCounts(items);
}

// Listen for realtime updates
dbRef.on('value', snapshot => {
  const data = snapshot.val() || {};
  // convert to array with _id
  const items = Object.keys(data).map(k => ({ _id: k, ...data[k] }));
  render(items);
});

// Add or update item (save button)
document.getElementById('saveItemBtn').addEventListener('click', () => {
  const modal = document.getElementById('addModal');
  const mode = modal.dataset.mode || 'add';

  const name = document.getElementById('itemName').value.trim();
  if (!name) { alert('Name required'); return; }
  const category = document.getElementById('itemCategory').value.trim();
  const unit = document.getElementById('itemUnit').value.trim();
  const qty = Number(document.getElementById('itemQty').value) || 0;
  const threshold = Number(document.getElementById('itemThreshold').value) || 0;
  const location = document.getElementById('itemLocation').value.trim();
  const supplier = document.getElementById('itemSupplier').value.trim();

  if (mode === 'edit' && modal.dataset.editId) {
    const id = modal.dataset.editId;
    firebase.database().ref('inventory/' + id).update({
      name, category, unit, qty, threshold, location, supplier, updatedAt: Date.now()
    });
  } else {
    // push new (status Pending)
    const newRef = firebase.database().ref('inventory').push();
    newRef.set({ name, category, unit, qty, threshold, location, supplier, status: 'Pending', createdAt: Date.now() });
  }

  closeAddModal();
});

function openAddModal() {
  document.getElementById('itemName').value = '';
  document.getElementById('itemCategory').value = '';
  document.getElementById('itemUnit').value = '';
  document.getElementById('itemQty').value = '';
  document.getElementById('itemThreshold').value = '';
  document.getElementById('itemLocation').value = '';
  document.getElementById('itemSupplier').value = '';
  const modal = document.getElementById('addModal');
  modal.dataset.mode = 'add';
  delete modal.dataset.editId;
  modal.style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
}

function openEdit(id) {
  firebase.database().ref('inventory/' + id).once('value').then(snap => {
    const item = snap.val();
    if (!item) return;
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemCategory').value = item.category || '';
    document.getElementById('itemUnit').value = item.unit || '';
    document.getElementById('itemQty').value = item.qty || '';
    document.getElementById('itemThreshold').value = item.threshold || '';
    document.getElementById('itemLocation').value = item.location || '';
    document.getElementById('itemSupplier').value = item.supplier || '';

    const modal = document.getElementById('addModal');
    modal.dataset.mode = 'edit';
    modal.dataset.editId = id;
    modal.style.display = 'flex';
  });
}

function removeItem(id) {
  if (!confirm('Delete this item?')) return;
  firebase.database().ref('inventory/' + id).remove();
}

function approveItem(id) {
  firebase.database().ref('inventory/' + id).update({ status: 'Active' });
}

function denyItem(id) {
  firebase.database().ref('inventory/' + id).update({ status: 'Rejected' });
}

// close modal when clicking outside content
const modalRoot = document.getElementById('addModal');
if (modalRoot) modalRoot.addEventListener('click', e => { if (e.target === modalRoot) closeAddModal(); });
