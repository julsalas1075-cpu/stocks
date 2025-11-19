
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

function saveInventory() {
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

function getTbody() {
    return document.querySelector('#inventoryTable tbody');
}

function updateDashboard() {
    document.getElementById("totalItems").innerText = inventory.length;
    const low = inventory.filter(i => {
        const th = Number(i.threshold) || 0;
        const q = Number(i.qty) || 0;
        return th > 0 ? q < th : false;
    }).length;
    document.getElementById("lowStock").innerText = low;
    const pending = inventory.filter(i => (i.status || "").toLowerCase() === "pending").length;
    document.getElementById("pendingCount").innerText = pending;
}

function renderInventory() {
    const tbody = getTbody();
    if (!tbody) return;
    tbody.innerHTML = "";

    inventory.forEach((item, index) => {
        const tr = document.createElement('tr');

        const qty = Number(item.qty) || 0;
        const threshold = Number(item.threshold) || 0;
        if (threshold > 0 && qty < threshold) tr.classList.add('low-stock');

        const statusText = item.status ? item.status : "Active";

        tr.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.category || "")}</td>
            <td>${escapeHtml(item.unit || "")}</td>
            <td>${qty}</td>
            <td>${threshold}</td>
            <td>${escapeHtml(item.location || "")}</td>
            <td>${escapeHtml(item.supplier || "")}</td>
            <td class="${statusText.toLowerCase()}">${escapeHtml(statusText)}</td>
            <td>
                <button class="btn" onclick="openEditModal(${index})">Edit</button>
                <button class="btn" onclick="deleteItem(${index})">Delete</button>
                ${ (statusText.toLowerCase() === "pending") ? `<button class="btn" onclick="approveItem(${index})">Approve</button>
                <button class="btn" onclick="denyItem(${index})">Deny</button>` : "" }
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateDashboard();
}

function openAddModal() {
    
    document.getElementById("itemName").value = "";
    document.getElementById("itemCategory").value = "";
    document.getElementById("itemUnit").value = "";
    document.getElementById("itemQty").value = "";
    document.getElementById("itemThreshold").value = "";
    document.getElementById("itemLocation").value = "";
    document.getElementById("itemSupplier").value = "";

 
    document.getElementById("addModal").dataset.mode = "add";
  
    const modal = document.getElementById("addModal");
    if (modal) modal.style.display = "flex";
}


function closeAddModal() {
    const modal = document.getElementById("addModal");
    if (modal) modal.style.display = "none";
  
    delete modal.dataset.editIndex;
}


function addItem() {
    const name = document.getElementById("itemName").value.trim();
    if (!name) {
        alert("Name is required");
        return;
    }

    const category = document.getElementById("itemCategory").value.trim();
    const unit = document.getElementById("itemUnit").value.trim();
    const qty = Number(document.getElementById("itemQty").value) || 0;
    const threshold = Number(document.getElementById("itemThreshold").value) || 0;
    const location = document.getElementById("itemLocation").value.trim();
    const supplier = document.getElementById("itemSupplier").value.trim();

    const modal = document.getElementById("addModal");
    const mode = modal && modal.dataset.mode ? modal.dataset.mode : "add";

    if (mode === "edit" && modal.dataset.editIndex != null) {
        
        const idx = Number(modal.dataset.editIndex);
        if (!Number.isNaN(idx) && inventory[idx]) {
            inventory[idx].name = name;
            inventory[idx].category = category;
            inventory[idx].unit = unit;
            inventory[idx].qty = qty;
            inventory[idx].threshold = threshold;
            inventory[idx].location = location;
            inventory[idx].supplier = supplier;
            inventory[idx].updatedAt = new Date().toISOString();
        }
    } else {
     
        inventory.push({
            name,
            category,
            unit,
            qty,
            threshold,
            location,
            supplier,
            status: "Pending",
            createdAt: new Date().toISOString()
        });
    }

    saveInventory();
    renderInventory();
    closeAddModal();
}

function openEditModal(index) {
    const item = inventory[index];
    if (!item) return;

    document.getElementById("itemName").value = item.name || "";
    document.getElementById("itemCategory").value = item.category || "";
    document.getElementById("itemUnit").value = item.unit || "";
    document.getElementById("itemQty").value = item.qty || 0;
    document.getElementById("itemThreshold").value = item.threshold || 0;
    document.getElementById("itemLocation").value = item.location || "";
    document.getElementById("itemSupplier").value = item.supplier || "";

    const modal = document.getElementById("addModal");
    if (modal) {
        modal.dataset.mode = "edit";
        modal.dataset.editIndex = String(index);
        modal.style.display = "flex";
    }
}

function deleteItem(index) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    inventory.splice(index, 1);
    saveInventory();
    renderInventory();
}


function approveItem(index) {
    if (!inventory[index]) return;
    inventory[index].status = "Active";
    saveInventory();
    renderInventory();
}


function denyItem(index) {
    if (!inventory[index]) return;
    inventory[index].status = "Rejected";
    saveInventory();
    renderInventory();
}

function escapeHtml(text) {
    if (!text && text !== 0) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    
    const modal = document.getElementById("addModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeAddModal();
        });
    }

    renderInventory();
    updateDashboard();
});
