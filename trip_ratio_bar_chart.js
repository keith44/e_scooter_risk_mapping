import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";



// Crash ration combo line and barchart
export async function accidentTripRatioBarChart(crashTripData, range_start_col, range_end_col) {


    d3.select("#crash-trip-ratio-barchart").selectAll("*").remove();

    const container = d3.select("#crash-trip-ratio-barchart");

    const containerWidth = container.node().getBoundingClientRect().width;

    const margin = { top: 20, right: 70, bottom: 40, left: 70 };
    const width = containerWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3
        .select("#crash-trip-ratio-barchart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg
        .append("g")
        .attr("transform", `translate(${margin.left - 10},${margin.top})`)


    let c = crashTripData;

    crashTripData = await d3.csv("denver_scooter_trips_vs_crashes.csv", d => ({
        year: +d.year,
        trips: +d.trips,
        crashes: +d.num_crashes
    }));



    const crashTripsByYear = d3.rollups(
        crashTripData,
        v => ({
            trips: d3.sum(v, d => d.trips),
            crashes: d3.sum(v, d => d.crashes)
        }),
        d => d.year
    );



    // crashTripData.slice(0,4).forEach(element => {
    //     console.log(element)

    // });

    // c.slice(0,4).forEach(element => {
    //     console.log(element)

    // });

    const cty = d3.rollups(
        c,
        v => ({
            trips: d3.sum(v, d => d.trips),
            crashes: d3.sum(v, d => d.crashes)
        }),
        d => d.year
    );


    // cty.slice(0,4).forEach(element => {
    //     console.log(element)

    // });
    //  crashTripsByYear.slice(0,4).forEach(element => {
    //     console.log(element)

    // });




    const crashTripRatio = crashTripsByYear.map(([year, values]) => ({
        year: year,
        trips: values.trips,
        crashes: values.crashes,
        ratio: (values.crashes / values.trips) * 10000
    }))
        .sort((a, b) => a.year - b.year);








    const x = d3.scaleBand()
        .domain(crashTripRatio.map(d => d.year))
        .range([0, width])
        .padding(0.2);

    const yBars = d3.scaleLinear()
        .domain([0, d3.max(crashTripRatio, d => d.crashes) * 1.1])
        .nice()
        .range([height, 0]);

    const yLine = d3.scaleLinear()
        .domain([0, d3.max(crashTripRatio, d => d.ratio) * 1.1])
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

    chart.selectAll("rect")
        .data(crashTripRatio)
        .join("rect")
        .attr("x", d => x(d.year))
        .attr("y", d => yBars(d.crashes))
        .attr("width", x.bandwidth())
        .attr("height", d => height - yBars(d.crashes))
        .attr("fill", range_start_col)


    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    chart.append("g")
        .call(d3.axisLeft(yBars));

    chart.append("g")
        .attr("transform", `translate(${width}, 0)`)
        .call(d3.axisRight(yLine).tickFormat(d => d.toFixed(2)));

    const line = d3.line()
        .x(d => x(d.year) + x.bandwidth() / 2)
        .y(d => yLine(d.ratio))


    chart.append("path")
        .datum(crashTripRatio)
        .attr("fill", "none")
        .attr("stroke", range_end_col)
        .attr("stroke-width", 2)
        .attr("d", line)




    chart.selectAll(".line-point")
        .data(crashTripRatio)
        .join("circle")
        .attr("class", "line-point")
        .attr("cx", d => x(d.year) + x.bandwidth() / 2)
        .attr("cy", d => yLine(d.ratio))
        .attr("r", 4)
        .attr("fill", "red");
    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", width + margin.right)
        .attr("text-anchor", "middle")
        .text("Accident Rate");
    chart.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .text("Year");

    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .attr("text-anchor", "middle")
        .text("Accidents per 10,000 Trips");

}


