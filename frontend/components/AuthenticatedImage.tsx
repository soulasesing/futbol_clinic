import React, { ImgHTMLAttributes, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthenticatedAssetUrl = (
  source?: string | null
): string | undefined => {
  const { jwt } = useAuth();
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(
    source?.startsWith('/api/') ? undefined : source || undefined
  );

  useEffect(() => {
    if (!source || !source.startsWith('/api/')) {
      setResolvedUrl(source || undefined);
      return undefined;
    }
    const controller = new AbortController();
    let objectUrl: string | undefined;
    void fetch(source, {
      headers: { Authorization: `Bearer ${jwt || ''}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar el archivo');
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setResolvedUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setResolvedUrl(undefined);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [jwt, source]);

  return resolvedUrl;
};

interface AuthenticatedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ src, ...props }) => {
  const resolvedUrl = useAuthenticatedAssetUrl(src);
  if (!resolvedUrl) return null;
  return <img {...props} src={resolvedUrl} />;
};

export default AuthenticatedImage;
