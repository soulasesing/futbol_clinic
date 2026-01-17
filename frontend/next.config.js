/** @type {import('next').NextConfig} */
module.exports = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
  
  // API rewrites configuration
  async rewrites() {
    // Check if we're running in Docker or local development
    const isDocker = process.env.DOCKER_ENV === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In Docker production, proxy to backend service
    if (isDocker || (!isProduction && process.env.NEXT_PUBLIC_BACKEND_URL)) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ];
    }
    
    // In Vercel production, no rewrite needed (same domain)
    if (isProduction) {
      return [];
    }
    
    // Local development - proxy to backend
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
  
  // Environment variables that should be available to the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
}; 