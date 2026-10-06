import { useState } from 'react';
import { User, Bell, Shield, PaintBucket, Save, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Perfil');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'Perfil', icon: User },
    { id: 'Notificaciones', icon: Bell },
    { id: 'Seguridad', icon: Shield },
    { id: 'Apariencia', icon: PaintBucket },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-black text-slate-900 drop-shadow-sm">Configuración</h1>
        <p className="text-slate-500 mt-2 text-lg">Administra tu cuenta, notificaciones y preferencias de la plataforma.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Menú lateral de configuración */}
        <div className="md:w-64 border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-[#1e88e5] shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" /> {tab.id}
              </button>
            );
          })}
        </div>

        {/* Contenido principal de configuración */}
        <div className="flex-1 p-8 md:p-12 relative">
          
          {activeTab === 'Perfil' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-[#1e88e5]" /> Perfil de la Institución
              </h2>

              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                    <img src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
                  </div>
                  <div>
                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-slate-200">
                      Cambiar Logo
                    </button>
                    <p className="text-slate-500 text-sm mt-2">Formatos recomendados: PNG o JPG. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Nombre de la Institución / Usuario</label>
                    <input type="text" defaultValue="Renovación Montufareña" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-[#1e88e5] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-800 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Correo Electrónico de Contacto</label>
                    <input type="email" defaultValue="contacto@renovacionmontufarena.org" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-[#1e88e5] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-800 font-medium" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Descripción Corta</label>
                  <textarea defaultValue="Plataforma oficial de participación ciudadana y formularios." rows={3} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-[#1e88e5] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-800 font-medium resize-none"></textarea>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notificaciones' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6 text-[#1e88e5]" /> Notificaciones
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-slate-800">Alertas por Correo</h3>
                    <p className="text-slate-500 text-sm">Recibir un correo cada vez que alguien envíe un formulario.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e88e5]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-slate-800">Resumen Semanal</h3>
                    <p className="text-slate-500 text-sm">Recibir un reporte semanal de estadísticas de formularios.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e88e5]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Seguridad' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#1e88e5]" /> Seguridad
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Contraseña Actual</label>
                  <input type="password" placeholder="••••••••" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-[#1e88e5] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-800 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Nueva Contraseña</label>
                  <input type="password" placeholder="Escribe tu nueva contraseña" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-[#1e88e5] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-800 font-medium" />
                </div>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-colors">
                  Actualizar Contraseña
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Apariencia' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <PaintBucket className="w-6 h-6 text-[#1e88e5]" /> Apariencia
              </h2>
              <p className="text-slate-500 mb-6">Personaliza los colores globales de tu panel de administración.</p>
              
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#1e88e5] ring-4 ring-blue-100 cursor-pointer shadow-md"></div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 opacity-50 cursor-not-allowed hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 rounded-2xl bg-purple-500 opacity-50 cursor-not-allowed hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 rounded-2xl bg-slate-900 opacity-50 cursor-not-allowed hover:opacity-100 transition-opacity"></div>
              </div>
              <p className="text-xs text-slate-400 mt-4">* Próximamente se añadirán más temas de color.</p>
            </div>
          )}

          {/* Botón flotante para guardar cambios (aparece abajo) */}
          <div className="absolute bottom-8 right-8">
            <button 
              onClick={handleSave}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                saved 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                  : 'bg-[#1e88e5] text-white shadow-blue-500/30 hover:-translate-y-1 hover:shadow-xl'
              }`}
            >
              {saved ? (
                <><CheckCircle2 className="w-5 h-5" /> Cambios Guardados</>
              ) : (
                <><Save className="w-5 h-5" /> Guardar Cambios</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
