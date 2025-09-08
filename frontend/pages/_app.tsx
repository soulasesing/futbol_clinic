import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { BrandingProvider } from '../contexts/BrandingContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <BrandingProvider>
        <Component {...pageProps} />
      </BrandingProvider>
    </AuthProvider>
  );
}

export default MyApp; 