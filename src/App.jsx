import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";


// METIS brand logo (embedded PNG, 128x128, salvia+dark green)
const LOGO_URL = "data:image/png;base64,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";

const G=18,CELL=0.6,GW=42,GH=32,WH=2.7,CW=GW*G,CH=GH*G;

const ZONES=[
  {id:"A3",nm:"Málaga/Cádiz",z:"A3",hdd:750,cdd:450,solS:145,solN:20,solSS:180,solSE:210,tMax:32,lat:36.7},
  {id:"A4",nm:"Almería",z:"A4",hdd:700,cdd:500,solS:150,solN:22,solSS:190,solSE:220,tMax:33,lat:36.8},
  {id:"B3",nm:"Valencia/Alicante",z:"B3",hdd:1000,cdd:380,solS:138,solN:18,solSS:170,solSE:200,tMax:31,lat:39.5},
  {id:"B4",nm:"Sevilla/Córdoba",z:"B4",hdd:950,cdd:550,solS:142,solN:19,solSS:185,solSE:215,tMax:36,lat:37.4},
  {id:"C2",nm:"Barcelona",z:"C2",hdd:1350,cdd:250,solS:120,solN:16,solSS:155,solSE:185,tMax:29,lat:41.4},
  {id:"C3",nm:"Granada",z:"C3",hdd:1400,cdd:350,solS:130,solN:17,solSS:175,solSE:205,tMax:34,lat:37.2},
  {id:"C4",nm:"Toledo/C.Real",z:"C4",hdd:1500,cdd:380,solS:128,solN:16,solSS:170,solSE:200,tMax:35,lat:39.9},
  {id:"D1",nm:"Bilbao/Santander",z:"D1",hdd:1750,cdd:60,solS:90,solN:12,solSS:110,solSE:140,tMax:25,lat:43.3},
  {id:"D2",nm:"Zaragoza/Valladolid",z:"D2",hdd:1850,cdd:280,solS:110,solN:14,solSS:160,solSE:190,tMax:33,lat:41.6},
  {id:"D3",nm:"Madrid",z:"D3",hdd:1800,cdd:350,solS:130,solN:15,solSS:170,solSE:200,tMax:34,lat:40.4},
  {id:"E1",nm:"Burgos/Soria/León",z:"E1",hdd:2400,cdd:80,solS:105,solN:13,solSS:145,solSE:175,tMax:28,lat:42.3},
  {id:"FR",nm:"París",z:"FR",hdd:2500,cdd:80,solS:65,solN:10,solSS:100,solSE:130,tMax:25,lat:48.9},
  {id:"DE",nm:"Berlín",z:"DE",hdd:3100,cdd:50,solS:55,solN:8,solSS:90,solSE:120,tMax:24,lat:52.5},
  {id:"SE",nm:"Estocolmo",z:"SE",hdd:3800,cdd:20,solS:45,solN:6,solSS:85,solSE:110,tMax:22,lat:59.3},
  {id:"PT",nm:"Lisboa",z:"PT",hdd:1100,cdd:300,solS:140,solN:18,solSS:175,solSE:205,tMax:30,lat:38.7},
  {id:"IT",nm:"Roma",z:"IT",hdd:1400,cdd:320,solS:125,solN:16,solSS:165,solSE:195,tMax:31,lat:41.9},
  {id:"GR",nm:"Atenas",z:"GR",hdd:900,cdd:480,solS:148,solN:20,solSS:185,solSE:215,tMax:34,lat:37.9},
];
const GLASS=[
  {id:"dbl",nm:"Doble bajo-e",u:1.1,g:0.63,col:"#80DEEA"},
  {id:"tri",nm:"Triple Passivhaus",u:0.60,g:0.50,col:"#26C6DA"},
  {id:"sol",nm:"Triple control solar",u:0.70,g:0.28,col:"#0097A7"},
];
const PANELS=[
  {id:"ME-60",cat:"ext",nm:"ME 60",w:1,rW:.6,th:.3,u:.15,c:"#C8956C",c2:"#A87548"},
  {id:"ME-90",cat:"ext",nm:"ME 90",w:1.5,rW:.9,th:.3,u:.15,c:"#C8956C",c2:"#A87548"},
  {id:"ME-120",cat:"ext",nm:"ME 120",w:2,rW:1.2,th:.3,u:.15,c:"#C8956C",c2:"#A87548"},
  {id:"ME-180",cat:"ext",nm:"ME 180",w:3,rW:1.8,th:.3,u:.15,c:"#C8956C",c2:"#A87548"},
  {id:"ME-240",cat:"ext",nm:"ME 240",w:4,rW:2.4,th:.3,u:.15,c:"#C8956C",c2:"#A87548"},
  {id:"ME-300",cat:"ext",nm:"ME 300",w:5,rW:3.0,th:.3,u:.15,c:"#C8956C",c2:"#A87548"},
  {id:"ME-360",cat:"ext",nm:"ME 360",w:6,rW:3.6,th:.3,u:.15,c:"#C8956C",c2:"#A87548"},
  {id:"ME-480",cat:"ext",nm:"ME 480",w:8,rW:4.8,th:.3,u:.15,c:"#C8956C",c2:"#A87548"},
  // Custom exterior (user-defined width in meters)
  {id:"ME-CUSTOM",cat:"ext",nm:"ME Personalizado",w:2,rW:1.2,th:.3,u:.15,c:"#C8956C",c2:"#A87548",custom:true,customAngle:false},
  // Custom exterior with free angle
  {id:"ME-CUSTOM-ANG",cat:"ext",nm:"ME Personalizado con ángulo",w:2,rW:1.2,th:.3,u:.15,c:"#C8956C",c2:"#A87548",custom:true,customAngle:true},
  {id:"MI-60",cat:"int",nm:"MI 60",w:1,rW:.6,th:.12,u:.5,c:"#FFA726",c2:"#F57C00"},
  {id:"MI-90",cat:"int",nm:"MI 90",w:1.5,rW:.9,th:.12,u:.5,c:"#FFA726",c2:"#F57C00"},
  {id:"MI-120",cat:"int",nm:"MI 120",w:2,rW:1.2,th:.12,u:.5,c:"#FFA726",c2:"#F57C00"},
  {id:"MI-180",cat:"int",nm:"MI 180",w:3,rW:1.8,th:.12,u:.5,c:"#FFA726",c2:"#F57C00"},
  {id:"MI-240",cat:"int",nm:"MI 240",w:4,rW:2.4,th:.12,u:.5,c:"#FFA726",c2:"#F57C00"},
  {id:"MI-300",cat:"int",nm:"MI 300",w:5,rW:3.0,th:.12,u:.5,c:"#FFA726",c2:"#F57C00"},
  // Custom interior
  {id:"MI-CUSTOM",cat:"int",nm:"MI Personalizado",w:2,rW:1.2,th:.12,u:.5,c:"#FFA726",c2:"#F57C00",custom:true,customAngle:false},
  // Custom interior with free angle
  {id:"MI-CUSTOM-ANG",cat:"int",nm:"MI Personalizado con ángulo",w:2,rW:1.2,th:.12,u:.5,c:"#FFA726",c2:"#F57C00",custom:true,customAngle:true},
];
const OPENS=[
  {id:"PU-80",cat:"door",nm:"Puerta 80",rW:.8,h:2.1,c:"#8D6E63"},
  {id:"PU-90",cat:"door",nm:"Puerta 90",rW:.9,h:2.1,c:"#8D6E63"},
  {id:"PU-120",cat:"door",nm:"P.Doble 120",rW:1.2,h:2.1,c:"#8D6E63"},
  {id:"VE-60",cat:"window",nm:"Ventana 60",rW:.6,h:1.2,c:"#26C6DA"},
  {id:"VE-90",cat:"window",nm:"Ventana 90",rW:.9,h:1.2,c:"#26C6DA"},
  {id:"VE-120",cat:"window",nm:"Ventana 120",rW:1.2,h:1.2,c:"#26C6DA"},
  {id:"VE-150",cat:"window",nm:"Ventana 150",rW:1.5,h:1.2,c:"#26C6DA"},
  {id:"VE-180",cat:"window",nm:"V.Grande 180",rW:1.8,h:1.4,c:"#26C6DA"},
  {id:"VE-240",cat:"window",nm:"Ventanal 240",rW:2.4,h:2.2,c:"#00BCD4"},
];

// Memoria de calidades — descripciones técnicas por partida
const DESCRIPTIONS={
  ext_ml:{title:"Muro exterior entramado ligero Passivhaus",text:"Muro estructural de entramado ligero en madera laminada con montantes 45×140 mm cada 60 cm. Aislamiento principal de lana de madera 140 mm entre montantes + trasdosado exterior 60 mm. Membrana de hermeticidad autoadherida con cinta certificada. Lámina transpirable SD variable. Tablero estructural OSB 15 mm interior. Espesor total ~30 cm. Transmitancia térmica U=0.15 W/m²K. Acabado exterior madera tratada o sistema SATE (a elegir). Acabado interior preparado para pladur o lama vista. Fabricado en taller con control dimensional ±2 mm."},
  int_ml:{title:"Muro interior estructura",text:"Tabique estructural ligero con montantes de madera 45×70 mm. Aislamiento acústico de lana mineral 60 mm. Tablero OSB 15 mm en ambas caras. Preparado para acabado de pladur o revestimiento a elegir. Tornillería estructural y sellantes incluidos. Fabricado en taller, montaje con uniones mecánicas calibradas."},
  roof_m2:{title:"Cubierta + hermeticidad",text:"Estructura de cubierta en madera con vigas dimensionadas según luz y carga. Tablero estructural OSB 18 mm. Aislamiento de lana de madera 240 mm. Lámina impermeable y transpirable de alta densidad. Listones y rastreles para ventilación. Acabado exterior en chapa lacada o teja cerámica (a elegir). Membrana de hermeticidad continua con tratamiento de uniones. Pruebas de estanqueidad según protocolo Passivhaus (n50 ≤ 0.6 h⁻¹)."},
  floor:{title:"Cimentación / solera",text:"Cimentación por zapatas corridas y vigas riostras según estudio geotécnico. Solera de hormigón armado HA-25 de 15 cm con malla electrosoldada. Aislamiento bajo solera con XPS de alta resistencia 100 mm. Lámina antirradón y barrera de vapor. Hormigón de limpieza, encofrados y armaduras incluidos. Replanteo y nivelación. NO incluye excavación masiva ni movimiento de tierras especiales."},
  carp:{title:"Carpinterías exteriores",text:"Ventanas con perfilería madera-aluminio o PVC alta gama según proyecto. Triple vidrio Passivhaus con cámara de argón, U=0.6-0.7 W/m²K. Sellado perimetral con cintas certificadas exterior e interior. Herrajes oscilo-batientes europeos. Puertas de entrada con núcleo aislante, cierre multipunto y bisagras tridimensionales. Premarco metálico para garantizar planeidad. Incluye colocación, sellado y prueba de hermeticidad puntual."},
  install:{title:"Instalaciones (eléctrica, fontanería, climatización, MVHR)",text:"Instalación eléctrica completa con cuadro general según REBT, tomas, puntos de luz e iluminación LED. Fontanería de agua fría/caliente con tubería multicapa, sanitarios calidad media-alta, grifería monomando termostática. Calefacción y refrigeración por aerotermia con bomba de calor de alta eficiencia (COP > 4). Sistema de ventilación mecánica con recuperador de calor (MVHR) de eficiencia ≥ 85%. Distribución por conductos aislados. Termostatos por estancia. NO incluye placas fotovoltaicas, baterías ni domótica avanzada."},
  finish:{title:"Acabados interiores",text:"Pavimento laminado AC4 o tarima de madera contrachapada en zonas secas. Pavimento porcelánico antideslizante en zonas húmedas. Alicatado cerámico hasta techo en baños y a media altura en cocina. Pintura plástica lavable mate en paredes y techos. Carpintería interior tipo block puerta lisa lacada con herrajes de calidad media. Sanitarios suspendidos con cisterna empotrada. Mamparas de ducha vidrio templado. Rodapiés y cantos. NO incluye obra de albañilería extra ni acabados singulares."},
  kitchen:{title:"Cocina y mobiliario fijo",text:"Mobiliario de cocina modular con frentes laminados o lacados. Encimera de granito, compacto o silestone (~3 cm). Fregadero monocubeta acero inox bajo encimera. Grifería extraíble. Electrodomésticos integrados de gama media-alta (placa, horno, campana, lavavajillas, frigorífico). Iluminación LED bajo módulos altos. Mobiliario fijo de armarios empotrados en dormitorios principales. Estimación para vivienda 80-120 m². Para viviendas mayores o gama alta, ajustar al alza."},
  project:{title:"Proyecto técnico + dirección de obra",text:"Proyecto básico y de ejecución redactado por arquitecto colegiado. Memoria, planos, mediciones, presupuesto, pliego de condiciones, estudio de seguridad y salud, certificado energético. Dirección de obra a cargo de arquitecto. Dirección de ejecución a cargo de arquitecto técnico. Coordinación de seguridad y salud. Levantamiento topográfico básico. Visado colegial incluido. NO incluye proyecto de actividad si fuera necesario."},
  license:{title:"Licencias y tasas municipales",text:"Licencia de obra mayor o declaración responsable según municipio. ICIO (Impuesto sobre Construcciones, Instalaciones y Obras): 2-4% del PEM. Tasa urbanística: 1-2% del PEM. Licencia de primera ocupación. Boletines de instalaciones (eléctrico, fontanería, telecomunicaciones). Aval por gestión de residuos si procede. Las cuantías exactas dependen de cada Ayuntamiento. Estimación orientativa del 5% sobre el material base."},
  geo:{title:"Estudio geotécnico y topográfico",text:"Estudio geotécnico con sondeo a rotación o ensayos de penetración dinámica (mínimo 2 puntos), análisis del terreno, recomendaciones de cimentación y nivel freático. Levantamiento topográfico de la parcela con curvas de nivel y replanteo de límites. Informe firmado por geólogo o ingeniero geotécnico colegiado. Necesario para proyecto y obligatorio según CTE-DB-SE-C."},
  transport:{title:"Transporte de paneles a obra",text:"Transporte de paneles fabricados desde taller hasta la obra. Camión con grúa autocargante (10-16 t). Paletizado y protección de paneles para evitar daños en tránsito. Estimación basada en distancia ≤ 200 km desde Madrid. Para distancias mayores se presupuesta aparte. Incluye carga en taller, transporte y descarga en obra. NO incluye permisos especiales por transporte de cargas voluminosas."},
  crane:{title:"Medios auxiliares (grúa, andamios)",text:"Alquiler de grúa móvil para montaje de paneles (1-2 días). Andamios perimetrales tipo europeo con plataformas y barandillas reglamentarias durante la fase de envolvente y cubierta. Equipos de protección colectiva. Escaleras y plataformas de trabajo. Estimación para vivienda unifamiliar de 100-150 m². Para obras mayores o con dificultades de acceso, ajustar al alza."},
  blower:{title:"Ensayo blower door",text:"Ensayo de hermeticidad al aire según norma UNE-EN ISO 9972 con equipo Minneapolis Blower Door o similar. Medición de la tasa de renovación a 50 Pa (n50). Detección de fugas con anemómetro y cámara termográfica si procede. Informe oficial firmado por técnico acreditado. Necesario para certificación Passivhaus (n50 ≤ 0.6 h⁻¹). Incluye desplazamiento dentro de un radio de 100 km."},
  decennial:{title:"Seguro decenal",text:"Seguro de responsabilidad decenal según Ley de Ordenación de la Edificación (LOE). Cobertura de daños materiales por vicios o defectos que afecten a la estabilidad del edificio durante 10 años desde la recepción. Obligatorio para vivienda nueva. Incluye Organismo de Control Técnico (OCT) que supervisa la obra. La prima depende del valor de la obra y del tipo de aseguradora."},
  contingency:{title:"Imprevistos",text:"Reserva económica destinada a cubrir partidas no previstas durante la ejecución: refuerzos estructurales tras estudio geotécnico real, modificaciones por incidencias del terreno, cambios menores solicitados por el cliente, ajustes técnicos. Recomendación habitual entre 5-10% del material según complejidad y nivel de definición del proyecto."}
};

let _p=0,_o=0;
const sH=v=>Math.round(v*2)/2;
// Effective width in cells: custom panels use cW (meters) stored in the placement
const effW=(p,c)=>p.cW!==undefined?p.cW/0.6:c.w;
const effRW=(p,c)=>p.cW!==undefined?p.cW:c.rW;
// Angle in degrees: 0=horizontal, 90=vertical. Custom panels can store cA (degrees)
const effAng=(p,c)=>c&&c.customAngle&&p.cA!==undefined?p.cA:p.rot;
// End point considering angle (returns x2,y2 in grid cells)
const pEnd=(p,c)=>{
  const ang=effAng(p,c),w=effW(p,c);
  if(ang===0)return{x2:p.gx+w,y2:p.gy};
  if(ang===90)return{x2:p.gx,y2:p.gy+w};
  const r=ang*Math.PI/180;
  return{x2:p.gx+w*Math.cos(r),y2:p.gy+w*Math.sin(r)};
};
const dPS=(px,py,x1,y1,x2,y2)=>{const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;if(!l2)return Math.hypot(px-x1,py-y1);const t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l2));return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));};

// ─── Design templates ──────────────────────
// All coords in grid cells (1 cell = 0.6m)
const TEMPLATES=[
  {id:"rect60", nm:"Rectangular 60 m²", dt:"10×6m · 1 planta · básica", icon:"▭",
    walls:[
      {cid:"ME-480",gx:5,gy:5,rot:0,ops:[{cid:"VE-120",pos:.5}]},
      {cid:"ME-480",gx:13,gy:5,rot:0,ops:[]},
      {cid:"ME-480",gx:5,gy:15,rot:0,ops:[{cid:"PU-90",pos:.3},{cid:"VE-180",pos:.75}]},
      {cid:"ME-480",gx:13,gy:15,rot:0,ops:[]},
      {cid:"ME-360",gx:5,gy:5,rot:90,ops:[{cid:"VE-90",pos:.5}]},
      {cid:"ME-360",gx:21,gy:5,rot:90,ops:[{cid:"VE-90",pos:.5}]},
      {cid:"MI-240",gx:13,gy:9,rot:90,ops:[{cid:"PU-80",pos:.5}]},
    ]},
  {id:"rect80", nm:"Rectangular 80 m²", dt:"12×7m · 1 planta", icon:"▬",
    walls:[
      {cid:"ME-300",gx:5,gy:5,rot:0,ops:[{cid:"VE-150",pos:.5}]},
      {cid:"ME-300",gx:10,gy:5,rot:0,ops:[{cid:"VE-120",pos:.5}]},
      {cid:"ME-300",gx:15,gy:5,rot:0,ops:[]},
      {cid:"ME-300",gx:5,gy:17,rot:0,ops:[{cid:"PU-90",pos:.3}]},
      {cid:"ME-300",gx:10,gy:17,rot:0,ops:[{cid:"VE-240",pos:.5}]},
      {cid:"ME-300",gx:15,gy:17,rot:0,ops:[{cid:"VE-120",pos:.5}]},
      {cid:"ME-360",gx:5,gy:5,rot:90,ops:[{cid:"VE-90",pos:.3},{cid:"VE-90",pos:.7}]},
      {cid:"ME-360",gx:20,gy:5,rot:90,ops:[{cid:"VE-120",pos:.5}]},
      {cid:"MI-180",gx:10,gy:10,rot:0,ops:[{cid:"PU-80",pos:.5}]},
      {cid:"MI-240",gx:13,gy:10,rot:90,ops:[{cid:"PU-80",pos:.5}]},
    ]},
  {id:"shapeL", nm:"Casa en L 90 m²", dt:"10×9m con ala · 1 planta", icon:"⌐",
    walls:[
      {cid:"ME-360",gx:5,gy:5,rot:0,ops:[{cid:"VE-120",pos:.5}]},
      {cid:"ME-240",gx:11,gy:5,rot:0,ops:[{cid:"VE-90",pos:.5}]},
      {cid:"ME-300",gx:5,gy:15,rot:0,ops:[{cid:"PU-120",pos:.4},{cid:"VE-240",pos:.8}]},
      {cid:"ME-180",gx:11,gy:11,rot:0,ops:[{cid:"VE-120",pos:.5}]},
      {cid:"ME-360",gx:5,gy:5,rot:90,ops:[{cid:"VE-90",pos:.3},{cid:"VE-90",pos:.7}]},
      {cid:"ME-240",gx:11,gy:5,rot:90,ops:[{cid:"VE-90",pos:.5}]},
      {cid:"ME-360",gx:14,gy:5,rot:90,ops:[{cid:"VE-150",pos:.5}]},
      {cid:"ME-180",gx:11,gy:11,rot:90,ops:[]},
      {cid:"MI-240",gx:11,gy:10,rot:0,ops:[{cid:"PU-80",pos:.5}]},
    ]},
  {id:"rect100",nm:"Rectangular 100 m²",dt:"12×8m · 2 plantas",icon:"▣",
    walls:[
      {cid:"ME-480",gx:5,gy:5,rot:0,ops:[{cid:"VE-180",pos:.5}],floor:0},
      {cid:"ME-240",gx:13,gy:5,rot:0,ops:[{cid:"VE-120",pos:.5}],floor:0},
      {cid:"ME-480",gx:5,gy:18,rot:0,ops:[{cid:"PU-120",pos:.3},{cid:"VE-240",pos:.75}],floor:0},
      {cid:"ME-240",gx:13,gy:18,rot:0,ops:[{cid:"VE-120",pos:.5}],floor:0},
      {cid:"ME-480",gx:5,gy:5,rot:90,ops:[{cid:"VE-120",pos:.5}],floor:0},
      {cid:"ME-480",gx:17,gy:5,rot:90,ops:[{cid:"VE-120",pos:.5}],floor:0},
      {cid:"MI-240",gx:11,gy:11,rot:0,ops:[{cid:"PU-80",pos:.5}],floor:0},
      // Upper floor
      {cid:"ME-480",gx:5,gy:5,rot:0,ops:[{cid:"VE-150",pos:.3},{cid:"VE-150",pos:.7}],floor:1},
      {cid:"ME-240",gx:13,gy:5,rot:0,ops:[{cid:"VE-120",pos:.5}],floor:1},
      {cid:"ME-480",gx:5,gy:18,rot:0,ops:[{cid:"VE-180",pos:.5}],floor:1},
      {cid:"ME-240",gx:13,gy:18,rot:0,ops:[{cid:"VE-120",pos:.5}],floor:1},
      {cid:"ME-480",gx:5,gy:5,rot:90,ops:[{cid:"VE-90",pos:.5}],floor:1},
      {cid:"ME-480",gx:17,gy:5,rot:90,ops:[{cid:"VE-90",pos:.5}],floor:1},
      {cid:"MI-240",gx:11,gy:11,rot:0,ops:[{cid:"PU-80",pos:.5}],floor:1},
    ]},
];
function rbCalc(placed,fl){let mn={x:Infinity,y:Infinity},mx={x:-Infinity,y:-Infinity},has=false;placed.filter(p=>p.floor===fl).forEach(p=>{const c=PANELS.find(x=>x.id===p.cid);if(!c||c.cat!=="ext")return;has=true;const{x2,y2}=pEnd(p,c);mn.x=Math.min(mn.x,p.gx,x2);mn.y=Math.min(mn.y,p.gy,y2);mx.x=Math.max(mx.x,p.gx,x2);mx.y=Math.max(mx.y,p.gy,y2);});if(!has)return null;return{x1:mn.x-.4,y1:mn.y-.4,x2:mx.x+.4,y2:mx.y+.4};}
function makeWoodTex(){const cv=document.createElement("canvas");cv.width=256;cv.height=256;const ctx=cv.getContext("2d");const img=ctx.createImageData(256,256);for(let y=0;y<256;y++){const pi=Math.floor(y/18),ps=(pi%3===0)?12:(pi%3===1)?-8:4,ed=y%18,edk=(ed<1||ed>16)?-25:0;for(let x=0;x<256;x++){const v=Math.sin(y*.5+Math.sin(x*.02+y*.1)*8)*12+(Math.sin(x*13.7+y*7.3)*43758.5453%1)*16-8+ps+edk+Math.exp(-((x-153)**2+(y-90)**2)/400)*-30;const i=(y*256+x)*4;img.data[i]=Math.max(0,Math.min(255,160+v));img.data[i+1]=Math.max(0,Math.min(255,110+v*.7));img.data[i+2]=Math.max(0,Math.min(255,60+v*.4));img.data[i+3]=255;}}ctx.putImageData(img,0,0);ctx.strokeStyle="rgba(60,35,15,0.3)";ctx.lineWidth=1;for(let y=0;y<256;y+=18){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}return cv;}

// ─── PDF EXPORT ──────────────────────────────────────
function exportPDF(energy,budget,glass,placed,compass,roofType,overhang,canvasRef,client,prices,projectName){
  const planImg=canvasRef?.current?.toDataURL("image/png")||"";
  const zd=energy.zd;const d=new Date().toLocaleDateString("es-ES");
  const rtCol={"A+":"#00C853",A:"#66BB6A",B:"#9CCC65",C:"#FFEE58",D:"#FFA726",E:"#FF7043",F:"#EF5350",G:"#B71C1C"};
  const hasClient=client&&(client.name||client.email||client.phone);
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>METIS · Ficha Técnica${projectName?" - "+projectName:""}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;color:#1a1a2e;padding:20px;max-width:800px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1F3A26;padding-bottom:14px;margin-bottom:16px}
.brand{display:flex;align-items:center;gap:12px}
.brand-text{display:flex;flex-direction:column}
.logo-nm{font-size:22px;font-weight:900;color:#1F3A26;letter-spacing:2px;line-height:1}
.logo-sub{font-size:10px;color:#4A6B52;letter-spacing:1.5px;text-transform:uppercase;margin-top:3px}
.date{font-size:11px;color:#666;margin-top:4px}
h2{font-size:14px;color:#1F3A26;margin:14px 0 6px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #e0e0e0;padding-bottom:3px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.card{background:#f5f7f2;border:1px solid #d5dcc8;border-radius:8px;padding:10px}
.card-title{font-size:10px;color:#6B8670;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.card-value{font-size:17px;font-weight:700;color:#1F3A26}
.rating-box{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:10px;font-size:22px;font-weight:900;color:#fff}
.plan-img{width:100%;max-height:300px;object-fit:contain;border:1px solid #d5dcc8;border-radius:8px;margin:8px 0}
table{width:100%;border-collapse:collapse;font-size:11px;margin:6px 0}
th{background:#e8ede0;padding:6px 8px;text-align:left;font-weight:700;border-bottom:2px solid #1F3A26;color:#1F3A26}
td{padding:5px 8px;border-bottom:1px solid #eee}
.sub-row td{font-weight:600;background:#f5f7f2}
.total-row td{font-weight:800;font-size:14px;border-top:2px solid #1F3A26;padding-top:10px;color:#1F3A26}
.pass{color:#1F3A26;font-weight:700}.fail{color:#B54434;font-weight:700}
.bar{height:8px;border-radius:4px;margin-top:2px}
.client-box{background:linear-gradient(135deg,#E8EDE0,#F2F5EC);border:1.5px solid #B5C5A3;border-radius:10px;padding:14px;margin-bottom:14px}
.client-row{display:flex;gap:20px;flex-wrap:wrap;margin-top:6px;font-size:12px;color:#1F3A26}
.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:9px;color:#6B8670;text-align:center}
.contact-cta{margin-top:20px;padding:18px;background:linear-gradient(135deg,#1F3A26,#2E5538);border-radius:12px;color:#fff;text-align:center}
.contact-cta h3{font-size:17px;font-weight:800;margin-bottom:6px}
.contact-cta p{font-size:12px;opacity:.95}
@media print{body{padding:10px}button{display:none!important}}
</style></head><body>
<div class="header">
  <div class="brand">
    <img src="${LOGO_URL}" alt="METIS" width="64" height="64" />
    <div class="brand-text">
      <div class="logo-nm">METIS</div>
      <div class="logo-sub">Planificador Passivhaus</div>
      <div class="date">${projectName||"Ficha técnica"} · ${d}</div>
    </div>
  </div>
  <div style="text-align:right"><div class="rating-box" style="background:${rtCol[energy.rt]||'#B71C1C'}">${energy.rt}</div><div style="font-size:18px;font-weight:700;margin-top:4px;color:#1F3A26">${energy.total.toFixed(1)} <span style="font-size:11px;color:#6B8670">kWh/m²a</span></div></div>
</div>

${hasClient?`<div class="client-box">
<div style="font-size:10px;color:#1F3A26;text-transform:uppercase;letter-spacing:1px;font-weight:700">👤 Cliente</div>
<div style="font-size:16px;font-weight:700;margin-top:4px;color:#1F3A26">${client.name||"—"}</div>
<div class="client-row">
${client.email?`<span>📧 ${client.email}</span>`:""}
${client.phone?`<span>📞 ${client.phone}</span>`:""}
${client.address?`<span>📍 ${client.address}</span>`:""}
</div>
${client.notes?`<div style="margin-top:6px;font-size:10px;color:#2E5538;font-style:italic">${client.notes}</div>`:""}
</div>`:""}

<h2>📐 Datos del Proyecto</h2>
<div class="grid">
<div class="card"><div class="card-title">Zona Climática</div><div class="card-value">${zd.z} — ${zd.nm}</div><div style="font-size:10px;color:#888;margin-top:2px">HDD ${zd.hdd} · CDD ${zd.cdd} · T.max ${zd.tMax}°C</div></div>
<div class="card"><div class="card-title">Carpintería</div><div class="card-value">${glass.nm}</div><div style="font-size:10px;color:#888;margin-top:2px">U=${glass.u} W/m²K · g=${glass.g} · Voladizo ${overhang.toFixed(1)}m</div></div>
<div class="card"><div class="card-title">Orientación</div><div class="card-value">${Math.round(compass)}° ${compass>135&&compass<225?"Sur":compass>45&&compass<=135?"Este":compass>=225&&compass<315?"Oeste":"Norte"}</div></div>
<div class="card"><div class="card-title">Configuración</div><div class="card-value">${roofType==="gable"?"Cub. dos aguas":roofType==="flat"?"Cub. plana":"Sin cubierta"}</div><div style="font-size:10px;color:#888;margin-top:2px">${energy.numFloors} planta${energy.numFloors>1?"s":""} · ${energy.fA.toFixed(1)} m² útiles</div></div>
</div>

${planImg?`<h2>🏠 Planta</h2><img src="${planImg}" class="plan-img" />`:""}

<h2>🌡️ Calificación Energética</h2>
<div class="grid">
<div class="card"><div class="card-title">🔥 Calefacción</div><div class="card-value ${energy.pasH?"pass":"fail"}">${energy.netH.toFixed(1)} kWh/m²a — ${energy.rtH}</div>
<div class="bar" style="width:${Math.min(100,energy.netH/1.5)}%;background:${energy.pasH?"#00C853":"#FF5252"}"></div>
<div style="font-size:9px;color:#888;margin-top:3px">Límite Passivhaus: ≤15 kWh/m²a</div></div>
<div class="card"><div class="card-title">❄️ Refrigeración</div><div class="card-value ${energy.pasC?"pass":"fail"}">${energy.netC.toFixed(1)} kWh/m²a — ${energy.rtC}</div>
<div class="bar" style="width:${Math.min(100,energy.netC/1.5)}%;background:${energy.pasC?"#00C853":"#42A5F5"}"></div>
<div style="font-size:9px;color:#888;margin-top:3px">Límite Passivhaus: ≤15 kWh/m²a</div></div>
</div>

<h2>📊 Superficies y transmitancias</h2>
<table><tr><th>Elemento</th><th>Superficie</th><th>U (W/m²K)</th></tr>
<tr><td>Muros exteriores (entramado ligero)</td><td>${energy.eA.toFixed(1)} m²</td><td>0.15</td></tr>
<tr><td>Muros interiores</td><td>${energy.iA.toFixed(1)} m²</td><td>0.50</td></tr>
<tr><td>Ventanas (${glass.nm})</td><td>${energy.wA.toFixed(1)} m²</td><td>${glass.u}</td></tr>
<tr><td>Puertas</td><td>${energy.dA.toFixed(1)} m²</td><td>1.20</td></tr>
<tr><td>Cubierta</td><td>${energy.rA.toFixed(1)} m²</td><td>0.10</td></tr>
<tr><td>Solera</td><td>${(energy.fA/energy.numFloors).toFixed(1)} m²</td><td>0.15</td></tr>
</table>

<h2>💰 Presupuesto</h2>
<div style="font-size:10px;color:#1F3A26;font-weight:700;margin:4px 0 6px;padding:6px 10px;background:#E8EDE0;border-left:4px solid #1F3A26;border-radius:4px">◈ NÚCLEO — Sistema constructivo Metis (siempre incluido)</div>
<table><tr><th>Partida</th><th>Medición</th><th>Precio</th><th>Importe</th></tr>
${budget.items.map(it=>`<tr><td>${it.id} (${it.cat==="ext"?"muro ext.":"muro int."})</td><td>${it.ml.toFixed(1)} ml</td><td>${it.unit.toFixed(0)} €/ml</td><td>${it.cost.toFixed(0)} €</td></tr>`).join("")}
${budget.roofCost>0?`<tr><td>Cubierta + hermeticidad</td><td>${energy.rA.toFixed(1)} m²</td><td>${prices.roof_m2} €/m²</td><td>${budget.roofCost.toFixed(0)} €</td></tr>`:""}
${budget.optionals.length>0?`<tr><td colspan="4" style="padding:8px 8px 4px;font-size:10px;font-weight:700;color:#7B1FA2;background:#F3E5F5;border-left:4px solid #7B1FA2">✓ PARTIDAS OPCIONALES INCLUIDAS</td></tr>`:""}
${budget.optionals.map(o=>`<tr><td>${o.label}</td><td colspan="2" style="font-size:10px;color:#666">${o.qty}${o.unitLabel?" "+o.unitLabel:""}</td><td>${o.cost.toFixed(0)} €</td></tr>`).join("")}
<tr class="sub-row"><td colspan="3">Material total</td><td>${budget.matBase.toFixed(0)} €</td></tr>
<tr><td colspan="3">Mano de obra (${prices.labor_pct}%)</td><td>${budget.labor.toFixed(0)} €</td></tr>
<tr class="sub-row"><td colspan="3">Coste de ejecución</td><td>${budget.subtotal.toFixed(0)} €</td></tr>
<tr><td colspan="3">Margen comercial (${prices.margin_pct}%)</td><td>${budget.margin.toFixed(0)} €</td></tr>
<tr class="sub-row"><td colspan="3">Subtotal</td><td>${budget.beforeIVA.toFixed(0)} €</td></tr>
<tr><td colspan="3">IVA (${prices.iva_pct}%)</td><td>${budget.iva.toFixed(0)} €</td></tr>
<tr class="total-row"><td colspan="3">TOTAL</td><td>${budget.total.toFixed(0)} €</td></tr>
</table>
<div style="font-size:9px;color:#999;margin-top:4px">* Presupuesto orientativo sujeto a visita técnica y condiciones del terreno</div>

${budget.excluded.length>0?`<div style="margin-top:18px;padding:14px 16px;background:#FFF3E0;border:2px solid #FF6F00;border-radius:10px">
<div style="font-size:13px;font-weight:800;color:#E65100;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">⚠ Partidas NO incluidas en este presupuesto</div>
<div style="font-size:11px;color:#5D2E00;line-height:1.6">El presupuesto anterior cubre únicamente las partidas marcadas como núcleo y las opcionales seleccionadas. Las siguientes partidas <strong>no están incluidas</strong> y deberán presupuestarse aparte (con otros equipos del cliente o ampliando el alcance del contrato con METIS):</div>
<ul style="margin:8px 0 0 20px;padding:0;font-size:10.5px;color:#5D2E00;line-height:1.6">
${budget.excluded.map(e=>`<li>${e.label}</li>`).join("")}
</ul>
<div style="font-size:10px;color:#5D2E00;margin-top:10px;font-style:italic">El cliente puede contratar estas partidas con otros profesionales de su confianza, o ampliar el alcance del proyecto con METIS. Consultar para presupuesto completo llave en mano.</div>
</div>`:""}

${energy.pasH&&energy.pasC?`<div style="text-align:center;margin:16px 0;padding:14px;background:#E8EDE0;border:2px solid #1F3A26;border-radius:10px"><div style="font-size:18px;font-weight:900;color:#1F3A26">✓ CUMPLE ESTÁNDAR PASSIVHAUS</div><div style="font-size:11px;color:#2E5538;margin-top:4px">Calefacción ${energy.netH.toFixed(1)} · Refrigeración ${energy.netC.toFixed(1)} (ambos ≤ 15 kWh/m²a)</div></div>`:""}

<div style="page-break-before:always;margin-top:24px"></div>
<h2 style="font-size:18px;color:#1F3A26;margin:0 0 4px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:3px solid #1F3A26;padding-bottom:6px">📋 Memoria de Calidades</h2>
<div style="font-size:10px;color:#6B8670;margin-bottom:14px;font-style:italic">Descripción técnica de los materiales y calidades incluidos en cada partida del presupuesto.</div>

<div style="font-size:12px;font-weight:800;color:#1F3A26;margin:14px 0 8px;padding:6px 10px;background:#E8EDE0;border-left:4px solid #1F3A26">◈ NÚCLEO — Sistema constructivo (siempre incluido)</div>
${["ext_ml","int_ml","roof_m2"].map(k=>{const d=DESCRIPTIONS[k];if(!d)return"";return`<div style="margin-bottom:12px;padding:10px 12px;background:#F5F7F2;border:1px solid #d5dcc8;border-radius:6px"><div style="font-size:12px;font-weight:700;color:#1F3A26;margin-bottom:4px">${d.title}</div><div style="font-size:10px;color:#333;line-height:1.55;text-align:justify">${d.text}</div></div>`;}).join("")}

${budget.optionals.length>0?`<div style="font-size:12px;font-weight:800;color:#7B1FA2;margin:18px 0 8px;padding:6px 10px;background:#F3E5F5;border-left:4px solid #7B1FA2">✓ PARTIDAS OPCIONALES INCLUIDAS</div>
${budget.optionals.map(o=>{const d=DESCRIPTIONS[o.key];if(!d)return"";return`<div style="margin-bottom:12px;padding:10px 12px;background:#F8F4FA;border:1px solid #E1BEE7;border-radius:6px"><div style="font-size:12px;font-weight:700;color:#7B1FA2;margin-bottom:4px">${d.title}</div><div style="font-size:10px;color:#333;line-height:1.55;text-align:justify">${d.text}</div></div>`;}).join("")}`:""}

${budget.excluded.length>0?`<div style="font-size:11px;font-weight:700;color:#5D2E00;margin:18px 0 6px;padding:6px 10px;background:#FFF3E0;border-left:4px solid #FF6F00">⚠ Partidas no incluidas (referencia técnica)</div>
<div style="font-size:9px;color:#5D2E00;font-style:italic;margin-bottom:8px">Las siguientes partidas no se incluyen en el presupuesto. Se documenta su descripción a título orientativo por si el cliente decide ampliar el alcance del proyecto.</div>
${budget.excluded.map(e=>{const d=DESCRIPTIONS[e.key];if(!d)return"";return`<div style="margin-bottom:10px;padding:8px 12px;background:#FAFAFA;border:1px dashed #BDBDBD;border-radius:6px"><div style="font-size:11px;font-weight:700;color:#666;margin-bottom:3px">${d.title}</div><div style="font-size:9.5px;color:#555;line-height:1.5;text-align:justify">${d.text}</div></div>`;}).join("")}`:""}

<div class="contact-cta">
<h3>¿Quieres llevar este proyecto a la realidad?</h3>
<p>Contáctanos para una visita técnica y presupuesto en firme</p>
</div>

<div class="footer">Generado por METIS Planificador · Diseño Passivhaus en entramado ligero · Valores orientativos — consulte con profesional cualificado</div>
<button onclick="window.print()" style="display:block;margin:16px auto;padding:12px 32px;background:#1F3A26;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">📄 Imprimir / Guardar PDF</button>
</body></html>`;
  const w=window.open("","_blank");if(w){w.document.write(html);w.document.close();}
}

export default function App(){
  const [placed,setPlaced]=useState([]);
  const [tab,setTab]=useState("ext");
  const [sel,setSel]=useState(null);
  const [selO,setSelO]=useState(null);
  const [rot,setRot]=useState(0);
  const [mouse,setMouse]=useState({px:0,py:0});
  const [compass,setCompass]=useState(180);
  const [dragC,setDragC]=useState(false);
  const [hov,setHov]=useState(null);
  const [mode,setMode]=useState("place");
  const [view3D,setView3D]=useState(false);
  const [catOpen,setCatOpen]=useState(false);
  const [infoOpen,setInfoOpen]=useState(false);
  const [roofType,setRoofType]=useState("flat");
  const [zone,setZone]=useState("D3");
  const [zoneOpen,setZoneOpen]=useState(false);
  const [flash,setFlash]=useState(null);
  const [floor,setFloor]=useState(0);
  const [glassType,setGlassType]=useState("tri");
  const [overhang,setOverhang]=useState(0.6);
  const [autoRotate,setAutoRotate]=useState(false);
  const [budgetOpen,setBudgetOpen]=useState(false);
  const [movingId,setMovingId]=useState(null);
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [pricesOpen,setPricesOpen]=useState(false);
  const DEFAULT_PRICES={
    // CORE (siempre incluido)
    ext_ml:285,
    int_ml:95,
    roof_m2:165,
    // OPCIONALES — cada una con precio y flag enabled
    floor_m2:140, floor_on:false,
    door_ud:680, window_m2:480, carp_on:false,
    install_m2:160, install_on:false,
    finish_m2:220, finish_on:false,
    kitchen_fixed:8500, kitchen_on:false,
    project_m2:45, project_on:false,
    license_pct:5, license_on:false,
    geo_fixed:1100, geo_on:false,
    transport_m2:8, transport_on:false,
    crane_fixed:3500, crane_on:false,
    blower_fixed:550, blower_on:false,
    decennial_pct:1.2, decennial_on:false,
    contingency_pct:7, contingency_on:false,
    // GLOBALES
    labor_pct:40,
    margin_pct:20,
    iva_pct:10
  };
  const [prices,setPrices]=useState(()=>{
    try{
      const saved=window.localStorage?.getItem("metis_prices")||window.localStorage?.getItem("passiv_prices");
      if(saved){
        const parsed=JSON.parse(saved);
        if(parsed.iva_pct===21)parsed.iva_pct=10;
        // Migrate: ensure all new fields exist with defaults
        return{...DEFAULT_PRICES,...parsed};
      }
    }catch(e){}
    return DEFAULT_PRICES;
  });
  useEffect(()=>{try{window.localStorage?.setItem("metis_prices",JSON.stringify(prices));}catch(e){}},[prices]);
  // Projects
  const [projectsOpen,setProjectsOpen]=useState(false);
  const [projectName,setProjectName]=useState("");
  const [projects,setProjects]=useState(()=>{try{const s=window.localStorage?.getItem("metis_projects")||window.localStorage?.getItem("passiv_projects");return s?JSON.parse(s):[];}catch(e){return[];}});
  useEffect(()=>{try{window.localStorage?.setItem("metis_projects",JSON.stringify(projects));}catch(e){}},[projects]);
  // Client data (for PDF)
  const [clientOpen,setClientOpen]=useState(false);
  const [client,setClient]=useState(()=>{try{const s=window.localStorage?.getItem("metis_client")||window.localStorage?.getItem("passiv_client");return s?JSON.parse(s):{name:"",email:"",phone:"",address:"",notes:""};}catch(e){return{name:"",email:"",phone:"",address:"",notes:""};}});
  useEffect(()=>{try{window.localStorage?.setItem("metis_client",JSON.stringify(client));}catch(e){}},[client]);
  // Templates sheet
  const [templatesOpen,setTemplatesOpen]=useState(false);
  // Measure tool
  const [measureMode,setMeasureMode]=useState(false);
  const [measurePts,setMeasurePts]=useState([]);
  // Show auto dimensions on walls
  const [showDims,setShowDims]=useState(false);
  // Export/Import dialogs
  const [exportOpen,setExportOpen]=useState(false);
  const [exportData,setExportData]=useState("");
  const [importTextOpen,setImportTextOpen]=useState(false);
  const [importText,setImportText]=useState("");
  // Custom panel dialog (for ME-CUSTOM, MI-CUSTOM, etc.)
  const [customOpen,setCustomOpen]=useState(false);
  // Description modal (memoria de calidades)
  const [descKey,setDescKey]=useState(null);
  const [customWidth,setCustomWidth]=useState("1.5");
  const [customAng,setCustomAng]=useState("0");
  const [customPos,setCustomPos]=useState(null); // {px,py} where to place
  const [editingId,setEditingId]=useState(null); // if editing existing

  const cvRef=useRef(null);const t3Box=useRef(null);const t3=useRef({});
  const dr3=useRef(false);const lm3=useRef({x:0,y:0});
  const camA=useRef({theta:Math.PI/4,phi:Math.PI/4,dist:16});
  const compRef=useRef(null);const pinchRef=useRef({d:0,cx:0,cy:0});const touchS=useRef(null);const lpTimer=useRef(null);

  useEffect(()=>{const fn=e=>{if(e.key==="r"||e.key==="R")setRot(r=>(r+90)%180);if(e.key==="Escape"){setSel(null);setSelO(null);setMode("place");setCatOpen(false);setMovingId(null);}};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn);},[]);
  // Native wheel for zoom (passive:false needed)
  useEffect(()=>{const cv=cvRef.current;if(!cv)return;const fn=e=>{e.preventDefault();setZoom(z=>Math.max(.4,Math.min(3,z*(e.deltaY>0?.94:1.06))));};cv.addEventListener("wheel",fn,{passive:false});return()=>cv.removeEventListener("wheel",fn);},[]);

  const curFP=useMemo(()=>placed.filter(p=>p.floor===floor),[placed,floor]);
  const rb0=useMemo(()=>rbCalc(placed,0),[placed]);
  const rb1=useMemo(()=>rbCalc(placed,1),[placed]);
  const glass=useMemo(()=>GLASS.find(g=>g.id===glassType)||GLASS[1],[glassType]);
  // Endpoints of current floor (for hover/click) + ghost endpoints of OTHER floor for snap alignment
  const allEP=useMemo(()=>{
    const pts=[];
    curFP.forEach(p=>{const c=PANELS.find(x=>x.id===p.cid);if(!c)return;const{x2,y2}=pEnd(p,c);pts.push({x:p.gx,y:p.gy,pid:p.id},{x:x2,y:y2,pid:p.id});});
    // When on upper floor, also add ground-floor endpoints as invisible snap targets
    if(floor===1){
      placed.filter(p=>p.floor===0).forEach(p=>{const c=PANELS.find(x=>x.id===p.cid);if(!c)return;const{x2,y2}=pEnd(p,c);pts.push({x:p.gx,y:p.gy,pid:"ghost_"+p.id,ghost:true},{x:x2,y:y2,pid:"ghost_"+p.id,ghost:true});});
    }
    return pts;
  },[curFP,floor,placed]);

  const SNAP_R=1.2;
  const snapPlace=useCallback((rawPx,rawPy,cat,exId)=>{
    const hW=cat.w/2;let cx=rot===0?rawPx-hW:rawPx,cy=rot===0?rawPy:rawPy-hW;
    let gx=sH(cx),gy=sH(cy);
    const myP=rot===0?[{x:gx,y:gy},{x:gx+cat.w,y:gy}]:[{x:gx,y:gy},{x:gx,y:gy+cat.w}];
    let bd=SNAP_R,dx=0,dy=0,snp=false;
    const eps=allEP.filter(e=>e.pid!==exId);
    // Point snap
    myP.forEach(mp=>{eps.forEach(ep=>{const d=Math.hypot(mp.x-ep.x,mp.y-ep.y);if(d<bd){bd=d;dx=ep.x-mp.x;dy=ep.y-mp.y;snp=true;}});});
    // Line snap (only if no point snap)
    if(!snp){myP.forEach(mp=>{eps.forEach(ep=>{
      if(rot===0&&Math.abs(mp.y-ep.y)<.8){dy=ep.y-mp.y;dx=0;snp=true;bd=Math.abs(mp.y-ep.y);}
      if(rot!==0&&Math.abs(mp.x-ep.x)<.8){dx=ep.x-mp.x;dy=0;snp=true;bd=Math.abs(mp.x-ep.x);}
    });});}
    if(snp){gx=sH(gx+dx);gy=sH(gy+dy);}
    return{gx,gy,snapped:snp};
  },[rot,allEP]);

  // ─── ENERGY (FIX: separate roof from floor in losses) ───
  const energy=useMemo(()=>{
    const zd=ZONES.find(zz=>zz.id===zone)||ZONES[9];const gl=glass;
    let eA=0,iA=0,wA=0,dA=0,pc={};
    placed.forEach(p=>{const c=PANELS.find(x=>x.id===p.cid);if(!c)return;pc[c.id]=(pc[c.id]||0)+1;
      const area=effRW(p,c)*WH;let oa=0;(p.ops||[]).forEach(o=>{const oc=OPENS.find(x=>x.id===o.cid);if(!oc)return;const a=oc.rW*oc.h;oa+=a;if(oc.cat==="door")dA+=a;else wA+=a;});
      if(c.cat==="ext")eA+=Math.max(0,area-oa);else if(c.cat==="int")iA+=Math.max(0,area-oa);});
    let rA=0;const rb=rb0||rb1;
    if(rb&&roofType!=="none"){const rw=(rb.x2-rb.x1)*CELL,rh=(rb.y2-rb.y1)*CELL;rA=rw*rh;if(roofType==="gable")rA*=1.15;}
    const nF=placed.some(p=>p.floor===1)?2:1;
    const floorA=Math.max(rA>0?rA*nF:(eA>0?eA*.4:0),1); // total usable floor
    const roofA=rA>0?rA:floorA/nF; // roof = single layer on top
    const groundA=rA>0?rA:floorA/nF; // ground slab = single layer
    // FIX: roof and ground losses only count ONCE, not per floor
    const H_T=eA*.15 + wA*gl.u + dA*1.2 + roofA*.10 + groundA*.15;
    const vol=floorA*WH;const H_V=.34*.4*vol;const H_total=H_T+H_V;
    const cR=compass*Math.PI/180;const sf=.5-.5*Math.cos(cR);
    const shS=Math.max(.2,1-overhang*.5);const shW=Math.max(.85,1-overhang*.1);
    // HEATING
    const Qh=floorA>0?(H_total*zd.hdd*24)/(1000*floorA):0;
    const qSW=floorA>0?(wA*(zd.solN+(zd.solS-zd.solN)*sf)*(gl.g/.5)*shW)/floorA:0;
    const qIW=2.1*8760/1000;const gW=qSW+qIW;const glrW=Qh>0?gW/Qh:99;
    const etaW=glrW<2.5?(1-Math.pow(glrW,4))/(1-Math.pow(glrW,5)):1/glrW;
    const netH=Math.max(0,Qh-gW*Math.max(0,Math.min(1,etaW)));
    // COOLING
    const ssf=.5+.3*Math.cos(cR);const solSg=zd.solSE*ssf+zd.solSS*(1-ssf);
    const qSS=floorA>0?(wA*solSg*(gl.g/.5)*shS)/floorA:0;const qIS=2.1*4380/1000;
    const Qcd=floorA>0?(H_total*zd.cdd*24)/(1000*floorA)*.6:0;
    const ncf=zd.tMax>30?.3:zd.tMax>26?.5:.7;
    const qNC=vol>0?(.34*2*vol*Math.max(0,zd.tMax-18)*60)/(1000*floorA)*ncf:0;
    const netC=Math.max(0,qSS+qIS-Qcd-Math.max(0,qNC));
    const total=netH+netC;
    const rate=v=>{if(v<=15)return"A+";if(v<=25)return"A";if(v<=40)return"B";if(v<=60)return"C";if(v<=90)return"D";if(v<=120)return"E";if(v<=160)return"F";return"G";};
    let rt="G";if(total<=30)rt="A+";else if(total<=50)rt="A";else if(total<=75)rt="B";else if(total<=100)rt="C";else if(total<=150)rt="D";else if(total<=200)rt="E";else if(total<=270)rt="F";
    return{eA,iA,rA,wA,dA,fA:floorA,netH,netC,total,pasH:netH<=15,pasC:netC<=15,pasT:netH<=15&&netC<=15,rt,rtH:rate(netH),rtC:rate(netC),sf,pc,tot:placed.length,zd,numFloors:nF};
  },[placed,compass,rb0,rb1,roofType,zone,glass,overhang]);

  // ─── Canvas helpers ──────────────────────────────
  const getP=useCallback((cx,cy)=>{const cv=cvRef.current;if(!cv)return{px:0,py:0};const r=cv.getBoundingClientRect();
    return{px:((cx-r.left)*(cv.width/r.width)-pan.x)/(G*zoom),py:((cy-r.top)*(cv.height/r.height)-pan.y)/(G*zoom)};},[zoom,pan]);
  const findN=useCallback((px,py)=>{let b=null,bd=2.5/zoom;curFP.forEach(p=>{const c=PANELS.find(x=>x.id===p.cid);if(!c)return;const{x2,y2}=pEnd(p,c);const d=dPS(px,py,p.gx,p.gy,x2,y2);if(d<bd){bd=d;b=p.id;}});return b;},[curFP,zoom]);
  const doFlash=(px,py)=>{setFlash({x:px*G,y:py*G});setTimeout(()=>setFlash(null),350);};

  const [errMsg,setErrMsg]=useState(null);
  const doAction=useCallback((cx,cy)=>{
    try{
    const pos=getP(cx,cy);
    if(measureMode){
      // Snap measure point to nearest endpoint if close, otherwise use raw
      let mx=sH(pos.px),my=sH(pos.py);
      let bestD=1.5;
      allEP.forEach(ep=>{const d=Math.hypot(pos.px-ep.x,pos.py-ep.y);if(d<bestD){bestD=d;mx=ep.x;my=ep.y;}});
      setMeasurePts(pts=>{
        if(pts.length>=2)return[{x:mx,y:my}]; // start fresh on 3rd tap
        return[...pts,{x:mx,y:my}];
      });
      doFlash(mx,my);
      return;
    }
    if(mode==="move"&&movingId){const p=placed.find(x=>x.id===movingId);if(!p){setMovingId(null);setMode("place");return;}const c=PANELS.find(x=>x.id===p.cid);if(!c){setMovingId(null);setMode("place");return;}const{gx,gy}=snapPlace(pos.px,pos.py,c,movingId);setPlaced(pr=>pr.map(pp=>pp.id!==movingId?pp:{...pp,gx,gy}));setMovingId(null);setMode("place");doFlash(gx,gy);}
    else if(mode==="place"&&sel){const c=PANELS.find(x=>x.id===sel);if(!c)return;
      // If it's a custom panel, open the dialog instead of placing directly
      if(c.custom){
        setCustomPos({px:pos.px,py:pos.py});
        setCustomWidth("1.5");
        setCustomAng(c.customAngle?"45":"0");
        setEditingId(null);
        setCustomOpen(true);
        return;
      }
      const{gx,gy}=snapPlace(pos.px,pos.py,c);const newId=`p${++_p}`;setPlaced(pr=>[...pr,{id:newId,cid:sel,gx,gy,rot,ops:[],floor}]);doFlash(gx+(rot===0?c.w/2:0),gy+(rot===0?0:c.w/2));
    }
    else if(mode==="opening"&&selO){const nr=findN(pos.px,pos.py);if(!nr)return;const oc=OPENS.find(x=>x.id===selO);const p=placed.find(x=>x.id===nr);if(!oc||!p)return;const c=PANELS.find(x=>x.id===p.cid);if(!c||oc.rW>c.rW*.95)return;const{x2,y2}=pEnd(p,c);const sL=Math.hypot(x2-p.gx,y2-p.gy);const t=sL>0?((pos.px-p.gx)*(x2-p.gx)+(pos.py-p.gy)*(y2-p.gy))/(sL*sL):.5;const mn=(oc.rW/2)/c.rW;const ct=Math.max(mn+.03,Math.min(1-mn-.03,t));const opId=`o${++_o}`;setPlaced(pr=>pr.map(pp=>pp.id!==nr?pp:{...pp,ops:[...(pp.ops||[]),{id:opId,cid:selO,pos:ct,sw:0}]}));doFlash(pos.px,pos.py);}
    else if(mode==="delete"){const nr=findN(pos.px,pos.py);if(nr){setPlaced(pr=>pr.filter(p=>p.id!==nr));doFlash(pos.px,pos.py);}}
    else if(mode==="place"&&!sel){let f=false;curFP.forEach(p=>{const c=PANELS.find(x=>x.id===p.cid);if(!c)return;const{x2,y2}=pEnd(p,c);(p.ops||[]).forEach(o=>{const oc=OPENS.find(x=>x.id===o.cid);if(!oc||oc.cat!=="door")return;const opx=p.gx+(x2-p.gx)*o.pos,opy=p.gy+(y2-p.gy)*o.pos;if(Math.hypot(pos.px-opx,pos.py-opy)<1.8/zoom&&!f){f=true;setPlaced(pr=>pr.map(pp=>pp.id!==p.id?pp:{...pp,ops:(pp.ops||[]).map(op=>op.id!==o.id?op:{...op,sw:((op.sw||0)+1)%4})}));doFlash(opx,opy);}});});}
    }catch(err){
      console.error("doAction error:",err);
      setErrMsg(String(err?.message||err));
      setTimeout(()=>setErrMsg(null),6000);
      // Reset to safe state
      setMovingId(null);setMode("place");
    }
  },[getP,findN,mode,sel,selO,rot,placed,snapPlace,floor,movingId,curFP,zoom,measureMode,allEP]);

  const lastTouchEnd=useRef(0);
  const onCvMouse=e=>{const pos=getP(e.clientX,e.clientY);setMouse(pos);if(mode!=="place"||movingId)setHov(findN(pos.px,pos.py));};
  const onCvClick=e=>{
    // Ignore synthetic mouse click that fires after touchend on mobile (ghost click)
    if(Date.now()-lastTouchEnd.current<600)return;
    doAction(e.clientX,e.clientY);
  };
  // Touch: 1-finger=tap/drag, 2-finger=pinch zoom + pan
  const onTS=useCallback(e=>{
    if(e.touches.length===1){const t=e.touches[0];touchS.current={x:t.clientX,y:t.clientY,time:Date.now()};const pos=getP(t.clientX,t.clientY);setMouse(pos);if(mode!=="place")setHov(findN(pos.px,pos.py));
      lpTimer.current=setTimeout(()=>{const nr=findN(pos.px,pos.py);if(nr&&!sel&&!selO){setMovingId(nr);setMode("move");if(touchS.current)touchS.current.lp=true;}},600);}
    if(e.touches.length===2){clearTimeout(lpTimer.current);touchS.current=null;
      const t0=e.touches[0],t1=e.touches[1];
      pinchRef.current={d:Math.hypot(t0.pageX-t1.pageX,t0.pageY-t1.pageY),cx:(t0.pageX+t1.pageX)/2,cy:(t0.pageY+t1.pageY)/2};}
  },[getP,findN,mode,sel,selO]);
  const onTM=useCallback(e=>{
    if(e.touches.length===1&&touchS.current){const t=e.touches[0];const pos=getP(t.clientX,t.clientY);setMouse(pos);
      if(mode!=="place"||movingId)setHov(findN(pos.px,pos.py));
      const dd=Math.hypot(t.clientX-touchS.current.x,t.clientY-touchS.current.y);
      if(dd>12){touchS.current.dragged=true;clearTimeout(lpTimer.current);}}
    if(e.touches.length===2){const t0=e.touches[0],t1=e.touches[1];
      const nd=Math.hypot(t0.pageX-t1.pageX,t0.pageY-t1.pageY);
      const ncx=(t0.pageX+t1.pageX)/2,ncy=(t0.pageY+t1.pageY)/2;
      const ratio=nd/pinchRef.current.d;
      // FIX: capture delta BEFORE updating pinchRef to avoid stale read in setState updater
      const panDx=ncx-pinchRef.current.cx,panDy=ncy-pinchRef.current.cy;
      pinchRef.current={d:nd,cx:ncx,cy:ncy};
      setZoom(z=>Math.max(.4,Math.min(3,z*ratio)));
      setPan(p=>({x:p.x+panDx,y:p.y+panDy}));}
  },[getP,findN,mode,movingId]);
  const onTE=useCallback(e=>{e.preventDefault();clearTimeout(lpTimer.current);
    lastTouchEnd.current=Date.now();
    if(touchS.current&&!touchS.current.dragged&&!touchS.current.lp&&Date.now()-touchS.current.time<500)doAction(touchS.current.x,touchS.current.y);
    touchS.current=null;},[doAction]);

  // ─── 2D DRAW ─────────────────────────────────────
  const draw2D=useCallback(()=>{
    const cv=cvRef.current;if(!cv)return;const ctx=cv.getContext("2d");const W=cv.width,H=cv.height;
    ctx.fillStyle="#080c14";ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(pan.x,pan.y);ctx.scale(zoom,zoom);
    // Grid - brighter for daylight visibility
    for(let x=0;x<=GW;x++)for(let y=0;y<=GH;y++){ctx.fillStyle=(x%5===0&&y%5===0)?"#3a5570":"#1a2840";ctx.beginPath();ctx.arc(x*G,y*G,(x%5===0&&y%5===0)?1.6:.8,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle="#5a7a9a";ctx.font="bold 8px sans-serif";
    for(let x=0;x<=GW;x+=5)ctx.fillText(`${(x*CELL).toFixed(1)}m`,x*G+2,10);
    for(let y=5;y<=GH;y+=5)ctx.fillText(`${(y*CELL).toFixed(1)}`,2,y*G-2);
    ctx.fillStyle=floor===0?"#26C6DA":"#FFD54F";ctx.font="bold 11px sans-serif";ctx.fillText(floor===0?"◢ PLANTA BAJA":"◥ PLANTA ALTA",6,CH-6);

    // Ghost of floor below when on upper floor
    if(floor===1){
      const ghostPanels=placed.filter(p=>p.floor===0);
      ctx.save();
      ghostPanels.forEach(p=>{
        const c=PANELS.find(x=>x.id===p.cid);if(!c)return;
        const{x2,y2}=pEnd(p,c);const px1=p.gx*G,py1=p.gy*G,px2=x2*G,py2=y2*G;
        const isH=p.rot===0,thick=c.cat==="ext"?8:4;
        const wx=isH?px1:px1-thick/2,wy=isH?py1-thick/2:py1;
        const ww=isH?px2-px1:thick,wh=isH?thick:py2-py1;
        if(ww<=0||wh<=0)return;
        // Bright high-contrast fill
        ctx.fillStyle=c.cat==="ext"?"#4A90E2":"#7B68EE";
        ctx.globalAlpha=0.55;
        ctx.fillRect(wx,wy,ww,wh);
        // Bright dashed border for visibility
        ctx.globalAlpha=1;
        ctx.strokeStyle="#00E5FF";ctx.lineWidth=1.5;ctx.setLineDash([4,2]);
        ctx.strokeRect(wx,wy,ww,wh);ctx.setLineDash([]);
        // Mark endpoints as snap targets
        [[px1,py1],[px2,py2]].forEach(([ex,ey])=>{
          ctx.fillStyle="#00E5FF";ctx.globalAlpha=0.9;
          ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);ctx.fill();
          ctx.globalAlpha=0.3;
          ctx.beginPath();ctx.arc(ex,ey,6,0,Math.PI*2);ctx.fill();
        });
        ctx.globalAlpha=1;
        // Openings marked in ghost
        (p.ops||[]).forEach(o=>{
          const oc=OPENS.find(x=>x.id===o.cid);if(!oc)return;
          const ox=px1+(px2-px1)*o.pos,oy=py1+(py2-py1)*o.pos;
          const sL=Math.hypot(px2-px1,py2-py1);const ow=(oc.rW/c.rW)*sL;
          ctx.fillStyle=oc.cat==="door"?"#FF6B35":"#00E5FF";
          ctx.globalAlpha=0.7;
          if(isH)ctx.fillRect(ox-ow/2,oy-thick/2-1,ow,thick+2);
          else ctx.fillRect(ox-thick/2-1,oy-ow/2,thick+2,ow);
          ctx.globalAlpha=1;
        });
      });
      ctx.restore();
      // Prominent label
      ctx.fillStyle="#00E5FF";ctx.font="bold 10px monospace";
      ctx.fillText("◆ PLANTA BAJA (fondo)",4,CH-20);
    }

    // Roof projection
    if(rb0&&roofType!=="none"&&floor===0){
      const rb=rb0,rx1=rb.x1*G,ry1=rb.y1*G,rx2=rb.x2*G,ry2=rb.y2*G,rw=rx2-rx1,rh=ry2-ry1;
      const isGb=roofType==="gable",rc2=isGb?"#FFF176":"#A5D6A7";
      ctx.fillStyle=`${rc2}10`;ctx.fillRect(rx1,ry1,rw,rh);
      ctx.strokeStyle=`${rc2}55`;ctx.lineWidth=1.5;if(!isGb)ctx.setLineDash([5,3]);ctx.strokeRect(rx1,ry1,rw,rh);ctx.setLineDash([]);
      if(isGb){ctx.strokeStyle=`${rc2}aa`;ctx.lineWidth=2;if(rw>=rh){ctx.beginPath();ctx.moveTo(rx1+6,ry1+rh/2);ctx.lineTo(rx2-6,ry1+rh/2);ctx.stroke();}else{ctx.beginPath();ctx.moveTo(rx1+rw/2,ry1+6);ctx.lineTo(rx1+rw/2,ry2-6);ctx.stroke();}}
    }

    // Walls
    curFP.forEach(p=>{
      const c=PANELS.find(x=>x.id===p.cid);if(!c)return;
      const ih=hov===p.id,isMov=movingId===p.id;
      const{x2,y2}=pEnd(p,c);const px1=p.gx*G,py1=p.gy*G,px2=x2*G,py2=y2*G;
      const ang=effAng(p,c);
      const isAxial=(ang===0||ang===90);
      const thick=c.cat==="ext"?8:4;
      const len=Math.hypot(px2-px1,py2-py1);
      if(len<=0)return;

      if(isAxial){
        // Original fast path for 0° and 90° walls
        const isH=ang===0;
        const wx=isH?px1:px1-thick/2,wy=isH?py1-thick/2:py1;
        const ww=isH?px2-px1:thick,wh=isH?thick:py2-py1;
        if(ww<=0||wh<=0)return;
        ctx.fillStyle="#00000050";ctx.fillRect(wx+2,wy+2,ww,wh);
        const wg2=isH?ctx.createLinearGradient(wx,wy,wx,wy+wh):ctx.createLinearGradient(wx,wy,wx+ww,wy);
        if(c.cat==="ext"){wg2.addColorStop(0,isMov?"#FFE57F":ih?"#fff8e0":"#E8B480");wg2.addColorStop(.5,isMov?"#FFD54F":ih?"#f0d8a0":"#D49A68");wg2.addColorStop(1,isMov?"#FFC107":ih?"#e8d0a8":"#B8855A");}
        else{wg2.addColorStop(0,isMov?"#FFE57F":ih?"#fff":"#FFCC80");wg2.addColorStop(1,isMov?"#FFC107":ih?"#eee":"#FB8C00");}
        ctx.fillStyle=wg2;const wr=2;
        ctx.beginPath();ctx.moveTo(wx+wr,wy);ctx.lineTo(wx+ww-wr,wy);ctx.arcTo(wx+ww,wy,wx+ww,wy+wr,wr);ctx.lineTo(wx+ww,wy+wh-wr);ctx.arcTo(wx+ww,wy+wh,wx+ww-wr,wy+wh,wr);ctx.lineTo(wx+wr,wy+wh);ctx.arcTo(wx,wy+wh,wx,wy+wh-wr,wr);ctx.lineTo(wx,wy+wr);ctx.arcTo(wx,wy,wx+wr,wy,wr);ctx.closePath();ctx.fill();
        ctx.strokeStyle=isMov?"#FFD54F":ih?"#fff":c.cat==="ext"?"#6B3410":"#E65100";ctx.lineWidth=isMov||ih?2:1.5;ctx.stroke();
        if(c.cat==="ext"){ctx.save();ctx.clip();ctx.strokeStyle="#6B341055";ctx.lineWidth=.8;
          if(isH){const pw=Math.max(4,ww/Math.max(1,Math.round(ww/6)));for(let i=pw;i<ww;i+=pw){ctx.beginPath();ctx.moveTo(wx+i,wy);ctx.lineTo(wx+i,wy+wh);ctx.stroke();}}
          else{const ph=Math.max(4,wh/Math.max(1,Math.round(wh/6)));for(let i=ph;i<wh;i+=ph){ctx.beginPath();ctx.moveTo(wx,wy+i);ctx.lineTo(wx+ww,wy+i);ctx.stroke();}}ctx.restore();}
        [[px1,py1],[px2,py2]].forEach(([ex,ey])=>{ctx.fillStyle=ih?"#fff8":`${c.c}44`;ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);ctx.fill();});
        ctx.fillStyle=ih?"#fff":`${c.c}bb`;ctx.font="bold 6px monospace";ctx.fillText(c.nm,isH?(px1+px2)/2-10:px1+thick/2+3,isH?py1-thick/2-3:py1+10);
        // Openings (axial path unchanged)
        (p.ops||[]).forEach(o=>{const oc=OPENS.find(x=>x.id===o.cid);if(!oc)return;
          const ox=px1+(px2-px1)*o.pos,oy=py1+(py2-py1)*o.pos;const sL=Math.hypot(px2-px1,py2-py1);const ow=(oc.rW/effRW(p,c))*sL;const gc=glass.col;
          if(oc.cat==="door"){ctx.fillStyle="#080c14";if(isH)ctx.fillRect(ox-ow/2,oy-thick/2-1,ow,thick+2);else ctx.fillRect(ox-thick/2-1,oy-ow/2,thick+2,ow);
            ctx.strokeStyle="#6D4C41";ctx.lineWidth=2;if(isH){ctx.beginPath();ctx.moveTo(ox-ow/2,oy);ctx.lineTo(ox+ow/2,oy);ctx.stroke();}else{ctx.beginPath();ctx.moveTo(ox,oy-ow/2);ctx.lineTo(ox,oy+ow/2);ctx.stroke();}
            const sw=o.sw||0,r=ow*.6;if(isH){const hL=sw<2,oD=sw%2===0;const hx=hL?ox-ow/2:ox+ow/2,hy=oD?oy+thick/2+1:oy-thick/2-1;ctx.strokeStyle="#A1887F88";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx,oD?hy+r:hy-r);ctx.stroke();ctx.setLineDash([2,2]);ctx.beginPath();if(hL&&oD)ctx.arc(hx,hy,r,0,Math.PI/2);else if(!hL&&oD)ctx.arc(hx,hy,r,Math.PI/2,Math.PI);else if(hL)ctx.arc(hx,hy,r,-Math.PI/2,0);else ctx.arc(hx,hy,r,Math.PI,Math.PI*1.5);ctx.stroke();ctx.setLineDash([]);}
            else{const hT=sw<2,oR=sw%2===0;const hx=oR?ox+thick/2+1:ox-thick/2-1,hy=hT?oy-ow/2:oy+ow/2;ctx.strokeStyle="#A1887F88";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(oR?hx+r:hx-r,hy);ctx.stroke();ctx.setLineDash([2,2]);ctx.beginPath();if(hT&&oR)ctx.arc(hx,hy,r,0,Math.PI/2);else if(!hT&&oR)ctx.arc(hx,hy,r,-Math.PI/2,0);else if(hT)ctx.arc(hx,hy,r,Math.PI/2,Math.PI);else ctx.arc(hx,hy,r,Math.PI,Math.PI*1.5);ctx.stroke();ctx.setLineDash([]);}
          }else{ctx.fillStyle=`${gc}15`;ctx.strokeStyle=gc;ctx.lineWidth=1.5;
            if(isH){ctx.fillRect(ox-ow/2,oy-thick/2-1,ow,thick+2);ctx.strokeRect(ox-ow/2,oy-thick/2-1,ow,thick+2);ctx.strokeStyle=`${gc}44`;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(ox,oy-thick/2-1);ctx.lineTo(ox,oy+thick/2+1);ctx.stroke();}
            else{ctx.fillRect(ox-thick/2-1,oy-ow/2,thick+2,ow);ctx.strokeRect(ox-thick/2-1,oy-ow/2,thick+2,ow);ctx.strokeStyle=`${gc}44`;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(ox-thick/2-1,oy);ctx.lineTo(ox+thick/2+1,oy);ctx.stroke();}}
        });
      }else{
        // Rotated wall for free angles: draw in rotated canvas space
        ctx.save();
        ctx.translate(px1,py1);
        ctx.rotate(ang*Math.PI/180);
        // Now (0,0) is start, (len,0) is end, with thickness centered at y=0
        ctx.fillStyle="#00000050";ctx.fillRect(2,2-thick/2,len,thick);
        const wg2=ctx.createLinearGradient(0,-thick/2,0,thick/2);
        if(c.cat==="ext"){wg2.addColorStop(0,isMov?"#FFE57F":ih?"#fff8e0":"#E8B480");wg2.addColorStop(.5,isMov?"#FFD54F":ih?"#f0d8a0":"#D49A68");wg2.addColorStop(1,isMov?"#FFC107":ih?"#e8d0a8":"#B8855A");}
        else{wg2.addColorStop(0,isMov?"#FFE57F":ih?"#fff":"#FFCC80");wg2.addColorStop(1,isMov?"#FFC107":ih?"#eee":"#FB8C00");}
        ctx.fillStyle=wg2;
        const wr=2;
        ctx.beginPath();
        ctx.moveTo(wr,-thick/2);
        ctx.lineTo(len-wr,-thick/2);
        ctx.arcTo(len,-thick/2,len,-thick/2+wr,wr);
        ctx.lineTo(len,thick/2-wr);
        ctx.arcTo(len,thick/2,len-wr,thick/2,wr);
        ctx.lineTo(wr,thick/2);
        ctx.arcTo(0,thick/2,0,thick/2-wr,wr);
        ctx.lineTo(0,-thick/2+wr);
        ctx.arcTo(0,-thick/2,wr,-thick/2,wr);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle=isMov?"#FFD54F":ih?"#fff":c.cat==="ext"?"#6B3410":"#E65100";
        ctx.lineWidth=isMov||ih?2:1.5;
        ctx.stroke();
        if(c.cat==="ext"){
          ctx.save();ctx.clip();ctx.strokeStyle="#6B341055";ctx.lineWidth=.8;
          const pw=Math.max(4,len/Math.max(1,Math.round(len/6)));
          for(let i=pw;i<len;i+=pw){ctx.beginPath();ctx.moveTo(i,-thick/2);ctx.lineTo(i,thick/2);ctx.stroke();}
          ctx.restore();
        }
        // Label
        ctx.fillStyle=ih?"#fff":`${c.c}bb`;ctx.font="bold 6px monospace";
        ctx.fillText(`${c.nm} ${Math.round(ang)}°`,len/2-14,-thick/2-3);
        // Openings (rotated)
        (p.ops||[]).forEach(o=>{const oc=OPENS.find(x=>x.id===o.cid);if(!oc)return;
          const ox=len*o.pos;const ow=(oc.rW/effRW(p,c))*len;const gc=glass.col;
          if(oc.cat==="door"){
            ctx.fillStyle="#080c14";ctx.fillRect(ox-ow/2,-thick/2-1,ow,thick+2);
            ctx.strokeStyle="#6D4C41";ctx.lineWidth=2;
            ctx.beginPath();ctx.moveTo(ox-ow/2,0);ctx.lineTo(ox+ow/2,0);ctx.stroke();
          }else{
            ctx.fillStyle=`${gc}15`;ctx.strokeStyle=gc;ctx.lineWidth=1.5;
            ctx.fillRect(ox-ow/2,-thick/2-1,ow,thick+2);
            ctx.strokeRect(ox-ow/2,-thick/2-1,ow,thick+2);
          }
        });
        ctx.restore();
        // Endpoints (back in global space)
        [[px1,py1],[px2,py2]].forEach(([ex,ey])=>{ctx.fillStyle=ih?"#fff8":`${c.c}44`;ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);ctx.fill();});
      }
    });
    // Ghost
    if(sel&&mode==="place"){const c=PANELS.find(x=>x.id===sel);if(c){const{gx,gy,snapped:sn}=snapPlace(mouse.px,mouse.py,c);const ex=gx+(rot===0?c.w:0),ey=gy+(rot===0?0:c.w);const g1=gx*G,g2=gy*G,g3=ex*G,g4=ey*G;const isH2=rot===0,th2=c.cat==="ext"?8:4;const gw=isH2?g1:g1-th2/2,gh=isH2?g2-th2/2:g2,gww=isH2?g3-g1:th2,gwh=isH2?th2:g4-g2;
      ctx.fillStyle=`${c.c}${sn?"44":"22"}`;ctx.fillRect(gw,gh,gww,gwh);ctx.strokeStyle=sn?"#fff":`${c.c}77`;ctx.lineWidth=sn?2:1;ctx.setLineDash([4,3]);ctx.strokeRect(gw,gh,gww,gwh);ctx.setLineDash([]);
      if(sn){[[g1,g2],[g3,g4]].forEach(([ex2,ey2])=>{if(allEP.some(ep=>Math.hypot(ex2/G-ep.x,ey2/G-ep.y)<.4)){ctx.fillStyle="#00E676";ctx.beginPath();ctx.arc(ex2,ey2,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#00E676";ctx.lineWidth=1;ctx.beginPath();ctx.arc(ex2,ey2,8,0,Math.PI*2);ctx.stroke();}});}
    }}
    if(flash){ctx.fillStyle="#00E67633";ctx.beginPath();ctx.arc(flash.x,flash.y,12,0,Math.PI*2);ctx.fill();}

    // Auto dimensions on walls
    if(showDims){
      curFP.forEach(p=>{
        const c=PANELS.find(x=>x.id===p.cid);if(!c||c.cat!=="ext")return;
        const{x2,y2}=pEnd(p,c);const px1=p.gx*G,py1=p.gy*G,px2=x2*G,py2=y2*G;
        const isH=p.rot===0,mx=(px1+px2)/2,my=(py1+py2)/2;
        const dimLen=effRW(p,c).toFixed(2)+"m";
        const offY=isH?-14:0,offX=isH?0:10;
        // Background for text
        ctx.font="bold 9px sans-serif";
        const tw=ctx.measureText(dimLen).width;
        ctx.fillStyle="#FFD54Fee";
        ctx.fillRect(mx+offX-tw/2-3,my+offY-7,tw+6,12);
        ctx.fillStyle="#000";
        ctx.textAlign="center";
        ctx.fillText(dimLen,mx+offX,my+offY+2);
        ctx.textAlign="left";
      });
    }

    // Measure tool
    if(measureMode){
      ctx.save();
      measurePts.forEach((p,i)=>{
        const px=p.x*G,py=p.y*G;
        ctx.fillStyle="#FF6B35";
        ctx.beginPath();ctx.arc(px,py,6,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#fff";ctx.font="bold 9px sans-serif";
        ctx.textAlign="center";
        ctx.fillText(i+1,px,py+3);
        ctx.textAlign="left";
      });
      if(measurePts.length===2){
        const[a,b]=measurePts;
        const ax=a.x*G,ay=a.y*G,bx=b.x*G,by=b.y*G;
        // Dashed line
        ctx.strokeStyle="#FF6B35";ctx.lineWidth=2;ctx.setLineDash([6,4]);
        ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();ctx.setLineDash([]);
        // Distance label
        const mx=(ax+bx)/2,my=(ay+by)/2;
        const distM=Math.hypot(b.x-a.x,b.y-a.y)*CELL;
        const dxM=Math.abs(b.x-a.x)*CELL,dyM=Math.abs(b.y-a.y)*CELL;
        const label=distM.toFixed(2)+"m";
        const subLabel=`(ΔX ${dxM.toFixed(2)} · ΔY ${dyM.toFixed(2)})`;
        ctx.font="bold 11px sans-serif";
        const tw=ctx.measureText(label).width;
        ctx.font="9px sans-serif";
        const sw=ctx.measureText(subLabel).width;
        const bw=Math.max(tw,sw)+14;
        ctx.fillStyle="#FF6B35ee";
        ctx.fillRect(mx-bw/2,my-18,bw,28);
        ctx.fillStyle="#fff";
        ctx.textAlign="center";
        ctx.font="bold 11px sans-serif";
        ctx.fillText(label,mx,my-6);
        ctx.font="9px sans-serif";
        ctx.fillText(subLabel,mx,my+5);
        ctx.textAlign="left";
      }
      ctx.restore();
    }

    ctx.restore();
    // Compass (outside transform)
    const ccx=W-26,ccy=26;ctx.save();ctx.translate(ccx,ccy);ctx.rotate(-(compass*Math.PI)/180+Math.PI);
    ctx.fillStyle="#ef5350";ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(-3,3);ctx.lineTo(3,3);ctx.closePath();ctx.fill();
    ctx.fillStyle="#1a2a3a44";ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(-3,-3);ctx.lineTo(3,-3);ctx.closePath();ctx.fill();
    ctx.restore();ctx.fillStyle="#ef5350";ctx.font="bold 7px monospace";ctx.fillText("N",ccx-2,ccy-15);
    if(zoom!==1){ctx.fillStyle="#fff3";ctx.font="8px monospace";ctx.fillText(`${(zoom*100).toFixed(0)}%`,4,H-4);}
  },[curFP,sel,rot,mouse,compass,hov,mode,rb0,roofType,flash,allEP,snapPlace,floor,movingId,zoom,pan,glass,showDims,measureMode,measurePts,placed]);

  useEffect(()=>{if(!view3D)draw2D();},[draw2D,view3D]);

  // ─── THREE INIT ──────────────────────────────────
  useEffect(()=>{
    const box=t3Box.current;if(!box)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color("#0f1520");scene.fog=new THREE.FogExp2("#0f1520",.025);
    const cam=new THREE.PerspectiveCamera(45,1,.1,200);
    const ren=new THREE.WebGLRenderer({antialias:true});ren.setPixelRatio(Math.min(window.devicePixelRatio,2));
    ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.1;
    box.innerHTML="";box.appendChild(ren.domElement);ren.domElement.style.cssText="width:100%;height:100%;display:block";
    const gnd=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:"#1a2530",roughness:.92}));
    gnd.rotation.x=-Math.PI/2;gnd.position.y=-.02;gnd.receiveShadow=true;scene.add(gnd);
    const grid=new THREE.GridHelper(50,80,"#1a2838","#111c28");grid.material.transparent=true;grid.material.opacity=.4;scene.add(grid);
    scene.add(new THREE.AmbientLight("#4466aa",.35));
    const sun=new THREE.DirectionalLight("#ffecd2",1.6);sun.position.set(6,12,6);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.near=.5;sun.shadow.camera.far=40;
    sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;
    sun.shadow.bias=-.001;scene.add(sun);
    scene.add(new THREE.DirectionalLight("#88aacc",.3));scene.add(new THREE.HemisphereLight("#8cb8d8","#1a2810",.2));
    const woodTex=new THREE.CanvasTexture(makeWoodTex());woodTex.wrapS=woodTex.wrapT=THREE.RepeatWrapping;
    const wg=new THREE.Group();scene.add(wg);
    t3.current={scene,cam,ren,sun,wg,gnd,grid,woodTex};

    const doRz=()=>{const w=box.clientWidth||window.innerWidth,h=box.clientHeight||(window.innerHeight-100);if(w>10&&h>10){cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h);}};
    doRz();setTimeout(doRz,100);window.addEventListener("resize",doRz);

    // Camera update - standalone function, no dependency on drag state
    const updateCam=()=>{
      const s=t3.current;if(!s.cam)return;
      const bc=s._bc||{x:0,z:0},tgt=s._lt||new THREE.Vector3(0,1,0);
      const{theta,phi,dist}=camA.current;
      s.cam.position.set(bc.x+dist*Math.sin(phi)*Math.cos(theta),dist*Math.cos(phi),bc.z+dist*Math.sin(phi)*Math.sin(theta));
      s.cam.lookAt(tgt);
    };

    const el=ren.domElement;
    const md=e=>{dr3.current=true;lm3.current={x:e.clientX||e.pageX,y:e.clientY||e.pageY};};
    const mm=e=>{
      if(!dr3.current)return;
      const cx=e.clientX||e.pageX,cy=e.clientY||e.pageY;
      camA.current.theta-=(cx-lm3.current.x)*.006;
      camA.current.phi=Math.max(.15,Math.min(1.45,camA.current.phi+(cy-lm3.current.y)*.006));
      lm3.current={x:cx,y:cy};
      updateCam();
    };
    const mu=()=>{dr3.current=false;};
    const mw=e=>{camA.current.dist=Math.max(5,Math.min(40,camA.current.dist+e.deltaY*.015));updateCam();};

    el.addEventListener("mousedown",md);el.addEventListener("wheel",mw,{passive:true});
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu);
    el.addEventListener("touchstart",e=>{e.preventDefault();if(e.touches.length===1)md(e.touches[0]);if(e.touches.length===2)pinchRef.current.d=Math.hypot(e.touches[0].pageX-e.touches[1].pageX,e.touches[0].pageY-e.touches[1].pageY);},{passive:false});
    el.addEventListener("touchmove",e=>{e.preventDefault();
      if(e.touches.length===1)mm(e.touches[0]);
      if(e.touches.length===2){const d=Math.hypot(e.touches[0].pageX-e.touches[1].pageX,e.touches[0].pageY-e.touches[1].pageY);camA.current.dist=Math.max(5,Math.min(40,camA.current.dist-(d-pinchRef.current.d)*.04));pinchRef.current.d=d;updateCam();}
    },{passive:false});
    el.addEventListener("touchend",e=>{e.preventDefault();mu();},{passive:false});

    let disposed=false;
    const anim=()=>{if(disposed)return;if(t3.current._autoRot){camA.current.theta+=.003;updateCam();}ren.render(scene,cam);requestAnimationFrame(anim);};
    anim();

    return()=>{disposed=true;window.removeEventListener("resize",doRz);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);if(box.contains(ren.domElement))box.removeChild(ren.domElement);ren.dispose();t3.current={};};
  },[]);
  useEffect(()=>{if(t3.current)t3.current._autoRot=autoRotate;},[autoRotate]);

  // ─── THREE BUILD (FIX: deps include rb1, camera adapts to floors) ───
  useEffect(()=>{const s=t3.current;if(!s.wg)return;const wg=s.wg;while(wg.children.length){const ch=wg.children[0];ch.geometry?.dispose();ch.material?.dispose?.();wg.remove(ch);}const ox=(GW*CELL)/2,oz=(GH*CELL)/2;let bcx=0,bcz=0,bc=0;const nF=placed.some(p=>p.floor===1)?2:1;
    placed.forEach(p=>{const c=PANELS.find(x=>x.id===p.cid);if(!c)return;const{x2,y2}=pEnd(p,c);bcx+=((p.gx+x2)/2)*CELL-ox;bcz+=((p.gy+y2)/2)*CELL-oz;bc++;});if(bc>0){bcx/=bc;bcz/=bc;}
    // FIX: lookAt Y adapts to number of floors
    s._bc={x:bcx,z:bcz};s._lt=new THREE.Vector3(bcx,WH*nF*.45,bcz);
    if(s.gnd)s.gnd.position.set(bcx,-.02,bcz);if(s.grid)s.grid.position.set(bcx,0,bcz);
    if(rb0){const bw=(rb0.x2-rb0.x1)*CELL,bh=(rb0.y2-rb0.y1)*CELL;camA.current.dist=Math.max(8,Math.min(30,Math.max(bw,bh)*1.8+4+nF*2));}
    const{theta,phi,dist}=camA.current;s.cam.position.set(bcx+dist*Math.sin(phi)*Math.cos(theta),dist*Math.cos(phi),bcz+dist*Math.sin(phi)*Math.sin(theta));s.cam.lookAt(s._lt);
    const sa=((compass-180)*Math.PI)/180;s.sun.position.set(bcx+12*Math.sin(sa),12,bcz+12*Math.cos(sa));if(!s.sun.target.parent)s.scene.add(s.sun.target);s.sun.target.position.set(bcx,0,bcz);
    // Floor slab
    if(rb0){const rw2=(rb0.x2-rb0.x1)*CELL,rd2=(rb0.y2-rb0.y1)*CELL,fcx=((rb0.x1+rb0.x2)/2)*CELL-ox,fcz=((rb0.y1+rb0.y2)/2)*CELL-oz;const fl=new THREE.Mesh(new THREE.BoxGeometry(rw2-.2,.12,rd2-.2),new THREE.MeshStandardMaterial({color:"#2a3540",roughness:.85}));fl.position.set(fcx,-.06,fcz);fl.receiveShadow=true;wg.add(fl);}
    // Walls all floors
    placed.forEach(p=>{
      const c=PANELS.find(x=>x.id===p.cid);if(!c)return;
      const flY=p.floor*WH;
      const{x2,y2}=pEnd(p,c);
      const wx1=p.gx*CELL-ox,wz1=p.gy*CELL-oz,wx2=x2*CELL-ox,wz2=y2*CELL-oz;
      const len=effRW(p,c);
      const ang=effAng(p,c);
      const th=c.th;
      if(!len)return;
      let wm;
      if(c.cat==="ext"&&s.woodTex){const tex=s.woodTex.clone();tex.needsUpdate=true;tex.repeat.set(len/1.2,WH/1.2);wm=new THREE.MeshStandardMaterial({map:tex,roughness:.75,color:"#D4A05A"});}
      else wm=new THREE.MeshStandardMaterial({color:c.c,roughness:.6});
      // Wall as box: width=len along local X, depth=th along local Z, height=WH along Y
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(len,WH,th),wm);
      mesh.position.set((wx1+wx2)/2,flY+WH/2,(wz1+wz2)/2);
      // In 3D, Y is up. 2D x→3D x, 2D y→3D z. Angle around Y axis, sign flipped because z grows "down" in 2D→3D mapping.
      mesh.rotation.y=-ang*Math.PI/180;
      mesh.castShadow=true;mesh.receiveShadow=true;
      wg.add(mesh);
      // Openings
      (p.ops||[]).forEach(o=>{
        const oc=OPENS.find(x=>x.id===o.cid);if(!oc)return;
        const opx=wx1+(wx2-wx1)*o.pos,opz=wz1+(wz2-wz1)*o.pos;
        const ow2=oc.rW,oh=oc.h,opy=flY+(oc.cat==="door"?oh/2:1.2);
        // Openings need to rotate with wall too — create them as groups rotated around local y
        const grp=new THREE.Group();
        grp.position.set(opx,opy,opz);
        grp.rotation.y=-ang*Math.PI/180;
        // Local axis: X = wall length direction, Z = wall thickness
        const cut=new THREE.Mesh(new THREE.BoxGeometry(ow2*1.02,oh*1.02,th*1.3),new THREE.MeshStandardMaterial({color:"#080c14"}));
        grp.add(cut);
        const pan=new THREE.Mesh(new THREE.BoxGeometry(ow2*.94,oh*.94,.04),new THREE.MeshStandardMaterial({color:oc.cat==="door"?"#5D4037":glass.col,transparent:oc.cat==="window",opacity:oc.cat==="window"?.25:1,roughness:oc.cat==="window"?.02:.55}));
        grp.add(pan);
        const fc=oc.cat==="door"?"#795548":"#B0BEC5",ft=.04;
        [[ow2/2,ft,ft,[0,oh/2,0]],[ow2/2,ft,ft,[0,-oh/2,0]],[ft,oh/2,th*.5,[-ow2/2,0,0]],[ft,oh/2,th*.5,[ow2/2,0,0]]].forEach(([fw,fh,fd,fp])=>{
          const fm=new THREE.Mesh(new THREE.BoxGeometry(fw*2,fh*2,fd*2),new THREE.MeshStandardMaterial({color:fc,roughness:.35}));
          fm.position.set(fp[0],fp[1],fp[2]);
          grp.add(fm);
        });
        wg.add(grp);
      });
    });
    // Inter-floor slab
    if(nF>1&&rb0){const rw2=(rb0.x2-rb0.x1)*CELL,rd2=(rb0.y2-rb0.y1)*CELL,fcx=((rb0.x1+rb0.x2)/2)*CELL-ox,fcz=((rb0.y1+rb0.y2)/2)*CELL-oz;const fs=new THREE.Mesh(new THREE.BoxGeometry(rw2-.1,.15,rd2-.1),new THREE.MeshStandardMaterial({color:"#37474F",roughness:.7}));fs.position.set(fcx,WH,fcz);wg.add(fs);}
    // Roof
    const topH=nF>1?WH*2:WH;const rb=rb0;
    if(rb&&roofType!=="none"){const realW=(rb.x2-rb.x1)*CELL,realD=(rb.y2-rb.y1)*CELL;if(realW>.1&&realD>.1){const cx2=((rb.x1+rb.x2)/2)*CELL-ox,cz2=((rb.y1+rb.y2)/2)*CELL-oz;
      if(roofType==="gable"){const hw=realW/2,hd=realD/2,pH=Math.min(realW,realD)*.22,rX=realW>=realD;const pos=[];const aT=(a,b,cc)=>{pos.push(...a,...b,...cc);};if(rX){const bl=[-hw,0,-hd],br=[hw,0,-hd],fr=[hw,0,hd],fl=[-hw,0,hd],rl=[-hw,pH,0],rr=[hw,pH,0];aT(bl,br,rr);aT(bl,rr,rl);aT(fl,rl,rr);aT(fl,rr,fr);aT(bl,rl,fl);aT(br,fr,rr);aT(bl,fl,fr);aT(bl,fr,br);}else{const bl=[-hw,0,-hd],br=[hw,0,-hd],fr=[hw,0,hd],fl=[-hw,0,hd],rf=[0,pH,hd],rb2=[0,pH,-hd];aT(bl,rb2,rf);aT(bl,rf,fl);aT(br,rf,rb2);aT(br,fr,rf);aT(fl,rf,fr);aT(bl,br,rb2);aT(bl,fl,fr);aT(bl,fr,br);}const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(new Float32Array(pos),3));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:"#B87333",roughness:.55,side:THREE.DoubleSide}));mesh.position.set(cx2,topH,cz2);mesh.castShadow=true;wg.add(mesh);const rg=rX?new THREE.BoxGeometry(realW+.08,.07,.07):new THREE.BoxGeometry(.07,.07,realD+.08);const ridge=new THREE.Mesh(rg,new THREE.MeshStandardMaterial({color:"#8B5E3C",roughness:.6}));ridge.position.set(cx2,topH+pH,cz2);wg.add(ridge);
      }else{const slab=new THREE.Mesh(new THREE.BoxGeometry(realW,.18,realD),new THREE.MeshStandardMaterial({color:"#7CB342",roughness:.5,transparent:true,opacity:.88}));slab.position.set(cx2,topH+.09,cz2);slab.castShadow=true;wg.add(slab);}}}
    if(s.ren&&t3Box.current){const bx=t3Box.current,w=bx.clientWidth||window.innerWidth,h=bx.clientHeight||(window.innerHeight-100);if(w>10&&h>10){s.cam.aspect=w/h;s.cam.updateProjectionMatrix();s.ren.setSize(w,h);}}
  },[placed,compass,rb0,rb1,roofType,glass]); // FIX: added rb1

  // Compass
  const hcm=useCallback(e=>{if(!dragC||!compRef.current)return;const r=compRef.current.getBoundingClientRect();const cx2=(e.clientX??e.touches?.[0]?.clientX)-r.left-r.width/2;const cy2=(e.clientY??e.touches?.[0]?.clientY)-r.top-r.height/2;setCompass(((Math.atan2(cx2,-cy2)*180/Math.PI)+360)%360);},[dragC]);
  useEffect(()=>{const u=()=>setDragC(false);window.addEventListener("mousemove",hcm);window.addEventListener("mouseup",u);window.addEventListener("touchmove",hcm,{passive:true});window.addEventListener("touchend",u);return()=>{window.removeEventListener("mousemove",hcm);window.removeEventListener("mouseup",u);window.removeEventListener("touchmove",hcm);window.removeEventListener("touchend",u);};},[hcm]);

  const pickP=id=>{setSel(id);setSelO(null);setMode("place");setCatOpen(false);setMovingId(null);};
  const pickO=id=>{setSelO(id);setSel(null);setMode("opening");setCatOpen(false);setMovingId(null);};
  const rc={"A+":"#00E676",A:"#66BB6A",B:"#9CCC65",C:"#FFEE58",D:"#FFA726",E:"#FF7043",F:"#EF5350",G:"#B71C1C"};
  const cycleRoof=()=>setRoofType(t=>t==="none"?"flat":t==="flat"?"gable":"none");

  // Confirm custom panel dialog — either creates new or updates existing
  const confirmCustom=()=>{
    const w=parseFloat(customWidth);
    if(!w||w<=0||w>20){setErrMsg("Ancho inválido (0.1–20 m)");setTimeout(()=>setErrMsg(null),3000);return;}
    const c=PANELS.find(x=>x.id===sel)||(editingId?PANELS.find(x=>x.id===placed.find(p=>p.id===editingId)?.cid):null);
    if(!c){setCustomOpen(false);return;}
    const ang=c.customAngle?parseFloat(customAng):(rot||0);
    if(c.customAngle&&(isNaN(ang)||ang<-360||ang>360)){setErrMsg("Ángulo inválido (-360 a 360)");setTimeout(()=>setErrMsg(null),3000);return;}
    if(editingId){
      // Update existing
      setPlaced(pr=>pr.map(p=>p.id!==editingId?p:{...p,cW:w,...(c.customAngle?{cA:ang}:{})}));
      setEditingId(null);
    }else if(customPos){
      // Create new
      const gx=sH(customPos.px),gy=sH(customPos.py);
      const newId=`p${++_p}`;
      const newP={id:newId,cid:sel,gx,gy,rot:c.customAngle?0:(rot||0),ops:[],floor,cW:w};
      if(c.customAngle)newP.cA=ang;
      setPlaced(pr=>[...pr,newP]);
      doFlash(gx,gy);
    }
    setCustomOpen(false);setCustomPos(null);
  };
  // Open dialog to edit an existing custom panel
  const editCustom=(pid)=>{
    const p=placed.find(x=>x.id===pid);if(!p)return;
    const c=PANELS.find(x=>x.id===p.cid);if(!c||!c.custom)return;
    setSel(p.cid);
    setCustomWidth(String(p.cW!==undefined?p.cW:c.rW));
    setCustomAng(String(p.cA!==undefined?p.cA:0));
    setCustomPos(null);
    setEditingId(pid);
    setCustomOpen(true);
  };

  // ─── Project management ───
  const saveProject=()=>{
    const nm=(projectName||"").trim();if(!nm){setErrMsg("Pon un nombre al proyecto");setTimeout(()=>setErrMsg(null),3000);return;}
    const proj={id:Date.now()+"",name:nm,date:new Date().toISOString(),placed,compass,roofType,zone,glassType,overhang,floor:0,client:{...client}};
    setProjects(ps=>{const ex=ps.findIndex(p=>p.name===nm);if(ex>=0){const c2=[...ps];c2[ex]=proj;return c2;}return[...ps,proj];});
    setErrMsg(null);alert(`✓ Proyecto "${nm}" guardado`);
  };
  const loadProject=(proj)=>{
    setPlaced(proj.placed||[]);setCompass(proj.compass||180);setRoofType(proj.roofType||"flat");setZone(proj.zone||"D3");setGlassType(proj.glassType||"tri");setOverhang(proj.overhang!==undefined?proj.overhang:.6);setFloor(0);setProjectName(proj.name||"");if(proj.client)setClient(proj.client);
    setProjectsOpen(false);
  };
  const deleteProject=(id)=>{if(confirm("¿Eliminar este proyecto?"))setProjects(ps=>ps.filter(p=>p.id!==id));};
  const loadTemplate=(tpl)=>{
    _p=0;_o=0;
    const newPlaced=tpl.walls.map(w=>{
      const ops=(w.ops||[]).map(o=>({id:`o${++_o}`,cid:o.cid,pos:o.pos,sw:0}));
      return{id:`p${++_p}`,cid:w.cid,gx:w.gx,gy:w.gy,rot:w.rot,ops,floor:w.floor||0};
    });
    setPlaced(newPlaced);setTemplatesOpen(false);setCatOpen(false);setSel(null);setSelO(null);setMode("place");setFloor(0);
  };
  const exportProject=async()=>{
    const data={name:projectName||"metis-design",placed,compass,roofType,zone,glassType,overhang,client,prices,date:new Date().toISOString()};
    const json=JSON.stringify(data,null,2);
    // Try Web Share API first (best on mobile - opens native share sheet)
    if(navigator.share){
      try{
        const file=new File([json],`${(projectName||"metis-design").replace(/[^a-z0-9]/gi,"_")}.json`,{type:"application/json"});
        if(navigator.canShare&&navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:projectName||"Proyecto METIS"});
          return;
        }
      }catch(e){/* user cancelled or not supported - fall through */}
    }
    // Try clipboard
    try{
      await navigator.clipboard.writeText(json);
      setExportData(json);setExportOpen(true);
    }catch(e){
      // Fallback: show the JSON so user can copy manually
      setExportData(json);setExportOpen(true);
    }
  };
  const importProject=(e)=>{
    const f=e.target.files?.[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{const data=JSON.parse(ev.target.result);loadProject(data);if(data.prices)setPrices(data.prices);alert("✓ Proyecto importado");}
      catch(err){setErrMsg("Archivo no válido");setTimeout(()=>setErrMsg(null),3000);}
    };
    reader.readAsText(f);
    e.target.value="";
  };
  const importFromText=()=>{
    try{
      const data=JSON.parse(importText);
      loadProject(data);if(data.prices)setPrices(data.prices);
      setImportText("");setImportTextOpen(false);setProjectsOpen(false);
      alert("✓ Proyecto importado");
    }catch(err){setErrMsg("JSON no válido");setTimeout(()=>setErrMsg(null),3000);}
  };

  const budget=useMemo(()=>{
    let items=[],matBase=0;
    const optionals=[];// {id, label, qty, unit, cost, included}
    const excluded=[];// items not included (for PDF note)
    // CORE: walls
    const byRef={};
    placed.forEach(pp=>{
      const c=PANELS.find(x=>x.id===pp.cid);if(!c)return;
      const ml=effRW(pp,c);
      if(!byRef[pp.cid])byRef[pp.cid]={n:0,totalML:0,cat:c.cat};
      byRef[pp.cid].n++;
      byRef[pp.cid].totalML+=ml;
    });
    Object.entries(byRef).forEach(([id,info])=>{
      const unitPrice=info.cat==="ext"?prices.ext_ml:prices.int_ml;
      const cost=info.totalML*unitPrice;
      items.push({id,n:info.n,ml:info.totalML,unit:unitPrice,cost,cat:info.cat});
      matBase+=cost;
    });
    // CORE: roof
    const roofCost=energy.rA*prices.roof_m2;
    matBase+=roofCost;
    // Constructed area for area-based optional partidas
    const builtArea=energy.fA;// includes both floors
    const planArea=energy.fA/energy.numFloors;
    // OPTIONAL: helper to add optional item
    const addOpt=(key,label,qty,unitLabel,cost,extra)=>{
      const enabled=!!prices[key+"_on"];
      const obj={key,label,qty,unitLabel,cost,enabled,...extra};
      if(enabled){optionals.push(obj);matBase+=cost;}
      else excluded.push(obj);
    };
    // Cimentación / solera
    addOpt("floor","Cimentación / solera",planArea,"m²",planArea*prices.floor_m2,{unit:prices.floor_m2});
    // Carpintería (puertas + ventanas)
    let wC=0,dC=0,wArea=0;
    placed.forEach(p=>(p.ops||[]).forEach(o=>{
      const oc=OPENS.find(x=>x.id===o.cid);if(!oc)return;
      if(oc.cat==="window"){wC++;wArea+=oc.rW*oc.h;}
      else dC++;
    }));
    const carpCost=(wArea*prices.window_m2)+(dC*prices.door_ud);
    addOpt("carp",`Carpinterías (${dC} puertas, ${wC} ventanas)`,wArea.toFixed(1),"m² + ud",carpCost,{wC,dC,wArea});
    // Instalaciones
    addOpt("install","Instalaciones (eléctrica, fontanería, climatización, ventilación)",builtArea,"m²",builtArea*prices.install_m2,{unit:prices.install_m2});
    // Acabados
    addOpt("finish","Acabados interiores (pavimentos, alicatados, pintura, sanitarios)",builtArea,"m²",builtArea*prices.finish_m2,{unit:prices.finish_m2});
    // Cocina
    addOpt("kitchen","Cocina y mobiliario fijo",1,"ud",prices.kitchen_fixed,{});
    // Proyecto técnico
    addOpt("project","Proyecto técnico + dirección de obra",builtArea,"m²",builtArea*prices.project_m2,{unit:prices.project_m2});
    // Licencias (% sobre el material base actual antes de añadir esta)
    const baseForLicense=matBase;
    addOpt("license","Licencias y tasas municipales",1,`% (${prices.license_pct}%)`,baseForLicense*(prices.license_pct/100),{});
    // Estudio geotécnico
    addOpt("geo","Estudio geotécnico y topográfico",1,"fijo",prices.geo_fixed,{});
    // Transporte
    addOpt("transport","Transporte de paneles a obra",builtArea,"m²",builtArea*prices.transport_m2,{unit:prices.transport_m2});
    // Grúa / medios auxiliares
    addOpt("crane","Medios auxiliares (grúa, andamios)",1,"fijo",prices.crane_fixed,{});
    // Blower door
    addOpt("blower","Ensayo blower door",1,"ud",prices.blower_fixed,{});
    // Seguro decenal (% sobre material base actual)
    const baseForDecennial=matBase;
    addOpt("decennial","Seguro decenal",1,`% (${prices.decennial_pct}%)`,baseForDecennial*(prices.decennial_pct/100),{});
    // Imprevistos (% sobre material base actual)
    const baseForContingency=matBase;
    addOpt("contingency","Imprevistos",1,`% (${prices.contingency_pct}%)`,baseForContingency*(prices.contingency_pct/100),{});
    // Labor, margin, IVA
    const labor=matBase*(prices.labor_pct/100);
    const subtotal=matBase+labor;
    const margin=subtotal*(prices.margin_pct/100);
    const beforeIVA=subtotal+margin;
    const iva=beforeIVA*(prices.iva_pct/100);
    const total=beforeIVA+iva;
    return{items,roofCost,matBase,labor,subtotal,margin,beforeIVA,iva,total,optionals,excluded,
      // Legacy compat
      winCount:wC,doorCount:dC,winCost:wArea*prices.window_m2,doorCost:dC*prices.door_ud,floorCost:planArea*prices.floor_m2};
  },[placed,prices,energy.rA,energy.fA,energy.numFloors]);

  return(
    <div style={{width:"100%",height:"100vh",background:"#0a0f18",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",color:"#d8e2ee",overflow:"hidden",position:"relative",userSelect:"none",WebkitUserSelect:"none"}}>
      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 12px",background:"linear-gradient(180deg,#111a2e,#0c1420)",borderBottom:"1px solid #1a2540",flexShrink:0,zIndex:20,gap:5,minHeight:48,flexWrap:"wrap",boxShadow:"0 2px 10px #0006"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src={LOGO_URL} alt="METIS" width="34" height="34" style={{flexShrink:0,borderRadius:6}}/>
          <span style={{fontSize:16,fontWeight:900,color:"#B5C5A3",letterSpacing:1.5}}>METIS</span>
          <button onClick={()=>setProjectsOpen(true)} title="Mis proyectos" style={{background:"#B5C5A31c",border:"1.5px solid #B5C5A355",borderRadius:8,color:"#B5C5A3",fontSize:11,fontWeight:700,padding:"5px 9px",cursor:"pointer"}}>📁 {projectName?projectName.substring(0,10):"Nuevo"}</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <button onClick={()=>setZoneOpen(true)} style={{background:"#26C6DA1c",border:"1.5px solid #26C6DA55",borderRadius:8,color:"#26C6DA",fontSize:10,fontWeight:700,padding:"5px 10px",cursor:"pointer"}}>📍 {zone}</button>
          <button onClick={cycleRoof} style={{background:"#ffffff10",border:"1.5px solid #ffffff2a",borderRadius:8,color:roofType==="gable"?"#E8D44D":roofType==="flat"?"#7CB342":"#78909C",fontSize:11,fontWeight:700,padding:"5px 9px",cursor:"pointer"}}>{roofType==="none"?"—":roofType==="flat"?"⌂":"△"}</button>
          <select value={glassType} onChange={e=>setGlassType(e.target.value)} style={{background:"#0a1018",border:"1.5px solid #26C6DA55",borderRadius:8,color:"#26C6DA",fontSize:10,padding:"5px 6px",cursor:"pointer",fontWeight:600}}>{GLASS.map(g=><option key={g.id} value={g.id}>{g.nm}</option>)}</select>
          <div style={{width:34,height:34,borderRadius:8,background:`${rc[energy.rt]}22`,border:`2.5px solid ${rc[energy.rt]}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:rc[energy.rt],boxShadow:`0 0 12px ${rc[energy.rt]}44`}}>{energy.rt}</div>
          <div style={{textAlign:"right",lineHeight:1.1}}><div style={{fontSize:13,fontWeight:800,color:energy.pasT?"#00E676":"#FF7043"}}>{energy.total.toFixed(1)}</div><div style={{fontSize:8,color:"#5a7a9a",letterSpacing:.3}}>kWh/m²a</div></div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <div style={{width:"100%",height:"100%",overflow:"hidden",display:view3D?"none":"flex",alignItems:"center",justifyContent:"center",background:"#060a12",touchAction:"none"}}>
          <canvas ref={cvRef} width={CW} height={CH} onClick={onCvClick} onMouseMove={onCvMouse} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
            style={{cursor:mode==="delete"?"crosshair":mode==="move"?"grab":sel?"crosshair":"default",maxWidth:"100%",maxHeight:"100%",touchAction:"none"}} />
        </div>
        <div ref={t3Box} style={{width:"100%",height:"100%",touchAction:"none",display:view3D?"block":"none"}} />

        {(sel||selO||mode==="move")&&!view3D&&(
          <div style={{position:"absolute",top:5,left:"50%",transform:"translateX(-50%)",background:"#0c1220ee",borderRadius:18,padding:"5px 14px",fontSize:11,zIndex:10,display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(8px)"}}>
            {mode==="move"?<span style={{color:"#FFD54F",fontWeight:700}}>✋ Toca destino</span>:<span style={{color:sel?PANELS.find(x=>x.id===sel)?.c:OPENS.find(x=>x.id===selO)?.c,fontWeight:700}}>{sel||selO}</span>}
            {mode==="place"&&sel&&<span style={{fontSize:9,color:"#5a7a9a"}}>{rot===0?"H":"V"}</span>}
            <button onClick={()=>{setSel(null);setSelO(null);setMode("place");setMovingId(null);}} style={{background:"none",border:"1px solid #fff3",borderRadius:12,color:"#aaa",fontSize:10,padding:"1px 7px",cursor:"pointer"}}>✕</button>
          </div>)}

        {measureMode&&!view3D&&(
          <div style={{position:"absolute",top:5,left:"50%",transform:"translateX(-50%)",background:"#FF6B35ee",borderRadius:18,padding:"6px 14px",fontSize:11,zIndex:10,display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(8px)",color:"#fff",fontWeight:700}}>
            <span>📏 {measurePts.length===0?"Toca el punto inicial":measurePts.length===1?"Toca el punto final":"Toca para medir otra distancia"}</span>
            {measurePts.length>0&&<button onClick={()=>setMeasurePts([])} style={{background:"#ffffff22",border:"1px solid #ffffff66",borderRadius:12,color:"#fff",fontSize:10,padding:"2px 8px",cursor:"pointer",fontWeight:700}}>↺</button>}
            <button onClick={()=>{setMeasureMode(false);setMeasurePts([]);}} style={{background:"#00000033",border:"1px solid #ffffff55",borderRadius:12,color:"#fff",fontSize:10,padding:"2px 8px",cursor:"pointer",fontWeight:700}}>✕</button>
          </div>)}

        <div style={{position:"absolute",top:5,right:5,zIndex:15,display:"flex",flexDirection:"column",gap:4}}>
          {!view3D&&sel&&<button onClick={()=>setRot(r=>(r+90)%180)} style={{background:"#0c1220ee",border:"1px solid #00E67644",borderRadius:10,color:"#00E676",fontSize:13,fontWeight:700,padding:"8px 12px",cursor:"pointer",minWidth:42,minHeight:42}}>↻</button>}
          {!view3D&&hov&&(()=>{const hp=placed.find(x=>x.id===hov);const hc=hp&&PANELS.find(x=>x.id===hp.cid);return hc&&hc.custom;})()&&<button onClick={()=>editCustom(hov)} title="Editar medida/ángulo" style={{background:"#0c1220ee",border:"1.5px solid #CE93D866",borderRadius:10,color:"#CE93D8",fontSize:13,fontWeight:700,padding:"8px 12px",cursor:"pointer",minWidth:42,minHeight:42}}>✎</button>}
          <button onClick={()=>{setView3D(v=>!v);setAutoRotate(false);}} style={{background:"#0c1220ee",border:"1px solid #42A5F544",borderRadius:10,color:"#42A5F5",fontSize:13,fontWeight:700,padding:"8px 12px",cursor:"pointer",minWidth:42,minHeight:42}}>{view3D?"2D":"3D"}</button>
          {view3D&&<button onClick={()=>setAutoRotate(v=>!v)} style={{background:autoRotate?"#FFD54F22":"#0c1220ee",border:`1px solid ${autoRotate?"#FFD54F":"#fff2"}`,borderRadius:10,color:autoRotate?"#FFD54F":"#888",fontSize:12,padding:"8px 12px",cursor:"pointer",minWidth:42,minHeight:42}}>⟳</button>}
          {!view3D&&<button onClick={()=>{setMeasureMode(v=>!v);setMeasurePts([]);setSel(null);setSelO(null);setMode("place");}} title="Medir distancia" style={{background:measureMode?"#FF6B3522":"#0c1220ee",border:`1.5px solid ${measureMode?"#FF6B35":"#FF6B3544"}`,borderRadius:10,color:measureMode?"#FF6B35":"#FF8A65",fontSize:13,fontWeight:700,padding:"8px 12px",cursor:"pointer",minWidth:42,minHeight:42}}>📏</button>}
          {!view3D&&<button onClick={()=>setShowDims(v=>!v)} title="Mostrar cotas" style={{background:showDims?"#FFD54F22":"#0c1220ee",border:`1.5px solid ${showDims?"#FFD54F":"#FFD54F44"}`,borderRadius:10,color:showDims?"#FFD54F":"#FFECB3",fontSize:11,fontWeight:700,padding:"8px 10px",cursor:"pointer",minWidth:42,minHeight:42}}>⊨</button>}
        </div>

        {!view3D&&<div style={{position:"absolute",top:5,left:5,zIndex:15,display:"flex",gap:3}}>{[0,1].map(f=><button key={f} onClick={()=>setFloor(f)} style={{background:floor===f?"#26C6DA22":"#0c1220ee",border:`1.5px solid ${floor===f?"#26C6DA":"#fff1"}`,borderRadius:8,color:floor===f?"#26C6DA":"#5a7a9a",fontSize:9,fontWeight:700,padding:"6px 10px",cursor:"pointer"}}>{f===0?"PB":"PA"}</button>)}</div>}

        {!view3D&&<div style={{position:"absolute",bottom:52,right:5,zIndex:15}}>
          <div ref={compRef} onMouseDown={()=>setDragC(true)} onTouchStart={()=>setDragC(true)} style={{width:48,height:48,borderRadius:"50%",border:"2px solid #1a2a3a",background:"#0c1220ee",position:"relative",cursor:"grab"}}>
            {["N","E","S","O"].map((d,i)=>(<span key={d} style={{position:"absolute",fontSize:7,fontWeight:d==="N"?700:400,color:d==="N"?"#ef5350":"#2a4055",top:i===0?2:i===2?"auto":"50%",bottom:i===2?2:"auto",left:i===3?4:i===1?"auto":"50%",right:i===1?4:"auto",transform:(i===0||i===2)?"translateX(-50%)":"translateY(-50%)"}}>{d}</span>))}
            <div style={{position:"absolute",top:"50%",left:"50%",width:2,height:18,background:"linear-gradient(#ef5350 50%,#2a4055 50%)",borderRadius:1,transform:`translate(-50%,-50%) rotate(${compass}deg)`,transformOrigin:"center",transition:dragC?"none":"transform .15s"}} />
          </div>
          <div style={{textAlign:"center",fontSize:7,color:"#3a5a70",marginTop:1}}>{Math.round(compass)}°</div>
        </div>}

        {!view3D&&<div style={{position:"absolute",bottom:52,left:5,zIndex:15,background:"#0c1220dd",borderRadius:8,padding:"4px 8px"}}>
          <div style={{fontSize:7,color:"#3a5a70",marginBottom:2}}>Voladizo {overhang.toFixed(1)}m</div>
          <input type="range" min="0" max="1.5" step="0.1" value={overhang} onChange={e=>setOverhang(+e.target.value)} style={{width:70,height:4,appearance:"none",background:"#1a2a3a",borderRadius:2,outline:"none",cursor:"pointer"}} />
        </div>}
      </div>

      {/* BOTTOM */}
      <div style={{flexShrink:0,background:"#0a0f18",borderTop:"1px solid #182030",zIndex:20}}>
        <button onClick={()=>setInfoOpen(v=>!v)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"4px 6px",background:"none",border:"none",cursor:"pointer"}}>
          <St l="Ext" v={`${energy.eA.toFixed(0)}`} c="#C8956C"/><St l="V" v={`${energy.wA.toFixed(0)}`} c={glass.col}/>
          <St l="🔥" v={`${energy.netH.toFixed(0)}`} c={energy.pasH?"#00E676":"#FF7043"}/><St l="❄" v={`${energy.netC.toFixed(0)}`} c={energy.pasC?"#00E676":"#42A5F5"}/>
          <St l="☀" v={`${(energy.sf*100).toFixed(0)}%`} c={energy.sf>.6?"#FFD54F":"#FF8A65"}/>
          {energy.pasT&&<span style={{fontSize:9,color:"#00E676",fontWeight:700}}>✓PH</span>}
          <span style={{fontSize:9,color:"#2a4055"}}>{infoOpen?"▾":"▴"}</span>
        </button>
        {infoOpen&&(<div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"6px 10px",justifyContent:"center"}}>
          <St l="Ext" v={`${energy.eA.toFixed(1)}m²`} c="#C8956C"/><St l="Int" v={`${energy.iA.toFixed(1)}m²`} c="#FFA726"/><St l="Cub" v={`${energy.rA.toFixed(1)}m²`} c="#7CB342"/>
          <St l="Vent" v={`${energy.wA.toFixed(1)}m² U=${glass.u}`} c={glass.col}/><St l="Suelo" v={`${energy.fA.toFixed(1)}m² ×${energy.numFloors}`} c="#78909C"/>
          <St l="🔥Cal" v={`${energy.netH.toFixed(1)} ${energy.rtH}`} c={energy.pasH?"#00E676":"#FF7043"}/><St l="❄Ref" v={`${energy.netC.toFixed(1)} ${energy.rtC}`} c={energy.pasC?"#00E676":"#42A5F5"}/>
          <St l="TOTAL" v={`${energy.total.toFixed(1)}`} c={energy.pasT?"#00E676":"#FF7043"}/><St l="Zona" v={`${energy.zd.z} ${energy.zd.tMax}°C`} c="#26C6DA"/>
        </div>)}
        <div style={{display:"flex",alignItems:"stretch",borderBottom:"1px solid #131c2e"}}>
          <TB ic="👤" l="Cliente" a={clientOpen} c="#26C6DA" fn={()=>{setClientOpen(true);}}/>
          <TB ic="📐" l="Plantillas" a={templatesOpen} c="#CE93D8" fn={()=>{setTemplatesOpen(true);}}/>
          <TB ic="💰" l="Presup." a={budgetOpen} c="#FFD54F" fn={()=>{setBudgetOpen(v=>!v);setCatOpen(false);}}/>
          <TB ic="📄" l="PDF" c="#00E676" fn={()=>exportPDF(energy,budget,glass,placed,compass,roofType,overhang,cvRef,client,prices,projectName)}/>
        </div>
        <div style={{display:"flex",alignItems:"stretch"}}>
          <TB ic="☰" l="Paneles" a={catOpen} c="#42A5F5" fn={()=>{setCatOpen(v=>!v);setBudgetOpen(false);}}/>
          <TB ic="↩" l="Deshacer" c="#5a7a9a" fn={()=>setPlaced(p=>p.slice(0,-1))}/>
          <TB ic="✕" l="Borrar" a={mode==="delete"} c="#ef5350" fn={()=>{setMode(mode==="delete"?"place":"delete");setSel(null);setSelO(null);setMovingId(null);}}/>
          <TB ic="🗑" l="Nuevo" c="#FF7043" fn={()=>{if(confirm("¿Empezar un diseño nuevo? Se perderá lo no guardado"))setPlaced([]);}}/>
        </div>
      </div>

      {/* CATALOG */}
      {catOpen&&(<div style={{position:"absolute",bottom:96,left:0,right:0,maxHeight:"50vh",background:"#0b1018f5",borderTop:"1px solid #1a2535",backdropFilter:"blur(14px)",zIndex:25,display:"flex",flexDirection:"column",borderRadius:"14px 14px 0 0",boxShadow:"0 -6px 30px #000a"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"6px 0 2px"}}><div style={{width:32,height:4,borderRadius:2,background:"#2a3a4a"}}/></div>
        <div style={{display:"flex",borderBottom:"1px solid #1a2535",flexShrink:0,padding:"0 4px"}}>{[{id:"ext",l:"Ext",ic:"▐"},{id:"int",l:"Int",ic:"▌"},{id:"doors",l:"Puertas",ic:"🚪"},{id:"wins",l:"Ventanas",ic:"☐"}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 2px",border:"none",borderBottom:tab===t.id?"2px solid #42A5F5":"2px solid transparent",background:"none",color:tab===t.id?"#42A5F5":"#3a5a70",cursor:"pointer",fontSize:9,fontWeight:600,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:14}}>{t.ic}</span><span>{t.l}</span></button>))}</div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:8,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:6}}>
          {tab==="doors"?OPENS.filter(o=>o.cat==="door").map(o=><CC key={o.id} a={selO===o.id} c={o.c} fn={()=>pickO(o.id)} nm={o.nm} dt={`${(o.rW*100).toFixed(0)}×${(o.h*100).toFixed(0)}cm`}/>):
           tab==="wins"?OPENS.filter(o=>o.cat==="window").map(o=><CC key={o.id} a={selO===o.id} c={glass.col} fn={()=>pickO(o.id)} nm={o.nm} dt={`${(o.rW*100).toFixed(0)}×${(o.h*100).toFixed(0)}cm`}/>):
           PANELS.filter(p=>p.cat===tab).map(p=><CC key={p.id} a={sel===p.id} c={p.c} fn={()=>pickP(p.id)} nm={p.nm} dt={`${(p.rW*100).toFixed(0)}cm · U=${p.u}`}/>)}
        </div>
      </div>)}

      {/* BUDGET */}
      {budgetOpen&&(<div style={{position:"absolute",bottom:96,left:0,right:0,maxHeight:"62vh",background:"linear-gradient(180deg,#0f1626f8,#0a1018f8)",borderTop:"2px solid #FFD54F55",backdropFilter:"blur(20px)",zIndex:25,display:"flex",flexDirection:"column",borderRadius:"16px 16px 0 0",boxShadow:"0 -8px 40px #000c"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"7px 0 3px"}}><div style={{width:40,height:4,borderRadius:2,background:"#3a4a5a"}}/></div>
        <div style={{padding:"6px 16px 10px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#FFD54F",letterSpacing:.3}}>💰 Presupuesto</div>
            <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>Basado en tus precios</div>
          </div>
          <button onClick={()=>{setBudgetOpen(false);setPricesOpen(true);}} style={{background:"#FFD54F22",border:"1px solid #FFD54F66",borderRadius:8,color:"#FFD54F",fontSize:10,fontWeight:700,padding:"6px 10px",cursor:"pointer"}}>⚙ Ajustar</button>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"10px 16px"}}>
          <div style={{fontSize:9,color:"#B5C5A3",letterSpacing:1,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>◈ Núcleo (siempre incluido)</div>
          {budget.items.map(it=>(
            <div key={it.id} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"5px 0",fontSize:11,borderBottom:"1px solid #0f1a25"}}>
              <span style={{color:it.cat==="ext"?"#D4A05A":"#FFA726"}}>{it.id}</span>
              <span style={{color:"#5a7a9a",fontSize:9,flex:1,textAlign:"center"}}>{it.ml.toFixed(1)}ml · {it.unit}€/ml</span>
              <span style={{color:"#e0e8f0",fontWeight:700}}>{it.cost.toFixed(0)}€</span>
            </div>
          ))}
          {budget.roofCost>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"5px 0",fontSize:11,borderBottom:"1px solid #0f1a25"}}><span style={{color:"#7CB342"}}>Cubierta + hermeticidad</span><span style={{color:"#5a7a9a",fontSize:9}}>{energy.rA.toFixed(1)}m² · {prices.roof_m2}€/m²</span><span style={{color:"#e0e8f0",fontWeight:700}}>{budget.roofCost.toFixed(0)}€</span></div>}

          {budget.optionals.length>0&&<>
            <div style={{fontSize:9,color:"#CE93D8",letterSpacing:1,textTransform:"uppercase",margin:"12px 0 6px",fontWeight:700}}>✓ Opcionales incluidas</div>
            {budget.optionals.map(o=>(
              <div key={o.key} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"5px 0",fontSize:11,borderBottom:"1px solid #0f1a25"}}>
                <span style={{color:"#CE93D8",flex:1,paddingRight:6,fontSize:10}}>{o.label}</span>
                <span style={{color:"#e0e8f0",fontWeight:700}}>{o.cost.toFixed(0)}€</span>
              </div>
            ))}
          </>}

          <BRow l="Material total" v={budget.matBase} c="#B0BEC5" bold/>
          <BRow l={`Mano de obra (${prices.labor_pct}%)`} v={budget.labor} c="#80CBC4"/>
          <BRow l="Coste ejecución" v={budget.subtotal} c="#B0BEC5" bold/>
          <BRow l={`Margen (${prices.margin_pct}%)`} v={budget.margin} c="#81C784"/>
          <BRow l="Subtotal" v={budget.beforeIVA} c="#B0BEC5" bold/>
          <BRow l={`IVA (${prices.iva_pct}%)`} v={budget.iva} c="#FFB74D"/>
          <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 4px",fontSize:15,fontWeight:800,color:"#FFD54F",borderTop:"2px solid #FFD54F44",marginTop:6}}>
            <span>TOTAL</span><span>{budget.total.toFixed(0)}€</span>
          </div>

          {budget.excluded.length>0&&<div style={{marginTop:12,padding:"10px 12px",background:"#FF7B5022",border:"1px solid #FF7B5066",borderRadius:8}}>
            <div style={{fontSize:10,color:"#FF8A65",fontWeight:700,marginBottom:4,letterSpacing:.5,textTransform:"uppercase"}}>⚠ Partidas NO incluidas en este presupuesto</div>
            <div style={{fontSize:9,color:"#FFB199",lineHeight:1.5}}>{budget.excluded.map(e=>e.label).join(" · ")}</div>
            <div style={{fontSize:9,color:"#FFB199",marginTop:6,fontStyle:"italic"}}>El cliente debe presupuestar estas partidas aparte (con otros equipos o contigo si lo activas en ⚙ Ajustar).</div>
          </div>}

          <div style={{fontSize:9,color:"#5a7a9a",marginTop:8,fontStyle:"italic"}}>💡 Toca ⚙ Ajustar para incluir/excluir partidas.</div>
        </div>
      </div>)}

      {/* DESCRIPTION MODAL (memoria de calidades) */}
      {descKey&&DESCRIPTIONS[descKey]&&(<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:50}}>
        <div onClick={()=>setDescKey(null)} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000d",backdropFilter:"blur(8px)"}}/>
        <div style={{position:"relative",margin:"60px auto 0",width:"94%",maxWidth:480,maxHeight:"82vh",background:"linear-gradient(180deg,#0f1626,#0a1018)",border:"2px solid #42A5F566",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 50px #000e"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#42A5F508"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:9,color:"#5a7a9a",letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>ℹ Memoria de calidades</div>
              <div style={{fontSize:14,fontWeight:800,color:"#42A5F5",marginTop:3,lineHeight:1.2}}>{DESCRIPTIONS[descKey].title}</div>
            </div>
            <button onClick={()=>setDescKey(null)} style={{background:"none",border:"1.5px solid #ffffff33",borderRadius:10,color:"#aaa",fontSize:14,padding:"4px 10px",cursor:"pointer",fontWeight:700,marginLeft:8,flexShrink:0}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"16px 20px"}}>
            <div style={{fontSize:13,color:"#d8e2ee",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{DESCRIPTIONS[descKey].text}</div>
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid #1a2535",fontSize:9,color:"#5a7a9a",fontStyle:"italic",textAlign:"center"}}>Esta descripción aparecerá en el anexo "Memoria de calidades" del PDF generado</div>
        </div>
      </div>)}

      {/* CUSTOM PANEL DIALOG */}
      {customOpen&&(()=>{
        const c=sel?PANELS.find(x=>x.id===sel):null;
        const isEdit=!!editingId;
        const showAngle=c&&c.customAngle;
        return(
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:40}}>
          <div onClick={()=>{setCustomOpen(false);setCustomPos(null);setEditingId(null);}} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000d",backdropFilter:"blur(8px)"}}/>
          <div style={{position:"relative",margin:"60px auto 0",width:"94%",maxWidth:380,background:"linear-gradient(180deg,#0f1626,#0a1018)",border:"2px solid #CE93D866",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 50px #000e"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#CE93D808"}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#CE93D8"}}>{isEdit?"✎ Editar muro":"✎ Muro personalizado"}</div>
                <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>{c?c.nm:""}</div>
              </div>
              <button onClick={()=>{setCustomOpen(false);setCustomPos(null);setEditingId(null);}} style={{background:"none",border:"1.5px solid #ffffff33",borderRadius:10,color:"#aaa",fontSize:14,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>✕</button>
            </div>
            <div style={{padding:"18px",display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <div style={{fontSize:11,color:"#b0c4d4",fontWeight:600,marginBottom:6}}>Ancho (metros)</div>
                <input type="number" step="0.05" min="0.1" max="20" value={customWidth} onChange={e=>setCustomWidth(e.target.value)} style={{width:"100%"}} autoFocus/>
                <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                  {[0.6,0.9,1.2,1.5,1.8,2.4,3.0,3.6].map(w=>(
                    <button key={w} onClick={()=>setCustomWidth(String(w))} style={{background:customWidth===String(w)?"#CE93D822":"#0a1018",border:`1px solid ${customWidth===String(w)?"#CE93D8":"#2a3a50"}`,borderRadius:6,color:customWidth===String(w)?"#CE93D8":"#7a9ab0",fontSize:10,fontWeight:600,padding:"4px 8px",cursor:"pointer"}}>{w}m</button>
                  ))}
                </div>
              </div>
              {showAngle&&(
                <div>
                  <div style={{fontSize:11,color:"#b0c4d4",fontWeight:600,marginBottom:6}}>Ángulo (grados)</div>
                  <input type="number" step="1" min="-360" max="360" value={customAng} onChange={e=>setCustomAng(e.target.value)} style={{width:"100%"}}/>
                  <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                    {[0,30,45,60,90,120,135,150].map(a=>(
                      <button key={a} onClick={()=>setCustomAng(String(a))} style={{background:customAng===String(a)?"#CE93D822":"#0a1018",border:`1px solid ${customAng===String(a)?"#CE93D8":"#2a3a50"}`,borderRadius:6,color:customAng===String(a)?"#CE93D8":"#7a9ab0",fontSize:10,fontWeight:600,padding:"4px 8px",cursor:"pointer"}}>{a}°</button>
                    ))}
                  </div>
                  <div style={{fontSize:9,color:"#5a7a9a",marginTop:4}}>0° = horizontal, 90° = vertical</div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={()=>{setCustomOpen(false);setCustomPos(null);setEditingId(null);}} style={{flex:1,background:"#78909C22",border:"1.5px solid #78909C66",borderRadius:10,color:"#90A4AE",fontSize:12,fontWeight:700,padding:"10px",cursor:"pointer"}}>Cancelar</button>
                <button onClick={confirmCustom} style={{flex:2,background:"#CE93D822",border:"1.5px solid #CE93D8",borderRadius:10,color:"#CE93D8",fontSize:12,fontWeight:700,padding:"10px",cursor:"pointer"}}>{isEdit?"✓ Actualizar":"✓ Colocar muro"}</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* PRICES EDITOR */}
      {pricesOpen&&(<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:35}}>
        <div onClick={()=>setPricesOpen(false)} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000c",backdropFilter:"blur(6px)"}} />
        <div style={{position:"relative",margin:"30px auto 0",width:"94%",maxWidth:480,maxHeight:"88vh",background:"linear-gradient(180deg,#0f1626,#0a1018)",border:"2px solid #FFD54F44",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 50px #000e"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FFD54F08"}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#FFD54F",letterSpacing:.3}}>⚙ Precios y Partidas</div>
              <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>Núcleo siempre incluido. Opcionales con check on/off.</div>
            </div>
            <button onClick={()=>setPricesOpen(false)} style={{background:"none",border:"1.5px solid #ffffff33",borderRadius:10,color:"#aaa",fontSize:14,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"10px 16px"}}>
            <div style={{fontSize:9,color:"#B5C5A3",letterSpacing:1,textTransform:"uppercase",margin:"4px 0 6px",fontWeight:700,padding:"6px 10px",background:"#1F3A2622",borderRadius:6,border:"1px solid #B5C5A344"}}>◈ Núcleo (siempre incluido)</div>
            <PRow l="Muro exterior entramado ligero Passivhaus" u="€/ml" v={prices.ext_ml} fn={v=>setPrices(p=>({...p,ext_ml:v}))} onInfo={()=>setDescKey("ext_ml")}/>
            <PRow l="Muro interior estructura" u="€/ml" v={prices.int_ml} fn={v=>setPrices(p=>({...p,int_ml:v}))} onInfo={()=>setDescKey("int_ml")}/>
            <PRow l="Cubierta + hermeticidad" u="€/m²" v={prices.roof_m2} fn={v=>setPrices(p=>({...p,roof_m2:v}))} onInfo={()=>setDescKey("roof_m2")}/>

            <div style={{fontSize:9,color:"#CE93D8",letterSpacing:1,textTransform:"uppercase",margin:"14px 0 6px",fontWeight:700,padding:"6px 10px",background:"#AB47BC22",borderRadius:6,border:"1px solid #CE93D844"}}>☐ Partidas opcionales (marca para incluir)</div>
            <OptRow l="Cimentación / solera" u="€/m²" v={prices.floor_m2} fn={v=>setPrices(p=>({...p,floor_m2:v}))} on={prices.floor_on} ofn={()=>setPrices(p=>({...p,floor_on:!p.floor_on}))} onInfo={()=>setDescKey("floor")}/>
            <OptRow l="Carpinterías exteriores" u="puerta €/ud · vent. €/m²" v={prices.window_m2} v2={prices.door_ud} fn={v=>setPrices(p=>({...p,window_m2:v}))} fn2={v=>setPrices(p=>({...p,door_ud:v}))} on={prices.carp_on} ofn={()=>setPrices(p=>({...p,carp_on:!p.carp_on}))} dual onInfo={()=>setDescKey("carp")}/>
            <OptRow l="Instalaciones (eléct., fontan., climat., MVHR)" u="€/m² construido" v={prices.install_m2} fn={v=>setPrices(p=>({...p,install_m2:v}))} on={prices.install_on} ofn={()=>setPrices(p=>({...p,install_on:!p.install_on}))} onInfo={()=>setDescKey("install")}/>
            <OptRow l="Acabados interiores" u="€/m² construido" v={prices.finish_m2} fn={v=>setPrices(p=>({...p,finish_m2:v}))} on={prices.finish_on} ofn={()=>setPrices(p=>({...p,finish_on:!p.finish_on}))} onInfo={()=>setDescKey("finish")}/>
            <OptRow l="Cocina y mobiliario fijo" u="€ fijo" v={prices.kitchen_fixed} fn={v=>setPrices(p=>({...p,kitchen_fixed:v}))} on={prices.kitchen_on} ofn={()=>setPrices(p=>({...p,kitchen_on:!p.kitchen_on}))} onInfo={()=>setDescKey("kitchen")}/>
            <OptRow l="Proyecto técnico + dirección de obra" u="€/m² construido" v={prices.project_m2} fn={v=>setPrices(p=>({...p,project_m2:v}))} on={prices.project_on} ofn={()=>setPrices(p=>({...p,project_on:!p.project_on}))} onInfo={()=>setDescKey("project")}/>
            <OptRow l="Licencias y tasas municipales" u="% sobre material" v={prices.license_pct} fn={v=>setPrices(p=>({...p,license_pct:v}))} on={prices.license_on} ofn={()=>setPrices(p=>({...p,license_on:!p.license_on}))} onInfo={()=>setDescKey("license")}/>
            <OptRow l="Estudio geotécnico y topográfico" u="€ fijo" v={prices.geo_fixed} fn={v=>setPrices(p=>({...p,geo_fixed:v}))} on={prices.geo_on} ofn={()=>setPrices(p=>({...p,geo_on:!p.geo_on}))} onInfo={()=>setDescKey("geo")}/>
            <OptRow l="Transporte de paneles a obra" u="€/m² construido" v={prices.transport_m2} fn={v=>setPrices(p=>({...p,transport_m2:v}))} on={prices.transport_on} ofn={()=>setPrices(p=>({...p,transport_on:!p.transport_on}))} onInfo={()=>setDescKey("transport")}/>
            <OptRow l="Medios auxiliares (grúa, andamios)" u="€ fijo" v={prices.crane_fixed} fn={v=>setPrices(p=>({...p,crane_fixed:v}))} on={prices.crane_on} ofn={()=>setPrices(p=>({...p,crane_on:!p.crane_on}))} onInfo={()=>setDescKey("crane")}/>
            <OptRow l="Ensayo blower door" u="€ fijo" v={prices.blower_fixed} fn={v=>setPrices(p=>({...p,blower_fixed:v}))} on={prices.blower_on} ofn={()=>setPrices(p=>({...p,blower_on:!p.blower_on}))} onInfo={()=>setDescKey("blower")}/>
            <OptRow l="Seguro decenal" u="% sobre material" v={prices.decennial_pct} fn={v=>setPrices(p=>({...p,decennial_pct:v}))} on={prices.decennial_on} ofn={()=>setPrices(p=>({...p,decennial_on:!p.decennial_on}))} onInfo={()=>setDescKey("decennial")}/>
            <OptRow l="Imprevistos" u="% sobre material" v={prices.contingency_pct} fn={v=>setPrices(p=>({...p,contingency_pct:v}))} on={prices.contingency_on} ofn={()=>setPrices(p=>({...p,contingency_on:!p.contingency_on}))} onInfo={()=>setDescKey("contingency")}/>

            <div style={{fontSize:9,color:"#FFD54F",letterSpacing:1,textTransform:"uppercase",margin:"14px 0 6px",fontWeight:700,padding:"6px 10px",background:"#FFD54F1c",borderRadius:6,border:"1px solid #FFD54F44"}}>% Globales (sobre el subtotal)</div>
            <PRow l="Mano de obra" u="% sobre material" v={prices.labor_pct} fn={v=>setPrices(p=>({...p,labor_pct:v}))}/>
            <PRow l="Margen comercial" u="% sobre subtotal" v={prices.margin_pct} fn={v=>setPrices(p=>({...p,margin_pct:v}))}/>
            <PRow l="IVA obra nueva" u="% (10% general · 4% VPO · 21% otros)" v={prices.iva_pct} fn={v=>setPrices(p=>({...p,iva_pct:v}))}/>

            <button onClick={()=>{if(confirm("¿Restaurar precios por defecto? Las partidas opcionales se desmarcarán."))setPrices(DEFAULT_PRICES);}} style={{width:"100%",marginTop:16,marginBottom:6,padding:"10px",background:"#FF524022",border:"1px solid #FF524066",borderRadius:10,color:"#FF7043",fontSize:11,fontWeight:700,cursor:"pointer"}}>↺ Restaurar por defecto</button>
          </div>
        </div>
      </div>)}

      {/* PROJECTS MANAGER */}
      {projectsOpen&&(<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:35}}>
        <div onClick={()=>setProjectsOpen(false)} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000c",backdropFilter:"blur(6px)"}}/>
        <div style={{position:"relative",margin:"44px auto 0",width:"94%",maxWidth:440,maxHeight:"82vh",background:"linear-gradient(180deg,#0f1626,#0a1018)",border:"2px solid #42A5F544",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 50px #000e"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#42A5F508"}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#42A5F5"}}>📁 Mis proyectos</div>
              <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>{projects.length} guardado{projects.length!==1?"s":""} en este dispositivo</div>
            </div>
            <button onClick={()=>setProjectsOpen(false)} style={{background:"none",border:"1.5px solid #ffffff33",borderRadius:10,color:"#aaa",fontSize:14,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #1a2535",display:"flex",gap:6}}>
            <input type="text" placeholder="Nombre del proyecto..." value={projectName} onChange={e=>setProjectName(e.target.value)} style={{flex:1}}/>
            <button onClick={saveProject} style={{background:"#00E67622",border:"1.5px solid #00E676",borderRadius:8,color:"#00E676",fontSize:12,fontWeight:700,padding:"0 14px",cursor:"pointer",whiteSpace:"nowrap"}}>💾 Guardar</button>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"8px 12px"}}>
            {projects.length===0?
              <div style={{textAlign:"center",padding:"30px 10px",color:"#5a7a9a",fontSize:11}}>
                <div style={{fontSize:30,marginBottom:8}}>📂</div>
                Todavía no hay proyectos guardados.<br/>Escribe un nombre y pulsa "Guardar".
              </div>
              :projects.slice().reverse().map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",padding:"10px 12px",border:"1px solid #1a2535",borderRadius:10,marginBottom:6,background:"#0a1018"}}>
                  <div style={{flex:1,minWidth:0}} onClick={()=>loadProject(p)}>
                    <div style={{fontSize:12,fontWeight:700,color:"#d8e2ee",cursor:"pointer",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                    <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>{new Date(p.date).toLocaleDateString("es-ES")} · {(p.placed||[]).length} muros · Zona {p.zone}</div>
                  </div>
                  <button onClick={()=>loadProject(p)} style={{background:"#42A5F522",border:"1px solid #42A5F566",borderRadius:6,color:"#42A5F5",fontSize:10,padding:"5px 10px",marginRight:4,cursor:"pointer",fontWeight:600}}>Abrir</button>
                  <button onClick={()=>deleteProject(p.id)} style={{background:"#EF535022",border:"1px solid #EF535066",borderRadius:6,color:"#EF5350",fontSize:10,padding:"5px 8px",cursor:"pointer"}}>🗑</button>
                </div>
              ))}
          </div>
          <div style={{padding:"10px 16px",borderTop:"1px solid #1a2535",display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={exportProject} style={{flex:"1 1 45%",background:"#FFD54F14",border:"1px solid #FFD54F44",borderRadius:8,color:"#FFD54F",fontSize:10,fontWeight:700,padding:"8px",cursor:"pointer"}}>📤 Compartir / Copiar</button>
            <button onClick={()=>setImportTextOpen(true)} style={{flex:"1 1 45%",background:"#26C6DA14",border:"1px solid #26C6DA44",borderRadius:8,color:"#26C6DA",fontSize:10,fontWeight:700,padding:"8px",cursor:"pointer"}}>📥 Pegar JSON</button>
            <label style={{flex:"1 1 100%",background:"#78909C14",border:"1px solid #78909C44",borderRadius:8,color:"#90A4AE",fontSize:10,fontWeight:700,padding:"8px",cursor:"pointer",textAlign:"center"}}>
              📁 Importar archivo JSON
              <input type="file" accept=".json,application/json" onChange={importProject} style={{display:"none"}}/>
            </label>
          </div>
        </div>
      </div>)}

      {/* CLIENT FORM */}
      {clientOpen&&(<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:35}}>
        <div onClick={()=>setClientOpen(false)} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000c",backdropFilter:"blur(6px)"}}/>
        <div style={{position:"relative",margin:"44px auto 0",width:"94%",maxWidth:440,maxHeight:"82vh",background:"linear-gradient(180deg,#0f1626,#0a1018)",border:"2px solid #26C6DA44",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 50px #000e"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#26C6DA08"}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#26C6DA"}}>👤 Datos del cliente</div>
              <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>Aparecerán en el PDF que genere el cliente</div>
            </div>
            <button onClick={()=>setClientOpen(false)} style={{background:"none",border:"1.5px solid #ffffff33",borderRadius:10,color:"#aaa",fontSize:14,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px 18px",display:"flex",flexDirection:"column",gap:10}}>
            <CField l="Nombre completo" v={client.name} fn={v=>setClient(c=>({...c,name:v}))} ph="Juan Pérez"/>
            <CField l="Email" v={client.email} fn={v=>setClient(c=>({...c,email:v}))} ph="juan@email.com" type="email"/>
            <CField l="Teléfono" v={client.phone} fn={v=>setClient(c=>({...c,phone:v}))} ph="+34 600 000 000" type="tel"/>
            <CField l="Dirección de la parcela" v={client.address} fn={v=>setClient(c=>({...c,address:v}))} ph="Calle, Ciudad"/>
            <div>
              <div style={{fontSize:10,color:"#b0c4d4",fontWeight:600,marginBottom:4}}>Notas del proyecto</div>
              <textarea value={client.notes} onChange={e=>setClient(c=>({...c,notes:e.target.value}))} placeholder="Observaciones, requisitos especiales..." rows={3} style={{width:"100%",background:"#0a1018",border:"1.5px solid #2a3a50",color:"#e0e8f0",padding:"8px 10px",borderRadius:8,fontSize:16,fontFamily:"inherit",outline:"none",resize:"vertical"}}/>
            </div>
            <button onClick={()=>{setClient({name:"",email:"",phone:"",address:"",notes:""});}} style={{padding:"8px",background:"#FF524022",border:"1px solid #FF524066",borderRadius:8,color:"#FF7043",fontSize:10,fontWeight:700,cursor:"pointer",marginTop:6}}>↺ Limpiar datos</button>
          </div>
        </div>
      </div>)}

      {/* TEMPLATES */}
      {templatesOpen&&(<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:35}}>
        <div onClick={()=>setTemplatesOpen(false)} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000c",backdropFilter:"blur(6px)"}}/>
        <div style={{position:"relative",margin:"44px auto 0",width:"94%",maxWidth:440,maxHeight:"82vh",background:"linear-gradient(180deg,#0f1626,#0a1018)",border:"2px solid #AB47BC44",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 50px #000e"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#AB47BC08"}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#CE93D8"}}>📐 Plantillas</div>
              <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>Diseños prediseñados para empezar rápido</div>
            </div>
            <button onClick={()=>setTemplatesOpen(false)} style={{background:"none",border:"1.5px solid #ffffff33",borderRadius:10,color:"#aaa",fontSize:14,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px"}}>
            {placed.length>0&&<div style={{padding:"8px 10px",background:"#FF524015",border:"1px solid #FF524044",borderRadius:8,fontSize:10,color:"#FF7043",marginBottom:10}}>⚠ Cargar una plantilla reemplazará el diseño actual</div>}
            {TEMPLATES.map(tpl=>(
              <button key={tpl.id} onClick={()=>{if(placed.length===0||confirm("¿Reemplazar diseño actual?"))loadTemplate(tpl);}} style={{width:"100%",display:"flex",alignItems:"center",padding:"12px 14px",border:"1.5px solid #2a3a50",borderRadius:12,background:"linear-gradient(180deg,#0f1626,#0a1018)",marginBottom:8,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:50,height:50,borderRadius:10,background:"#AB47BC18",border:"1.5px solid #AB47BC44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginRight:12,color:"#CE93D8"}}>{tpl.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#d8e2ee"}}>{tpl.nm}</div>
                  <div style={{fontSize:10,color:"#5a7a9a",marginTop:2}}>{tpl.dt}</div>
                </div>
                <div style={{color:"#CE93D8",fontSize:14}}>▶</div>
              </button>
            ))}
          </div>
        </div>
      </div>)}

      {/* EXPORT TEXT DIALOG */}
      {exportOpen&&(<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:40}}>
        <div onClick={()=>setExportOpen(false)} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000d",backdropFilter:"blur(8px)"}}/>
        <div style={{position:"relative",margin:"30px auto 0",width:"94%",maxWidth:460,maxHeight:"88vh",background:"linear-gradient(180deg,#0f1626,#0a1018)",border:"2px solid #FFD54F44",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 50px #000e"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FFD54F08"}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#FFD54F"}}>📤 Compartir proyecto</div>
              <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>✓ Copiado al portapapeles. Pégalo donde quieras:</div>
            </div>
            <button onClick={()=>setExportOpen(false)} style={{background:"none",border:"1.5px solid #ffffff33",borderRadius:10,color:"#aaa",fontSize:14,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
          <div style={{padding:"14px 16px 8px",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={async()=>{try{await navigator.clipboard.writeText(exportData);alert("✓ Copiado de nuevo");}catch(e){}}} style={{flex:"1 1 auto",background:"#42A5F522",border:"1.5px solid #42A5F566",borderRadius:10,color:"#42A5F5",fontSize:11,fontWeight:700,padding:"10px 14px",cursor:"pointer"}}>📋 Copiar de nuevo</button>
              <a href={`mailto:?subject=${encodeURIComponent("METIS · "+(projectName||"proyecto"))}&body=${encodeURIComponent(exportData)}`} style={{flex:"1 1 auto",background:"#00E67622",border:"1.5px solid #00E67666",borderRadius:10,color:"#00E676",fontSize:11,fontWeight:700,padding:"10px 14px",cursor:"pointer",textDecoration:"none",textAlign:"center"}}>✉ Email</a>
              <a href={`https://wa.me/?text=${encodeURIComponent("Proyecto METIS:\n\n"+exportData)}`} target="_blank" rel="noopener" style={{flex:"1 1 auto",background:"#25D36622",border:"1.5px solid #25D36666",borderRadius:10,color:"#25D366",fontSize:11,fontWeight:700,padding:"10px 14px",cursor:"pointer",textDecoration:"none",textAlign:"center"}}>💬 WhatsApp</a>
            </div>
            <div style={{fontSize:9,color:"#5a7a9a",padding:"0 2px"}}>Si los botones no funcionan, selecciona el texto y cópialo manualmente:</div>
          </div>
          <div style={{flex:1,padding:"0 16px 16px",display:"flex"}}>
            <textarea value={exportData} readOnly onFocus={e=>e.target.select()} style={{flex:1,width:"100%",background:"#0a1018",border:"1.5px solid #2a3a50",color:"#b0c4d4",padding:"10px",borderRadius:8,fontSize:16,fontFamily:"monospace",outline:"none",resize:"none",minHeight:180}}/>
          </div>
        </div>
      </div>)}

      {/* IMPORT TEXT DIALOG */}
      {importTextOpen&&(<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:40}}>
        <div onClick={()=>setImportTextOpen(false)} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000d",backdropFilter:"blur(8px)"}}/>
        <div style={{position:"relative",margin:"30px auto 0",width:"94%",maxWidth:460,maxHeight:"88vh",background:"linear-gradient(180deg,#0f1626,#0a1018)",border:"2px solid #26C6DA44",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 50px #000e"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2535",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#26C6DA08"}}>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#26C6DA"}}>📥 Pegar JSON</div>
              <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>Pega aquí el código del proyecto</div>
            </div>
            <button onClick={()=>setImportTextOpen(false)} style={{background:"none",border:"1.5px solid #ffffff33",borderRadius:10,color:"#aaa",fontSize:14,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
          <div style={{flex:1,padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={async()=>{try{const t=await navigator.clipboard.readText();setImportText(t);}catch(e){alert("No se pudo leer el portapapeles. Pega manualmente.");}}} style={{background:"#42A5F522",border:"1.5px solid #42A5F566",borderRadius:10,color:"#42A5F5",fontSize:11,fontWeight:700,padding:"10px",cursor:"pointer"}}>📋 Pegar desde portapapeles</button>
            <textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder='Pega aquí el JSON (empieza por {"name":...})' style={{flex:1,minHeight:180,background:"#0a1018",border:"1.5px solid #2a3a50",color:"#b0c4d4",padding:"10px",borderRadius:8,fontSize:16,fontFamily:"monospace",outline:"none",resize:"none"}}/>
            <button onClick={importFromText} disabled={!importText.trim()} style={{background:importText.trim()?"#00E67622":"#33333322",border:`1.5px solid ${importText.trim()?"#00E676":"#444"}`,borderRadius:10,color:importText.trim()?"#00E676":"#555",fontSize:12,fontWeight:700,padding:"12px",cursor:importText.trim()?"pointer":"not-allowed"}}>✓ Cargar proyecto</button>
          </div>
        </div>
      </div>)}

      {/* ZONE PICKER */}
      {zoneOpen&&(<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:30}}>
        <div onClick={()=>setZoneOpen(false)} style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#000a"}} />
        <div style={{position:"relative",margin:"44px auto 0",width:"92%",maxWidth:400,maxHeight:"70vh",background:"#0c1420f8",border:"1px solid #1a2a3a",borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 8px 40px #000a"}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid #1a2a3a",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:700,color:"#26C6DA"}}>📍 Zona</span><button onClick={()=>setZoneOpen(false)} style={{background:"none",border:"1px solid #fff3",borderRadius:8,color:"#aaa",fontSize:12,padding:"2px 8px",cursor:"pointer"}}>✕</button></div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:6}}>
            {[{l:"España",z:ZONES.filter(z=>z.lat>36&&z.lat<44)},{l:"Europa",z:ZONES.filter(z=>z.lat>=44||z.lat<36)}].map(s=><div key={s.l}><div style={{fontSize:8,color:"#3a5a70",padding:"6px 6px 3px",letterSpacing:1}}>{s.l}</div>{s.z.map(z2=><button key={z2.id} onClick={()=>{setZone(z2.id);setZoneOpen(false);}} style={{width:"100%",padding:"8px 10px",border:zone===z2.id?"2px solid #26C6DA":"1px solid #1a2a3a",borderRadius:8,background:zone===z2.id?"#26C6DA14":"#0a1018",cursor:"pointer",marginBottom:3,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{textAlign:"left"}}><div style={{fontSize:11,fontWeight:700,color:zone===z2.id?"#26C6DA":"#7a9ab0"}}>{z2.z} — {z2.nm}</div><div style={{fontSize:8,color:"#3a5a70"}}>🔥{z2.hdd} ❄{z2.cdd} ☀{z2.solS} {z2.tMax}°C</div></div>{zone===z2.id&&<span style={{color:"#26C6DA"}}>✓</span>}</button>)}</div>)}
          </div>
        </div>
      </div>)}

      {/* ERROR TOAST */}
      {errMsg&&(
        <div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",background:"#B71C1C",color:"#fff",padding:"10px 16px",borderRadius:8,fontSize:11,zIndex:999,maxWidth:"90%",boxShadow:"0 4px 20px #000a",fontFamily:"monospace"}}>
          ⚠ <strong>Error:</strong> {errMsg}
          <button onClick={()=>setErrMsg(null)} style={{marginLeft:10,background:"#ffffff22",border:"none",borderRadius:4,color:"#fff",padding:"2px 8px",cursor:"pointer"}}>✕</button>
        </div>
      )}

      <style>{`
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080c14}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:#0a0f18}
::-webkit-scrollbar-thumb{background:#2a3a50;border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:#3a4a60}
input[type=range]{-webkit-appearance:none;appearance:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#26C6DA;cursor:pointer;box-shadow:0 2px 6px #26C6DA55}
input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#26C6DA;cursor:pointer;border:none}
input[type=number],input[type=text],input[type=email],input[type=tel],textarea{background:#0a1018;border:1.5px solid #2a3a50;color:#e0e8f0;padding:8px 10px;border-radius:8px;font-size:16px;font-family:inherit;outline:none;transition:border-color .15s;-webkit-appearance:none}
input[type=number]:focus,input[type=text]:focus,input[type=email]:focus,input[type=tel]:focus,textarea:focus{border-color:#B5C5A3}
button{font-family:inherit;transition:all .12s ease}
button:active{transform:scale(.96)}
select{font-family:inherit;outline:none}
@media(max-width:600px){canvas{width:100%!important;height:auto!important}}
`}</style>
    </div>
  );
}
function CC({a,c,fn,nm,dt}){return(<button onClick={fn} style={{padding:"11px 12px",border:a?`2px solid ${c}`:"1.5px solid #1a2535",borderRadius:10,background:a?`${c}1c`:"linear-gradient(180deg,#0f1626,#0c1420)",cursor:"pointer",display:"flex",flexDirection:"column",gap:4,boxShadow:a?`0 0 16px ${c}44, inset 0 0 0 1px ${c}66`:"0 1px 2px #0004",textAlign:"left",minHeight:52}}><span style={{fontSize:12,fontWeight:700,color:a?c:"#9ab0c4"}}>{nm}</span><span style={{fontSize:9,color:"#5a7a9a"}}>{dt}</span></button>);}
function TB({ic,l,a,c,fn}){return(<button onClick={fn} style={{flex:1,padding:"11px 2px",background:a?`linear-gradient(180deg,${c}15,${c}08)`:"none",border:"none",borderTop:a?`2.5px solid ${c}`:"2.5px solid transparent",color:a?c:"#5a7a9a",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,minHeight:52}}><span style={{fontSize:17}}>{ic}</span><span style={{fontSize:9,fontWeight:600,letterSpacing:.2}}>{l}</span></button>);}
function St({l,v,c}){return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:7,color:"#4a6a84",letterSpacing:.8,textTransform:"uppercase",fontWeight:600}}>{l}</span><span style={{fontSize:10,color:c,fontWeight:700}}>{v}</span></div>);}
function BRow({l,v,c,bold}){return(<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:bold?12:11,color:c,borderTop:bold?"1px solid #2a3a4a":"none",marginTop:bold?4:0,fontWeight:bold?700:400}}><span>{l}</span><span>{v.toFixed(0)}€</span></div>);}
function PRow({l,u,v,fn,onInfo}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",gap:8,borderBottom:"1px solid #1a2535"}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,color:"#b0c4d4",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>{l}{onInfo&&<button onClick={onInfo} title="Ver memoria de calidades" style={{background:"#42A5F522",border:"1px solid #42A5F566",borderRadius:50,color:"#42A5F5",fontSize:9,fontWeight:700,width:18,height:18,padding:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>ℹ</button>}</div><div style={{fontSize:9,color:"#5a7a9a"}}>{u}</div></div><input type="number" value={v} onChange={e=>fn(Math.max(0,+e.target.value||0))} style={{width:90,textAlign:"right"}} /></div>);}
function OptRow({l,u,v,v2,fn,fn2,on,ofn,dual,onInfo}){
  return(<div style={{display:"flex",alignItems:"center",padding:"10px 0",gap:8,borderBottom:"1px solid #1a2535",opacity:on?1:.55}}>
    <button onClick={ofn} style={{flexShrink:0,width:24,height:24,borderRadius:6,border:`2px solid ${on?"#CE93D8":"#3a4a60"}`,background:on?"#CE93D8":"transparent",color:"#0a1018",fontSize:14,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>{on?"✓":""}</button>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:11,color:on?"#d8e2ee":"#7a8aa0",fontWeight:600,lineHeight:1.2,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>{l}{onInfo&&<button onClick={onInfo} title="Ver memoria de calidades" style={{background:"#42A5F522",border:"1px solid #42A5F566",borderRadius:50,color:"#42A5F5",fontSize:9,fontWeight:700,width:18,height:18,padding:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>ℹ</button>}</div>
      <div style={{fontSize:9,color:"#5a7a9a",marginTop:2}}>{u}</div>
    </div>
    {dual?
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        <input type="number" value={v} onChange={e=>fn(Math.max(0,+e.target.value||0))} style={{width:80,textAlign:"right",fontSize:14,padding:"4px 6px"}} placeholder="vent."/>
        <input type="number" value={v2} onChange={e=>fn2(Math.max(0,+e.target.value||0))} style={{width:80,textAlign:"right",fontSize:14,padding:"4px 6px"}} placeholder="puerta"/>
      </div>
      :<input type="number" value={v} onChange={e=>fn(Math.max(0,+e.target.value||0))} style={{width:90,textAlign:"right"}}/>}
  </div>);
}
function CField({l,v,fn,ph,type}){return(<div><div style={{fontSize:10,color:"#b0c4d4",fontWeight:600,marginBottom:4}}>{l}</div><input type={type||"text"} value={v} onChange={e=>fn(e.target.value)} placeholder={ph} style={{width:"100%"}}/></div>);}
