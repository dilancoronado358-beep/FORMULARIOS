import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadCloud, Send, CheckCircle2, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PublicForm() {
  const { slug } = useParams(); // Using slug as parameter name to match App.tsx mapping or we can update App.tsx to use :id. App.tsx currently uses path="/f/:slug". I will use the actual ID here as the parameter.
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadForm() {
      try {
        const { data, error } = await supabase.from('forms').select('*').eq('id', slug).single();
        if (data) {
          setForm(data);
        }
      } catch (err) {
        console.error("Error cargando formulario de Supabase:", err);
      }
    }
    if (slug) loadForm();
  }, [slug]);

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Formulario no encontrado</h2>
          <p className="text-slate-500 mt-2">El enlace es inválido o el formulario ya no está disponible.</p>
        </div>
      </div>
    );
  }

  const { title, description, fields = [], settings = {} } = form;
  const bgColor = settings.backgroundColor || '#F8FAFC';
  const bgImage = settings.backgroundImage || null;
  
  // Dividir en páginas usando secciones
  const pages: any[][] = [];
  let tempPage: any[] = [];
  
  fields.forEach((field: any) => {
    if (field.type === 'section') {
      if (tempPage.length > 0) pages.push(tempPage);
      tempPage = [field];
    } else {
      tempPage.push(field);
    }
  });
  if (tempPage.length > 0) pages.push(tempPage);
  if (pages.length === 0) pages.push([]);

  const currentFields = pages[currentPage] || [];
  const progress = pages.length > 1 ? ((currentPage + 1) / pages.length) * 100 : 100;

  const handleValidateAndProceed = (isSubmit: boolean) => {
    const newErrors: Record<string, boolean> = {};
    let hasError = false;

    currentFields.forEach((field: any) => {
      if (field.required && field.type !== 'html' && field.type !== 'section') {
        const val = responses[field.id];
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

    setErrors(newErrors);

    if (hasError) return;

    if (isSubmit) {
      if (isSubmitting || submitSuccess) return;
      setIsSubmitting(true);
      setSubmitError(null);

      // We do async inside an IIFE to not block
      (async () => {
        try {
          const existing = JSON.parse(localStorage.getItem('rm_responses_list') || '[]');
          
          let inferredName = 'Anónimo';
          let inferredEmail = 'No proporcionado';
          
          Object.entries(responses).forEach(([k, v]) => {
            const valStr = String(v).toLowerCase();
            if (valStr.includes('@') && valStr.includes('.')) inferredEmail = String(v);
            if (typeof v === 'string' && v.length > 2 && v.length < 50 && !v.includes('@')) {
               if (inferredName === 'Anónimo') inferredName = v;
            }
          });

          // 1. Verificar Duplicados
          let isDuplicate = false;
          
          const hasLocalDuplicate = existing.some((r: any) => 
            r.formId === form.id && 
            ((r.email === inferredEmail && r.email !== 'No proporcionado') || 
             (r.user === inferredName && r.user !== 'Anónimo'))
          );

          if (hasLocalDuplicate) {
            isDuplicate = true;
          } else {
            try {
              let query = supabase.from('form_responses').select('id').eq('form_id', form.id);
              if (inferredEmail !== 'No proporcionado') {
                query = query.eq('user_email', inferredEmail);
              } else if (inferredName !== 'Anónimo') {
                query = query.eq('user_name', inferredName);
              }
              const { data: duplicateCheck } = await query;
              if (duplicateCheck && duplicateCheck.length > 0) {
                isDuplicate = true;
              }
            } catch(e) {}
          }

          if (isDuplicate) {
            setSubmitError("Solo se permite una respuesta por persona para este formulario. Ya tenemos un registro con tus datos.");
            setIsSubmitting(false);
            return;
          }

          const dataWithLabels: Record<string, any> = {};
          Object.entries(responses).forEach(([k, v]) => {
            const field = form.fields?.find((f: any) => f.id === k);
            if (field) {
              dataWithLabels[field.label] = v;
            } else {
              dataWithLabels[k] = v;
            }
          });

          const newResponseId = Math.random().toString(36).substring(2, 6).toUpperCase();

          try {
            await supabase.from('form_responses').insert({
              form_id: form.id,
              status: 'COMPLETED',
              data: dataWithLabels,
              user_name: inferredName,
              user_email: inferredEmail
            });
          } catch(e) {}

          const newResponse = {
            id: newResponseId,
            formId: form.id,
            formName: form.title || 'Formulario',
            user: inferredName,
            email: inferredEmail,
            date: new Date().toISOString().split('T')[0],
            status: 'Completado',
            data: dataWithLabels
          };
          localStorage.setItem('rm_responses_list', JSON.stringify([...existing, newResponse]));

          setIsSubmitting(false);
          setSubmitSuccess(true);
        } catch(e) {
          setIsSubmitting(false);
          setSubmitError("Error inesperado al enviar el formulario.");
        }
      })();
    } else {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div 
      className="min-h-screen py-12 px-4 flex flex-col items-center transition-colors duration-500 bg-cover bg-center bg-fixed" 
      style={{ 
        backgroundColor: bgImage ? 'transparent' : bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : 'none'
      }}
    >
      {/* Capa de oscurecimiento si hay imagen para mejorar lectura */}
      {bgImage && <div className="fixed inset-0 bg-black/20 pointer-events-none z-0"></div>}

      <div className="w-full max-w-3xl flex justify-between mb-6 relative z-10">
        {pages.length > 1 && (
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
            Página {currentPage + 1} de {pages.length}
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl flex flex-col relative z-10 space-y-6">
        
        {pages.length > 1 && (
          <div className="w-full max-w-3xl mb-2 relative z-10">
            <div className={`h-2 w-full rounded-full overflow-hidden ${
              bgImage ? 'bg-white/40 backdrop-blur-md' : 'bg-slate-200'
            }`}>
              <div 
                className="h-full bg-[#1e88e5] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[3rem] animate-fade-in transform transition-all hover:scale-[1.02] duration-500">
            <div className="w-28 h-28 bg-gradient-to-tr from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/30 animate-[bounce_1s_ease-out]">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">¡Muchas gracias!</h1>
            <p className="text-xl text-slate-600 max-w-lg mb-10 leading-relaxed">
              Tus respuestas han sido recibidas y registradas exitosamente. Apreciamos tu tiempo.
            </p>
          </div>
        ) : (
          <>
            {submitError && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-2xl flex items-start gap-4 mb-6 shadow-sm animate-fade-in">
                <XCircle className="w-6 h-6 flex-shrink-0 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-bold text-lg mb-1">No se pudo enviar</h3>
                  <p className="text-sm opacity-90">{submitError}</p>
                </div>
              </div>
            )}

            {currentPage === 0 && (
              <div className={`rounded-[2rem] border-t-[12px] border-[#1e88e5] shadow-xl p-10 flex flex-col items-center transition-colors relative overflow-hidden ${
                bgImage ? 'bg-white/95 backdrop-blur-xl border border-white/40' : 'bg-white'
              }`}>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                <img src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" alt="Logo" className="h-20 object-contain mb-6 drop-shadow-md relative z-10" />
                <h1 className="text-4xl font-black text-slate-900 relative z-10 text-center">{title}</h1>
                <p className="text-slate-600 mt-4 text-lg max-w-2xl font-medium relative z-10 text-center">{description}</p>
              </div>
            )}
            
            {currentFields.map((field: any) => {
          if (field.type === 'section') {
            return (
              <div key={field.id} className="pt-8 pb-4">
                <h2 className={`text-3xl font-black ${bgImage ? 'text-white drop-shadow-md' : 'text-[#1e88e5]'}`}>{field.label}</h2>
                {field.placeholder && <p className={`mt-2 text-lg ${bgImage ? 'text-white/80' : 'text-slate-600'}`}>{field.placeholder}</p>}
              </div>
            );
          }
          if (field.type === 'html') {
             return (
               <div key={field.id} className={`prose max-w-none text-slate-700 p-8 rounded-[2rem] shadow-sm ${bgImage ? 'bg-white/95 backdrop-blur-md border border-white/40' : 'bg-white border-transparent'}`} dangerouslySetInnerHTML={{ __html: field.label }} />
             );
          }
          return (
            <div key={field.id} className={`space-y-3 p-8 rounded-[2rem] transition-all ${
              bgImage ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm'
            } ${errors[field.id] ? 'border-2 border-red-400 shadow-red-500/20' : bgImage ? 'border border-white/40' : 'border-2 border-transparent'}`}>
              <label className="block text-base font-bold text-slate-800 flex items-center gap-2">
                {field.label} {field.required && <span className="text-red-500">*</span>}
                {errors[field.id] && <AlertCircle className="w-5 h-5 text-red-500" />}
              </label>
              {field.placeholder && <p className="text-sm text-slate-600 mb-3">{field.placeholder}</p>}
              
              {field.type === 'textarea' ? (
                <textarea 
                  value={responses[field.id] || ''}
                  onChange={(e) => {
                    setResponses(prev => ({ ...prev, [field.id]: e.target.value }));
                    if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: false }));
                  }}
                  className={`w-full bg-white/80 border-2 rounded-xl p-4 focus:ring-4 focus:outline-none resize-none transition-all text-slate-800 shadow-inner ${errors[field.id] ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 'border-slate-200/60 focus:ring-blue-50 focus:border-[#1e88e5]'}`} 
                  rows={4}
                ></textarea>
              ) : field.type === 'file' || field.type === 'image' ? (
                <div className={`border-2 border-dashed transition-colors p-10 rounded-xl text-center bg-white/80 cursor-pointer group shadow-inner ${errors[field.id] ? 'border-red-300 hover:border-red-500 hover:bg-red-50/50' : 'border-[#1e88e5]/40 hover:border-[#1e88e5] hover:bg-blue-50/50'}`}>
                  <UploadCloud className={`w-10 h-10 mx-auto mb-3 transition-colors ${errors[field.id] ? 'text-red-400 group-hover:text-red-500' : 'text-[#1e88e5]/60 group-hover:text-[#1e88e5]'}`} />
                  <p className="text-slate-700 font-medium">Haz clic o arrastra tu archivo aquí</p>
                  <p className="text-slate-500 text-sm mt-1">Soporta PNG, JPG o PDF (Max. 10MB)</p>
                </div>
              ) : field.type === 'select' ? (
                <select 
                  value={responses[field.id] || ''}
                  onChange={(e) => {
                    setResponses(prev => ({ ...prev, [field.id]: e.target.value }));
                    if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: false }));
                  }}
                  className={`w-full bg-white/80 border-2 rounded-xl p-4 focus:ring-4 focus:outline-none transition-all text-slate-800 cursor-pointer appearance-none shadow-inner ${errors[field.id] ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 'border-slate-200/60 focus:ring-blue-50 focus:border-[#1e88e5]'}`}
                >
                  <option value="">Selecciona una opción...</option>
                  {field.options ? field.options.map((opt: string, i: number) => (
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
                  {(field.options && field.options.length > 0 ? field.options : ['Opción A', 'Opción B', 'Opción C']).map((opt: string, i: number) => {
                    const isChecked = (responses[field.id] || []).includes(opt);
                    return (
                      <label key={i} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors bg-white/60 ${errors[field.id] ? 'border-red-200 hover:border-red-400 hover:bg-red-50/50' : 'border-slate-200/60 hover:border-[#1e88e5] hover:bg-blue-50/50'}`}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            let curr = responses[field.id] || [];
                            if (e.target.checked) curr = [...curr, opt];
                            else curr = curr.filter((v: string) => v !== opt);
                            setResponses(prev => ({ ...prev, [field.id]: curr }));
                            if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: false }));
                          }}
                          className={`w-5 h-5 rounded ${errors[field.id] ? 'border-red-300 text-red-500 focus:ring-red-500' : 'border-slate-300 text-[#1e88e5] focus:ring-[#1e88e5]'}`} 
                        />
                        <span className="text-slate-800 font-medium">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input 
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                  value={responses[field.id] || ''}
                  onChange={(e) => {
                    setResponses(prev => ({ ...prev, [field.id]: e.target.value }));
                    if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: false }));
                  }}
                  className={`w-full bg-white/80 border-2 rounded-xl p-4 focus:ring-4 focus:outline-none transition-all text-slate-800 shadow-inner ${errors[field.id] ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 'border-slate-200/60 focus:ring-blue-50 focus:border-[#1e88e5]'}`} 
                />
              )}
              {errors[field.id] && <p className="text-red-500 text-sm font-bold mt-2 animate-pulse">Este campo es obligatorio</p>}
            </div>
          );
        })}
        
        {currentFields.length === 0 && (
          <div className={`text-center py-12 rounded-[2rem] ${bgImage ? 'bg-white/95 backdrop-blur-md border border-white/40' : 'bg-white shadow-sm'}`}>
            <p className="text-slate-600 text-lg">Esta página no tiene preguntas.</p>
          </div>
        )}
        
        <div className={`p-8 flex gap-4 rounded-[2rem] ${bgImage ? 'bg-white/95 backdrop-blur-md border border-white/40 shadow-lg' : 'bg-white shadow-sm border border-slate-100'}`}>
          {currentPage > 0 && (
            <button 
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="flex-1 bg-slate-50 border-2 border-slate-200/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 py-4 rounded-xl font-bold text-xl transition-all shadow-sm"
            >
              Atrás
            </button>
          )}
          
          {currentPage < pages.length - 1 ? (
            <button 
              onClick={() => handleValidateAndProceed(false)}
              className="flex-[2] bg-[#1e88e5] hover:bg-[#1565c0] text-white py-4 rounded-xl font-bold text-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1"
            >
              Siguiente
            </button>
          ) : (
            <button 
              onClick={() => handleValidateAndProceed(true)}
              disabled={isSubmitting || submitSuccess}
              className={`flex-[2] relative overflow-hidden group py-4 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 ${
                submitSuccess 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/40' 
                  : isSubmitting
                    ? 'bg-gradient-to-r from-[#1e88e5] to-[#1565c0] text-white opacity-80 cursor-wait'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/30'
              }`}
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <div className="relative flex items-center justify-center gap-2">
                {submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 animate-[bounce_0.5s_ease-out]" />
                    <span>¡Enviado con Éxito!</span>
                  </>
                ) : isSubmitting ? (
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
        </>
      )}

      {/* Footer del formulario (solo si no es pantalla de éxito) */}
      {!submitSuccess && settings.footerText && (
        <div className={`p-8 text-center rounded-[2rem] border ${bgImage ? 'bg-black/40 backdrop-blur-md border-white/10 text-white/90 shadow-lg' : 'bg-slate-100/50 border-slate-200 text-slate-600 shadow-sm'}`}>
           <p className="text-sm font-semibold tracking-wide" dangerouslySetInnerHTML={{ __html: settings.footerText }}></p>
        </div>
      )}
    </div>
  </div>
);
}
