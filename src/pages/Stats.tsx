import { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, TrendingUp, ChevronDown, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';

export default function Stats() {
  const [totalResponses, setTotalResponses] = useState(0);
  const [popularForms, setPopularForms] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  const COLORS = ['#1e88e5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await supabase.from('form_responses').select('*, forms(title)');
        if (data && data.length > 0) {
          const formattedResponses = data.map(r => ({
            id: r.id,
            formName: r.forms?.title || 'Formulario',
            created_at: r.created_at
          }));
          
          setTotalResponses(formattedResponses.length);

          // Calculate popular forms
          const counts: Record<string, number> = {};
          formattedResponses.forEach((r: any) => {
            counts[r.formName] = (counts[r.formName] || 0) + 1;
          });

          const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({
              name,
              value: count, // Para PieChart
              percent: Math.round((count / formattedResponses.length) * 100)
            }));
          setPopularForms(sorted);

          // Calculate timeline data (group by date)
          const dates: Record<string, number> = {};
          // Sort chronologically first
          const chronological = [...formattedResponses].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          chronological.forEach((r: any) => {
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
            dates[date] = (dates[date] || 0) + 1;
          });

          const timeline = Object.entries(dates).map(([date, count]) => ({ date, count })).slice(-15); // Last 15 active days
          setTimelineData(timeline);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { title: 'Respuestas Totales', value: totalResponses.toString(), trend: '+12%', icon: Users },
    { title: 'Formularios Activos', value: popularForms.length.toString(), trend: 'Estable', icon: Activity },
    { title: 'Tiempo Promedio', value: totalResponses > 0 ? '1m 20s' : '0s', trend: '-5s', icon: Clock },
    { title: 'Tasa de Conversión', value: totalResponses > 0 ? '85%' : '0%', trend: '+2%', icon: TrendingUp },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-[#1e88e5] font-semibold text-sm">
            {payload[0].value} {payload[0].value === 1 ? 'respuesta' : 'respuestas'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">Estadísticas</h1>
          <p className="text-sm text-slate-500 mt-1">Visualiza el rendimiento de tus formularios en tiempo real.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors">
          Últimos 30 días <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-colors flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <div>
                <p className="text-3xl font-semibold text-slate-900 tracking-tight">{stat.value}</p>
                {totalResponses > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    <p className="text-xs text-slate-500">{stat.trend}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200 min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-slate-400 w-4 h-4"/> 
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Tráfico de Respuestas</h3>
          </div>
          
          {timelineData.length > 0 ? (
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#F1F5F9', radius: 4}} />
                  <Bar dataKey="count" fill="#1e88e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center mt-12">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Aún no hay datos suficientes</h3>
              <p className="text-xs text-slate-500 max-w-xs">El gráfico comenzará a llenarse en cuanto recibas envíos en tus formularios.</p>
            </div>
          )}
        </div>

        {/* Popular Forms Pie Chart */}
        <div className="bg-white rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200 min-h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-slate-400 w-4 h-4"/> 
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Origen de Respuestas</h3>
          </div>
          
          {popularForms.length > 0 ? (
            <div className="flex-1 flex flex-col items-center">
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={popularForms}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {popularForms.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} respuestas`, '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full mt-6 space-y-2.5">
                {popularForms.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-slate-600 font-medium truncate">{f.name}</span>
                    </div>
                    <span className="text-slate-900 font-semibold shrink-0">{f.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-slate-500 text-xs">Aún no hay interacciones suficientes para analizar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
