// ADMIN.js — Advanced admin logic (Realtime DB)
const db = firebase.database();
const inventoryRef = db.ref('inventory');

// UI elements
const inventoryBody = document.getElementById('inventory-body');
const totalItemsEl = document.getElementById('totalItems');
const lowStockEl = document.getElementById('lowStock');
const pendingCountEl = document.getElementById('pendingCount');
const searchEl = document.getElementById('search');
const filterCategoryEl = document.getElementById('filterCategory');

let cachedItems = []; // array of items { _id, ... }

function escapeHtml(s){ if(s===undefined||s===null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Render helpers
function renderTable(items){
  inventoryBody.innerHTML = '';
  items.forEach(it => {
    const tr = document.createElement('tr');
    if((Number(it.threshold)||0) > 0 && Number(it.qty||0) < Number(it.threshold||0)) tr.classList.add('low-stock');
    const statusClass = 'status ' + (it.status || 'Active');
    tr.innerHTML = `
      <td>${escapeHtml(it.name)}</td>
      <td>${escapeHtml(it.category||'')}</td>
      <td>${escapeHtml(it.unit||'')}</td>
      <td>${escapeHtml(it.qty||0)}</td>
      <td>${escapeHtml(it.threshold||0)}</td>
      <td>${escapeHtml(it.location||'')}</td>
      <td>${escapeHtml(it.supplier||'')}</td>
      <td class="${statusClass}">${escapeHtml(it.status||'Active')}</td>
      <td>
        <button class="btn" onclick="openEdit('${it._id}')">Edit</button>
        <button class="btn" onclick="removeItem('${it._id}')">Delete</button>
        ${ (String(it.status||'').toLowerCase()==='pending') ? `<button class="btn primary" onclick="approveItem('${it._id}')">Approve</button><button class="btn" onclick="denyItem('${it._id}')">Deny</button>` : '' }
      </td>
    `;
    inventoryBody.appendChild(tr);
  });
}

function updateCards(items){
  totalItemsEl.innerText = items.length;
  lowStockEl.innerText = items.filter(i => (Number(i.threshold)||0) > 0 && Number(i.qty||0) < Number(i.threshold||0)).length;
  pendingCountEl.innerText = items.filter(i => (i.status||'').toLowerCase()==='pending').length;
}

function refreshUI(){
  const q = searchEl.value.trim().toLowerCase();
  const cat = filterCategoryEl.value;
  let items = cachedItems.slice();
  if(cat) items = items.filter(i=> (i.category||'').toLowerCase()===cat.toLowerCase());
  if(q) items = items.filter(i=> (i.name||'').toLowerCase().includes(q) || (i.sku||'').toLowerCase().includes(q));
  renderTable(items);
  updateCards(cachedItems);
  renderCategoryReport(cachedItems);
}

// realtime listener
inventoryRef.on('value', snap=>{
  const data = snap.val() || {};
  cachedItems = Object.keys(data).map(k=>({ _id:k, ...data[k] }));
  // populate category filter
  const cats = Array.from(new Set(cachedItems.map(i=>i.category||'').filter(Boolean)));
  filterCategoryEl.innerHTML = '<option value="">All categories</option>' + cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  refreshUI();
});

// Actions
function openEdit(id){
  const item = cachedItems.find(i=>i._id===id);
  if(!item) return;
  document.getElementById('itemName').value = item.name||'';
  document.getElementById('itemCategory').value = item.category||'';
  document.getElementById('itemUnit').value = item.unit||'';
  document.getElementById('itemQty').value = item.qty||0;
  document.getElementById('itemThreshold').value = item.threshold||0;
  document.getElementById('itemLocation').value = item.location||'';
  document.getElementById('itemSupplier').value = item.supplier||'';
  const modal = document.getElementById('modal');
  modal.dataset.mode = 'edit';
  modal.dataset.editId = id;
  document.getElementById('modalTitle').innerText = 'Edit Item';
  modal.style.display = 'flex';
}

function removeItem(id){ if(!confirm('Delete item?')) return; inventoryRef.child(id).remove(); }
function approveItem(id){ inventoryRef.child(id).update({ status:'Active', updatedAt:Date.now() }); }
function denyItem(id){ inventoryRef.child(id).update({ status:'Rejected', updatedAt:Date.now() }); }

// save (add or edit)
document.getElementById('saveBtn').addEventListener('click', ()=>{
  const name = document.getElementById('itemName').value.trim();
  if(!name){ alert('Name required'); return; }