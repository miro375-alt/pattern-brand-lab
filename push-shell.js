/* Top-level permission UI. No credentials, account records, or VAPID private keys. */
window.pblPushCommand=async function(action){
  const supported=isSecureContext&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  if(!supported||ios&&!standalone)return {supported:false,ios,standalone,permission:window.Notification?.permission??'unavailable'};
  const registration=await navigator.serviceWorker.register('sw.js');
  const ready=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('worker timeout')),12000))]);
  const receipt=()=>new Promise(resolve=>{
    const req=indexedDB.open('pbl-push-receipts',1);req.onupgradeneeded=()=>req.result.createObjectStore('items',{keyPath:'id'});
    req.onerror=()=>resolve([]);req.onsuccess=()=>{const db=req.result,r=db.transaction('items').objectStore('items').getAll();
      r.onsuccess=()=>{resolve(r.result.slice(-30));db.close();};r.onerror=()=>{resolve([]);db.close();};};
  });
  const status=async()=>({supported:true,ios,standalone,permission:Notification.permission,subscription:(await ready.pushManager.getSubscription())?.toJSON()??null,receipts:await receipt()});
  if(action==='status')return status();
  if(action==='disconnect'){const s=await ready.pushManager.getSubscription();if(s)await s.unsubscribe();return status();}
  if(action!=='connect')throw Error('unknown action');
  if(Notification.permission==='denied')throw Error('알림이 차단돼 있습니다. 휴대폰 설정에서 이 웹앱의 알림을 허용해 주세요.');
  if(window.pblPushModal)throw Error('이미 연결 창이 열려 있습니다.');
  return new Promise((resolve,reject)=>{
    const box=document.createElement('div');window.pblPushModal=box;box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
    box.style.cssText='position:fixed;inset:0;z-index:9999;background:#000c;display:grid;place-items:center;padding:20px;color:#edf2f8;font:16px/1.6 system-ui';
    box.innerHTML='<section style="max-width:420px;background:#151c25;border:1px solid #62748a;padding:24px;border-radius:12px"><h2>휴대폰 투자 알림</h2><p>매일 07:30·17:30 발행한 시장 뉴스레터를 앱에서 읽을 수 있도록 알려드립니다. 기기 주소와 점검 종목 코드만 암호화해 저장합니다.</p><p>보유 수량·매수금액·계좌번호는 알림 서버에 보내지 않습니다.</p><button type="button" data-push-allow style="font:inherit;padding:12px">알림 허용하고 연결</button> <button type="button" data-push-cancel style="font:inherit;padding:12px">취소</button><p data-push-error role="status"></p></section>';
    document.body.append(box);const close=()=>{box.remove();window.pblPushModal=null;};
    box.querySelector('[data-push-cancel]').onclick=()=>{close();reject(Error('연결을 취소했습니다.'));};
    box.querySelector('[data-push-allow]').onclick=async()=>{
      const button=box.querySelector('[data-push-allow]');button.disabled=true;
      try{
        // Must run directly inside a top-level user gesture on iOS.
        const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('알림 허용이 필요합니다.');
        const raw='BDEOmUgL5m8BCJ7rwZzM9hRZj96_hoobh9ZrQEPTAysGtZSJ48VTZigxzc8VEL6RkxKqrm6Vo_NqdMAyJW_bzzI'.replace(/-/g,'+').replace(/_/g,'/');
        const key=Uint8Array.from(atob(raw+'='.repeat((4-raw.length%4)%4)),c=>c.charCodeAt(0));
        await ready.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
        const result=await status();close();resolve(result);
      }catch(e){box.querySelector('[data-push-error]').textContent=e.message;button.disabled=false;}
    };
  });
};
