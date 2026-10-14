(async()=>{
const post=async(u,o)=>{const r=await fetch(u,{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams(o).toString()});return {s:r.status,t:await r.text()}};
const get=async(u)=>{const r=await fetch(u,{credentials:'include'});return {s:r.status,t:await r.text()}};
const out={};
let r=await get('/api/assuntos?universo=CONCURSOS&formato=OBJETIVA&materia=14&hierarquico=true'); out.assuntos={s:r.s,len:r.t.length,head:r.t.slice(0,600)};
const base={universo:'CONCURSOS',formato:'OBJETIVA'};
r=await post('/api/questoes/contagem/filtros',{...base,gerarEmSerie:false,caderno:'', 'filtros[0].tipo':'ASSUNTO','filtros[0].id':'2150'}); out.contagem={s:r.s,t:r.t.slice(0,400)};
r=await post('/api/questoes/filtros',{...base,pagina:1,'filtros[0].tipo':'ASSUNTO','filtros[0].id':'2150'}); out.filtros={s:r.s,len:r.t.length,head:r.t.slice(0,1500)};
r=await post('/api/questoes/filtros',{...base,pagina:1,'filtros[0].tipo':'ASSUNTO','filtros[0].id':'2150','filtros[1].tipo':'BANCA','filtros[1].id':'2'}); out.filtros2={s:r.s,len:r.t.length,head:r.t.slice(0,300)};
return JSON.stringify(out,null,1);
})()
