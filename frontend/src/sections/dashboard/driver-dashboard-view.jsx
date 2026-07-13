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
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

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

const DEPOT_COORDS = [33.8075, 10.8451];

export function DriverDashboardView() {
  const { user } = useAuth();
  const [routesData, setRoutesData] = useState(null);
  const [completedList, setCompletedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // Form states for recording collection
  const [collectedWeight, setCollectedWeight] = useState('');
  const [collectedQuality, setCollectedQuality] = useState('');

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
      console.error('Error fetching driver routes:', err);
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

  if (loading) {
    return (
      <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const pnudRoute = routesData?.pnud?.route || [];
  const muniRoute = routesData?.municipality?.route || [];

  // Calculate stats
  const totalWeightInRoute = pnudRoute.reduce((acc, r) => acc + r.weight, 0);
  const totalCollectedWeight = pnudRoute
    .filter((r) => completedList.includes(r.id))
    .reduce((acc, r) => acc + r.weight, 0);

  const maxTruckCapacity = 16.7 * 1000; // 16,700 kg
  const currentLoad = totalCollectedWeight;
  const remainingCapacity = maxTruckCapacity - currentLoad;

  // Calculate route metrics (ETA, Departure)
  // Assumes average speed of 40km/h (0.67km/min), service time of 10mins, start at 8:00 AM
  let lastDepTime = dayjs().set('hour', 8).set('minute', 0);
  const routeWithTimes = pnudRoute.map((stop) => {
    const dist = stop.distanceFromLastStop || 0;
    const travelTimeMin = Math.round(dist / (40 / 60));
    const arrivalTime = lastDepTime.add(travelTimeMin, 'minute');
    const departureTime = arrivalTime.add(10, 'minute');
    lastDepTime = departureTime;

    return {
      ...stop,
      arrivalTime: arrivalTime.format('hh:mm A'),
      departureTime: departureTime.format('hh:mm A'),
      travelTimeMin,
    };
  });

  // Polyline path coordinates (depot -> pnud route stops)
  const activePath = [DEPOT_COORDS, ...pnudRoute.map((r) => [r.location.lat, r.location.lng])];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
            {(currentLoad / 1000).toFixed(2)} / 16.70 <Typography component="span" variant="subtitle2" color="text.secondary">tons</Typography>
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
      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 300px)', minHeight: 500 }}>
        {/* Map Column */}
        <Box sx={{ flex: 1.5, position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
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

            {/* Path lines - only for PNUD */}
            {activePath.length > 1 && (
              <Polyline
                positions={activePath}
                color="#22C55E"
                weight={4}
                dashArray="5, 10"
              />
            )}
          </MapContainer>
        </Box>

        {/* Sidebar Stops List */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'scroll', pr: 1, maxHeight: 'calc(100vh - 300px)', minHeight: 500, '&::-webkit-scrollbar': { width: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 4 }, '&::-webkit-scrollbar-track': { bgcolor: 'grey.100', borderRadius: 4 } }}>
          <Typography variant="subtitle1" sx={{ px: 1, color: 'text.secondary' }}>
            PNUD Collection Checklist
          </Typography>
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
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {/* Step badge */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isDone ? 'action.selected' : 'success.main',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ m: 'auto' }}>
                    {isDone ? '✓' : index + 1}
                  </Typography>
                </Box>

                {/* Details */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                    {stop.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Weight: <strong>{stop.weight} kg</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      &bull; Quality: <strong>{stop.organicMatter}%</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ bgcolor: 'background.neutral', px: 1, py: 0.5, borderRadius: 0.5, fontWeight: 'bold' }}>
                      ETA: {stop.arrivalTime}
                    </Typography>
                  </Box>
                </Box>

                {/* Button */}
                <Button
                  variant={isDone ? 'outlined' : 'contained'}
                  color={isDone ? 'inherit' : 'success'}
                  size="small"
                  disabled={isDone}
                  onClick={() => handleOpenRecordModal(stop)}
                >
                  {isDone ? 'Collected' : 'Collect'}
                </Button>
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
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'error.main',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ m: 'auto' }}>
                    {isDone ? '✓' : '!'}
                  </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'error.dark', fontWeight: 'bold' }}>
                    {stop.name} (Skipped)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'error.dark' }}>
                      Weight: <strong>{stop.weight} kg</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'error.dark' }}>
                      &bull; Quality: <strong>{stop.organicMatter}%</strong>
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'error.dark', fontWeight: 'bold' }}>
                    Reason: {stop.reason === 'low_quality' ? 'Low Quality' : 'Low Quantity'}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  disabled
                >
                  Bypassed
                </Button>
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
    </Container>
  );
}
