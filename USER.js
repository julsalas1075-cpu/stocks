// Load existing inventory
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

// Save
function saveInventory() {
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

// Submit request
function submitRequest() {
    const name = document.getElementById("reqName").value;
    const qty = document.getElementById("reqQty").value;

    if (!name || !qty) {
        alert("Please fill all fields");
        return;
    }

    inventory.push({
        name: name,
        category: "-",
        unit: "-",
        qty: qty,
        threshold: "-",
        location: "-",
        supplier: "-",
        status: "pending"
    });

    saveInventory();
    loadUserRequests();

    document.getElementById("reqName").value = "";
    document.getElementById("reqQty").value = "";

    alert("Request submitted!");
}

// Show user requests
function loadUserRequests() {
    const tbody = document.getElementById("userBody");
    tbody.innerHTML = "";

    inventory.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td><span class="status ${item.status}">${item.status.toUpperCase()}</span></td>
        `;

        tbody.appendChild(row);
    });
}

loadUserRequests();
