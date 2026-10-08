import { useState, useEffect } from 'react';
import { Type, AlignLeft, Hash, Calendar, CheckSquare, List, GripVertical, Settings2, Save, Play, ChevronLeft, Plus, Trash2, UploadCloud, Image as ImageIcon, X, Link as LinkIcon, Palette, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
type Field = { id: string; type: string; label: string; placeholder: string; required: boolean; options?: string[] };
type FormDetails = { 
  title: string; 
  description: string; 
  settings: { 
    footerText: string; 
    backgroundColor: string;
    backgroundImage?: string;
    expiresAt?: string;
    maxResponses?: number;
  } 
};

export default function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [isPreviewSubmitting, setIsPreviewSubmitting] = useState(false);
  const [previewSubmitSuccess, setPreviewSubmitSuccess] = useState(false);
  const [previewResponses, setPreviewResponses] = useState<Record<string, any>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, boolean>>({});
  
  const [fields, setFields] = useState<Field[]>(() => {
    if (id) return []; // Se cargará en el useEffect
    const saved = localStorage.getItem('rm_builder_fields');
    return saved ? JSON.parse(saved) : [];
  });

  const [formDetails, setFormDetails] = useState<FormDetails>(() => {
    if (id) return { title: '', description: '', settings: { footerText: '', backgroundColor: '#F8FAFC' } };
    const saved = localStorage.getItem('rm_builder_details');
    return saved ? JSON.parse(saved) : { 
      title: 'Participación Ciudadana', 
      description: 'Queremos conocer tus ideas...',
      settings: { footerText: '', backgroundColor: '#F8FAFC' }
    };
  });

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadForm() {
      if (id) {
        try {
          const { data, error } = await supabase.from('forms').select('*').eq('id', id).single();
          if (data) {
            const loadedFields = data.fields || (data.settings && data.settings.fields) || [];
            setFields(loadedFields);
            setFormDetails({
              title: data.title || '',
              description: data.description || '',
              settings: data.settings || { footerText: '', backgroundColor: '#F8FAFC' }
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadForm();
  }, [id]);

  useEffect(() => {
    if (!id) {
      localStorage.setItem('rm_builder_fields', JSON.stringify(fields));
      localStorage.setItem('rm_builder_details', JSON.stringify(formDetails));
    }
  }, [fields, formDetails, id]);

  const addField = (type: string) => {
    const newField: Field = { 
      id: Date.now().toString(), 
      type, 
      label: type === 'section' ? 'Nueva Sección' : type === 'html' ? '<p>Escribe aquí tu texto o inserta hipervínculos como <a href="https://google.com" target="_blank" style="color:blue">Google</a></p>' : type === 'file' ? 'Subir Documento PDF' : type === 'image' ? 'Subir Fotografía' : 'Nueva Pregunta', 
      placeholder: type === 'section' ? 'Descripción de la sección...' : type === 'html' ? '' : 'Instrucciones...', 
      required: false,
      options: (type === 'select' || type === 'checkbox') ? ['Opción A', 'Opción B', 'Opción C'] : undefined
    };
    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  const activeField = fields.find(f => f.id === activeFieldId);

  const updateActiveField = (updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === activeFieldId ? { ...f, ...updates } : f));
  };

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handlePublish = async () => {
    setIsSaving(true);
    
    const newForm = {
      id: id || Date.now().toString(),
      title: formDetails.title,
      description: formDetails.description,
      settings: formDetails.settings,
      status: 'PUBLISHED',
      date: new Date().toISOString().split('T')[0],
      fields: fields,
      responses: 0
    };

    // 1. Guardar en Supabase
    try {
      const formId = id || generateUUID();
      const { error } = await supabase.from('forms').upsert({
        id: formId,
        title: newForm.title || 'Formulario sin título',
        slug: formId, // El slug es obligatorio
        description: newForm.description,
        status: newForm.status,
        settings: { ...newForm.settings, fields: newForm.fields } // Almacenamos fields dentro de settings (JSONB)
      });
      
      if (error) {
        console.error("Error guardando en Supabase:", error);
        alert("Error de la base de datos al guardar: " + error.message);
        setIsSaving(false);
        return;
      }
    } catch(e: any) {
      console.error("Error en try-catch de Supabase:", e);
      alert("Error crítico al intentar guardar: " + (e.message || String(e)));
      setIsSaving(false);
      return;
    }

    // 2. Guardar en localStorage (Fallback)
    const existingForms = JSON.parse(localStorage.getItem('rm_forms_list') || '[]');
    newForm.responses = id ? (existingForms.find((f: any) => f.id === id)?.responses || 0) : 0;

    if (id) {
      const updatedForms = existingForms.map((f: any) => f.id === id ? newForm : f);
      localStorage.setItem('rm_forms_list', JSON.stringify(updatedForms));
    } else {
      localStorage.setItem('rm_forms_list', JSON.stringify([newForm, ...existingForms]));
    }
    
    // Limpiar el constructor actual para la próxima vez solo si es nuevo
    if (!id) {
      localStorage.removeItem('rm_builder_fields');
      localStorage.removeItem('rm_builder_details');
    }
    
    setIsSaving(false);
    navigate('/forms');
  };

  const availableTools = [
    { type: 'section', icon: GripVertical, label: 'Nueva Sección (Separador)' },
    { type: 'html', icon: LinkIcon, label: 'Texto libre / Hipervínculos' },
    { type: 'text', icon: Type, label: 'Respuesta Corta' },
    { type: 'textarea', icon: AlignLeft, label: 'Párrafo Largo' },
    { type: 'number', icon: Hash, label: 'Número / Edad' },
    { type: 'date', icon: Calendar, label: 'Fecha' },
    { type: 'select', icon: List, label: 'Lista Desplegable' },
    { type: 'checkbox', icon: CheckSquare, label: 'Opciones Múltiples' },
    { type: 'file', icon: UploadCloud, label: 'Subir Archivo / PDF' },
    { type: 'image', icon: ImageIcon, label: 'Subir Fotografía' },
  ];

  const [currentPreviewPage, setCurrentPreviewPage] = useState(0);

  // Lógica para dividir en páginas
  const pages: Field[][] = [];
  let tempPage: Field[] = [];
  
  fields.forEach(field => {
    if (field.type === 'section') {
      if (tempPage.length > 0) pages.push(tempPage);
      tempPage = [field];
    } else {
      tempPage.push(field);
    }
  });
  if (tempPage.length > 0) pages.push(tempPage);
  if (pages.length === 0) pages.push([]); // Fallback si está vacío

  if (showPreview) {
    const currentFields = pages[currentPreviewPage] || [];
    const progress = pages.length > 1 ? ((currentPreviewPage + 1) / pages.length) * 100 : 100;

    const handlePreviewValidateAndProceed = (isSubmit: boolean) => {
      const newErrors: Record<string, boolean> = {};
      let hasError = false;

      currentFields.forEach((field: any) => {
        if (field.required && field.type !== 'html' && field.type !== 'section') {
          const val = previewResponses[field.id];
          if (field.type === 'checkbox') {
            if (!val || val.length === 0) {
              newErrors[field.id] = true;
              hasError = true;
            }
          } else {
            if (!val || String(val).trim() === '') {
              newErrors[field.id] = true;
              hasError = true;
            }
          }
        }
      });

      setPreviewErrors(newErrors);

      if (hasError) return;

      if (isSubmit) {
        if (isPreviewSubmitting || previewSubmitSuccess) return;
        setIsPreviewSubmitting(true);
        setTimeout(() => {
          setIsPreviewSubmitting(false);
          setPreviewSubmitSuccess(true);
          setTimeout(() => {
            setPreviewSubmitSuccess(false);
            setShowPreview(false);
            setCurrentPreviewPage(0);
          }, 1500);
        }, 1500);
      } else {
        setCurrentPreviewPage(prev => prev + 1);
      }
    };

    return (
      <div 
        className="min-h-screen py-12 px-4 flex flex-col items-center transition-colors duration-500 bg-cover bg-center bg-fixed z-50 fixed inset-0 overflow-y-auto"
        style={{
          backgroundColor: (formDetails.settings as any).backgroundImage ? 'transparent' : formDetails.settings.backgroundColor || '#F8FAFC',
          backgroundImage: (formDetails.settings as any).backgroundImage ? `url(${(formDetails.settings as any).backgroundImage})` : 'none'
        }}
      >
        {/* Capa de oscurecimiento si hay imagen para mejorar lectura */}
        {(formDetails.settings as any).backgroundImage && <div className="fixed inset-0 bg-black/20 pointer-events-none z-0"></div>}

        <div className="w-full max-w-3xl flex justify-between mb-6 relative z-10">
          <button 
            onClick={() => {
              setShowPreview(false);
              setCurrentPreviewPage(0);
            }} 
            className={`flex items-center gap-2 font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all ${
              (formDetails.settings as any).backgroundImage ? 'bg-white/90 backdrop-blur-md text-slate-700 hover:text-slate-900' : 'bg-white text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-5 h-5" /> Cerrar Vista Previa
          </button>
          
          {pages.length > 1 && (
            <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full shadow-sm ${
              (formDetails.settings as any).backgroundImage ? 'bg-white/90 backdrop-blur-md text-slate-600' : 'bg-white text-slate-500'
            }`}>
              Página {currentPreviewPage + 1} de {pages.length}
            </div>
          )}
        </div>

        {/* PROGRESS BAR */}
        {pages.length > 1 && (
          <div className="w-full max-w-3xl mb-6 relative z-10">
            <div className={`h-2 w-full rounded-full overflow-hidden ${
              (formDetails.settings as any).backgroundImage ? 'bg-white/40 backdrop-blur-md' : 'bg-slate-200'
            }`}>
              <div 
                className="h-full bg-[#1e88e5] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="w-full max-w-3xl flex flex-col relative z-10 space-y-6">
          
          {currentPreviewPage === 0 && (
            <div className={`rounded-[2rem] border-t-[12px] border-[#1e88e5] shadow-xl p-10 flex flex-col items-center transition-colors relative overflow-hidden ${
              (formDetails.settings as any).backgroundImage ? 'bg-white/95 backdrop-blur-xl border border-white/40' : 'bg-white'
            }`}>
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              <img src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" alt="Logo" className="h-20 object-contain mb-6 drop-shadow-md relative z-10" />
              <h1 className="text-4xl font-black text-slate-900 relative z-10 text-center">{formDetails.title}</h1>
              <p className="text-slate-600 mt-4 text-lg max-w-2xl font-medium relative z-10 text-center">{formDetails.description}</p>
            </div>
          )}
          
          {currentFields.map((field) => {
            if (field.type === 'section') {
              return (
                <div key={field.id} className="pt-8 pb-4">
                  <h2 className={`text-3xl font-black ${
                    (formDetails.settings as any).backgroundImage ? 'text-white drop-shadow-md' : 'text-[#1e88e5]'
                  }`}>{field.label}</h2>
                  {field.placeholder && <p className={`mt-2 text-lg ${
                    (formDetails.settings as any).backgroundImage ? 'text-white/80' : 'text-slate-600'
                  }`}>{field.placeholder}</p>}
                </div>
              );
            }
            if (field.type === 'html') {
               return (
                 <div key={field.id} className={`prose max-w-none text-slate-700 p-8 rounded-[2rem] shadow-sm ${
                   (formDetails.settings as any).backgroundImage ? 'bg-white/95 backdrop-blur-md border border-white/40' : 'bg-white border-transparent'
                 }`} dangerouslySetInnerHTML={{ __html: field.label }} />
               );
            }
            return (
              <div key={field.id} className={`space-y-3 p-8 rounded-[2rem] transition-all ${
                (formDetails.settings as any).backgroundImage ? 'bg-white/95 backdrop-blur-md border border-white/40 shadow-lg' : 'bg-white border-2 border-transparent shadow-sm'
              }`}>
                <label className="block text-base font-bold text-slate-800">
                  {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.placeholder && <p className="text-sm text-slate-600 mb-3">{field.placeholder}</p>}
                
                {field.type === 'textarea' ? (
                  <textarea className="w-full bg-white/80 border-2 border-slate-200/60 rounded-xl p-4 focus:ring-4 focus:ring-blue-50 focus:border-[#1e88e5] outline-none resize-none transition-all text-slate-800 shadow-inner" rows={4}></textarea>
                ) : field.type === 'file' || field.type === 'image' ? (
                  <div className="border-2 border-dashed border-[#1e88e5]/40 hover:border-[#1e88e5] hover:bg-blue-50/50 transition-colors p-10 rounded-xl text-center bg-white/80 cursor-pointer group shadow-inner">
                    <UploadCloud className="w-10 h-10 text-[#1e88e5]/60 group-hover:text-[#1e88e5] mx-auto mb-3 transition-colors" />
                    <p className="text-slate-700 font-medium">Haz clic o arrastra tu archivo aquí</p>
                    <p className="text-slate-500 text-sm mt-1">Soporta PNG, JPG o PDF (Max. 10MB)</p>
                  </div>
                ) : field.type === 'select' ? (
                  <select className="w-full bg-white/80 border-2 border-slate-200/60 rounded-xl p-4 focus:ring-4 focus:ring-blue-50 focus:border-[#1e88e5] outline-none transition-all text-slate-800 cursor-pointer appearance-none shadow-inner">
                    <option value="">Selecciona una opción...</option>
                    {field.options ? field.options.filter(o => o.trim() !== '').map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    )) : (
                      <>
                        <option value="1">Opción 1</option>
                        <option value="2">Opción 2</option>
                        <option value="3">Opción 3</option>
                      </>
                    )}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="space-y-3 mt-2">
                    {(field.options && field.options.length > 0 ? field.options : ['Opción A', 'Opción B', 'Opción C']).filter(o => o.trim() !== '').map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border-2 border-slate-200/60 rounded-xl hover:border-[#1e88e5] hover:bg-blue-50/50 cursor-pointer transition-colors bg-white/60">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#1e88e5] focus:ring-[#1e88e5]" />
                        <span className="text-slate-800 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} className="w-full bg-white/80 border-2 border-slate-200/60 rounded-xl p-4 focus:ring-4 focus:ring-blue-50 focus:border-[#1e88e5] outline-none transition-all text-slate-800 shadow-inner" />
                )}
              </div>
            );
          })}
          
          {currentFields.length === 0 && (
            <div className={`text-center py-12 rounded-[2rem] ${
              (formDetails.settings as any).backgroundImage ? 'bg-white/95 backdrop-blur-md border border-white/40' : 'bg-white shadow-sm'
            }`}>
              <p className="text-slate-600 text-lg">Esta página no tiene preguntas.</p>
            </div>
          )}
          
          <div className={`p-8 flex gap-4 rounded-[2rem] ${
            (formDetails.settings as any).backgroundImage ? 'bg-white/95 backdrop-blur-md border border-white/40 shadow-lg' : 'bg-white shadow-sm border border-slate-100'
          }`}>
            {currentPreviewPage > 0 && (
              <button 
                onClick={() => setCurrentPreviewPage(prev => prev - 1)}
                className="flex-1 bg-slate-50 border-2 border-slate-200/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 py-4 rounded-xl font-bold text-xl transition-all shadow-sm"
              >
                Atrás
              </button>
            )}
            
            {currentPreviewPage < pages.length - 1 ? (
              <button 
                onClick={() => setCurrentPreviewPage(prev => prev + 1)}
                className="flex-[2] bg-[#1e88e5] hover:bg-[#1565c0] text-white py-4 rounded-xl font-bold text-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1"
              >
                Siguiente
              </button>
            ) : (
              <button 
                onClick={() => {
                  if (isPreviewSubmitting || previewSubmitSuccess) return;
                  setIsPreviewSubmitting(true);
                  // Simulate network request
                  setTimeout(() => {
                    setIsPreviewSubmitting(false);
                    setPreviewSubmitSuccess(true);
                    // Wait to show success animation, then reset
                    setTimeout(() => {
                      setPreviewSubmitSuccess(false);
                      setShowPreview(false);
                      setCurrentPreviewPage(0);
                    }, 1500);
                  }, 1500);
                }}
                disabled={isPreviewSubmitting || previewSubmitSuccess}
                className={`flex-[2] relative overflow-hidden group py-4 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 ${
                  previewSubmitSuccess 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/40' 
                    : isPreviewSubmitting
                      ? 'bg-gradient-to-r from-[#1e88e5] to-[#1565c0] text-white opacity-80 cursor-wait'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/30'
                }`}
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <div className="relative flex items-center justify-center gap-2">
                  {previewSubmitSuccess ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 animate-[bounce_0.5s_ease-out]" />
                      <span>¡Enviado con Éxito!</span>
                    </>
                  ) : isPreviewSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Respuestas</span>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
        
        {/* Footer in Preview */}
        {formDetails.settings.footerText && (
          <div className={`w-full max-w-3xl mt-6 p-8 text-center rounded-[2rem] border relative z-10 ${
            (formDetails.settings as any).backgroundImage ? 'bg-black/40 backdrop-blur-md border-white/10 text-white/90 shadow-lg' : 'bg-slate-100/50 border-slate-200 text-slate-600 shadow-sm'
          }`}>
            <p className="text-sm font-semibold tracking-wide" dangerouslySetInnerHTML={{ __html: formDetails.settings.footerText }}></p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Topbar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/forms')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-slate-900">Modo Edición</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-5 py-2 text-[#1e88e5] bg-blue-50 hover:bg-blue-100 rounded-full font-bold transition-colors">
            <Play className="w-4 h-4 fill-current" /> Vista Previa
          </button>
          <button onClick={handlePublish} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-[#1e88e5] hover:bg-[#1565c0] text-white rounded-full font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70">
            <Save className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar y Publicar'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Tools */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Añadir Elementos</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            {availableTools.map(tool => {
              const Icon = tool.icon;
              const isSection = tool.type === 'section';
              return (
                <button 
                  key={tool.type}
                  onClick={() => addField(tool.type)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all border ${
                    isSection 
                      ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700 hover:shadow-md'
                      : 'text-slate-600 border-transparent hover:bg-blue-50 hover:text-[#1e88e5] hover:border-blue-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tool.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Panel: Canvas */}
        <main 
          className="flex-1 overflow-y-auto p-8 flex flex-col items-center relative transition-all duration-500 bg-cover bg-center bg-fixed"
          style={{
            backgroundColor: (formDetails.settings as any).backgroundImage ? 'transparent' : formDetails.settings.backgroundColor || '#F1F5F9',
            backgroundImage: (formDetails.settings as any).backgroundImage ? `url(${(formDetails.settings as any).backgroundImage})` : 'none'
          }}
        >
          {/* Capa de oscurecimiento si hay imagen para previsualización */}
          {(formDetails.settings as any).backgroundImage && <div className="fixed inset-0 bg-black/20 pointer-events-none z-0"></div>}

          <div className="max-w-3xl w-full relative z-10 flex-1 flex flex-col">
            
            {/* Form Header (Editable) */}
            <div className={`rounded-[2rem] border-t-[12px] border-[#1e88e5] shadow-xl p-10 mb-6 flex flex-col items-center transition-colors ${
              (formDetails.settings as any).backgroundImage ? 'bg-white/90 backdrop-blur-xl border border-white/20' : 'bg-white'
            }`}>
              <img src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" alt="Logo" className="h-20 object-contain mb-6" />
              <input 
                type="text" 
                value={formDetails.title}
                onChange={(e) => setFormDetails({...formDetails, title: e.target.value})}
                className="w-full text-center text-4xl font-black text-slate-900 mb-4 border-b-2 border-transparent hover:border-slate-200 focus:border-[#1e88e5] outline-none focus:ring-0 bg-transparent transition-colors" 
              />
              <textarea 
                value={formDetails.description}
                onChange={(e) => setFormDetails({...formDetails, description: e.target.value})}
                className="w-full text-center text-lg text-slate-500 font-medium border-b-2 border-transparent hover:border-slate-200 focus:border-[#1e88e5] outline-none focus:ring-0 bg-transparent resize-none overflow-hidden transition-colors" 
                rows={2}
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div 
                  key={field.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    // Pequeño hack para Firefox
                    e.dataTransfer.setData('text/plain', index.toString());
                    setActiveFieldId(field.id);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    if (fromIndex === index || isNaN(fromIndex)) return;
                    
                    const newFields = [...fields];
                    const [movedField] = newFields.splice(fromIndex, 1);
                    newFields.splice(index, 0, movedField);
                    setFields(newFields);
                  }}
                  onClick={() => setActiveFieldId(field.id)}
                  className={`group relative p-8 rounded-3xl transition-all cursor-pointer ${
                    (formDetails.settings as any).backgroundImage ? 'bg-white/85 backdrop-blur-md border border-white/40 shadow-lg' : 'bg-white border-2 border-transparent hover:border-slate-200 shadow-sm'
                  } ${
                    activeFieldId === field.id 
                      ? 'ring-4 ring-[#1e88e5]/50 transform scale-[1.01]' 
                      : ''
                  } ${field.type === 'section' ? 'bg-slate-800 text-white border-none mt-10 backdrop-blur-none' : ''}`}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-2">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="pl-8">
                    {field.type === 'section' ? (
                      <div className="py-2">
                        <h4 className="text-2xl font-bold mb-2">{field.label}</h4>
                        <p className="text-slate-400">{field.placeholder}</p>
                      </div>
                    ) : field.type === 'html' ? (
                      <div className="prose max-w-none text-slate-600 bg-slate-50 p-4 rounded-xl border-2 border-slate-100" dangerouslySetInnerHTML={{ __html: field.label }} />
                    ) : (
                      <>
                        <div className="flex gap-2 items-center mb-4">
                          <span className="text-sm font-bold text-slate-400">{index + 1}.</span>
                          <h4 className="text-lg font-bold text-slate-800">{field.label} {field.required && <span className="text-red-500">*</span>}</h4>
                        </div>
                        {field.type === 'text' || field.type === 'number' || field.type === 'date' ? (
                          <input disabled type={field.type} placeholder={field.placeholder} className="w-full border-2 border-slate-100 rounded-xl py-3 px-4 bg-slate-50 text-slate-500 cursor-not-allowed" />
                        ) : field.type === 'textarea' ? (
                          <textarea disabled placeholder={field.placeholder} className="w-full border-2 border-slate-100 rounded-xl py-3 px-4 bg-slate-50 text-slate-500 cursor-not-allowed resize-none" rows={3} />
                        ) : field.type === 'file' || field.type === 'image' ? (
                           <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-8 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
                             {field.type === 'file' ? <UploadCloud className="w-8 h-8"/> : <ImageIcon className="w-8 h-8"/>}
                             <span className="font-medium">Zona de subida de archivo protegida</span>
                           </div>
                        ) : field.type === 'select' ? (
                          <div className="w-full border-2 border-slate-100 rounded-xl py-3 px-4 bg-slate-50 text-slate-500 flex justify-between items-center cursor-not-allowed">
                            <span>Selecciona una opción...</span>
                            <div className="w-3 h-3 border-b-2 border-r-2 border-slate-400 transform rotate-45 mr-1"></div>
                          </div>
                        ) : field.type === 'checkbox' ? (
                          <div className="space-y-3 mt-2">
                            {(field.options && field.options.length > 0 ? field.options : ['Opción A', 'Opción B', 'Opción C']).filter((o: string) => o.trim() !== '').map((opt: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 border-2 border-slate-100 rounded-xl bg-slate-50 opacity-70">
                                <div className={`w-5 h-5 border-2 border-slate-300 ${field.allowMultiple === false ? 'rounded-full' : 'rounded'}`}></div>
                                <span className="text-slate-500 font-medium">{opt}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 border-2 border-slate-100 rounded-xl p-4 bg-slate-50 font-medium">Elemento interactivo: {field.type}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer previsualizado */}
            {formDetails.settings.footerText && (
              <div className={`mt-6 p-6 text-center rounded-[2rem] border ${
                (formDetails.settings as any).backgroundImage ? 'bg-black/30 backdrop-blur-md border-white/10 text-white/90' : 'bg-slate-200/50 border-slate-200 text-slate-500'
              }`}>
                 <p className="text-sm font-semibold tracking-wide" dangerouslySetInnerHTML={{ __html: formDetails.settings.footerText }}></p>
              </div>
            )}

            {/* Form Settings Overlay in Builder */}
            <div className="mt-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Palette className="w-5 h-5 text-indigo-500"/> Personalización del Formulario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Color de Fondo</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={formDetails.settings.backgroundColor}
                      onChange={(e) => setFormDetails({...formDetails, settings: {...formDetails.settings, backgroundColor: e.target.value}})}
                      className="w-12 h-12 rounded-lg cursor-pointer border-none"
                    />
                    <span className="text-slate-500 text-sm font-medium">{formDetails.settings.backgroundColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Imagen de Fondo (URL)</label>
                  <input 
                    type="text" 
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={(formDetails.settings as any).backgroundImage || ''}
                    onChange={(e) => setFormDetails({...formDetails, settings: {...formDetails.settings, backgroundImage: e.target.value}})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-indigo-500 outline-none text-slate-700 font-medium transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Pie de Página / Agradecimiento</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Desarrollado por Renovación"
                    value={formDetails.settings.footerText}
                    onChange={(e) => setFormDetails({...formDetails, settings: {...formDetails.settings, footerText: e.target.value}})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-indigo-500 outline-none text-slate-700 font-medium transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Fecha y Hora de Cierre</label>
                  <input 
                    type="datetime-local" 
                    value={formDetails.settings.expiresAt || ''}
                    onChange={(e) => setFormDetails({...formDetails, settings: {...formDetails.settings, expiresAt: e.target.value}})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-indigo-500 outline-none text-slate-700 font-medium transition-colors"
                  />
                  <p className="text-xs text-slate-400 mt-1">Dejar vacío para nunca cerrar</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Límite de Respuestas</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Ej. 100"
                    value={formDetails.settings.maxResponses || ''}
                    onChange={(e) => setFormDetails({...formDetails, settings: {...formDetails.settings, maxResponses: parseInt(e.target.value) || undefined}})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 focus:border-indigo-500 outline-none text-slate-700 font-medium transition-colors"
                  />
                  <p className="text-xs text-slate-400 mt-1">Dejar vacío para ilimitadas</p>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Right Panel: Settings */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Propiedades del Campo</h3>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {activeField ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {activeField.type === 'html' ? 'Contenido del Texto / HTML' : 'Título de la Pregunta'}
                  </label>
                  {activeField.type === 'html' ? (
                    <textarea
                      value={activeField.label}
                      onChange={(e) => updateActiveField({ label: e.target.value })}
                      className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-[#1e88e5] focus:border-[#1e88e5] outline-none resize-none font-mono"
                      rows={6}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={activeField.label}
                      onChange={(e) => updateActiveField({ label: e.target.value })}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e88e5] focus:border-[#1e88e5] outline-none"
                    />
                  )}
                </div>
                
                {activeField.type !== 'html' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Instrucción / Texto de Ayuda</label>
                    <input 
                      type="text" 
                      value={activeField.placeholder}
                      onChange={(e) => updateActiveField({ placeholder: e.target.value })}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e88e5] focus:border-[#1e88e5] outline-none"
                    />
                  </div>
                )}


                {(activeField.type === 'select' || activeField.type === 'checkbox') && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Opciones (una por línea)</label>
                    <textarea 
                      value={(activeField.options || ['Opción A', 'Opción B', 'Opción C']).join('\n')}
                      onChange={(e) => {
                        const newOptions = e.target.value.split('\n');
                        updateActiveField({ options: newOptions });
                      }}
                      className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-[#1e88e5] focus:border-[#1e88e5] outline-none resize-none leading-relaxed"
                      rows={5}
                      placeholder="Opción A&#10;Opción B&#10;Opción C"
                    />
                    <p className="text-xs text-slate-500 mt-2 font-medium">Presiona <strong>Enter</strong> para agregar una nueva opción a la lista.</p>
                  </div>
                )}

                {activeField.type === 'checkbox' && (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 cursor-pointer select-none" htmlFor="multi-toggle">Permitir selección múltiple</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input 
                        type="checkbox" 
                        id="multi-toggle" 
                        checked={activeField.allowMultiple !== false}
                        onChange={(e) => updateActiveField({ allowMultiple: e.target.checked })}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-rm-azul"
                        style={{ borderColor: activeField.allowMultiple !== false ? '#1E3A8A' : '#CBD5E1', backgroundColor: 'white' }}
                      />
                      <label htmlFor="multi-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${activeField.allowMultiple !== false ? 'bg-rm-azul' : 'bg-slate-300'}`}></label>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 cursor-pointer select-none" htmlFor="req-toggle">Obligatorio</label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      id="req-toggle" 
                      checked={activeField.required}
                      onChange={(e) => updateActiveField({ required: e.target.checked })}
                      className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-rm-azul"
                      style={{ borderColor: activeField.required ? '#1E3A8A' : '#CBD5E1', backgroundColor: 'white' }}
                    />
                    <label htmlFor="req-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${activeField.required ? 'bg-rm-azul' : 'bg-slate-300'}`}></label>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <button className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-md font-medium text-sm transition-colors"
                  onClick={() => {
                    const newFields = fields.filter(f => f.id !== activeField.id);
                    setFields(newFields);
                    setActiveFieldId(newFields.length > 0 ? newFields[0].id : null);
                  }}>
                    <Trash2 className="w-4 h-4" />
                    Eliminar Campo
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 mt-10">
                Haz clic en cualquier campo del centro para editar sus propiedades.
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
