import { useState, useEffect } from 'react';
import { Search, Download, Filter, MoreVertical, FileText, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Responses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormFilter, setSelectedFormFilter] = useState('');
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    async function fetchResponses() {
      try {
        const { data, error } = await supabase.from('form_responses').select('*, forms(title, settings)').order('created_at', { ascending: false });
        if (data) {
          const formatted = data.map(r => ({
            id: r.id,
            formId: r.form_id,
            formName: r.forms?.title || 'Formulario',
            formFields: r.forms?.fields || r.forms?.settings?.fields || [],
            user: r.user_name || 'Anónimo',
            email: r.user_email || 'No proporcionado',
            date: new Date(r.created_at).toISOString().split('T')[0],
            status: r.status,
            data: r.data
          }));
          setResponses(formatted);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchResponses();
  }, []);

  const [viewResponse, setViewResponse] = useState<any>(null);

  const handleDeleteResponse = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta respuesta? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase.from('form_responses').delete().eq('id', id);
        if (!error) {
          setResponses(prev => prev.filter(r => r.id !== id));
        } else {
          alert('Hubo un error al eliminar la respuesta.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter responses
  const filteredResponses = responses.filter(r => {
    const matchesSearch = r.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.formName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesForm = selectedFormFilter ? r.formName === selectedFormFilter : true;
    return matchesSearch && matchesForm;
  });

  const exportCSV = () => {
    if (filteredResponses.length === 0) return;
    
    // Load forms to get labels if needed
    const savedForms = localStorage.getItem('rm_forms_list');
    let formsList: any[] = [];
    if (savedForms) {
      try { formsList = JSON.parse(savedForms); } catch(e) {}
    }
    
    const idToLabelMap: Record<string, string> = {};
    formsList.forEach(form => {
      const fields = form.fields || (form.settings && form.settings.fields) || [];
      fields.forEach((f: any) => {
        idToLabelMap[f.id] = f.label;
      });
    });
    
    // Also use the ones loaded from Supabase per response
    filteredResponses.forEach(r => {
      if (r.formFields) {
        r.formFields.forEach((f: any) => {
          idToLabelMap[f.id] = f.label;
        });
      }
    });

    // Normalize data: transform all keys to labels (resolving UUIDs to labels if necessary)
    const normalizedResponses = filteredResponses.map(r => {
      const normalizedData: Record<string, any> = {};
      Object.entries(r.data || {}).forEach(([k, v]) => {
         const label = idToLabelMap[k] || k;
         normalizedData[label] = v;
      });
      return { ...r, normalizedData };
    });

    // Collect all unique labels
    const allLabels = new Set<string>();
    normalizedResponses.forEach(r => {
      Object.keys(r.normalizedData).forEach(label => allLabels.add(label));
    });

    const headerLabels = Array.from(allLabels);
    const header = ['ID', 'Formulario', 'Fecha', 'Remitente', 'Correo', ...headerLabels];
    
    // Create CSV content using standard comma separation
    let csvContent = header.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

    normalizedResponses.forEach(r => {
      const row = [
        r.id, 
        r.formName, 
        r.date, 
        r.user, 
        r.email,
        ...headerLabels.map(label => {
          const val = r.normalizedData[label];
          return Array.isArray(val) ? val.join(', ') : (val || '').toString();
        })
      ];
      csvContent += row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",") + "\n";
    });

    // Use Blob for reliable download across devices
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "respuestas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">Bandeja de Respuestas</h1>
          <p className="text-sm text-slate-500 mt-1">Visualiza y exporta la información recopilada de tus formularios.</p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm active:scale-95 border border-slate-700">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar por nombre, correo o formulario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-200 focus:border-slate-400 focus:ring-0 outline-none text-sm transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              value={selectedFormFilter}
              onChange={(e) => setSelectedFormFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-200 text-slate-600 text-sm font-medium focus:border-slate-400 outline-none transition-colors bg-white w-full sm:w-auto"
            >
              <option value="">Todos los formularios</option>
              {Array.from(new Set(responses.map(r => r.formName))).map((formName, i) => (
                <option key={i} value={formName as string}>{formName as string}</option>
              ))}
            </select>
            
            <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 text-slate-600 font-medium text-sm hover:border-slate-300 hover:bg-white transition-colors bg-white shadow-sm whitespace-nowrap">
              <Filter className="w-4 h-4" /> Filtros
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">ID</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Remitente</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Formulario</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Fecha</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Estado</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResponses.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">#{res.id.substring(0,8)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{res.user}</span>
                      <span className="text-xs text-slate-500">{res.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[200px]">{res.formName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{res.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-full w-fit shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <div className={`w-1.5 h-1.5 rounded-full ${res.status === 'Completado' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{res.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button onClick={() => setViewResponse(res)} className="px-3 py-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors font-medium text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        Ver detalle
                      </button>
                      <button onClick={() => handleDeleteResponse(res.id)} title="Eliminar respuesta" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredResponses.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-sm">
              No se encontraron respuestas que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>

      {/* View Response Modal */}
      {viewResponse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 line-clamp-1">{viewResponse.formName}</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
                  <span>{viewResponse.user}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="font-mono">{viewResponse.date}</span>
                </p>
              </div>
              <button 
                onClick={() => setViewResponse(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-md transition-colors border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/30 flex-1">
              <div className="space-y-4">
                {(() => {
                  let orderedFields: { label: string, answer: any }[] = [];
                  
                  if (viewResponse.formFields && viewResponse.formFields.length > 0) {
                    orderedFields = viewResponse.formFields
                      .filter((f: any) => f.type !== 'html' && f.type !== 'section')
                      .map((f: any) => {
                        let answer = viewResponse.data[f.label];
                        if (answer === undefined) answer = viewResponse.data[f.id];
                        return { label: f.label, answer, type: f.type };
                      })
                      .filter((f: any) => f.answer !== undefined && f.answer !== null);
                  } else {
                    orderedFields = Object.entries(viewResponse.data || {}).map(([key, value]) => ({ label: key, answer: value, type: 'text' }));
                  }

                  if (orderedFields.length === 0) {
                    return (
                      <div className="text-center text-slate-500 py-8 text-sm">
                        Esta respuesta no contiene datos.
                      </div>
                    );
                  }

                  return orderedFields.map((field, i) => {
                    const isFile = field.type === 'file' || field.type === 'image' || (typeof field.answer === 'string' && field.answer.startsWith('http'));
                    
                    return (
                      <div key={i} className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex flex-col gap-1.5">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{field.label}</h3>
                        {isFile ? (
                          <div className="mt-1">
                            <a href={field.answer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-md font-medium text-xs transition-colors shadow-sm">
                              <FileText className="w-3.5 h-3.5" />
                              Ver Archivo Adjunto
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-slate-900 break-words whitespace-pre-wrap">
                            {Array.isArray(field.answer) ? field.answer.join(', ') : field.answer || '-'}
                          </p>
                        )}
                      </div>
                    );
                  });
                })()}

                {Object.keys(viewResponse.data || {}).length === 0 && (
                  <div className="text-center text-slate-500 py-8 text-sm">
                    Esta respuesta no contiene datos.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
