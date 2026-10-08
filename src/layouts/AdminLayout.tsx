import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, FileText, Inbox, BarChart, LogOut, Settings, Menu, ChevronLeft } from 'lucide-react';

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/login');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Formularios', path: '/forms', icon: FileText },
    { name: 'Respuestas', path: '/responses', icon: Inbox },
    { name: 'Estadísticas', path: '/stats', icon: BarChart },
    { name: 'Configuración', path: '/settings', icon: Settings },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative bg-white border-r border-slate-200 flex flex-col shadow-lg md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 h-full transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <div className={`p-6 flex items-center h-20 md:h-28 border-b border-slate-100 transition-all ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {isSidebarOpen && (
            <img 
              src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" 
              alt="Logo" 
              className="h-10 md:h-12 object-contain drop-shadow-sm animate-in fade-in zoom-in duration-300" 
            />
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0 hidden md:block"
            title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0 md:hidden"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`flex items-center px-3.5 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${isSidebarOpen ? (isActive ? 'translate-x-1' : 'hover:translate-x-1') : 'justify-center px-0'}`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSidebarOpen ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full py-2.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group ${
              isSidebarOpen ? 'px-3.5 justify-start' : 'justify-center px-0'
            }`}
            title={!isSidebarOpen ? "Cerrar Sesión" : undefined}
          >
            <LogOut className={`w-4 h-4 shrink-0 ${isSidebarOpen ? 'mr-3' : ''} group-hover:text-red-600`} />
            {isSidebarOpen && <span className="truncate">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative flex flex-col h-screen">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0 z-10 sticky top-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img 
            src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" 
            alt="Logo" 
            className="h-8 object-contain" 
          />
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none md:block hidden"></div>
        
        <div className="p-4 md:p-8 lg:p-10 relative z-10 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
