const C='pbl-v11-entry-review';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(caches.open(C).then(async cache=>{
    if(u.pathname.includes('/docs/')||u.pathname.endsWith('/manifest.json')){try{const r=await fetch(e.request);if(r.ok)cache.put(e.request,r.clone());return r;}catch{return(await cache.match(e.request))??Response.error();}}
    const cached=await cache.match(e.request),net=fetch(e.request).then(r=>{if(r.ok)cache.put(e.request,r.clone());return r;}).catch(()=>cached);
    return cached||net;
  }));
});
function pushReceipt(row){
  return new Promise(resolve=>{const req=indexedDB.open('pbl-push-receipts',1);req.onupgradeneeded=()=>req.result.createObjectStore('items',{keyPath:'id'});
    req.onerror=()=>resolve();req.onsuccess=()=>{const db=req.result,tx=db.transaction('items','readwrite'),store=tx.objectStore('items'),get=store.get(row.id);
      get.onsuccess=()=>store.put({...get.result,...row});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();resolve();};};});
}
self.addEventListener('push',event=>event.waitUntil((async()=>{
  let data;try{data=event.data.json();}catch{data={};}
  const valid=data.kind==='pbl-risk'&&/^[a-f0-9]{32}$/.test(data.id??'');
  const id=valid?data.id:crypto.randomUUID().replaceAll('-','');
  const title=valid?String(data.title).slice(0,70):'투자 알림 확인 필요';
  const body=valid?String(data.body).slice(0,240):'알림 내용을 읽지 못했습니다. 대시보드에서 최신 점검을 확인하세요.';
  await self.registration.showNotification(title,{body,icon:'icon-192.png',badge:'icon-192.png',tag:'pbl-'+(data.testId?'test':'risk'),data:{id,testId:valid?data.testId:null,newsletter:valid&&data.category==='newsletter',entry:valid&&['entry','entry-test'].includes(data.category)},requireInteraction:false});
  await pushReceipt({id,testId:valid?data.testId:null,receivedAt:new Date().toISOString()});
})()));
self.addEventListener('notificationclick',event=>{
  event.notification.close();event.waitUntil((async()=>{
    const data=event.notification.data??{};if(data.id)await pushReceipt({id:data.id,testId:data.testId??null,clickedAt:new Date().toISOString()});
    const target=new URL('./?view=portfolio'+(data.entry?'#entry-review':data.newsletter?'#newsletter':''),self.registration.scope).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=windows.find(w=>w.url.startsWith(self.registration.scope));
    if(existing){await existing.navigate(target);await existing.focus();}else await self.clients.openWindow(target);
  })());
});
