import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";



export async function drawAccidentHeatmap(filteredCrashOnlyData, range_start_col, range_end_col) {

    const container = d3.select("#map-container");


    const containerWidth = container.node().getBoundingClientRect().width;

    const margin = { top: 45, right: 100, bottom: 60, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;



    d3.select("#crash-heatmap").selectAll("*").remove();

    const svg = d3.select("#crash-heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left + 20},${margin.top - 20})`);





   const dayOrder = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
];

// Always show all days and all hours
const days = dayOrder;
const hours = d3.range(24).map(h => `${h}:00`);

 

 


const periods = new Set(
    filteredCrashOnlyData.map(d => `${d.year}-${d.quarter}`)
);

const shouldAverage =
    yearFilter.value === "all" || quarterFilter.value === "all";

const divisor = shouldAverage ? periods.size : 1;

const crashCounts = d3.rollups(
    filteredCrashOnlyData,
    v => v.length / divisor,
    d => d.day_of_week,
    d => `${+d.hour}:00`
);








 

const heatmapData = [];

days.forEach(day => {
    hours.forEach(hour => {

        const dayEntry = crashCounts.find(d => d[0] === day);
        const hourEntry = dayEntry
            ? dayEntry[1].find(h => h[0] === hour)
            : null;

        heatmapData.push({
            day_of_week: day,
            hour: hour,
            count: hourEntry ? hourEntry[1] : 0
        });
    });
});

    const x = d3.scaleBand()
    .range([0, width])
    .domain(hours)
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
        .append("title")
        // add browser tooltip
        .text(d =>
            d.day_of_week + "\n" +
            "Hour: " + d.hour + "\n" +
            "Crashes: " + d.count
        );

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .attr("text-anchor", "middle")
        .text("Hour");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left)
        .attr("text-anchor", "middle")
        .text("Weekday");

     

    const legendHeight = height;
    const legendWidth = 10;

    
    const defs = svg.append("defs");

    const gradient = defs.append("linearGradient")
        .attr("id", "heatmap-gradient-vertical")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")    
        .attr("y2", "0%");     

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", range_start_col);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", range_end_col);

    // position to the RIGHT of chart
    const legendX = width + 3;
    const legendY = 0;

    // bar
    svg.append("rect")
        .attr("x", legendX)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient-vertical)");

    // scale (flipped so top = high)
    const legendScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([legendHeight, 0]);

    // axis
    svg.append("g")
        .attr("transform", `translate(${legendX + legendWidth}, 0)`)
        .call(d3.axisRight(legendScale).ticks(5));

    // label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -legendHeight / 2)
        .attr("y", legendX + legendWidth + 35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Average Accident Count");
}