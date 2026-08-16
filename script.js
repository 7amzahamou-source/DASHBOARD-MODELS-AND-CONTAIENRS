const API_URL =
"https://script.google.com/macros/s/AKfycbwEgQ6XvXXla4IWM2gpHFfnfI-nRoNMMN0gT_7SS1dmvIOxdFVciZbpN7yRQaR94yq1OA/exec";

const CONTAINERS_API_URL =
    API_URL + "?sheet=CONTAINERS";


// =========================================
// DATA
// =========================================

let shipments = [];

let containers = [];

let monthChart = null;

let factoryChart = null;


// =========================================
// GET CONTAINER COUNT
// Supports:
// 2X40HQ
// 3X20GP
// 1 x 40HQ
// =========================================

function getContainerCount(value){

    const match =
        String(value || "").match(/\d+/);

    return match
        ? Number(match[0])
        : 0;

}


// =========================================
// LOAD DASHBOARD DATA
// MODELS sheet
// =========================================

async function loadData(){

    try{

        const response =
            await fetch(API_URL + "?sheet=MODELS");

        const data =
            await response.json();


        // Check API error

        if(data.error){

            console.error(
                "API Error:",
                data.error
            );

            return;

        }


        shipments = data;


        // Update Dashboard

        updateKPIs(shipments);

        drawMonthChart(shipments);

        drawFactoryChart(shipments);


        console.log(
            "Dashboard data loaded:",
            shipments
        );


    }

    catch(error){

        console.error(
            "Unable to load Dashboard data:",
            error
        );

    }

}


// =========================================
// LOAD CONTAINERS
// CONTAINERS sheet
// =========================================

async function loadContainers(){

    try{

        const response =
            await fetch(
                CONTAINERS_API_URL
            );


        const data =
            await response.json();


        // Check API error

        if(data.error){

            console.error(
                "Containers API Error:",
                data.error
            );

            return;

        }


        containers = data;


        console.log(
            "Containers loaded:",
            containers
        );


        // Fill filters

        populateContainerFilters();


        // Render table

        renderContainers();


    }

    catch(error){

        console.error(
            "Unable to load Containers data:",
            error
        );

    }

}


// =========================================
// DASHBOARD KPI
// =========================================

function updateKPIs(data){


    // =====================================
    // Total Shipments
    // Unique Entry
    // =====================================

    const uniqueEntries =
        new Set(

            data

                .map(
                    row =>
                    String(
                        row.entry || ""
                    ).trim()
                )

                .filter(
                    entry =>
                    entry !== ""
                )

        );


    const totalShipmentsElement =
        document.getElementById(
            "totalShipments"
        );


    if(totalShipmentsElement){

        totalShipmentsElement.textContent =
            uniqueEntries.size.toLocaleString();

    }


    // =====================================
    // Total Containers
    // =====================================

    const totalContainers =
        data.reduce(

            (sum,row) => {

                return sum +
                    getContainerCount(
                        row.hq
                    );

            },

            0

        );


    const totalContainersElement =
        document.getElementById(
            "totalContainers"
        );


    if(totalContainersElement){

        totalContainersElement.textContent =
            totalContainers.toLocaleString();

    }


    // =====================================
    // Arrived / On Sea
    // =====================================

    let arrived = 0;

    let onSea = 0;


    data.forEach(row => {

        const count =
            getContainerCount(
                row.hq
            );


        if(
            String(
                row.bayan || ""
            ).trim() !== ""
        ){

            arrived += count;

        }

        else{

            onSea += count;

        }

    });


    const arrivedElement =
        document.getElementById(
            "containersArrived"
        );


    const seaElement =
        document.getElementById(
            "containersOnSea"
        );


    if(arrivedElement){

        arrivedElement.textContent =
            arrived.toLocaleString();

    }


    if(seaElement){

        seaElement.textContent =
            onSea.toLocaleString();

    }

}


// =========================================
// CONTAINERS BY ETA MONTH
// =========================================

function drawMonthChart(data){

    const canvas =
        document.getElementById(
            "monthChart"
        );


    if(!canvas) return;


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


    const shipmentsPerMonth =
        new Array(12).fill(0);


    const containersPerMonth =
        new Array(12).fill(0);


    data.forEach(item => {


        if(!item.eta) return;


        const date =
            new Date(item.eta);


        if(isNaN(date)) return;


        const month =
            date.getMonth();


        shipmentsPerMonth[month]++;


        containersPerMonth[month] +=
            getContainerCount(
                item.hq
            );

    });


    if(monthChart){

        monthChart.destroy();

    }


    monthChart =
        new Chart(

            canvas,

            {

                type:"bar",


                data:{

                    labels:months,


                    datasets:[

                        {

                            label:"Shipments",

                            data:
                                shipmentsPerMonth,

                            containers:
                                containersPerMonth,

                            backgroundColor:
                                "rgba(54,162,235,0.25)",

                            borderColor:
                                "rgba(54,162,235,1)",

                            borderWidth:1,

                            borderRadius:6,

                            maxBarThickness:40

                        }

                    ]

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

                                title:function(
                                    context
                                ){

                                    return context[0].label;

                                },


                                label:function(
                                    context
                                ){

                                    return (
                                        "Shipments : " +
                                        context.raw
                                    );

                                },


                                afterLabel:function(
                                    context
                                ){

                                    return (
                                        "Containers : " +
                                        context
                                            .dataset
                                            .containers[
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


// =========================================
// TOP 3 FACTORIES
// =========================================

function drawFactoryChart(data){

    const canvas =
        document.getElementById(
            "factoryChart"
        );


    if(!canvas) return;


    const factories = {};


    data.forEach(item => {


        const factory =
            String(
                item.factory || ""
            ).trim();


        if(factory === "") return;


        if(!factories[factory]){

            factories[factory] = {

                shipments:0,

                containers:0

            };

        }


        factories[factory].shipments++;


        factories[factory].containers +=
            getContainerCount(
                item.hq
            );

    });


    const sorted =

        Object.entries(factories)

            .sort((a,b) => {


                if(
                    b[1].shipments !==
                    a[1].shipments
                ){

                    return (
                        b[1].shipments -
                        a[1].shipments
                    );

                }


                return a[0]
                    .localeCompare(
                        b[0]
                    );

            })

            .slice(0,3);


    const labels =
        sorted.map(
            item => item[0]
        );


    const shipmentsCount =
        sorted.map(
            item => item[1].shipments
        );


    const containersCount =
        sorted.map(
            item => item[1].containers
        );


    if(factoryChart){

        factoryChart.destroy();

    }


    factoryChart =
        new Chart(

            canvas,

            {

                type:"bar",


                data:{

                    labels:labels,


                    datasets:[

                        {

                            label:"Shipments",

                            data:
                                shipmentsCount,

                            containers:
                                containersCount,

                            backgroundColor:
                                "rgba(75,192,192,.25)",

                            borderColor:
                                "rgba(75,192,192,1)",

                            borderWidth:1,

                            borderRadius:6,

                            maxBarThickness:28

                        }

                    ]

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

                                title:function(
                                    context
                                ){

                                    return context[0].label;

                                },


                                label:function(
                                    context
                                ){

                                    return (
                                        "Shipments : " +
                                        context.raw
                                    );

                                },


                                afterLabel:function(
                                    context
                                ){

                                    return (
                                        "Containers : " +
                                        context
                                            .dataset
                                            .containers[
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


// =====================================================
// CONTAINERS
// =====================================================


// =========================================
// GET LAST TRANSIT
// =========================================

function getLastTransit(item){

    if(
        String(
            item.transit5 || ""
        ).trim() !== ""
    ){

        return item.transit5;

    }


    if(
        String(
            item.transit4 || ""
        ).trim() !== ""
    ){

        return item.transit4;

    }


    if(
        String(
            item.transit3 || ""
        ).trim() !== ""
    ){

        return item.transit3;

    }


    if(
        String(
            item.transit2 || ""
        ).trim() !== ""
    ){

        return item.transit2;

    }


    if(
        String(
            item.transit1 || ""
        ).trim() !== ""
    ){

        return item.transit1;

    }


    return "";

}


// =========================================
// POPULATE CONTAINER FILTERS
// =========================================

function populateContainerFilters(){

    const departmentSelect =
        document.getElementById(
            "containerDepartmentFilter"
        );


    const transitSelect =
        document.getElementById(
            "containerTransitFilter"
        );


    const podSelect =
        document.getElementById(
            "containerPODFilter"
        );


    if(
        !departmentSelect ||
        !transitSelect ||
        !podSelect
    ){

        return;

    }


    // =====================================
    // Department
    // =====================================

    const departments =

        [

            ...new Set(

                containers

                    .map(
                        item =>
                        String(
                            item.department || ""
                        ).trim()
                    )

                    .filter(Boolean)

            )

        ]

        .sort(
            (a,b) =>
            a.localeCompare(b)
        );


    departmentSelect.innerHTML =
        '<option value="">All Departments</option>';


    departments.forEach(value => {

        const option =
            document.createElement(
                "option"
            );


        option.value = value;

        option.textContent = value;


        departmentSelect.appendChild(
            option
        );

    });


    // =====================================
    // Transit
    // =====================================

    const transits =

        [

            ...new Set(

                containers

                    .map(
                        item =>
                        getLastTransit(item)
                    )

                    .filter(Boolean)

            )

        ]

        .sort(
            (a,b) =>
            a.localeCompare(b)
        );


    transitSelect.innerHTML =
        '<option value="">All Transit</option>';


    transits.forEach(value => {

        const option =
            document.createElement(
                "option"
            );


        option.value = value;

        option.textContent = value;


        transitSelect.appendChild(
            option
        );

    });


    // =====================================
    // POD
    // =====================================

    const pods =

        [

            ...new Set(

                containers

                    .map(
                        item =>
                        String(
                            item.pod || ""
                        ).trim()
                    )

                    .filter(Boolean)

            )

        ]

        .sort(
            (a,b) =>
            a.localeCompare(b)
        );


    podSelect.innerHTML =
        '<option value="">All POD</option>';


    pods.forEach(value => {

        const option =
            document.createElement(
                "option"
            );


        option.value = value;

        option.textContent = value;


        podSelect.appendChild(
            option
        );

    });

}


// =========================================
// RENDER CONTAINERS
// =========================================

function renderContainers(){

    const tbody =
        document.querySelector(
            "#containersTable tbody"
        );


    if(!tbody) return;


    const searchElement =
        document.getElementById(
            "containerSearch"
        );


    const departmentElement =
        document.getElementById(
            "containerDepartmentFilter"
        );


    const transitElement =
        document.getElementById(
            "containerTransitFilter"
        );


    const podElement =
        document.getElementById(
            "containerPODFilter"
        );


    if(
        !searchElement ||
        !departmentElement ||
        !transitElement ||
        !podElement
    ){

        return;

    }


    const keyword =
        searchElement
            .value
            .toLowerCase()
            .trim();


    const department =
        departmentElement.value;


    const transit =
        transitElement.value;


    const pod =
        podElement.value;


    const filtered =

        containers.filter(item => {


            const searchText = [

                item.entry,

                item.department,

                item.sn,

                item.container,

                item.model,

                item.qty,

                item.warehouseBooking,

                item.customsBooking,

                item.transit1,

                item.eta1,

                item.departure1,

                item.transit2,

                item.eta2,

                item.departure2,

                item.transit3,

                item.eta3,

                item.departure3,

                item.transit4,

                item.eta4,

                item.departure4,

                item.transit5,

                item.eta5,

                item.departure5,

                item.pod,

                item.eta

            ]

            .join(" ")

            .toLowerCase();


            const searchMatch =
                searchText.includes(
                    keyword
                );


            const departmentMatch =

                department === "" ||

                String(
                    item.department || ""
                ) === department;


            const transitMatch =

                transit === "" ||

                getLastTransit(item) ===
                transit;


            const podMatch =

                pod === "" ||

                String(
                    item.pod || ""
                ) === pod;


            return (

                searchMatch &&

                departmentMatch &&

                transitMatch &&

                podMatch

            );

        });


    // =====================================
    // CLEAR TABLE
    // =====================================

    tbody.innerHTML = "";


    // =====================================
    // RENDER ROWS
    // =====================================

    filtered.forEach(item => {


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>${item.entry || ""}</td>

            <td>${item.department || ""}</td>

            <td>${item.sn || ""}</td>

            <td>${item.container || ""}</td>

            <td>${item.model || ""}</td>

            <td>${item.qty || ""}</td>

            <td>${item.warehouseBooking || ""}</td>

            <td>${item.customsBooking || ""}</td>

            <td>${item.transit1 || ""}</td>

            <td>${item.eta1 || ""}</td>

            <td>${item.departure1 || ""}</td>

            <td>${item.transit2 || ""}</td>

            <td>${item.eta2 || ""}</td>

            <td>${item.departure2 || ""}</td>

            <td>${item.transit3 || ""}</td>

            <td>${item.eta3 || ""}</td>

            <td>${item.departure3 || ""}</td>

            <td>${item.transit4 || ""}</td>

            <td>${item.eta4 || ""}</td>

            <td>${item.departure4 || ""}</td>

            <td>${item.transit5 || ""}</td>

            <td>${item.eta5 || ""}</td>

            <td>${item.departure5 || ""}</td>

            <td>${item.pod || ""}</td>

            <td>${item.eta || ""}</td>

        `;


        tbody.appendChild(row);

    });


    console.log(
        "Containers displayed:",
        filtered.length
    );

}


// =========================================
// CONTAINER SEARCH
// =========================================

const containerSearch =
    document.getElementById(
        "containerSearch"
    );


if(containerSearch){

    containerSearch.addEventListener(
        "input",
        renderContainers
    );

}


// =========================================
// DEPARTMENT FILTER
// =========================================

const containerDepartmentFilter =
    document.getElementById(
        "containerDepartmentFilter"
    );


if(containerDepartmentFilter){

    containerDepartmentFilter.addEventListener(
        "change",
        renderContainers
    );

}


// =========================================
// TRANSIT FILTER
// =========================================

const containerTransitFilter =
    document.getElementById(
        "containerTransitFilter"
    );


if(containerTransitFilter){

    containerTransitFilter.addEventListener(
        "change",
        renderContainers
    );

}


// =========================================
// POD FILTER
// =========================================

const containerPODFilter =
    document.getElementById(
        "containerPODFilter"
    );


if(containerPODFilter){

    containerPODFilter.addEventListener(
        "change",
        renderContainers
    );

}


// =========================================
// PAGE NAVIGATION
// =========================================

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {


        button.addEventListener(
            "click",
            () => {


                const pageId =
                    button.dataset.page;


                // Hide pages

                document
                    .querySelectorAll(
                        ".page-section"
                    )
                    .forEach(page => {

                        page.classList.add(
                            "hidden"
                        );

                    });


                // Show selected page

                const selectedPage =
                    document.getElementById(
                        pageId
                    );


                if(selectedPage){

                    selectedPage.classList.remove(
                        "hidden"
                    );

                }


                // Active button

                document
                    .querySelectorAll(
                        ".nav-btn"
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );

            }

        );

    });


// =========================================
// START
// =========================================

loadData();

loadContainers();
