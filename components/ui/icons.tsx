import React from 'react'

export function LinkedinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.8v-7.6h-2.8M7.86 6.5a1.63 1.63 0 0 0-1.64 1.63c0 .9.74 1.63 1.64 1.63a1.63 1.63 0 0 0 1.63-1.63A1.63 1.63 0 0 0 7.86 6.5z" />
    </svg>
  )
}

export function GmailIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z"
        fill="#EA4335"
        fillOpacity="0.12"
      />
      <path
        d="M2 6L12 13L22 6"
        stroke="#EA4335"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 6V18C2 19.1 2.9 20 4 20H7V10L2 6.5V6Z"
        fill="#4285F4"
      />
      <path
        d="M22 6V18C22 19.1 21.1 20 20 20H17V10L22 6.5V6Z"
        fill="#34A853"
      />
      <path
        d="M7 20H17V10L12 13.5L7 10V20Z"
        fill="#FBBC04"
      />
      <path
        d="M20 4H4C2.9 4 2 4.9 2 6V7.5L12 14.5L22 7.5V6C22 4.9 21.1 4 20 4Z"
        fill="#EA4335"
      />
    </svg>
  )
}
