import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useAuth } from 'src/auth/hooks/use-auth';

// ----------------------------------------------------------------------

export function DashboardPlaceholderView({ role }) {
  const { user } = useAuth();

  return (
    <Container sx={{ py: 10 }}>
      <Card
        sx={{
          p: 5,
          textAlign: 'center',
          bgcolor: 'background.neutral',
          border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          Welcome back, {user?.name || 'User'}! 👋
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Your <strong>{role ? role.toUpperCase() : 'Dashboard'}</strong> portal is currently under construction.
        </Typography>
      </Card>
    </Container>
  );
}
