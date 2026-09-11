import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, ShieldCheck, Sparkles, Send, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { 
  localGetServicios, 
  localGetBarberos, 
  localGetDisponibilidad, 
  localGetAllCitas, 
  localCrearCitaIndividual, 
  localCrearCitaGrupal, 
  localGetCortesDiarios, 
  localCrearCorteDiario, 
  localGetContabilidad, 
  localGetEgresos, 
  localCrearEgreso,
  localGetUsuarios, 
  localLoginUsuario, 
  localGetReporteClientes 
} from '../services/localBackendFallback';
import { 
  VintageBarberPole, 
  StraightRazorIcon, 
  VintageScissorsIcon, 
  VintageMustacheIcon,
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';

export const ApiConsole: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/servicios');
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST'>('GET');
  const [requestBody, setRequestBody] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);

  const sampleEndpoints = [
    {
      name: 'Listar Servicios',
      method: 'GET',
      path: '/servicios',
      icon: 'scissors',
      body: '',
    },
    {
      name: 'Listar Barberos',
      method: 'GET',
      path: '/barberos',
      icon: 'razor',
      body: '',
    },
    {
      name: 'Consultar Disponibilidad',
      method: 'GET',
      path: `/disponibilidad?fecha=${new Date().toISOString().split('T')[0]}`,
      icon: 'pole',
      body: '',
    },
    {
      name: 'Listar Todas las Citas',
      method: 'GET',
      path: '/citas',
      icon: 'mustache',
      body: '',
    },
    {
      name: 'Crear Cita Individual (Demo)',
      method: 'POST',
      path: '/citas/individual',
      icon: 'razor',
      body: JSON.stringify({
        clienteNombre: "Carlos Santana",
        clienteTelefono: "+57 300 555 7788",
        servicioId: 1,
        barberoId: 1,
        fecha: new Date().toISOString().split('T')[0],
        hora: "10:00"
      }, null, 2),
    },
    {
      name: 'Crear Cita Grupal (Demo)',
      method: 'POST',
      path: '/citas/grupal',
      icon: 'pole',
      body: JSON.stringify({
        responsableNombre: "Mateo Carvajal",
        responsableTelefono: "+57 312 444 9900",
        fecha: new Date().toISOString().split('T')[0],
        hora: "14:00",
        participantes: [
          { nombre: "Mateo C.", servicioId: 1 },
          { nombre: "Lucas C.", servicioId: 2 }
        ]
      }, null, 2),
    },
    {
      name: 'Cortes Diarios & División',
      method: 'GET',
      path: `/cortes-diarios?fecha=${new Date().toISOString().split('T')[0]}`,
      icon: 'scissors',
      body: '',
    },
    {
      name: 'Resumen Contable & Caja',
      method: 'GET',
      path: `/contabilidad?fecha=${new Date().toISOString().split('T')[0]}`,
      icon: 'razor',
      body: '',
    },
    {
      name: 'Listar Egresos de Caja',
      method: 'GET',
      path: `/egresos?fecha=${new Date().toISOString().split('T')[0]}`,
      icon: 'mustache',
      body: '',
    },
    {
      name: 'Registrar Corte (Demo)',
      method: 'POST',
      path: '/cortes-diarios',
      icon: 'scissors',
      body: JSON.stringify({
        barberoId: 101,
        clienteNombre: "Don Fernando Duque",
        servicioNombre: "Corte de Cabello Real",
        precio: 35000,
        propina: 5000,
        porcentajeBarbero: 50,
        metodoPago: "Efectivo",
        notas: "Acabado navaja clásica con toalla caliente"
      }, null, 2),
    },
    {
      name: 'Listar Usuarios del Sistema',
      method: 'GET',
      path: '/usuarios',
      icon: 'pole',
      body: '',
    },
    {
      name: 'Reporte Clientes & Reservas (JSON)',
      method: 'GET',
      path: '/reportes/clientes',
      icon: 'mustache',
      body: '',
    },
    {
      name: 'Reporte Clientes CSV (Excel)',
      method: 'GET',
      path: '/reportes/clientes?formato=csv',
      icon: 'scissors',
      body: '',
    },
    {
      name: 'Iniciar Sesión (Login API)',
      method: 'POST',
      path: '/auth/login',
      icon: 'razor',
      body: JSON.stringify({
        email: "caja@casadelrey.com",
        password: "caja123"
      }, null, 2),
    },
    {
      name: 'Abrir Gaveta de Dinero (ESC/POS)',
      method: 'POST',
      path: '/caja/abrir-gaveta',
      icon: 'pole',
      body: JSON.stringify({
        metodo: "escpos_red",
        motivo: "Prueba técnica de apertura desde consola API",
        usuario: "Administrador Casa del Rey",
        pin: 0
      }, null, 2),
    },
    {
      name: 'Historial Aperturas Gaveta',
      method: 'GET',
      path: '/caja/aperturas',
      icon: 'mustache',
      body: '',
    },
  ];

  const handleSelectPreset = (preset: typeof sampleEndpoints[0]) => {
    setSelectedMethod(preset.method as any);
    setSelectedEndpoint(preset.path);
    setRequestBody(preset.body);
    setResponseData(null);
    setResponseStatus(null);
  };

  const handleExecute = async () => {
    setCargando(true);
    setResponseStatus(null);
    setResponseData(null);

    // Ejecutor local para GitHub Pages o entornos sin servidor Express activo
    const runLocalMock = () => {
      try {
        const cleanPath = selectedEndpoint.split('?')[0];
        const params = new URLSearchParams(selectedEndpoint.includes('?') ? selectedEndpoint.split('?')[1] : '');
        const fecha = params.get('fecha') || new Date().toISOString().split('T')[0];
        
        let parsedBody: any = {};
        if (selectedMethod === 'POST' && requestBody.trim()) {
          try {
            parsedBody = JSON.parse(requestBody);
          } catch {
            parsedBody = {};
          }
        }

        if (cleanPath === '/servicios') {
          return { status: 200, data: { ok: true, datos: localGetServicios(), total: localGetServicios().length, _modo: 'GitHub / Local Storage' } };
        }
        if (cleanPath === '/barberos') {
          return { status: 200, data: { ok: true, datos: localGetBarberos(), total: localGetBarberos().length, _modo: 'GitHub / Local Storage' } };
        }
        if (cleanPath === '/disponibilidad') {
          return { status: 200, data: localGetDisponibilidad(fecha) };
        }
        if (cleanPath === '/citas') {
          return { status: 200, data: { ok: true, datos: localGetAllCitas(), total: localGetAllCitas().length, _modo: 'GitHub / Local Storage' } };
        }
        if (cleanPath === '/citas/individual') {
          return { status: 201, data: localCrearCitaIndividual(parsedBody) };
        }
        if (cleanPath === '/citas/grupal') {
          return { status: 201, data: localCrearCitaGrupal(parsedBody) };
        }
        if (cleanPath === '/cortes-diarios') {
          if (selectedMethod === 'POST') {
            return { status: 201, data: localCrearCorteDiario(parsedBody) };
          }
          return { status: 200, data: localGetCortesDiarios(fecha) };
        }
        if (cleanPath === '/contabilidad') {
          return { status: 200, data: localGetContabilidad(fecha) };
        }
        if (cleanPath === '/egresos') {
          if (selectedMethod === 'POST') {
            return { status: 201, data: localCrearEgreso(parsedBody) };
          }
          return { status: 200, data: localGetEgresos(fecha) };
        }
        if (cleanPath === '/usuarios') {
          return { status: 200, data: { ok: true, datos: localGetUsuarios(), total: localGetUsuarios().length, _modo: 'GitHub / Local Storage' } };
        }
        if (cleanPath === '/reportes/clientes') {
          return { status: 200, data: localGetReporteClientes(Object.fromEntries(params.entries())) };
        }
        if (cleanPath === '/auth/login') {
          return { status: 200, data: localLoginUsuario(parsedBody.email || '', parsedBody.password || '') };
        }
        if (cleanPath === '/caja/abrir-gaveta') {
          return { 
            status: 200, 
            data: { 
              exito: true, 
              mensaje: 'Pulso de apertura de gaveta enviado (Modo Local / GitHub)',
              timestamp: new Date().toISOString()
            } 
          };
        }
        if (cleanPath === '/caja/aperturas') {
          return {
            status: 200,
            data: {
              ok: true,
              aperturas: [
                { id: 'GAP-DEMO-1', hora: '08:30 AM', usuario: 'David Orjuela (SuperAdmin)', motivo: 'Inicio de turno' },
                { id: 'GAP-DEMO-2', hora: '11:15 AM', usuario: 'David Orjuela (SuperAdmin)', motivo: 'Arqueo de caja' }
              ]
            }
          };
        }

        return { status: 200, data: { ok: true, endpoint: selectedEndpoint, mensaje: 'Respuesta simulada GitHub / Local Storage' } };
      } catch (err: any) {
        return { status: 500, data: { error: err.message || 'Error en ejecución local' } };
      }
    };

    try {
      const url = `${API_BASE_URL}${selectedEndpoint}`;
      const options: RequestInit = {
        method: selectedMethod,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedMethod === 'POST' && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      
      if (!res.ok || !contentType.includes('application/json')) {
        // En GitHub Pages o entornos estáticos, invocar mock local
        const localRes = runLocalMock();
        setResponseStatus(localRes.status);
        setResponseData(localRes.data);
        return;
      }

      setResponseStatus(res.status);
      const json = await res.json();
      setResponseData(json);
    } catch {
      // Fallback para GitHub Pages donde no hay Express server
      const localRes = runLocalMock();
      setResponseStatus(localRes.status);
      setResponseData(localRes.data);
    } finally {
      setCargando(false);
    }
  };

  const handleCopiarCurl = () => {
    let curl = `curl -X ${selectedMethod} "http://localhost:3000${API_BASE_URL}${selectedEndpoint}"`;
    if (selectedMethod === 'POST' && requestBody) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n\s*/g, '')}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const renderEndpointIcon = (iconName: string) => {
    switch (iconName) {
      case 'razor':
        return <StraightRazorIcon className="w-3.5 h-3.5 shrink-0" />;
      case 'scissors':
        return <VintageScissorsIcon className="w-3.5 h-3.5 shrink-0" />;
      case 'mustache':
        return <VintageMustacheIcon className="w-4 h-2 shrink-0" />;
      default:
        return <VintageBarberPole className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <div className="py-2 font-sans">
      {/* Main Console Box - Warm Heritage Theme */}
      <div className="rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] shadow-xs relative overflow-hidden text-[#221A14]">
        {/* Barber Pole Ribbon Banner */}
        <BarberPoleRibbon className="h-1.5" />

        <div className="p-5 sm:p-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFCBB5] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBEBE1] border border-[#DFCBB5] text-[#7C571C] flex items-center justify-center shadow-xs">
                <StraightRazorIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight text-[#221A14] uppercase font-mono">
                    Consola API • Barbería La Casa del Rey
                  </h3>
                  <span className="px-2.5 py-0.5 bg-[#FBEBE1] text-[#7C571C] text-[9px] font-mono font-bold rounded-full border border-[#DFCBB5]">
                    REST v1.0
                  </span>
                </div>
                <p className="text-xs text-[#6F5A4B] mt-0.5 font-sans">
                  Ingress directo a rutas Express en Node.js • Puerto 3000
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#6F5A4B] font-bold">URI RAÍZ:</span>
              <span className="px-2.5 py-1 bg-[#FBEBE1] border border-[#DFCBB5] text-[#7C571C] rounded-lg font-bold">
                {API_BASE_URL}
              </span>
            </div>
          </div>

          {/* Endpoint Selector Tabs */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7C571C] flex items-center gap-1.5">
                <VintageScissorsIcon className="w-3 h-3 text-[#7C571C]" />
                <span>ENDPOINTS DEL SISTEMA (SELECCIONAR PRESET):</span>
              </label>
              <VintageWaxSeal text="TELÉGRAFO REST" className="hidden sm:inline-flex" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {sampleEndpoints.map((ep, idx) => {
                const isSelected = selectedEndpoint === ep.path && selectedMethod === ep.method;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(ep)}
                    className={`p-3 rounded-xl text-left border transition-all text-xs font-mono flex items-center justify-between group cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-[#7C571C] border-[#7C571C] text-white shadow-xs'
                        : 'bg-[#FFF8F5] border-[#DFCBB5] hover:border-[#7C571C] text-[#221A14] hover:bg-[#FBEBE1]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      {renderEndpointIcon(ep.icon)}
                      <span className={`truncate transition-colors font-semibold ${isSelected ? 'text-white' : 'text-[#221A14]'}`}>
                        {ep.name}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono tracking-wider shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : ep.method === 'GET'
                          ? 'bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30'
                          : 'bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request Builder */}
          <div className="bg-[#FBEBE1] border border-[#DFCBB5] rounded-2xl p-4 sm:p-5 mb-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DFCBB5]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>SOLICITUD HTTP (CONSOLA DE CONTROL)</span>
              </span>
              <span className="text-[10px] font-mono text-[#6F5A4B]">Content-Type: application/json</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3 font-mono">
              {/* Method Selector */}
              <select
                value={selectedMethod}
                onChange={(e: any) => setSelectedMethod(e.target.value)}
                className="bg-[#FFF8F5] border border-[#DFCBB5] text-xs text-[#221A14] rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-[#7C571C] transition-colors cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>

              {/* Path Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="w-full bg-[#FFF8F5] border border-[#DFCBB5] text-xs text-[#7C571C] font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#7C571C] transition-colors"
                  placeholder="/servicios"
                />
              </div>

              {/* Trigger Button */}
              <button
                id="btn-api-execute"
                onClick={handleExecute}
                disabled={cargando}
                className="px-5 py-2 bg-[#7C571C] hover:bg-[#684816] active:bg-[#573A12] text-white font-bold text-xs font-mono rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider cursor-pointer"
              >
                {cargando ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>ENVIANDO...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>ENVIAR</span>
                  </>
                )}
              </button>
            </div>

            {/* Request Payload for POST */}
            {selectedMethod === 'POST' && (
              <div className="mb-3">
                <label className="block text-[10px] font-mono text-[#6F5A4B] mb-1 font-bold uppercase">
                  CUERPO DE LA PETICIÓN (JSON):
                </label>
                <textarea
                  rows={5}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full bg-[#FFF8F5] border border-[#DFCBB5] text-xs font-mono text-[#221A14] p-3 rounded-xl focus:outline-none focus:border-[#7C571C]"
                  placeholder="{}"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-[#6F5A4B] pt-2 border-t border-[#DFCBB5]">
              <span className="flex items-center gap-1.5">
                <VintageBarberPole className="w-3.5 h-3.5 text-[#7C571C]" />
                <span>Consola interactiva de pruebas de endpoints</span>
              </span>
              <button
                id="btn-copy-curl"
                onClick={handleCopiarCurl}
                className="text-[#7C571C] hover:text-[#221A14] flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
              >
                {copiado ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
                <span>{copiado ? '¡cURL Copiado!' : 'Copiar comando cURL'}</span>
              </button>
            </div>
          </div>

          {/* Response Viewer */}
          {responseStatus !== null && (
            <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl p-4 font-mono text-xs shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DFCBB5]">
                <div className="flex items-center gap-2">
                  <StraightRazorIcon className="w-4 h-4 text-[#7C571C]" />
                  <span className="text-[10px] text-[#6F5A4B] uppercase font-bold tracking-wider">
                    RESPUESTA DEL SERVIDOR
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30'
                        : 'bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30'
                    }`}
                  >
                    STATUS: {responseStatus} {responseStatus === 200 ? 'OK' : ''}
                  </span>
                </div>
              </div>

              <div className="relative">
                <pre className="text-[#221A14] text-xs overflow-x-auto p-3.5 bg-[#FBEBE1] border border-[#DFCBB5] rounded-xl max-h-80 leading-relaxed font-mono selection:bg-[#7C571C] selection:text-white">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
