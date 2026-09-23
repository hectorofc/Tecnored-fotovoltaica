import { NextResponse } from 'next/server';

export async function POST(request) {
  const data = await request.json();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const mensaje =
    `🔔 Nueva cotización — Tecnored Solar\n\n` +
    `Cliente: ${data.nombre || '-'}\n` +
    `Teléfono: ${data.telefono || '-'}\n` +
    `Correo: ${data.correo || '-'}\n` +
    `Dirección: ${data.direccion || '-'}\n` +
    `Planta: ${data.kw ? data.kw + ' kW' : 'Por evaluar (proyecto grande)'}\n` +
    `Paneles: ${data.paneles || '-'}`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: mensaje }),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
