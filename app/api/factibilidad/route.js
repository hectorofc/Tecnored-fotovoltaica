import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const data = await request.json();

  try {
    await sql`
      INSERT INTO factibilidad (
        nombre, telefono, comuna, quien_completa, nombre_vendedor,
        tipo_techo, orientacion_techo, m2_disponibles, tiene_sombra,
        consumo_mensual_kwh, monto_mensual_pago, tiene_acceso_red,
        cortes_frecuentes, quiere_respaldo_bateria
      ) VALUES (
        ${data.nombre},
        ${data.telefono},
        ${data.comuna},
        ${data.quien_completa},
        ${data.nombre_vendedor || null},
        ${data.tipo_techo},
        ${data.orientacion_techo},
        ${data.m2_disponibles},
        ${data.tiene_sombra === 'si'},
        ${data.consumo_mensual_kwh},
        ${data.monto_mensual_pago},
        ${data.tiene_acceso_red === 'si'},
        ${data.cortes_frecuentes === 'si'},
        ${data.quiere_respaldo_bateria === 'si'}
      )
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
