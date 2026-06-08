import { PageHeader } from '../patterns/PageHeader';
import { BottomNavBar } from '../patterns/BottomNavBar';

/**
 * MainLayout - Wraps protected pages with consistent Header and Bottom Navigation.
 */
export const MainLayout = ({ children, hideNav = false }) => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <PageHeader />
      
      {!hideNav && <BottomNavBar />}
      
      <main className={`pt-36 ${hideNav ? 'pt-24' : ''}`}>
        {children}
      </main>
    </div>
  );
};
