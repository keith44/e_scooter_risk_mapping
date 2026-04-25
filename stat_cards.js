import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";



export function statCards(data) {

    

    const total_accidents = data.length
    const injured = d3.sum(data, d => +d.numbinjurd)
    const deaths = d3.sum(data, d => +d.numbkilled)

    document.getElementById("total-accidents-value").textContent =
        (total_accidents).toLocaleString();
    document.getElementById("total-injuries-value").textContent =
        (injured).toLocaleString();
    document.getElementById("total-fatal-accidents-value").textContent =
        (deaths).toLocaleString();

















}