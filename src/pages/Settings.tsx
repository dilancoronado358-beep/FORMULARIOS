import { useState, useEffect } from 'react';
import { User, Bell, Shield, PaintBucket, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Perfil');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    logoUrl: 'https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png',
    institutionName: 'Renovación Montufareña',
    contactEmail: 'contacto@renovacionmontufarena.org',
    description: 'Plataforma oficial de participación ciudadana y formularios.',
    darkMode: false
  });

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('forms').select('settings').eq('title', 'GLOBAL_APP_SETTINGS').single();
      if (data?.settings) {
        setSettings(data.settings);
        if (data.settings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    loadSettings();
  }, []);

  // Previsualización instantánea del modo oscuro
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await supabase.from('forms').select('id').eq('title', 'GLOBAL_APP_SETTINGS').single();
      if (data) {
        await supabase.from('forms').update({ settings }).eq('id', data.id);
      } else {
        await supabase.from('forms').insert([{ title: 'GLOBAL_APP_SETTINGS', status: 'draft', settings }]);
      }
      
      window.dispatchEvent(new Event('settings-updated'));
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Error al guardar en Supabase');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'Perfil', icon: User },
    { id: 'Notificaciones', icon: Bell },
    { id: 'Seguridad', icon: Shield },
    { id: 'Apariencia', icon: PaintBucket },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">Administra tu cuenta, notificaciones y preferencias de la plataforma.</p>
      </div>

      <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px] relative">
        {/* Menú lateral de configuración */}
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" /> 
                <span className="hidden sm:inline">{tab.id}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido principal de configuración */}
        <div className="flex-1 p-6 md:p-10 pb-24 relative overflow-y-auto">
          
          {activeTab === 'Perfil' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">
                Perfil de la Institución
              </h2>

              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">URL del Logo</label>
                    <input 
                      type="text" 
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-0 transition-colors shadow-sm"
                    />
                    <p className="text-slate-500 text-xs mt-1.5">Introduce un enlace directo a una imagen PNG o JPG. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Nombre de la Institución / Usuario</label>
                    <input 
                      type="text" 
                      value={settings.institutionName}
                      onChange={(e) => setSettings({...settings, institutionName: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-0 transition-colors shadow-sm" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Correo Electrónico de Contacto</label>
                    <input 
                      type="email" 
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-0 transition-colors shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">Descripción Corta</label>
                  <textarea 
                    value={settings.description}
                    onChange={(e) => setSettings({...settings, description: e.target.value})}
                    rows={4} 
                    className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-0 transition-colors shadow-sm resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notificaciones' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">
                Notificaciones
              </h2>
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Alertas por Correo</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Recibir un correo cada vez que alguien envíe un formulario.</p>
                  </div>
                  <label className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-slate-900" style={{ borderColor: '#0f172a', backgroundColor: 'white' }} defaultChecked />
                    <label className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-900 cursor-pointer transition-colors duration-200 ease-in-out"></label>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Resumen Semanal</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Recibir un reporte semanal de estadísticas de formularios.</p>
                  </div>
                  <label className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-slate-900" style={{ borderColor: '#0f172a', backgroundColor: 'white' }} defaultChecked />
                    <label className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-900 cursor-pointer transition-colors duration-200 ease-in-out"></label>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Seguridad' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">
                Seguridad
              </h2>
              <div className="space-y-6 max-w-sm">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">Contraseña Actual</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-0 transition-colors shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">Nueva Contraseña</label>
                  <input type="password" placeholder="Escribe tu nueva contraseña" className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-0 transition-colors shadow-sm" />
                </div>
                <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">
                  Actualizar Contraseña
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Apariencia' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">
                Apariencia
              </h2>
              <p className="text-sm text-slate-500 mb-6">Personaliza los colores y el modo visual de tu panel de administración.</p>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-sm mb-6 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Modo Oscuro</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Activar el tema Negro Mate.</p>
                </div>
                <label className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    checked={settings.darkMode}
                    onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-slate-900" style={{ borderColor: '#0f172a', backgroundColor: 'white' }} 
                  />
                  <label className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-900 cursor-pointer transition-colors duration-200 ease-in-out"></label>
                </label>
              </div>

              <div className="flex gap-4 opacity-40 cursor-not-allowed pointer-events-none grayscale">
                <div className="w-12 h-12 rounded-lg bg-slate-900 ring-2 ring-slate-400 ring-offset-2 shadow-sm border border-slate-700"></div>
                <div className="w-12 h-12 rounded-lg bg-[#1e88e5] border border-blue-600"></div>
                <div className="w-12 h-12 rounded-lg bg-emerald-600 border border-emerald-700"></div>
              </div>
              <p className="text-xs text-slate-400 mt-4">* Los temas de colores acento han sido reemplazados por el diseño global oscuro/claro.</p>
            </div>
          )}

          {/* Botón flotante para guardar cambios */}
          <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8">
            <button 
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm transition-all shadow-sm border ${
                saved 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800 active:scale-95'
              }`}
            >
              {saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Guardado</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar Cambios</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
