import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const data = await request.json();

  try {
    await sql`
      INSERT INTO factibilidad (
        direccion, tipo_techo, m2_disponibles,
        consumo_mensual_kwh, monto_mensual_pago, respaldo_baterias, tipo_sistema, tipo_instalacion,
        ideal_kw, plan_elegido_kw, sub_opcion_elegida, paneles_cantidad,
        quiere_cotizar, nombre_contacto, telefono_contacto, correo_contacto
      ) VALUES (
        ${data.direccion},
        ${data.tipo_techo},
        ${data.m2_disponibles || null},
        ${data.consumo_mensual_kwh || null},
        ${data.monto_mensual_pago || null},
        ${data.respaldo_baterias},
        ${data.tipo_sistema || null},
        ${data.tipo_instalacion},
        ${data.ideal_kw || null},
        ${data.plan_elegido_kw || null},
        ${data.sub_opcion_elegida || null},
        ${data.paneles_cantidad || null},
        ${data.quiere_cotizar || false},
        ${data.nombre_contacto || null},
        ${data.telefono_contacto || null},
        ${data.correo_contacto || null}
      )
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
