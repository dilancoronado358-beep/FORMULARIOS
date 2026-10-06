import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLayout from './layouts/AdminLayout';
import FormsList from './pages/FormsList';
import FormBuilder from './pages/FormBuilder';
import PublicForm from './pages/PublicForm';
import Responses from './pages/Responses';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas administrativas con Layout */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forms" element={<FormsList />} />
          <Route path="/responses" element={<Responses />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Builder sin layout general para ocupar pantalla completa */}
        <Route path="/forms/new/builder" element={<FormBuilder />} />
        <Route path="/forms/edit/:id" element={<FormBuilder />} />

        {/* Ruta pública para llenar formularios */}
        <Route path="/form/:slug" element={<PublicForm />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
