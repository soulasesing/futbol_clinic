/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    // En producción en Vercel, no necesitamos rewrite porque el backend estará en la misma URL
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    // En desarrollo, proxy al backend local
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
}; 