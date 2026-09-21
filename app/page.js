'use client';
 
import { useState } from 'react';
 
const HSP = 4.5;
const PERD = 0.8;
const PANEL_W = 580;
const TIERS = [3, 5, 8];
const RATIOS = { lowcost: 0.85, equilibrio: 1.05, retorno: 1.2 };
 
const ANCHO_PANEL = 1.134, ORILLA = 0.15;
const LARGOS_RIEL = [5.2, 4.2, 3.4, 2.1];
const SKU_RIEL = { 5.2: '4703156', 4.2: '4703063', 3.4: '4703062', 2.1: '4703061' };
const SKU_UNION_RIEL = '4703064';
const SKU_UNION_PANELES = '4703220';
const SKU_UNION_ULTIMO = '4703219';
const SKU_PLETINA = '7406584';
const SKU_TIERRA = '4703070';
const SKU_PANEL = '4707132';
const INVERSORES = {
  3: { sku: '4701022', nombre: 'Inversor Ongrid Huawei Monofásico 3kW' },
  5: { sku: '4701023', nombre: 'Inversor Ongrid Huawei Monofásico 5kW' },
  8: { sku: '4701024', nombre: 'Inversor Hibrido Huawei Monofásico 8kW' },
  6.2: { sku: null, nombre: 'Inversor OffGrid 6,2kW' },
};
 
function sujecionInfo(techo, instalacion) {
  if (techo === 'metalica_zinc' && instalacion === 'inclinada') {
    return { tipo: 'doble', skuA: '4703071', nombreA: 'Base ajustable tipo L', skuB: '4703072', nombreB: 'Soporte ajustable 15-30°' };
  }
  if (techo === 'metalica_zinc') return { tipo: 'simple', sku: '4703068', nombre: 'Conector tipo L a techo' };
  if (techo === 'teja_colonia_hormigon') return { tipo: 'simple', sku: '4703067', nombre: 'Conector a costanera' };
  if (techo === 'teja_asfaltica') return { tipo: 'pendiente', nombre: 'Sujeción para teja asfáltica (SKU por definir)' };
  return { tipo: 'pendiente', nombre: 'Sujeción para instalación en piso (por definir)' };
}
 
function repartirPaneles(paneles, strings) {
  const base = Math.floor(paneles / strings), resto = paneles % strings;
  return Array.from({ length: strings }, (_, i) => base + (i < resto ? 1 : 0)).filter((n) => n > 0);
}
 
function combinarRiel(metros) {
  let mejor = null;
  const buscar = (restante, idx, actual, piezas) => {
    if (restante <= 0.001) {
      const sobrante = -restante;
      if (!mejor || piezas < mejor.piezas || (piezas === mejor.piezas && sobrante < mejor.sobrante)) {
        mejor = { combo: { ...actual }, piezas, sobrante };
      }
      return;
    }
    if (idx >= LARGOS_RIEL.length || piezas > 12) return;
    const largo = LARGOS_RIEL[idx];
    const maxUso = Math.ceil(restante / largo);
    for (let k = maxUso; k >= 0; k--) {
      if (k > 0) actual[largo] = (actual[largo] || 0) + k;
      buscar(restante - k * largo, idx + 1, actual, piezas + k);
      if (k > 0) { actual[largo] -= k; if (actual[largo] === 0) delete actual[largo]; }
    }
  };
  buscar(metros, 0, {}, 0);
  return mejor;
}
 
function calcularEstructura(totalPaneles, strings) {
  const reparto = repartirPaneles(totalPaneles, strings);
  let mt_riel_total = 0, sujecion = 0, union_paneles = 0, union_ultimo = 0, pletina = 0, tierra = 0, uniones_riel = 0;
  const rieles = {};
  const detallePorString = [];
  reparto.forEach((n) => {
    const largoTramo = ANCHO_PANEL * n + ORILLA * 2;
    mt_riel_total += largoTramo * 2;
    const c = combinarRiel(largoTramo);
    Object.entries(c.combo).forEach(([largo, cant]) => { rieles[largo] = (rieles[largo] || 0) + cant * 2; });
    uniones_riel += Math.max(0, c.piezas - 1) * 2;
    detallePorString.push({ paneles: n, largoTramo: +largoTramo.toFixed(2), combo: c.combo, sobrante: +c.sobrante.toFixed(2) });
    sujecion += n * 2;
    union_paneles += (n - 1) * 2;
    union_ultimo += 4;
    pletina += n - 1;
    tierra += 1;
  });
  return { reparto, mt_riel_total: +mt_riel_total.toFixed(2), rieles, uniones_riel, sujecion, union_paneles, union_ultimo, pletina, tierra, detallePorString };
}
 
function calcIdealKW(consumoMensual) {
  const diario = consumoMensual / 30;
  return diario / HSP / PERD;
}
 
function coberturaPct(tierKW, consumoMensual) {
  const generadaMensual = tierKW * HSP * PERD * 30;
  return Math.round((generadaMensual / consumoMensual) * 100);
}
 
function getOpciones(idealKW) {
  if (idealKW > 8) return { tipo: 'contactar' };
  if (idealKW < 2.5) return { tipo: 'unica', ideal: 3 };
  let idx = TIERS.findIndex((t) => t >= idealKW);
  if (idx === -1) idx = TIERS.length - 1;
  const ideal = TIERS[idx];
  const chica = idx > 0 ? TIERS[idx - 1] : null;
  const grande = idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
  return { tipo: 'multiple', chica, ideal, grande };
}
 
function panelesPara(tierKW, key) {
  const equilibrio = Math.round((tierKW * 1000 * RATIOS.equilibrio) / PANEL_W);
  if (key === 'lowcost') return equilibrio - 2;
  if (key === 'retorno') return equilibrio + 2;
  return equilibrio;
}
 
export default function Home() {
  const [screen, setScreen] = useState(0);
  const [form, setForm] = useState({
    direccion: '', techo: '', m2: '',
    consumo: '', pago: '', sistema: 'ongrid', instalacion: 'coplanar',
  });
  const [error1, setError1] = useState(false);
  const [error2, setError2] = useState(false);
  const [idealKW, setIdealKW] = useState(0);
  const [opciones, setOpciones] = useState(null);
  const [planElegido, setPlanElegido] = useState(null);
  const [subElegida, setSubElegida] = useState(null);
  const [stringsConocido, setStringsConocido] = useState('no');
  const [stringsCantidad, setStringsCantidad] = useState(2);
  const [contacto, setContacto] = useState({ nombre: '', telefono: '', correo: '' });
  const [descargado, setDescargado] = useState(false);
  const [cotizado, setCotizado] = useState(false);
  const [enviando, setEnviando] = useState(false);
 
  function upd(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }
 
  function continuarPaso1() {
    if (!form.techo) { setError1(true); return; }
    setError1(false);
    setScreen(1);
  }
 
  function avanzarAPropuestas() {
    const consumoNum = parseFloat(form.consumo);
    const pagoNum = parseFloat(form.pago);
    if (!form.consumo || consumoNum <= 0 || !form.pago || pagoNum <= 0) { setError2(true); return; }
    setError2(false);
    const ideal = calcIdealKW(consumoNum);
    const ops = form.sistema === 'offgrid' ? { tipo: 'unica', ideal: 6.2 } : getOpciones(ideal);
    setIdealKW(ideal);
    setOpciones(ops);
    setScreen(ops.tipo === 'contactar' ? 'contactarGrande' : 2);
  }
 
  async function guardar(payloadExtra) {
    setEnviando(true);
    const est = planElegido && subElegida ? calcularEstructura(panelesPara(planElegido, subElegida), stringsCantidad) : null;
    try {
      await fetch('/api/factibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direccion: form.direccion,
          tipo_techo: form.techo,
          m2_disponibles: form.m2 || null,
          consumo_mensual_kwh: form.consumo,
          monto_mensual_pago: form.pago,
          tipo_sistema: form.sistema,
          respaldo_baterias: form.sistema !== 'ongrid',
          tipo_instalacion: form.instalacion,
          ideal_kw: idealKW || null,
          plan_elegido_kw: planElegido,
          sub_opcion_elegida: subElegida,
          paneles_cantidad: planElegido && subElegida ? panelesPara(planElegido, subElegida) : null,
          strings_cantidad: est ? stringsCantidad : null,
          nombre_contacto: contacto.nombre,
          telefono_contacto: contacto.telefono,
          correo_contacto: contacto.correo,
          quiere_cotizar: false,
          ...payloadExtra,
        }),
      });
    } catch (e) {
      console.error(e);
    }
    setEnviando(false);
  }
 
  async function onDescargar() { await guardar({}); setDescargado(true); }
  async function onCotizar() { await guardar({ quiere_cotizar: true }); setCotizado(true); }
  async function onSolicitarContactoGrande() { await guardar({ quiere_cotizar: true }); setCotizado(true); }
 
  const stepIndex = typeof screen === 'number' ? Math.min(screen, 4) : 4;
 
  return (
    <div className="app">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
 
      <header className="top">
        <div className="brandrow">
          <div className="sunmark"></div>
          <div className="brand">Tecnored <span>Solar</span></div>
        </div>
        <div className="tag">Encuentra la planta fotovoltaica ideal para tu casa</div>
      </header>
 
      <div className="stepper">
        {[0, 1, 2, 3, 4].map((i) => (<div key={i} className={`step ${i <= stepIndex ? 'done' : ''}`}></div>))}
      </div>
      <div className="steplabels">
        <span>General</span><span>Técnico</span><span>Tamaño</span><span>Configuración</span><span>Resultado</span>
      </div>
 
      <main>
        {screen === 0 && (
          <>
            <div className="eyebrow">Paso 1 de 4</div>
            <h1 className="title">Cuéntanos sobre tu <em>techo y ubicación</em></h1>
            <p className="lead">Con esto vemos si tu casa es apta para paneles solares y cuánto espacio tienes disponible.</p>
 
            <div className="field">
              <label>Dirección</label>
              <input value={form.direccion} onChange={(e) => upd('direccion', e.target.value)} placeholder="Calle, número, comuna" />
            </div>
            <div className="row2">
              <div className="field">
                <label>Tipo de techo</label>
                <select value={form.techo} onChange={(e) => upd('techo', e.target.value)}>
                  <option value="" disabled>Escoja el tipo de techo</option>
                  <option value="metalica_zinc">Metálica / Zinc</option>
                  <option value="teja_asfaltica">Teja Asfáltica</option>
                  <option value="teja_colonia_hormigon">Teja colonia / Hormigón</option>
                  <option value="piso">Instalar en piso</option>
                </select>
              </div>
              <div className="field">
                <label>m² disponibles</label>
                <input type="number" value={form.m2} onChange={(e) => upd('m2', e.target.value)} placeholder="Ej: 30" />
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={continuarPaso1}>Continuar</button>
            </div>
            {error1 && <div style={{ color: '#C94E1E', fontSize: '13.5px', marginTop: '10px' }}>Escoge el tipo de techo para continuar.</div>}
          </>
        )}
 
        {screen === 1 && (
          <>
            <div className="eyebrow">Paso 2 de 4</div>
            <h1 className="title">Ahora, tu <em>consumo eléctrico</em></h1>
            <p className="lead">Esto define el tamaño de planta que realmente necesitas — ni de más, ni de menos.</p>
 
            <div className="row2">
              <div className="field">
                <label>Consumo mensual promedio (kWh)</label>
                <input type="number" value={form.consumo} onChange={(e) => upd('consumo', e.target.value)} placeholder="Ej: 350" />
              </div>
              <div className="field">
                <label>Monto mensual que pagas ($)</label>
                <input type="number" value={form.pago} onChange={(e) => upd('pago', e.target.value)} placeholder="Ej: 85000" />
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label>¿Almacenamiento de energía?</label>
                <select value={form.sistema} onChange={(e) => upd('sistema', e.target.value)}>
                  <option value="ongrid">Sin almacenamiento (OnGrid)</option>
                  <option value="hibrido">Con almacenamiento (Híbrido)</option>
                  <option value="offgrid">Solo con baterías, sin red (OffGrid)</option>
                </select>
              </div>
              {form.techo === 'metalica_zinc' && (
                <div className="field">
                  <label>Ángulo variable</label>
                  <select value={form.instalacion} onChange={(e) => upd('instalacion', e.target.value)}>
                    <option value="coplanar">Coplanar (sobre el techo)</option>
                    <option value="inclinada">Con ángulo variable (estructura elevada)</option>
                  </select>
                </div>
              )}
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setScreen(0)}>Volver</button>
              <button className="btn btn-primary" onClick={avanzarAPropuestas}>Ver propuestas</button>
            </div>
            {error2 && <div style={{ color: '#C94E1E', fontSize: '13.5px', marginTop: '10px' }}>Completa el consumo y el monto mensual para continuar.</div>}
          </>
        )}
 
        {screen === 2 && opciones && (
          <>
            <div className="eyebrow">Paso 3 de 4</div>
            <h1 className="title">Estas son tus <em>propuestas de tamaño</em></h1>
            <p className="lead">Calculado a partir de tu consumo de {form.consumo || 0} kWh/mes. Elige la que más te acomode.</p>
 
            <div className={opciones.tipo === 'unica' ? 'options' : 'options-grid'}>
              {opciones.tipo === 'unica' && (
                <OptCard kw={opciones.ideal}
                  tag={form.sistema === 'offgrid' ? 'Kit OffGrid' : 'Planta recomendada'}
                  desc={form.sistema === 'offgrid' ? 'Sistema autónomo con baterías, sin conexión a la red eléctrica.' : 'Tu consumo es acotado — este es el tamaño más eficiente en costo para tu caso.'}
                  cov={coberturaPct(opciones.ideal, form.consumo)}
                  onClick={() => { setPlanElegido(opciones.ideal); setScreen(3); }} />
              )}
              {opciones.tipo === 'multiple' && (
                <>
                  {opciones.chica && <OptCard kw={opciones.chica} tag="Más económica"
                    desc="Menor inversión inicial. No deja tu cuenta en $0, pero reduce el gasto de forma importante."
                    cov={coberturaPct(opciones.chica, form.consumo)}
                    onClick={() => { setPlanElegido(opciones.chica); setScreen(3); }} />}
                  <OptCard kw={opciones.ideal} tag="Ideal"
                    desc="Pensada para que tu cuenta de luz tienda a $0 según tu consumo actual."
                    cov={coberturaPct(opciones.ideal, form.consumo)}
                    onClick={() => { setPlanElegido(opciones.ideal); setScreen(3); }} />
                  {opciones.grande && <OptCard kw={opciones.grande} tag="Pensando en el futuro"
                    desc="Un poco más grande, por si sumas consumo más adelante (aire acondicionado, más equipos, etc.)."
                    cov={coberturaPct(opciones.grande, form.consumo)}
                    onClick={() => { setPlanElegido(opciones.grande); setScreen(3); }} />}
                </>
              )}
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setScreen(1)}>Volver</button>
            </div>
          </>
        )}
 
        {screen === 3 && planElegido && (
          <>
            <div className="eyebrow">Paso 4 de 4</div>
            <h1 className="title">Elige tu <em>configuración</em></h1>
            <p className="lead">Con el inversor de {planElegido} kW, así queda la cantidad de paneles según la estrategia que prefieras.</p>
 
            <div className="options">
              {[
                { key: 'lowcost', name: 'Low cost', desc: 'Menos paneles que el inversor puede aprovechar al máximo — baja el precio de materiales.' },
                { key: 'equilibrio', name: 'El equilibrio', desc: 'Cantidad de paneles acorde a la potencia del inversor. La configuración más común.' },
                { key: 'retorno', name: 'Mejor retorno', desc: 'Más paneles que en el equilibrio: generas más energía y recuperas la inversión más rápido.' },
              ].map((d) => {
                const paneles = panelesPara(planElegido, d.key);
                const potencia = ((paneles * PANEL_W) / 1000).toFixed(2);
                return (
                  <div key={d.key} className="opt" onClick={() => { setSubElegida(d.key); setScreen(4); }}>
                    <div className="opt-top">
                      <div className="opt-name">{d.name}</div>
                      <div className="opt-kw">{paneles}<small>paneles</small></div>
                    </div>
                    <div className="opt-desc">{d.desc}</div>
                    <div className="badge">{potencia} kW en paneles · inversor de {planElegido} kW</div>
                  </div>
                );
              })}
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setScreen(2)}>Volver</button>
            </div>
          </>
        )}
 
        {screen === 4 && (
          <>
            <div className="eyebrow">Antes del resultado final</div>
            <h1 className="title">¿Sabes cuántos <em>strings</em> vas a usar?</h1>
            <p className="lead">Un string es cada grupo de paneles conectados en serie a una misma entrada del inversor. Esto nos permite calcular bien la cantidad de riel y conectores.</p>
 
            <StringDiagram />
 
            <div className="field">
              <label>¿Lo sabes?</label>
              <select value={stringsConocido} onChange={(e) => setStringsConocido(e.target.value)}>
                <option value="no">No lo sé — usar 2 strings (recomendado)</option>
                <option value="si">Sí, lo sé</option>
              </select>
            </div>
            {stringsConocido === 'si' && (
              <div className="field">
                <label>Cantidad de strings</label>
                <input type="number" min="1" value={stringsCantidad} onChange={(e) => setStringsCantidad(parseInt(e.target.value) || 1)} />
              </div>
            )}
 
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setScreen(3)}>Volver</button>
              <button className="btn btn-primary" onClick={() => { if (stringsConocido === 'no') setStringsCantidad(2); setScreen(5); }}>Ver listado final</button>
            </div>
          </>
        )}
 
        {screen === 5 && planElegido && subElegida && (
          <Resultado
            kw={planElegido} subElegida={subElegida} form={form} idealKW={idealKW}
            stringsCantidad={stringsCantidad} contacto={contacto} setContacto={setContacto}
            descargado={descargado} cotizado={cotizado} enviando={enviando}
            onDescargar={onDescargar} onCotizar={onCotizar} onVolver={() => setScreen(4)}
          />
        )}
 
        {screen === 'contactarGrande' && (
          <>
            <div className="eyebrow">Proyecto de mayor escala</div>
            <h1 className="title">Este proyecto necesita una <em>evaluación personalizada</em></h1>
            <p className="lead">Tu consumo ({form.consumo} kWh/mes) supera lo que cubren nuestras plantas estándar. Un ejecutivo Tecnored va a revisar tu caso y contactarte con una propuesta a medida.</p>
 
            <div className="field"><label>Nombre</label><input value={contacto.nombre} onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })} placeholder="Tu nombre" /></div>
            <div className="row2">
              <div className="field"><label>Teléfono</label><input value={contacto.telefono} onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })} placeholder="+56 9 ..." /></div>
              <div className="field"><label>Correo</label><input type="email" value={contacto.correo} onChange={(e) => setContacto({ ...contacto, correo: e.target.value })} placeholder="tu@correo.cl" /></div>
            </div>
            {!cotizado && <button className="btn btn-primary" disabled={enviando} onClick={onSolicitarContactoGrande}>{enviando ? 'Enviando...' : 'Solicitar contacto'}</button>}
            {cotizado && <div className="success">Gracias — un ejecutivo te va a contactar a la brevedad.</div>}
 
            <div className="actions" style={{ marginTop: '18px' }}>
              <button className="btn btn-ghost" onClick={() => setScreen(1)}>Volver</button>
            </div>
          </>
        )}
      </main>
 
      <footer className="mock-tag">Tecnored Solar</footer>
    </div>
  );
}
 
function OptCard({ kw, tag, desc, cov, onClick }) {
  const covClass = cov >= 95 ? 'cov-high' : cov >= 60 ? 'cov-mid' : '';
  return (
    <div className="opt" onClick={onClick}>
      <div className="opt-top">
        <div className="opt-name">{tag}</div>
        <div className="opt-kw">{kw}<small>kW</small></div>
      </div>
      <div className="opt-desc">{desc}</div>
      <div className={`badge ${covClass}`}>Cubre ~{cov}% de tu consumo actual</div>
    </div>
  );
}
 
function StringDiagram() {
  const rows = [0, 1];
  return (
    <svg viewBox="0 0 520 210" style={{ width: '100%', maxWidth: '480px', display: 'block', margin: '0 0 22px' }}>
      {rows.map((row) => {
        const y = 15 + row * 95;
        const midY = y + 23;
        return (
          <g key={row}>
            {[10, 90, 170, 250].map((x) => (
              <g key={x}>
                <rect x={x} y={y} width="70" height="46" rx="4" fill="#fff" stroke="#2B2B2E" strokeWidth="2" />
                <line x1={x + 10} y1={y + 10} x2={x + 60} y2={y + 10} stroke="#E4E0D8" strokeWidth="1.5" />
                <line x1={x + 10} y1={y + 23} x2={x + 60} y2={y + 23} stroke="#E4E0D8" strokeWidth="1.5" />
                <line x1={x + 10} y1={y + 36} x2={x + 60} y2={y + 36} stroke="#E4E0D8" strokeWidth="1.5" />
              </g>
            ))}
            <line x1="45" y1={midY} x2="405" y2={midY} stroke="#E8622C" strokeWidth="3" />
            <circle cx="45" cy={midY} r="4" fill="#E8622C" />
            <circle cx="125" cy={midY} r="4" fill="#E8622C" />
            <circle cx="205" cy={midY} r="4" fill="#E8622C" />
            <circle cx="285" cy={midY} r="4" fill="#E8622C" />
            <text x="10" y={y - 6} fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="12.5" fill="#E8622C">String {row + 1}</text>
          </g>
        );
      })}
      <rect x="405" y="45" width="90" height="90" rx="6" fill="#2B2B2E" />
      <text x="450" y="95" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="12" fill="#FFC72C">Inversor</text>
      <text x="160" y="200" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="13" fill="#2B2B2E">Cada fila es un string — paneles conectados en serie</text>
    </svg>
  );
}
 
function Resultado({ kw, subElegida, form, stringsCantidad, contacto, setContacto, descargado, cotizado, enviando, onDescargar, onCotizar, onVolver }) {
  const paneles = panelesPara(kw, subElegida);
  const est = calcularEstructura(paneles, stringsCantidad);
  const suj = sujecionInfo(form.techo, form.instalacion);
  const inv = INVERSORES[kw];
 
  const rielRows = Object.entries(est.rieles).sort((a, b) => b[0] - a[0]).map(([largo, cant]) => (
    <div className="m-row" key={largo}><span>Riel Aluminio 35mm {Math.round(largo * 1000)}mm <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {SKU_RIEL[largo]})</span></span><span className="qty">{cant} un.</span></div>
  ));
 
  let sujecionRows;
  if (suj.tipo === 'doble') {
    sujecionRows = (
      <>
        <div className="m-row"><span>{suj.nombreA} <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {suj.skuA})</span></span><span className="qty">{Math.round(est.sujecion / 2)} un.</span></div>
        <div className="m-row"><span>{suj.nombreB} <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {suj.skuB})</span></span><span className="qty">{Math.round(est.sujecion / 2)} un.</span></div>
      </>
    );
  } else if (suj.tipo === 'simple') {
    sujecionRows = <div className="m-row"><span>{suj.nombre} <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {suj.sku})</span></span><span className="qty">{est.sujecion} un.</span></div>;
  } else {
    sujecionRows = <div className="m-row"><span>{suj.nombre}</span><span className="qty">{est.sujecion} un.</span></div>;
  }
 
  return (
    <>
      <div className="eyebrow">Resultado</div>
      <h1 className="title">Tu <em>listado de materiales</em></h1>
      <p className="lead">
        Planta de {kw} kW, configuración "{subElegida === 'lowcost' ? 'low cost' : subElegida === 'equilibrio' ? 'el equilibrio' : 'mejor retorno'}", {stringsCantidad} string{stringsCantidad > 1 ? 's' : ''} ({est.reparto.join(' + ')} paneles).
      </p>
 
      <div className="summary-strip">
        <div><div className="num">{kw} kW</div><div className="lbl">Tamaño de planta</div></div>
        <div><div className="num">{paneles}</div><div className="lbl">Paneles 580W</div></div>
        <div><div className="num">{coberturaPct(kw, form.consumo)}%</div><div className="lbl">Cobertura consumo</div></div>
      </div>
 
      <div className="materials">
        <div className="m-cat">Paneles</div>
        <div className="m-row"><span>Panel ZN Shine 580W <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {SKU_PANEL})</span></span><span className="qty">{paneles} un.</span></div>
 
        <div className="m-cat">Inversores</div>
        <div className="m-row"><span>{inv.nombre}{inv.sku ? <span style={{ color: 'var(--slate)', fontWeight: 400 }}> (SKU {inv.sku})</span> : <span style={{ color: 'var(--slate)', fontWeight: 400 }}> (SKU pendiente de definir)</span>}</span><span className="qty">1 un.</span></div>
 
        {form.sistema !== 'ongrid' && (
          <>
            <div className="m-cat">Almacenamiento</div>
            <div className="m-row"><span>Banco de baterías</span><span className="qty">A definir</span></div>
          </>
        )}
 
        <div className="m-cat">Estructura</div>
        <div className="m-note" style={{ paddingTop: 0 }}>Propuesta de riel por string (cada string lleva 2 rieles iguales):</div>
        {est.detallePorString.map((d, i) => (
          <div className="m-row" style={{ fontSize: '13.5px' }} key={i}>
            <span>String {i + 1} — {d.paneles} paneles ({d.largoTramo}mt por riel)</span>
            <span className="qty" style={{ textAlign: 'right' }}>{Object.entries(d.combo).sort((a, b) => b[0] - a[0]).map(([l, c]) => `${c}× ${l}m`).join(' + ')}</span>
          </div>
        ))}
        <div className="m-note">Total a comprar ({est.mt_riel_total} mt en riel):</div>
        {rielRows}
        {est.uniones_riel > 0 && <div className="m-row"><span>Unión riel de aluminio <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {SKU_UNION_RIEL})</span></span><span className="qty">{est.uniones_riel} un.</span></div>}
        {sujecionRows}
        <div className="m-row"><span>Conector unión módulo 30mm <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {SKU_UNION_PANELES})</span></span><span className="qty">{est.union_paneles} un.</span></div>
        <div className="m-row"><span>Conector terminal módulo 30mm <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {SKU_UNION_ULTIMO})</span></span><span className="qty">{est.union_ultimo} un.</span></div>
        <div className="m-row"><span>Pletina dentada bajada a tierra <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {SKU_PLETINA})</span></span><span className="qty">{est.pletina} un.</span></div>
        <div className="m-row"><span>Conector a tierra estructura solar <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(SKU {SKU_TIERRA})</span></span><span className="qty">{est.tierra} un.</span></div>
        <div className="m-note">* La combinación de rieles es una propuesta — revisa el stock de todas las dimensiones antes de confirmar. Cantidades sujetas al catálogo real de Tecnored.</div>
      </div>
 
      <hr className="divider" />
 
      {!descargado && (
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>Para descargar tu listado</h3>
          <p style={{ color: 'var(--slate)', fontSize: '13.5px', margin: '0 0 14px' }}>Déjanos tus datos y te lo enviamos, además de dejarte en contacto con nuestro equipo.</p>
          <div className="field"><label>Nombre</label><input value={contacto.nombre} onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })} placeholder="Tu nombre" /></div>
          <div className="row2">
            <div className="field"><label>Teléfono</label><input value={contacto.telefono} onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })} placeholder="+56 9 ..." /></div>
            <div className="field"><label>Correo</label><input type="email" value={contacto.correo} onChange={(e) => setContacto({ ...contacto, correo: e.target.value })} placeholder="tu@correo.cl" /></div>
          </div>
          <button className="btn btn-primary" disabled={enviando} onClick={onDescargar}>{enviando ? 'Guardando...' : 'Descargar listado'}</button>
        </div>
      )}
      {descargado && <div className="success">Listo — tu listado quedó registrado. Nuestro equipo también quedó notificado.</div>}
 
      <button className="btn btn-cta" disabled={enviando} onClick={onCotizar}>Quiero cotizar ahora — que me llamen</button>
      {cotizado && <div className="success">¡Perfecto! Un ejecutivo Tecnored te va a llamar a la brevedad con precios.</div>}
 
      <div className="actions" style={{ marginTop: '18px' }}>
        <button className="btn btn-ghost" onClick={onVolver}>Volver</button>
      </div>
    </>
  );
}
 
const CSS = `
:root{
  --graphite:#2B2B2E; --stone:#F7F4EF; --card:#FFFFFF; --ember:#E8622C; --ember-dark:#C94E1E;
  --sun:#FFC72C; --slate:#6E6B66; --line:#E4E0D8; --good:#3E7A4C;
}
*{box-sizing:border-box;}
body{margin:0; background:var(--stone); color:var(--graphite); font-family:'Inter',sans-serif;}
h1,h2,h3,.num{font-family:'Space Grotesk',sans-serif;}
.app{max-width:760px; margin:0 auto; min-height:100vh; background:var(--stone); display:flex; flex-direction:column;}
header.top{background:var(--graphite); padding:20px 24px 22px;}
.brandrow{display:flex; align-items:center; gap:10px;}
.sunmark{width:26px;height:26px;border-radius:50%; background:var(--sun); position:relative; flex:none;}
.sunmark:after{content:''; position:absolute; inset:-6px; border-radius:50%; border:1.5px solid var(--sun); opacity:.5;}
.brand{color:#fff; font-weight:700; font-size:18px;}
.brand span{color:var(--sun);}
.tag{color:#C9C6C0; font-size:13px; margin:2px 0 0 36px;}
.stepper{display:flex; gap:4px; padding:14px 24px 0; background:var(--graphite);}
.step{height:4px; flex:1; border-radius:2px; background:#48484c;}
.step.done{background:var(--sun);}
.steplabels{display:flex; justify-content:space-between; padding:6px 24px 16px; background:var(--graphite); font-size:11px; color:#B7B4AE;}
main{flex:1; padding:28px 24px 40px;}
.eyebrow{color:var(--ember); font-weight:600; font-size:13px; margin-bottom:6px;}
h1.title{font-size:26px; margin:0 0 6px; line-height:1.15;}
h1.title em{font-style:normal; color:var(--ember);}
p.lead{color:var(--slate); font-size:15px; line-height:1.5; margin:0 0 26px; max-width:52ch;}
.field{margin-bottom:18px;}
.field label{display:block; font-weight:600; font-size:13.5px; margin-bottom:6px;}
.field input, .field select{width:100%; padding:12px 13px; font-size:15px; border:1.5px solid var(--line); border-radius:8px; background:#fff; color:var(--graphite); font-family:inherit;}
.field input:focus, .field select:focus{outline:none; border-color:var(--ember);}
.row2{display:grid; grid-template-columns:1fr 1fr; gap:14px;}
@media (max-width:480px){.row2{grid-template-columns:1fr;}}
.btn{appearance:none; border:none; cursor:pointer; font-family:inherit; font-weight:600; font-size:15px; padding:14px 22px; border-radius:9px; display:inline-flex; align-items:center; justify-content:center; gap:8px;}
.btn-primary{background:var(--ember); color:#fff; width:100%;}
.btn-primary:hover{background:var(--ember-dark);}
.btn-primary:disabled{background:#D8D3C9; color:#9b968d; cursor:not-allowed;}
.btn-ghost{background:transparent; color:var(--slate); padding:14px 6px;}
.btn-cta{background:var(--graphite); color:var(--sun); width:100%; margin-top:10px;}
.btn-cta:hover{background:#1c1c1e;}
.actions{display:flex; gap:12px; margin-top:8px; align-items:center;}
.options-grid{display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; margin-bottom:22px;}
@media (max-width:620px){ .options-grid{grid-template-columns:1fr;} }
.options-grid .opt{border-left:none; border-top:5px solid var(--line); display:flex; flex-direction:column;}
.options-grid .opt-top{flex-direction:column; align-items:flex-start; gap:2px;}
.options-grid .opt-kw{font-size:32px;}
.options{display:flex; flex-direction:column; gap:12px; margin-bottom:22px;}
.options .opt{display:flex; align-items:center; gap:18px; padding:16px 18px;}
.options .opt-top{flex-direction:column; align-items:flex-start; gap:2px; min-width:110px;}
.options .opt-desc{margin-top:0; flex:1;}
.options .opt .badge{margin-top:0; white-space:nowrap;}
@media (max-width:560px){ .options .opt{flex-direction:column; align-items:stretch; gap:8px;} }
.opt{background:var(--card); border:1.5px solid var(--line); border-radius:12px; padding:18px 18px; cursor:pointer; position:relative; border-left:5px solid var(--line);}
.opt.selected{border-color:var(--ember); border-left-color:var(--ember); background:#FFF8F4;}
.opt-top{display:flex; justify-content:space-between; align-items:baseline; gap:10px;}
.opt-name{font-weight:700; font-size:15px;}
.opt-kw{font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:28px; color:var(--graphite);}
.opt-kw small{font-size:14px; font-weight:600; color:var(--slate);}
.opt-desc{color:var(--slate); font-size:13.5px; margin-top:6px; line-height:1.45;}
.badge{display:inline-block; font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:20px; margin-top:10px; background:#EFEAE2; color:var(--slate);}
.badge.cov-high{background:#E7F2E9; color:var(--good);}
.badge.cov-mid{background:#FFF3DC; color:#8a6413;}
.materials{background:var(--card); border:1.5px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:22px;}
.m-cat{padding:12px 18px 6px; font-weight:700; font-size:12.5px; color:var(--ember); background:#FAF8F4;}
.m-row{display:flex; justify-content:space-between; padding:13px 18px; border-bottom:1px solid var(--line); font-size:14.5px;}
.m-row:last-child{border-bottom:none;}
.m-row .qty{color:var(--slate); font-weight:600;}
.m-note{font-size:12.5px; color:var(--slate); padding:12px 18px 0;}
.summary-strip{display:flex; justify-content:space-between; align-items:center; background:var(--graphite); color:#fff; border-radius:12px; padding:16px 18px; margin-bottom:20px;}
.summary-strip .num{font-size:22px; font-weight:700; color:var(--sun);}
.summary-strip .lbl{font-size:12px; color:#C9C6C0;}
.divider{border:none; border-top:1px solid var(--line); margin:24px 0;}
.success{background:#EEF7F0; border:1.5px solid #BFE1C7; color:var(--good); border-radius:10px; padding:14px 16px; font-size:14px; margin-top:14px;}
footer.mock-tag{text-align:center; font-size:11px; color:#B7B4AE; padding:10px 0 22px;}
`;
