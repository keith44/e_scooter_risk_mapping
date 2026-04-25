import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";




const crashIcon = L.icon({
    iconUrl: 'scooter_crash.png',
    iconSize: [50, 50],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

function drawMarkers(data, layer, crashMarkerToggle) {

    layer.clearLayers();

    data.forEach(d => {
        const injured = +d.numbinjurd || 0;
        const killed = +d.numbkilled || 0;
        // don't draw anything if toggle is off
        if (!crashMarkerToggle) return;

        L.marker([+d.latitude, +d.longitude], {
            icon: crashIcon
        })
            .addTo(layer)
            .bindPopup(`
                Date: ${d.crashdate}<br>
                Injured: ${injured}<br>
                Fatal: ${killed}
            `);
    });
}





export async function loadMap(
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
) {

    // get the filtered file name
    const fileName = getFileName();
    // load filtered data
    mapUsageData = await d3.json(fileName);

    // get for color scale
    const usage_counts = mapUsageData.features.map(d => +d.properties.count);
    const usage_min = d3.min(usage_counts);
    const usage_max = d3.max(usage_counts);
    // create color scales based on useage counts
    const colorScale = d3.scaleLinear()
        .domain([usage_min, usage_max * .08])
        .range([range_start_col, range_end_col]);

    // clear the current layer if there is one
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
        geojsonLayer = null;
    }

    if (markersLayer) {
        map.removeLayer(markersLayer);
        markersLayer = null;
    }

    
 

    markersLayer = L.layerGroup().addTo(map);
    drawMarkers(filteredCrashOnlyData, markersLayer, crashMarkerToggle);




    // build layer 

    if (usageToggle) {




        geojsonLayer = L.geoJSON(mapUsageData, {
            style: function (feature) {


                return {
                    //color each segment based on 
                    color: colorScale(+feature.properties.count),
                    weight: 1.7,
                    opacity: 0.5
                };
            },

            // create a tooltip for each segment
            onEachFeature: function (feature, layer) {
                const p = feature.properties;
                const content = `
                        <strong>${p.name || 'No name'}</strong><br>
                        Road class: ${p.road_class || 'N/A'}<br>
                        Count: ${p.count}<br>
                        Year: ${yearFilter.value}<br>
                        Quarter: ${quarterFilter.value}
                                                    `;

                // attach the tool tip to each segment
                layer.bindPopup(content, {
                    direction: 'top',
                    opacity: 0.9
                });
            }
        }).addTo(map);
    }


    // create the map legend
    document.getElementById('legend-gradient').style.background =
        `linear-gradient(to right,${range_start_col},${range_end_col})`;
    document.getElementById('legend-min').textContent = Math.round(usage_min);
    document.getElementById('legend-max').textContent = Math.round(usage_max);

    return {
        geojsonLayer,
        markersLayer,
        mapUsageData

    }
};