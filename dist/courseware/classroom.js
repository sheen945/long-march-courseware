(() => {
  'use strict';
  const scriptURL=new URL(document.currentScript.src), base=new URL('./',scriptURL), root=new URL('../',base);
  const runtime=window.LongMarchClassroom, native=runtime.native;
  const chapterId=location.pathname.match(/\/scenes\/([^/]+)/)?.[1] || 'ruijin';
  const inScene=/\/scenes\//.test(location.pathname);
  let teacher=runtime.teacher, pausedBeforeDrawing=null;
  const points={
    ruijin:[['village','村口'],['hallExterior','宗祠外'],['hallInterior','筹划会场']],
    yudu:[['yudu-woodshop','街巷筹备'],['yudu-sandals','草鞋故事'],['yudu-river','渡河前夜'],['yudu-goodbye','河岸告别']],
    xiangjiang:[['command','行军指挥所'],['scout','全州侦察'],['sand','战役沙盘'],['rear','红三十四师']],
    zunyi:[['village','通道前夕'],['hallExterior','通道会场'],['hallInterior','遵义会场']],
    chishui:[['0','一渡·土城之后'],['1','二渡·重返黔北'],['2','三渡·再入川南'],['3','四渡·东返南进']],
    jinshajiang:[['1','敌情与判断'],['2','三路抢渡'],['3','渡口调整'],['4','组织渡江']],
    luding:[['0','安顺场'],['1','急行军'],['2','泸定桥前沿']],
    snowgrass:[['camp','雪山营地'],['rest','休息点'],['close','互助情境'],['grass','草地行军']],
    final:[['arrival','会宁会师'],['meeting','会宁休整'],['map','征途回顾'],['finale','人物结局'],['epilogue','人物结局·三大主力会师']]
  };
  let data, chapter, currentEntry, filter='全部', drawing=false, modalReturn, activeModal, keywordTimer=0, observer;
  let strokes=[], stroke=null, externalClose=null;
  const $=selector=>document.querySelector(selector);
  const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const button=(label,action,cls='')=>{const b=node('button',cls,label);b.type='button';b.addEventListener('click',action);return b;};
  const resolve=id=>data?.entries.find(e=>e.id===(data.aliases[id]||id));
  const chapterEntries=()=>data.entries.filter(e=>e.chapters.includes(chapterId));
  const entryForText=text=>chapterEntries().find(e=>e.title===text||e.keywords.includes(text))||data.entries.find(e=>e.title===text||e.keywords.includes(text));
  const go=(ch,point)=>window.LongMarchWebsite.go(ch,point);
  const stopSceneEvent=event=>{event.stopPropagation();};

  function showModal(dialog){
    if(activeModal&&activeModal!==dialog)activeModal.classList.remove('is-open');
    if(!activeModal)modalReturn=document.activeElement;
    activeModal=dialog;dialog.classList.add('is-open');dialog.setAttribute('aria-hidden','false');
    document.body.classList.add('lm-course-modal');
    native.timeout(()=>dialog.querySelector('button')?.focus({preventScroll:true}),30);
  }
  function closeModal(){
    if(!activeModal)return;
    activeModal.classList.remove('is-open');activeModal.setAttribute('aria-hidden','true');activeModal=null;
    document.body.classList.remove('lm-course-modal');
    setDrawing(false);clearInk();modalReturn?.focus?.({preventScroll:true});
    const callback=externalClose;externalClose=null;callback?.();
  }
  function createModal(cls,label){
    const d=node('section',cls);d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label',label);d.setAttribute('aria-hidden','true');
    const backdrop=node('div','lm-course-backdrop');backdrop.addEventListener('click',closeModal);d.append(backdrop);
    ['pointerdown','pointerup','wheel'].forEach(type=>d.addEventListener(type,stopSceneEvent));document.body.append(d);return d;
  }
  function sourcesFor(entry,host){
    host.append(node('h3','','史料依据'));
    const list=node('ol','lm-sources');
    entry.sources.forEach(id=>{const source=data.sources[id];if(!source)return;const li=node('li');const a=node('a','',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a,node('small','',source.kind));list.append(li);});
    host.append(list);
  }
  function openArchive(id,options={}){
    const entry=resolve(id);if(!entry)return false;
    if(options.onClose)externalClose=options.onClose;
    currentEntry=entry;const content=$('#lm-archive-body');content.replaceChildren();
    content.append(node('div','lm-archive-kicker',entry.category+' · '+(entry.time||chapter.period)),node('h2','',entry.title),node('p','lm-archive-summary',entry.summary));
    if(entry.person){
      content.append(node('h3','','本章时任职务与层级'),node('p','',entry.rolesByChapter?.[chapterId]||entry.sections[0].text));
    }
    entry.sections.forEach((s,index)=>{
      if(entry.person&&index===0){
        if(entry.rolesByChapter?.[chapterId]){const details=node('details');details.append(node('summary','','查看任职变化'),node('p','',s.text));content.append(details);}return;
      }
      content.append(node('h3','',s.title),node('p','',s.text));
    });
    const images=entry.images||(entry.image?[{src:entry.image,caption:entry.imageCaption}]:[]);
    images.forEach(photo=>{const figure=node('figure'),img=node('img');img.src=new URL(photo.src,base);img.alt=photo.caption||entry.title;img.loading='lazy';img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','放大图片：'+img.alt);const enlarge=()=>{const scroll=content.scrollTop;externalClose=()=>{openArchive(entry.id);content.scrollTop=scroll;};openMap(new URL(photo.src,base),entry.title,photo.caption||'配图');};img.addEventListener('click',enlarge);img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enlarge();}});figure.append(img,node('figcaption','',photo.caption));if(photo.source){const link=node('a','','查看照片来源');link.href=photo.source;link.target='_blank';link.rel='noopener noreferrer';figure.append(link);}content.append(figure);});
    sourcesFor(entry,content);
    if(entry.person)content.append(node('p','lm-catalog-note','职务按上文所列时段理解。此处不以后来授予的军衔代替长征时的实际职务。'));
    const related=chapterEntries().filter(e=>e.id!==entry.id&&entry.sections.some(s=>s.text.includes(e.title))).slice(0,12);
    if(related.length){content.append(node('h3','','关联档案'));const links=node('div','lm-related');related.forEach(e=>links.append(button(e.title,()=>openArchive(e.id))));content.append(links);}
    content.scrollTop=0;showModal($('#lm-archive'));decorate(content);return true;
  }
  function openIndex(){
    currentEntry=null;const content=$('#lm-archive-body');content.replaceChildren(node('div','lm-archive-kicker',chapter.period),node('h2','',chapter.title));
    const search=node('input','lm-archive-search');search.type='search';search.placeholder='搜索人物、战役、地点';search.setAttribute('aria-label','搜索本章历史档案');
    const tabs=node('div','lm-archive-filter');['全部','人物档案','战役与行动','重要会议'].forEach(category=>{const b=button(category,()=>{filter=category;render();});b.dataset.category=category;tabs.append(b);});
    const list=node('div','lm-archive-list');list.id='lm-archive-list';
    const render=()=>{list.replaceChildren();tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===filter)));
      const term=search.value.trim();const entries=chapterEntries().filter(e=>(filter==='全部'||e.category===filter)&&(!term||[e.title,e.summary,...e.keywords,...e.sections.map(s=>s.text)].join(' ').includes(term)));
      entries.forEach(e=>{const b=button(e.title,()=>openArchive(e.id));b.dataset.entry=e.id;b.append(node('small','',e.category+(e.person?' · 含时任职务':'') ));list.append(b);});if(!entries.length)list.append(node('p','','没有符合条件的档案。'));
    };
    search.addEventListener('input',render);content.append(search,tabs,list,node('p','lm-catalog-note','人物、战役、会议与资料均可直接查阅。原文、回忆和研究文章在每条档案中分别标注；课堂图解为教学示意。'));render();showModal($('#lm-archive'));content.scrollTop=0;
  }
  function buildArchive(){
    const dialog=createModal('lm-archive-dialog','历史档案');dialog.id='lm-archive';const sheet=node('aside','lm-archive-sheet');
    const head=node('header','lm-archive-head');const title=node('p','','档　历史档案');title.append(node('small','',chapter.title));const actions=node('div','lm-archive-actions');
    const expand=button('放大',()=>{const expanded=dialog.classList.toggle('is-expanded');expand.textContent=expanded?'还原':'放大';expand.setAttribute('aria-pressed',String(expanded));});expand.id='lm-archive-expand';expand.setAttribute('aria-pressed','false');
    const close=button('×',closeModal);close.setAttribute('aria-label','关闭历史档案');actions.append(button('目录',openIndex),expand,close);head.append(title,actions);const body=node('div','lm-archive-body');body.id='lm-archive-body';sheet.append(head,body);dialog.append(sheet);
    const map=createModal('lm-map-dialog','部署示意图');map.id='lm-map';const frame=node('div','lm-map-frame'),mapHead=node('header','lm-map-head');const mapTitle=node('h2');mapTitle.id='lm-map-title';const closeMap=button('关闭',closeModal);mapHead.append(mapTitle,closeMap);const stage=node('div','lm-map-stage'),img=node('img');img.id='lm-map-image';stage.append(img);const foot=node('div','lm-map-foot');foot.id='lm-map-foot';frame.append(mapHead,stage,foot);map.append(frame);
  }
  function openMap(src=new URL(chapter.map,base),title=chapter.title+' · 部署与进程',note='教学示意图，不按地理比例绘制。箭头与方框的含义、时间和部队范围以各图标注为准；史料依据见本章档案。'){
    $('#lm-map-title').textContent=title;$('#lm-map-image').src=src;$('#lm-map-image').alt=title;$('#lm-map-foot').textContent=note;clearInk();showModal($('#lm-map'));
  }
  let toolsResize;
  function buildTools(){
    toolsResize?.disconnect();
    document.documentElement.style.removeProperty('--lm-teacher-tools-clearance');
    $('.lm-course-tools')?.remove();
    if(!teacher){document.documentElement.classList.remove("lm-teacher-tools-collapsed");return;}
    const bar=node('nav','lm-course-tools'+(inScene?'':' lm-course-tools--map'));bar.setAttribute('aria-label','教师授课控制栏');
    {
      const controls=node('div','lm-course-tools__content');controls.id='lm-teacher-controls';
      let collapsed=sessionStorage.getItem('lm-teacher-toolbar-collapsed')==='1';
      const collapse=button('教师授课',()=>{collapsed=!collapsed;if(collapsed)setDrawing(false);sessionStorage.setItem('lm-teacher-toolbar-collapsed',collapsed?'1':'0');syncCollapse();},'lm-teacher-collapse');collapse.id='lm-teacher-collapse';collapse.setAttribute('aria-controls',controls.id);
      const syncCollapse=()=>{document.documentElement.classList.toggle("lm-teacher-tools-collapsed",collapsed);controls.hidden=collapsed;bar.classList.toggle('is-collapsed',collapsed);collapse.setAttribute('aria-expanded',String(!collapsed));collapse.title=collapsed?'展开授课控制栏':'收起授课控制栏';};
      bar.append(collapse,controls);syncCollapse();
      const chapterSelect=node('select');chapterSelect.id='lm-chapter-select';chapterSelect.setAttribute('aria-label','直接进入指定章节');if(!inScene){const placeholder=node('option','','选择授课章节');placeholder.value='';placeholder.disabled=true;placeholder.selected=true;chapterSelect.append(placeholder);}data.chapters.forEach((c,i)=>{const option=node('option','',String(i+1).padStart(2,'0')+' '+c.title);option.dataset.chapter=c.id;option.dataset.label=option.textContent;option.value=c.id;option.selected=inScene&&c.id===chapterId;chapterSelect.append(option);});chapterSelect.addEventListener('change',()=>go(chapterSelect.value,points[chapterSelect.value][0][0]));controls.append(chapterSelect);
      if(inScene){const pointSelect=node('select');pointSelect.id='lm-point-select';pointSelect.setAttribute('aria-label','直接进入本章讲授点');points[chapterId].forEach(([id,label])=>{const option=node('option','',label);option.value=id;option.selected=id===(runtime.point||points[chapterId][0][0]);pointSelect.append(option);});pointSelect.addEventListener('change',()=>go(chapterId,pointSelect.value));controls.append(pointSelect);}
      const pause=button(runtime.paused?'继续播放':'暂停动画',()=>runtime.setPaused(!runtime.paused));pause.id='lm-pause';pause.setAttribute('aria-pressed',String(runtime.paused));controls.append(pause,inScene?button('部署图',()=>openMap()):button('军事部署',()=>$('.strategy-toggle-btn')?.click()));
    }
    if(teacher){
      const pen=button('红笔圈画',()=>setDrawing(!drawing));pen.id='lm-pen';pen.setAttribute('aria-pressed','false');bar.querySelector('.lm-course-tools__content').append(pen);
      const controls=node('span','lm-ink-controls');controls.id='lm-ink-controls';controls.hidden=true;controls.append(button('撤销',()=>{strokes.pop();drawInk();}),button('清除',clearInk));bar.querySelector('.lm-course-tools__content').append(controls);
    }
    document.body.append(bar);
    toolsResize=new ResizeObserver(()=>document.documentElement.style.setProperty('--lm-teacher-tools-clearance',Math.ceil(bar.getBoundingClientRect().height+30)+'px'));
    toolsResize.observe(bar);
    syncLecturePoint();
  }
  function currentLecturePoint(){
    if(window.LongMarchLecturePoint)return String(window.LongMarchLecturePoint());
    if(['ruijin','zunyi'].includes(chapterId))return window.ruijinSceneEngine?.getChapterState?.().currentScene;
    if(chapterId==='yudu')return window.longMarchEngine?.currentScene?.id;
    if(chapterId==='luding')return $('#loading')?.classList.contains('ready')?{'dadu-river':'0','night-march':'1','command-post':'2'}[$('#scene')?.dataset.scene]:undefined;
    if(chapterId==='chishui'){const value=Number($('.stage-heading')?.textContent?.match(/^\s*(\d)/)?.[1]);return value?String(value-1):undefined;}
    if(chapterId==='final'){const phase=window.__CHAPTER9_TEST__?.getState()?.phase;return phase==='memoryMap'?'map':phase==='finale'?(runtime.point==='epilogue'?'epilogue':'finale'):undefined;}
    return runtime.point;
  }
  function syncLecturePoint(){const point=currentLecturePoint();if(point&&points[chapterId]?.some(([id])=>id===point)){runtime.point=point;if($('#lm-point-select'))$('#lm-point-select').value=point;}}
  function toggleMode(){syncLecturePoint();if(!inScene&&!runtime.teacher)sessionStorage.setItem('lm-teacher-toolbar-collapsed','0');runtime.setMode(!runtime.teacher);}
  function buildInk(){
    const canvas=node('canvas');canvas.id='lm-ink';canvas.setAttribute('aria-label','教师红笔圈画层');document.body.append(canvas);
    const point=e=>[e.clientX/innerWidth,e.clientY/innerHeight];
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);stroke=[point(e)];strokes.push(stroke);drawInk();});
    canvas.addEventListener('pointermove',e=>{if(!stroke)return;stroke.push(point(e));drawInk();});
    const finish=()=>{stroke=null;};canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);window.addEventListener('resize',drawInk);drawInk();
  }
  function drawInk(){const canvas=$('#lm-ink');if(!canvas)return;const ratio=devicePixelRatio||1;canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio);const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.strokeStyle='#e52c29';ctx.lineWidth=3.5;ctx.lineCap=ctx.lineJoin='round';strokes.forEach(s=>{ctx.beginPath();s.forEach(([x,y],i)=>i?ctx.lineTo(x*innerWidth,y*innerHeight):ctx.moveTo(x*innerWidth,y*innerHeight));if(s.length===1){ctx.lineTo(s[0][0]*innerWidth+.1,s[0][1]*innerHeight);}ctx.stroke();});}
  function clearInk(){strokes=[];stroke=null;drawInk();}
  function setDrawing(value){
    value=Boolean(value);if(value===drawing||value&&!teacher)return;
    drawing=value;$('#lm-ink')?.classList.toggle('is-drawing',drawing);
    const pen=$('#lm-pen');if(pen){pen.setAttribute('aria-pressed',String(drawing));pen.textContent=drawing?'结束圈画':'红笔圈画';}
    if($('#lm-ink-controls'))$('#lm-ink-controls').hidden=!drawing;
    $('.lm-ink-tip')?.remove();
    if(drawing){pausedBeforeDrawing=runtime.paused;runtime.setPaused(true);document.body.append(node('div','lm-ink-tip','红笔已开启 · Esc 结束圈画，恢复进入前的播放状态'));}
    else if(pausedBeforeDrawing!==null){const restore=pausedBeforeDrawing;pausedBeforeDrawing=null;runtime.setPaused(restore);}
  }

  // Preserve native keywords, but route their clicks to the same expanded archive.
  function keywordEvents(event){
    const el=event.target.closest('.lm-course-keyword,.archive-keyword,[data-archive-id]');if(!el)return;
    let entry=resolve(el.dataset.lmEntry||el.dataset.archiveId)||entryForText(el.textContent.replace(/档/g,'').trim());
    if(!entry)return;event.preventDefault();event.stopImmediatePropagation();openArchive(entry.id);
  }
  function decorate(container=document.body){
    if(!data)return;
    const terms=chapterEntries().flatMap(e=>e.keywords.map(term=>({term,id:e.id}))).filter(x=>x.term.length>=2&&!['军团','方面军'].includes(x.term)).sort((a,b)=>b.term.length-a.term.length);
    const used=new Set();const unique=terms.filter(x=>{if(used.has(x.term))return false;used.add(x.term);return true;});
    const walk=document.createTreeWalker(container,NodeFilter.SHOW_TEXT,{acceptNode(n){
      const p=n.parentElement;if(!p||!n.nodeValue.trim()||n.nodeValue.length>2500)return NodeFilter.FILTER_REJECT;
      if(p.closest('script,style,textarea,input,select,option,button,a,svg,canvas,.lm-course-tools,.lm-unified-topbar,.lm-course-keyword,.archive-keyword,.lm-sources,.lm-archive-list,.lm-archive-filter,.lm-map-dialog,.lm-ink-tip,.lm-chapter-titlecard,#chapterOpening,#chapterNarration,#cinematicNarration,#cinematic,#openingVideoCaption,#loading,#resumeChoice'))return NodeFilter.FILTER_REJECT;
      return /^(P|SPAN|DIV|STRONG|EM|LI|DD|DT|H1|H2|H3|H4|BLOCKQUOTE|SMALL|LABEL)$/.test(p.tagName)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const texts=[];while(walk.nextNode())texts.push(walk.currentNode);
    observer?.disconnect();
    for(const text of texts){let value=text.nodeValue,cursor=0,found=false,frag=document.createDocumentFragment();
      while(cursor<value.length){let best=null,at=value.length;for(const term of unique){const pos=value.indexOf(term.term,cursor);if(pos>=0&&pos<at){best=term;at=pos;}}if(!best)break;found=true;if(at>cursor)frag.append(document.createTextNode(value.slice(cursor,at)));const link=node('span','lm-course-keyword',best.term);link.dataset.lmEntry=best.id;link.setAttribute('role','button');link.tabIndex=0;link.setAttribute('aria-label','查看历史档案：'+best.term);frag.append(link);cursor=at+best.term.length;}
      if(found){frag.append(document.createTextNode(value.slice(cursor)));text.replaceWith(frag);}
    }
    observer?.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  function installKeyboard(){
    document.addEventListener('click',keywordEvents,true);
    document.addEventListener('keydown',event=>{
      if((event.key==='Enter'||event.key===' ')&&event.target.matches('.lm-course-keyword')){keywordEvents(event);return;}
      if(event.key==='Escape'&&(drawing||activeModal)){event.preventDefault();event.stopImmediatePropagation();if(drawing)setDrawing(false);else closeModal();}
      if(event.key==='Tab'&&activeModal){const all=[...activeModal.querySelectorAll('button,a,input,[tabindex="0"]')].filter(e=>e.getClientRects().length);const first=all[0],last=all.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
    },true);
    document.addEventListener('click',event=>{if(event.target.closest('#archiveLibraryButton')){event.preventDefault();event.stopImmediatePropagation();openIndex();}},true);
  }
  let initializing=false,retryNotice;
  async function init(){
    if(initializing||runtime.ready)return;initializing=true;if(retryNotice)retryNotice.disabled=true;
    try{
      const archiveURL=new URL('archives-'+chapterId+'.json',base);const response=await(window.LongMarchResources?.read(archiveURL)||fetch(archiveURL));if(!response.ok)throw Error('档案数据读取失败');data=await response.json();chapter=data.chapters.find(c=>c.id===chapterId);
      buildArchive();buildTools();buildInk();installKeyboard();
      window.addEventListener('lm:pausechange',e=>{const pause=$('#lm-pause');if(pause){pause.textContent=e.detail.paused?'继续播放':'暂停动画';pause.setAttribute('aria-pressed',String(e.detail.paused));}});
      window.addEventListener('lm:beforemodechange',()=>{setDrawing(false);clearInk();});
      window.addEventListener('lm:modechange',()=>{teacher=runtime.teacher;buildTools();});
      native.interval(syncLecturePoint,600);
      window.LongMarchTeaching={openArchive,openIndex,openMap,close:closeModal,isOpen:()=>Boolean(activeModal),go,points,data,toggleMode,prepareLeave:()=>{setDrawing(false);runtime.resume();},getInkCount:()=>strokes.length,getCurrentEntry:()=>currentEntry?.id};
      observer=new MutationObserver(records=>{if(records.every(r=>r.target.closest?.('.lm-course-tools,.lm-map-dialog')))return;native.clearTimeout(keywordTimer);keywordTimer=native.timeout(()=>decorate(),100);});if(inScene)decorate();
      const syncLocks=()=>document.querySelectorAll('#lm-chapter-select option[data-chapter]').forEach(o=>{const locked=window.LongMarchWebsite?.trial===true&&!['ruijin','yudu'].includes(o.dataset.chapter);o.textContent=(locked?'🔒 ':'')+o.dataset.label;});window.addEventListener('lm:websitepolicy',syncLocks);window.addEventListener('lm:modechange',syncLocks);syncLocks();
      runtime.ready=true;retryNotice?.remove();retryNotice=null;window.dispatchEvent(new Event('lm:classroomready'));
    }catch(error){console.error('历史档案暂未载入');if(!retryNotice){retryNotice=button('档案暂未载入，点击重试',()=>data?(window.LongMarchSave?window.LongMarchSave.reload():location.reload()):init(),'lm-course-tools');document.body.append(retryNotice);}retryNotice.disabled=false;}finally{initializing=false;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
