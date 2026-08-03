const API_URL =
"https://script.google.com/macros/s/AKfycbyZIUvCUj4vLx35pg0sqMziD3tikSzVrLuaJagmneQJUoeCLxJ5V-grqQ1AqjZcic_LGg/exec";

let shipments = [];
let containers = [];
let monthChart = null;
let factoryChart = null;

let etaAscending = true;
let entryAscending = true;
let qtyAscending = true;

// =========================================
// استخراج عدد الحاويات
// يدعم:
// 2X40HQ
// 3X20GP
// 1 x 40HQ
// =========================================

function getContainerCount(value){

    const match = String(value || "").match(/\d+/);

    return match ? Number(match[0]) : 0;

}

// =========================================
// Load Data
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

// =========================
// Load Containers
// =========================

async function loadContainers(){

    try{

        const response =
            await fetch(API_URL + "?sheet=CONTAINERS");

        containers =
            await response.json();

        alert(JSON.stringify(containers[0], null, 2));

        renderContainers(containers);

        updateContainerKPIs(containers);

    }catch(err){

        console.error(err);

    }

}

// =========================================
// Render Containers
// =========================================

function renderContainers(data){

    const tbody =
        document.querySelector("#containerTable tbody");

    tbody.innerHTML = "";

    data.forEach(item=>{

        tbody.innerHTML += `

        <tr>

            <td>${item.container}</td>

            <td>${item.entry}</td>

            <td>${item.sn}</td>

            <td>${item.eta}</td>

            <td>${item.department}</td>

            <td>${item.warehouse || "-"}</td>

            <td>${item.status || "-"}</td>

        </tr>

        `;

    });

}

// =========================================
// Container KPIs
// =========================================

function updateContainerKPIs(data){

    document.getElementById("containerTotal").textContent =
        data.length.toLocaleString();

    const received = data.filter(x =>
        String(x.status || "").trim() !== ""
    );

    document.getElementById("containerReceived").textContent =
        received.length.toLocaleString();

    const distributed = data.filter(x =>
        String(x.distribution || "")
        .includes("تم")
    );

    document.getElementById("containerDistributed").textContent =
        distributed.length.toLocaleString();

    document.getElementById("containerWaiting").textContent =
        (data.length - distributed.length).toLocaleString();

}

// =========================================
// Render Table
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

            <td>${Number(item.qty).toLocaleString()}</td>

            <td>${item.etd}</td>

            <td>${item.eta}</td>

            <td>${item.pol}</td>

            <td>${item.pod}</td>

        </tr>

        `;

    });

}
// =========================================
// Fill Department Filter
// =========================================

function populateDepartmentFilter(data){

    const select =
        document.getElementById("departmentFilter");

    select.innerHTML =
        '<option value="">All Departments</option>';

    const departments = [...new Set(

        data
            .map(item => String(item.department || "").trim())
            .filter(item => item !== "")

    )].sort((a,b)=>a.localeCompare(b));

    departments.forEach(dep=>{

        const option =
            document.createElement("option");

        option.value = dep;

        option.textContent = dep;

        select.appendChild(option);

    });

}

// =========================================
// Fill POL Filter
// =========================================

function populatePOLFilter(data){

    const select =
        document.getElementById("polFilter");

    select.innerHTML =
        '<option value="">All POL</option>';

    const values = [...new Set(

        data
            .map(item => String(item.pol || "").trim())
            .filter(item => item !== "")

    )].sort((a,b)=>a.localeCompare(b));

    values.forEach(value=>{

        const option =
            document.createElement("option");

        option.value = value;

        option.textContent = value;

        select.appendChild(option);

    });

}

// =========================================
// Fill POD Filter
// =========================================

function populatePODFilter(data){

    const select =
        document.getElementById("podFilter");

    select.innerHTML =
        '<option value="">All POD</option>';

    const values = [...new Set(

        data
            .map(item => String(item.pod || "").trim())
            .filter(item => item !== "")

    )].sort((a,b)=>a.localeCompare(b));

    values.forEach(value=>{

        const option =
            document.createElement("option");

        option.value = value;

        option.textContent = value;

        select.appendChild(option);

    });

}

// =========================================
// Fill Factory Filter
// =========================================

function populateFactoryFilter(data){

    const select =
        document.getElementById("factoryFilter");

    select.innerHTML =
        '<option value="">All Factories</option>';

    const values = [...new Set(

        data
            .map(item => String(item.factory || "").trim())
            .filter(item => item !== "")

    )].sort((a,b)=>a.localeCompare(b));

    values.forEach(value=>{

        const option =
            document.createElement("option");

        option.value = value;

        option.textContent = value;

        select.appendChild(option);

    });

}
// =========================================
// Search + Filters
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
// Event Listeners
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

loadData();
// =========================================
// Sort Entry
// =========================================

document.getElementById("entryHeader").addEventListener("click",()=>{

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

document.getElementById("qtyHeader").addEventListener("click",()=>{

    shipments.sort((a,b)=>{

        return qtyAscending

            ? Number(a.qty || 0) - Number(b.qty || 0)

            : Number(b.qty || 0) - Number(a.qty || 0);

    });

    qtyAscending = !qtyAscending;

    applyFilters();

});

// =========================================
// Sort ETA
// =========================================

document.getElementById("etaHeader").addEventListener("click",()=>{

    shipments.sort((a,b)=>{

        const d1 = new Date(a.eta || "");

        const d2 = new Date(b.eta || "");

        return etaAscending

            ? d1 - d2

            : d2 - d1;

    });

    etaAscending = !etaAscending;

    applyFilters();

});

// =========================================
// KPI Cards
// =========================================

function updateKPIs(data){

    // =========================
    // Total Shipments (Unique Entry)
    // =========================

    const uniqueEntries = new Set(

        data
            .map(row => String(row.entry || "").trim())
            .filter(entry => entry !== "")

    );

    document.getElementById("totalShipments").textContent =

        uniqueEntries.size.toLocaleString();

    // =========================
    // Total Containers
    // =========================

    const totalContainers = data.reduce((sum,row)=>{

        return sum + getContainerCount(row.hq);

    },0);

    document.getElementById("totalContainers").textContent =

        totalContainers.toLocaleString();

    // =========================
    // Containers Arrived / On Sea
    // =========================

    let arrived = 0;
    let onSea = 0;

    data.forEach(row=>{

        const containers = getContainerCount(row.hq);

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

        containersPerMonth[month] += getContainerCount(item.hq);

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

                    backgroundColor:"rgba(54,162,235,0.25)",

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

                            title:function(context){

                                return context[0].label;

                            },

                            label:function(context){

                                return "Shipments : " + context.raw;

                            },

                            afterLabel:function(context){

                                return "Containers : " +
                                    context.dataset.containers[context.dataIndex];

                            }

                        }

                    }

                },

                scales:{

                    x:{

                        grid:{
                            display:false
                        }

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
// =========================================
// Top 3 Factories Chart
// =========================================

function drawFactoryChart(data){

    const factories = {};

    data.forEach(item=>{

        const factory = String(item.factory || "").trim();

        if(factory === "") return;

        if(!factories[factory]){

            factories[factory] = {

                shipments:0,

                containers:0

            };

        }

        factories[factory].shipments++;

        factories[factory].containers += getContainerCount(item.hq);

    });

    const sorted = Object.entries(factories)

        .sort((a,b)=>{

            if(b[1].shipments !== a[1].shipments){

                return b[1].shipments - a[1].shipments;

            }

            return a[0].localeCompare(b[0]);

        })

        .slice(0,3);

    const labels = sorted.map(item=>item[0]);

    const shipmentsCount = sorted.map(item=>item[1].shipments);

    const containersCount = sorted.map(item=>item[1].containers);

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

                            title:function(context){

                                return context[0].label;

                            },

                            label:function(context){

                                return "Shipments : " + context.raw;

                            },

                            afterLabel:function(context){

                                return "Containers : " +
                                    context.dataset.containers[context.dataIndex];

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
// Page Navigation
// =========================================

// =========================
// Navigation
// =========================

const dashboardBtn =
    document.getElementById("dashboardBtn");

const containersBtn =
    document.getElementById("containersBtn");

const dashboardPage =
    document.getElementById("dashboardPage");

const containersPage =
    document.getElementById("containersPage");

dashboardBtn.addEventListener("click", () => {

    dashboardPage.style.display = "block";

    containersPage.style.display = "none";

    dashboardBtn.classList.add("active");

    containersBtn.classList.remove("active");

});

containersBtn.addEventListener("click", () => {

    dashboardPage.style.display = "none";

    containersPage.style.display = "block";

    dashboardBtn.classList.remove("active");

    containersBtn.classList.add("active");

    loadContainers();

});
