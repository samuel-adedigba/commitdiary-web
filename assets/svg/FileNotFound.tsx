import React from 'react'

const FileNotFound = () => {
    return (
        <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="40" y="30" width="120" height="140" rx="8" fill="#e9ecef" />
            <rect x="60" y="60" width="80" height="8" rx="4" fill="#dee2e6" />
            <rect x="60" y="80" width="60" height="8" rx="4" fill="#dee2e6" />
            <rect x="60" y="100" width="70" height="8" rx="4" fill="#dee2e6" />
            <circle cx="100" cy="130" r="20" fill="#6c757d" opacity="0.3" />
            <line x1="90" y1="120" x2="110" y2="140" stroke="#6c757d" strokeWidth="3" strokeLinecap="round" />
            <line x1="110" y1="120" x2="90" y2="140" stroke="#6c757d" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

export default FileNotFound
