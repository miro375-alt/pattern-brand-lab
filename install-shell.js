/* Public install flow. Installation never registers a push device or unlocks account data. */
window.pblInstall=(()=>{
  let promptEvent=null,installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,dialog=null;
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
  const url=new URL('./?install=1',location.href).href;
  function update(){
    document.querySelectorAll('[data-pbl-install-open]').forEach(b=>b.textContent=installed?'이 기기에 설치됨':'휴대폰 앱 설치');
    if(dialog)draw();
  }
  function draw(){
    const body=dialog.querySelector('[data-install-body]'),status=dialog.querySelector('[data-install-status]');
    const button=dialog.querySelector('[data-install-native]');button.hidden=installed||!promptEvent;
    dialog.querySelector('[data-install-ios]').hidden=installed||!ios;
    if(installed){body.innerHTML='<p><strong>이 기기에서 앱으로 실행 중이거나 설치가 확인됐습니다.</strong></p><p>홈 화면의 PBL 아이콘으로 다시 열 수 있습니다. 투자 알림은 로그인 후 내 투자에서 별도로 연결해 주세요.</p>';return;}
    body.innerHTML=ios?'<p class="pbl-install-intro">본인 아이폰의 홈 화면에 PBL 아이콘을 추가합니다.</p><ol><li><b>Safari 앱에서 이 페이지를 여세요.</b><span>다른 앱 안에서 보고 있다면 주소를 복사해 Safari 주소창에 붙여 넣으세요.</span></li><li><b>이 안내창을 닫고 Safari의 공유 버튼 누르기</b><span>화면 아래 도구 막대의 네모 위 화살표(공유)를 누르세요. 주소 복사 버튼은 설치를 시작하지 않습니다. 공유 목록 맨 아래까지 내려 ‘동작 편집’을 누른 뒤 ‘홈 화면에 추가’를 찾으세요.</span></li><li><b>‘웹 앱으로 열기’를 켜고 추가</b><span>해당 항목이 표시되는 경우 켜 두세요. 홈 화면에 생긴 PBL 아이콘으로 실행합니다.</span></li></ol>':promptEvent?'<p class="pbl-install-intro">이 기기의 홈 화면에 PBL 앱을 설치할 수 있습니다.</p><p>아래 설치 버튼을 누르고 브라우저가 여는 설치 화면에서 진행해 주세요.</p>':'<p class="pbl-install-intro">본인 휴대폰의 Chrome 또는 Safari에서 설치해 주세요.</p><ol><li><b>Android: Chrome에서 이 주소 열기</b><span>카카오톡 등 다른 앱 안에서 보고 있다면 주소를 복사해 Chrome 주소창에 붙여 넣으세요.</span></li><li><b>브라우저 메뉴 → 앱 설치</b><span>설치 메뉴가 없으면 ‘홈 화면에 추가’를 확인하세요. 브라우저와 기기에 따라 표시가 다릅니다.</span></li><li><b>홈 화면의 PBL 아이콘 실행</b><span>아이폰은 Safari 공유 → 홈 화면에 추가를 이용해 주세요.</span></li></ol>';
    if(!status.textContent)status.textContent='설치 후 로그인 → 내 투자 → 휴대폰 알림 연결을 진행하세요. 설치만으로 알림이 켜지지는 않습니다.';
  }
  function open(trigger){
    if(dialog){dialog.focus();return {opened:true};}
    const previous=trigger??document.activeElement;dialog=document.createElement('dialog');dialog.className='pbl-install-dialog';dialog.setAttribute('aria-labelledby','pblInstallTitle');
    dialog.innerHTML='<header><div><p class="pbl-install-kicker">PATTERN BRAND LAB</p><h2 id="pblInstallTitle">휴대폰 앱 설치</h2></div><button type="button" class="pbl-install-close" aria-label="설치 안내 닫기">×</button></header><div data-install-body></div><div class="pbl-install-actions"><button type="button" data-install-native hidden>이 기기에 앱 설치</button><button type="button" data-install-ios hidden>안내 닫고 Safari 공유 버튼 누르기</button><button type="button" data-install-copy>다른 브라우저에서 열 주소 복사</button></div><p data-install-status role="status"></p><label class="pbl-install-url">설치 주소<input readonly aria-label="설치 주소"></label>';
    document.body.append(dialog);dialog.querySelector('input').value=url;
    const close=()=>{if(dialog.open)dialog.close();dialog.remove();dialog=null;previous?.focus?.({preventScroll:true});};
    dialog.querySelector('.pbl-install-close').onclick=close;dialog.querySelector('[data-install-ios]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.querySelector('[data-install-copy]').onclick=async()=>{
      const current=dialog;
      try{await navigator.clipboard.writeText(url);if(current.isConnected)current.querySelector('[data-install-status]').textContent='설치 주소를 복사했습니다. 본인 휴대폰의 Safari 또는 Chrome에서 열어 주세요.';}
      catch{if(!current.isConnected)return;const input=current.querySelector('input');input.focus();input.select();current.querySelector('[data-install-status]').textContent='아래 주소를 길게 눌러 복사해 주세요.';}
    };
    dialog.querySelector('[data-install-native]').onclick=async()=>{
      const event=promptEvent;if(!event)return;promptEvent=null;
      try{
        await event.prompt();const choice=await event.userChoice;
        if(dialog){draw();dialog.querySelector('[data-install-status]').textContent=choice.outcome==='accepted'?'설치 요청을 승인했습니다. 홈 화면에 PBL 아이콘이 생겼는지 확인해 주세요.':'설치를 취소했습니다. 나중에 브라우저 메뉴에서도 설치할 수 있습니다.';}
      }catch{if(dialog){draw();dialog.querySelector('[data-install-status]').textContent='설치 화면을 열지 못했습니다. 브라우저 메뉴의 앱 설치 또는 홈 화면에 추가를 이용해 주세요.';}}
    };
    draw();if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    dialog.querySelector('.pbl-install-close').focus();return {opened:true,installed};
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;update();});
  window.addEventListener('appinstalled',()=>{installed=true;promptEvent=null;update();if(dialog)dialog.querySelector('[data-install-status]').textContent='설치 완료가 확인됐습니다. 홈 화면의 PBL 아이콘으로 열어 주세요.';});
  document.addEventListener('click',event=>{const button=event.target.closest('[data-pbl-install-open]');if(button)open(button);});
  document.addEventListener('DOMContentLoaded',()=>{update();if(new URLSearchParams(location.search).get('install')==='1')open();});
  return {open};
})();
