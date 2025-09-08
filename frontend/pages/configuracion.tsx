import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';

const ConfiguracionEscuela: React.FC = () => {
  const { isAuthenticated, user, jwt } = useAuth() as any;
  const { refreshBranding } = useBranding();
  const [nombre, setNombre] = useState('');
  const [foundationDate, setFoundationDate] = useState('');
  const [description, setDescription] = useState('');
  const [slogan, setSlogan] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>('#22c55e');
  const [secondaryColor, setSecondaryColor] = useState<string>('#0d9488');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [original, setOriginal] = useState<{logo: string|null, banner: string|null, primary: string, secondary: string}>({logo: null, banner: null, primary: '#22c55e', secondary: '#0d9488'});

  useEffect(() => {
    // Obtener branding actual
    fetch('/api/tenants', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(data => {
        const escuela = Array.isArray(data) ? data.find((t: any) => t.id && user?.tenantId && t.id === user.tenantId) : null;
        if (escuela) {
          setNombre(escuela.nombre || '');
          setFoundationDate(escuela.foundation_date ? escuela.foundation_date.slice(0, 10) : '');
          setDescription(escuela.description || '');
          setSlogan(escuela.slogan || '');
          setTelefono(escuela.telefono || '');
          setEmail(escuela.email || '');
          setFacebook(escuela.facebook_url || '');
          setInstagram(escuela.instagram_url || '');
          setTwitter(escuela.twitter_url || '');
          setYoutube(escuela.youtube_url || '');
          setTiktok(escuela.tiktok_url || '');
          setLogo(escuela.logo_url || null);
          setBanner(escuela.banner_url || null);
          if (escuela.primary_color) setPrimaryColor(escuela.primary_color);
          if (escuela.secondary_color) setSecondaryColor(escuela.secondary_color);
          setOriginal({
            logo: escuela.logo_url || null,
            banner: escuela.banner_url || null,
            primary: escuela.primary_color || '#22c55e',
            secondary: escuela.secondary_color || '#0d9488',
          });
        }
      });
  }, [jwt, user]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Error al subir imagen');
    const data = await res.json();
    return data.url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    let logo_url = logo;
    let banner_url = banner;
    const logoFile = logoInputRef.current?.files?.[0];
    const bannerFile = bannerInputRef.current?.files?.[0];
    try {
      if (logoFile) logo_url = await uploadImage(logoFile);
      if (bannerFile) banner_url = await uploadImage(bannerFile);
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          logo_url,
          banner_url,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          nombre, // opcional, si quieres mostrarlo en la preview
          foundation_date: foundationDate || null,
          description,
          slogan,
          telefono,
          email,
          facebook_url: facebook,
          instagram_url: instagram,
          twitter_url: twitter,
          youtube_url: youtube,
          tiktok_url: tiktok,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar cambios');
      setSuccess('¡Configuración guardada!');
      setLogo(logo_url);
      setBanner(banner_url);
      
      // Refresh branding to update navbar and theme immediately
      await refreshBranding();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 flex flex-col gap-8">
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent drop-shadow mb-2">Configurar escuela</h1>
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            {/* Datos generales */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-emerald-700">Nombre de la escuela</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="rounded border px-3 py-2" required />
              <label className="font-semibold text-emerald-700 mt-2">Fecha de fundación</label>
              <input type="date" value={foundationDate} onChange={e => setFoundationDate(e.target.value)} className="rounded border px-3 py-2" />
              <label className="font-semibold text-emerald-700 mt-2">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="rounded border px-3 py-2" rows={2} />
              <label className="font-semibold text-emerald-700 mt-2">Slogan</label>
              <input type="text" value={slogan} onChange={e => setSlogan(e.target.value)} className="rounded border px-3 py-2" />
              <label className="font-semibold text-emerald-700 mt-2">Teléfono</label>
              <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} className="rounded border px-3 py-2" />
              <label className="font-semibold text-emerald-700 mt-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded border px-3 py-2" />
            </div>
            {/* Redes sociales */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-emerald-700">Facebook</label>
              <input type="url" value={facebook} onChange={e => setFacebook(e.target.value)} className="rounded border px-3 py-2" placeholder="https://facebook.com/" />
              <label className="font-semibold text-emerald-700 mt-2">Instagram</label>
              <input type="url" value={instagram} onChange={e => setInstagram(e.target.value)} className="rounded border px-3 py-2" placeholder="https://instagram.com/" />
              <label className="font-semibold text-emerald-700 mt-2">Twitter</label>
              <input type="url" value={twitter} onChange={e => setTwitter(e.target.value)} className="rounded border px-3 py-2" placeholder="https://twitter.com/" />
              <label className="font-semibold text-emerald-700 mt-2">YouTube</label>
              <input type="url" value={youtube} onChange={e => setYoutube(e.target.value)} className="rounded border px-3 py-2" placeholder="https://youtube.com/" />
              <label className="font-semibold text-emerald-700 mt-2">TikTok</label>
              <input type="url" value={tiktok} onChange={e => setTiktok(e.target.value)} className="rounded border px-3 py-2" placeholder="https://tiktok.com/" />
            </div>
            {/* Logo */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-emerald-700">Logo</label>
              <input type="file" accept="image/jpeg,image/png" ref={logoInputRef} className="border rounded px-2 py-1" />
              {logo && <img src={logo} alt="Logo" className="w-20 h-20 rounded-full object-cover border mt-2" />}
            </div>
            {/* Banner */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-emerald-700">Banner</label>
              <input type="file" accept="image/jpeg,image/png" ref={bannerInputRef} className="border rounded px-2 py-1" />
              {banner && <img src={banner} alt="Banner" className="w-32 h-12 rounded object-cover border mt-2" />}
            </div>
            {/* Colores */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-emerald-700">Color primario</label>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-16 h-8 p-0 border-none" />
              <label className="font-semibold text-emerald-700 mt-2">Color secundario</label>
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-16 h-8 p-0 border-none" />
            </div>
            {/* Vista previa */}
            <div className="flex flex-col gap-2 items-center border-t pt-4 mt-2">
              <span className="font-semibold text-emerald-700">Vista previa</span>
              <div className="w-full rounded-xl p-4 flex flex-col items-center gap-2" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}>
                {logo && <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" />}
                {banner && <img src={banner} alt="Banner" className="w-40 h-14 rounded object-cover border-2 border-white shadow" />}
                <span className="text-white font-bold text-lg drop-shadow">{nombre || user?.tenantName || 'Mi Escuela'}</span>
                {slogan && <span className="text-white italic text-base drop-shadow">{slogan}</span>}
                {description && <span className="text-white text-sm drop-shadow text-center">{description}</span>}
              </div>
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm text-center">{success}</div>}
            <div className="flex flex-row gap-4 justify-center mt-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 px-6 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                className="bg-gradient-to-r from-gray-200 to-gray-100 text-emerald-700 font-bold py-2 px-6 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-emerald-200"
                onClick={async () => {
                  if (!window.confirm('¿Seguro que deseas restaurar la configuración original?')) return;
                  setLogo(original.logo);
                  setBanner(original.banner);
                  setPrimaryColor(original.primary);
                  setSecondaryColor(original.secondary);
                  setLoading(true);
                  setError('');
                  setSuccess('');
                  try {
                    const res = await fetch('/api/branding', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                      body: JSON.stringify({
                        logo_url: original.logo,
                        banner_url: original.banner,
                        primary_color: original.primary,
                        secondary_color: original.secondary,
                      }),
                    });
                    if (!res.ok) throw new Error('Error al restaurar configuración');
                    setSuccess('¡Configuración restaurada!');
                    
                    // Refresh branding to update navbar and theme
                    await refreshBranding();
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Restaurar valores por defecto
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default ConfiguracionEscuela; 