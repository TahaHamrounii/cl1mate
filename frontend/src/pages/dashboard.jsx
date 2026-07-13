import { HotelDashboardView } from 'src/sections/dashboard/hotel-dashboard-view';
import { DriverDashboardView } from 'src/sections/dashboard/driver-dashboard-view';
import { DashboardPlaceholderView } from 'src/sections/dashboard/placeholder-view';
import { MunicipalityDashboardView } from 'src/sections/dashboard/municipality-dashboard-view';

import { useAuth } from 'src/auth/hooks/use-auth';

// ----------------------------------------------------------------------

const metadata = {
  title: 'Dashboard - CL1MATE',
  description: 'Organic Waste Collection Management System Dashboard',
};

export default function Page() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'hotel':
        return <HotelDashboardView />;
      case 'driver':
        return <DriverDashboardView />;
      case 'municipality':
        return <MunicipalityDashboardView />;
      default:
        return <DashboardPlaceholderView role={user?.role} />;
    }
  };

  return (
    <>
      <title>{metadata.title}</title>
      {renderDashboard()}
    </>
  );
}
