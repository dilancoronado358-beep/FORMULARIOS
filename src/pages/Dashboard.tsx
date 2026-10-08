import { useState, useEffect } from 'react';
import { FileText, Inbox, Users, Activity, Plus, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalForms: 0,
    publishedForms: 0,
    totalResponses: 0,
    uniqueParticipants: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        let supabaseForms: any[] = [];
        let supabaseResponses: any[] = [];
        try {
          const { data: forms } = await supabase.from('forms').select('id, status');
          supabaseForms = forms || [];
          
          // Count total responses separately
          const { count: totalResp } = await supabase.from('form_responses').select('*', { count: 'exact', head: true });
          
          // Get recent activity
          const { data: responses } = await supabase.from('form_responses')
            .select('id, user_agent, ip_address, user_email, user_name, created_at, forms(title)')
            .order('created_at', { ascending: false })
            .limit(5);
            
          supabaseResponses = responses || [];
          
          setStats({
            totalForms: supabaseForms.length,
            publishedForms: supabaseForms.filter(f => f.status === 'PUBLISHED').length,
            totalResponses: totalResp || 0,
            uniqueParticipants: new Set(supabaseResponses.map(r => (r.user_email || '') + (r.user_name || '') + (r.ip_address || ''))).size
          });
          
          setRecentActivity(supabaseResponses);
        } catch(e) {}

      } catch (e) {
        console.error('Error fetching stats:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Formularios Totales', value: stats.totalForms, icon: FileText, trend: '+2 este mes' },
    { name: 'Publicados Activos', value: stats.publishedForms, icon: Zap, trend: 'En línea' },
    { name: 'Respuestas Recibidas', value: stats.totalResponses, icon: Inbox, trend: '+15% últ. 7 días' },
    { name: 'Ciudadanos Únicos', value: stats.uniqueParticipants, icon: Users, trend: 'Registrados' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Panel de Control
          </h1>
        </div>
        <button 
          onClick={() => navigate('/forms/new/builder')}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm active:scale-95 border border-slate-700"
        >
          <Plus className="w-4 h-4" />
          Crear Formulario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-5 rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-colors group flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <div>
                <p className="text-3xl font-semibold text-slate-900 tracking-tight">{stat.value}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${stat.name === 'Publicados Activos' && stat.value > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <p className="text-xs text-slate-500">{stat.trend}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Registro de Actividad</h2>
          <button onClick={() => navigate('/forms')} className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></button>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentActivity.map((activity, i) => (
              <div key={activity.id || i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Nueva respuesta en <span className="text-[#1e88e5]">{activity.forms?.title || 'Formulario'}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {new Date(activity.created_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })} 
                      {activity.user_name ? ` • Por ${activity.user_name}` : ' • Anónimo'}
                    </p>
                  </div>
                </div>
                <button onClick={() => navigate('/responses')} className="text-xs font-bold text-slate-600 border border-slate-200 px-3 py-1.5 rounded bg-white hover:bg-slate-50 shadow-sm transition-all">
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/30">
            <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">El sistema está en espera</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              La telemetría comenzará a registrar datos en el momento que se despliegue y comparta un formulario activo.
            </p>
            <button 
              onClick={() => navigate('/forms/new/builder')}
              className="text-sm font-medium text-slate-900 border border-slate-200 px-4 py-2 rounded-md bg-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              Inicializar Instancia de Formulario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
