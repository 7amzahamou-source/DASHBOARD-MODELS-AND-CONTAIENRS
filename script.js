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
// Load Dashboard Data
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

        alert("Unable to load Google Sheets data.");

    }

}

// =========================================
// Load Containers Data
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
// Start Dashboard
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

        <td>${item.department}</td>

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

            .filter(x=>x!=="")

    )]

    .sort()

    .forEach(item=>{

        warehouse.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

    [...new Set(

        data

            .map(x=>String(x.department || "").trim())

            .filter(x=>x!=="")

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

     drawWarehouseChart(filteredContainers);

     drawWarehouseStatusChart(filteredContainers);

}
// =========================================
// Container Filter Events
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
// Render Dashboard Table
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
// Department Filter
// =========================================

function populateDepartmentFilter(data){

    const select =
        document.getElementById("departmentFilter");

    select.innerHTML =
        '<option value="">All Departments</option>';

    [...new Set(

        data
            .map(x=>String(x.department || "").trim())
            .filter(x=>x!=="")

    )]

    .sort()

    .forEach(item=>{

        select.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

}

// =========================================
// POL Filter
// =========================================

function populatePOLFilter(data){

    const select =
        document.getElementById("polFilter");

    select.innerHTML =
        '<option value="">All POL</option>';

    [...new Set(

        data
            .map(x=>String(x.pol || "").trim())
            .filter(x=>x!=="")

    )]

    .sort()

    .forEach(item=>{

        select.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

}

// =========================================
// POD Filter
// =========================================

function populatePODFilter(data){

    const select =
        document.getElementById("podFilter");

    select.innerHTML =
        '<option value="">All POD</option>';

    [...new Set(

        data
            .map(x=>String(x.pod || "").trim())
            .filter(x=>x!=="")

    )]

    .sort()

    .forEach(item=>{

        select.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

}

// =========================================
// Factory Filter
// =========================================

function populateFactoryFilter(data){

    const select =
        document.getElementById("factoryFilter");

    select.innerHTML =
        '<option value="">All Factories</option>';

    [...new Set(

        data
            .map(x=>String(x.factory || "").trim())
            .filter(x=>x!=="")

    )]

    .sort()

    .forEach(item=>{

        select.innerHTML +=
            `<option value="${item}">${item}</option>`;

    });

}
// =========================================
// Dashboard Filters
// =========================================

function applyFilters(){

    const keyword =
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

    const filtered = shipments.filter(item=>{

        const searchMatch =

            String(item.entry || "").toLowerCase().includes(keyword) ||

            String(item.factory || "").toLowerCase().includes(keyword) ||

            String(item.model || "").toLowerCase().includes(keyword) ||

            String(item.description || "").toLowerCase().includes(keyword) ||

            String(item.department || "").toLowerCase().includes(keyword) ||

            String(item.pol || "").toLowerCase().includes(keyword) ||

            String(item.pod || "").toLowerCase().includes(keyword) ||

            String(item.eta || "").toLowerCase().includes(keyword);

        const departmentMatch =

            department === "" ||

            item.department === department;

        const polMatch =

            pol === "" ||

            item.pol === pol;

        const podMatch =

            pod === "" ||

            item.pod === pod;

        const factoryMatch =

            factory === "" ||

            item.factory === factory;

        const arrived =
            String(item.bayan || "").trim() !== "";

        const statusMatch =

            status === "" ||

            (status === "sea" && !arrived) ||

            (status === "arrived" && arrived);

        return searchMatch &&
               departmentMatch &&
               polMatch &&
               podMatch &&
               factoryMatch &&
               statusMatch;

    });

    renderTable(filtered);

    updateKPIs(filtered);

    drawMonthChart(filtered);

    drawFactoryChart(filtered);

}

// =========================================
// Dashboard Events
// =========================================

document
    .getElementById("searchInput")
    .addEventListener("input", applyFilters);

document
    .getElementById("departmentFilter")
    .addEventListener("change", applyFilters);

document
    .getElementById("polFilter")
    .addEventListener("change", applyFilters);

document
    .getElementById("podFilter")
    .addEventListener("change", applyFilters);

document
    .getElementById("factoryFilter")
    .addEventListener("change", applyFilters);

document
    .getElementById("statusFilter")
    .addEventListener("change", applyFilters);

// =========================================
// Sort Entry
// =========================================

document.getElementById("entryHeader")
.addEventListener("click",()=>{

    shipments.sort((a,b)=>{

        return entryAscending

            ? String(a.entry || "").localeCompare(
                String(b.entry || ""),
                undefined,
                {numeric:true}
            )

            : String(b.entry || "").localeCompare(
                String(a.entry || ""),
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

document.getElementById("qtyHeader")
.addEventListener("click",()=>{

    shipments.sort((a,b)=>{

        return qtyAscending

            ? Number(a.qty || 0) -
              Number(b.qty || 0)

            : Number(b.qty || 0) -
              Number(a.qty || 0);

    });

    qtyAscending = !qtyAscending;

    applyFilters();

});

// =========================================
// Sort ETA
// =========================================

document.getElementById("etaHeader")
.addEventListener("click",()=>{

    shipments.sort((a,b)=>{

        const d1 =
            new Date(a.eta || "");

        const d2 =
            new Date(b.eta || "");

        return etaAscending

            ? d1-d2

            : d2-d1;

    });

    etaAscending = !etaAscending;

    applyFilters();

});
// =========================================
// Dashboard KPIs
// =========================================

function updateKPIs(data){

    // Total Shipments (Unique Entry)

    const uniqueEntries = new Set(

        data
            .map(row => String(row.entry || "").trim())
            .filter(entry => entry !== "")

    );

    document.getElementById("totalShipments").textContent =
        uniqueEntries.size.toLocaleString();

    // Total Containers

    const totalContainers = data.reduce((sum,row)=>{

        return sum + getContainerCount(row.hq);

    },0);

    document.getElementById("totalContainers").textContent =
        totalContainers.toLocaleString();

    // Arrived / On Sea

    let arrived = 0;
    let onSea = 0;

    data.forEach(row=>{

        const containers =
            getContainerCount(row.hq);

        if(String(row.bayan || "").trim() !== ""){

            arrived += containers;

        }else{

            onSea += containers;

        }

    });

    document.getElementById("containersArrived").textContent =
        arrived.toLocaleString();

    document.getElementById("containersOnSea").textContent =
        onSea.toLocaleString();

}

// =========================================
// Containers by ETA Month
// =========================================

function drawMonthChart(data){

    const months = [

        "Jan","Feb","Mar","Apr","May","Jun",

        "Jul","Aug","Sep","Oct","Nov","Dec"

    ];

    const shipmentsPerMonth = new Array(12).fill(0);

    const containersPerMonth = new Array(12).fill(0);

    data.forEach(item=>{

        if(!item.eta) return;

        const date = new Date(item.eta);

        if(isNaN(date)) return;

        const month = date.getMonth();

        shipmentsPerMonth[month]++;

        containersPerMonth[month] +=
            getContainerCount(item.hq);

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

                    label:"Shipments",

                    data:shipmentsPerMonth,

                    containers:containersPerMonth,

                    backgroundColor:"rgba(54,162,235,.25)",

                    borderColor:"rgba(54,162,235,1)",

                    borderWidth:1,

                    borderRadius:6,

                    maxBarThickness:40

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                interaction:{

                    intersect:false,

                    mode:"index"

                },

                plugins:{

                    legend:{
                        display:false
                    },

                    tooltip:{

                        callbacks:{

                            label:function(context){

                                return "Shipments : " +
                                       context.raw;

                            },

                            afterLabel:function(context){

                                return "Containers : " +

                                context.dataset.containers[
                                    context.dataIndex
                                ];

                            }

                        }

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
// Top 3 Factories Chart
// =========================================

function drawFactoryChart(data){

    const factories = {};

    data.forEach(item=>{

        const factory = String(item.factory || "").trim();

        if(factory==="") return;

        if(!factories[factory]){

            factories[factory]={

                shipments:0,

                containers:0

            };

        }

        factories[factory].shipments++;

        factories[factory].containers +=
            getContainerCount(item.hq);

    });

    const sorted = Object.entries(factories)

        .sort((a,b)=>{

            if(b[1].shipments !== a[1].shipments){

                return b[1].shipments-a[1].shipments;

            }

            return a[0].localeCompare(b[0]);

        })

        .slice(0,3);

    const labels =
        sorted.map(x=>x[0]);

    const shipmentsCount =
        sorted.map(x=>x[1].shipments);

    const containersCount =
        sorted.map(x=>x[1].containers);

    if(factoryChart){

        factoryChart.destroy();

    }

    factoryChart = new Chart(

        document.getElementById("factoryChart"),

        {

            type:"bar",

            data:{

                labels:labels,

                datasets:[{

                    label:"Shipments",

                    data:shipmentsCount,

                    containers:containersCount,

                    backgroundColor:"rgba(75,192,192,.25)",

                    borderColor:"rgba(75,192,192,1)",

                    borderWidth:1,

                    borderRadius:6,

                    maxBarThickness:28

                }]

            },

            options:{

                indexAxis:"y",

                responsive:true,

                maintainAspectRatio:false,

                interaction:{

                    intersect:false,

                    mode:"index"

                },

                plugins:{

                    legend:{
                        display:false
                    },

                    tooltip:{

                        callbacks:{

                            label:function(context){

                                return "Shipments : " + context.raw;

                            },

                            afterLabel:function(context){

                                return "Containers : " +

                                context.dataset.containers[
                                    context.dataIndex
                                ];

                            }

                        }

                    }

                },

                scales:{

                    x:{

                        beginAtZero:true,

                        ticks:{

                            precision:0

                        }

                    },

                    y:{

                        grid:{

                            display:false

                        }

                    }

                }

            }

        }

    );

}

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
function drawWarehouseChart(data){

}

function drawWarehouseStatusChart(data){

}
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

            warehouses[warehouse]={

                received:new Set(),

                waiting:new Set()

            };

        }

        if(String(item.status || "").trim()=="استلمت"){

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

    const received = labels.map(

        x=>warehouses[x].received.size

    );

    const waiting = labels.map(

        x=>warehouses[x].waiting.size

    );

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

                    x:{
                        stacked:false
                    },

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
