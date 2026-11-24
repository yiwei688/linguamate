(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const c of s)if(c.type==="childList")for(const l of c.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function n(s){const c={};return s.integrity&&(c.integrity=s.integrity),s.referrerPolicy&&(c.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?c.credentials="include":s.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function a(s){if(s.ep)return;s.ep=!0;const c=n(s);fetch(s.href,c)}})();const se=[{account:"demo",password:"123456",level:"B1",tags:["电影迷","慢热型"]},{account:"test",password:"123456",level:"B2",tags:["科技控","破冰者"]}],ue=[{name:"Mia",level:"B1",color:"#7c6cf6",tags:["电影迷","倾听者"]},{name:"Leo",level:"B1",color:"#12b3a6",tags:["科技控","破冰者"]},{name:"Sara",level:"B2",color:"#ff6b4a",tags:["社会派","深聊派"]},{name:"Ken",level:"A2",color:"#f0a91b",tags:["旅行党","慢热型"]},{name:"Ivy",level:"B1",color:"#0ea5e9",tags:["电影迷","深聊派"]},{name:"Noah",level:"B2",color:"#8b5cf6",tags:["科技控","短平快"]},{name:"Zoe",level:"A2",color:"#ef4444",tags:["旅行党","破冰者"]},{name:"Tom",level:"B2",color:"#14b8a6",tags:["社会派","倾听者"]},{name:"Lily",level:"B1",color:"#d946ef",tags:["读书人","慢热型"]},{name:"Owen",level:"A2",color:"#64748b",tags:["游戏党","倾听者"]},{name:"Emma",level:"B1",color:"#f59e0b",tags:["美食家","破冰者"]},{name:"Ryan",level:"B2",color:"#3b82f6",tags:["音乐虫","深聊派"]}],Me=864e5;function ye(e){const t=[];for(let n=0;n<20;n++){const a=ue[n%ue.length],s=4+n*3%11;t.push({partner:a.name,minutes:s,at:Date.now()-n*Me-36e5,mode:n%3===0?"stretch":"chill",tags:a.tags})}return e==="demo"?t:t.slice(0,4)}const pe=new Map([["demo",ye("demo")],["test",ye("test")]]),Ne=new Set(["破冰者","慢热型","倾听者","深聊派"]);function _e(e){const t=se.find(r=>r.account===e);if(!t)return{ok:!1,error:"账号不存在"};const n=pe.get(e)??[],a=new Map;for(const r of n)for(const m of r.tags)Ne.has(m)||a.set(m,(a.get(m)??0)+r.minutes);const s=[...a.entries()].map(([r,m])=>({tag:r,minutes:m})).sort((r,m)=>m.minutes-r.minutes),c=n.reduce((r,m)=>r+m.minutes,0),l=n.reduce((r,m)=>Math.max(r,m.minutes),0),b=new Set(n.map(r=>r.partner)).size,u=[...new Set(n.map(r=>new Date(r.at).toISOString().slice(0,10)))].sort().reverse();let w=u.length?1:0;for(let r=1;r<u.length;r++){const m=new Date(`${u[r-1]}T00:00:00Z`).getTime(),T=new Date(`${u[r]}T00:00:00Z`).getTime();if(m-T===Me)w++;else break}return{ok:!0,data:{user:{account:t.account,level:t.level,tags:t.tags},stats:{totalMinutes:c,sessions:n.length},recent:n.slice(0,20),topics:s,badges:[{id:"first",title:"第一次开口",unlocked:n.length>=1},{id:"streak5",title:"连续 5 天",unlocked:w>=5},{id:"ten",title:"10 分钟不冷场",unlocked:l>=10},{id:"stretch",title:"完成进阶挑战",unlocked:n.some(r=>r.mode==="stretch")},{id:"min300",title:"累计 300 分钟",unlocked:c>=300},{id:"friends3",title:"交到 3 个语伴",unlocked:b>=3},{id:"b2",title:"等级升到 B2",unlocked:t.level==="B2"},{id:"review20",title:"回看 20 次",unlocked:!1}]}}}const ke={A2:1,B1:2,B2:3},Ve=4;function Je(e,t,n){return ue.map(a=>({name:a.name,level:a.level,color:a.color,tags:a.tags,shared:a.tags.filter(s=>t.includes(s)),diff:a.tags.filter(s=>!t.includes(s)),online:!1})).filter(a=>e==="chill"?a.shared.length>0:a.diff.length===a.tags.length||(ke[a.level]??0)>(ke[n]??0))}async function Ye(e,t){const[n,a=""]=e.split("?"),s=new URLSearchParams(a),c=t??{};if(n==="/login"){const l=String(c.account??""),b=String(c.password??""),u=se.find(w=>w.account===l);return!u||u.password!==b?{ok:!1,error:"账号或密码错误（演示账号 demo / 123456）"}:{ok:!0,data:{ok:!0,user:{account:u.account,level:u.level,tags:u.tags}}}}if(n==="/register"){const l=String(c.account??"");if(se.some(u=>u.account===l))return{ok:!1,error:"该账号已被注册（演示模式只存在浏览器里）"};const b={account:l,password:String(c.password??""),level:"B1",tags:["电影迷","慢热型"]};return se.push(b),pe.set(l,[]),{ok:!0,data:{ok:!0,user:{account:l,level:b.level,tags:b.tags}}}}if(n==="/partners"){const l=s.get("mode")??"chill",b=(s.get("tags")??"").split(",").filter(Boolean),u=s.get("level")??"B1",w=Number(s.get("offset")??0)||0,r=Je(l,b,u),m=r.length?w%r.length:0;return{ok:!0,data:{ok:!0,partners:[...r.slice(m),...r.slice(0,m)].slice(0,Ve),total:r.length,realCount:0}}}if(n==="/profile")return _e(s.get("account")??"");if(n==="/practices"&&t===void 0){const l=s.get("account")??"";return{ok:!0,data:{ok:!0,practices:pe.get(l)??[]}}}return{ok:!1,error:"静态演示模式：这个功能需要本地服务器（房间、语音、匹配队列）"}}async function I(e,t){return Ye(e,t)}const k={register:e=>I("/register",e),login:e=>I("/login",e),partners:(e,t,n,a,s=0)=>I(`/partners?mode=${encodeURIComponent(t)}&tags=${encodeURIComponent(n.join(","))}&level=${encodeURIComponent(a)}&offset=${s}&account=${encodeURIComponent(e)}`),practices:e=>I(`/practices?account=${encodeURIComponent(e)}`),addPractice:e=>I("/practices",e),profile:e=>I(`/profile?account=${encodeURIComponent(e)}`),roomInvite:e=>I("/room/invite",e),roomJoin:e=>I("/room/join",e),roomState:(e,t)=>I(`/room/state?roomId=${encodeURIComponent(e)}&clientId=${encodeURIComponent(t)}`),roomLeave:e=>I("/room/leave",e),queueJoin:e=>I("/queue",e),queueLeave:e=>I("/queue/leave",e),presence:e=>I("/presence",e),inviteSend:e=>I("/invite",e),invites:e=>I(`/invites?account=${encodeURIComponent(e)}`),inviteRespond:e=>I("/invite/respond",e),roomCreate:e=>I("/room/create",e),signalSend:e=>I("/signal",e),signalPoll:(e,t)=>I(`/signal?roomId=${encodeURIComponent(e)}&since=${t}`)},fe="linguamate.session";function J(){const e=localStorage.getItem(fe);if(!e)return null;try{return JSON.parse(e)}catch{return null}}function Te(e){localStorage.setItem(fe,JSON.stringify(e))}function Ce(){localStorage.removeItem(fe)}async function Ke(e){const t=await k.register(e);return t.ok?(Te(t.data.user),{ok:!0}):{ok:!1,msg:t.error}}async function Fe(e,t){const n=await k.login({account:e,password:t});return n.ok?(Te(n.data.user),{ok:!0}):{ok:!1,msg:n.error}}const $e="lm.client";function R(){let e=sessionStorage.getItem($e);return e||(e=crypto.randomUUID(),sessionStorage.setItem($e,e)),e}let me=[];function ve(e){me.push(e)}function Ze(){for(const e of me)try{e()}catch{}me=[]}const M=J(),Ae=M?.level??"B1",Se=M?.tags??[],ae=[{title:"最近一件让你开心的小事",en:"A small thing that made your day",tips:[{en:"Honestly, the smallest thing made my day yesterday.",cn:"说真的，昨天一件极小的事让我开心了一整天。"},{en:"It's nothing special, but it still makes me smile.",cn:"没什么特别的，但想起来还是会笑。"},{en:"I guess small things hit harder than big ones.",cn:"我觉得小事反而比大事更打动人。"},{en:"I almost missed it, but then I noticed and felt great.",cn:"我差点错过，但注意到之后心情特别好。"}]},{title:"你最近在追的剧或游戏",en:"What you are binge-watching lately",tips:[{en:"I'm three episodes in and already hooked.",cn:"我才看了三集就已经上头了。"},{en:"The plot is simple, but the acting carries it.",cn:"剧情一般，但演技撑住了。"},{en:"I'd recommend it if you like slow stories.",cn:"如果你喜欢慢节奏的故事，我推荐。"},{en:"No spoilers, I promise.",cn:"放心，我不剧透。"}]},{title:"如果能立刻去一个地方",en:"One place you would go tomorrow",tips:[{en:"If I could teleport, I would be on a beach right now.",cn:"要是能瞬移，我现在就在海滩上了。"},{en:"I have been saving a trip for months.",cn:"我为一个旅行攒了好几个月的钱。"},{en:"I prefer small towns to big cities.",cn:"比起大城市，我更喜欢小镇。"},{en:"The food is honestly half the reason.",cn:"说真的，吃占了一半的理由。"}]}],L=e=>document.querySelector(e),ze={chill:"轻松闲聊",stretch:"挑战进阶"};function Ee(e){return`
    <div class="topic-head">
      <span class="badge">今日推荐话题</span>
      <h2>${e.title}</h2>
      <p class="sub">${e.en}</p>
    </div>
    <ul class="tips">
      ${e.tips.map(t=>`<li><b>${t.en}</b><span>${t.cn}</span></li>`).join("")}
    </ul>`}function Ge(){return`
  <div class="lobby">
    <div class="lobby-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="lobby-who">
        <span>${J()?.account??"未登录"}</span>
        <span class="dot-sep">·</span>
        <span>${Ae}</span>
        <div class="top-actions">
          <div class="menu" id="room-menu">
            <button class="pill-link" type="button" id="room-menu-btn">房间 ▾</button>
            <div class="menu-panel">
              <button type="button" data-room="create">创建房间</button>
              <button type="button" data-room="join">加入房间</button>
            </div>
          </div>
          <a class="pill-link" href="#/me">我的</a>
          <button class="link-quit" id="lobby-logout">退出</button>
        </div>
      </div>
    </div>

    <div class="hall">
      <section class="stage" id="stage">
        <div class="stage-head" id="stage-head">
          <h2>今天想怎么聊？</h2>
          <p class="sub">选一个，系统马上开始配对</p>
        </div>

        <div class="modes" id="modes">
          <button class="mode" type="button" data-mode="chill">
            <span class="mode-name">轻松闲聊</span>
            <span class="mode-desc">和标签有交集的人聊今天的话题</span>
          </button>
          <span class="or">或</span>
          <button class="mode" type="button" data-mode="stretch">
            <span class="mode-name">挑战进阶</span>
            <span class="mode-desc">换一个完全不同的话题，逼自己换频道</span>
          </button>
        </div>

        <div id="search-area"></div>
        <div id="results"></div>
      </section>

      <aside class="side">
        <section class="card topic">
          <div id="topic-box">${Ee(ae[0])}</div>
          <div class="topic-foot">
            <button class="btn ghost sm" type="button" id="topic-next">换个话题</button>
          </div>
        </section>
      </aside>
    </div>

    <div class="mask" id="invite-mask" hidden>
      <div class="modal invite-modal">
        <h3>有人邀请你一起练</h3>
        <div id="invite-list"></div>
      </div>
    </div>

    <div class="mask" id="new-room-mask" hidden>
      <div class="modal new-room-modal">
        <h3>创建房间，想怎么聊？</h3>
        <div class="new-room-actions">
          <button class="btn" type="button" data-new-mode="chill">轻松闲聊</button>
          <button class="btn ghost" type="button" data-new-mode="stretch">挑战进阶</button>
        </div>
        <button class="link" type="button" id="new-room-cancel">取消</button>
      </div>
    </div>
  </div>`}function We(){const e=L("#stage"),t=L("#stage-head"),n=L("#modes"),a=L("#search-area"),s=L("#results"),c=L("#topic-box"),l=L("#invite-mask"),b=L("#invite-list");let u=null,w=0,r,m,T=0,f=0,h=0,S=0;const A=()=>{r!==void 0&&(window.clearInterval(r),r=void 0)},X=()=>{c.innerHTML=Ee(ae[T])},K=()=>{if(!u){a.innerHTML="";return}a.innerHTML=`
      <div class="bar">
        <span class="search-dot"></span>
        <b>正在找「${ze[u]}」的语伴…</b>
        <span class="muted">已等待 <span id="wait">${w}</span> 秒</span>
        <button class="btn ghost sm" type="button" id="cancel">取消匹配</button>
      </div>
      <p class="ai-hint" id="ai-hint" ${w<15?"hidden":""}>
        还没找到合适的？<button class="link" type="button" id="ai">换 AI 练习 →</button>
      </p>`,L("#cancel").onclick=F,L("#ai").onclick=()=>{A(),a.innerHTML='<div class="bar"><span class="search-dot"></span><b>AI 练习还没做</b><span class="muted">等语音室那阶段接进来</span><button class="btn ghost sm" type="button" id="cancel">返回</button></div>',L("#cancel").onclick=F,s.innerHTML=""}},Q=o=>{if(o.length===0){s.innerHTML='<div class="empty-box">这个模式里现在没有人，等一会儿再试</div>';return}const p=o.length-S,$=h>p;s.innerHTML=`
      ${$?'<div class="results-bar"><button class="btn ghost sm" type="button" id="reshuffle">换一批</button></div>':""}
      <div class="grid-mates">
        ${o.map(g=>{const U=g.online?'<span class="shared">在线</span>':u==="chill"?`<span class="shared">共同标签 ${g.shared.length}</span>`:g.diff.length>=2?`<span class="shared diff">话题差异 ${g.diff.length}</span>`:g.diff.length===1?`<span class="shared diff">新话题 ${g.diff[0]}</span>`:'<span class="shared diff">等级更高</span>',G=g.online?`<button class="btn sm" type="button" data-invite-user="${g.name}">邀请</button>`:'<span class="muted">示例语伴</span>';return`
          <article class="mate">
            <div class="mate-head">
              <span class="ava" style="background:${g.color}">${g.name[0]}</span>
              <div><b>${g.name}</b><span class="muted">${g.level}</span></div>
              ${U}
            </div>
            <div class="tags">
              ${g.tags.map(W=>`<span class="tag ${g.shared.includes(W)?"hit":""}">${W}</span>`).join("")}
            </div>
            <div class="mate-actions">${G}</div>
          </article>`}).join("")}
      </div>`,s.querySelectorAll("[data-invite-user]").forEach(g=>{g.onclick=async()=>{if(!M)return;g.disabled=!0,g.textContent="邀请中…";const U=await k.inviteSend({fromAccount:M.account,fromClientId:R(),toAccount:g.dataset.inviteUser??""});if(!U.ok){g.disabled=!1,g.textContent="邀请",s.insertAdjacentHTML("beforeend",`<div class="empty-box">${U.error}</div>`);return}location.hash="#/wait/"+U.data.roomId}});const N=document.querySelector("#reshuffle");N&&(N.onclick=()=>{H(f+4)})},H=async o=>{const p=u;if(!p||!M)return;const $=await k.partners(M.account,p,Se,Ae,o);if(!(!u||u!==p)){if(!$.ok){s.innerHTML=`<div class="empty-box">${$.error}</div>`;return}h=$.data.total,S=$.data.realCount,f=h?o%h:0,Q($.data.partners)}},D=async o=>{M&&await k.presence({account:M.account,clientId:R()})},ee=async o=>{u=o,w=0,A(),e.classList.add("is-searching"),t.hidden=!0,n.hidden=!0,K(),s.innerHTML="";const p=document.querySelector("#wait");p&&(p.textContent="0"),r=window.setInterval(()=>{w++;const $=document.querySelector("#wait");$&&($.textContent=String(w)),w===15&&K()},1e3),f=0,h=0,S=0,await D(),await H(0),window.clearInterval(m),m=window.setInterval(()=>{u&&H(f)},3e3)};function F(){A(),window.clearInterval(m),u&&k.queueLeave({clientId:R()}),u=null,w=0,f=0,h=0,S=0,a.innerHTML="",s.innerHTML="",e.classList.remove("is-searching"),t.hidden=!1,n.hidden=!1,D()}const te=o=>{if(M){if(o.length===0){l.hidden=!0,b.innerHTML="";return}l.hidden=!1,b.innerHTML=o.map(p=>`
        <div class="invite-row" data-invite="${p.id}">
          <b class="invite-name">${p.from}</b>
          <div class="tags">
            ${p.tags.map($=>`<span class="tag ${Se.includes($)?"hit":""}">${$}</span>`).join("")}
          </div>
          <div class="invite-row-actions">
            <button class="btn sm" type="button" data-accept="${p.id}">接受</button>
            <button class="btn ghost sm" type="button" data-decline="${p.id}">拒绝</button>
          </div>
        </div>`).join(""),b.querySelectorAll("[data-accept]").forEach(p=>{p.onclick=async()=>{const $=await k.inviteRespond({inviteId:p.dataset.accept??"",account:M.account,clientId:R()});$.ok&&$.data.roomId&&(l.hidden=!0,location.hash="#/room/"+$.data.roomId)}}),b.querySelectorAll("[data-decline]").forEach(p=>{p.onclick=async()=>{await k.inviteRespond({inviteId:p.dataset.decline??"",account:M.account,clientId:R()}),await Z()}})}},Z=async()=>{if(!M)return;const o=await k.invites(M.account);o.ok&&te(o.data.invites)},C=L("#room-menu");let E;const O=()=>{window.clearTimeout(E),C.classList.add("open")},B=()=>{window.clearTimeout(E),E=window.setTimeout(()=>C.classList.remove("open"),800)},z=()=>{window.clearTimeout(E),C.classList.remove("open")};C.addEventListener("mouseenter",O),C.addEventListener("mouseleave",B),document.addEventListener("click",z),L("#room-menu-btn").onclick=o=>{o.stopPropagation(),C.classList.toggle("open")};const P=L("#new-room-mask");document.querySelectorAll("[data-room]").forEach(o=>{o.onclick=()=>{if(o.dataset.room==="join"){location.hash="#/join";return}P.hidden=!1}}),P.querySelectorAll("[data-new-mode]").forEach(o=>{o.onclick=async()=>{if(!M)return;const p=await k.roomCreate({account:M.account,clientId:R(),mode:o.dataset.newMode});if(P.hidden=!0,!p.ok){s.innerHTML=`<div class="empty-box">${p.error}</div>`;return}location.hash="#/room/"+p.data.roomId}}),L("#new-room-cancel").onclick=()=>{P.hidden=!0},L("#lobby-logout").onclick=()=>{Ce(),location.hash="#/login"},L("#topic-next").onclick=()=>{if(ae.length<2)return;let o=T;for(;o===T;)o=Math.floor(Math.random()*ae.length);T=o,X()},n.querySelectorAll(".mode").forEach(o=>{o.onclick=()=>{ee(o.dataset.mode??"chill")}});const ie=window.setInterval(()=>{D()},3e3),ce=window.setInterval(()=>{Z()},2e3);D(),Z(),ve(()=>{window.clearInterval(ie),window.clearInterval(ce),window.clearInterval(m),window.clearTimeout(E),document.removeEventListener("click",z),C.removeEventListener("mouseenter",O),C.removeEventListener("mouseleave",B),A(),D()})}const Ie=e=>document.querySelector(e),Le=["#7c6cf6","#12b3a6","#ff6b4a","#f0a91b","#0ea5e9","#8b5cf6","#ef4444","#14b8a6"];function Xe(e){let t=0;for(const n of e)t+=n.charCodeAt(0);return Le[t%Le.length]}function je(e){const t=new Date(e);return`${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}function Qe(e){if(e.length===0)return'<div class="empty-box">还没有练习记录，去大厅找一个语伴吧</div>';const t=[];let n=-1;for(const a of e.slice(0,20)){const s=new Date(a.at).getFullYear();s!==n&&(t.push(`<li class="year-row">${s} 年</li>`),n=s);const c=a.mode==="chill"?'<span class="mode-badge chill">闲聊</span>':a.mode==="stretch"?'<span class="mode-badge stretch">进阶</span>':"";t.push(`<li class="p-row">
      <span class="r-date">${je(a.at)}</span>
      <span class="r-who">${a.partner}</span>
      ${c}
      <span class="r-min ${a.minutes<3?"short":""}">${a.minutes} 分钟</span>
      <span class="r-tags">${a.tags.map(l=>`<i>${l}</i>`).join("")}</span>
    </li>`)}return`<ul class="recent-list">${t.join("")}</ul>`}const et={电影迷:"影视",科技控:"科技",旅行党:"旅行",社会派:"社会",音乐虫:"音乐",美食家:"美食",游戏党:"游戏",读书人:"读书"};function tt(e){const t=e.length,n=300,a=150,s=100,c=Math.max(...e.map(f=>f.minutes),1),l=(f,h)=>{const S=-Math.PI/2+f*2*Math.PI/t;return[a+Math.cos(S)*h,a+Math.sin(S)*h]},b=[.25,.5,.75,1].map(f=>`<polygon points="${e.map((h,S)=>l(S,s*f).join(",")).join(" ")}" fill="none" stroke="#e6e7eb" />`).join(""),u=e.map((f,h)=>{const[S,A]=l(h,s);return`<line x1="${a}" y1="${a}" x2="${S}" y2="${A}" stroke="#e6e7eb" />`}).join(""),w=e.map(f=>f.minutes>0?Math.max(s*.1,f.minutes/c*s):0),r=e.map((f,h)=>l(h,w[h]).join(",")).join(" "),m=e.map((f,h)=>{const[S,A]=l(h,w[h]);return`<circle cx="${S}" cy="${A}" r="3" fill="#12b3a6" />`}).join(""),T=e.map((f,h)=>{const[S,A]=l(h,s+26);return`<text x="${S}" y="${A}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#6b7280">${et[f.tag]??f.tag}</text>`}).join("");return`<svg class="radar" width="${n}" height="${n}" viewBox="0 0 ${n} ${n}">
    ${b}${u}
    <polygon points="${r}" fill="rgba(18,179,166,0.16)" stroke="#12b3a6" stroke-width="2" stroke-linejoin="round" />
    ${m}${T}
  </svg>`}function nt(e){if(e.length===0)return'<div class="empty-box">还没有练习记录，聊过一次就会有图</div>';if(e.length<3)return`<ul class="topic-bars">${e.map(n=>`<li><span>${n.tag}</span><b>${n.minutes} 分钟</b></li>`).join("")}</ul>`;const t=e.slice(0,3).map(n=>`${n.tag} ${n.minutes}′`).join(" · ");return`<div class="radar-wrap">${tt(e)}</div><p class="topic-top">聊得最多：${t}</p>`}function st(e){const t=e.user,n=e.recent??[],a=e.topics??[],s=e.badges??[],c=n.length?je(n[0].at):"—";return`
    <section class="card pcard">
      <div class="pcard-head">
        <span class="ava big" style="background:${Xe(t.account)}">${t.account[0]}</span>
        <div class="pcard-who">
          <h1>${t.account}</h1>
          <span class="level-badge">${t.level}</span>
        </div>
      </div>

      <div class="tags">
        ${t.tags.map(l=>`<span class="tag">${l}</span>`).join("")}
      </div>

      <div class="stats">
        <div class="stat"><b>${e.stats.totalMinutes}</b><span>累计练习分钟</span></div>
        <div class="stat"><b>${e.stats.sessions}</b><span>练习次数</span></div>
        <div class="stat"><b>${c}</b><span>最近一次</span></div>
      </div>
    </section>

    <section class="card recent">
      <h2>最近练习</h2>
      ${Qe(n)}
    </section>

    <section class="card growth">
      <h2>成长图谱</h2>
      <p class="sub">按聊过的话题统计（分钟）</p>
      ${nt(a)}
    </section>

    <section class="card badges-card">
      <h2>成就墙</h2>
      <div class="badge-grid">
        ${s.map(l=>`<div class="badge ${l.unlocked?"":"lock"}"><b>${l.title}</b><span>${l.unlocked?"已解锁":"未解锁"}</span></div>`).join("")}
      </div>
    </section>`}function at(){return`
  <div class="profile">
    <div class="profile-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="top-actions">
        <a class="pill-link" href="#/app">返回大厅</a>
        <button class="link-quit" type="button" id="profile-logout">退出</button>
      </div>
    </div>

    <div id="profile-body">
      ${J()?'<div class="card"><div class="empty-box">正在加载…</div></div>':'<div class="card"><div class="empty-box">未登录</div></div>'}
    </div>
  </div>`}function ot(){const e=Ie("#profile-body"),t=J();if(Ie("#profile-logout").onclick=()=>{Ce(),location.hash="#/login"},!t)return;(async()=>{const a=await k.profile(t.account);if(!a.ok){e.innerHTML=`<div class="card"><div class="empty-box">${a.error}</div></div>`;return}try{e.innerHTML=st(a.data)}catch(s){console.error("[profile] 渲染失败",s),e.innerHTML='<div class="card"><div class="empty-box">页面数据不完整，刷新试试；还不行就把这里的情况告诉开发者</div></div>'}})()}const v=e=>document.querySelector(e),it=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,ct={new:"准备中",connecting:"正在连接…",connected:"已连接",disconnected:"连接中断",failed:"连接失败",closed:"已关闭"};function Re(e){return`<div class="room-top">
    <div class="brand"><span class="logo">L</span>LinguaMate</div>
    <div class="top-actions">${e}</div>
  </div>`}function rt(e){return`<div class="room-shell">
    ${Re('<a class="pill-link" href="#/app">返回大厅</a>')}
    <section class="card waiting">
      <h1>等待对方接受…</h1>
      <p class="sub">邀请发出去了，把房间号给对方就能开始</p>
      <div class="room-code" id="wait-code">${e}</div>
      <div class="wait-actions">
        <button class="btn ghost sm" id="wait-copy" type="button">复制房间号</button>
        <button class="btn ghost sm" id="wait-cancel" type="button">取消邀请</button>
      </div>
      <p class="note">测试方法：另开一个无痕窗口（Ctrl+Shift+N）→ 登录另一个账号 → 大厅右上「房间 → 加入房间」→ 输入 ${e}</p>
    </section>
  </div>`}function lt(e){const t=v("#wait-code");let n=!1,a;v("#wait-copy").onclick=()=>{navigator.clipboard?.writeText(e),v("#wait-copy").textContent="已复制"},v("#wait-cancel").onclick=()=>{n=!0,a&&window.clearInterval(a),k.roomLeave({clientId:R()}),location.hash="#/app"};const s=async()=>{if(n)return;const c=await k.roomState(e,R());if(!c.ok){t.textContent="房间已结束",v("#wait-cancel").textContent="返回大厅";return}c.data.room.guest&&(n=!0,a&&window.clearInterval(a),location.hash="#/room/"+e)};s(),a=window.setInterval(()=>{s()},1e3),ve(()=>{n=!0,a&&window.clearInterval(a)})}function dt(){return`<div class="room-shell">
    ${Re('<a class="pill-link" href="#/app">返回大厅</a>')}
    <section class="card waiting">
      <h1>加入房间</h1>
      <p class="sub">输入对方给你的 6 位房间号</p>
      <label class="field">房间号
        <input id="join-code" maxlength="6" placeholder="例如 A1B2C3" autocomplete="off" />
      </label>
      <p class="err" id="join-err" hidden></p>
      <button class="btn" id="join-go" type="button">加入</button>
    </section>
  </div>`}function ut(){const e=J();if(!e){location.hash="#/login";return}const t=v("#join-code"),n=v("#join-err"),a=async()=>{const s=t.value.trim().toUpperCase();if(s.length!==6){n.textContent="房间号是 6 位",n.hidden=!1;return}const c=await k.roomJoin({account:e.account,clientId:R()});if(!c.ok){n.textContent=c.error,n.hidden=!1;return}location.hash="#/room/"+s};v("#join-go").onclick=()=>{a()},t.onkeydown=s=>{s.key==="Enter"&&a()}}function pt(e){return`<div class="room-shell">
    <div class="rbar">
      <div class="rwho">
        <b id="r-title">房间 ${e}</b>
        <span class="muted" id="r-peer">正在确认对方…</span>
      </div>
      <div class="prog">
        <div class="track"><i id="r-bar"></i></div>
        <div class="lbl"><span>已练 <b id="r-clock">00:00</b></span><span>最低 3:00 · 优秀 10:00</span></div>
      </div>
      <button class="btn ghost sm" id="r-copy" type="button">复制房间号</button>
      <button class="btn ghost sm" id="r-end" type="button">结束练习</button>
    </div>

    <div class="rbody">
      <div class="rleft">
        <div class="stream" id="r-stream">
          <div class="stream-empty">双方都点「麦克风」并允许权限后，就能互相听见。</div>
        </div>
        <div class="inputrow">
          <button class="btn sm" id="r-mic" type="button">麦克风</button>
          <button class="btn ghost sm" id="r-ear" type="button">听筒</button>
          <span class="muted" id="r-live">麦克风未开启 · 听筒关闭</span>
          <span class="muted" id="r-link">连接：准备中</span>
          <button class="btn ghost sm" id="r-retry" type="button">重连</button>
        </div>
        <audio id="r-remote" autoplay playsinline muted></audio>
      </div>

      <aside class="rright">
        <div class="rright-head">AI 副驾</div>
        <div class="copilot">
          <div class="cblock">
            <h4>当前话题</h4>
            <p>最近一件让你开心的小事</p>
          </div>
          <div class="cblock">
            <h4>高频词</h4>
            <div class="words"><span>honestly</span><span>kind of</span><span>make my day</span></div>
          </div>
          <div class="cblock">
            <h4>救场句型（点一下听发音）</h4>
            <div class="phrase" data-say="That reminds me of something that happened last week.">
              <span class="en">That reminds me of…</span>
              <button class="say" type="button">🔊</button>
            </div>
            <div class="phrase" data-say="I can't remember the word, but it's like a small box.">
              <span class="en">I can't remember the word, but it's like…</span>
              <button class="say" type="button">🔊</button>
            </div>
            <div class="rescue" id="r-rescue" hidden>
              <b>安静 8 秒了</b>
              <p id="r-rescue-text">Honestly, the smallest thing made my day…</p>
              <button class="link" id="r-rescue-say" type="button">🔊 听一下</button>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <div class="mask" id="left-mask" hidden>
      <div class="modal left-modal">
        <p class="left-text" id="left-text">对方已离开房间</p>
        <button class="btn" id="left-go" type="button">离开房间</button>
      </div>
    </div>
  </div>`}function mt(e){const t=J();if(!t){location.hash="#/login";return}const n=R();let a=0,s,c=!0;const l=v("#r-link"),b=v("#r-live"),u=v("#r-mic"),w=v("#r-ear"),r=v("#r-remote");r.muted=!0;let m=null,T=!1,f=!1;const h=()=>{b.textContent=`麦克风${T?"已开启":"未开启"} · 听筒${f?"已开":"关闭"}`};h();const S=v("#r-stream"),A=v("#r-rescue"),X=v("#r-rescue-text");let K="对方",Q=Date.now(),H=!1;const D=["Honestly, the smallest thing made my day…","That reminds me of something that happened last week.","I can't remember the word, but it's like…","What about you? Has anything like that happened to you?"],ee=i=>{try{const d=new SpeechSynthesisUtterance(i);d.lang="en-US",d.rate=.9,speechSynthesis.cancel(),speechSynthesis.speak(d)}catch{}},F=()=>{Q=Date.now(),H&&(H=!1,A.hidden=!0)},te=(i,d)=>{S.querySelector(".stream-empty")?.remove();const y=document.createElement("div");y.className=`msg ${d?"self":""}`;const _=d?t?.account?.[0]??"我":K[0]??"对";y.innerHTML=`
      <span class="m-ava" style="background:${d?"#ff6b4a":"#7c6cf6"}">${_}</span>
      <div class="bub voice">🎤 ${i} 秒
        <span class="tr">（转写：接入语音识别后显示）</span>
      </div>`,S.appendChild(y),S.scrollTop=S.scrollHeight},Z=window.setInterval(()=>{!a||H||Date.now()-Q<8e3||(H=!0,X.textContent=D[Math.floor(Math.random()*D.length)],A.hidden=!1)},1e3);document.querySelectorAll("[data-say]").forEach(i=>{const d=()=>ee(i.dataset.say??"");i.querySelector(".say")?.addEventListener("click",y=>{y.stopPropagation(),d()}),i.addEventListener("click",d)}),v("#r-rescue-say").onclick=()=>ee(X.textContent??"");let C=null,E=null,O,B=!1,z=0,P=0;const ie=i=>{try{C=new AudioContext;const y=C.createMediaStreamSource(i);E=C.createAnalyser(),E.fftSize=512,y.connect(E)}catch{return}const d=new Float32Array(E.fftSize);O=window.setInterval(()=>{if(!E)return;E.getFloatTimeDomainData(d);let y=0;for(let j=0;j<d.length;j++)y+=d[j]*d[j];const _=Math.sqrt(y/d.length),Y=Date.now();if(_>.02)P=Y,F(),B||(B=!0,z=Y);else if(B&&Y-P>600){B=!1;const j=P-z;if(j>=700){const Oe=String(Math.max(1,Math.round(j/1e3)));te(Oe,!0),k.signalSend({})}}},100)},ce=()=>{O&&window.clearInterval(O),O=void 0,E=null,C?.close().catch(()=>{}),C=null,B=!1};let o=null,p=null,$=!1,N=[],g=0;const U=()=>{const i=o?.connectionState??"new";l.textContent=`连接：${ct[i]??i}`},G=()=>{o?.close(),o=null,p=null},W=async()=>{if(o){for(const i of N)try{await o.addIceCandidate(i)}catch{}N=[]}},re=()=>{G(),o=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]}),p=null,$=!1,N=[],o.ontrack=i=>{r.srcObject=i.streams[0]??new MediaStream([i.track]),r.muted=!f},o.onicecandidate=i=>{i.candidate&&k.signalSend({data:i.candidate.toJSON()})},o.onconnectionstatechange=U,U()};re();const ne=async()=>{if(!o)return;const i=o.getTransceivers(),d=i.find(y=>y.mid!==null)??i[0];if(d&&(d.direction!=="sendrecv"&&(d.direction="sendrecv"),p=d.sender,m)){const y=m.getAudioTracks()[0];y&&await p.replaceTrack(y).catch(()=>{})}},De=async()=>{if(!o||$)return;$=!0,o.getTransceivers().length===0&&o.addTransceiver("audio",{direction:"sendrecv"}),await ne();const i=await o.createOffer();await o.setLocalDescription(i),await ne(),await k.signalSend({data:o.localDescription})},Be=async(i,d)=>{if(o)if(i==="offer"){await o.setRemoteDescription(d),await ne(),await W();const y=await o.createAnswer();await o.setLocalDescription(y),await k.signalSend({data:o.localDescription})}else if(i==="answer")await o.setRemoteDescription(d),await ne(),await W();else if(i==="ice")if(o.remoteDescription)try{await o.addIceCandidate(d)}catch{}else N.push(d);else i==="retry"?re():i==="bubble"&&(te(String(d.seconds??1),!1),F())};let he=!1,ge=!1;const le=i=>{ge||(ge=!0,v("#left-text").textContent=i,v("#left-mask").hidden=!1)},be=async()=>{if(!c)return;const i=await k.roomState(e,n);if(!i.ok){le("房间已结束");return}const d=i.data.room,y=i.data.role==="host";if(i.data.role==="none"){le("你已不在这个房间里");return}const _=y?d.guest?.account:d.host.account;if(_&&(K=_),v("#r-peer").textContent=d.guest?`对方已进入：${_??""}`:"等待对方进入…",d.guest&&(he=!0),y&&he&&!d.guest){le("对方已离开房间");return}d.startedAt&&!a&&(a=d.startedAt,s=window.setInterval(Pe,1e3)),y&&d.guest&&await De();const Y=await k.signalPoll(e,g);if(Y.ok)for(const j of Y.data.messages)g=Math.max(g,j.seq),j.from!==n&&await Be(j.kind,j.data)},Pe=()=>{if(!a)return;const i=Math.floor((Date.now()-a)/1e3);v("#r-clock").textContent=it(i),v("#r-bar").style.width=`${Math.min(100,i/600*100)}%`},de=async()=>{ce(),m?.getTracks().forEach(i=>i.stop()),m=null,T=!1,p&&await p.replaceTrack(null).catch(()=>{}),u.textContent="麦克风",h()};u.onclick=async()=>{if(T){await de();return}try{if(!navigator.mediaDevices?.getUserMedia){b.textContent="这个浏览器不支持麦克风";return}m=await navigator.mediaDevices.getUserMedia({audio:!0});const i=m.getAudioTracks()[0];p&&await p.replaceTrack(i),ie(m),T=!0,u.textContent="关闭麦克风",h()}catch(i){const d=i instanceof DOMException?i.name:"";b.textContent=d==="NotAllowedError"?"你拒绝了麦克风权限：点地址栏左边的锁，把麦克风改成允许":d==="NotFoundError"?"没检测到麦克风设备":"开启麦克风失败，看控制台报错"}},w.onclick=()=>{f=!f,r.muted=!f,w.textContent=f?"听筒已开":"听筒",h()},v("#r-retry").onclick=()=>{re(),k.signalSend({})};const we=()=>{c=!1,de(),G(),s&&window.clearInterval(s),k.roomLeave({}),location.hash="#/app"};v("#r-copy").onclick=()=>{navigator.clipboard?.writeText(e),v("#r-copy").textContent="已复制"},v("#r-end").onclick=we,v("#left-go").onclick=we,be();const Ue=window.setInterval(()=>{be()},800);ve(()=>{c=!1,de(),G(),s&&window.clearInterval(s),window.clearInterval(Ue),window.clearInterval(Z)})}const ft=document.querySelector("#app"),xe="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let oe="";function qe(){oe=Array.from({length:4},()=>xe[Math.floor(Math.random()*xe.length)]).join("")}const x=e=>document.querySelector(e);function q(e,t){t?(e.textContent=t,e.hidden=!1):(e.textContent="",e.hidden=!0)}function vt(){return`
  <div class="page">
    <div class="brand"><span class="logo">L</span>LinguaMate</div>
    <div class="card">
      <h1>登录</h1>
      <p class="sub">和语伴练口语，从一次开口开始</p>
      <form id="login-form" novalidate>
        <label class="field">账号
          <input id="l-account" type="text" placeholder="请输入账号" autocomplete="username" />
        </label>
        <label class="field">密码
          <input id="l-pass" type="password" placeholder="请输入密码" autocomplete="current-password" />
        </label>
        <p class="err" id="l-err" hidden></p>
        <button class="btn" type="submit">登录</button>
        <div class="row">
          <button class="link" type="button" id="l-forgot">忘记密码</button>
          <a class="link" href="#/register">注册</a>
        </div>
        <p class="note" id="l-note" hidden>重置密码功能暂未开放</p>
      </form>
    </div>
  </div>`}function ht(){return`
  <div class="page">
    <div class="brand"><span class="logo">L</span>LinguaMate</div>
    <div class="card">
      <h1>注册</h1>
      <p class="sub">30 秒建个账号，马上开始定级</p>
      <form id="reg-form" novalidate>
        <label class="field">账号
          <input id="r-account" type="text" placeholder="2–20 位字母、数字或下划线" autocomplete="username" />
        </label>
        <label class="field">密码
          <input id="r-pass" type="password" placeholder="至少 6 位" autocomplete="new-password" />
        </label>
        <label class="field">再次输入密码
          <input id="r-pass2" type="password" placeholder="再输一次" autocomplete="new-password" />
        </label>
        <label class="field">手机号
          <input id="r-phone" type="tel" placeholder="11 位手机号" autocomplete="tel" />
        </label>
        <label class="field">邮箱
          <input id="r-email" type="email" placeholder="you@example.com" autocomplete="email" />
        </label>
        <label class="field">验证码
          <div class="code-row">
            <input id="r-code" type="text" placeholder="输入右侧 4 位" maxlength="4" autocomplete="off" />
            <button class="code" type="button" id="r-refresh" title="点一下换一个">${oe}</button>
          </div>
        </label>
        <p class="err" id="r-err" hidden></p>
        <button class="btn" type="submit">注册并登录</button>
        <div class="row"><a class="link" href="#/login">已有账号，去登录</a></div>
      </form>
    </div>
  </div>`}function gt(){const e=x("#login-form"),t=x("#l-err");e.addEventListener("submit",async n=>{n.preventDefault();const a=e.querySelector('button[type="submit"]'),s=x("#l-account").value.trim(),c=x("#l-pass").value;if(!s||!c)return q(t,"请输入账号和密码");a.disabled=!0;const l=await Fe(s,c);if(a.disabled=!1,!l.ok)return q(t,l.msg);location.hash="#/app"}),x("#l-forgot").addEventListener("click",()=>{x("#l-note").hidden=!1})}function bt(){const e=x("#reg-form"),t=x("#r-err");x("#r-refresh").addEventListener("click",()=>{qe(),x("#r-refresh").textContent=oe}),e.addEventListener("submit",async n=>{n.preventDefault();const a=e.querySelector('button[type="submit"]'),s=x("#r-account").value.trim(),c=x("#r-pass").value,l=x("#r-pass2").value,b=x("#r-phone").value.trim(),u=x("#r-email").value.trim(),w=x("#r-code").value.trim();if(!/^[A-Za-z0-9_]{2,20}$/.test(s))return q(t,"账号要 2–20 位字母、数字或下划线");if(c.length<6)return q(t,"密码至少 6 位");if(c!==l)return q(t,"两次输入的密码不一致");if(!/^1[3-9]\d{9}$/.test(b))return q(t,"手机号格式不对");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u))return q(t,"邮箱格式不对");if(w.toUpperCase()!==oe)return q(t,"验证码不对");a.disabled=!0;const r=await Ke({account:s,password:c});if(a.disabled=!1,!r.ok)return q(t,r.msg);location.hash="#/app"})}function V(e,t){Ze(),ft.innerHTML=e,t()}function He(){const e=location.hash.replace(/^#\/?/,""),[t="login",n=""]=e.split("/");if(t==="register"){qe(),V(ht(),bt);return}if((t==="app"||t==="me"||t==="wait"||t==="join"||t==="room")&&!J()){location.hash="#/login";return}if(t==="app"){V(Ge(),We);return}if(t==="me"){V(at(),ot);return}if(t==="wait"&&n){V(rt(n),()=>lt(n));return}if(t==="join"){V(dt(),ut);return}if(t==="room"&&n){V(pt(n),()=>mt(n));return}V(vt(),gt)}window.addEventListener("hashchange",He);He();
