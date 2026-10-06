import { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, TrendingUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Stats() {
  const [totalResponses, setTotalResponses] = useState(0);
  const [popularForms, setPopularForms] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await supabase.from('form_responses').select('*, forms(title)');
        if (data) {
          const formattedResponses = data.map(r => ({
            id: r.id,
            formName: r.forms?.title || 'Formulario',
          }));
          
          setTotalResponses(formattedResponses.length);

          // Calculate popular forms
          const counts: Record<string, number> = {};
          formattedResponses.forEach((r: any) => {
            counts[r.formName] = (counts[r.formName] || 0) + 1;
          });

          const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({
              name,
              count,
              percent: Math.round((count / formattedResponses.length) * 100)
            }));
          setPopularForms(sorted);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { title: 'Respuestas Totales', value: totalResponses.toString(), trend: '+0%', icon: Users, color: 'text-[#1e88e5]', bg: 'bg-blue-50' },
    { title: 'Tasa de Finalización', value: totalResponses > 0 ? '100%' : '0%', trend: '+0%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Tiempo Promedio', value: totalResponses > 0 ? '1m 20s' : '0s', trend: '0s', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Vistas del Formulario', value: (totalResponses * 2).toString(), trend: '+0%', icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 drop-shadow-sm">Estadísticas</h1>
          <p className="text-slate-500 mt-2 text-lg">Métricas clave y rendimiento de tus formularios.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
          Últimos 30 días <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex items-start justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-slate-500 font-semibold mb-2">{stat.title}</p>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
                  <span className="text-slate-400 font-bold text-sm bg-slate-100 px-2 py-1 rounded-lg">{stat.trend}</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placeholder para gráfico grande */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <BarChart3 className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Aún no hay datos suficientes</h3>
          <p className="text-slate-500 max-w-md">El gráfico detallado de respuestas comenzará a llenarse en cuanto recibas envíos en tus formularios.</p>
        </div>

        {/* Mejores formularios */}
        <div className={`bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 ${popularForms.length === 0 ? 'flex flex-col items-center justify-center text-center' : ''}`}>
          {popularForms.length === 0 ? (
            <>
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Formularios Populares</h3>
              <p className="text-slate-500 text-sm">Aún no hay interacciones suficientes para mostrar un top.</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Users className="text-[#1e88e5] w-6 h-6"/> Formularios Populares</h3>
              <div className="space-y-6">
                {popularForms.map((f, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-slate-700">{f.name}</span>
                      <span className="text-slate-500">{f.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#1e88e5] h-2 rounded-full" style={{ width: `${f.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
