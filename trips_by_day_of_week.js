import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Bar chart showing crashes by day of week
export function dayOfWeekTrips(crashTripData, range_start_col, range_end_col) {
    d3.select("#day-of-week-trips-barchart").selectAll("*").remove();

    const container = d3.select("#day-of-week-trips");
    const containerWidth = container.node().getBoundingClientRect().width;

    const margin = { top: 30, right: 100, bottom:80, left: 70 };
    const width = containerWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;



    const svg = d3
        .select("#day-of-week-trips-barchart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg
        .append("g")
        .attr("transform", `translate(${margin.left - 10},${margin.top})`);

    const dayOrder = [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday"
    ];

    const grouped = d3.rollup(
        crashTripData,
        v => ({
            trips: d3.sum(v, d => +d.trips || 0),
            crashes: d3.sum(v, d => +d.num_crashes || 0)
        }),
        d => d.day_of_week
    );

    const chartData = dayOrder.map(day => {
        const values = grouped.get(day) || { trips: 0, crashes: 0 };

        return {
            weekday: day,
            trips: values.trips,
            crashes: values.crashes,
            ratio: values.trips > 0 ? (values.crashes / values.trips) * 100000 : 0
        };
    });
    const color = d3.scaleLinear()
        .domain([d3.min(chartData, d => d.ratio), d3.max(chartData, d => d.ratio)])
        .range([range_start_col, range_end_col]);
    const min = d3.min(chartData, d => d.ratio);
    const max = d3.max(chartData, d => d.ratio);

    d3.select("#weekday-legend-gradient")
        .style("background", `linear-gradient(to top, ${range_start_col}, ${range_end_col})`);

    d3.select("#weekday-legend-min")
        .text(min.toFixed(2));

    d3.select("#weekday-legend-max")
        .text(max.toFixed(2));




    const x = d3.scaleBand()
        .domain(chartData.map(d => d.weekday))
        .range([0, width])
        .padding(0.2);

    const yBars = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.ratio) * 1.1])
        .nice()
        .range([height, 0]);

    chart.append("g")
        .attr("class", "grid")
        .call(
            d3.axisLeft(yBars)
                .tickSize(-width)
                .tickFormat("")
        );

    chart.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${height})`)
        .call(
            d3.axisBottom(x)
                .tickSize(-height)
                .tickFormat("")
        );

     

    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    chart.append("g")
        .call(d3.axisLeft(yBars));

    chart.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 30)
        .attr("text-anchor", "middle")
        .text("Day of Week");

    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .attr("text-anchor", "middle")
        .text("Crashes per 100,000 Trips");

    chart.selectAll("rect")
        .data(chartData)
        .join("rect")
        .attr("x", d => x(d.weekday))
        .attr("y", d => yBars(d.ratio))
        .attr("width", x.bandwidth())
        .attr("height", d => height - yBars(d.ratio))
        .attr("fill", d => color(d.ratio));






 
const legendHeight = height;
const legendWidth = 10;

const defs = svg.append("defs");

const gradient = defs.append("linearGradient")
    .attr("id", "weekday-gradient-vertical")
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

const legendX = width + 20;
const legendY = 0;

chart.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#weekday-gradient-vertical)");

const legendScale = d3.scaleLinear()
    .domain([min, max])
    .range([legendHeight, 0]);

chart.append("g")
    .attr("transform", `translate(${legendX + legendWidth}, 0)`)
    .call(d3.axisRight(legendScale).ticks(5));

chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -legendHeight / 2)
    .attr("y", legendX + legendWidth + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Accident Rate");














    chart.selectAll(".label")
        .data(chartData)
        .join("text")
        .attr("x", d => x(d.weekday) + x.bandwidth() / 2)
        .attr("y", d => yBars(d.ratio) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(d => d.ratio.toFixed(2));
}