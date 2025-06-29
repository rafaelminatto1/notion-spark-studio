
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import DocumentEditor from '@/app/editor/[id]/page'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Routes>
              <Route path="/" element={<Navigate to="/editor/new" replace />} />
              <Route path="/editor/:id" element={<DocumentEditor />} />
              <Route path="*" element={<Navigate to="/editor/new" replace />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
