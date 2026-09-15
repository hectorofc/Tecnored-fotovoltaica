'use client';
 
import { useState } from 'react';
 
const HSP = 4.5;
const PERD = 0.8;
const PANEL_W = 590;
const TIERS = [3, 5, 8];
const RATIOS = { lowcost: 0.85, equilibrio: 1.05, retorno: 1.2 };
 
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
    direccion: '', techo: 'teja_asfaltica', m2: '',
    consumo: '', pago: '', respaldo: 'no', instalacion: 'coplanar',
  });
  const [idealKW, setIdealKW] = useState(0);
  const [opciones, setOpciones] = useState(null);
  const [planElegido, setPlanElegido] = useState(null);
  const [subElegida, setSubElegida] = useState(null);
  const [contacto, setContacto] = useState({ nombre: '', telefono: '', correo: '' });
  const [descargado, setDescargado] = useState(false);
  const [cotizado, setCotizado] = useState(false);
  const [enviando, setEnviando] = useState(false);
 
  function upd(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }
 
  function avanzarAPropuestas() {
    const ideal = calcIdealKW(parseFloat(form.consumo) || 0);
    const ops = getOpciones(ideal);
    setIdealKW(ideal);
    setOpciones(ops);
    setScreen(ops.tipo === 'contactar' ? 'contactarGrande' : 2);
  }
 
  async function guardar(payloadExtra) {
    setEnviando(true);
    try {
      await fetch('/api/factibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direccion: form.direccion,
          tipo_techo: form.techo,
          m2_disponibles: form.m2,
          consumo_mensual_kwh: form.consumo,
          monto_mensual_pago: form.pago,
          respaldo_baterias: form.respaldo === 'si',
          tipo_instalacion: form.instalacion,
          ideal_kw: idealKW || null,
          plan_elegido_kw: planElegido,
          sub_opcion_elegida: subElegida,
          paneles_cantidad: planElegido && subElegida ? panelesPara(planElegido, subElegida) : null,
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
 
  async function onDescargar() {
    await guardar({});
    setDescargado(true);
  }
 
  async function onCotizar() {
    await guardar({ quiere_cotizar: true });
    setCotizado(true);
  }
 
  async function onSolicitarContactoGrande() {
    await guardar({ quiere_cotizar: true });
    setCotizado(true);
  }
 
  const stepIndex = typeof screen === 'number' ? screen : 4;
 
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
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`step ${i <= stepIndex ? 'done' : ''}`}></div>
        ))}
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
  <option value="teja_asfaltica">Teja Asfáltica</option>
  <option value="metalica_zinc">Metálica / Zinc</option>
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
              <button className="btn btn-primary" onClick={() => setScreen(1)}>Continuar</button>
            </div>
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
                <label>¿Quieres respaldo con baterías?</label>
                <select value={form.respaldo} onChange={(e) => upd('respaldo', e.target.value)}>
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>
              <div className="field">
                <label>Tipo de instalación</label>
                <select value={form.instalacion} onChange={(e) => upd('instalacion', e.target.value)}>
                  <option value="coplanar">Coplanar (sobre el techo)</option>
                  <option value="inclinada">Con inclinación (estructura elevada)</option>
                </select>
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setScreen(0)}>Volver</button>
              <button className="btn btn-primary" onClick={avanzarAPropuestas}>Ver propuestas</button>
            </div>
          </>
        )}
 
        {screen === 2 && opciones && (
          <>
            <div className="eyebrow">Paso 3 de 4</div>
            <h1 className="title">Estas son tus <em>propuestas de tamaño</em></h1>
            <p className="lead">Calculado a partir de tu consumo de {form.consumo || 0} kWh/mes. Elige la que más te acomode.</p>
 
            <div className={opciones.tipo === 'unica' ? 'options' : 'options-grid'}>
              {opciones.tipo === 'unica' && (
                <OptCard kw={opciones.ideal} tag="Planta recomendada"
                  desc="Tu consumo es acotado — este es el tamaño más eficiente en costo para tu caso."
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
 
        {screen === 4 && planElegido && subElegida && (
          <>
            <div className="eyebrow">Resultado</div>
            <h1 className="title">Tu <em>listado de materiales</em></h1>
            <p className="lead">
              Planta de {planElegido} kW, configuración "{subElegida === 'lowcost' ? 'low cost' : subElegida === 'equilibrio' ? 'el equilibrio' : 'mejor retorno'}".
            </p>
 
            <div className="summary-strip">
              <div><div className="num">{planElegido} kW</div><div className="lbl">Tamaño de planta</div></div>
              <div><div className="num">{panelesPara(planElegido, subElegida)}</div><div className="lbl">Paneles 590W</div></div>
              <div><div className="num">{coberturaPct(planElegido, form.consumo)}%</div><div className="lbl">Cobertura consumo</div></div>
            </div>
 
            <div className="materials">
              <div className="m-row"><span>Panel solar monocristalino 590W</span><span className="qty">{panelesPara(planElegido, subElegida)} un.</span></div>
              <div className="m-row"><span>Inversor {planElegido} kW</span><span className="qty">1 un.</span></div>
              <div className="m-row"><span>Estructura de montaje {form.instalacion === 'coplanar' ? 'coplanar' : 'con inclinación'} (kit por panel)</span><span className="qty">{panelesPara(planElegido, subElegida)} kits</span></div>
              <div className="m-row"><span>Cableado DC/AC y protecciones</span><span className="qty">1 kit</span></div>
              {form.respaldo === 'si' && <div className="m-row"><span>Banco de baterías de respaldo</span><span className="qty">A definir</span></div>}
              <div className="m-note">* Cantidades referenciales — se ajustarán con el catálogo real y el stock disponible de Tecnored.</div>
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
              <button className="btn btn-ghost" onClick={() => setScreen(3)}>Volver</button>
            </div>
          </>
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
