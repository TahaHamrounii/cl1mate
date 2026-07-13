import { Header } from './header';

// ----------------------------------------------------------------------

export function EcommerceLayout({ children }) {
  return (
    <>
      <Header />

      {children}
    </>
  );
}
