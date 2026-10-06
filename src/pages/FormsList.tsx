import { useState, useEffect } from 'react';
import { Plus, LayoutTemplate, MoreVertical, Edit2, Share2, BarChart2, X, Copy, CheckCircle2, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function FormsList() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<any[]>([]);
  const [shareModal, setShareModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadForms() {
      try {
        let supabaseForms: any[] = [];
        let supabaseResponses: any[] = [];

        try {
          const { data: formsData } = await supabase.from('forms').select('id, title, status, created_at, settings');
          supabaseForms = formsData || [];
          const { data: responsesData } = await supabase.from('form_responses').select('form_id');
          supabaseResponses = responsesData || [];
        } catch(e) {
          console.error("Supabase not fully configured yet", e);
        }

        // 2. Load Local Forms
        let localForms: any[] = [];
        const localFormsStr = localStorage.getItem('rm_forms_list');
        if (localFormsStr) {
          try { localForms = JSON.parse(localFormsStr); } catch(e) {}
        }

        let localResponses: any[] = [];
        const localResponsesStr = localStorage.getItem('rm_responses_list');
        if (localResponsesStr) {
          try { localResponses = JSON.parse(localResponsesStr); } catch(e) {}
        }

        // 3. Merge them
        const allFormsMap = new Map();

        // Add Supabase forms
        supabaseForms.forEach((f: any) => {
          allFormsMap.set(f.id, {
            id: f.id,
            title: f.title,
            status: f.status,
            date: new Date(f.created_at).toISOString().split('T')[0],
            responses: supabaseResponses.filter((r: any) => r.form_id === f.id).length
          });
        });

        // Add Local forms (if not already mapped, preventing duplicates if they were somehow synced)
        localForms.forEach((lf: any) => {
          if (!allFormsMap.has(lf.id)) {
            allFormsMap.set(lf.id, {
              id: lf.id,
              title: lf.title,
              status: lf.status || 'PUBLISHED',
              date: lf.date || new Date().toISOString().split('T')[0],
              responses: localResponses.filter((r: any) => r.formId === lf.id).length
            });
          }
        });

        setForms(Array.from(allFormsMap.values()));
      } catch (error) {
        console.error('Error loading forms:', error);
      }
    }
    loadForms();
  }, []);

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este formulario? Esta acción no se puede deshacer.")) {
      try {
        const { error } = await supabase.from('forms').delete().eq('id', id);
        if (error) throw error;
        setForms(forms.filter(f => f.id !== id));
      } catch (e) {
        alert("Error al eliminar el formulario");
      }
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-700 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mis Formularios</h1>
          <p className="text-slate-500 mt-1">Administra y analiza todos tus formularios ciudadanos.</p>
        </div>
        <button 
          onClick={() => navigate('/forms/new/builder')}
          className="inline-flex items-center gap-2 bg-[#1e88e5] hover:bg-[#1565c0] text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Crear Formulario
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center p-16 text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <LayoutTemplate className="w-12 h-12 text-[#1e88e5]" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No tienes formularios</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
            Aún no has creado ningún formulario. Comienza ahora a recolectar información y participación ciudadana.
          </p>
          <button 
            onClick={() => navigate('/forms/new/builder')}
            className="inline-flex items-center gap-2 bg-[#1e88e5] hover:bg-[#1565c0] text-white px-8 py-3 rounded-full font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-6 h-6" />
            Crear tu primer formulario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1.5 group flex flex-col h-full relative">
              
              {/* Header de la Tarjeta */}
              <div className="h-40 bg-gradient-to-br from-[#1e88e5] to-[#1565c0] p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white">
                    <LayoutTemplate className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-emerald-950 shadow-sm shadow-emerald-900/20 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-pulse"></div>
                    Activo
                  </div>
                </div>

                <div className="relative z-10 mt-4">
                  <h3 className="font-extrabold text-2xl text-white line-clamp-1 leading-tight">{form.title}</h3>
                </div>
              </div>

              {/* Cuerpo de la Tarjeta */}
              <div className="p-6 flex-1 flex flex-col bg-white">
                <p className="text-sm font-medium text-slate-400 mb-6 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Creado: {form.date}
                </p>
                
                <div className="mt-auto bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Respuestas</span>
                    <span className="text-3xl font-black text-[#1e88e5] leading-none">{form.responses}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#1e88e5]">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Pie de la Tarjeta (Acciones) */}
              <div className="grid grid-cols-4 border-t border-slate-50 bg-slate-50/50 p-2 gap-1">
                <button 
                  onClick={() => navigate(`/forms/edit/${form.id}`)}
                  title="Editar" 
                  className="flex items-center justify-center py-3 text-slate-400 hover:text-[#1e88e5] hover:bg-white rounded-xl transition-all font-medium text-sm group/btn"
                >
                  <Edit2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                </button>
                <button title="Analíticas" className="flex items-center justify-center py-3 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all font-medium text-sm group/btn">
                  <BarChart2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => setShareModal(form.id)}
                  title="Compartir y QR" 
                  className="flex items-center justify-center py-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all font-medium text-sm group/btn"
                >
                  <Share2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => handleDelete(form.id)}
                  title="Eliminar" 
                  className="flex items-center justify-center py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium text-sm group/btn"
                >
                  <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <ShareModal shareModal={shareModal} setShareModal={setShareModal} />
      )}
    </div>
  );
}

// Componente separado para manejar la carga dinámica del script y el canvas del QR
function ShareModal({ shareModal, setShareModal }: { shareModal: string, setShareModal: (v: string | null) => void }) {
  const publicLink = `${window.location.origin}/form/${shareModal}`;
  
  useEffect(() => {
    // Cargar librería de QR de alta calidad dinámicamente
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js';
    script.async = true;
    script.onload = () => {
      const container = document.getElementById('qr-canvas-container');
      if (!container) return;
      container.innerHTML = '';
      
      const qrCode = new (window as any).QRCodeStyling({
        width: 250,
        height: 250,
        data: publicLink,
        image: "https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png",
        margin: 5,
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "H"
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.5,
          margin: 10,
          crossOrigin: "anonymous",
        },
        dotsOptions: {
          type: "rounded",
          gradient: {
            type: "linear",
            rotation: Math.PI / 4,
            colorStops: [{ offset: 0, color: "#1565c0" }, { offset: 1, color: "#1e88e5" }]
          }
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: "#059669" // Verde de Montufareña
        },
        cornersDotOptions: {
          type: "dot",
          color: "#1565c0"
        }
      });
      
      qrCode.append(container);
      (window as any).currentQrCode = qrCode;
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [publicLink]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1565c0] to-[#059669]"></div>
        <button 
          onClick={() => setShareModal(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-2xl font-black text-slate-800 mb-6 text-center mt-2">Compartir Formulario</h3>
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="p-4 border-4 border-slate-50 rounded-3xl bg-white mb-6 shadow-xl shadow-blue-500/10 transform hover:scale-105 transition-transform">
            <div id="qr-canvas-container" className="w-[250px] h-[250px] flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
              <div className="w-8 h-8 border-4 border-[#1e88e5] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          
          <button
            onClick={() => {
              if ((window as any).currentQrCode) {
                (window as any).currentQrCode.download({ name: `QR_Renovacion_${shareModal}`, extension: "png" });
              } else {
                alert("El código QR aún se está generando. Por favor espera un momento.");
              }
            }}
            className="w-full bg-gradient-to-r from-[#1565c0] to-[#1e88e5] hover:from-[#0d47a1] hover:to-[#1565c0] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all mb-6"
          >
            Descargar QR Premium
          </button>
        </div>

        {/* Input con el Enlace Público */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Enlace Público</label>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={publicLink}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-600 focus:outline-none"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(publicLink);
                alert("¡Enlace copiado al portapapeles!");
              }}
              className="p-2.5 bg-[#1e88e5] text-white rounded-lg hover:bg-[#1565c0] transition-colors shrink-0"
              title="Copiar al portapapeles"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
