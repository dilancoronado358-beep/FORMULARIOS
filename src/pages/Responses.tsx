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
    if (responses.length === 0) return;
    
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
    responses.forEach(r => {
      if (r.formFields) {
        r.formFields.forEach((f: any) => {
          idToLabelMap[f.id] = f.label;
        });
      }
    });

    // Normalize data: transform all keys to labels (resolving UUIDs to labels if necessary)
    const normalizedResponses = responses.map(r => {
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
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    // Use semicolon for Excel compatibility in Spanish locales
    csvContent += header.join(";") + "\n";

    normalizedResponses.forEach(r => {
      const row = [
        r.id, 
        r.formName, 
        r.date, 
        r.user, 
        r.email,
        ...headerLabels.map(label => {
          const val = r.normalizedData[label];
          const strVal = Array.isArray(val) ? val.join(', ') : (val || '').toString();
          return `"${strVal.replace(/"/g, '""')}"`;
        })
      ];
      csvContent += row.join(";") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "respuestas_completas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 drop-shadow-sm">Bandeja de Respuestas</h1>
          <p className="text-slate-500 mt-2 text-lg">Visualiza y exporta la información recopilada de tus formularios.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-[#1e88e5] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-1 hover:shadow-xl transition-all">
          <Download className="w-5 h-5" /> Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-96">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar por nombre, correo o formulario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1e88e5] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedFormFilter}
              onChange={(e) => setSelectedFormFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold focus:border-[#1e88e5] outline-none transition-all cursor-pointer bg-white"
            >
              <option value="">Todos los formularios</option>
              {Array.from(new Set(responses.map(r => r.formName))).map((formName, i) => (
                <option key={i} value={formName as string}>{formName as string}</option>
              ))}
            </select>
            
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all">
              <Filter className="w-5 h-5" /> Filtros avanzados
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider">
                <th className="p-6 border-b border-slate-100">ID</th>
                <th className="p-6 border-b border-slate-100">Remitente</th>
                <th className="p-6 border-b border-slate-100">Formulario</th>
                <th className="p-6 border-b border-slate-100">Fecha</th>
                <th className="p-6 border-b border-slate-100">Estado</th>
                <th className="p-6 border-b border-slate-100 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredResponses.map((res) => (
                <tr key={res.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-6 border-b border-slate-100 text-slate-500 font-medium">#{res.id.padStart(4, '0')}</td>
                  <td className="p-6 border-b border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{res.user}</span>
                      <span className="text-sm text-slate-500">{res.email}</span>
                    </div>
                  </td>
                  <td className="p-6 border-b border-slate-100 font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#1e88e5]" />
                      {res.formName}
                    </div>
                  </td>
                  <td className="p-6 border-b border-slate-100 text-slate-600 font-medium">{res.date}</td>
                  <td className="p-6 border-b border-slate-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      res.status === 'Completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="p-6 border-b border-slate-100 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button onClick={() => setViewResponse(res)} className="p-2 text-[#1e88e5] bg-blue-50 hover:bg-[#1e88e5] hover:text-white rounded-lg transition-colors font-bold text-sm px-4">
                        Ver detalle
                      </button>
                      <button onClick={() => handleDeleteResponse(res.id)} title="Eliminar respuesta" className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredResponses.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No se encontraron respuestas.
            </div>
          )}
        </div>
      </div>

      {/* View Response Modal */}
      {viewResponse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-up border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Respuesta: {viewResponse.formName}</h2>
                <p className="text-slate-500 mt-1 font-medium">De: {viewResponse.user} • {viewResponse.date}</p>
              </div>
              <button 
                onClick={() => setViewResponse(null)}
                className="p-3 bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors border border-slate-200 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-white flex-1">
              <div className="space-y-8">
                {(() => {
                  let orderedFields: { label: string, answer: any }[] = [];
                  
                  if (viewResponse.formFields && viewResponse.formFields.length > 0) {
                    // Obtener los campos en orden original, excluyendo html y section
                    orderedFields = viewResponse.formFields
                      .filter((f: any) => f.type !== 'html' && f.type !== 'section')
                      .map((f: any) => {
                        // Buscar la respuesta usando el label o el id
                        let answer = viewResponse.data[f.label];
                        if (answer === undefined) answer = viewResponse.data[f.id];
                        return { label: f.label, answer, type: f.type };
                      })
                      .filter((f: any) => f.answer !== undefined && f.answer !== null);
                  } else {
                    // Fallback si por alguna razón no tenemos formFields
                    orderedFields = Object.entries(viewResponse.data || {}).map(([key, value]) => ({ label: key, answer: value, type: 'text' }));
                  }

                  if (orderedFields.length === 0) {
                    return (
                      <div className="text-center text-slate-500 py-8">
                        Esta respuesta no contiene datos.
                      </div>
                    );
                  }

                  return orderedFields.map((field, i) => {
                    const isFile = field.type === 'file' || field.type === 'image' || (typeof field.answer === 'string' && field.answer.startsWith('http'));
                    
                    return (
                      <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{field.label}</h3>
                        {isFile ? (
                          <div className="mt-2">
                            <a href={field.answer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-100 text-[#1e88e5] hover:bg-[#1e88e5] hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                              <FileText className="w-4 h-4" />
                              Ver / Descargar Archivo
                            </a>
                          </div>
                        ) : (
                          <p className="text-lg font-medium text-slate-800 break-words whitespace-pre-wrap">
                            {Array.isArray(field.answer) ? field.answer.join(', ') : field.answer || '-'}
                          </p>
                        )}
                      </div>
                    );
                  });
                })()}

                {Object.keys(viewResponse.data || {}).length === 0 && (
                  <div className="text-center text-slate-500 py-8">
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
