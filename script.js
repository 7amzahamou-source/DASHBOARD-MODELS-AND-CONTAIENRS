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

        alert("Unable to load Dashboard Data.");

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

        alert("Unable to load Containers.");

    }

}

// =========================================
// Start
// =========================================

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

            <td>${item.entry}</td>

            <td>${item.sn}</td>

            <td>${item.container}</td>

            <td>${item.model || "-"}</td>

            <td>${Number(item.qty || 0).toLocaleString()}</td>

            <td>${item.eta}</td>

            <td>${item.warehouse || "-"}</td>

            <td>${item.department || "-"}</td>

            <td>${item.status || "-"}</td>

            <td>${item.distribution || "-"}</td>

        `;

        tbody.appendChild(tr);

    });

}

// =========================================
// Container KPIs
// =========================================

function updateContainerKPIs(data){

    const uniqueContainers = [

        ...new Set(

            data

                .map(x=>x.container)

                .filter(Boolean)

        )

    ];

    document.getElementById("containerTotal").textContent =
        uniqueContainers.length.toLocaleString();

    const received = [

        ...new Set(

            data

                .filter(x=>

                    String(x.status || "").trim() === "استلمت"

                )

                .map(x=>x.container)

        )

    ];

    document.getElementById("containerReceived").textContent =
        received.length.toLocaleString();

    document.getElementById("containerWaiting").textContent =
        (uniqueContainers.length - received.length).toLocaleString();

    const waitingDistribution = [

        ...new Set(

            data

                .filter(x=>

                    String(x.distribution || "").trim() !== "تم التوزيع"

                )

                .map(x=>x.container)

        )

    ];

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

            .map(x=>String(x.warehouse || "").trim())

            .filter(Boolean)

    )]

    .sort()

    .forEach(item=>{

        warehouse.innerHTML +=

        `<option value="${item}">${item}</option>`;

    });

    [...new Set(

        data

            .map(x=>String(x.department || "").trim())

            .filter(Boolean)

    )]

    .sort()

    .forEach(item=>{

        department.innerHTML +=

        `<option value="${item}">${item}</option>`;

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

            String(item.entry || "").toLowerCase().includes(search) ||

            String(item.container || "").toLowerCase().includes(search) ||

            String(item.model || "").toLowerCase().includes(search) ||

            String(item.sn || "").toLowerCase().includes(search) ||

            String(item.warehouse || "").toLowerCase().includes(search) ||

            String(item.department || "").toLowerCase().includes(search)

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

    drawWarehouseChart(filteredContainers);

    drawWarehouseStatusChart(filteredContainers);

}
// =========================================
// Container Events
// =========================================

document
.getElementById("containerSearch")
.addEventListener("input", applyContainerFilters);

document
.getElementById("warehouseFilter")
.addEventListener("change", applyContainerFilters);

document
.getElementById("departmentContainerFilter")
.addEventListener("change", applyContainerFilters);

document
.getElementById("statusContainerFilter")
.addEventListener("change", applyContainerFilters);

document
.getElementById("distributionFilter")
.addEventListener("change", applyContainerFilters);

document
.getElementById("etaContainerFilter")
.addEventListener("change", applyContainerFilters);

// =========================================
// Containers by Warehouse
// =========================================

function drawWarehouseChart(data){

    const warehouses = {};

    data.forEach(item=>{

        const warehouse = String(item.warehouse || "-").trim();

        if(!warehouses[warehouse]){

            warehouses[warehouse] = new Set();

        }

        warehouses[warehouse].add(item.container);

    });

    const labels = Object.keys(warehouses);

    const values = labels.map(x=>warehouses[x].size);

    if(warehouseChart){

        warehouseChart.destroy();

    }

    warehouseChart = new Chart(

        document.getElementById("warehouseChart"),

        {

            type:"bar",

            data:{

                labels:labels,

                datasets:[{

                    label:"Containers",

                    data:values,

                    backgroundColor:"#3b82f6",

                    borderRadius:6

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

                        beginAtZero:true,

                        ticks:{
                            precision:0
                        }

                    }

                }

            }

        }

    );

}

// =========================================
// Received vs Not Received
// =========================================

function drawWarehouseStatusChart(data){

    const warehouses = {};

    data.forEach(item=>{

        const warehouse =
            String(item.warehouse || "-").trim();

        if(!warehouses[warehouse]){

            warehouses[warehouse] = {

                received:new Set(),

                waiting:new Set()

            };

        }

        if(String(item.status || "").trim() === "استلمت"){

            warehouses[warehouse]
                .received
                .add(item.container);

        }else{

            warehouses[warehouse]
                .waiting
                .add(item.container);

        }

    });

    const labels = Object.keys(warehouses);

    const received =
        labels.map(x=>warehouses[x].received.size);

    const waiting =
        labels.map(x=>warehouses[x].waiting.size);

    if(warehouseStatusChart){

        warehouseStatusChart.destroy();

    }

    warehouseStatusChart = new Chart(

        document.getElementById("warehouseStatusChart"),

        {

            type:"bar",

            data:{

                labels:labels,

                datasets:[

                    {

                        label:"Received",

                        data:received,

                        backgroundColor:"#22c55e"

                    },

                    {

                        label:"Not Received",

                        data:waiting,

                        backgroundColor:"#ef4444"

                    }

                ]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        position:"top"
                    }

                },

                scales:{

                    y:{

                        beginAtZero:true,

                        ticks:{
                            precision:0
                        }

                    }

                }

            }

        }

    );

}
// =========================================
// Render Shipments Table
// =========================================

function renderTable(data){

    const tbody =
        document.querySelector("#shipmentTable tbody");

    tbody.innerHTML = "";

    data.forEach(item=>{

        tbody.innerHTML += `

        <tr>

            <td>${item.entry}</td>

            <td>${item.factory}</td>

            <td>${item.model}</td>

            <td>${item.description}</td>

            <td>${Number(item.qty || 0).toLocaleString()}</td>

            <td>${item.etd}</td>

            <td>${item.eta}</td>

            <td>${item.pol}</td>

            <td>${item.pod}</td>

        </tr>

        `;

    });

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

        data

            .map(x=>String(x.department || "").trim())

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

        data

            .map(x=>String(x.pol || "").trim())

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

        data

            .map(x=>String(x.pod || "").trim())

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

        data

            .map(x=>String(x.factory || "").trim())

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
        document.getElementById("departmentFilter")
        .value;

    const pol =
        document.getElementById("polFilter")
        .value;

    const pod =
        document.getElementById("podFilter")
        .value;

    const factory =
        document.getElementById("factoryFilter")
        .value;

    const status =
        document.getElementById("statusFilter")
        .value;

    // =========================
    // Search
    // =========================

    if(search){

        data = data.filter(item=>

            String(item.entry || "").toLowerCase().includes(search) ||

            String(item.factory || "").toLowerCase().includes(search) ||

            String(item.model || "").toLowerCase().includes(search) ||

            String(item.description || "").toLowerCase().includes(search) ||

            String(item.eta || "").toLowerCase().includes(search)

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
    // POL
    // =========================

    if(pol){

        data = data.filter(item=>

            item.pol === pol

        );

    }

    // =========================
    // POD
    // =========================

    if(pod){

        data = data.filter(item=>

            item.pod === pod

        );

    }

    // =========================
    // Factory
    // =========================

    if(factory){

        data = data.filter(item=>

            item.factory === factory

        );

    }

    // =========================
    // Shipment Status
    // =========================

    if(status==="sea"){

        data = data.filter(item=>

            String(item.bayan || "").trim()===""

        );

    }

    if(status==="arrived"){

        data = data.filter(item=>

            String(item.bayan || "").trim()!==""

        );

    }

    renderTable(data);

    updateKPIs(data);

    drawMonthChart(data);

    drawFactoryChart(data);

}

// =========================================
// Dashboard Events
// =========================================

document
.getElementById("searchInput")
.addEventListener("input",applyFilters);

document
.getElementById("departmentFilter")
.addEventListener("change",applyFilters);

document
.getElementById("polFilter")
.addEventListener("change",applyFilters);

document
.getElementById("podFilter")
.addEventListener("change",applyFilters);

document
.getElementById("factoryFilter")
.addEventListener("change",applyFilters);

document
.getElementById("statusFilter")
.addEventListener("change",applyFilters);
// =========================================
// Dashboard KPIs
// =========================================

function updateKPIs(data){

    const shipmentCount = data.length;

    const totalContainers = data.reduce((sum,item)=>{

        return sum + getContainerCount(item.hq);

    },0);

    const arrivedContainers = data.reduce((sum,item)=>{

        if(String(item.bayan || "").trim()!==""){

            return sum + getContainerCount(item.hq);

        }

        return sum;

    },0);

    const seaContainers =
        totalContainers - arrivedContainers;

    document.getElementById("totalShipments").textContent =
        shipmentCount.toLocaleString();

    document.getElementById("totalContainers").textContent =
        totalContainers.toLocaleString();

    document.getElementById("containersArrived").textContent =
        arrivedContainers.toLocaleString();

    document.getElementById("containersOnSea").textContent =
        seaContainers.toLocaleString();

}

// =========================================
// Containers by ETA Month
// =========================================

function drawMonthChart(data){

    const months = {};

    data.forEach(item=>{

        if(!item.eta) return;

        const month =
            item.eta.substring(3,6);

        if(!months[month]){

            months[month]={

                shipments:0,

                containers:0

            };

        }

        months[month].shipments++;

        months[month].containers +=
            getContainerCount(item.hq);

    });

    const labels = Object.keys(months);

    const shipments =
        labels.map(x=>months[x].shipments);

    const containers =
        labels.map(x=>months[x].containers);

    if(monthChart){

        monthChart.destroy();

    }

    monthChart = new Chart(

        document.getElementById("monthChart"),

        {

            type:"bar",

            data:{

                labels,

                datasets:[{

                    label:"Shipments",

                    data:shipments,

                    containers,

                    backgroundColor:"#3b82f6"

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        display:false
                    },

                    tooltip:{

                        callbacks:{

                            afterLabel:function(context){

                                return "Containers : " +

                                context.dataset.containers[
                                    context.dataIndex
                                ];

                            }

                        }

                    }

                }

            }

        }

    );

}

// =========================================
// Top 3 Factories
// =========================================

function drawFactoryChart(data){

    const factories = {};

    data.forEach(item=>{

        const name =
            String(item.factory || "").trim();

        if(!name) return;

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

    const sorted = Object.entries(factories)

        .sort((a,b)=>

            b[1].shipments -
            a[1].shipments

        )

        .slice(0,3);

    const labels =
        sorted.map(x=>x[0]);

    const shipments =
        sorted.map(x=>x[1].shipments);

    const containers =
        sorted.map(x=>x[1].containers);

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

                    data:shipments,

                    containers,

                    backgroundColor:"#14b8a6"

                }]

            },

            options:{

                indexAxis:"y",

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        display:false
                    },

                    tooltip:{

                        callbacks:{

                            afterLabel:function(context){

                                return "Containers : " +

                                context.dataset.containers[
                                    context.dataIndex
                                ];

                            }

                        }

                    }

                }

            }

        }

    );

}
// =========================================
// Sort Entry
// =========================================

document
.getElementById("entryHeader")
.addEventListener("click",()=>{

    shipments.sort((a,b)=>{

        return entryAscending

            ? String(a.entry).localeCompare(
                String(b.entry),
                undefined,
                {numeric:true}
              )

            : String(b.entry).localeCompare(
                String(a.entry),
                undefined,
                {numeric:true}
              );

    });

    entryAscending = !entryAscending;

    applyFilters();

});

// =========================================
// Sort Qty
// =========================================

document
.getElementById("qtyHeader")
.addEventListener("click",()=>{

    shipments.sort((a,b)=>{

        return qtyAscending

            ? Number(a.qty)-Number(b.qty)

            : Number(b.qty)-Number(a.qty);

    });

    qtyAscending = !qtyAscending;

    applyFilters();

});

// =========================================
// Sort ETA
// =========================================

document
.getElementById("etaHeader")
.addEventListener("click",()=>{

    shipments.sort((a,b)=>{

        const d1 = new Date(a.eta);

        const d2 = new Date(b.eta);

        return etaAscending

            ? d1-d2

            : d2-d1;

    });

    etaAscending = !etaAscending;

    applyFilters();

});

// =========================================
// Navigation
// =========================================

const dashboardBtn =
document.getElementById("dashboardBtn");

const containersBtn =
document.getElementById("containersBtn");

const dashboardPage =
document.getElementById("dashboardPage");

const containersPage =
document.getElementById("containersPage");

dashboardBtn.addEventListener("click",()=>{

    dashboardPage.style.display="block";

    containersPage.style.display="none";

    dashboardBtn.classList.add("active");

    containersBtn.classList.remove("active");

});

containersBtn.addEventListener("click",()=>{

    dashboardPage.style.display="none";

    containersPage.style.display="block";

    dashboardBtn.classList.remove("active");

    containersBtn.classList.add("active");

    loadContainers();

});

// =========================================
// Initial State
// =========================================

dashboardPage.style.display = "block";

containersPage.style.display = "none";
