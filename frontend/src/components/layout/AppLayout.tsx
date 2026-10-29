import { Outlet } from 'react-router-dom';
import { SocketProvider } from '../../context/SocketContext';
import { Navbar } from './Navbar';

export function AppLayout() {
  return (
    <SocketProvider>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </SocketProvider>
  );
}
