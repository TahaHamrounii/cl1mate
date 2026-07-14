import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useState, useEffect } from 'react';
import { Popup, Marker, Polyline, TileLayer, MapContainer } from 'react-leaflet';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// Custom icons for Leaflet map
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

export function AdminDashboardView() {
  const [data, setData] = useState(null);
  const [routesData, setRoutesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingConfig, setSubmittingConfig] = useState(false);

  // Configuration form states
  const [minOrganic, setMinOrganic] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [truckCapacity, setTruckCapacity] = useState('');
  const [activeDriverId, setActiveDriverId] = useState('');

  // Association modal state
  const [selectedHotelUser, setSelectedHotelUser] = useState(null);
  const [associateModal, setAssociateModal] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const [hotelLat, setHotelLat] = useState('');
  const [hotelLng, setHotelLng] = useState('');
  const [hotelThreshold, setHotelThreshold] = useState('100');

  // Manual Hotel registration
  const [registerModal, setRegisterModal] = useState(false);
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelEmail, setNewHotelEmail] = useState('');
  const [newHotelPassword, setNewHotelPassword] = useState('');
  const [newHotelLat, setNewHotelLat] = useState('');
  const [newHotelLng, setNewHotelLng] = useState('');
  const [newHotelPhone, setNewHotelPhone] = useState('');

  // Hotel detail modal
  const [viewHotel, setViewHotel] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch admin stats & collections
      const res = await fetch('http://localhost:5000/api/admin/dashboard', { headers });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setMinOrganic(json.data.config?.minOrganicPercentage || 95);
        setMinWeight(json.data.config?.minWeightThreshold || 100);
        setTruckCapacity(json.data.config?.truckCapacityTons || 16.7);
        setActiveDriverId(json.data.config?.activeDriver?._id || '');
      }

      // Fetch collection route details (planned paths)
      const routeRes = await fetch('http://localhost:5000/api/collections/optimized-routes', { headers });
      const routeJson = await routeRes.json();
      if (routeJson.success) {
        setRoutesData(routeJson.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 30s to pick up live driver location updates
    const intervalId = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleUpdateConfig = async () => {
    setSubmittingConfig(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          minOrganicPercentage: Number(minOrganic),
          minWeightThreshold: Number(minWeight),
          truckCapacityTons: Number(truckCapacity),
          activeDriver: activeDriverId || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating config:', err);
    } finally {
      setSubmittingConfig(false);
    }
  };

  const handleUserStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const handleOpenAssociateModal = (user) => {
    setSelectedHotelUser(user);
    setHotelName(user.name);
    setHotelLat('');
    setHotelLng('');
    setAssociateModal(true);
  };

  const handleAssociateHotel = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/associate-hotel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedHotelUser._id,
          name: hotelName,
          lat: Number(hotelLat),
          lng: Number(hotelLng),
          minWeightThreshold: Number(hotelThreshold),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAssociateModal(false);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Error associating hotel profile:', err);
    }
  };

  const handleRegisterHotel = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newHotelName,
          email: newHotelEmail,
          password: newHotelPassword,
          lat: Number(newHotelLat),
          lng: Number(newHotelLng),
          minWeightThreshold: Number(newHotelPhone),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRegisterModal(false);
        // Clear form
        setNewHotelName('');
        setNewHotelEmail('');
        setNewHotelPassword('');
        setNewHotelLat('');
        setNewHotelLng('');
        setNewHotelPhone('');
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Error registering hotel:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Lists
  const users = data?.users || [];
  const hotels = data?.hotels || [];
  const drivers = users.filter((u) => u.role === 'driver');
  const municipalities = users.filter((u) => u.role === 'municipality');
  const hotelUsers = users.filter((u) => u.role === 'hotel');

  // Filter pending lists
  const pendingHotelUsers = hotelUsers.filter(hu => hu.status === 'pending' && !hotels.some(h => h.user?._id === hu._id));
  const pendingDrivers = drivers.filter(d => d.status === 'pending');
  const pendingMunicipalities = municipalities.filter(m => m.status === 'pending');

  // Progress metrics from active driver collections
  const pnudRoute = routesData?.pnud?.route || [];
  const completedToday = routesData?.completedToday || [];
  const completedIds = completedToday.map((r) => r.hotel.toString());
  const stopsDoneCount = pnudRoute.filter((r) => completedIds.includes(r.id)).length;

  // Runs definition
  const pnudRuns = routesData?.pnud?.runs || [];

  // Calculate truck's current location (at the last completed stop, or at depot)
  const getLastCompletedCoords = () => {
    for (let i = pnudRoute.length - 1; i >= 0; i--) {
      if (completedIds.includes(pnudRoute[i].id)) {
        return [pnudRoute[i].location.lat, pnudRoute[i].location.lng];
      }
    }
    return DEPOT_COORDS;
  };
  const truckCoords = getLastCompletedCoords();
  const driverLiveCoords = data?.config?.activeDriver?.currentLocation?.lat && data?.config?.activeDriver?.currentLocation?.lng
    ? [data.config.activeDriver.currentLocation.lat, data.config.activeDriver.currentLocation.lng]
    : null;
  const adminTruckCoords = driverLiveCoords || truckCoords;

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 5 }, py: 4, display: 'flex', flexDirection: 'column', alignSelf: 'center' }}>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage collection parameters, verify active driver trajectory, and activate user profiles.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Collection Controls
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                label="Min Organic Matter Criteria (%)"
                type="number"
                value={minOrganic}
                onChange={(e) => setMinOrganic(e.target.value)}
                fullWidth
              />
              <TextField
                label="Min Waste Weight Threshold (kg)"
                type="number"
                value={minWeight}
                onChange={(e) => setMinWeight(e.target.value)}
                fullWidth
              />
              <TextField
                label="Truck Capacity Limit (Tons)"
                type="number"
                value={truckCapacity}
                onChange={(e) => setTruckCapacity(e.target.value)}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel id="active-driver-label">Assign Active Driver</InputLabel>
                <Select
                  labelId="active-driver-label"
                  label="Assign Active Driver"
                  value={activeDriverId}
                  onChange={(e) => setActiveDriverId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None (Disable map view)</em>
                  </MenuItem>
                  {drivers.filter(d => d.status === 'active').map((drv) => (
                    <MenuItem key={drv._id} value={drv._id}>
                      {drv.name} ({drv.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={submittingConfig}
              onClick={handleUpdateConfig}
              sx={{ py: 1.5, fontWeight: 'bold' }}
            >
              {submittingConfig ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Card>
        </Grid>

        {/* Global Overview Map & Trajectory */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Driver trajectory & Trainee Progress
              </Typography>
              {data?.config?.activeDriver && (
                <Typography variant="subtitle2" sx={{ bgcolor: 'success.lighter', color: 'success.dark', px: 1.5, py: 0.5, borderRadius: 0.5 }}>
                  Active Driver: <strong>{data.config.activeDriver.name}</strong> &bull; {stopsDoneCount} / {pnudRoute.length} stops
                </Typography>
              )}
            </Box>

            <Box sx={{ flexGrow: 1, height: 420, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <MapContainer center={DEPOT_COORDS} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Depot */}
                <Marker position={DEPOT_COORDS} icon={createMarkerIcon('#FF3030', 'Depot')}>
                  <Popup>
                    <Typography variant="subtitle2">PNUD Methanization Depot</Typography>
                  </Popup>
                </Marker>

                {/* Route markers */}
                {pnudRoute.map((stop, idx) => {
                  const isDone = completedIds.includes(stop.id);
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
                          Status: {isDone ? 'Collected' : 'Pending'} &bull; Weight: {stop.weight} kg
                        </Typography>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Path lines - multiple PNUD runs shown in different colors */}
                {pnudRuns.map((run, runIdx) => {
                  const runPath = [
                    DEPOT_COORDS,
                    ...run.route.map((stop) => [stop.location.lat, stop.location.lng]),
                    DEPOT_COORDS,
                  ];
                  // Colors matching requirement: Run 1 = Green, Run 2 = Blue, Run 3 = Orange, Run 4 = Purple
                  const runColors = ['#22C55E', '#1890FF', '#FFAB00', '#8E33FF', '#006C9C', '#B71D18'];
                  const color = runColors[runIdx % runColors.length];
                  const isFirstRun = runIdx === 0;

                  return (
                    <Polyline
                      key={run.runNumber}
                      positions={runPath}
                      color={color}
                      weight={4}
                      dashArray={isFirstRun ? 'none' : '5, 10'} // Solid for the best/current route, dashed for upcoming routes
                    />
                  );
                })}

                {/* Truck Current Location Marker */}
                <Marker position={adminTruckCoords} icon={truckIcon}>
                  <Popup>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>🚚 Collection Truck</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {driverLiveCoords ? 'Live GPS Location' : 'Last Completed Stop Location'}
                    </Typography>
                  </Popup>
                </Marker>
              </MapContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* User Management & Approvals checklist */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, minHeight: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Account Activations Checklist
              </Typography>
            </Box>

            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: 400,
                overflowY: 'scroll',
                pr: 1,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 },
              }}
            >
              {/* Drivers Activation */}
              {pendingDrivers.map((drv) => (
                <Card key={drv._id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {drv.name} (Driver)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {drv.email} &bull; Registered {new Date(drv.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" color="success" size="small" onClick={() => handleUserStatusUpdate(drv._id, 'active')}>
                      Activate
                    </Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => handleUserStatusUpdate(drv._id, 'rejected')}>
                      Reject
                    </Button>
                  </Stack>
                </Card>
              ))}

              {/* Municipalities Activation */}
              {pendingMunicipalities.map((muni) => (
                <Card key={muni._id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {muni.name} (Municipality)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {muni.email} &bull; Registered {new Date(muni.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" color="success" size="small" onClick={() => handleUserStatusUpdate(muni._id, 'active')}>
                      Accept
                    </Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => handleUserStatusUpdate(muni._id, 'rejected')}>
                      Reject
                    </Button>
                  </Stack>
                </Card>
              ))}

              {/* Hotel User Account Link Association */}
              {pendingHotelUsers.map((hu) => (
                <Card key={hu._id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {hu.name} (Hotel User)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {hu.email} &bull; Needs Location Association
                    </Typography>
                  </Box>
                  <Button variant="contained" color="warning" size="small" onClick={() => handleOpenAssociateModal(hu)}>
                    Associate & Activate
                  </Button>
                </Card>
              ))}

              {pendingDrivers.length === 0 && pendingMunicipalities.length === 0 && pendingHotelUsers.length === 0 && (
                <Alert severity="success">No pending account activations or profile link requests.</Alert>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Hotels Data Insights Grid */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, minHeight: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Hotels Sensor Data Insights
              </Typography>
              <Button variant="contained" color="primary" size="small" onClick={() => setRegisterModal(true)}>
                Add New Hotel
              </Button>
            </Box>

            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: 400,
                overflowY: 'scroll',
                pr: 1,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 },
              }}
            >
              {hotels.map((hotel) => (
                <Card key={hotel._id} variant="outlined" sx={{ p: 3.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {hotel.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Weight: <strong>{hotel.sensors?.weight || 0} kg</strong> &bull; Organic: <strong>{hotel.sensors?.organicMatter || 0}%</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ bgcolor: hotel.sensors?.status === 'offline' ? 'error.lighter' : 'success.lighter', color: hotel.sensors?.status === 'offline' ? 'error.dark' : 'success.dark', px: 1.5, py: 0.5, borderRadius: 0.75, fontWeight: 'bold', fontSize: 13 }}>
                      {hotel.sensors?.status || 'online'}
                    </Typography>
                    <IconButton onClick={() => setViewHotel(hotel)} sx={{ color: 'text.secondary' }}>
                      <Iconify icon="solar:eye-bold" width={22} />
                    </IconButton>
                  </Box>
                </Card>
              ))}

              {hotels.length === 0 && (
                <Alert severity="info">No hotels added to the system yet.</Alert>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Hotel Association Dialog */}
      <Dialog open={associateModal} onClose={() => setAssociateModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Associate Hotel User Profile</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Enter the coordinate location parameters to create the physical hotel profile for <strong>{selectedHotelUser?.name}</strong>.
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Hotel Display Name"
              fullWidth
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
            />
            <TextField
              label="Latitude Coordinates"
              type="number"
              fullWidth
              placeholder="e.g. 33.8123"
              value={hotelLat}
              onChange={(e) => setHotelLat(e.target.value)}
            />
            <TextField
              label="Longitude Coordinates"
              type="number"
              fullWidth
              placeholder="e.g. 10.8456"
              value={hotelLng}
              onChange={(e) => setHotelLng(e.target.value)}
            />
            <TextField
              label="Min weight threshold limit (kg)"
              type="number"
              fullWidth
              value={hotelThreshold}
              onChange={(e) => setHotelThreshold(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setAssociateModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="warning" onClick={handleAssociateHotel}>
            Activate & Link Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hotel Registration Dialog */}
      <Dialog open={registerModal} onClose={() => setRegisterModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Register New Hotel</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Create a new hotel account and profile at once.
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Hotel Name"
              fullWidth
              value={newHotelName}
              onChange={(e) => setNewHotelName(e.target.value)}
            />
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={newHotelEmail}
              onChange={(e) => setNewHotelEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={newHotelPassword}
              onChange={(e) => setNewHotelPassword(e.target.value)}
            />
            <TextField
              label="Latitude Coordinates"
              type="number"
              fullWidth
              placeholder="e.g. 33.8"
              value={newHotelLat}
              onChange={(e) => setNewHotelLat(e.target.value)}
            />
            <TextField
              label="Longitude Coordinates"
              type="number"
              fullWidth
              placeholder="e.g. 10.8"
              value={newHotelLng}
              onChange={(e) => setNewHotelLng(e.target.value)}
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={newHotelPhone}
              onChange={(e) => setNewHotelPhone(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setRegisterModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleRegisterHotel}>
            Add Hotel Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hotel Detail View Modal */}
      <Dialog open={!!viewHotel} onClose={() => setViewHotel(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Iconify icon="solar:buildings-2-bold" width={28} />
            {viewHotel?.name}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: viewHotel?.sensors?.status === 'offline' ? 'error.main' : 'success.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
              Sensors {viewHotel?.sensors?.status || 'online'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewHotel && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Sensor Gauges Row */}
              <Box sx={{ display: 'flex', gap: 3 }}>
                {/* Weight Gauge */}
                <Card sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>Current Waste Weight</Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                    <CircularProgress
                      variant="determinate"
                      value={Math.min(((viewHotel.sensors?.weight || 0) / 1200) * 100, 100)}
                      size={90}
                      thickness={5}
                      color={(viewHotel.sensors?.weight || 0) > 1000 ? 'error' : 'success'}
                    />
                    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <Typography variant="h6">{viewHotel.sensors?.weight || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">kg</Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">Max: 1,200 kg</Typography>
                </Card>

                {/* Organic Quality Gauge */}
                <Card sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>Organic Quality</Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                    <CircularProgress
                      variant="determinate"
                      value={viewHotel.sensors?.organicMatter || 0}
                      size={90}
                      thickness={5}
                      color={(viewHotel.sensors?.organicMatter || 0) >= 95 ? 'primary' : 'warning'}
                    />
                    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h6">{viewHotel.sensors?.organicMatter || 0}%</Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">PNUD threshold: 95%</Typography>
                </Card>
              </Box>

              {/* PNUD Qualification Bar */}
              <Card sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">PNUD Qualification</Typography>
                  <Typography variant="subtitle2" sx={{ color: (viewHotel.sensors?.organicMatter || 0) >= 95 && (viewHotel.sensors?.weight || 0) >= (viewHotel.config?.minWeightThreshold || 100) ? 'success.main' : 'warning.main', fontWeight: 'bold' }}>
                    {(viewHotel.sensors?.organicMatter || 0) >= 95 && (viewHotel.sensors?.weight || 0) >= (viewHotel.config?.minWeightThreshold || 100) ? '✅ Qualifies' : '⚠️ Does not qualify'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((viewHotel.sensors?.organicMatter || 0), 100)}
                  color={(viewHotel.sensors?.organicMatter || 0) >= 95 ? 'success' : 'warning'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Card>

              {/* Details Grid */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Card sx={{ p: 2, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Location</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {viewHotel.location?.lat?.toFixed(4)}, {viewHotel.location?.lng?.toFixed(4)}
                  </Typography>
                </Card>
                <Card sx={{ p: 2, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Min Weight Threshold</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{viewHotel.config?.minWeightThreshold || 100} kg</Typography>
                </Card>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Card sx={{ p: 2, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Last Sensor Update</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {viewHotel.sensors?.lastUpdated ? fDateTime(viewHotel.sensors.lastUpdated) : 'Never'}
                  </Typography>
                </Card>
                <Card sx={{ p: 2, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Linked Account</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {viewHotel.user?.email || viewHotel.user?.name || 'N/A'}
                  </Typography>
                </Card>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setViewHotel(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
