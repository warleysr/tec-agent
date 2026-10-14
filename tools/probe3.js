(async()=>{
const get=async(u)=>{const r=await fetch(u,{credentials:'include'});return {s:r.status,t:await r.text()}};
const out={};
for (const u of ['/api/questoes/3798920','/api/questoes/3798920/deslogado','/api/questoes/3798920/detalhes','/api/questoes/3798920/comentario?x=1']) {
 const r=await get(u); out[u]={s:r.s,len:r.t.length,head:r.t.slice(0,1800)};
}
return JSON.stringify(out,null,1);
})()
