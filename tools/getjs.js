(async()=>{
const o={};
for (const f of ['gerador.angular.js','gerador.buscadores.angular.js']) {
 const r=await fetch('/js/angular/components/'+f+'?v=15.2.83',{credentials:'include'}); o[f]=await r.text();
}
return JSON.stringify(o);
})()
