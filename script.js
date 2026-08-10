// =========================================================
// LOGISTICS CONTROL TOWER
// SCRIPT.JS
// =========================================================


// =========================================================
// API
// =========================================================

const API_URL =
"https://script.google.com/macros/s/AKfycbyZIUvCUj4vLx35pg0sqMziD3tikSzVrLuaJagmneQJUoeCLxJ5V-grqQ1AqjZcic_LGg/exec";


// =========================================================
// DATA
// =========================================================

let shipments = [];

let containers = [];

let filteredShipments = [];

let filteredContainers = [];


// =========================================================
// CHARTS
// =========================================================

let monthChart = null;

let factoryChart = null;

let warehouseStatusChart = null;


// =========================================================
// SORTING
// =========================================================

let etaAscending = true;

let entryAscending = true;

let qtyAscending = true;


// =========================================================
// CONTAINERS PAGE
// =========================================================

let containersLoaded = false;


// =========================================================
// HELPERS
// =========================================================

// Keep container quantity exactly as it comes
// from Google Sheets.
//
// Important:
// A container can contain multiple models.
//
// Example:
//
// 800 400
// 600 400 200
//
// Therefore DO NOT use Number() here.

function formatQuantity(value){

    if(value === null || value === undefined){

        return "";

    }

    return String(value).trim();

}


// =========================================================
// Container Count
// =========================================================

// Used only when we need the number of containers
// represented by a MODELS row.

function getContainerCount(value){

    if(value === null || value === undefined){

        return 0;

    }

    const text =
        String(value).trim();

    if(!text){

        return 0;

    }

    const numbers =
        text.match(/\d+/g);

    if(!numbers){

        return 0;

    }

    return numbers.length;

}


// =========================================================
// Date Helper
// =========================================================

function formatDate(date){

    if(!date){

        return "";

    }

    const d =
        new Date(date);

    if(isNaN(d)){

        return "";

    }

    return d.toLocaleDateString(
        "en-GB",
        {
            day:"2-digit",
            month:"short",
            year:"numeric"
        }
    );

}


// =========================================================
// LOAD DASHBOARD DATA
// =========================================================

async function loadData(){

    try{

        const response =
            await fetch(API_URL);

        if(!response.ok){

            throw new Error(
                "Dashboard API request failed"
            );

        }

        shipments =
            await response.json();

        if(!Array.isArray(shipments)){

            throw new Error(
                "Invalid dashboard data"
            );

        }

        filteredShipments =
            [...shipments];


        populateDepartmentFilter(
            shipments
        );

        populatePOLFilter(
            shipments
        );

        populatePODFilter(
            shipments
        );

        populateFactoryFilter(
            shipments
        );


        applyFilters();

    }

    catch(error){

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


// =========================================================
// LOAD CONTAINERS DATA
// =========================================================

async function loadContainers(){

    try{

        const response =
            await fetch(
                API_URL + "?sheet=CONTAINERS"
            );

        if(!response.ok){

            throw new Error(
                "Containers API request failed"
            );

        }

        containers =
            await response.json();

        if(!Array.isArray(containers)){

            throw new Error(
                "Invalid containers data"
            );

        }


        containers.sort((a,b)=>{

            return new Date(a.eta) -
                   new Date(b.eta);

        });


        filteredContainers =
            [...containers];


        fillContainerFilters(
            filteredContainers
        );


        applyContainerFilters();

    }

    catch(error){

        console.error(
            "Containers Error:",
            error
        );

    }

}


// =========================================================
// INITIAL DASHBOARD LOAD
// =========================================================

loadData();
// =========================================================
// DASHBOARD KPIs
// =========================================================

function updateKPIs(data){

    const totalShipments =
        data.length;

    let totalContainers = 0;

    let arrived = 0;

    let sea = 0;


    data.forEach(item=>{

        const count =
            getContainerCount(item.hq);

        totalContainers += count;


        if(
            String(item.bayan || "").trim()
        ){

            arrived += count;

        }
        else{

            sea += count;

        }

    });


    document.getElementById(
        "totalShipments"
    ).textContent =
        totalShipments.toLocaleString();


    document.getElementById(
        "totalContainers"
    ).textContent =
        totalContainers.toLocaleString();


    document.getElementById(
        "containersArrived"
    ).textContent =
        arrived.toLocaleString();


    document.getElementById(
        "containersOnSea"
    ).textContent =
        sea.toLocaleString();

}


// =========================================================
// DEPARTMENT FILTER
// =========================================================

function populateDepartmentFilter(data){

    const select =
        document.getElementById(
            "departmentFilter"
        );


    select.innerHTML = `
        <option value="">
            All Departments
        </option>
    `;


    const values = [

        ...new Set(

            data
            .map(item=>item.department)
            .filter(Boolean)

        )

    ].sort();


    values.forEach(value=>{

        select.innerHTML += `

            <option value="${value}">
                ${value}
            </option>

        `;

    });

}


// =========================================================
// POL FILTER
// =========================================================

function populatePOLFilter(data){

    const select =
        document.getElementById(
            "polFilter"
        );


    select.innerHTML = `
        <option value="">
            All POL
        </option>
    `;


    const values = [

        ...new Set(

            data
            .map(item=>item.pol)
            .filter(Boolean)

        )

    ].sort();


    values.forEach(value=>{

        select.innerHTML += `

            <option value="${value}">
                ${value}
            </option>

        `;

    });

}


// =========================================================
// POD FILTER
// =========================================================

function populatePODFilter(data){

    const select =
        document.getElementById(
            "podFilter"
        );


    select.innerHTML = `
        <option value="">
            All POD
        </option>
    `;


    const values = [

        ...new Set(

            data
            .map(item=>item.pod)
            .filter(Boolean)

        )

    ].sort();


    values.forEach(value=>{

        select.innerHTML += `

            <option value="${value}">
                ${value}
            </option>

        `;

    });

}


// =========================================================
// FACTORY FILTER
// =========================================================

function populateFactoryFilter(data){

    const select =
        document.getElementById(
            "factoryFilter"
        );


    select.innerHTML = `
        <option value="">
            All Factories
        </option>
    `;


    const values = [

        ...new Set(

            data
            .map(item=>item.factory)
            .filter(Boolean)

        )

    ].sort();


    values.forEach(value=>{

        select.innerHTML += `

            <option value="${value}">
                ${value}
            </option>

        `;

    });

}
// =========================================================
// APPLY DASHBOARD FILTERS
// =========================================================

function applyFilters(){

    let data = [...shipments];


    const search =
        document.getElementById(
            "searchInput"
        ).value
        .toLowerCase()
        .trim();


    const department =
        document.getElementById(
            "departmentFilter"
        ).value;


    const pol =
        document.getElementById(
            "polFilter"
        ).value;


    const pod =
        document.getElementById(
            "podFilter"
        ).value;


    const factory =
        document.getElementById(
            "factoryFilter"
        ).value;


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    // =====================================================
    // SEARCH
    // =====================================================

    if(search){

        data = data.filter(item=>{

            return (

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

        });

    }


    // =====================================================
    // DEPARTMENT
    // =====================================================

    if(department){

        data = data.filter(item=>

            String(item.department || "") ===
            String(department)

        );

    }


    // =====================================================
    // POL
    // =====================================================

    if(pol){

        data = data.filter(item=>

            String(item.pol || "") ===
            String(pol)

        );

    }


    // =====================================================
    // POD
    // =====================================================

    if(pod){

        data = data.filter(item=>

            String(item.pod || "") ===
            String(pod)

        );

    }


    // =====================================================
    // FACTORY
    // =====================================================

    if(factory){

        data = data.filter(item=>

            String(item.factory || "") ===
            String(factory)

        );

    }


    // =====================================================
    // STATUS
    // =====================================================

    if(status === "sea"){

        data = data.filter(item=>

            !String(item.bayan || "").trim()

        );

    }


    if(status === "arrived"){

        data = data.filter(item=>

            String(item.bayan || "").trim()

        );

    }


    // =====================================================
    // SAVE FILTERED DATA
    // =====================================================

    filteredShipments =
        data;


    // =====================================================
    // RENDER
    // =====================================================

    renderTable(
        filteredShipments
    );


    updateKPIs(
        filteredShipments
    );


    drawMonthChart(
        filteredShipments
    );


    drawFactoryChart(
        filteredShipments
    );

}


// =========================================================
// RENDER SHIPMENTS TABLE
// =========================================================

function renderTable(data){

    const tbody =
        document.querySelector(
            "#shipmentTable tbody"
        );


    tbody.innerHTML = "";


    data.forEach(item=>{

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${item.entry || ""}
            </td>

            <td>
                ${item.factory || ""}
            </td>

            <td>
                ${item.model || ""}
            </td>

            <td>
                ${item.description || ""}
            </td>

            <td style="text-align:center;">
                ${formatQuantity(item.qty)}
            </td>

            <td style="text-align:center;">
                ${item.etd || ""}
            </td>

            <td style="text-align:center;">
                ${item.eta || ""}
            </td>

            <td style="text-align:center;">
                ${item.pol || ""}
            </td>

            <td style="text-align:center;">
                ${item.pod || ""}
            </td>

        `;


        tbody.appendChild(tr);

    });

}


// =========================================================
// SORT BY ENTRY
// =========================================================

function sortByEntry(){

    filteredShipments.sort((a,b)=>{

        const result =
            String(a.entry || "")
            .localeCompare(
                String(b.entry || ""),
                undefined,
                {
                    numeric:true,
                    sensitivity:"base"
                }
            );


        return entryAscending
            ? result
            : -result;

    });


    entryAscending =
        !entryAscending;


    renderTable(
        filteredShipments
    );

}


// =========================================================
// SORT BY QTY
// =========================================================

function sortByQty(){

    filteredShipments.sort((a,b)=>{

        const aValue =
            parseFloat(
                String(a.qty || "")
                .replace(/[^\d.-]/g,"")
            ) || 0;


        const bValue =
            parseFloat(
                String(b.qty || "")
                .replace(/[^\d.-]/g,"")
            ) || 0;


        return qtyAscending
            ? aValue - bValue
            : bValue - aValue;

    });


    qtyAscending =
        !qtyAscending;


    renderTable(
        filteredShipments
    );

}


// =========================================================
// SORT BY ETA
// =========================================================

function sortByETA(){

    filteredShipments.sort((a,b)=>{

        const aDate =
            new Date(a.eta);

        const bDate =
            new Date(b.eta);


        return etaAscending
            ? aDate - bDate
            : bDate - aDate;

    });


    etaAscending =
        !etaAscending;


    renderTable(
        filteredShipments
    );

}
// =========================================================
// DASHBOARD CHARTS
// =========================================================


// =========================================================
// CONTAINERS BY ETA MONTH
// =========================================================

function drawMonthChart(data){

    const months = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"

    ];


    const shipmentsCount =
        Array(12).fill(0);


    const containersCount =
        Array(12).fill(0);


    data.forEach(item=>{

        if(!item.eta){

            return;

        }


        const date =
            new Date(item.eta);


        if(isNaN(date)){

            return;

        }


        const month =
            date.getMonth();


        shipmentsCount[month]++;


        containersCount[month] +=
            getContainerCount(item.hq);

    });


    if(monthChart){

        monthChart.destroy();

    }


    monthChart = new Chart(

        document.getElementById(
            "monthChart"
        ),

        {

            type:"bar",


            data:{

                labels:months,


                datasets:[{

                    label:"Containers",

                    data:containersCount,

                    backgroundColor:
                        "#2563EB",

                    hoverBackgroundColor:
                        "#1D4ED8",

                    borderRadius:8,

                    borderSkipped:false

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

                                return context[0]
                                    .label;

                            },


                            label:function(context){

                                return (

                                    " Containers: " +

                                    containersCount[
                                        context.dataIndex
                                    ]

                                );

                            },


                            afterLabel:function(context){

                                return (

                                    " Shipments: " +

                                    shipmentsCount[
                                        context.dataIndex
                                    ]

                                );

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


// =========================================================
// TOP 3 FACTORIES
// =========================================================

function drawFactoryChart(data){

    const factories = {};


    data.forEach(item=>{

        const factory =
            item.factory || "Unknown";


        if(!factories[factory]){

            factories[factory] = {

                shipments:0,

                containers:0

            };

        }


        factories[factory].shipments++;


        factories[factory].containers +=
            getContainerCount(item.hq);

    });


    const topFactories =

        Object.entries(factories)

        .sort((a,b)=>

            b[1].shipments -
            a[1].shipments

        )

        .slice(0,3);


    const labels =
        topFactories.map(
            item=>item[0]
        );


    const shipmentValues =
        topFactories.map(
            item=>item[1].shipments
        );


    const containerValues =
        topFactories.map(
            item=>item[1].containers
        );


    if(factoryChart){

        factoryChart.destroy();

    }


    factoryChart = new Chart(

        document.getElementById(
            "factoryChart"
        ),

        {

            type:"bar",


            data:{

                labels:labels,


                datasets:[{

                    label:"Shipments",

                    data:shipmentValues,

                    backgroundColor:
                        "#10B981",

                    hoverBackgroundColor:
                        "#059669",

                    borderRadius:8,

                    borderSkipped:false

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

                            label:function(context){

                                return (

                                    " Shipments: " +

                                    shipmentValues[
                                        context.dataIndex
                                    ]

                                );

                            },


                            afterLabel:function(context){

                                return (

                                    " Containers: " +

                                    containerValues[
                                        context.dataIndex
                                    ]

                                );

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


// =========================================================
// DASHBOARD EVENTS
// =========================================================

document
.getElementById("searchInput")
.addEventListener(
    "input",
    applyFilters
);


document
.getElementById("departmentFilter")
.addEventListener(
    "change",
    applyFilters
);


document
.getElementById("polFilter")
.addEventListener(
    "change",
    applyFilters
);


document
.getElementById("podFilter")
.addEventListener(
    "change",
    applyFilters
);


document
.getElementById("factoryFilter")
.addEventListener(
    "change",
    applyFilters
);


document
.getElementById("statusFilter")
.addEventListener(
    "change",
    applyFilters
);


document
.getElementById("entryHeader")
.addEventListener(
    "click",
    sortByEntry
);


document
.getElementById("qtyHeader")
.addEventListener(
    "click",
    sortByQty
);


document
.getElementById("etaHeader")
.addEventListener(
    "click",
    sortByETA
);
// =========================================================
// CONTAINERS STATUS
// =========================================================


// =========================================================
// CONTAINER KPIs
// =========================================================

function updateContainerKPIs(data){

    // Total Containers

    document.getElementById(
        "containerTotal"
    ).textContent =
        data.length.toLocaleString();


    // Destination Ports

    const destinations = new Set();

    data.forEach(item=>{

        const pod =
            String(item.pod || "").trim();

        if(pod){

            destinations.add(pod);

        }

    });


    document.getElementById(
        "destinationPorts"
    ).textContent =
        destinations.size.toLocaleString();


    // Arriving This Month

    const today =
        new Date();

    const currentMonth =
        today.getMonth();

    const currentYear =
        today.getFullYear();


    const arrivingThisMonth =
        data.filter(item=>{

            if(!item.eta){

                return false;

            }


            const date =
                new Date(item.eta);


            if(isNaN(date)){

                return false;

            }


            return (

                date.getMonth() ===
                currentMonth

                &&

                date.getFullYear() ===
                currentYear

            );

        });


    document.getElementById(
        "arrivingMonth"
    ).textContent =
        arrivingThisMonth.length.toLocaleString();

}


// =========================================================
// CONTAINER FILTER OPTIONS
// =========================================================

function fillContainerFilters(data){

    const transitSelect =
        document.getElementById(
            "transitFilter"
        );


    const podSelect =
        document.getElementById(
            "podContainerFilter"
        );


    // -----------------------------------------------------
    // Transit
    // -----------------------------------------------------

    transitSelect.innerHTML = `

        <option value="">
            All Transit
        </option>

    `;


    const transitValues = new Set();


    data.forEach(item=>{

        if(item.transit1){

            transitValues.add(
                String(item.transit1).trim()
            );

        }

        if(item.transit2){

            transitValues.add(
                String(item.transit2).trim()
            );

        }

        if(item.transit3){

            transitValues.add(
                String(item.transit3).trim()
            );

        }

    });


    [...transitValues]

        .filter(Boolean)

        .sort()

        .forEach(value=>{

            transitSelect.innerHTML += `

                <option value="${value}">
                    ${value}
                </option>

            `;

        });


    // -----------------------------------------------------
    // Destination
    // -----------------------------------------------------

    podSelect.innerHTML = `

        <option value="">
            All Destinations
        </option>

    `;


    const destinations = [

        ...new Set(

            data

            .map(item=>
                String(item.pod || "").trim()
            )

            .filter(Boolean)

        )

    ].sort();


    destinations.forEach(value=>{

        podSelect.innerHTML += `

            <option value="${value}">
                ${value}
            </option>

        `;

    });

}


// =========================================================
// CURRENT TRANSIT
// =========================================================

function getCurrentTransit(item){

    if(
        String(item.transit3 || "").trim()
    ){

        return String(
            item.transit3
        ).trim();

    }


    if(
        String(item.transit2 || "").trim()
    ){

        return String(
            item.transit2
        ).trim();

    }


    if(
        String(item.transit1 || "").trim()
    ){

        return String(
            item.transit1
        ).trim();

    }


    return "";

}


// =========================================================
// BUILD ROUTE
// =========================================================

function buildRoute(item){

    const route = [];


    // Transit 1
    if(String(item.transit1 || "").trim()){

        route.push(
            String(item.transit1).trim()
        );

    }


    // Transit 2
    if(String(item.transit2 || "").trim()){

        route.push(
            String(item.transit2).trim()
        );

    }


    // Transit 3
    if(String(item.transit3 || "").trim()){

        route.push(
            String(item.transit3).trim()
        );

    }


    // Transit 4
    if(String(item.transit4 || "").trim()){

        route.push(
            String(item.transit4).trim()
        );

    }


    // Transit 5
    if(String(item.transit5 || "").trim()){

        route.push(
            String(item.transit5).trim()
        );

    }


    // Destination
    if(String(item.pod || "").trim()){

        route.push(
            String(item.pod).trim()
        );

    }


    return route;

}


// =========================================================
// RENDER CONTAINERS TABLE
// =========================================================

function renderContainers(data){

    const tbody =
        document.querySelector(
            "#containerTable tbody"
        );

    tbody.innerHTML = "";


    data.forEach(item => {

        // =================================================
        // MODEL
        // =================================================
        // "&" تعتبر فاصل بين الموديلات
        // وكل موديل يظهر في سطر مستقل
        // =================================================

         const models = String(
         item.model || ""
         )
         .replace(/&/g, " ")
         .split(/\s+/)
         .map(value => value.trim())
         .filter(Boolean);


         const modelHTML = models.length
            ? models.map(model => `
                <div class="multi-line-value">
                    ${model}
                </div>
            `).join("")
            : "";


        // =================================================
        // QTY
        // =================================================
        // نفس فكرة Model:
        // كل قيمة مفصولة بمسافة تظهر في سطر مستقل
        //
        // مثال:
        // 800 400
        //
        // تصبح:
        // 800
        // 400
        // =================================================

        const quantities = String(
            item.qty || ""
        )
        .trim()
        .split(/\s+/)
        .filter(Boolean);


        const qtyHTML = quantities.length
            ? quantities.map(qty => `
                <div class="multi-line-value qty-value">
                    ${qty}
                </div>
            `).join("")
            : "";


        // =================================================
        // ROUTE
        // =================================================

        const route =
            buildRoute(item);


        const routeHTML = route.length
            ? route.map((location, index) => {

                const badge = `
                    <span class="route-badge">
                        ${location}
                    </span>
                `;


                if(index === 0){

                    return badge;

                }


                return `
                    <span class="route-arrow">
                        →
                    </span>

                    ${badge}
                `;

            }).join("")
            : "";


        // =================================================
        // ROW
        // =================================================

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <!-- Entry الحقيقي -->

            <td>
                ${item.entry || ""}
            </td>


            <!-- S/N -->

            <td>
                ${item.sn || ""}
            </td>


            <!-- Container -->

            <td>
                ${item.container || ""}
            </td>


            <!-- Model -->

            <td class="multi-line-cell">
                ${modelHTML}
            </td>


            <!-- QTY -->

            <td class="multi-line-cell qty-cell">
                ${qtyHTML}
            </td>


            <!-- Route -->

            <td class="route-cell">
                ${routeHTML}
            </td>


            <!-- Destination -->

            <td>
                ${item.pod || ""}
            </td>


            <!-- ETA -->

            <td>
                ${item.eta || ""}
            </td>

        `;


        tbody.appendChild(tr);

    });

}


// =========================================================
// APPLY CONTAINER FILTERS
// =========================================================

function applyContainerFilters(){

    let data =
        [...containers];


    const search =
        document.getElementById(
            "containerSearch"
        ).value
        .toLowerCase()
        .trim();


    const transit =
        document.getElementById(
            "transitFilter"
        ).value;


    const pod =
        document.getElementById(
            "podContainerFilter"
        ).value;


    const eta =
        document.getElementById(
            "etaContainerFilter"
        ).value;


    // -----------------------------------------------------
    // Search
    // -----------------------------------------------------

    if(search){

        data = data.filter(item=>{

            return (

                String(item.entry || "")
                    .toLowerCase()
                    .includes(search)

                ||

                String(item.sn || "")
                    .toLowerCase()
                    .includes(search)

                ||

                String(item.container || "")
                    .toLowerCase()
                    .includes(search)

                ||

                String(item.model || "")
                    .toLowerCase()
                    .includes(search)

                ||

                String(item.qty || "")
                    .toLowerCase()
                    .includes(search)

            );

        });

    }


    // -----------------------------------------------------
    // Transit
    // -----------------------------------------------------

    if(transit){

        data = data.filter(item=>{

            const values = [

                item.transit1,

                item.transit2,

                item.transit3

            ]

            .map(value=>
                String(value || "").trim()
            );


            return values.includes(
                transit
            );

        });

    }


    // -----------------------------------------------------
    // Destination
    // -----------------------------------------------------

    if(pod){

        data = data.filter(item=>

            String(item.pod || "").trim() ===
            String(pod).trim()

        );

    }


    // -----------------------------------------------------
    // ETA
    // -----------------------------------------------------

    if(eta){

        data = data.filter(item=>{

            if(!item.eta){

                return false;

            }


            const date =
                new Date(item.eta);


            if(isNaN(date)){

                return false;

            }


            const year =
                date.getFullYear();


            const month =
                String(
                    date.getMonth()+1
                ).padStart(2,"0");


            const day =
                String(
                    date.getDate()
                ).padStart(2,"0");


            return (

                `${year}-${month}-${day}` ===
                eta

            );

        });

    }


    filteredContainers =
        data;


    renderContainers(
        filteredContainers
    );


    updateContainerKPIs(
        filteredContainers
    );


    drawDestinationChart(
        filteredContainers
    );

}
// =========================================================
// CONTAINERS STATUS CHART
// =========================================================

function drawDestinationChart(data){

    const destinations = {};


    data.forEach(item=>{

        const destination =
            String(item.pod || "").trim();


        if(!destination){

            return;

        }


        if(!destinations[destination]){

            destinations[destination] = 0;

        }


        destinations[destination]++;

    });


    const labels =
        Object.keys(destinations);


    const values =
        Object.values(destinations);


    if(warehouseStatusChart){

        warehouseStatusChart.destroy();

    }


    const canvas =
        document.getElementById(
            "warehouseStatusChart"
        );


    if(!canvas){

        return;

    }


    warehouseStatusChart =
        new Chart(

            canvas,

            {

                type:"doughnut",


                data:{

                    labels:labels,


                    datasets:[{

                        data:values,

                        backgroundColor:[

                            "#2563EB",

                            "#10B981",

                            "#F59E0B",

                            "#8B5CF6",

                            "#06B6D4",

                            "#EF4444",

                            "#64748B",

                            "#14B8A6"

                        ],

                        borderWidth:2,

                        borderColor:"#FFFFFF"

                    }]

                },


                options:{

                    responsive:true,

                    maintainAspectRatio:false,


                    plugins:{

                        legend:{

                            position:"bottom",

                            labels:{

                                padding:18,

                                usePointStyle:true,

                                pointStyle:"circle"

                            }

                        },


                        tooltip:{

                            callbacks:{

                                label:function(context){

                                    const total =
                                        values.reduce(
                                            (sum,value)=>
                                                sum + value,
                                            0
                                        );


                                    const value =
                                        context.raw;


                                    const percentage =
                                        total
                                        ? (
                                            value /
                                            total *
                                            100
                                        ).toFixed(1)
                                        : 0;


                                    return (

                                        " " +
                                        context.label +
                                        ": " +
                                        value +
                                        " (" +
                                        percentage +
                                        "%)"

                                    );

                                }

                            }

                        }

                    }

                }

            }

        );

}


// =========================================================
// CONTAINER SEARCH EVENT
// =========================================================

document
.getElementById("containerSearch")
.addEventListener(
    "input",
    applyContainerFilters
);


// =========================================================
// TRANSIT FILTER EVENT
// =========================================================

document
.getElementById("transitFilter")
.addEventListener(
    "change",
    applyContainerFilters
);


// =========================================================
// DESTINATION FILTER EVENT
// =========================================================

document
.getElementById("podContainerFilter")
.addEventListener(
    "change",
    applyContainerFilters
);


// =========================================================
// ETA FILTER EVENT
// =========================================================

document
.getElementById("etaContainerFilter")
.addEventListener(
    "change",
    applyContainerFilters
);


// =========================================================
// NAVIGATION
// =========================================================

const dashboardBtn =
    document.getElementById(
        "dashboardBtn"
    );


const containersBtn =
    document.getElementById(
        "containersBtn"
    );


const dashboardPage =
    document.getElementById(
        "dashboardPage"
    );


const containersPage =
    document.getElementById(
        "containersPage"
    );


// =========================================================
// DASHBOARD BUTTON
// =========================================================

dashboardBtn.addEventListener(
    "click",
    ()=>{

        dashboardBtn.classList.add(
            "active"
        );


        containersBtn.classList.remove(
            "active"
        );


        dashboardPage.style.display =
            "block";


        containersPage.style.display =
            "none";

    }
);


// =========================================================
// CONTAINERS STATUS BUTTON
// =========================================================

containersBtn.addEventListener(
    "click",
    ()=>{

        containersBtn.classList.add(
            "active"
        );


        dashboardBtn.classList.remove(
            "active"
        );


        dashboardPage.style.display =
            "none";


        containersPage.style.display =
            "block";


        if(!containersLoaded){

            loadContainers();

            containersLoaded = true;

        }

    }
);
// =========================================================
// FINAL INITIALIZATION
// =========================================================

// Make sure Dashboard is visible on first load

dashboardPage.style.display = "block";

containersPage.style.display = "none";


// =========================================================
// MENU BUTTON
// =========================================================

const menuBtn =
    document.getElementById("menuBtn");

if(menuBtn){

    menuBtn.addEventListener(
        "click",
        ()=>{

            document
                .querySelector(".navbar")
                .classList.toggle("menu-open");

        }
    );

}


// =========================================================
// INITIAL STATE
// =========================================================

// Dashboard is loaded immediately.
// Containers are loaded only when the
// Containers Status page is opened.

containersLoaded = false;
