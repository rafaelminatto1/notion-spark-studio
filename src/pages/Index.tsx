
import React, { useState, useEffect } from 'react';

console.log('=== INDEX.TSX START ===');

const Index = () => {
  console.log('=== INDEX COMPONENT RENDER START ===');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Index: useEffect running...');
    
    try {
      // Simulate basic initialization
      setTimeout(() => {
        console.log('Index: Setting loading to false...');
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Index: Error in useEffect:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  console.log('Index: Render state - loading:', isLoading, 'error:', error);

  if (error) {
    console.log('Index: Rendering error state');
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Index Error</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    console.log('Index: Rendering loading state');
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '4px solid #3b82f6', 
            borderTop: '4px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Carregando aplicação...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  console.log('Index: Rendering main content');
  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Application Loaded Successfully!</h1>
      <p>The basic structure is working. Ready to add features.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <p><strong>Debug Info:</strong></p>
        <p>Component: Index</p>
        <p>Status: Loaded</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

console.log('=== INDEX.TSX END ===');
export default Index;
