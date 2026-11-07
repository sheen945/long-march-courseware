/* Package-local, bounded read recovery. No entitlement, token or cache changes. */
(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const nativeFetch = window.fetch.bind(window);
  const nativeTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const controllers = new Set(), failures = new Map(), imageCache = new Map();
  const retryable = new Set([429, 502, 503, 504]);
  let closed = false, nextStart = 0, queue = Promise.resolve(), waiting = 0, notice;

  function scoped(input) {
    const url = new URL(input, document.baseURI);
    if (!/^https?:$/.test(url.protocol) || url.origin !== root.origin ||
        !url.pathname.startsWith(root.pathname) || url.username || url.password) throw Error('RESOURCE_SCOPE');
    const path = url.pathname.slice(root.pathname.length);
    if (!/^(?:assets\/[^/]+\.js|map\/[a-zA-Z0-9_./-]+\.(?:png|webp|jpg|jpeg)|(?:sprites|overlays)\/[a-zA-Z0-9_-]+\.webp|courseware\/archives-[a-z]+\.json|audio\/map-background\.mp3)$/.test(path)) throw Error('RESOURCE_SCOPE');
    return url.href;
  }
  function sleep(ms, signal) {
    if (closed || signal?.aborted) return Promise.reject(Error('RESOURCE_CANCELLED'));
    return new Promise((resolve, reject) => {
      const finish = () => { signal?.removeEventListener('abort', abort); resolve(); };
      const timer = nativeTimeout(finish, ms);
      const abort = () => { nativeClearTimeout(timer); signal?.removeEventListener('abort', abort); reject(Error('RESOURCE_CANCELLED')); };
      signal?.addEventListener('abort', abort, {once:true});
    });
  }
  async function permit(signal) {
    if (waiting >= 32) throw Error('RESOURCE_QUEUE_FULL');
    waiting++;
    const turn = queue.then(async () => {
      await sleep(Math.max(0, nextStart - Date.now()), signal);
      if (closed || signal.aborted) throw Error('RESOURCE_CANCELLED');
      nextStart = Date.now() + 160;
    });
    queue = turn.catch(() => {});
    try { await turn; } finally { waiting--; }
  }
  async function beforeMapModule() {
    const controller = new AbortController(); controllers.add(controller);
    try {
      // Let the authored HTML's bootstrap requests drain before the one native
      // module import. A failed native import is cached by the browser document.
      await sleep(500, controller.signal);
      await permit(controller.signal);
    } finally { controllers.delete(controller); }
  }
  function retryDelay(response, attempt) {
    const header = response?.headers?.get('Retry-After');
    let requested = 0;
    if (header) {
      requested = /^\d+(?:\.\d+)?$/.test(header.trim()) ? Number(header) * 1000 : Date.parse(header) - Date.now();
      if (!Number.isFinite(requested)) requested = 0;
      // Do not ignore a server-requested long wait or loop indefinitely.
      if (requested > 10000) return null;
    }
    return Math.max(1000 * (attempt + 1), requested, 0);
  }
  async function read(input, options = {}) {
    const url = scoped(input), method = options.method || 'GET';
    if (!['GET','HEAD'].includes(method)) throw Error('RESOURCE_METHOD');
    if (closed || options.signal?.aborted) throw Error('RESOURCE_CANCELLED');
    const controller = new AbortController(); controllers.add(controller);
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, {once:true});
    const deadline = nativeTimeout(abort, 25000);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        await permit(controller.signal);
        let response;
        try { response = await nativeFetch(url, {method, signal:controller.signal}); }
        catch (error) {
          if (controller.signal.aborted || closed || attempt === 2) throw error;
          await sleep(1000 * (attempt + 1), controller.signal); continue;
        }
        if (response.ok || !retryable.has(response.status) || attempt === 2) return response;
        const delay = retryDelay(response, attempt);
        if (delay === null) return response;
        await response.body?.cancel();
        await sleep(delay, controller.signal);
      }
    } finally {
      nativeClearTimeout(deadline); options.signal?.removeEventListener('abort', abort); controllers.delete(controller);
    }
  }
  function renderNotice() {
    if (closed || !document.body) return;
    if (!failures.size) { notice?.remove(); notice = null; return; }
    if (notice) return;
    notice = document.createElement('div'); notice.id = 'lm-map-resource-retry'; notice.setAttribute('role','status');
    notice.style.cssText = 'position:fixed;right:18px;bottom:88px;z-index:9998;padding:12px 16px;border:1px solid #a5874e;border-radius:8px;background:#29251fee;color:#f0dfb8;font:15px system-ui;max-width:320px';
    const label = document.createElement('span'); label.textContent = '部分地图资源暂未载入。';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = '重试';
    button.style.cssText = 'margin-left:10px;color:#f0dfb8;background:#8c2d25;border:1px solid #a5874e;border-radius:4px;padding:5px 12px;cursor:pointer';
    button.addEventListener('click', async () => {
      button.disabled = true;
      await Promise.allSettled([...failures.values()].map(retry => retry()));
      button.disabled = false; renderNotice();
    });
    notice.append(label,button); document.body.append(notice);
  }
  function texture(loader, input, onLoad, onProgress, onError) {
    const url = scoped(input); let pending, complete = false;
    const run = () => {
      if (closed || complete) return Promise.resolve();
      if (pending) return pending;
      pending = (async () => {
        let blobURL;
        try {
          const response = await read(url);
          if (!response.ok) throw Error('RESOURCE_HTTP_' + response.status);
          const blob = await response.blob();
          if (closed) return;
          blobURL = URL.createObjectURL(blob);
          await new Promise((resolve,reject) => loader.load(blobURL, texture => {
            if (closed) { texture.dispose?.(); resolve(); return; }
            try { complete = true; onLoad?.(texture); resolve(); } catch (error) { reject(error); }
          }, onProgress, reject));
          failures.delete(url); renderNotice();
        } catch (error) {
          if (!closed) { failures.set(url,run); renderNotice(); onError?.(error); }
        } finally { if (blobURL) URL.revokeObjectURL(blobURL); pending = null; }
      })();
      return pending;
    };
    return run();
  }
  function image(input) {
    const url = scoped(input);
    if (closed) throw Error('RESOURCE_CANCELLED');
    let entry = imageCache.get(url);
    if (!entry) {
      if (imageCache.size >= 32) throw Error('RESOURCE_CACHE_FULL');
      entry = {refs:0, url:null, ready:null};
      imageCache.set(url,entry);
      entry.ready = (async () => {
        const response = await read(url);
        if (!response.ok) throw Error('RESOURCE_HTTP_' + response.status);
        const blob = await response.blob();
        if (closed || !entry.refs) throw Error('RESOURCE_CANCELLED');
        entry.url = URL.createObjectURL(blob);
        return entry.url;
      })().catch(error => {
        if (imageCache.get(url) === entry) imageCache.delete(url);
        throw error;
      });
    }
    entry.refs++;
    let disposed = false;
    return {ready:entry.ready,dispose() {
      if (disposed) return;
      disposed = true; entry.refs--;
      if (!entry.refs && entry.url) {
        URL.revokeObjectURL(entry.url); entry.url = null;
        if (imageCache.get(url) === entry) imageCache.delete(url);
      }
    }};
  }
  function recoverAudio(audio, resume) {
    let attempts = 0, pending = false;
    audio.addEventListener('error', async () => {
      if (closed || pending || attempts >= 2 || ![2,4].includes(audio.error?.code)) return;
      const source = audio.src; if (!source) return;
      pending = true; attempts++;
      try {
        await sleep(1000 * attempts);
        if (closed || audio.src !== source) return;
        // A native media error hides the HTTP status. Probe the same protected
        // resource before retrying, so 401/403/404 are not blindly replayed.
        const response = await read(source, {method:'HEAD'});
        if (!response.ok || closed || audio.src !== source) return;
        audio.load(); resume?.();
      } catch {} finally { pending = false; }
    });
  }
  window.addEventListener('pagehide', () => {
    closed = true; controllers.forEach(controller => controller.abort());
    failures.clear(); notice?.remove(); notice = null;
    for (const entry of imageCache.values()) { if (entry.url) URL.revokeObjectURL(entry.url); entry.url = null; }
    imageCache.clear();
  }, {once:true});
  window.LongMarchResources = Object.freeze({read,texture,image,recoverAudio,beforeMapModule});
})();

/* Content-only adapter. Presentation hints never authorize private resources. */
(() => {
  'use strict';
  const chapters=['ruijin','yudu','xiangjiang','zunyi','chishui','jinshajiang','luding','snowgrass','final'];
  const root=new URL('../',document.currentScript.src);
  const inScene=/\/scenes\//.test(location.pathname);
  let trial=null, navigate=null, queued=null;
  const frames=()=>Array.from(document.querySelectorAll('iframe.scene-frame'));
  const child=source=>frames().some(f=>f.contentWindow===source);
  const valid=(id,point)=>chapters.includes(id)&&(point===undefined||/^[a-zA-Z0-9_-]{1,60}$/.test(String(point)));
  function acceptPolicy(value){
    trial=Boolean(value);
    document.documentElement.dataset.lmTrial=String(trial);
    window.dispatchEvent(new CustomEvent('lm:websitepolicy',{detail:{trial}}));
  }
  function policyTo(frame){frame.contentWindow?.postMessage({type:'longMarch:websitePolicy',trial},'*');}
  const api={
    get trial(){return trial;},
    leaveTeaching(){
      window.LongMarchTeaching?.prepareLeave?.();
      window.LongMarchClassroom?.setPaused?.(true);
      if(inScene && parent!==window){
        parent.postMessage({type:'longMarch:websiteStudentReturn'},'*');
        parent.postMessage({type:'longMarch:closeScene'},'*');
      }else if(inScene){location.href=new URL('index.html',root).href;}
    },
    setMapPresentation(label){acceptPolicy(label.startsWith('试用仅限第一、二章'));},
    bindNavigator(fn){navigate=fn;if(queued){fn(...queued);queued=null;}return()=>{if(navigate===fn)navigate=null;};},
    go(id,point){
      if(!valid(id,point))return;
      window.LongMarchTeaching?.prepareLeave?.();
      if(inScene&&parent!==window){parent.postMessage({type:'longMarch:websiteNavigate',id,point},'*');return;}
      if(!inScene){if(navigate)navigate(id,point);else queued=[id,point];return;}
      const url=new URL('scenes/'+id+'/index.html',root);url.searchParams.set('teacher','1');if(point)url.searchParams.set('point',point);location.href=url.href;
    },
    sceneUrl(path,point){const url=new URL(path,root);url.searchParams.set('teacher','1');if(point)url.searchParams.set('point',point);return url.href;}
  };
  window.LongMarchWebsite=api;
  window.addEventListener('message',event=>{
    const msg=event.data;if(!msg||typeof msg!=='object')return;
    if(inScene&&event.source===parent&&msg.type==='longMarch:websitePolicy'&&typeof msg.trial==='boolean'){acceptPolicy(msg.trial);return;}
    if(inScene||!child(event.source))return;
    if(msg.type==='longMarch:websiteStudentReturn'){window.LongMarchClassroom?.setMode(false);return;}
    if(msg.type==='longMarch:websitePolicyRequest'&&trial!==null)event.source.postMessage({type:'longMarch:websitePolicy',trial},'*');
    if(msg.type==='longMarch:websiteNavigate'&&valid(msg.id,msg.point))api.go(msg.id,msg.point);
  });
  if(inScene&&parent!==window)parent.postMessage({type:'longMarch:websitePolicyRequest'},'*');
  const observe=()=>{
    if(inScene)return;
    const seen=new WeakSet();
    const discover=()=>frames().forEach(f=>{if(seen.has(f))return;seen.add(f);f.addEventListener('load',()=>{if(trial!==null)policyTo(f);});});
    new MutationObserver(discover).observe(document.body,{childList:true,subtree:true});discover();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
