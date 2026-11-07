/* Loaded before scene scripts. Teacher playback and progress live separately. */
(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  const teacher = query.get('teacher') === '1';
  const native = {
    timeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window),
    interval: window.setInterval.bind(window), clearInterval: window.clearInterval.bind(window),
    raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window),
    now: performance.now.bind(performance)
  };
  const state = { teacher, paused: false, native, point: query.get('point') || '', ready: false };
  window.LongMarchClassroom = state;
  document.documentElement.classList.toggle('lm-teacher-mode', teacher);
  document.documentElement.classList.toggle('lm-teacher-entry', teacher);
  const originalLocal=window.localStorage, originalSession=window.sessionStorage;
  const isolated=key=>/long[-_]?march|chishui|chapter[-_]?9/i.test(String(key))&&!String(key).startsWith('lm-classroom:');
  const get=(store,key)=>store.getItem(key), set=(store,key,value)=>store.setItem(key,value);
  const facade={
    get length(){return originalLocal.length;},key:i=>originalLocal.key(i),
    getItem(key){return state.teacher&&isolated(key)?get(originalSession,'lm-classroom:'+key):get(originalLocal,key);},
    setItem(key,value){return state.teacher&&isolated(key)?set(originalSession,'lm-classroom:'+key,value):set(originalLocal,key,value);},
    removeItem(key){return state.teacher&&isolated(key)?originalSession.removeItem('lm-classroom:'+key):originalLocal.removeItem(key);},
    clear(){throw new Error('Bulk progress clearing is disabled; reset an individual chapter instead.');}
  };
  Object.defineProperty(window,'localStorage',{configurable:true,value:facade});
  if(teacher)for(let i=0;i<originalLocal.length;i++){const key=originalLocal.key(i);if(isolated(key)&&get(originalSession,'lm-classroom:'+key)===null)set(originalSession,'lm-classroom:'+key,get(originalLocal,key));}


  let serial = 1000000000, stoppedAt = 0, offset = 0;
  const timers = new Map(), frames = new Map(), media = new Set(), playing = new Set(), contexts = new Set(), runningContexts = new Set(), animations = new Set();
  // A virtual scene clock avoids jumping to the end of a transition on resume.
  const sceneNow = () => (state.paused ? stoppedAt : native.now()) - offset;
  Object.defineProperty(performance, 'now', { value: sceneNow, configurable: true });
  const arm = task => {
    task.started = native.now();
    task.handle = native.timeout(() => {
      if (state.paused) return;
      if (!task.repeat) timers.delete(task.id);
      try { typeof task.callback === 'function' ? task.callback(...task.args) : (0,eval)(task.callback); }
      finally { if (task.repeat && timers.has(task.id)) { task.left=task.delay; arm(task); } }
    }, task.left);
  };
  const schedule = (callback, delay, repeat, args) => {
    const id=++serial, ms=Math.max(0, Number(delay)||0);
    const task={id,callback,args,delay:ms,left:ms,repeat,handle:0,started:native.now()}; timers.set(id,task);
    if (!state.paused) arm(task);
    return id;
  };
  window.setTimeout=(callback,delay,...args)=>schedule(callback,delay,false,args);
  window.setInterval=(callback,delay,...args)=>schedule(callback,delay,true,args);
  window.clearTimeout=window.clearInterval=id=>{ const t=timers.get(id); if(t){native.clearTimeout(t.handle);timers.delete(id);}else{native.clearTimeout(id);native.clearInterval(id);} };
  const armFrame = f => { f.handle=native.raf(()=>{if(state.paused)return;frames.delete(f.id);f.callback(sceneNow());}); };
  window.requestAnimationFrame=callback=>{const f={id:++serial,callback,handle:0};frames.set(f.id,f);if(!state.paused)armFrame(f);return f.id;};
  window.cancelAnimationFrame=id=>{const f=frames.get(id);if(f){native.caf(f.handle);frames.delete(id);}else native.caf(id);};
  const play=HTMLMediaElement.prototype.play, pause=HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.play=function(){media.add(this);if(state.paused){playing.add(this);return Promise.resolve();}return play.call(this);};
  HTMLMediaElement.prototype.pause=function(){playing.delete(this);return pause.call(this);};
  for (const name of ['AudioContext','webkitAudioContext']) {
    const Original=window[name];
    if(!Original)continue;
    window[name]=class extends Original {
      constructor(...args){super(...args);contexts.add(this);if(state.paused)this.suspend().catch(()=>{});}
      resume(){if(state.paused){runningContexts.add(this);return Promise.resolve();}return super.resume();}
    };
  }
  state.setPaused = desired => {
    desired=Boolean(desired);if(desired===state.paused)return;
    if(desired){
      stoppedAt=native.now();state.paused=true;
      for(const t of timers.values()){native.clearTimeout(t.handle);t.left=Math.max(0,t.left-(stoppedAt-t.started));}
      for(const f of frames.values())native.caf(f.handle);
      document.querySelectorAll('video,audio').forEach(m=>media.add(m));
      for(const m of media)if(!m.paused&&!m.ended){playing.add(m);pause.call(m);}
      for(const c of contexts)if(c.state==='running'){runningContexts.add(c);c.suspend().catch(()=>{});}
      document.getAnimations().forEach(a=>{if(a.playState==='running'){animations.add(a);a.pause();}});
    }else{
      offset+=native.now()-stoppedAt;state.paused=false;
      for(const t of timers.values())arm(t);
      for(const f of frames.values())armFrame(f);
      for(const m of playing)if(m.src||m.currentSrc)play.call(m).catch(()=>{});
      playing.clear();for(const c of runningContexts)c.resume().catch(()=>{});runningContexts.clear();
      for(const a of animations)if(a.playState==='paused')a.play();animations.clear();
    }
    document.documentElement.classList.toggle('lm-scene-paused',desired);
    window.dispatchEvent(new CustomEvent('lm:pausechange',{detail:{paused:desired}}));
  };
  state.resume=()=>state.setPaused(false);
  // Chapters without a safe in-place restore must finish the isolated teaching page.
  // Keep its writes isolated while it closes; reopening from the map reads the student's record.
  state.exitTeachingToMap = /\/scenes\/(ruijin|yudu|xiangjiang|zunyi|chishui|jinshajiang|luding|snowgrass)\//.test(location.pathname || '');
  state.setMode = desired => {
    desired=Boolean(desired);if(desired===state.teacher)return;
    if(!desired && state.teacher && state.exitTeachingToMap){
      window.LongMarchWebsite?.leaveTeaching?.();
      return;
    }
    window.dispatchEvent(new CustomEvent('lm:beforemodechange',{detail:{teacher:desired}}));
    state.resume();
    if(desired){
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);
        if(isolated(key))set(originalSession,'lm-classroom:'+key,get(originalLocal,key));
      }
    }
    state.teacher=desired;
    document.documentElement.classList.toggle('lm-teacher-mode',desired);
    const url=new URL(location.href);
    if(desired)url.searchParams.set('teacher','1');else{url.searchParams.delete('teacher');url.searchParams.delete('point');}
    try{history.replaceState(history.state,'',url);}catch(_){/* Opaque website frames keep mode in this runtime. */}
    window.dispatchEvent(new CustomEvent('lm:modechange',{detail:{teacher:desired}}));
  };
  state.debug=()=>({paused:state.paused,timers:timers.size,frames:frames.size,playing:playing.size,clock:sceneNow()});
})();
