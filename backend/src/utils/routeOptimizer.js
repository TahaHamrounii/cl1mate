/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

/**
 * Optimizes collection route using a Nearest-Neighbor heuristic constrained by truck capacity and waste quality.
 *
 * @param {Array} hotels - List of hotels from database (including location, current sensor weight, and organic percentage)
 * @param {Object} config - System configuration (truckCapacityTons, minWeightThreshold, minOrganicPercentage)
 * @param {Object} depotLocation - {lat, lng} coordinates of the PNUD methanization facility (depot)
 * @returns {Object} Optimized route results
 */
const optimizeRoutes = (hotels, config, depotLocation = { lat: 33.8075, lng: 10.8451 }) => {
  const maxCapacityKg = (config.truckCapacityTons || 16.7) * 1000;
  const minOrganic = config.minOrganicPercentage || 95;
  const minWeight = config.minWeightThreshold || 100;

  const pnudHotels = [];
  const municipalHotels = [];

  // 1. Initial Filtering & Classification
  hotels.forEach((hotel) => {
    const weight = hotel.sensors.weight || 0;
    const organic = hotel.sensors.organicMatter || 0;

    const data = {
      id: hotel._id,
      name: hotel.name,
      location: hotel.location,
      weight,
      organicMatter: organic,
    };

    if (organic < minOrganic) {
      municipalHotels.push({
        ...data,
        reason: 'low_quality',
        details: `Organic matter ${organic}% is below threshold (${minOrganic}%)`,
      });
    } else if (weight < minWeight) {
      municipalHotels.push({
        ...data,
        reason: 'low_quantity',
        details: `Waste weight ${weight}kg is below threshold (${minWeight}kg)`,
      });
    } else {
      pnudHotels.push(data);
    }
  });

  // 2. PNUD Route Optimization (Nearest Neighbor with Multi-Run Capacity Constraints)
  const pnudRuns = [];
  let remainingPnudHotels = [...pnudHotels];

  while (remainingPnudHotels.length > 0) {
    const currentRun = [];
    let currentLoad = 0;
    let currentPosition = { ...depotLocation };
    let hasAddedToRun = true;

    while (hasAddedToRun) {
      hasAddedToRun = false;
      let nearestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < remainingPnudHotels.length; i++) {
        const candidate = remainingPnudHotels[i];
        if (currentLoad + candidate.weight <= maxCapacityKg) {
          const dist = getDistance(
            currentPosition.lat,
            currentPosition.lng,
            candidate.location.lat,
            candidate.location.lng
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearestIndex = i;
          }
        }
      }

      if (nearestIndex !== -1) {
        const candidate = remainingPnudHotels[nearestIndex];
        currentLoad += candidate.weight;
        currentRun.push({
          ...candidate,
          distanceFromLastStop: minDistance,
          cumulativeLoad: currentLoad,
          runNumber: pnudRuns.length + 1,
        });
        currentPosition = { ...candidate.location };
        remainingPnudHotels.splice(nearestIndex, 1);
        hasAddedToRun = true;
      }
    }

    if (currentRun.length === 0 && remainingPnudHotels.length > 0) {
      // Nearest candidate itself exceeds maxCapacityKg. Redirect to municipality
      const candidate = remainingPnudHotels[0];
      municipalHotels.push({
        ...candidate,
        reason: 'exceeds_truck_capacity',
        details: `Hotel waste weight (${candidate.weight}kg) exceeds truck capacity (${maxCapacityKg}kg).`,
      });
      remainingPnudHotels.splice(0, 1);
    } else if (currentRun.length > 0) {
      pnudRuns.push({
        runNumber: pnudRuns.length + 1,
        route: currentRun,
        totalLoadKg: currentLoad,
      });
    }
  }

  const pnudRoute = pnudRuns.reduce((acc, run) => acc.concat(run.route), []);
  const totalPnudLoad = pnudRuns.reduce((acc, run) => acc + run.totalLoadKg, 0);

  // 3. Municipality Route Optimization (Simple Nearest Neighbor for the municipal truck if needed)
  const municipalityRoute = [];
  let currentMuniPosition = { ...depotLocation };
  let remainingMuniHotels = [...municipalHotels];

  while (remainingMuniHotels.length > 0) {
    let nearestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < remainingMuniHotels.length; i++) {
      const dist = getDistance(
        currentMuniPosition.lat,
        currentMuniPosition.lng,
        remainingMuniHotels[i].location.lat,
        remainingMuniHotels[i].location.lng
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex === -1) break;

    const stop = remainingMuniHotels[nearestIndex];
    municipalityRoute.push({
      ...stop,
      distanceFromLastStop: minDistance,
    });

    currentMuniPosition = { ...stop.location };
    remainingMuniHotels.splice(nearestIndex, 1);
  }

  return {
    pnud: {
      route: pnudRoute,
      runs: pnudRuns,
      totalLoadKg: totalPnudLoad,
    },
    municipality: {
      route: municipalityRoute,
      totalHotels: municipalityRoute.length,
    },
  };
};

module.exports = {
  getDistance,
  optimizeRoutes,
};
