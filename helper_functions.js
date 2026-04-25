import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


export function getFileName() {
    const year = yearFilter.value;
    // disable the quarter filter if year is set to all
    if (yearFilter.value === "all") {
        quarterFilter.value = "all";
        quarterFilter.disabled = true;
    } else {
        quarterFilter.disabled = false;
    }

    const quarter = quarterFilter.value;

    // determine file name based on filters
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


// function to calc e-scooter usage total within the map bounds
export function calcCurrentMapViewUsageTotal(map, mapUsageData) {
    if (!mapUsageData || !mapUsageData.features) return 0;

    const bounds = map.getBounds();

    const visibleFeatures = mapUsageData.features.filter(feature => {
        const coords = feature.geometry.coordinates;

        // LineString: check if any point is inside current map bounds
        return coords.some(([lng, lat]) => {
            return bounds.contains([lat, lng]);
        });
    });

     

    return d3.sum(visibleFeatures, d => +d.properties.count || 0);
}
// function to make the segment lines more visible when zooming
export function scaleLineWeight(map) {
    const zoom = map.getZoom();
    //scale line widths with zoom so that they are easier to hover over
    const weight = zoom * .8;

    // cap the line weight
    if (zoom <= 15) {
        return Math.min(weight, 1);
    }
    return weight;
}

export function countVisibleMarkers(map, data) {

    const bounds = map.getBounds();

    return data.filter(d =>

        bounds.contains([+d.latitude, +d.longitude])
    ).length;
}

export function calcRelativeRisk(map, data, mapUsageData) {


     
    const currentAccidentCount = countVisibleMarkers(map, data);

    const currentTotalUsage = calcCurrentMapViewUsageTotal(map, mapUsageData);

    const totalAccidentCount = data.length

 

    const totalUsage = d3.sum(mapUsageData.features, d => d.properties.count)

    const overallRisk = currentTotalUsage / totalUsage
    const zoomedRisk = currentAccidentCount / totalAccidentCount



    const relativeRisk = (zoomedRisk / overallRisk)
  

    return relativeRisk

}

