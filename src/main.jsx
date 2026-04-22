import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import App from './App.jsx'

// Remove loading placeholder
const loading = document.getElementById('loading');
if (loading) loading.remove();

// Auth is opt-in: if VITE_CLERK_PUBLISHABLE_KEY isn't set yet (e.g. during
// local dev before the SaaS signup is done), skip the provider so the app
// keeps working in its standalone mode.
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const Root = () => (
  clerkKey ? (
    <ClerkProvider afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  ) : (
    <App />
  )
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
