const API_URL =
"https://script.google.com/macros/s/AKfycbyZIUvCUj4vLx35pg0sqMziD3tikSzVrLuaJagmneQJUoeCLxJ5V-grqQ1AqjZcic_LGg/exec";

// =========================================
// Variables
// =========================================

let shipments = [];
let containers = [];
let filteredContainers = [];

let monthChart = null;
let factoryChart = null;

let warehouseChart = null;
let warehouseStatusChart = null;

let etaAscending = true;
let entryAscending = true;
let qtyAscending = true;

// =========================================
// Helpers
// =========================================

function getContainerCount(value){

    const match = String(value || "").match(/\d+/);

    return match ? Number(match[0]) : 0;

}

// =========================================
// Load Dashboard
// =========================================

async function loadData(){

    try{

        const response = await fetch(API_URL);

        shipments = await response.json();

        populateDepartmentFilter(shipments);
        populatePOLFilter(shipments);
        populatePODFilter(shipments);
        populateFactoryFilter(shipments);

        applyFilters();

    }

    catch(error){

        console.error(error);

        alert("Unable to load dashboard data.");

    }

}

// =========================================
// Load Containers
// =========================================

async function loadContainers(){

    try{

        const response =
            await fetch(API_URL + "?sheet=CONTAINERS");

        containers =
            await response.json();

        fillContainerFilters(containers);

        filteredContainers = [...containers];

        applyContainerFilters();

    }

    catch(error){

        console.error(error);

    }

}

loadData();
// =========================================
// Render Containers
// =========================================

function renderContainers(data){

    const tbody =
        document.querySelector("#containerTable tbody");

    tbody.innerHTML = "";

    data.forEach(item=>{

        const tr = document.createElement("tr");

        tr.innerHTML = `

        <tr>

            <td>${item.container}</td>

            <td>${item.entry}</td>

            <td>${item.sn}</td>

            <td>${item.eta}</td>

            <td>${item.department}</td>

            <td>${item.warehouse || "-"}</td>

            <td>${item.model || "-"}</td>

            <td>${Number(item.qty || 0).toLocaleString()}</td>

            <td>${item.status || "-"}</td>

            <td>${item.distribution || "-"}</td>

        </tr>

        `;

        tbody.appendChild(tr);

    });

}

// =========================================
// Container KPIs
// =========================================

function updateContainerKPIs(data){

    const uniqueContainers =
        [...new Set(data.map(x=>x.container))];

    document.getElementById("containerTotal").textContent =
        uniqueContainers.length.toLocaleString();

    const received =
        [...new Set(

            data

                .filter(x=>
                    String(x.status || "").trim() === "استلمت"
                )

                .map(x=>x.container)

        )];

    document.getElementById("containerReceived").textContent =
        received.length.toLocaleString();

    document.getElementById("containerWaiting").textContent =
        (uniqueContainers.length - received.length).toLocaleString();

    const waitingDistribution =
        [...new Set(

            data

                .filter(x=>
                    String(x.distribution || "").trim() !== "تم التوزيع"
                )

                .map(x=>x.container)

        )];

    document.getElementById("containerDistributed").textContent =
        waitingDistribution.length.toLocaleString();

}

// =========================================
// Fill Container Filters
// =========================================

function fillContainerFilters(data){

    const warehouse =
        document.getElementById("warehouseFilter");

    const department =
        document.getElementById("departmentContainerFilter");

    warehouse.innerHTML =
        '<option value="">All Warehouses</option>';

    department.innerHTML =
        '<option value="">All Departments</option>';

    [...new Set(

        data
            .map(x=>x.warehouse)
            .filter(Boolean)

    )]

    .sort()

    .forEach(x=>{

        warehouse.innerHTML +=
            `<option value="${x}">${x}</option>`;

    });

    [...new Set(

        data
            .map(x=>x.department)
            .filter(Boolean)

    )]

    .sort()

    .forEach(x=>{

        department.innerHTML +=
            `<option value="${x}">${x}</option>`;

    });

}
// =========================================
// Apply Container Filters
// =========================================

function applyContainerFilters(){

    let data = [...containers];

    const search =
        document.getElementById("containerSearch")
        .value
        .toLowerCase()
        .trim();

    const warehouse =
        document.getElementById("warehouseFilter")
        .value;

    const department =
        document.getElementById("departmentContainerFilter")
        .value;

    const status =
        document.getElementById("statusContainerFilter")
        .value;

    const distribution =
        document.getElementById("distributionFilter")
        .value;

    const eta =
        document.getElementById("etaContainerFilter")
        .value;

    // =========================
    // Search
    // =========================

    if(search){

        data = data.filter(item=>

            String(item.container || "").toLowerCase().includes(search) ||

            String(item.entry || "").toLowerCase().includes(search) ||

            String(item.model || "").toLowerCase().includes(search) ||

            String(item.department || "").toLowerCase().includes(search) ||

            String(item.warehouse || "").toLowerCase().includes(search) ||

            String(item.bayan || "").toLowerCase().includes(search)

        );

    }

    // =========================
    // Warehouse
    // =========================

    if(warehouse){

        data = data.filter(item=>

            item.warehouse === warehouse

        );

    }

    // =========================
    // Department
    // =========================

    if(department){

        data = data.filter(item=>

            item.department === department

        );

    }

    // =========================
    // Status
    // =========================

    if(status === "استلمت"){

        data = data.filter(item=>

            String(item.status || "").trim() === "استلمت"

        );

    }

    if(status === "غير مستلمة"){

        data = data.filter(item=>

            String(item.status || "").trim() !== "استلمت"

        );

    }

    // =========================
    // Distribution
    // =========================

    if(distribution === "تم التوزيع"){

        data = data.filter(item=>

            String(item.distribution || "").trim() === "تم التوزيع"

        );

    }

    if(distribution === "لم يتم"){

        data = data.filter(item=>

            String(item.distribution || "").trim() !== "تم التوزيع"

        );

    }

    // =========================
    // ETA
    // =========================

    if(eta){

        data = data.filter(item=>{

            if(!item.eta) return false;

            const d = new Date(item.eta);

            if(isNaN(d)) return false;

            const yyyy = d.getFullYear();

            const mm = String(d.getMonth()+1).padStart(2,"0");

            const dd = String(d.getDate()).padStart(2,"0");

            return `${yyyy}-${mm}-${dd}` === eta;

        });

    }

    filteredContainers = data;

    renderContainers(filteredContainers);

    updateContainerKPIs(filteredContainers);

}
// =========================================
// Container Filters Events
// =========================================

document.getElementById("containerSearch")
.addEventListener("input", applyContainerFilters);

document.getElementById("warehouseFilter")
.addEventListener("change", applyContainerFilters);

document.getElementById("departmentContainerFilter")
.addEventListener("change", applyContainerFilters);

document.getElementById("statusContainerFilter")
.addEventListener("change", applyContainerFilters);

document.getElementById("distributionFilter")
.addEventListener("change", applyContainerFilters);

document.getElementById("etaContainerFilter")
.addEventListener("change", applyContainerFilters);
