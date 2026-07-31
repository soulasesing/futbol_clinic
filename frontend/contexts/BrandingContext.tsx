import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface BrandingData {
  id: string;
  slug?: string;
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
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16)
      } : null;
    };

    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);
    const tint = (channel: number, strength: number): number =>
      Math.round(255 - ((255 - channel) * strength));

    if (primaryRgb) {
      root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
      const luminance = (
        (0.2126 * primaryRgb.r)
        + (0.7152 * primaryRgb.g)
        + (0.0722 * primaryRgb.b)
      ) / 255;
      // Generate lighter and darker variations
      root.style.setProperty('--color-primary-50', `rgb(${tint(primaryRgb.r, 0.05)}, ${tint(primaryRgb.g, 0.05)}, ${tint(primaryRgb.b, 0.05)})`);
      root.style.setProperty('--color-primary-100', `rgb(${tint(primaryRgb.r, 0.1)}, ${tint(primaryRgb.g, 0.1)}, ${tint(primaryRgb.b, 0.1)})`);
      root.style.setProperty('--color-primary-200', `rgb(${tint(primaryRgb.r, 0.2)}, ${tint(primaryRgb.g, 0.2)}, ${tint(primaryRgb.b, 0.2)})`);
      root.style.setProperty('--color-primary-300', `rgb(${tint(primaryRgb.r, 0.35)}, ${tint(primaryRgb.g, 0.35)}, ${tint(primaryRgb.b, 0.35)})`);
      root.style.setProperty('--color-primary-400', `rgb(${tint(primaryRgb.r, 0.62)}, ${tint(primaryRgb.g, 0.62)}, ${tint(primaryRgb.b, 0.62)})`);
      root.style.setProperty('--color-primary-500', primary);
      root.style.setProperty('--color-primary-600', `rgb(${Math.round(primaryRgb.r * 0.9)}, ${Math.round(primaryRgb.g * 0.9)}, ${Math.round(primaryRgb.b * 0.9)})`);
      root.style.setProperty('--color-primary-700', `rgb(${Math.round(primaryRgb.r * 0.8)}, ${Math.round(primaryRgb.g * 0.8)}, ${Math.round(primaryRgb.b * 0.8)})`);
      root.style.setProperty('--color-primary-800', `rgb(${Math.round(primaryRgb.r * 0.68)}, ${Math.round(primaryRgb.g * 0.68)}, ${Math.round(primaryRgb.b * 0.68)})`);
      root.style.setProperty('--color-primary-900', `rgb(${Math.round(primaryRgb.r * 0.52)}, ${Math.round(primaryRgb.g * 0.52)}, ${Math.round(primaryRgb.b * 0.52)})`);
      root.style.setProperty('--color-primary-950', `rgb(${Math.round(primaryRgb.r * 0.35)}, ${Math.round(primaryRgb.g * 0.35)}, ${Math.round(primaryRgb.b * 0.35)})`);
      root.style.setProperty('--color-primary-contrast', luminance > 0.62 ? '#0f172a' : '#ffffff');
    }

    if (secondaryRgb) {
      root.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
      root.style.setProperty('--color-secondary-50', `rgb(${tint(secondaryRgb.r, 0.05)}, ${tint(secondaryRgb.g, 0.05)}, ${tint(secondaryRgb.b, 0.05)})`);
      root.style.setProperty('--color-secondary-100', `rgb(${tint(secondaryRgb.r, 0.1)}, ${tint(secondaryRgb.g, 0.1)}, ${tint(secondaryRgb.b, 0.1)})`);
      root.style.setProperty('--color-secondary-200', `rgb(${tint(secondaryRgb.r, 0.2)}, ${tint(secondaryRgb.g, 0.2)}, ${tint(secondaryRgb.b, 0.2)})`);
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
      
      const response = await fetch('/api/branding', {
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
          slug: tenant.slug || undefined,
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
