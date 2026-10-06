import { useState, useEffect } from 'react';
import { FileText, Inbox, Users, Activity, Plus } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        let supabaseForms: any[] = [];
        let supabaseResponses: any[] = [];
        try {
          const { data: forms } = await supabase.from('forms').select('id, status');
          supabaseForms = forms || [];
          const { data: responses } = await supabase.from('form_responses').select('id, user_agent, ip_address, user_email, user_name');
          supabaseResponses = responses || [];
        } catch(e) {}

        let localForms: any[] = [];
        let localResponses: any[] = [];
        try { localForms = JSON.parse(localStorage.getItem('rm_forms_list') || '[]'); } catch(e) {}
        try { localResponses = JSON.parse(localStorage.getItem('rm_responses_list') || '[]'); } catch(e) {}

        const totalForms = new Set([...supabaseForms.map(f => f.id), ...localForms.map(f => f.id)]);
        const publishedForms = supabaseForms.filter(f => f.status === 'PUBLISHED').length + localForms.filter(f => f.status === 'PUBLISHED' || !f.status).length;
        
        // Count unique participants by IP + User Agent for Supabase, Name + Email for Local
        const uniqueUsers = new Set([
          ...supabaseResponses.map(r => (r.user_email || '') + (r.user_name || '') + (r.ip_address || '')),
          ...localResponses.map(r => (r.user || '') + (r.email || ''))
        ]);

        setStats({
          totalForms: totalForms.size,
          publishedForms: publishedForms,
          totalResponses: supabaseResponses.length + localResponses.length,
          uniqueParticipants: uniqueUsers.size
        });
      } catch (e) {
        console.error('Error fetching stats:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Formularios Totales', value: stats.totalForms, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Publicados Activos', value: stats.publishedForms, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Respuestas Recibidas', value: stats.totalResponses, icon: Inbox, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Ciudadanos Participantes', value: stats.uniqueParticipants, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 mt-1">Resumen general de participación ciudadana.</p>
        </div>
        <button 
          onClick={() => navigate('/forms/new/builder')}
          className="inline-flex items-center gap-2 bg-[#1e88e5] hover:bg-[#1565c0] text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Crear Nuevo Formulario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-32 h-32" />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.name}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-900">Actividad Reciente</h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Sin actividad aún</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Aún no hay formularios creados ni respuestas registradas en el sistema.
          </p>
          <button 
            onClick={() => navigate('/forms/new/builder')}
            className="text-[#1e88e5] font-semibold hover:underline"
          >
            Comenzar creando el primer formulario &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
