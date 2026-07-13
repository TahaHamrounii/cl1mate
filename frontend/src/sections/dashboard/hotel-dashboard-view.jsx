import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate, fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

import { useAuth } from 'src/auth/hooks/use-auth';

// ----------------------------------------------------------------------

export function HotelDashboardView() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const dbRes = await fetch('http://localhost:5000/api/hotels/my-dashboard', { headers });
        const dbJson = await dbRes.json();
        if (dbJson.success) setDashboardData(dbJson.data);

        const histRes = await fetch('http://localhost:5000/api/hotels/my-sensor-history?limit=300', { headers });
        const histJson = await histRes.json();
        if (histJson.success) setSensorHistory(histJson.data);
      } catch (error) {
        console.error('Error fetching hotel dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Aggregate 3 readings/day → daily averages for cleaner charts
  const dailyMap = {};
  sensorHistory.forEach((r) => {
    const day = dayjs(r.timestamp).format('MMM D');
    if (!dailyMap[day]) dailyMap[day] = { weight: [], organicMatter: [] };
    dailyMap[day].weight.push(r.weight);
    dailyMap[day].organicMatter.push(r.organicMatter);
  });
  // Limit to last 60 days so the x-axis isn't overcrowded
  const dailyEntries = Object.entries(dailyMap).slice(-30);
  const chartLabels = dailyEntries.map(([d]) => d);
  const weightSeries = dailyEntries.map(([, v]) =>
    Math.round(v.weight.reduce((a, b) => a + b, 0) / v.weight.length)
  );
  const qualitySeries = dailyEntries.map(([, v]) =>
    parseFloat((v.organicMatter.reduce((a, b) => a + b, 0) / v.organicMatter.length).toFixed(1))
  );

  const weightChartOptions = useChart({
    colors: ['#22C55E'],
    fill: { type: 'gradient' },
    xaxis: { categories: chartLabels },
    yaxis: { labels: { formatter: (v) => `${v} kg` } },
    tooltip: { y: { formatter: (v) => `${v} kg` } },
  });

  const qualityChartOptions = useChart({
    colors: ['#2065D1'],
    fill: { type: 'gradient' },
    xaxis: { categories: chartLabels },
    yaxis: {
      min: 85,
      max: 100,
      labels: { formatter: (v) => `${v}%` },
    },
    tooltip: { y: { formatter: (v) => `${v}%` } },
    annotations: {
      yaxis: [
        {
          y: 95,
          borderColor: '#FF4842',
          borderWidth: 2,
          strokeDashArray: 4,
          label: {
            text: 'PNUD threshold (95%)',
            style: { color: '#fff', background: '#FF4842' },
          },
        },
      ],
    },
  });

  if (loading) {
    return (
      <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hotel = dashboardData?.hotel;
  const metrics = dashboardData?.metrics;
  const history = dashboardData?.history || [];
  const upcoming = dashboardData?.upcomingCollections || [];

  const currentWeight = hotel?.sensors?.weight || 0;
  const currentOrganic = hotel?.sensors?.organicMatter || 0;
  const isOnline = hotel?.sensors?.status === 'online';

  const averageQuality = sensorHistory.length
    ? (sensorHistory.reduce((sum, r) => sum + r.organicMatter, 0) / sensorHistory.length).toFixed(1)
    : 0;

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', px: { xs: 2, md: 5 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={user?.avatar} sx={{ width: 64, height: 64 }} />
        <div>
          <Typography variant="h4">{hotel?.name || `Welcome back, ${user?.name}!`}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isOnline ? 'success.main' : 'error.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Sensors {isOnline ? 'Online' : 'Offline'} &bull; Last updated:{' '}
              {hotel?.sensors?.lastUpdated ? fDateTime(hotel.sensors.lastUpdated) : 'Never'}
            </Typography>
          </Box>
        </div>
      </Box>

      {/* Upcoming Alert */}
      {upcoming.length > 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          An upcoming waste collection is scheduled for{' '}
          <strong>{fDate(upcoming[0].scheduledDate)}</strong>.
        </Alert>
      )}

      {/* Live Readings & Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Weight Gauge */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: 250 }}>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
              Current Waste Weight
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <CircularProgress
                variant="determinate"
                value={Math.min((currentWeight / 1200) * 100, 100)}
                size={120}
                thickness={5}
                color={currentWeight > 1000 ? 'error' : 'success'}
              />
              <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <Typography variant="h5">{currentWeight}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>kg</Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Max bin capacity: 1,200 kg</Typography>
          </Card>
        </Grid>

        {/* Organic Gauge */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: 250 }}>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
              Organic Matter Quality
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <CircularProgress
                variant="determinate"
                value={currentOrganic}
                size={120}
                thickness={5}
                color={currentOrganic >= 95 ? 'primary' : 'warning'}
              />
              <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h4">{currentOrganic}%</Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>PNUD threshold: 95%</Typography>
          </Card>
        </Grid>

        {/* Metric Cards */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12}>
              <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '48%' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'success.lighter', color: 'success.dark' }}>
                  <Iconify icon="solar:trash-bin-trash-bold" width={28} />
                </Box>
                <div>
                  <Typography variant="h5">
                    {metrics?.totalCollected ? (metrics.totalCollected / 1000).toFixed(1) : 0} tons
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Waste Collected</Typography>
                </div>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '48%' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.lighter', color: 'primary.dark' }}>
                  <Iconify icon="solar:check-circle-bold" width={28} />
                </Box>
                <div>
                  <Typography variant="h5">{metrics?.totalPickups || 0}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Successful Pickups</Typography>
                </div>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* ApexCharts — full-width 50/50 row */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Card sx={{ p: 3, flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Waste Accumulation History (kg) — Last 90 days
          </Typography>
          <Chart
            type="area"
            series={[{ name: 'Weight (kg)', data: weightSeries }]}
            options={weightChartOptions}
            height={280}
          />
        </Card>

        <Card sx={{ p: 3, flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Organic Matter Quality (%) — Avg: {averageQuality}%
          </Typography>
          <Chart
            type="area"
            series={[{ name: 'Organic Quality (%)', data: qualitySeries }]}
            options={qualityChartOptions}
            height={280}
          />
        </Card>
      </Box>

      {/* Collection History Table */}
      <Card>
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle1">Recent Waste Collections</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Collector</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Organic Matter</TableCell>
                <TableCell>Outcome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{fDate(row.collectedAt)}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{row.collector}</TableCell>
                  <TableCell>{row.weight} kg</TableCell>
                  <TableCell>{row.organicMatter}%</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block',
                        fontSize: 12, fontWeight: 'bold',
                        bgcolor: row.collector === 'pnud' ? 'primary.lighter' : 'warning.lighter',
                        color: row.collector === 'pnud' ? 'primary.dark' : 'warning.dark',
                      }}
                    >
                      {row.collector === 'pnud' ? 'Recycled' : 'Redirected'}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No recent collections.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
