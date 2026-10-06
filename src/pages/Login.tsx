import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // TRUCO TEMPORAL PARA CREAR EL USUARIO SOLICITADO
    // Si el login falla, intentamos registrarlo (Solo para entorno de desarrollo)
    let { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError && authError.message.includes('Invalid login credentials') && email === 'dcoronado@ensing.lat') {
       const { error: signUpError } = await supabase.auth.signUp({ email, password });
       if (!signUpError) {
         // Reintentar login si se creó exitosamente
         const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
         authError = retryError;
       }
    }

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        setError('Tu cuenta fue creada antes de desactivar la confirmación. Ve a Supabase > Authentication > Users, borra este correo y vuelve a intentar.');
      } else {
        setError(authError.message);
      }
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop")' }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Glass Box */}
      <div className="relative z-10 w-full max-w-sm bg-black/40 backdrop-blur-sm p-10 rounded-lg shadow-2xl mt-12">
        
        {/* Overlapping Logo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-transparent p-2">
          <img src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1777329849/LOGO_RENOVACIO%CC%81N_MONTUFAREN%CC%83A_fegxxf.png" alt="Logo" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-white text-center text-2xl font-bold mt-10 mb-8">Iniciar Sesión</h2>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/80 text-white p-2 rounded text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="relative">
            <label className="block text-white text-sm font-semibold mb-1">Usuario (Correo Electrónico)</label>
            <input
              type="email"
              required
              placeholder="Ingresar correo"
              className="w-full bg-transparent border-b border-gray-400 text-white placeholder-gray-300 py-2 focus:outline-none focus:border-white transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <label className="block text-white text-sm font-semibold mb-1">Contraseña</label>
            <input
              type="password"
              required
              placeholder="Ingresar contraseña"
              className="w-full bg-transparent border-b border-gray-400 text-white placeholder-gray-300 py-2 focus:outline-none focus:border-white transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e88e5] hover:bg-[#1565c0] text-white font-bold py-2.5 rounded-full transition-colors mt-8"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <div className="text-left mt-4">
            <a href="#" className="text-white text-sm hover:underline">¿Olvidó su contraseña?</a>
          </div>
        </form>
      </div>
    </div>
  );
}
