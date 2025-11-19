// Fixed ADMIN.js — matches your admin.html / ADMIN.css

// Load items from localStorage (ensure inventory variable)
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

// Save to localStorage
function saveInventory() {
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

// Helper to get tbody (matches your HTML table id="inventoryTable")
function getTbody() {
    return document.querySelector('#inventoryTable tbody');
}

// Update dashboard counters
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

// Render inventory table
function renderInventory() {
    const tbody = getTbody();
    if (!tbody) return;
    tbody.innerHTML = "";

    inventory.forEach((item, index) => {
        const tr = document.createElement('tr');

        // low-stock class if qty < threshold (if threshold provided)
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

// Open Add Modal (called by your HTML onclick)
function openAddModal() {
    // clear fields
    document.getElementById("itemName").value = "";
    document.getElementById("itemCategory").value = "";
    document.getElementById("itemUnit").value = "";
    document.getElementById("itemQty").value = "";
    document.getElementById("itemThreshold").value = "";
    document.getElementById("itemLocation").value = "";
    document.getElementById("itemSupplier").value = "";

    // store mode
    document.getElementById("addModal").dataset.mode = "add";
    // show modal (your CSS expects .modal to be display:none; make it flex)
    const modal = document.getElementById("addModal");
    if (modal) modal.style.display = "flex";
}

// Close Add Modal (called by your HTML)
function closeAddModal() {
    const modal = document.getElementById("addModal");
    if (modal) modal.style.display = "none";
    // remove editIndex if any
    delete modal.dataset.editIndex;
}

// Add Item (called by your HTML button inside modal)
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
        // edit existing
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
        // new item defaults to Pending (as requested earlier)
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

// Open modal to edit existing item (keeps same modal UI)
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

// Delete item
function deleteItem(index) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    inventory.splice(index, 1);
    saveInventory();
    renderInventory();
}

// Approve item (set status to Active)
function approveItem(index) {
    if (!inventory[index]) return;
    inventory[index].status = "Active";
    saveInventory();
    renderInventory();
}

// Deny item (set status to Rejected)
function denyItem(index) {
    if (!inventory[index]) return;
    inventory[index].status = "Rejected";
    saveInventory();
    renderInventory();
}

// small utility to escape HTML for safety when injecting text
function escapeHtml(text) {
    if (!text && text !== 0) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// initialize on first load
document.addEventListener("DOMContentLoaded", () => {
    // ensure modal closes if clicking outside modal-content
    const modal = document.getElementById("addModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeAddModal();
        });
    }

    renderInventory();
    updateDashboard();
});
