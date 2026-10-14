(async()=>{
const g=async(u)=>{const r=await fetch(u,{credentials:'include'});const t=await r.text();return {s:r.status,t}};
const out={};
for (const u of ['/api/materias?formato=OBJETIVA&universo=','/api/bancas?formato=OBJETIVA&universo=','/api/anos?formato=OBJETIVA&universo=','/api/orgaos?formato=OBJETIVA&universo=','/api/enums/filtros-questao?formato=OBJETIVA&universo=','/api/enums/areas','/api/enums/escolaridades','/api/profissoes?formato=OBJETIVA']) {
 const r=await g(u); out[u]={s:r.s,len:r.t.length,head:r.t.slice(0,700)};
}
return JSON.stringify(out,null,1);
})()
