'use client';

import { useState } from 'react';

const initialState = {
  nombre: '',
  telefono: '',
  comuna: '',
  quien_completa: 'cliente',
  nombre_vendedor: '',
  tipo_techo: 'teja',
  orientacion_techo: 'norte',
  m2_disponibles: '',
  tiene_sombra: 'no',
  consumo_mensual_kwh: '',
  monto_mensual_pago: '',
  tiene_acceso_red: 'si',
  cortes_frecuentes: 'no',
  quiere_respaldo_bateria: 'no',
};

export default function Home() {
  const [form, setForm] = useState(initialState);
  const [estado, setEstado] = useState('idle');

  function actualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setEstado('enviando');
    try {
      const respuesta = await fetch('/api/factibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!respuesta.ok) throw new Error('Error al guardar');
      setEstado('ok');
      setForm(initialState);
    } catch (err) {
      setEstado('error');
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
      <div style={{ backgroundColor: '#2C2C2C', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h1 style={{ color: '#FFC72C', margin: 0, fontSize: '22px' }}>Tecnored Solar</h1>
        <p style={{ color: '#fff', margin: '4px 0 0 0' }}>Cuestionario de factibilidad fotovoltaica</p>
      </div>

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <Campo label="Nombre">
          <input required value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} style={estilos.input} />
        </Campo>

        <Campo label="Teléfono">
          <input required value={form.telefono} onChange={(e) => actualizar('telefono', e.target.value)} style={estilos.input} />
        </Campo>

        <Campo label="Comuna / dirección">
          <input required value={form.comuna} onChange={(e) => actualizar('comuna', e.target.value)} style={estilos.input} />
        </Campo>

        <Campo label="¿Quién completa este formulario?">
          <select value={form.quien_completa} onChange={(e) => actualizar('quien_completa', e.target.value)} style={estilos.input}>
            <option value="cliente">Cliente</option>
            <option value="vendedor">Vendedor</option>
          </select>
        </Campo>

        {form.quien_completa === 'vendedor' && (
          <Campo label="Nombre del vendedor">
            <input required value={form.nombre_vendedor} onChange={(e) => actualizar('nombre_vendedor', e.target.value)} style={estilos.input} />
          </Campo>
        )}

        <Campo label="Tipo de techo">
          <select value={form.tipo_techo} onChange={(e) => actualizar('tipo_techo', e.target.value)} style={estilos.input}>
            <option value="teja">Teja</option>
            <option value="zinc">Zinc / metálico</option>
            <option value="losa">Losa</option>
            <option value="terreno">Terreno / piso</option>
          </select>
        </Campo>

        <Campo label="Orientación del techo">
          <select value={form.orientacion_techo} onChange={(e) => actualizar('orientacion_techo', e.target.value)} style={estilos.input}>
            <option value="norte">Norte</option>
            <option value="sur">Sur</option>
            <option value="este">Este</option>
            <option value="oeste">Oeste</option>
          </select>
        </Campo>

        <Campo label="m2 disponibles para paneles">
          <input required type="number" value={form.m2_disponibles} onChange={(e) => actualizar('m2_disponibles', e.target.value)} style={estilos.input} />
        </Campo>

        <Campo label="¿Hay sombra sobre el techo?">
          <select value={form.tiene_sombra} onChange={(e) => actualizar('tiene_sombra', e.target.value)} style={estilos.input}>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </Campo>

        <Campo label="Consumo mensual promedio (kWh)">
          <input required type="number" value={form.consumo_mensual_kwh} onChange={(e) => actualizar('consumo_mensual_kwh', e.target.value)} style={estilos.input} />
        </Campo>

        <Campo label="Monto mensual que paga ($)">
          <input required type="number" value={form.monto_mensual_pago} onChange={(e) => actualizar('monto_mensual_pago', e.target.value)} style={estilos.input} />
        </Campo>

        <Campo label="¿Tiene acceso a red eléctrica?">
          <select value={form.tiene_acceso_red} onChange={(e) => actualizar('tiene_acceso_red', e.target.value)}
