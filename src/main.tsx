import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppKitProvider } from './config/appkit';
import './index.css';

// Silence ALL console output in production (security)
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.trace = () => {};
  console.dir = () => {};
  console.table = () => {};
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppKitProvider>
        <App />
      </AppKitProvider>
    </BrowserRouter>
  </StrictMode>
);
