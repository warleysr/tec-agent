(async()=>{
const post=async(u,o)=>{const r=await fetch(u,{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams(o).toString()});return r.text()};
const get=async(u)=>JSON.parse(await (await fetch(u,{credentials:'include'})).text());
const base={universo:'CONCURSOS',formato:'OBJETIVA',gerarEmSerie:false,caderno:''};
const tree=(await get('/api/assuntos?universo=CONCURSOS&formato=OBJETIVA&materia=14&hierarquico=true')).assuntos;
const p=tree[0]; const kids=(p.subTree||[]).map(k=>k.id);
const cnt=async(ids,extra={})=>{const o={...base,...extra};ids.forEach((id,i)=>{o['filtros['+i+'].tipo']='ASSUNTO';o['filtros['+i+'].id']=id});return JSON.parse(await post('/api/questoes/contagem/filtros',o)).int};
const out={parent:p.id,nKids:kids.length,parentOnly:await cnt([p.id]),kidsOnly:await cnt(kids),both:await cnt([p.id,...kids])};
// materia-only, and combined types
const o={...base,'filtros[0].tipo':'MATERIA','filtros[0].id':14}; out.materia14=JSON.parse(await post('/api/questoes/contagem/filtros',o)).int;
const o2={...o,'filtros[1].tipo':'ANO','filtros[1].id':2023,'filtros[2].tipo':'BANCA','filtros[2].id':2}; out.materia_ano_banca=JSON.parse(await post('/api/questoes/contagem/filtros',o2)).int;
const o3={...o,'filtros[1].tipo':'FILTRO_QUESTAO','filtros[1].id':'DIFICULDADE_FACIL'}; out.materia_facil=JSON.parse(await post('/api/questoes/contagem/filtros',o3)).int;
const enums=await get('/api/enums/filtros-questao?formato=OBJETIVA&universo='); out.filtrosQuestao=enums.filtros.map(f=>f.id+'|'+f.grupo);
const bancas=(await get('/api/bancas?formato=OBJETIVA&universo=')).bancas; out.cebraspe=bancas.filter(b=>/cebraspe/i.test(b.sigla+b.nome)).map(b=>b.id+':'+b.sigla);
return JSON.stringify(out,null,1);
})()
