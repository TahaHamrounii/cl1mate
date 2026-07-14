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

import { useAuth } from 'src/auth/hooks/use-auth';

// Fix for leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createMarkerIcon = (color, text) =>
  L.divIcon({
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 11px;">${text}</div>`,
    className: 'custom-marker-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const DEPOT_COORDS = [33.693396, 10.929588];

const userLocationIcon = L.divIcon({
  html: `<div style="background-color: #00B8D9; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); font-size: 16px;">👤</div>`,
  className: 'custom-user-location-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export function MunicipalityDashboardView() {
  const { user } = useAuth();
  const [routesData, setRoutesData] = useState(null);
  const [completedList, setCompletedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [collectedWeight, setCollectedWeight] = useState('');
  const [collectedQuality, setCollectedQuality] = useState('');

  const [userGpsCoords, setUserGpsCoords] = useState(null);
  const [roadPath, setRoadPath] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserGpsCoords([latitude, longitude]);
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserGpsCoords([latitude, longitude]);
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
      }
    } catch (err) {
      console.error('Error fetching municipality routes:', err);
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
          collector: 'municipality',
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

  const muniRoute = routesData?.municipality?.route || [];
  const pnudRoute = routesData?.pnud?.route || [];

  // Calculate statistics
  const totalWeightInRoute = muniRoute.reduce((acc, r) => acc + r.weight, 0);
  const totalCollectedWeight = muniRoute
    .filter((r) => completedList.includes(r.id))
    .reduce((acc, r) => acc + r.weight, 0);

  // Compute ETAs for Municipality route stops
  // Dynamic: starts from current time, average speed 50 km/h, service time 10 mins per stop
  const AVG_SPEED_KMH = 50;
  let lastDepTime = dayjs();
  const routeWithTimes = muniRoute.map((stop) => {
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

  const activePath = muniRoute.map((r) => [r.location.lat, r.location.lng]);

  useEffect(() => {
    if (activePath.length < 2) {
      setRoadPath(activePath);
      return;
    }
    const fetchMuniRoadPath = async () => {
      try {
        const coordString = activePath.map((c) => `${c[1]},${c[0]}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
          setRoadPath(data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]));
        } else {
          setRoadPath(activePath);
        }
      } catch (err) {
        console.error('Failed to fetch OSRM road path for municipality:', err);
        setRoadPath(activePath);
      }
    };
    fetchMuniRoadPath();
  }, [routesData, activePath]);

  if (loading) {
    return (
      <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
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
            <Typography variant="h4">Municipality Collection Dashboard</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Welcome back, {user?.name || 'Operator'} &bull; Today&apos;s collection route in Djerba (Low Quality/Weight Redirects)
            </Typography>
          </div>
        </Box>
        <Typography variant="subtitle2" sx={{ bgcolor: 'background.neutral', px: 2, py: 1, borderRadius: 1.5 }}>
          {dayjs().format('dddd, MMMM D, YYYY')}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Card sx={{ p: 3, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Total Collected Waste
          </Typography>
          <Typography variant="h4">
            {(totalCollectedWeight / 1000).toFixed(2)} <Typography component="span" variant="subtitle2" color="text.secondary">tons</Typography>
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Out of {(totalWeightInRoute / 1000).toFixed(2)} tons pending today
          </Typography>
        </Card>

        <Card sx={{ p: 3, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Stops Progress
          </Typography>
          <Typography variant="h4">
            {muniRoute.filter((r) => completedList.includes(r.id)).length} / {muniRoute.length}{' '}
            <Typography component="span" variant="subtitle2" color="text.secondary">stops completed</Typography>
          </Typography>
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={muniRoute.length ? (muniRoute.filter((r) => completedList.includes(r.id)).length / muniRoute.length) * 100 : 0}
              color="warning"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Card>
      </Box>

      {/* Main Grid */}
      <Box sx={{ display: 'flex', gap: 3, height: 600 }}>
        {/* Map */}
        <Box sx={{ flex: 1.5, position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <MapContainer center={DEPOT_COORDS} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Live User Current Location Marker */}
            {userGpsCoords && (
              <Marker position={userGpsCoords} icon={userLocationIcon}>
                <Popup>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>📍 Your Current Location</Typography>
                </Popup>
              </Marker>
            )}

            {/* Municipality Route Markers (Orange) */}
            {routeWithTimes.map((stop, idx) => {
              const isDone = completedList.includes(stop.id);
              const color = isDone ? '#919EAB' : '#FFAB00';
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
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                      ETA: {stop.arrivalTime}
                    </Typography>
                  </Popup>
                </Marker>
              );
            })}

            {/* PNUD hotels shown as neutral/grey markers on municipality map, but not routed */}
            {pnudRoute.map((stop) => {
              const isDone = completedList.includes(stop.id);
              const color = isDone ? '#919EAB' : '#00A76F';
              return (
                <Marker
                  key={stop.id}
                  position={[stop.location.lat, stop.location.lng]}
                  icon={createMarkerIcon(color, 'P')}
                >
                  <Popup>
                    <Typography variant="subtitle2">{stop.name} (PNUD)</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Weight: {stop.weight} kg &bull; Organic: {stop.organicMatter}%
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      Handled by PNUD route
                    </Typography>
                  </Popup>
                </Marker>
              );
            })}

            {activePath.length > 1 && (
              <Polyline positions={roadPath.length > 0 ? roadPath : activePath} color="#FFAB00" weight={4} dashArray="5, 10" />
            )}
          </MapContainer>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', minHeight: 0 }}>
          <Typography variant="subtitle1" sx={{ px: 1, color: 'text.secondary', fontWeight: 'bold' }}>
            Scheduled Stops Checklist
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
                    borderColor: isDone ? 'divider' : 'warning.lighter',
                    bgcolor: isDone ? 'action.hover' : 'background.paper',
                    opacity: isDone ? 0.75 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Badge */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isDone ? 'action.selected' : 'warning.main',
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
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary">Weight</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stop.weight} kg</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary">Organic Matter</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stop.organicMatter}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary">ETA</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>{stop.arrivalTime}</Typography>
                      </Box>
                    </Box>

                    {/* Button */}
                    <Button
                      variant={isDone ? 'outlined' : 'contained'}
                      color={isDone ? 'inherit' : 'warning'}
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

            {/* Green PNUD Hotels */}
            {pnudRoute.map((stop) => {
              const isDone = completedList.includes(stop.id);
              return (
                <Card
                  key={stop.id}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'success.lighter',
                    bgcolor: 'success.lighter',
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
                        bgcolor: 'success.main',
                        color: 'white',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ m: 'auto' }}>
                        {isDone ? '✓' : 'P'}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ color: 'success.dark', fontWeight: 'bold', flexGrow: 1 }}>
                      {stop.name} (PNUD Route)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="success.dark">Weight</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>{stop.weight} kg</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="success.dark">Organic Matter</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>{stop.organicMatter}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="success.dark">Status</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>Routed to PNUD</Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="outlined"
                      color="success"
                      size="medium"
                      disabled
                      sx={{ px: 3, py: 1 }}
                    >
                      PNUD
                    </Button>
                  </Box>
                </Card>
              );
            })}

            {routeWithTimes.length === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Great! No municipal collections left today.
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
            color="warning"
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
