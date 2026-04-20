// Center on Denver
const map = L.map('map', {
    preferCanvas: true,
    maxBoundsViscosity: 1.0
}).setView([39.7392, -104.9903], 12);



// Define Denver-ish bounding box (SW, NE)
const denverBounds = L.latLngBounds(
    [39.55, -105.15],  // southwest
    [39.90, -104.70]   // northeast
);

// Lock map to these bounds
map.setMaxBounds(denverBounds);

// Base map
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    maxZoom: 30,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


function getLineWeight() {
    const zoom = map.getZoom();

    //scale lines with zoom
    const weight = zoom * .8;

    // cap weight
    if (zoom <= 15) {
        return Math.min(weight, 1);
    }

    return weight;
}


// function to calc usage total within the map bounds

function calcMapBoundsUsageTotal(layer)  {
    if (!layer) return 0;

    const bounds = map.getBounds();
    let total = 0;

    layer.eachLayer(segment => {
        const feature = segment.feature;
        if (!feature) return;

        const coords = feature.geometry.coordinates;

        const isVisible = coords.some(coord => {
            const lng = coord[0];
            const lat = coord[1];
            return bounds.contains([lat, lng]);
        });

        if (isVisible) {
            total += Number(feature.properties.count) || 0;
        }
    });

    return total;
}
map.on('zoomend', () => {
 
    if (geojsonLayer) {
        geojsonLayer.setStyle({ weight: getLineWeight() });
        const total = calcMapBoundsUsageTotal(geojsonLayer);
        
        document.getElementById("visible-usage-total").textContent =
            total.toLocaleString();
    }


});

map.on('moveend',()=>{

const total = calcMapBoundsUsageTotal(geojsonLayer);
    document.getElementById("visible-usage-total").textContent =
        total.toLocaleString();



})



let geojsonLayer;
function getFileName() {
    const year = yearFilter.value;
    if (yearFilter.value === "all") {
        quarterFilter.value = "all";
        quarterFilter.disabled = true;
    } else {
        quarterFilter.disabled = false;
    }
    const quarter = quarterFilter.value;


    if (year === 'all' && quarter === 'all') {
        return 'geojson/segments_all.geojson';
    }

    if (year === 'all' && quarter !== 'all') {
        return `geojson/segments_${year}_${quarter}.geojson`;
    }

    if (year !== 'all' && quarter === 'all') {
        return `geojson/segments_${year}_all.geojson`;
    }

    return `geojson/segments_${year}_${quarter}.geojson`;
}
yearFilter.addEventListener('change', loadMap);
quarterFilter.addEventListener('change', loadMap);

async function loadData() {
    const fileName = getFileName();
    const data = await d3.json(fileName);



    return data;
}


const range_start_col = '#474444'
const range_end_col = '#fc0303'


async function loadMap() {
    const data = await loadData();

    const usage_counts = data.features.map(d => +d.properties.count);
    console.log("Usage Total",d3.sum(usage_counts))
    
    
    const usage_min = d3.min(usage_counts);
    const usage_max = d3.max(usage_counts);

    const colorScale = d3.scaleLinear()
        .domain([usage_min, usage_max * .08])
        .range([range_start_col, range_end_col]);



    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    geojsonLayer = L.geoJSON(data, {
        style: function (feature) {
            return {
                color: colorScale(+feature.properties.count),
                weight: getLineWeight(),
                opacity: 0.5
            };
        },
        onEachFeature: function (feature, layer) {
            const p = feature.properties;

            const content = `
                        <strong>${p.name || 'No name'}</strong><br>
                        Road class: ${p.road_class || 'N/A'}<br>
                        Count: ${p.count}<br>
                        Year: ${yearFilter.value}<br>
                        Quarter: ${quarterFilter.value}
                                                    `;


            layer.bindTooltip(content, {
                direction: 'top',
                opacity: 0.9
            });
        }
    }).addTo(map);
    
    const total = calcMapBoundsUsageTotal(geojsonLayer);
    document.getElementById("visible-usage-total").textContent =
        total.toLocaleString();


    if (data.features.length > 0) {

        map.fitBounds(geojsonLayer.getBounds());
    }

    document.getElementById('legend-gradient').style.background =
        `linear-gradient(to right,${range_start_col},${range_end_col})`;

    document.getElementById('legend-min').textContent = Math.round(usage_min);
    document.getElementById('legend-max').textContent = Math.round(usage_max);
}



async function drawCrashHeatmap() {
    const margin = { top: 80, right: 25, bottom: 30, left: 70 };
    const width = map._size.x - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    

    d3.select("#crash-heatmap").selectAll("*").remove();

    const svg = d3.select("#crash-heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = await d3.csv("denver_scooter_crash_data.csv");

    const dayOrder = [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday"
    ];

    data.forEach(d => {
        d.hour = +d.hour;
    });

    const days = dayOrder.filter(day =>
        data.some(d => d.day_of_week === day)
    );

    const crashGroups = d3.range(24);

    const crashCounts = d3.rollups(
        data,
        v => v.length,
        d => d.day_of_week,
        d => d.hour
    );

    const heatmapData = [];

    days.forEach(day => {
        crashGroups.forEach(hour => {
            const dayEntry = crashCounts.find(d => d[0] === day);
            const hourEntry = dayEntry ? dayEntry[1].find(h => h[0] === hour) : null;

            heatmapData.push({
                day_of_week: day,
                hour: hour,
                count: hourEntry ? hourEntry[1] : 0
            });
        });
    });
    const x = d3.scaleBand()
        .range([0, width])
        .domain(crashGroups)
        .padding(0.01);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))

    const y = d3.scaleBand()
        .range([0, height])
        .domain(days)
        .padding(0.01);

    svg.append("g")
        .call(d3.axisLeft(y));

    const maxCount = d3.max(heatmapData, d => d.count);

    const colorRange = d3.scaleLinear()
        .range([range_start_col, range_end_col])
        .domain([0, maxCount]);

    svg.selectAll("rect")
        .data(heatmapData)
        .join("rect")

        .attr("x", d => x(d.hour))
        .attr("y", d => y(d.day_of_week))
        .attr("width", x.bandwidth())

        .attr("height", y.bandwidth())
        .style("fill", d => colorRange(d.count))


    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(days)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button
}

async function riskByYear() {
    const margin = { top: 0, right: 25, bottom: 30, left: 70 };
    const width = map._size.x - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const data = await d3.csv("denver_scooter_crash_data.csv");

    d3.select("#crash-timseries").selectAll("*").remove();

    const svg = d3.select("#crash-timeseries")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    // create chart space
    const chart = svg
        .append('g')
        .attr(
            'transform',
            'translate(' +
            margin.left +
            ',' +
            margin.top +
            ')',
        );

    // load data
    d3.csv(gcredit_data_URL).then(function (gcredit) {
        gcredit.forEach(function (d) {
            d.credit_amount = +d.credit_amount;
        });
        // aggregate data
        const agg = d3.rollups(
            gcredit,
            (v) => d3.mean(v, (d) => d.credit_amount),
            (d) => d.purpose,
        );

        // create dataset from aggregated data
        const dataset = agg.map(function (d) {
            return {
                purpose: d[0],
                value: d[1],
            };
        });

        // create x axis values
        const x = d3
            .scaleBand()
            .domain(dataset.map((d) => d.purpose))
            .range([0, width])
            .padding(0.2);

        // create y axis values
        const y = d3
            .scaleLinear()
            .domain([0, d3.max(dataset, (d) => d.value)])
            .nice()
            .range([height, 0]);

        // draw bars
        chart
            .selectAll('rect')
            .data(dataset)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', (d) => x(d.purpose))
            .attr('y', (d) => y(d.value))
            .attr('width', x.bandwidth())
            .attr('height', (d) => height - y(d.value));

        // draw x axis
        chart
            .append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-25)')
            .style('text-anchor', 'end');

        // draw y axis
        chart.append('g').call(d3.axisLeft(y));

        svg
            .append('text')
            .attr('x', width / 2 + margin.left)
            .attr('y', height + margin.top + 80)
            .attr('text-anchor', 'middle')
            .text('Purpose');

        svg
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(height / 2) - margin.top)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text('Average Credit Amount');

    });

}


loadMap();
drawCrashHeatmap();
// riskByYear()

