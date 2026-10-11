import { BrowserRouter } from 'react-router-dom';
import { ROUTER_FUTURE } from './routerFuture';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter future={ROUTER_FUTURE}>
      <AppRoutes />
    </BrowserRouter>
  );
}
