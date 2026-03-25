'use client'

import { Toaster as HotToaster } from 'react-hot-toast'

const Toast = () => {
  return (
    <HotToaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0d0d0d',
          color: '#e0e0e0',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          padding: '12px 20px',
        },
        success: {
          iconTheme: {
            primary: '#00ff9d',
            secondary: '#050505',
          },
          style: {
            border: '1px solid rgba(0, 255, 157, 0.2)',
          }
        },
        error: {
          iconTheme: {
            primary: '#ff2079',
            secondary: '#050505',
          },
          style: {
            border: '1px solid rgba(255, 32, 121, 0.2)',
          }
        },
      }}
    />
  )
}

export default Toast
