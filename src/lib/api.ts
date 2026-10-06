import { supabase } from './supabase';

export async function saveForm(form: any) {
  // 1. Insert/Update form
  const { data: formData, error: formError } = await supabase
    .from('forms')
    .upsert({
      id: form.id || undefined,
      title: form.title,
      slug: form.slug,
      description: form.description,
      status: form.status || 'DRAFT',
      settings: {
        fields: form.fields // Temporalmente guardamos la definición entera aquí también para facil renderizado
      }
    })
    .select()
    .single();

  if (formError) throw formError;
  const formId = formData.id;

  // Ideally, we'd also sync form_sections and form_fields here, but since the frontend expects `form.fields` as an array
  // we are saving it in the settings JSONB for quick retrieval.
  return formData;
}

export async function getForms() {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Mapeamos para que coincida con lo que el frontend espera
  return data.map(d => ({
    ...d,
    fields: d.settings?.fields || [],
    date: new Date(d.created_at).toISOString().split('T')[0],
    responses: 0 // Fetch separately or with a view
  }));
}

export async function getFormBySlug(slug: string) {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return {
    ...data,
    fields: data.settings?.fields || []
  };
}

export async function submitResponse(formId: string, answers: any, user: string, email: string) {
  // 1. Crear el form_response
  const { data: responseData, error: responseError } = await supabase
    .from('form_responses')
    .insert({
      form_id: formId,
      status: 'COMPLETED'
    })
    .select()
    .single();

  if (responseError) throw responseError;

  // 2. Guardar las respuestas en metadata por simplicidad en esta iteración
  // En vez de insertar a form_response_answers uno por uno (lo que requiere field_ids válidos),
  // como guardamos fields en settings, guardaremos las answers crudas como metadata.
  // Pero el schema dice que form_responses no tiene campo JSONB.
  // Vamos a alterar `form_responses` levemente si es necesario, pero el schema no lo tiene.
  // Alternativa: insert en `form_response_answers`.

  // Ya que los UUIDs de field_id pueden no estar bien alineados si guardamos el form como JSON en settings,
  // Para que el frontend siga funcionando perfecto de forma inmediata con Supabase, vamos a crear
  // una tabla rápida o usamos la tabla existente de la mejor forma.
}
