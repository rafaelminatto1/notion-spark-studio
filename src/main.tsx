
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('=== MAIN.TSX START ===');
console.log('main.tsx: Starting application...');

try {
  const rootElement = document.getElementById("root");
  console.log('main.tsx: Root element found:', !!rootElement);

  if (!rootElement) {
    console.error('main.tsx: Root element not found!');
    throw new Error('Root element not found');
  }

  console.log('main.tsx: Creating root...');
  const root = createRoot(rootElement);
  console.log('main.tsx: Root created successfully');

  console.log('main.tsx: Rendering App component...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.log('main.tsx: App rendered successfully');
  console.log('=== MAIN.TSX END ===');
} catch (error) {
  console.error('=== MAIN.TSX ERROR ===', error);
  // Fallback rendering
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Error loading application</h1>
      <p>Error: ${error.message}</p>
      <p>Check console for details</p>
    </div>
  `;
}
