import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { drawAccidentHeatmap } from "./crash_heatmap.js"
import { accidentTripRatioBarChart } from "./trip_ratio_bar_chart.js"
import { loadMap } from "./map.js"
import { statCards } from "./stat_cards.js"
import { dayOfWeekTrips } from "./trips_by_day_of_week.js"

import { getFileName, calcCurrentMapViewUsageTotal, scaleLineWeight, countVisibleMarkers, calcRelativeRisk } from "./helper_functions.js"

 
let crashTripData;
let year;
let quarter;
let geojsonLayer;
let mapUsageData;
let crashOnlyData;
let crashMarkerToggle;
let usageToggle;
let relativeRisk;
let filteredCrashOnlyData;
let filteredTripOnlyData;
const range_start_col = '#0216fc'
const range_end_col = '#fc0303'

async function init() {

    // initialize Leaflet map centered on Denver
    const map = L.map('map', {
        zoomControl: false,
        preferCanvas: true,
        maxBoundsViscosity: 1.0,
        minZoom: 11
    }).setView([39.7392, -104.9903], 12);

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    // Define Denver bounding box (SW, NE)
    const denverMapBounds = L.latLngBounds(
        [39.55, -105.15],
        [39.90, -104.70]
    );
    // Lock map to these bounds
    map.setMaxBounds(denverMapBounds);

    // Base map light styling 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {


        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    async function updateCharts() {
        crashMarkerToggle = crashFilter.value === "true";
        usageToggle = usageFilter.value === "true";
        console.log(usageToggle)


        const { crashes, trips } = getFilteredData();


        filteredCrashOnlyData = crashes;
        filteredTripOnlyData = trips;



        ({ mapUsageData, geojsonLayer, markersLayer } = await loadMap(
            map,
            filteredCrashOnlyData,
            calcCurrentMapViewUsageTotal,
            crashMarkerToggle,
            usageToggle,
            range_start_col,
            range_end_col,
            getFileName,
            mapUsageData,
            geojsonLayer,
            markersLayer
        ));
        drawAccidentHeatmap(filteredCrashOnlyData, range_start_col, range_end_col);
        statCards(filteredCrashOnlyData)
        relativeRisk = calcRelativeRisk(map, filteredCrashOnlyData, mapUsageData);
        dayOfWeekTrips(filteredTripOnlyData, range_start_col, range_end_col)


    }

    // retrieve trip and crash counts
    crashTripData = await d3.csv("denver_scooter_trips_vs_crashes.csv", d => {

        return {
            "date": new Date(d.date + "T00:00:00"),
            "og_date": d.date,
            "day": +d.day,
            "day_of_week": d.day_of_week,
            "hour": +d.hour,
            "month": +d.month,
            "num_crashes": +d.num_crashes,
            "quarter": +d.quarter,
            "trips": +d.trips,
            "year": d.year

        }

    });







    crashOnlyData = await d3.csv("denver_scooter_crash_data.csv", d => {
        return {
            ...d,
            year: new Date(d.crashdate + "T00:00:00").getFullYear()

        }
    });

    function getFilteredData() {

        // if all years, return everything
        if (yearFilter.value === "all") {
            return {
                crashes: crashOnlyData,
                trips: crashTripData
            };
        }

        const crashes = crashOnlyData.filter(d => {
            return (
                d.year == yearFilter.value &&
                (quarterFilter.value === "all" || `Q${d.Quarter}` == quarterFilter.value)
            );
        });

        const trips = crashTripData.filter(d => {
            return (
                d.year == yearFilter.value &&
                (quarterFilter.value === "all" || `Q${d.quarter}` == quarterFilter.value)
            );
        });

        return { crashes, trips };
    }


    // reload data when when filter is changed
    yearFilter.addEventListener('change', async () => {

        await updateCharts();

    });


    quarterFilter.addEventListener('change', async () => {
        await updateCharts();

    });
    crashFilter.addEventListener('change', async () => {
        await updateCharts();
    });
    usageFilter.addEventListener('change', async () => {

        await updateCharts();
    });


    let markersLayer;

    // loads the data layers on top on the map

    // after the map view has been changed recalc totals
    map.on("moveend", () => {

        relativeRisk = calcRelativeRisk(
            map,
            filteredCrashOnlyData,
            mapUsageData
        );

        d3.select("#relative-risk-value")
            .text(relativeRisk.toFixed(2));

        let label = "About average";
        let bg = "#d4edda";   // green
        

        if (relativeRisk > 1.3) {
            label = "High risk";
            bg = "#f8d7da";   // red
           
        } else if (relativeRisk > 1.05) {
            label = "Slightly elevated";
            bg = "#fff3cd";   // yellow
             
        }

        d3.select("#relative-risk-label").text(label);

        d3.select("#risk-value")
            .style("background-color", bg)
            

        if (geojsonLayer) {
            geojsonLayer.setStyle({ weight: scaleLineWeight(map) });
        }
    });

    window.addEventListener("resize", async () => {
        accidentTripRatioBarChart(crashTripData, range_start_col, range_end_col);

        drawAccidentHeatmap(filteredCrashOnlyData, range_start_col, range_end_col);

        dayOfWeekTrips(filteredTripOnlyData, range_start_col, range_end_col)


    });


    await updateCharts();

    map.fitBounds(geojsonLayer.getBounds());


    accidentTripRatioBarChart(crashTripData, range_start_col, range_end_col);

    drawAccidentHeatmap(filteredCrashOnlyData, range_start_col, range_end_col);


    dayOfWeekTrips(filteredTripOnlyData, range_start_col, range_end_col)



}

init()