import { useState, useEffect } from 'react';
import { Plus, LayoutTemplate, MoreVertical, Edit2, Share2, BarChart2, X, Copy, CheckCircle2, Calendar, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function FormsList() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<any[]>([]);
  const [shareModal, setShareModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadForms = async () => {
    setIsLoading(true);
    try {
      let supabaseForms: any[] = [];
      let supabaseResponses: any[] = [];

      try {
        const { data: formsData } = await supabase.from('forms').select('id, title, status, created_at, settings');
        supabaseForms = formsData || [];
        const { data: responsesData } = await supabase.from('form_responses').select('form_id');
        supabaseResponses = responsesData || [];
      } catch(e) {
        console.error("Supabase error:", e);
      }

      const allForms = supabaseForms.map((f: any) => ({
        id: f.id,
        title: f.title,
        status: f.status,
        date: new Date(f.created_at).toISOString().split('T')[0],
        responses: supabaseResponses.filter((r: any) => r.form_id === f.id).length,
        settings: f.settings
      }));

      setForms(allForms.reverse());
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
        const { data, error } = await supabase.from('forms').delete().eq('id', id).select();
        if (error) throw error;
        
        if (!data || data.length === 0) {
          throw new Error("La base de datos bloqueó la eliminación (Probablemente por las políticas de seguridad RLS en Supabase). Por favor, deshabilita RLS en la tabla 'forms' o revisa los permisos.");
        }
        
        setForms(forms.filter(f => f.id !== id));
      } catch (e: any) {
        console.error(e);
        alert("No se pudo eliminar: " + (e.message || "Error desconocido"));
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Mis Formularios <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs font-mono border border-slate-200">{forms.length}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Administra y analiza todos tus formularios ciudadanos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadForms()}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={async () => {
              if (!confirm("¿Deseas eliminar los registros duplicados y excedentes en todos los formularios respetando el límite que hayas configurado?")) return;
              try {
                for (const form of forms) {
                  const { data } = await supabase.from('form_responses').select('id, user_name, user_email, created_at, data').eq('form_id', form.id).order('created_at', { ascending: true });
                  if (!data) continue;
                  const seen = new Set();
                  const toDelete = [];
                  let kept = 0;
                  for (const r of data) {
                    let cedulaInvalid = false;
                    if (r.data) {
                      Object.entries(r.data).forEach(([key, val]) => {
                        if (key.toLowerCase().includes('cedula') || key.toLowerCase().includes('cédula')) {
                           const ced = String(val).trim();
                           const isValidCedula = (c: string) => {
                             if (c.length !== 10 || isNaN(Number(c))) return false;
                             const prov = parseInt(c.substring(0, 2), 10);
                             if (prov < 1 || (prov > 24 && prov !== 30)) return false;
                             const tercer = parseInt(c.charAt(2), 10);
                             if (tercer > 5) return false;
                             let total = 0;
                             for (let i = 0; i < 9; i++) {
                               let v = parseInt(c.charAt(i), 10);
                               if (i % 2 === 0) {
                                 v *= 2;
                                 if (v > 9) v -= 9;
                               }
                               total += v;
                             }
                             const verificador = parseInt(c.charAt(9), 10);
                             let superior = Math.ceil(total / 10) * 10;
                             let calculado = superior - total;
                             if (calculado === 10) calculado = 0;
                             return calculado === verificador;
                           };
                           if (!isValidCedula(ced)) cedulaInvalid = true;
                        }
                      });
                    }

                    const normName = (r.user_name || 'anónimo').toLowerCase().trim();
                    const normEmail = (r.user_email || 'no proporcionado').toLowerCase().trim();
                    
                    const allowedDomains = [
                      'gmail.com', 'googlemail.com',
                      'outlook.com', 'outlook.es', 'hotmail.com', 'hotmail.es', 'live.com', 'live.com.mx', 'msn.com',
                      'yahoo.com', 'yahoo.es', 'ymail.com',
                      'protonmail.com', 'proton.me', 'pm.me',
                      'zohomail.com', 'zoho.com',
                      'icloud.com', 'me.com', 'mac.com'
                    ];
                    const emailParts = normEmail.split('@');
                    const emailDomain = emailParts.length > 1 ? emailParts[emailParts.length - 1] : '';
                    
                    const isInvalidDomain = !allowedDomains.includes(emailDomain);
                    const isNoEmail = normEmail === 'no proporcionado';

                    if (cedulaInvalid || isInvalidDomain || isNoEmail) {
                      toDelete.push(r.id);
                    } else if ((normName !== 'anónimo' && seen.has('n:'+normName)) || (normEmail !== 'no proporcionado' && seen.has('e:'+normEmail))) {
                      toDelete.push(r.id);
                    } else {
                      const formLimit = form.settings?.maxResponses ? parseInt(form.settings.maxResponses) : Infinity;
                      if (kept < formLimit) {
                        if (normName !== 'anónimo') seen.add('n:'+normName);
                        if (normEmail !== 'no proporcionado') seen.add('e:'+normEmail);
                        kept++;
                      } else {
                        toDelete.push(r.id);
                      }
                    }
                  }
                  if (toDelete.length > 0) {
                    for (let i = 0; i < toDelete.length; i += 50) {
                      await supabase.from('form_responses').delete().in('id', toDelete.slice(i, i+50));
                    }
                  }
                }
                alert("¡Limpieza completada! Se eliminaron los excedentes.");
                window.location.reload();
              } catch(e: any) {
                alert("Error limpiando: " + e.message);
              }
            }}
            className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Excedentes
          </button>
          <button 
            onClick={() => navigate('/forms/new/builder')}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm active:scale-95 border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            Crear Formulario
          </button>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <LayoutTemplate className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No tienes formularios</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
            Aún no has creado ningún formulario. Comienza ahora a recolectar información y participación ciudadana.
          </p>
          <button 
            onClick={() => navigate('/forms/new/builder')}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-md font-medium text-sm transition-all shadow-sm active:scale-95 border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            Crear tu primer formulario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors group flex flex-col h-full">
              
              <div className="p-5 flex-1 flex flex-col relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                    <LayoutTemplate className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Activo
                  </div>
                </div>

                <h3 className="font-semibold text-lg text-slate-900 line-clamp-1 mb-1 group-hover:text-slate-700 transition-colors cursor-pointer" onClick={() => navigate(`/forms/edit/${form.id}`)}>{form.title}</h3>
                
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-6">
                  <Calendar className="w-3.5 h-3.5" /> Creado: {form.date}
                </p>
                
                <div className="mt-auto bg-slate-50/50 rounded-md p-4 border border-slate-100 flex items-center justify-between group-hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Respuestas Totales</span>
                    <span className="text-2xl font-bold text-slate-900 leading-none">{form.responses}</span>
                  </div>
                  <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 border-t border-slate-100 bg-slate-50/30">
                <button 
                  onClick={() => navigate(`/forms/edit/${form.id}`)}
                  title="Editar" 
                  className="flex flex-col items-center justify-center py-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors border-r border-slate-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => navigate('/stats')}
                  title="Analíticas" 
                  className="flex flex-col items-center justify-center py-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors border-r border-slate-100"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShareModal(form.id)}
                  title="Compartir y QR" 
                  className="flex flex-col items-center justify-center py-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors border-r border-slate-100"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(form.id)}
                  title="Eliminar" 
                  className="flex flex-col items-center justify-center py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900">Compartir Formulario</h3>
          <button 
            onClick={() => setShareModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 mb-6 shadow-sm">
            <div id="qr-canvas-container" className="w-[250px] h-[250px] flex items-center justify-center bg-white rounded-lg overflow-hidden border border-slate-100">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
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
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-md text-sm transition-colors shadow-sm"
          >
            Descargar Código QR
          </button>
        </div>

        {/* Input con el Enlace Público */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enlace Público</label>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={publicLink}
              className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-0 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(publicLink);
                alert("¡Enlace copiado al portapapeles!");
              }}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              title="Copiar al portapapeles"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
