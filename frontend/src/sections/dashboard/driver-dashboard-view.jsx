import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { Popup, Marker, Polyline, TileLayer, MapContainer } from 'react-leaflet';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { useAuth } from 'src/auth/hooks/use-auth';

// Fix for leaflet icon marker default resolution
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers for premium look
const createMarkerIcon = (color, text) =>
  L.divIcon({
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 11px;">${text}</div>`,
    className: 'custom-marker-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const DEPOT_COORDS = [33.693396, 10.929588];

const truckIcon = L.divIcon({
  html: `<div style="background-color: #1890FF; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.35); font-size: 18px; z-index: 1000;">🚚</div>`,
  className: 'custom-truck-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export function DriverDashboardView() {
  const { user } = useAuth();
  const [routesData, setRoutesData] = useState(null);
  const [completedList, setCompletedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // Form states for recording collection
  const [collectedWeight, setCollectedWeight] = useState('');
  const [collectedQuality, setCollectedQuality] = useState('');

  const [driverGpsCoords, setDriverGpsCoords] = useState(null);
  const [roadPaths, setRoadPaths] = useState({});

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setDriverGpsCoords([latitude, longitude]);
          try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/auth/current-location', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
          } catch (err) {
            console.error('Failed to sync location to server:', err);
          }
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setDriverGpsCoords([latitude, longitude]);
          try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/auth/current-location', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
          } catch (err) {
            console.error('Failed to sync location to server:', err);
          }
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
    return undefined;
  }, []);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch('http://localhost:5000/api/collections/optimized-routes', { headers });
      const json = await res.json();
      if (json.success) {
        setRoutesData(json.data);
        const doneIds = (json.data.completedToday || []).map((r) => r.hotel.toString());
        setCompletedList(doneIds);
        setErrorMsg('');
      } else {
        setErrorMsg(json.message || 'Error loading collection route.');
      }
    } catch (err) {
      console.error('Error fetching driver routes:', err);
      setErrorMsg('Failed to load collection route from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleOpenRecordModal = (stop) => {
    setSelectedStop(stop);
    setCollectedWeight(stop.weight);
    setCollectedQuality(stop.organicMatter);
    setOpenModal(true);
  };

  const handleRecordCollection = async () => {
    if (!selectedStop) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/collections/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotelId: selectedStop.id,
          collector: 'pnud',
          weight: Number(collectedWeight),
          organicMatter: Number(collectedQuality),
          status: 'completed',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setOpenModal(false);
        setLoading(true);
        await fetchRoutes();
      }
    } catch (err) {
      console.error('Error recording collection:', err);
    }
  };

  const pnudRoute = routesData?.pnud?.route || [];
  const muniRoute = routesData?.municipality?.route || [];

  // Calculate stats
  const totalWeightInRoute = pnudRoute.reduce((acc, r) => acc + r.weight, 0);
  const totalCollectedWeight = pnudRoute
    .filter((r) => completedList.includes(r.id))
    .reduce((acc, r) => acc + r.weight, 0);

  const capacityTons = routesData?.config?.truckCapacityTons ?? 16.7;
  const maxTruckCapacity = capacityTons * 1000;
  const currentLoad = totalCollectedWeight;
  const remainingCapacity = maxTruckCapacity - currentLoad;

  // Calculate route metrics (ETA, Departure)
  // Dynamic: starts from current time, average speed 50 km/h, service time 10 mins per stop
  const AVG_SPEED_KMH = 50;
  let lastDepTime = dayjs();
  const routeWithTimes = pnudRoute.map((stop) => {
    const dist = stop.distanceFromLastStop || 0; // km
    const travelTimeMin = Math.round((dist / AVG_SPEED_KMH) * 60);
    const arrivalTime = lastDepTime.add(travelTimeMin, 'minute');
    const departureTime = arrivalTime.add(10, 'minute');
    lastDepTime = departureTime;

    return {
      ...stop,
      arrivalTime: arrivalTime.format('hh:mm A'),
      departureTime: departureTime.format('hh:mm A'),
      travelTimeMin,
      distanceKm: dist,
    };
  });

  // Runs definition
  const pnudRuns = routesData?.pnud?.runs || [];

  // Calculate truck's current location (prefer live driver GPS coordinates, fallback to last completed stop or depot)
  const getLastCompletedCoords = () => {
    for (let i = routeWithTimes.length - 1; i >= 0; i--) {
      if (completedList.includes(routeWithTimes[i].id)) {
        return [routeWithTimes[i].location.lat, routeWithTimes[i].location.lng];
      }
    }
    return DEPOT_COORDS;
  };
  const truckCoords = driverGpsCoords || getLastCompletedCoords();

  useEffect(() => {
    if (!routesData) return;

    const fetchAllRoadPaths = async () => {
      const paths = {};
      const runs = routesData.pnud?.runs || [];

      for (let runIdx = 0; runIdx < runs.length; runIdx++) {
        const run = runs[runIdx];
        const isFirstRun = runIdx === 0;
        const startCoord = isFirstRun ? truckCoords : DEPOT_COORDS;
        const stopCoords = run.route.map((stop) => [stop.location.lat, stop.location.lng]);
        const straightPath = [startCoord, ...stopCoords, DEPOT_COORDS];

        try {
          const coordString = straightPath.map((c) => `${c[1]},${c[0]}`).join(';');
          const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
          const response = await fetch(url);
          const data = await response.json();
          if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
            paths[run.runNumber] = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
          } else {
            paths[run.runNumber] = straightPath;
          }
        } catch (err) {
          console.error(`Failed to fetch OSRM road path for run ${run.runNumber}:`, err);
          paths[run.runNumber] = straightPath;
        }
      }
      setRoadPaths(paths);
    };

    fetchAllRoadPaths();
  }, [routesData, truckCoords]);

  if (loading) {
    return (
      <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" variant="filled">
          {errorMsg}
        </Alert>
      </Box>
    );
  }

  const isActiveDriver = routesData?.config?.activeDriver
    ? (routesData.config.activeDriver._id || routesData.config.activeDriver) === user?._id
    : false;

  if (routesData && !isActiveDriver) {
    return (
      <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', px: 3, py: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
        <Card sx={{ p: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'error.lighter', color: 'error.main' }}>
            <Iconify icon="solar:lock-bold-duotone" width={48} />
          </Box>
          <div>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Dashboard Locked
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You are not currently assigned as the active driver in the system.
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 2.5, color: 'text.disabled' }}>
              Please contact the municipality administrator to assign your account as the active collection driver.
            </Typography>
          </div>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', px: { xs: 2, md: 5 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={user?.avatar} sx={{ width: 56, height: 56 }} />
          <div>
            <Typography variant="h4">Driver Dashboard</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Welcome back, {user?.name || 'Driver'} &bull; Today&apos;s PNUD Collection Route (Djerba)
            </Typography>
          </div>
        </Box>
        <Typography variant="subtitle2" sx={{ bgcolor: 'background.neutral', px: 2, py: 1, borderRadius: 1.5 }}>
          {dayjs().format('dddd, MMMM D, YYYY')}
        </Typography>
      </Box>

      {/* Truck Load Capacity Stats */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Card sx={{ p: 3, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Current Truck Load
          </Typography>
          <Typography variant="h4">
            {(currentLoad / 1000).toFixed(2)} / {(maxTruckCapacity / 1000).toFixed(2)} <Typography component="span" variant="subtitle2" color="text.secondary">tons</Typography>
          </Typography>
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min((currentLoad / maxTruckCapacity) * 100, 100)}
              color={currentLoad > maxTruckCapacity * 0.9 ? 'error' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Remaining capacity: {(remainingCapacity / 1000).toFixed(2)} tons
          </Typography>
        </Card>

        <Card sx={{ p: 3, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Route Progress
          </Typography>
          <Typography variant="h4">
            {pnudRoute.filter((r) => completedList.includes(r.id)).length} / {pnudRoute.length}{' '}
            <Typography component="span" variant="subtitle2" color="text.secondary">stops completed</Typography>
          </Typography>
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={pnudRoute.length ? (pnudRoute.filter((r) => completedList.includes(r.id)).length / pnudRoute.length) * 100 : 0}
              color="success"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Total active payload: {(totalWeightInRoute / 1000).toFixed(2)} tons
          </Typography>
        </Card>
      </Box>

      {/* Main Layout */}
      <Box sx={{ display: 'flex', gap: 3, height: 600 }}>
        {/* Map Column */}
        <Box sx={{ flex: 1.5, position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <MapContainer center={DEPOT_COORDS} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Depot Marker */}
            <Marker position={DEPOT_COORDS} icon={createMarkerIcon('#FF3030', 'Depot')}>
              <Popup>
                <Typography variant="subtitle2">PNUD Methanization Depot</Typography>
              </Popup>
            </Marker>

            {/* PNUD Route Markers (Green) */}
            {routeWithTimes.map((stop, idx) => {
              const isDone = completedList.includes(stop.id);
              const color = isDone ? '#919EAB' : '#22C55E';
              return (
                <Marker
                  key={stop.id}
                  position={[stop.location.lat, stop.location.lng]}
                  icon={createMarkerIcon(color, isDone ? '✓' : idx + 1)}
                >
                  <Popup>
                    <Typography variant="subtitle2">{stop.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Weight: {stop.weight} kg &bull; Organic: {stop.organicMatter}%
                    </Typography>
                    {stop.distanceKm > 0 && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                        📏 {stop.distanceKm.toFixed(1)} km away &bull; ~{stop.travelTimeMin} min drive
                      </Typography>
                    )}
                    {stop.arrivalTime && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                        ETA: {stop.arrivalTime}
                      </Typography>
                    )}
                  </Popup>
                </Marker>
              );
            })}

            {/* Municipality Hotels (Red markers - not meeting criteria) */}
            {muniRoute.map((stop) => (
              <Marker
                key={stop.id}
                position={[stop.location.lat, stop.location.lng]}
                icon={createMarkerIcon('#FF5630', '!')}
              >
                <Popup>
                  <Typography variant="subtitle2" color="error.main">{stop.name} (Skipped)</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Weight: {stop.weight} kg &bull; Organic: {stop.organicMatter}%
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'error.main', fontWeight: 'bold', mt: 0.5 }}>
                    Reason: {stop.reason === 'low_quality' ? 'Low Organic Quality' : 'Low Waste Quantity'}
                  </Typography>
                </Popup>
              </Marker>
            ))}

            {/* Path lines - multiple PNUD runs shown in different colors */}
            {pnudRuns.map((run, runIdx) => {
              const isFirstRun = runIdx === 0;
              const startCoord = isFirstRun ? truckCoords : DEPOT_COORDS;
              const runPath = [
                startCoord,
                ...run.route.map((stop) => [stop.location.lat, stop.location.lng]),
                DEPOT_COORDS,
              ];
              // Colors matching requirement: Run 1 = Green, Run 2 = Blue, Run 3 = Orange, Run 4 = Purple
              const runColors = ['#22C55E', '#1890FF', '#FFAB00', '#8E33FF', '#006C9C', '#B71D18'];
              const color = runColors[runIdx % runColors.length];

              return (
                <Polyline
                  key={run.runNumber}
                  positions={roadPaths[run.runNumber] || runPath}
                  color={color}
                  weight={4}
                  dashArray={isFirstRun ? 'none' : '5, 10'} // Solid for the best/current route, dashed for upcoming routes
                />
              );
            })}

            {/* Truck Current Location Marker */}
            <Marker position={truckCoords} icon={truckIcon}>
              <Popup>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>🚚 Collection Truck</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {truckCoords[0] === DEPOT_COORDS[0] && truckCoords[1] === DEPOT_COORDS[1]
                    ? 'At PNUD Methanization Depot'
                    : 'On active collection run'}
                </Typography>
              </Popup>
            </Marker>
          </MapContainer>
        </Box>

        {/* Sidebar Stops List */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', minHeight: 0 }}>
          <Typography variant="subtitle1" sx={{ px: 1, color: 'text.secondary', fontWeight: 'bold' }}>
            PNUD Collection Checklist
          </Typography>
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              overflowY: 'scroll',
              pr: 1,
              minHeight: 0,
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 4 },
              '&::-webkit-scrollbar-track': { bgcolor: 'grey.100', borderRadius: 4 },
            }}
          >
            {routeWithTimes.map((stop, index) => {
              const isDone = completedList.includes(stop.id);

              return (
                <Card
                  key={stop.id}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: isDone ? 'divider' : 'success.lighter',
                    bgcolor: isDone ? 'action.hover' : 'background.paper',
                    opacity: isDone ? 0.75 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Step badge */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isDone ? 'action.selected' : 'success.main',
                        color: 'white',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ m: 'auto' }}>
                        {isDone ? '✓' : index + 1}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 'bold', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {stop.name}
                    </Typography>
                  </Box>

                  {/* Details row */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary">Weight</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stop.weight} kg</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary">Organic Matter</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stop.organicMatter}%</Typography>
                      </Box>
                      {stop.distanceKm > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="caption" color="text.secondary">Distance</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stop.distanceKm.toFixed(1)} km</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary">ETA</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>{stop.arrivalTime}</Typography>
                      </Box>
                    </Box>

                    {/* Button */}
                    <Button
                      variant={isDone ? 'outlined' : 'contained'}
                      color={isDone ? 'inherit' : 'success'}
                      size="medium"
                      disabled={isDone}
                      onClick={() => handleOpenRecordModal(stop)}
                      sx={{ px: 3, py: 1 }}
                    >
                      {isDone ? 'Collected' : 'Collect'}
                    </Button>
                  </Box>
                </Card>
              );
            })}

            {/* Red Skipped Municipality Hotels */}
            {muniRoute.map((stop) => {
              const isDone = completedList.includes(stop.id);
              return (
                <Card
                  key={stop.id}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'error.lighter',
                    bgcolor: 'error.lighter',
                    opacity: 0.85,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'error.main',
                        color: 'white',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ m: 'auto' }}>
                        {isDone ? '✓' : '!'}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ color: 'error.dark', fontWeight: 'bold', flexGrow: 1 }}>
                      {stop.name} (Skipped)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="error.dark">Weight</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.dark' }}>{stop.weight} kg</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="error.dark">Organic Matter</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.dark' }}>{stop.organicMatter}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="error.dark">Reason</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.dark', textTransform: 'capitalize' }}>
                          {stop.reason === 'low_quality' ? 'Low Quality' : 'Low Quantity'}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="outlined"
                      color="error"
                      size="medium"
                      disabled
                      sx={{ px: 3, py: 1 }}
                    >
                      Bypassed
                    </Button>
                  </Box>
                </Card>
              );
            })}

            {routeWithTimes.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No PNUD collections scheduled for today.
              </Alert>
            )}
          </Box>
        </Box>
      </Box>

      {/* Record Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Waste Collection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Please confirm the actual weight and organic quality recorded from the sensors at{' '}
            <strong>{selectedStop?.name}</strong>.
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Weight (kg)"
              type="number"
              fullWidth
              value={collectedWeight}
              onChange={(e) => setCollectedWeight(e.target.value)}
            />
            <TextField
              label="Organic Matter (%)"
              type="number"
              fullWidth
              value={collectedQuality}
              onChange={(e) => setCollectedQuality(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleRecordCollection}
            disabled={!collectedWeight || !collectedQuality}
          >
            Confirm Collection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
