import { Nav, NavUl } from '../components';
import { NavList } from './nav-desktop-list';

// ----------------------------------------------------------------------

export function NavDesktop({ data, sx, ...other }) {
  return (
    <Nav sx={sx} {...other}>
      <NavUl sx={{ gap: 5, flexDirection: 'row', alignItems: 'center' }}>
        {data.map((list) => (
          <NavList key={list.title} data={list} />
        ))}
      </NavUl>
    </Nav>
  );
}
