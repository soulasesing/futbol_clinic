import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface BrandingData {
  id: string;
  nombre: string;
  logo_url?: string;
  banner_url?: string;
  primary_color: string;
  secondary_color: string;
  description?: string;
  slogan?: string;
  telefono?: string;
  email?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  foundation_date?: string;
}

interface BrandingContextType {
  branding: BrandingData | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
  applyColors: (primary: string, secondary: string) => void;
}

const BrandingContext = createContext<BrandingContextType | null>(null);

const defaultBranding: BrandingData = {
  id: '',
  nombre: 'Futbol Clinic',
  primary_color: '#22c55e',
  secondary_color: '#0d9488',
  logo_url: undefined,
  banner_url: undefined,
};

interface BrandingProviderProps {
  children: ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const { user, jwt, isAuthenticated } = useAuth() as any;
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [loading, setLoading] = useState(true);

  const applyColors = (primary: string, secondary: string) => {
    // Apply CSS custom properties for dynamic theming
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-secondary', secondary);
    
    // Convert hex to RGB for transparency variations
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);

    if (primaryRgb) {
      root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
      // Generate lighter and darker variations
      root.style.setProperty('--color-primary-50', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.05)`);
      root.style.setProperty('--color-primary-100', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
      root.style.setProperty('--color-primary-200', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
      root.style.setProperty('--color-primary-500', primary);
      root.style.setProperty('--color-primary-600', `rgba(${primaryRgb.r * 0.9}, ${primaryRgb.g * 0.9}, ${primaryRgb.b * 0.9}, 1)`);
      root.style.setProperty('--color-primary-700', `rgba(${primaryRgb.r * 0.8}, ${primaryRgb.g * 0.8}, ${primaryRgb.b * 0.8}, 1)`);
      root.style.setProperty('--color-primary-800', `rgba(${primaryRgb.r * 0.7}, ${primaryRgb.g * 0.7}, ${primaryRgb.b * 0.7}, 1)`);
    }

    if (secondaryRgb) {
      root.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
      root.style.setProperty('--color-secondary-50', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.05)`);
      root.style.setProperty('--color-secondary-100', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.1)`);
      root.style.setProperty('--color-secondary-200', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.2)`);
      root.style.setProperty('--color-secondary-500', secondary);
      root.style.setProperty('--color-secondary-600', `rgba(${secondaryRgb.r * 0.9}, ${secondaryRgb.g * 0.9}, ${secondaryRgb.b * 0.9}, 1)`);
      root.style.setProperty('--color-secondary-700', `rgba(${secondaryRgb.r * 0.8}, ${secondaryRgb.g * 0.8}, ${secondaryRgb.b * 0.8}, 1)`);
    }
  };

  const fetchBranding = async () => {
    if (!jwt || !isAuthenticated || !user?.tenantId) {
      setBranding(defaultBranding);
      applyColors(defaultBranding.primary_color, defaultBranding.secondary_color);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/tenants', {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (!response.ok) {
        throw new Error('Error al cargar datos del tenant');
      }

      const data = await response.json();
      const tenant = Array.isArray(data) 
        ? data.find((t: any) => t.id === user.tenantId) 
        : data;

      if (tenant) {
        const brandingData: BrandingData = {
          id: tenant.id,
          nombre: tenant.nombre || 'Futbol Clinic',
          logo_url: tenant.logo_url || undefined,
          banner_url: tenant.banner_url || undefined,
          primary_color: tenant.primary_color || '#22c55e',
          secondary_color: tenant.secondary_color || '#0d9488',
          description: tenant.description || undefined,
          slogan: tenant.slogan || undefined,
          telefono: tenant.telefono || undefined,
          email: tenant.email || undefined,
          facebook_url: tenant.facebook_url || undefined,
          instagram_url: tenant.instagram_url || undefined,
          twitter_url: tenant.twitter_url || undefined,
          youtube_url: tenant.youtube_url || undefined,
          tiktok_url: tenant.tiktok_url || undefined,
          foundation_date: tenant.foundation_date || undefined,
        };

        setBranding(brandingData);
        applyColors(brandingData.primary_color, brandingData.secondary_color);
      } else {
        setBranding(defaultBranding);
        applyColors(defaultBranding.primary_color, defaultBranding.secondary_color);
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
      setBranding(defaultBranding);
      applyColors(defaultBranding.primary_color, defaultBranding.secondary_color);
    } finally {
      setLoading(false);
    }
  };

  const refreshBranding = async () => {
    await fetchBranding();
  };

  useEffect(() => {
    fetchBranding();
  }, [jwt, isAuthenticated, user?.tenantId]);

  const contextValue = useMemo(() => ({
    branding,
    loading,
    refreshBranding,
    applyColors,
  }), [branding, loading]);

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
