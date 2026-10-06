-- ============================================================
-- BASE DE DATOS PARA RENOVACIÓN MONTUFAREÑA
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLAS BASE Y ROLES
-- ==========================================

CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO public.roles (name, description) VALUES 
('ADMINISTRADOR', 'Acceso total al sistema'),
('EDITOR', 'Puede crear y editar formularios'),
('ANALISTA', 'Puede ver respuestas y estadísticas'),
('CONSULTA', 'Solo puede visualizar información autorizada');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ==========================================
-- 2. FORMULARIOS Y ESTRUCTURA
-- ==========================================

CREATE TABLE public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED')),
    cover_image TEXT,
    logo TEXT,
    welcome_title VARCHAR(255),
    welcome_description TEXT,
    thank_you_title VARCHAR(255),
    thank_you_message TEXT,
    theme JSONB DEFAULT '{"primary_color": "#1E3A8A", "bg_color": "#FFFFFF"}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.form_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES public.form_sections(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    placeholder TEXT,
    required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    options JSONB DEFAULT '[]'::jsonb, -- Para selects, radios, checkboxes
    validation JSONB DEFAULT '{}'::jsonb, -- min_length, max_length, etc.
    conditions JSONB DEFAULT '[]'::jsonb, -- Lógica condicional
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. RESPUESTAS Y ANALÍTICA
-- ==========================================

CREATE TABLE public.form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'COMPLETED' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ARCHIVED')),
    ip_address TEXT,
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.form_response_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID REFERENCES public.form_responses(id) ON DELETE CASCADE,
    field_id UUID REFERENCES public.form_fields(id) ON DELETE CASCADE,
    value JSONB, -- Puede ser texto, número, array, o metadata de archivo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.form_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. ETIQUETAS Y PLANTILLAS
-- ==========================================

CREATE TABLE public.form_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50) DEFAULT '#1E3A8A'
);

INSERT INTO public.form_tags (name) VALUES 
('DEPORTES'), ('CULTURA'), ('EDUCACIÓN'), ('SALUD'), 
('JUVENTUD'), ('ADULTOS MAYORES'), ('EMPRENDIMIENTO');

CREATE TABLE public.response_tags (
    response_id UUID REFERENCES public.form_responses(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.form_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (response_id, tag_id)
);

-- ==========================================
-- 5. AUDITORÍA
-- ==========================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. SEGURIDAD RLS (Row Level Security)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_response_answers ENABLE ROW LEVEL SECURITY;

-- Políticas de Profiles
CREATE POLICY "Perfiles públicos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuario edita su perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas de Formularios
CREATE POLICY "Cualquiera ve formularios publicados" ON public.forms FOR SELECT USING (status = 'PUBLISHED');
CREATE POLICY "Autenticados ven todo" ON public.forms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Autenticados insertan" ON public.forms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creador actualiza" ON public.forms FOR UPDATE USING (auth.uid() = created_by);

-- Políticas de Secciones y Campos (Similares a forms)
CREATE POLICY "Cualquiera ve secciones" ON public.form_sections FOR SELECT USING (true);
CREATE POLICY "Autenticados modifican secciones" ON public.form_sections FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Cualquiera ve campos" ON public.form_fields FOR SELECT USING (true);
CREATE POLICY "Autenticados modifican campos" ON public.form_fields FOR ALL USING (auth.role() = 'authenticated');

-- Políticas de Respuestas (Público puede insertar, solo admin/creador puede leer)
CREATE POLICY "Cualquiera puede insertar respuesta" ON public.form_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Autenticados ven respuestas" ON public.form_responses FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cualquiera inserta respuestas detalle" ON public.form_response_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Autenticados ven respuestas detalle" ON public.form_response_answers FOR SELECT USING (auth.role() = 'authenticated');

-- ==========================================
-- 7. TRIGGERS Y FUNCIONES
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
