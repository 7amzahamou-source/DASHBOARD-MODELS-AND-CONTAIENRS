// =========================================
// API
// =========================================

const API_URL =
"https://script.google.com/macros/s/AKfycbyZIUvCUj4vLx35pg0sqMziD3tikSzVrLuaJagmneQJUoeCLxJ5V-grqQ1AqjZcic_LGg/exec";

// =========================================
// Variables
// =========================================

let shipments = [];
let containers = [];

let filteredShipments = [];
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

function formatDate(date){

    if(!date) return "";

    const d = new Date(date);

    if(isNaN(d)) return "";

    return d.toLocaleDateString("en-GB",{

        day:"2-digit",
        month:"short",
        year:"numeric"

    });

}

// =========================================
// Load Dashboard
// =========================================

async function loadData(){

    try{

        const response =
            await fetch(API_URL);

        shipments =
            await response.json();

        filteredShipments = [...shipments];

        populateDepartmentFilter(shipments);

        populatePOLFilter(shipments);

        populatePODFilter(shipments);

        populateFactoryFilter(shipments);

        applyFilters();

    }

    catch(error){

        console.error(error);

        alert("Unable to load dashboard.");

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

        containers.sort((a,b)=>

            new Date(a.eta) -
            new Date(b.eta)

        );

        filteredContainers = [...containers];

        fillContainerFilters(filteredContainers);

        applyContainerFilters();

    }

    catch(error){

        console.error(error);

        alert("Unable to load containers.");

    }

}

// =========================================
// Initial Load
// =========================================

loadData();
// =========================================
// Dashboard KPIs
// =========================================

function updateKPIs(data){

    document.getElementById("totalShipments").textContent =
        data.length.toLocaleString();

    let totalContainers = 0;
    let arrived = 0;
    let sea = 0;

    data.forEach(item=>{

        const qty = getContainerCount(item.hq);

        totalContainers += qty;

        if(String(item.bayan || "").trim()){

            arrived += qty;

        }else{

            sea += qty;

        }

    });

    document.getElementById("totalContainers").textContent =
        totalContainers.toLocaleString();

    document.getElementById("containersArrived").textContent =
        arrived.toLocaleString();

    document.getElementById("containersOnSea").textContent =
        sea.toLocaleString();

}

// =========================================
// Dashboard Filters
// =========================================

function populateDepartmentFilter(data){

    const select =
        document.getElementById("departmentFilter");

    select.innerHTML =
        '<option value="">All Departments</option>';

    [...new Set(

        data.map(x=>x.department)
            .filter(Boolean)

    )]

    .sort()

    .forEach(item=>{

        select.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

}

function populatePOLFilter(data){

    const select =
        document.getElementById("polFilter");

    select.innerHTML =
        '<option value="">All POL</option>';

    [...new Set(

        data.map(x=>x.pol)
            .filter(Boolean)

    )]

    .sort()

    .forEach(item=>{

        select.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

}

function populatePODFilter(data){

    const select =
        document.getElementById("podFilter");

    select.innerHTML =
        '<option value="">All POD</option>';

    [...new Set(

        data.map(x=>x.pod)
            .filter(Boolean)

    )]

    .sort()

    .forEach(item=>{

        select.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

}

function populateFactoryFilter(data){

    const select =
        document.getElementById("factoryFilter");

    select.innerHTML =
        '<option value="">All Factories</option>';

    [...new Set(

        data.map(x=>x.factory)
            .filter(Boolean)

    )]

    .sort()

    .forEach(item=>{

        select.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

}
// =========================================
// Apply Dashboard Filters
// =========================================

function applyFilters(){

    let data = [...shipments];

    const search =
        document.getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const department =
        document.getElementById("departmentFilter").value;

    const pol =
        document.getElementById("polFilter").value;

    const pod =
        document.getElementById("podFilter").value;

    const factory =
        document.getElementById("factoryFilter").value;

    const status =
        document.getElementById("statusFilter").value;

    // =========================
    // Search
    // =========================

    if(search){

        data = data.filter(item=>

            String(item.entry || "")
                .toLowerCase()
                .includes(search)

            ||

            String(item.factory || "")
                .toLowerCase()
                .includes(search)

            ||

            String(item.model || "")
                .toLowerCase()
                .includes(search)

            ||

            String(item.description || "")
                .toLowerCase()
                .includes(search)

            ||

            String(item.eta || "")
                .toLowerCase()
                .includes(search)

        );

    }

    // =========================
    // Department
    // =========================

    if(department){

        data =
            data.filter(item=>

                item.department === department

            );

    }

    // =========================
    // POL
    // =========================

    if(pol){

        data =
            data.filter(item=>

                item.pol === pol

            );

    }

    // =========================
    // POD
    // =========================

    if(pod){

        data =
            data.filter(item=>

                item.pod === pod

            );

    }

    // =========================
    // Factory
    // =========================

    if(factory){

        data =
            data.filter(item=>

                item.factory === factory

            );

    }

    // =========================
    // Shipment Status
    // =========================

    if(status === "sea"){

        data =
            data.filter(item=>

                !String(item.bayan || "").trim()

            );

    }

    if(status === "arrived"){

        data =
            data.filter(item=>

                String(item.bayan || "").trim()

            );

    }

    filteredShipments = data;

    renderTable(filteredShipments);

    updateKPIs(filteredShipments);

    drawMonthChart(filteredShipments);

    drawFactoryChart(filteredShipments);

}
// =========================================
// Render Dashboard Table
// =========================================

function renderTable(data){

    const tbody =
        document.querySelector("#shipmentTable tbody");

    tbody.innerHTML = "";

    data.forEach(item=>{

        const tr =
            document.createElement("tr");

        tr.innerHTML = `

            <td>${item.entry || ""}</td>

            <td>${item.factory || ""}</td>

            <td>${item.model || ""}</td>

            <td>${item.description || ""}</td>

            <td style="text-align:center">

                ${Number(item.qty || 0).toLocaleString()}

            </td>

            <td style="text-align:center">

                ${item.etd || ""}

            </td>

            <td style="text-align:center">

                ${item.eta || ""}

            </td>

            <td style="text-align:center">

                ${item.pol || ""}

            </td>

            <td style="text-align:center">

                ${item.pod || ""}

            </td>

        `;

        tbody.appendChild(tr);

    });

}
// =========================================
// Dashboard Sorting
// =========================================

function sortByEntry(){

    filteredShipments.sort((a,b)=>{

        return entryAscending

            ? String(a.entry).localeCompare(String(b.entry))

            : String(b.entry).localeCompare(String(a.entry));

    });

    entryAscending = !entryAscending;

    renderTable(filteredShipments);

}

function sortByQty(){

    filteredShipments.sort((a,b)=>{

        return qtyAscending

            ? Number(a.qty)-Number(b.qty)

            : Number(b.qty)-Number(a.qty);

    });

    qtyAscending = !qtyAscending;

    renderTable(filteredShipments);

}

function sortByETA(){

    filteredShipments.sort((a,b)=>{

        return etaAscending

            ? new Date(a.eta)-new Date(b.eta)

            : new Date(b.eta)-new Date(a.eta);

    });

    etaAscending = !etaAscending;

    renderTable(filteredShipments);

}
// =========================================
// Dashboard Events
// =========================================

document.getElementById("searchInput")
.addEventListener("input",applyFilters);

document.getElementById("departmentFilter")
.addEventListener("change",applyFilters);

document.getElementById("polFilter")
.addEventListener("change",applyFilters);

document.getElementById("podFilter")
.addEventListener("change",applyFilters);

document.getElementById("factoryFilter")
.addEventListener("change",applyFilters);

document.getElementById("statusFilter")
.addEventListener("change",applyFilters);

document.getElementById("entryHeader")
.addEventListener("click",sortByEntry);

document.getElementById("qtyHeader")
.addEventListener("click",sortByQty);

document.getElementById("etaHeader")
.addEventListener("click",sortByETA);
// =========================================
// Dashboard Charts
// =========================================

function drawMonthChart(data){

    const months = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const shipments = Array(12).fill(0);
    const containersCount = Array(12).fill(0);

    data.forEach(item=>{

        if(!item.eta) return;

        const d = new Date(item.eta);

        if(isNaN(d)) return;

        const m = d.getMonth();

        shipments[m]++;

        containersCount[m] += getContainerCount(item.hq);

    });

    if(monthChart){

        monthChart.destroy();

    }

    monthChart = new Chart(

        document.getElementById("monthChart"),

        {

            type:"bar",

            data:{

                labels:months,

                datasets:[{

                    label:"Containers",

                    data:containersCount,

                    backgroundColor:"#2563eb",

                    borderRadius:8

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    tooltip:{

                        callbacks:{

                            afterLabel:function(context){

                                return "Shipments : " +

                                shipments[context.dataIndex];

                            }

                        }

                    },

                    legend:{

                        display:false

                    }

                }

            }

        }

    );

}

// =========================================
// Factory Chart
// =========================================

function drawFactoryChart(data){

    const factories = {};

    data.forEach(item=>{

        const name = item.factory || "Unknown";

        if(!factories[name]){

            factories[name]={

                shipments:0,

                containers:0

            };

        }

        factories[name].shipments++;

        factories[name].containers +=

            getContainerCount(item.hq);

    });

    const top =

        Object.entries(factories)

        .sort((a,b)=>

            b[1].shipments-a[1].shipments

        )

        .slice(0,3);

    const labels =
        top.map(x=>x[0]);

    const values =
        top.map(x=>x[1].shipments);

    const containerValues =
        top.map(x=>x[1].containers);

    if(factoryChart){

        factoryChart.destroy();

    }

    factoryChart = new Chart(

        document.getElementById("factoryChart"),

        {

            type:"bar",

            data:{

                labels,

                datasets:[{

                    label:"Shipments",

                    data:values,

                    backgroundColor:"#22c55e",

                    borderRadius:8

                }]

            },

            options:{

                indexAxis:"y",

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    tooltip:{

                        callbacks:{

                            afterLabel:function(context){

                                return "Containers : "+

                                containerValues[context.dataIndex];

                            }

                        }

                    },

                    legend:{

                        display:false

                    }

                }

            }

        }

    );

}
// =========================================
// Container KPIs
// =========================================

function updateContainerKPIs(data){

    // Total Containers

    document.getElementById("containerTotal").textContent =
        data.length.toLocaleString();

    // Transit Locations

    const transitLocations = new Set();

    data.forEach(item=>{

        const current =

            item.transit3 ||

            item.transit2 ||

            item.transit1;

        if(current){

            transitLocations.add(current);

        }

    });

    document.getElementById("transitLocations").textContent =
        transitLocations.size.toLocaleString();

    // Destination Ports

    const destinationPorts = new Set();

    data.forEach(item=>{

        if(item.pod){

            destinationPorts.add(item.pod);

        }

    });

    document.getElementById("destinationPorts").textContent =
        destinationPorts.size.toLocaleString();

    // Arriving This Month

    const today = new Date();

    const month = today.getMonth();

    const year = today.getFullYear();

    const arriving = data.filter(item=>{

        if(!item.eta) return false;

        const d = new Date(item.eta);

        return d.getMonth() === month &&
               d.getFullYear() === year;

    });

    document.getElementById("arrivingMonth").textContent =
        arriving.length.toLocaleString();

}

// =========================================
// Fill Container Filters
// =========================================

function fillContainerFilters(data){

    const transit =
        document.getElementById("transitFilter");

    const pod =
        document.getElementById("podContainerFilter");

    transit.innerHTML =
        '<option value="">All Transit</option>';

    pod.innerHTML =
        '<option value="">All Destination Ports</option>';

    // Transit

    const transitList =

        [...new Set(

            data.map(item=>

                item.transit3 ||

                item.transit2 ||

                item.transit1

            )

            .filter(Boolean)

        )]

        .sort();

    transitList.forEach(item=>{

        transit.innerHTML +=

        `<option value="${item}">${item}</option>`;

    });

    // POD

    const podList =

        [...new Set(

            data.map(item=>item.pod)

            .filter(Boolean)

        )]

        .sort();

    podList.forEach(item=>{

        pod.innerHTML +=

        `<option value="${item}">${item}</option>`;

    });

}
// =========================================
// Render Containers
// =========================================

function renderContainers(data){

    const tbody =
        document.querySelector("#containerTable tbody");

    tbody.innerHTML = "";

    data.forEach(item=>{

        // =========================
        // Route
        // =========================

        const route = [];

        if(item.transit1){

            route.push(
                `<span class="route-badge">${item.transit1}</span>`
            );

        }

        if(item.transit2){

            route.push(
                `<span class="route-arrow">➜</span>
                 <span class="route-badge">${item.transit2}</span>`
            );

        }

        if(item.transit3){

            route.push(
                `<span class="route-arrow">➜</span>
                 <span class="route-badge">${item.transit3}</span>`
            );

        }

        // =========================
        // Current Transit
        // =========================

        let currentTransit = "";
        let currentClass = "";

        if(item.transit3){

            currentTransit = item.transit3;
            currentClass = "transit3";

        }
        else if(item.transit2){

            currentTransit = item.transit2;
            currentClass = "transit2";

        }
        else{

            currentTransit = item.transit1 || "";
            currentClass = "transit1";

        }

        // =========================
        // Progress
        // =========================

        const stops = [

            item.transit1,
            item.transit2,
            item.transit3

        ].filter(Boolean);

        let completed = 1;

        if(item.transit3){

            completed = 3;

        }
        else if(item.transit2){

            completed = 2;

        }

        const percent =
            stops.length
            ? Math.round((completed / stops.length) * 100)
            : 0;

        // =========================
        // Row
        // =========================

        const tr =
            document.createElement("tr");

        tr.innerHTML = `

            <td>${item.entry || ""}</td>

            <td>${item.sn || ""}</td>

            <td>${item.container || ""}</td>

            <td>${item.model || ""}</td>

            <td>${Number(item.qty || 0).toLocaleString()}</td>

            <td class="route-cell">

                ${route.join("")}

            </td>

            <td>

                <div class="progress-bar">

                    <div
                        class="progress-fill"
                        style="width:${percent}%">

                    </div>

                </div>

                <div class="progress-text">

                    ${percent}%

                </div>

            </td>

            <td>

                <span class="current-transit ${currentClass}">

                    ${currentTransit}

                </span>

            </td>

            <td>${item.pod || ""}</td>

            <td>${item.eta || ""}</td>

        `;

        tbody.appendChild(tr);

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

    const transit =
        document.getElementById("transitFilter")
        .value;

    const pod =
        document.getElementById("podContainerFilter")
        .value;

    const eta =
        document.getElementById("etaContainerFilter")
        .value;

    // Search

    if(search){

        data = data.filter(item=>

            String(item.entry || "").toLowerCase().includes(search) ||

            String(item.sn || "").toLowerCase().includes(search) ||

            String(item.container || "").toLowerCase().includes(search) ||

            String(item.model || "").toLowerCase().includes(search)

        );

    }

    // Transit

    if(transit){

        data = data.filter(item=>{

            const current =

                item.transit3 ||

                item.transit2 ||

                item.transit1;

            return current === transit;

        });

    }

    // POD

    if(pod){

        data = data.filter(item=>

            item.pod === pod

        );

    }

    // ETA

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

    drawTransitChart(filteredContainers);

    drawDestinationChart(filteredContainers);

}
// =========================================
// Containers by Current Transit
// =========================================

function drawTransitChart(data){

    const transit = {};

    data.forEach(item=>{

        const current =

            item.transit3 ||

            item.transit2 ||

            item.transit1;

        if(!current) return;

        transit[current] =

            (transit[current] || 0) + 1;

    });

    const labels =
        Object.keys(transit);

    const values =
        Object.values(transit);

    if(warehouseChart){

        warehouseChart.destroy();

    }

    warehouseChart = new Chart(

        document.getElementById("warehouseChart"),

        {

            type:"bar",

            data:{

                labels,

                datasets:[{

                    label:"Containers",

                    data:values,

                    backgroundColor:"#2563eb",

                    borderRadius:8

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        display:false
                    }

                },

                scales:{

                    y:{
                        beginAtZero:true
                    }

                }

            }

        }

    );

}

// =========================================
// Containers by Destination Port
// =========================================

function drawDestinationChart(data){

    const ports = {};

    data.forEach(item=>{

        if(!item.pod) return;

        ports[item.pod] =

            (ports[item.pod] || 0) + 1;

    });

    const labels =
        Object.keys(ports);

    const values =
        Object.values(ports);

    if(warehouseStatusChart){

        warehouseStatusChart.destroy();

    }

    warehouseStatusChart = new Chart(

        document.getElementById("warehouseStatusChart"),

        {

            type:"doughnut",

            data:{

                labels,

                datasets:[{

                    data:values,

                    backgroundColor:[

                        "#2563eb",
                        "#22c55e",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                        "#06b6d4",
                        "#14b8a6",
                        "#64748b"

                    ]

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        position:"bottom"
                    }

                }

            }

        }

    );

}

// =========================================
// Container Events
// =========================================

document.getElementById("containerSearch")
.addEventListener("input",applyContainerFilters);

document.getElementById("transitFilter")
.addEventListener("change",applyContainerFilters);

document.getElementById("podContainerFilter")
.addEventListener("change",applyContainerFilters);

document.getElementById("etaContainerFilter")
.addEventListener("change",applyContainerFilters);
// =========================================
// Navigation
// =========================================

let containersLoaded = false;

const dashboardBtn =
    document.getElementById("dashboardBtn");

const containersBtn =
    document.getElementById("containersBtn");

const dashboardPage =
    document.getElementById("dashboardPage");

const containersPage =
    document.getElementById("containersPage");

// Dashboard

dashboardBtn.addEventListener("click",()=>{

    dashboardBtn.classList.add("active");
    containersBtn.classList.remove("active");

    dashboardPage.style.display = "block";
    containersPage.style.display = "none";

});

// Containers

containersBtn.addEventListener("click",()=>{

    containersBtn.classList.add("active");
    dashboardBtn.classList.remove("active");

    dashboardPage.style.display = "none";
    containersPage.style.display = "block";

    if(!containersLoaded){

        loadContainers();

        containersLoaded = true;

    }

});
