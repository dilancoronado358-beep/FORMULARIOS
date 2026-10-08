import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadCloud, Send, CheckCircle2, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PublicForm() {
  const { slug } = useParams(); // Using slug as parameter name to match App.tsx mapping or we can update App.tsx to use :id. App.tsx currently uses path="/f/:slug". I will use the actual ID here as the parameter.
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isClosed, setIsClosed] = useState(false);
  const [closedReason, setClosedReason] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        const { data, error } = await supabase.from('forms').select('*').eq('id', slug).single();
        if (data) {
          setForm(data);
          
          let closed = false;
          let reason = null;

          // Check Expiry Date
          if (data.settings?.expiresAt) {
            const expiryDate = new Date(data.settings.expiresAt);
            if (new Date() > expiryDate) {
              closed = true;
              reason = "El periodo para llenar este formulario ha finalizado.";
            }
          }

          // Check Max Responses
          if (!closed) {
             try {
                const { count, error: countError } = await supabase
                  .from('form_responses')
                  .select('id', { count: 'exact', head: true })
                  .eq('form_id', data.id);
                  
                const maxResponses = data.settings?.maxResponses ? parseInt(data.settings.maxResponses) : Infinity;
                
                // Fallback a localStorage si Supabase falla
                let totalResponses = count || 0;
                if (countError) {
                   const localResponses = JSON.parse(localStorage.getItem('rm_responses_list') || '[]');
                   totalResponses = localResponses.filter((r: any) => r.formId === data.id).length;
                }
                
                if (totalResponses >= maxResponses) {
                  closed = true;
                  reason = "Se ha alcanzado el límite máximo de respuestas para este formulario.";
                }
             } catch (e) {
                console.error(e);
             }
          }

          if (closed) {
            setIsClosed(true);
            setClosedReason(reason);
          }
        }
      } catch (err) {
        console.error("Error cargando formulario de Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (slug) loadForm();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-slate-50">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-emerald-100 opacity-60"></div>
        <div className="absolute w-[150vw] h-[150vw] md:w-[80vw] md:h-[80vw] bg-blue-300/30 rounded-full blur-[100px] animate-pulse"></div>
        
        {/* Logo Container */}
        <div className="relative z-10 flex flex-col items-center transform transition-all">
          <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center mb-8">
            {/* Spinning glowing rings */}
            <div className="absolute inset-0 border-[6px] border-transparent border-t-[#1e88e5] border-r-[#1e88e5] rounded-full animate-spin shadow-lg"></div>
            <div className="absolute inset-[-12px] border-[6px] border-transparent border-b-emerald-500 border-l-emerald-500 rounded-full opacity-80 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-[-24px] border-[4px] border-transparent border-t-slate-800 border-b-slate-800 rounded-full opacity-40 animate-spin" style={{ animationDuration: '3s' }}></div>
            
            {/* The Logo itself */}
            <div className="absolute inset-3 bg-white/90 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center p-4 animate-pulse" style={{ animationDuration: '2s' }}>
              <img 
                src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" 
                alt="Cargando" 
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>
          
          {/* Loading Text */}
          <div className="mt-8 flex flex-col items-center animate-bounce">
            <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-[#1e88e5] to-emerald-600 bg-clip-text text-transparent tracking-tight">
              Cargando Formulario
            </h2>
            <div className="flex gap-2 mt-4">
              <div className="w-3 h-3 rounded-full bg-[#1e88e5] animate-ping" style={{ animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" style={{ animationDuration: '1.2s' }}></div>
              <div className="w-3 h-3 rounded-full bg-slate-800 animate-ping" style={{ animationDuration: '1.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  if (isClosed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 text-center max-w-md w-full animate-fade-in">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Formulario Cerrado</h2>
          <p className="text-slate-600 mb-6">{closedReason}</p>
          <button onClick={() => window.history.back()} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const { title, description, settings = {} } = form;
  const fields = form.fields || settings.fields || [];
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
          if (field.allowMultiple === false) {
             if (!val || String(val).trim() === '') {
                newErrors[field.id] = true;
                hasError = true;
             }
          } else {
             if (!val || val.length === 0) {
               newErrors[field.id] = true;
               hasError = true;
             }
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
          // Custom Ecuadorian Cedula validation
          let cedulaInvalid = false;
          Object.entries(responses).forEach(([k, v]) => {
            const field = fields.find((f: any) => f.id === k);
            if (field && (field.label.toLowerCase().includes('cedula') || field.label.toLowerCase().includes('cédula'))) {
              const cedula = String(v).trim();
              
              const isValidCedula = (ced: string) => {
                if (ced.length !== 10 || isNaN(Number(ced))) return false;
                const prov = parseInt(ced.substring(0, 2), 10);
                if (prov < 1 || (prov > 24 && prov !== 30)) return false;
                const tercer = parseInt(ced.charAt(2), 10);
                if (tercer > 5) return false;
                let total = 0;
                for (let i = 0; i < 9; i++) {
                  let val = parseInt(ced.charAt(i), 10);
                  if (i % 2 === 0) {
                    val *= 2;
                    if (val > 9) val -= 9;
                  }
                  total += val;
                }
                const verificador = parseInt(ced.charAt(9), 10);
                let superior = Math.ceil(total / 10) * 10;
                let calculado = superior - total;
                if (calculado === 10) calculado = 0;
                return calculado === verificador;
              };

              if (!isValidCedula(cedula)) {
                cedulaInvalid = true;
              }
            }
          });
          
          if (cedulaInvalid) {
             setSubmitError("La cédula ingresada no es válida. Por favor ingresa una cédula ecuatoriana real.");
             setIsSubmitting(false);
             return;
          }

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

          // Require email check
          if (inferredEmail === 'No proporcionado') {
             setSubmitError("El correo electrónico es obligatorio para el registro. Por favor, asegúrate de ingresar tu correo en el formulario.");
             setIsSubmitting(false);
             return;
          }

          // Anti-bot & Domain check
          const allowedDomains = [
            'gmail.com', 'googlemail.com',
            'outlook.com', 'outlook.es', 'hotmail.com', 'hotmail.es', 'live.com', 'live.com.mx', 'msn.com',
            'yahoo.com', 'yahoo.es', 'ymail.com',
            'protonmail.com', 'proton.me', 'pm.me',
            'zohomail.com', 'zoho.com',
            'icloud.com', 'me.com', 'mac.com'
          ];
          const emailParts = inferredEmail.toLowerCase().split('@');
          const emailDomain = emailParts.length > 1 ? emailParts[emailParts.length - 1] : '';
          
          if (!allowedDomains.includes(emailDomain)) {
             setSubmitError("Solo se permiten correos de proveedores reconocidos (Gmail, Outlook, Yahoo, Proton, Zoho, iCloud). Por favor usa un correo válido.");
             setIsSubmitting(false);
             return;
          }
          

          // 0. Verificar Límite antes de guardar
          try {
             const { count } = await supabase
               .from('form_responses')
               .select('id', { count: 'exact', head: true })
               .eq('form_id', form.id);
             const maxResponses = form.settings?.maxResponses ? parseInt(form.settings.maxResponses) : Infinity;
             if ((count || 0) >= maxResponses) {
                setSubmitError("Lo sentimos, se acaba de alcanzar el límite máximo de respuestas para este formulario.");
                setIsSubmitting(false);
                return;
             }
          } catch(e) {
             console.error("Error checking limit during submit:", e);
          }

          // 1. Verificar Duplicados
          let isDuplicate = false;
          
          if (inferredEmail !== 'No proporcionado' || inferredName !== 'Anónimo') {
            try {
              if (inferredEmail !== 'No proporcionado') {
                const { data: emailCheck } = await supabase
                  .from('form_responses')
                  .select('id')
                  .eq('form_id', form.id)
                  .ilike('user_email', inferredEmail);
                if (emailCheck && emailCheck.length > 0) isDuplicate = true;
              }
              
              if (!isDuplicate && inferredName !== 'Anónimo') {
                const { data: nameCheck } = await supabase
                  .from('form_responses')
                  .select('id')
                  .eq('form_id', form.id)
                  .ilike('user_name', inferredName);
                if (nameCheck && nameCheck.length > 0) isDuplicate = true;
              }
            } catch(e) {
              console.error("Error checking duplicates:", e);
            }
          } else {
            // Si es un formulario 100% anónimo (sin nombre ni email), usamos la memoria local para evitar spam
            const hasLocalDuplicate = existing.some((r: any) => r.formId === form.id);
            if (hasLocalDuplicate) {
              isDuplicate = true;
            }
          }

          if (isDuplicate) {
            setSubmitError("Solo se permite una respuesta por persona para este formulario. Ya tenemos un registro con tus datos.");
            setIsSubmitting(false);
            return;
          }

          const dataWithLabels: Record<string, any> = {};
          Object.entries(responses).forEach(([k, v]) => {
            const field = fields.find((f: any) => f.id === k);
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
      className="min-h-screen py-6 px-4 md:py-12 sm:px-6 lg:px-8 flex flex-col items-center transition-colors duration-500 bg-cover bg-center bg-fixed" 
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
          <div className="relative flex flex-col items-center justify-center py-16 px-6 md:py-24 md:px-12 text-center bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_0_100px_rgba(16,185,129,0.3)] rounded-[2rem] md:rounded-[3rem] overflow-hidden group">
            {/* Animated Celebration Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 via-transparent to-blue-50 opacity-50"></div>
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-400/20 rounded-full blur-[50px] animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-400/20 rounded-full blur-[50px] animate-pulse" style={{ animationDuration: '4s' }}></div>
            
            {/* Explosive rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] border-[2px] border-emerald-400/50 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[700px] md:h-[700px] border-[1px] border-blue-400/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>

            <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 mb-8 flex items-center justify-center animate-[bounce_2s_ease-in-out_infinite]">
              {/* Spinning success ring */}
              <div className="absolute inset-0 border-8 border-transparent border-t-emerald-400 border-r-emerald-400 rounded-full animate-spin shadow-[0_0_20px_rgba(52,211,153,0.6)]" style={{ animationDuration: '1.5s' }}></div>
              <div className="absolute inset-0 border-8 border-transparent border-b-[#1e88e5] border-l-[#1e88e5] rounded-full animate-spin shadow-[0_0_20px_rgba(30,136,229,0.6)]" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
              
              <div className="absolute inset-4 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full shadow-2xl flex items-center justify-center">
                 <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg" />
              </div>
            </div>

            <h1 className="relative z-10 text-4xl md:text-6xl font-black bg-gradient-to-r from-emerald-600 to-[#1e88e5] bg-clip-text text-transparent mb-4 md:mb-6 tracking-tight animate-pulse" style={{ animationDuration: '3s' }}>
              ¡Misión Cumplida!
            </h1>
            <p className="relative z-10 text-lg md:text-2xl text-slate-700 max-w-lg mb-4 font-medium leading-relaxed">
              Tus respuestas han sido registradas con éxito en el sistema central.
            </p>
            <p className="relative z-10 text-sm md:text-base text-slate-500 font-bold tracking-widest uppercase mt-4 opacity-70">
              Renovación Montufareña agradece tu tiempo
            </p>
          </div>
        ) : (
          <>
            {submitError && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 md:p-6 rounded-2xl flex items-start gap-4 mb-6 shadow-sm animate-fade-in">
                <XCircle className="w-6 h-6 flex-shrink-0 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-bold text-base md:text-lg mb-1">No se pudo enviar</h3>
                  <p className="text-xs md:text-sm opacity-90">{submitError}</p>
                </div>
              </div>
            )}

            {currentPage === 0 && (
              <div className={`rounded-[2rem] border-t-[8px] md:border-t-[12px] border-[#1e88e5] shadow-xl p-6 md:p-10 flex flex-col items-center transition-colors relative overflow-hidden ${
                bgImage ? 'bg-white/95 backdrop-blur-xl border border-white/40' : 'bg-white'
              }`}>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                <img src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" alt="Logo" className="h-16 md:h-20 object-contain mb-4 md:mb-6 drop-shadow-md relative z-10" />
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 relative z-10 text-center">{title}</h1>
                <p className="text-slate-600 mt-3 md:mt-4 text-base md:text-lg max-w-2xl font-medium relative z-10 text-center">{description}</p>
              </div>
            )}
            
            {currentFields.map((field: any) => {
          if (field.type === 'section') {
            return (
              <div key={field.id} className="pt-6 md:pt-8 pb-2 md:pb-4">
                <h2 className={`text-xl md:text-3xl font-black ${bgImage ? 'text-white drop-shadow-md' : 'text-[#1e88e5]'}`}>{field.label}</h2>
                {field.placeholder && <p className={`mt-1 md:mt-2 text-base md:text-lg ${bgImage ? 'text-white/80' : 'text-slate-600'}`}>{field.placeholder}</p>}
              </div>
            );
          }
          if (field.type === 'html') {
             return (
               <div key={field.id} className={`prose prose-sm md:prose-base max-w-none text-slate-700 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm ${bgImage ? 'bg-white/95 backdrop-blur-md border border-white/40' : 'bg-white border-transparent'}`} dangerouslySetInnerHTML={{ __html: field.label }} />
             );
          }
          return (
            <div key={field.id} className={`space-y-2 md:space-y-3 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] transition-all ${
              bgImage ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm'
            } ${errors[field.id] ? 'border-2 border-red-400 shadow-red-500/20' : bgImage ? 'border border-white/40' : 'border-2 border-transparent'}`}>
              <label className="block text-sm md:text-base font-bold text-slate-800 flex items-center gap-2">
                {field.label} {field.required && <span className="text-red-500">*</span>}
                {errors[field.id] && <AlertCircle className="w-5 h-5 text-red-500" />}
              </label>
              {field.placeholder && <p className="text-xs md:text-sm text-slate-600 mb-2 md:mb-3">{field.placeholder}</p>}
              
              {field.type === 'textarea' ? (
                <textarea 
                  value={responses[field.id] || ''}
                  onChange={(e) => {
                    setResponses(prev => ({ ...prev, [field.id]: e.target.value }));
                    if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: false }));
                  }}
                  className={`w-full bg-white/80 border-2 rounded-xl p-3 md:p-4 text-sm md:text-base focus:ring-4 focus:outline-none resize-none transition-all text-slate-800 shadow-inner ${errors[field.id] ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 'border-slate-200/60 focus:ring-blue-50 focus:border-[#1e88e5]'}`} 
                  rows={4}
                ></textarea>
              ) : field.type === 'file' || field.type === 'image' ? (
                <div className={`border-2 border-dashed transition-colors p-6 md:p-10 rounded-xl text-center bg-white/80 cursor-pointer group shadow-inner ${errors[field.id] ? 'border-red-300 hover:border-red-500 hover:bg-red-50/50' : 'border-[#1e88e5]/40 hover:border-[#1e88e5] hover:bg-blue-50/50'}`}>
                  <UploadCloud className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 transition-colors ${errors[field.id] ? 'text-red-400 group-hover:text-red-500' : 'text-[#1e88e5]/60 group-hover:text-[#1e88e5]'}`} />
                  <p className="text-sm md:text-base text-slate-700 font-medium">Haz clic o arrastra tu archivo aquí</p>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Soporta PNG, JPG o PDF (Max. 10MB)</p>
                </div>
              ) : field.type === 'select' ? (
                <select 
                  value={responses[field.id] || ''}
                  onChange={(e) => {
                    setResponses(prev => ({ ...prev, [field.id]: e.target.value }));
                    if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: false }));
                  }}
                  className={`w-full bg-white/80 border-2 rounded-xl p-3 md:p-4 text-sm md:text-base focus:ring-4 focus:outline-none transition-all text-slate-800 cursor-pointer appearance-none shadow-inner ${errors[field.id] ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 'border-slate-200/60 focus:ring-blue-50 focus:border-[#1e88e5]'}`}
                >
                  <option value="">Selecciona una opción...</option>
                  {field.options ? field.options.filter((o: string) => o.trim() !== '').map((opt: string, i: number) => (
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
                  {(field.options && field.options.length > 0 ? field.options : ['Opción A', 'Opción B', 'Opción C']).filter((o: string) => o.trim() !== '').map((opt: string, i: number) => {
                    const isChecked = field.allowMultiple === false 
                      ? responses[field.id] === opt 
                      : (responses[field.id] || []).includes(opt);
                      
                    return (
                      <label key={i} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors bg-white/60 ${errors[field.id] ? 'border-red-200 hover:border-red-400 hover:bg-red-50/50' : 'border-slate-200/60 hover:border-[#1e88e5] hover:bg-blue-50/50'}`}>
                        <input 
                          type={field.allowMultiple === false ? "radio" : "checkbox"} 
                          name={`field-${field.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (field.allowMultiple === false) {
                              setResponses(prev => ({ ...prev, [field.id]: opt }));
                            } else {
                              let curr = responses[field.id] || [];
                              if (e.target.checked) curr = [...curr, opt];
                              else curr = curr.filter((v: string) => v !== opt);
                              setResponses(prev => ({ ...prev, [field.id]: curr }));
                            }
                            if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: false }));
                          }}
                          className={`w-5 h-5 ${field.allowMultiple === false ? 'rounded-full' : 'rounded'} ${errors[field.id] ? 'border-red-300 text-red-500 focus:ring-red-500' : 'border-slate-300 text-[#1e88e5] focus:ring-[#1e88e5]'}`} 
                        />
                        <span className="text-sm md:text-base text-slate-800 font-medium">{opt}</span>
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
                  className={`w-full bg-white/80 border-2 rounded-xl p-3 md:p-4 text-sm md:text-base focus:ring-4 focus:outline-none transition-all text-slate-800 shadow-inner ${errors[field.id] ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 'border-slate-200/60 focus:ring-blue-50 focus:border-[#1e88e5]'}`} 
                />
              )}
              {errors[field.id] && <p className="text-red-500 text-xs md:text-sm font-bold mt-1 md:mt-2 animate-pulse">Este campo es obligatorio</p>}
            </div>
          );
        })}
        
        {currentFields.length === 0 && (
          <div className={`text-center py-10 md:py-12 rounded-[1.5rem] md:rounded-[2rem] ${bgImage ? 'bg-white/95 backdrop-blur-md border border-white/40' : 'bg-white shadow-sm'}`}>
            <p className="text-slate-600 text-base md:text-lg">Esta página no tiene preguntas.</p>
          </div>
        )}
        
        <div className={`p-5 md:p-8 flex flex-col md:flex-row gap-3 md:gap-4 rounded-[1.5rem] md:rounded-[2rem] ${bgImage ? 'bg-white/95 backdrop-blur-md border border-white/40 shadow-lg' : 'bg-white shadow-sm border border-slate-100'}`}>
          {currentPage > 0 && (
            <button 
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="w-full md:flex-1 bg-slate-50 border-2 border-slate-200/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl transition-all shadow-sm order-2 md:order-1"
            >
              Atrás
            </button>
          )}
          
          {currentPage < pages.length - 1 ? (
            <button 
              onClick={() => handleValidateAndProceed(false)}
              className="w-full md:flex-[2] bg-[#1e88e5] hover:bg-[#1565c0] text-white py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 order-1 md:order-2"
            >
              Siguiente
            </button>
          ) : (
            <button 
              onClick={() => handleValidateAndProceed(true)}
              disabled={isSubmitting || submitSuccess}
              className={`w-full md:flex-[2] relative overflow-hidden group py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 order-1 md:order-2 ${
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
        <div className={`p-6 md:p-8 w-full max-w-3xl text-center rounded-[1.5rem] md:rounded-[2rem] border mt-6 relative z-10 ${bgImage ? 'bg-black/40 backdrop-blur-md border-white/10 text-white/90 shadow-lg' : 'bg-slate-100/50 border-slate-200 text-slate-600 shadow-sm'}`}>
           <p className="text-xs md:text-sm font-semibold tracking-wide" dangerouslySetInnerHTML={{ __html: settings.footerText }}></p>
        </div>
      )}
    </div>
  </div>
);
}
