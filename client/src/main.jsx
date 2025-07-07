import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import Admin from './Admin'

function SpeakUpApp() {
  const [view, setView] = useState('form')

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">🛡️ SpeakUp AI</h1>

      <div className="space-x-4 mt-4">
        <button
          onClick={() => setView('form')}
          className={`px-4 py-2 rounded ${
            view === 'form' ? 'bg-black text-white' : 'bg-gray-200'
          }`}
        >
          📝 Submit Report
        </button>
        <button
          onClick={() => setView('admin')}
          className={`px-4 py-2 rounded ${
            view === 'admin' ? 'bg-black text-white' : 'bg-gray-200'
          }`}
        >
          📂 View Reports
        </button>
      </div>

      <div className="w-full max-w-3xl mt-8">
        {view === 'form' ? <App /> : <Admin />}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpeakUpApp />
  </StrictMode>
)
