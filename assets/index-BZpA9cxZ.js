(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function s(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(o){if(o.ep)return;o.ep=!0;const r=s(o);fetch(o.href,r)}})();const Le=[{account:"demo",password:"123456",level:"B1",tags:["电影迷","慢热型"],assessed:1},{account:"test",password:"123456",level:"B2",tags:["科技控","破冰者"],assessed:1}],Ne=[{name:"Mia",level:"B1",color:"#7c6cf6",tags:["电影迷","倾听者"]},{name:"Leo",level:"B1",color:"#12b3a6",tags:["科技控","破冰者"]},{name:"Sara",level:"B2",color:"#ff6b4a",tags:["社会派","深聊派"]},{name:"Ken",level:"A2",color:"#f0a91b",tags:["旅行党","慢热型"]},{name:"Ivy",level:"B1",color:"#0ea5e9",tags:["电影迷","深聊派"]},{name:"Noah",level:"B2",color:"#8b5cf6",tags:["科技控","短平快"]},{name:"Zoe",level:"A2",color:"#ef4444",tags:["旅行党","破冰者"]},{name:"Tom",level:"B2",color:"#14b8a6",tags:["社会派","倾听者"]},{name:"Lily",level:"B1",color:"#d946ef",tags:["读书人","慢热型"]},{name:"Owen",level:"A2",color:"#64748b",tags:["游戏党","倾听者"]},{name:"Emma",level:"B1",color:"#f59e0b",tags:["美食家","破冰者"]},{name:"Ryan",level:"B2",color:"#3b82f6",tags:["音乐虫","深聊派"]}],ft=864e5;function ot(e){const t=[];for(let s=0;s<20;s++){const a=Ne[s%Ne.length],o=4+s*3%11;t.push({partner:a.name,minutes:o,at:Date.now()-s*ft-36e5,mode:s%3===0?"stretch":"chill",tags:a.tags})}return e==="demo"?t:t.slice(0,4)}const Ve=new Map([["demo",ot("demo")],["test",ot("test")]]),qt=new Set(["破冰者","慢热型","倾听者","深聊派"]);function Ht(e){const t=Le.find(d=>d.account===e);if(!t)return{ok:!1,error:"账号不存在"};const s=Ve.get(e)??[],a=new Map;for(const d of s)for(const I of d.tags)qt.has(I)||a.set(I,(a.get(I)??0)+d.minutes);const o=[...a.entries()].map(([d,I])=>({tag:d,minutes:I})).sort((d,I)=>I.minutes-d.minutes),r=s.reduce((d,I)=>d+I.minutes,0),l=s.reduce((d,I)=>Math.max(d,I.minutes),0),b=new Set(s.map(d=>d.partner)).size,g=[...new Set(s.map(d=>new Date(d.at).toISOString().slice(0,10)))].sort().reverse();let k=g.length?1:0;for(let d=1;d<g.length;d++){const I=new Date(`${g[d-1]}T00:00:00Z`).getTime(),O=new Date(`${g[d]}T00:00:00Z`).getTime();if(I-O===ft)k++;else break}return{ok:!0,data:{user:{account:t.account,level:t.level,tags:t.tags},stats:{totalMinutes:r,sessions:s.length},recent:s.slice(0,20),topics:o,badges:[{id:"first",title:"第一次开口",unlocked:s.length>=1},{id:"streak5",title:"连续 5 天",unlocked:k>=5},{id:"ten",title:"10 分钟不冷场",unlocked:l>=10},{id:"stretch",title:"完成进阶挑战",unlocked:s.some(d=>d.mode==="stretch")},{id:"min300",title:"累计 300 分钟",unlocked:r>=300},{id:"friends3",title:"交到 3 个语伴",unlocked:b>=3},{id:"b2",title:"等级升到 B2",unlocked:t.level==="B2"},{id:"review20",title:"回看 20 次",unlocked:!1}]}}}const at={A2:1,B1:2,B2:3},Rt=4;function jt(e,t,s){return Ne.map(a=>({name:a.name,level:a.level,color:a.color,tags:a.tags,shared:a.tags.filter(o=>t.includes(o)),diff:a.tags.filter(o=>!t.includes(o)),online:!1})).filter(a=>e==="chill"?a.shared.length>0:a.diff.length===a.tags.length||(at[a.level]??0)>(at[s]??0))}async function Dt(e,t){const[s,a=""]=e.split("?"),o=new URLSearchParams(a),r=t??{};if(s==="/login"){const l=String(r.account??""),b=String(r.password??""),g=Le.find(k=>k.account===l);return!g||g.password!==b?{ok:!1,error:"账号或密码错误（演示账号 demo / 123456）"}:{ok:!0,data:{ok:!0,user:{account:g.account,level:g.level,tags:g.tags,assessed:g.assessed}}}}if(s==="/level"){const l=String(r.account??""),b=Le.find(h=>h.account===l);if(!b)return{ok:!1,error:"账号不存在"};const g=(h,L,de)=>Math.max(L,Math.min(de,h)),k=h=>typeof h=="number"&&Number.isFinite(h)?h:0,d=typeof r.readingAccuracy=="number"?Math.round(g(r.readingAccuracy,0,100)):null,O=(Array.isArray(r.answers)?r.answers:[]).slice(0,4).map(h=>{const L=h??{};return{seconds:k(L.seconds),words:k(L.words),pauses:k(L.pauses)}}),$=O.reduce((h,L)=>h+L.seconds,0),S=O.reduce((h,L)=>h+L.words,0),j=O.reduce((h,L)=>h+L.pauses,0),D=$/60,G=D>0?j/D:12,K=D>0?S/D:0,P=Math.round(g(100-G*8,20,95)),ee=Math.round(g(K/1.5,20,95)),W=O.filter(h=>h.seconds>=8).length,f=O.length===0?30:Math.round(30+W/O.length*70),M=Math.round(d===null?P*.4+ee*.3+f*.3:d*.35+P*.25+ee*.2+f*.2),E=M>=80?"B2":M>=55?"B1":"A2",H=[...Array.isArray(r.interests)?r.interests.filter(h=>typeof h=="string"&&h.length>0):[],r.social,r.rhythm].filter(h=>typeof h=="string"&&h.length>0);return b.level=E,b.tags=H,b.assessed=1,{ok:!0,data:{ok:!0,level:E,tags:H,scores:{accuracy:d,fluency:P,rate:ee,completion:f,overall:M}}}}if(s==="/register"){const l=String(r.account??"");if(Le.some(g=>g.account===l))return{ok:!1,error:"该账号已被注册（演示模式只存在浏览器里）"};const b={account:l,password:String(r.password??""),level:"B1",tags:[],assessed:0};return Le.push(b),Ve.set(l,[]),{ok:!0,data:{ok:!0,user:{account:l,level:b.level,tags:b.tags,assessed:0}}}}if(s==="/partners"){const l=o.get("mode")??"chill",b=(o.get("tags")??"").split(",").filter(Boolean),g=o.get("level")??"B1",k=Number(o.get("offset")??0)||0,d=jt(l,b,g),I=d.length?k%d.length:0;return{ok:!0,data:{ok:!0,partners:[...d.slice(I),...d.slice(0,I)].slice(0,Rt),total:d.length,realCount:0}}}if(s==="/profile")return Ht(o.get("account")??"");if(s==="/practices"&&t===void 0){const l=o.get("account")??"";return{ok:!0,data:{ok:!0,practices:Ve.get(l)??[]}}}return{ok:!1,error:"静态演示模式：这个功能需要本地服务器（房间、语音、匹配队列）"}}async function _(e,t){return Dt(e,t)}const A={register:e=>_("/register",e),login:e=>_("/login",e),level:e=>_("/level",e),partners:(e,t,s,a,o=0,r="")=>_(`/partners?mode=${encodeURIComponent(t)}&tags=${encodeURIComponent(s.join(","))}&level=${encodeURIComponent(a)}&offset=${o}&account=${encodeURIComponent(e)}&topic=${encodeURIComponent(r)}`),practices:e=>_(`/practices?account=${encodeURIComponent(e)}`),addPractice:e=>_("/practices",e),profile:e=>_(`/profile?account=${encodeURIComponent(e)}`),roomInvite:e=>_("/room/invite",e),roomJoin:e=>_("/room/join",e),roomState:(e,t)=>_(`/room/state?roomId=${encodeURIComponent(e)}&clientId=${encodeURIComponent(t)}`),roomLeave:e=>_("/room/leave",e),queueJoin:e=>_("/queue",e),queueLeave:e=>_("/queue/leave",e),presence:e=>_("/presence",e),inviteSend:e=>_("/invite",e),invites:e=>_(`/invites?account=${encodeURIComponent(e)}`),inviteRespond:e=>_("/invite/respond",e),roomCreate:e=>_("/room/create",e),saveTranscript:e=>_("/transcript",e),signalSend:e=>_("/signal",e),signalPoll:(e,t)=>_(`/signal?roomId=${encodeURIComponent(e)}&since=${t}`)},Fe="linguamate.session";function he(){const e=localStorage.getItem(Fe);if(!e)return null;try{return JSON.parse(e)}catch{return null}}function Ye(e){localStorage.setItem(Fe,JSON.stringify(e))}function Ut(e){const t=he();if(!t)return null;const s={...t,...e};return Ye(s),s}function vt(){localStorage.removeItem(Fe)}async function Wt(e){const t=await A.register(e);return t.ok?(Ye(t.data.user),{ok:!0}):{ok:!1,msg:t.error}}async function Bt(e,t){const s=await A.login({account:e,password:t});return s.ok?(Ye(s.data.user),{ok:!0}):{ok:!1,msg:s.error}}const it="lm.client";function ve(){let e=sessionStorage.getItem(it);return e||(e=crypto.randomUUID(),sessionStorage.setItem(it,e)),e}let ze=[];function Ge(e){ze.push(e)}function _t(){for(const e of ze)try{e()}catch{}ze=[]}const Ot={最近一次旅行:{title:"最近一次旅行",words:["trip","scenery","crowded","get away","book a ticket","local food"],phrases:["I went to … for a few days.","The thing I remember most is …","I'd go back tomorrow if I could."],questions:["Where did you go and who did you go with?","Was there anything you would do differently?"],sample:"Last spring I went to a small town near the mountains with two friends. We stayed for three days and mostly walked around. The thing I remember most is the morning market — it was noisy but the food was amazing. I would go back, but next time I would go on a weekday.",tips:["trip 的 /tr/ 不要读成「吹」","scenery 重音在第一个音节"],background:"小城/小镇话题在英国口语里很常见，说具体细节比说形容词更容易听懂。",followUps:["Would you go again?","Do you prefer cities or small towns?"]},你最近在追的剧:{title:"你最近在追的剧",words:["episode","plot","character","hooked","recommend","binge-watch"],phrases:["I'm three episodes in and already hooked.","The plot is simple, but the acting carries it.","No spoilers, I promise."],questions:["What are you watching right now?","Would you recommend it to a beginner?"],sample:"I'm watching a crime series at the moment. I'm only three episodes in, but I'm already hooked. The plot is not very original, but the main character is really well written. I'd recommend it if you like slow stories.",tips:["character 的 ch 读 /k/","hooked 结尾的 /t/ 要轻"],background:"聊剧最容易冷场在「剧名」——准备一句剧情概括比记住剧名更有用。",followUps:["Who is your favourite character?","Do you watch with subtitles?"]},一个让你开心的周末:{title:"一个让你开心的周末",words:["weekend","sleep in","hang out","unexpected","make my day","chill"],phrases:["I slept in and then …","Out of nowhere, …","It still makes me smile."],questions:["What did you do last weekend?","What makes a weekend good for you?"],sample:"Last weekend I did almost nothing, and that was the point. I slept in, made a late breakfast, and then walked to a park nearby. Out of nowhere, I met a friend I had not seen for months. We just sat and talked for two hours.",tips:["slept 的 /pt/ 连读要轻","weekend 重音在第一音节"],background:"「什么都不做」也是好答案，比硬编行程更自然。",followUps:["Do you prefer busy or quiet weekends?","What did you do on Sunday?"]},你最拿手的一道菜:{title:"你最拿手的一道菜",words:["recipe","ingredient","stir-fry","season","boil","taste"],phrases:["It only takes about ten minutes.","The key is to …","I learned it from …"],questions:["What can you cook well?","How did you learn to make it?"],sample:"The one thing I can cook well is tomato and egg noodles. It only takes about ten minutes. The key is to stir-fry the egg first, then take it out before you cook the tomato. I learned it from my mother, and I still make it the same way.",tips:["ingredient 重音在第二个音节","recipe 读 /ˈresəpi/，不是「瑞赛普」"],background:"讲菜谱时用 first / then / after that，比背单词更像「会说」。",followUps:["Is it easy for a beginner?","What food do you miss from home?"]},通勤路上你做什么:{title:"通勤路上你做什么",words:["commute","subway","traffic","podcast","on the way","rush hour"],phrases:["It takes me about … minutes.","I usually listen to …","The worst part is …"],questions:["How do you get to work or school?","What do you do on the way?"],sample:"I take the subway, and it takes about forty minutes. On the way I usually listen to a podcast or review vocabulary. The worst part is rush hour — sometimes I have to wait for two or three trains.",tips:["commute 重音在第二个音节","usually 读 /ˈjuːʒuəli/，别读成「优苏里」"],background:"通勤是雅思 part 1 高频题，说清楚「多久 + 干什么 + 最烦哪一段」就够。",followUps:["Would you rather drive?","What do you do when the train is late?"]},"手机里最常用的三个 App":{title:"手机里最常用的三个 App",words:["app","notification","screen time","useful","annoying","delete"],phrases:["I use it mostly for …","I should probably spend less time on …","It's useful but distracting."],questions:["Which apps do you use the most?","Is there one you would like to use less?"],sample:"The three apps I use most are a chat app, a map app and a video app. I use the map app mostly for commuting, and the video app when I am too tired to read. Honestly, I should spend less time on the video app. It is useful but distracting.",tips:["apps 的复数 /s/ 要出来","distracting 重音在第二个音节"],background:"这类题好答，因为例子是你自己的日常，词汇不够也能说清楚。",followUps:["Which one could you live without?","Do you turn off notifications?"]},你最近在学什么:{title:"你最近在学什么",words:["practise","struggle with","get the hang of","progress","step by step","routine"],phrases:["I've been learning it for about two months.","The hardest part is …","I try to practise a little every day."],questions:["What are you learning these days?","What is the hardest part of it?"],sample:"I've been learning English speaking for about two months. The hardest part is not grammar — it is speaking without planning first. I try to practise ten minutes every day, and I record myself once a week to hear the difference.",tips:["practise 重音在第一个音节","months 结尾的 /θs/ 别省略"],background:"「在学什么」几乎必被追问「难在哪」，先想好一句「难在哪」。",followUps:["How do you practise?","What would you like to learn next?"]},工作或学习里最烦的事:{title:"工作或学习里最烦的事",words:["deadline","handle","figure out","delay","pressure","give up"],phrases:["The most annoying thing is …","I haven't figured out how to …","I try not to give up."],questions:["What is the most annoying part of your week?","How do you usually deal with it?"],sample:"The most annoying thing for me is waiting for other people to finish their part. I cannot start until they do, so everything gets pushed back. I have not figured out a good way to handle it yet. Usually I just make a list and do what I can.",tips:["figured 的 /g/ 不要吞掉","pressure 读 /ˈpreʃə/"],background:"抱怨类话题最容易说成抱怨，加一句「我怎么处理」会显得成熟。",followUps:["Does it affect your sleep?","What would you change about it?"]},一张你舍不得删的照片:{title:"一张你舍不得删的照片",words:["photo","memory","blurry","take a picture","look back","moment"],phrases:["It's not even a good photo — it's blurry.","Whenever I look at it, I remember …","I keep it because …"],questions:["What is one photo you would never delete?","Why does it matter to you?"],sample:"It's a photo of my grandparents' kitchen, and it is honestly blurry. I took it by accident one summer. Whenever I look at it, I remember the noise and the smell of that kitchen. I keep it because nobody cooks there anymore.",tips:["photo 的 /f/ 用上牙轻碰下唇","blurry 重音在第一音节"],background:"讲照片=讲一个小故事，用「时间 + 谁 + 为什么留着」三段就够。",followUps:["Do you print photos?","Do you take many photos?"]},如果明天放假一天:{title:"如果明天放假一天",words:["day off","plan","spontaneous","somewhere","relax","waste"],phrases:["If I had a day off tomorrow, I would …","I'd probably end up …","I would not plan anything."],questions:["What would you do with a free day?","Would you plan it or just go?"],sample:"If I had a day off tomorrow, I would not plan anything. I would probably sleep in, then take a train somewhere near the city and walk around. I would end up in a small restaurant and waste the whole afternoon there.",tips:["would 的 /d/ 轻轻带出即可","I'd 读成一个音节"],background:"虚拟语气（would）用错也不影响交流，敢用就比不用强。",followUps:["Would you go alone or with someone?","What would you avoid doing?"]}},Pt=["最近一次旅行","你最近在追的剧","你最拿手的一道菜","通勤路上你做什么","如果明天放假一天"],Nt={电影迷:["你最近在追的剧","一张你舍不得删的照片"],科技控:["手机里最常用的三个 App","你最近在学什么"],旅行党:["最近一次旅行","如果明天放假一天"],社会派:["工作或学习里最烦的事","通勤路上你做什么"],摄影:["一张你舍不得删的照片","最近一次旅行"],健身:["你最拿手的一道菜","通勤路上你做什么"],宠物:["一张你舍不得删的照片","一个让你开心的周末"],动漫:["你最近在追的剧","一张你舍不得删的照片"],咖啡:["你最拿手的一道菜","通勤路上你做什么"],露营:["最近一次旅行","如果明天放假一天"],音乐虫:["你最近在追的剧","一张你舍不得删的照片"],美食家:["你最拿手的一道菜","最近一次旅行"],游戏党:["你最近在追的剧","手机里最常用的三个 App"],读书人:["你最近在学什么","一张你舍不得删的照片"]},Vt=["工作或学习里最烦的事","你最近在学什么"];function zt(e){const t=[];for(const s of e)for(const a of Nt[s]??[])t.includes(a)||t.push(a);for(const s of Vt)t.includes(s)||t.push(s);return t.slice(0,4)}function gt(e){return Ot[e]??null}const Ft=[],Ae=[{title:"最近一件让你开心的小事",en:"A small thing that made your day",tips:[{en:"Honestly, the smallest thing made my day yesterday.",cn:"说真的，昨天一件极小的事让我开心了一整天。"},{en:"It's nothing special, but it still makes me smile.",cn:"没什么特别的，但想起来还是会笑。"},{en:"I guess small things hit harder than big ones.",cn:"我觉得小事反而比大事更打动人。"},{en:"I almost missed it, but then I noticed and felt great.",cn:"我差点错过，但注意到之后心情特别好。"}]},{title:"你最近在追的剧或游戏",en:"What you are binge-watching lately",tips:[{en:"I'm three episodes in and already hooked.",cn:"我才看了三集就已经上头了。"},{en:"The plot is simple, but the acting carries it.",cn:"剧情一般，但演技撑住了。"},{en:"I'd recommend it if you like slow stories.",cn:"如果你喜欢慢节奏的故事，我推荐。"},{en:"No spoilers, I promise.",cn:"放心，我不剧透。"}]},{title:"如果能立刻去一个地方",en:"One place you would go tomorrow",tips:[{en:"If I could teleport, I would be on a beach right now.",cn:"要是能瞬移，我现在就在海滩上了。"},{en:"I have been saving a trip for months.",cn:"我为一个旅行攒了好几个月的钱。"},{en:"I prefer small towns to big cities.",cn:"比起大城市，我更喜欢小镇。"},{en:"The food is honestly half the reason.",cn:"说真的，吃占了一半的理由。"}]}],U=e=>document.querySelector(e),Yt={chill:"轻松闲聊",stretch:"挑战进阶"};function bt(e){return`
    <div class="topic-head">
      <span class="badge">今日推荐话题</span>
      <h2>${e.title}</h2>
      <p class="sub">${e.en}</p>
    </div>
    <ul class="tips">
      ${e.tips.map(t=>`<li><b>${t.en}</b><span>${t.cn}</span></li>`).join("")}
    </ul>`}function Gt(){const e=he();return`
  <div class="lobby">
    <div class="lobby-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="lobby-who">
        <span>${e?.account??"未登录"}</span>
        <span class="dot-sep">·</span>
        <span>${e?.level??"B1"}</span>
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
          <div id="topic-box">${bt(Ae[0])}</div>
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

    <div class="mask" id="prep-mask" hidden>
      <div class="modal prep-modal">
        <h3 id="prep-title">这次想聊什么？</h3>
        <div id="prep-body"></div>
        <div class="prep-actions" id="prep-actions"></div>
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
  </div>`}function Kt(){const e=he(),t=e?.tags??Ft,s=e?.level??"B1";let a="";const o=c=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(c);u.lang="en-US",u.rate=.9,window.setTimeout(()=>{try{speechSynthesis.speak(u)}catch{}},20)}catch{}},r=U("#stage"),l=U("#stage-head"),b=U("#modes"),g=U("#search-area"),k=U("#results"),d=U("#topic-box"),I=U("#invite-mask"),O=U("#invite-list");let $=null,S=0,j,D,G=0,K=0,P=0,ee=0;const W=()=>{j!==void 0&&(window.clearInterval(j),j=void 0)},f=()=>{d.innerHTML=bt(Ae[G])},M=()=>{if(!$){g.innerHTML="";return}g.innerHTML=`
      <div class="bar">
        <span class="search-dot"></span>
        <b>正在找「${Yt[$]}」的语伴…</b>
        <span class="muted">已等待 <span id="wait">${S}</span> 秒</span>
        <button class="btn ghost sm" type="button" id="cancel">取消匹配</button>
      </div>
      <p class="ai-hint" id="ai-hint" ${S<15?"hidden":""}>
        还没找到合适的？<button class="link" type="button" id="ai">换 AI 练习 →</button>
      </p>`,U("#cancel").onclick=L,U("#ai").onclick=()=>{W(),g.innerHTML='<div class="bar"><span class="search-dot"></span><b>AI 练习还没做</b><span class="muted">等语音室那阶段接进来</span><button class="btn ghost sm" type="button" id="cancel">返回</button></div>',U("#cancel").onclick=L,k.innerHTML=""}},E=c=>{if(c.length===0){k.innerHTML='<div class="empty-box">这个模式里现在没有人，等一会儿再试</div>';return}const u=c.length-ee,m=P>u;k.innerHTML=`
      ${m?'<div class="results-bar"><button class="btn ghost sm" type="button" id="reshuffle">换一批</button></div>':""}
      <div class="grid-mates">
        ${c.map(x=>{const $e=x.online?x.sameTopic?'<span class="shared same">同话题</span>':'<span class="shared">在线</span>':$==="chill"?`<span class="shared">共同标签 ${x.shared.length}</span>`:x.diff.length>=2?`<span class="shared diff">话题差异 ${x.diff.length}</span>`:x.diff.length===1?`<span class="shared diff">新话题 ${x.diff[0]}</span>`:'<span class="shared diff">等级更高</span>',Ie=x.online?`<button class="btn sm" type="button" data-invite-user="${x.name}">邀请</button>`:'<span class="muted">示例语伴</span>';return`
          <article class="mate">
            <div class="mate-head">
              <span class="ava" style="background:${x.color}">${x.name[0]}</span>
              <div><b>${x.name}</b><span class="muted">${x.level}</span></div>
              ${$e}
            </div>
            <div class="tags">
              ${x.tags.map(fe=>`<span class="tag ${x.shared.includes(fe)?"hit":""}">${fe}</span>`).join("")}
            </div>
            <div class="mate-actions">${Ie}</div>
          </article>`}).join("")}
      </div>`,k.querySelectorAll("[data-invite-user]").forEach(x=>{x.onclick=async()=>{if(!e)return;x.disabled=!0,x.textContent="邀请中…";const $e=await A.inviteSend({fromAccount:e.account,fromClientId:ve(),toAccount:x.dataset.inviteUser??""});if(!$e.ok){x.disabled=!1,x.textContent="邀请",k.insertAdjacentHTML("beforeend",`<div class="empty-box">${$e.error}</div>`);return}location.hash="#/wait/"+$e.data.roomId}});const p=document.querySelector("#reshuffle");p&&(p.onclick=()=>{q(K+4)})},q=async c=>{const u=$;if(!u||!e)return;const m=await A.partners(e.account,u,t,s,c,a);if(!(!$||$!==u)){if(!m.ok){k.innerHTML=`<div class="empty-box">${m.error}</div>`;return}P=m.data.total,ee=m.data.realCount,K=P?c%P:0,E(m.data.partners)}},H=async c=>{e&&await A.presence({account:e.account,clientId:ve()})},h=async(c,u)=>{$=c,a=u,S=0,W(),r.classList.add("is-searching"),l.hidden=!0,b.hidden=!0,M(),k.innerHTML="";const m=document.querySelector("#wait");m&&(m.textContent="0"),j=window.setInterval(()=>{S++;const p=document.querySelector("#wait");p&&(p.textContent=String(S)),S===15&&M()},1e3),K=0,P=0,ee=0,await H(),await q(0),window.clearInterval(D),D=window.setInterval(()=>{$&&q(K)},3e3)};function L(){W(),window.clearInterval(D),$&&A.queueLeave({clientId:ve()}),$=null,S=0,K=0,P=0,ee=0,g.innerHTML="",k.innerHTML="",r.classList.remove("is-searching"),l.hidden=!1,b.hidden=!1,H()}const de=c=>{if(e){if(c.length===0){I.hidden=!0,O.innerHTML="";return}I.hidden=!1,O.innerHTML=c.map(u=>`
        <div class="invite-row" data-invite="${u.id}">
          <b class="invite-name">${u.from}</b>
          <div class="tags">
            ${u.tags.map(m=>`<span class="tag ${t.includes(m)?"hit":""}">${m}</span>`).join("")}
          </div>
          <div class="invite-row-actions">
            <button class="btn sm" type="button" data-accept="${u.id}">接受</button>
            <button class="btn ghost sm" type="button" data-decline="${u.id}">拒绝</button>
          </div>
        </div>`).join(""),O.querySelectorAll("[data-accept]").forEach(u=>{u.onclick=async()=>{const m=await A.inviteRespond({inviteId:u.dataset.accept??"",account:e.account,clientId:ve()});m.ok&&m.data.roomId&&(I.hidden=!0,location.hash="#/room/"+m.data.roomId)}}),O.querySelectorAll("[data-decline]").forEach(u=>{u.onclick=async()=>{await A.inviteRespond({inviteId:u.dataset.decline??"",account:e.account,clientId:ve()}),await ne()}})}},ne=async()=>{if(!e)return;const c=await A.invites(e.account);c.ok&&de(c.data.invites)},oe=U("#prep-mask"),ae=U("#prep-title"),J=U("#prep-body"),ie=U("#prep-actions");let re,me="match",w="chill",N="";const B=()=>{window.clearInterval(re),oe.hidden=!0,J.innerHTML="",ie.innerHTML=""},te=async(c,u)=>{if(!e)return;const m=await A.roomCreate({account:e.account,clientId:ve()});if(!m.ok){k.innerHTML=`<div class="empty-box">${m.error}</div>`;return}location.hash="#/room/"+m.data.roomId},V=()=>{const c=N,u=w,m=me;B(),m==="create"?te():h(u,c)},Y=()=>{const c=gt(N);if(!c){J.innerHTML='<p class="muted">这个话题还没有预习内容</p>';return}J.innerHTML=`
      <div class="prep-scroll">
        <div class="prep-line"><h5>背景</h5><p>${c.background}</p></div>
        <div class="prep-line"><h5>6 个词</h5><div class="words">${c.words.map(p=>`<button class="word" type="button" data-say="${p}">${p}</button>`).join("")}</div></div>
        <div class="prep-line"><h5>3 个句型</h5>${c.phrases.map(p=>`<div class="phrase" data-say="${p}"><span class="en">${p}</span><button class="say" type="button">🔊</button></div>`).join("")}</div>
        <div class="prep-line"><h5>示范回答</h5><div class="phrase" data-say="${c.sample}"><span class="en">${c.sample}</span><button class="say" type="button">🔊</button></div></div>
        <div class="prep-line"><h5>发音提醒</h5><ul class="prep-list">${c.tips.map(p=>`<li>${p}</li>`).join("")}</ul></div>
        <div class="prep-line"><h5>可以问对方</h5>${c.questions.map(p=>`<div class="phrase" data-say="${p}"><span class="en">${p}</span><button class="say" type="button">🔊</button></div>`).join("")}</div>
        <div class="prep-line"><h5>可能被追问</h5><ul class="prep-list">${c.followUps.map(p=>`<li>${p}</li>`).join("")}</ul></div>
      </div>`,J.querySelectorAll("[data-say]").forEach(p=>{p.onclick=x=>{x.stopPropagation(),o(p.dataset.say??"")}});let u=20;const m=()=>{ie.innerHTML=`
        <button class="btn ghost sm" id="prep-skip" type="button">跳过预习</button>
        <button class="btn sm" id="prep-go" type="button" ${u>0?"disabled":""}>${u>0?`开始（${u}s）`:"开始"}</button>`,U("#prep-skip").onclick=V,U("#prep-go").onclick=V};m(),window.clearInterval(re),re=window.setInterval(()=>{u-=1,u<=0&&(u=0,window.clearInterval(re)),m()},1e3)},z=(c,u)=>{me=u,w=c;const m=c==="chill"?Pt:zt(t);ae.textContent=c==="chill"?"轻松闲聊：先选一个话题":"挑战进阶：按你的标签推荐",ie.innerHTML="",J.innerHTML=`
      <p class="prep-note">选好话题后先看预习素材，20 秒后可开始（也可跳过）。</p>
      <div class="topic-grid">
        ${m.map(p=>`<button class="topic-card" type="button" data-topic="${p}">${p}</button>`).join("")}
      </div>`,J.querySelectorAll("[data-topic]").forEach(p=>{p.onclick=()=>{N=p.dataset.topic??m[0],ae.textContent=N,Y()}}),oe.hidden=!1},se=U("#room-menu");let Z;const T=()=>{window.clearTimeout(Z),se.classList.add("open")},R=()=>{window.clearTimeout(Z),Z=window.setTimeout(()=>se.classList.remove("open"),800)},X=()=>{window.clearTimeout(Z),se.classList.remove("open")};se.addEventListener("mouseenter",T),se.addEventListener("mouseleave",R),document.addEventListener("click",X),U("#room-menu-btn").onclick=c=>{c.stopPropagation(),se.classList.toggle("open")};const ce=U("#new-room-mask");document.querySelectorAll("[data-room]").forEach(c=>{c.onclick=()=>{if(c.dataset.room==="join"){location.hash="#/join";return}ce.hidden=!1}}),ce.querySelectorAll("[data-new-mode]").forEach(c=>{c.onclick=()=>{ce.hidden=!0,z(c.dataset.newMode??"chill","create")}}),U("#new-room-cancel").onclick=()=>{ce.hidden=!0},U("#lobby-logout").onclick=()=>{vt(),location.hash="#/login"},U("#topic-next").onclick=()=>{if(Ae.length<2)return;let c=G;for(;c===G;)c=Math.floor(Math.random()*Ae.length);G=c,f()},b.querySelectorAll(".mode").forEach(c=>{c.onclick=()=>z(c.dataset.mode??"chill","match")});const we=window.setInterval(()=>{H()},3e3),ke=window.setInterval(()=>{ne()},2e3);H(),ne(),Ge(()=>{window.clearInterval(we),window.clearInterval(ke),window.clearInterval(D),window.clearTimeout(Z),document.removeEventListener("click",X),se.removeEventListener("mouseenter",T),se.removeEventListener("mouseleave",R),W(),H()})}const rt=e=>document.querySelector(e),ct=["#7c6cf6","#12b3a6","#ff6b4a","#f0a91b","#0ea5e9","#8b5cf6","#ef4444","#14b8a6"];function Jt(e){let t=0;for(const s of e)t+=s.charCodeAt(0);return ct[t%ct.length]}function yt(e){const t=new Date(e);return`${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}function Zt(e){if(e.length===0)return'<div class="empty-box">还没有练习记录，去大厅找一个语伴吧</div>';const t=[];let s=-1;for(const a of e.slice(0,20)){const o=new Date(a.at).getFullYear();o!==s&&(t.push(`<li class="year-row">${o} 年</li>`),s=o);const r=a.mode==="chill"?'<span class="mode-badge chill">闲聊</span>':a.mode==="stretch"?'<span class="mode-badge stretch">进阶</span>':"";t.push(`<li class="p-row">
      <span class="r-date">${yt(a.at)}</span>
      <span class="r-who">${a.partner}</span>
      ${r}
      <span class="r-min ${a.minutes<3?"short":""}">${a.minutes} 分钟</span>
      <span class="r-tags">${a.tags.map(l=>`<i>${l}</i>`).join("")}</span>
    </li>`)}return`<ul class="recent-list">${t.join("")}</ul>`}const Xt={电影迷:"影视",科技控:"科技",旅行党:"旅行",社会派:"社会",音乐虫:"音乐",美食家:"美食",游戏党:"游戏",读书人:"读书"};function Qt(e){const t=e.length,s=300,a=150,o=100,r=Math.max(...e.map($=>$.minutes),1),l=($,S)=>{const j=-Math.PI/2+$*2*Math.PI/t;return[a+Math.cos(j)*S,a+Math.sin(j)*S]},b=[.25,.5,.75,1].map($=>`<polygon points="${e.map((S,j)=>l(j,o*$).join(",")).join(" ")}" fill="none" stroke="#e6e7eb" />`).join(""),g=e.map(($,S)=>{const[j,D]=l(S,o);return`<line x1="${a}" y1="${a}" x2="${j}" y2="${D}" stroke="#e6e7eb" />`}).join(""),k=e.map($=>$.minutes>0?Math.max(o*.1,$.minutes/r*o):0),d=e.map(($,S)=>l(S,k[S]).join(",")).join(" "),I=e.map(($,S)=>{const[j,D]=l(S,k[S]);return`<circle cx="${j}" cy="${D}" r="3" fill="#12b3a6" />`}).join(""),O=e.map(($,S)=>{const[j,D]=l(S,o+26);return`<text x="${j}" y="${D}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#6b7280">${Xt[$.tag]??$.tag}</text>`}).join("");return`<svg class="radar" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    ${b}${g}
    <polygon points="${d}" fill="rgba(18,179,166,0.16)" stroke="#12b3a6" stroke-width="2" stroke-linejoin="round" />
    ${I}${O}
  </svg>`}function es(e){if(e.length===0)return'<div class="empty-box">还没有练习记录，聊过一次就会有图</div>';if(e.length<3)return`<ul class="topic-bars">${e.map(s=>`<li><span>${s.tag}</span><b>${s.minutes} 分钟</b></li>`).join("")}</ul>`;const t=e.slice(0,3).map(s=>`${s.tag} ${s.minutes}′`).join(" · ");return`<div class="radar-wrap">${Qt(e)}</div><p class="topic-top">聊得最多：${t}</p>`}function ts(e){const t=e.user,s=e.recent??[],a=e.topics??[],o=e.badges??[],r=s.length?yt(s[0].at):"—";return`
    <section class="card pcard">
      <div class="pcard-head">
        <span class="ava big" style="background:${Jt(t.account)}">${t.account[0]}</span>
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
        <div class="stat"><b>${r}</b><span>最近一次</span></div>
      </div>
    </section>

    <section class="card recent">
      <h2>最近练习</h2>
      ${Zt(s)}
    </section>

    <section class="card growth">
      <h2>成长图谱</h2>
      <p class="sub">按聊过的话题统计（分钟）</p>
      ${es(a)}
    </section>

    <section class="card badges-card">
      <h2>成就墙</h2>
      <div class="badge-grid">
        ${o.map(l=>`<div class="badge ${l.unlocked?"":"lock"}"><b>${l.title}</b><span>${l.unlocked?"已解锁":"未解锁"}</span></div>`).join("")}
      </div>
    </section>`}function ss(){return`
  <div class="profile">
    <div class="profile-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="top-actions">
        <a class="pill-link" href="#/app">返回大厅</a>
        <button class="link-quit" type="button" id="profile-logout">退出</button>
      </div>
    </div>

    <div id="profile-body">
      ${he()?'<div class="card"><div class="empty-box">正在加载…</div></div>':'<div class="card"><div class="empty-box">未登录</div></div>'}
    </div>
  </div>`}function ns(){const e=rt("#profile-body"),t=he();if(rt("#profile-logout").onclick=()=>{vt(),location.hash="#/login"},!t)return;(async()=>{const a=await A.profile(t.account);if(!a.ok){e.innerHTML=`<div class="card"><div class="empty-box">${a.error}</div></div>`;return}try{e.innerHTML=ts(a.data)}catch(o){console.error("[profile] 渲染失败",o),e.innerHTML='<div class="card"><div class="empty-box">页面数据不完整，刷新试试；还不行就把这里的情况告诉开发者</div></div>'}})()}const le=e=>document.querySelector(e),lt=45,Oe=20,dt="My name is Alex and I live in a small city near the sea. On weekdays I study in the morning and work in a small cafe in the afternoon. In the evening I usually go running by the river, and then I read for half an hour before bed.",ut=["What do you usually do on a normal weekday?","What is one thing you would like to change about your daily routine?"],os=["电影迷","科技控","旅行党","社会派"],as=["破冰者","慢热型","倾听者"],is=["短平快","深聊派"];function rs(){return`<div class="level-shell">
    <div class="level-top">
      <div class="brand"><span class="logo">L</span>LinguaMate</div>
      <div class="top-actions"><span class="muted">${he()?.account??"未登录"}</span></div>
    </div>

    <div class="level-grid">
      <section class="card level-card">
        <div class="level-head">
          <h1>大概三分钟，给你一个起点</h1>
        </div>
        <div id="level-body"></div>
      </section>

      <aside class="card level-side">
        <div id="side-body"></div>
      </aside>
    </div>
  </div>`}function cs(e,t,s=12){return new Promise(a=>{const o=document.createElement("div");o.className="mask",o.innerHTML=`<div class="modal ask-modal">
      <h3>${e}</h3>
      <input id="ask-input" maxlength="${s}" placeholder="${t}" />
      <div class="ask-actions">
        <button class="btn ghost sm" type="button" data-cancel>取消</button>
        <button class="btn sm" type="button" data-ok>确定</button>
      </div>
    </div>`,document.body.appendChild(o);const r=o.querySelector("#ask-input"),l=b=>{o.remove(),a(b)};r.focus(),o.querySelector("[data-ok]").addEventListener("click",()=>l(r.value.trim()||null)),o.querySelector("[data-cancel]").addEventListener("click",()=>l(null)),r.addEventListener("keydown",b=>{b.key==="Enter"&&l(r.value.trim()||null)})})}function ls(){const e=he();if(!e){location.hash="#/login";return}const t=le("#level-body"),s=le("#side-body"),a=le(".level-grid"),o=le(".level-side");let r=null,l=null,b=null,g=!1,k=null;const d=[],I=f=>{o.hidden=!f,o.style.display=f?"":"none",a.classList.toggle("full",!f)},O=()=>{s.innerHTML=`
      <h3>朗读提示</h3>
      <ul class="side-list">
        <li>不用读快，<b>清楚</b>比快重要。</li>
        <li>读错了继续往下读，不用回头改。</li>
        <li>遇到不会的词，跳过去就好。</li>
        <li>读完按「我读完了」。</li>
      </ul>`},$=f=>{s.innerHTML=`
      <h3>第 ${f+1} 题怎么答</h3>
      <ul class="side-list">
        <li>先用一句话回答，再补一个<b>细节</b>或例子。</li>
        <li>最多 ${Oe} 秒，够了就点「说完了」。</li>
        <li>不会的词，用简单的词绕着说。</li>
        <li>可以说 "um…" 停顿，但别一直沉默。</li>
      </ul>`},S=()=>{l&&(l.close().catch(()=>{}),l=null)},j=async()=>r||(r=await navigator.mediaDevices.getUserMedia({audio:!0}),r),D=async(f,M)=>{const E=await j();let q=0,H=0,h=!1,L=0,de=!1,ne="",oe="";return await new Promise(ae=>{let J=0,ie;const re=()=>{if(de)return;de=!0,window.clearInterval(J),ie&&window.clearInterval(ie),S();const w=(ne||oe).trim();ae({seconds:q,text:w,words:w.split(/\s+/).filter(Boolean).length,pauses:H})};b=re;const me=window.SpeechRecognition??window.webkitSpeechRecognition;if(me)try{const w=new me;w.lang="en-US",w.continuous=!0,w.interimResults=!0,w.onresult=N=>{const B=N;let te="";for(let V=B.resultIndex;V<B.results.length;V++){const Y=B.results[V];Y.isFinal?ne=`${ne} ${Y[0].transcript}`.trim():te+=Y[0].transcript}oe=te.trim()},w.onerror=()=>{},w.onend=()=>{},w.start(),Te=w}catch{Te=null}try{l=new AudioContext;const w=l.createMediaStreamSource(E),N=l.createAnalyser();N.fftSize=512,w.connect(N);const B=new Float32Array(N.fftSize);ie=window.setInterval(()=>{N.getFloatTimeDomainData(B);let te=0;for(let z=0;z<B.length;z++)te+=B[z]*B[z];const V=Math.sqrt(te/B.length)>.02,Y=Date.now();V?(L=Y,h=!0):h&&Y-L>1200&&(h=!1,H++)},100)}catch{}J=window.setInterval(()=>{q++,M(q),q>=f&&re()},1e3),M(0)}).finally(()=>{try{Te?.stop()}catch{}Te=null,b=null})},G=()=>{I(!0),O(),t.innerHTML=`
      <div class="passage">
        <div class="passage-label">请朗读下面这段话（限时 ${lt} 秒）</div>
        <p>${dt}</p>
      </div>

      <div class="rec-stage small">
        <div class="rec-timer" id="rec-timer">00:00</div>
      </div>

      <button class="btn" id="rec-go" type="button">开始朗读</button>
      <button class="btn ghost" id="rec-stop" type="button" hidden>我读完了</button>
      <p class="err" id="rec-err" hidden></p>

      <div class="steps-hint">第 1 步 / 共 3 步</div>`,le("#rec-go").onclick=async()=>{const f=le("#rec-err");try{if(!navigator.mediaDevices?.getUserMedia){f.textContent="这个浏览器不支持麦克风，换 Edge 或 Chrome",f.hidden=!1;return}await j()}catch(E){const q=E instanceof DOMException?E.name:"";f.textContent=q==="NotAllowedError"?"你拒绝了麦克风权限：点地址栏左边的锁，把麦克风改成允许":"打不开麦克风",f.hidden=!1;return}le("#rec-go").hidden=!0;const M=le("#rec-stop");M.hidden=!1,M.onclick=()=>b?.(),k=await D(lt,E=>{const q=document.querySelector("#rec-timer");q&&(q.textContent=pt(E))}),!g&&K(0)}},K=f=>{I(!0),$(f),t.innerHTML=`
      <div class="passage">
        <div class="passage-label">第 ${f+1} 题（限时 ${Oe} 秒）</div>
        <p class="question">${ut[f]}</p>
      </div>

      <div class="rec-stage small">
        <div class="rec-timer" id="rec-timer">00:00</div>
      </div>

      <button class="btn" id="ans-go" type="button">开始回答</button>
      <button class="btn ghost" id="ans-stop" type="button" hidden>说完了</button>

      <div class="steps-hint">第 ${f+2} 步 / 共 3 步</div>`,le("#ans-go").onclick=async()=>{le("#ans-go").hidden=!0;const M=le("#ans-stop");M.hidden=!1,M.onclick=()=>b?.();const E=await D(Oe,q=>{const H=document.querySelector("#rec-timer");H&&(H.textContent=pt(q))});g||(d.push(E),f+1<ut.length?K(f+1):P())}},P=async()=>{I(!1),t.innerHTML=`
      <div class="analyzing">
        <div class="dots"><i></i><i></i><i></i></div>
        <p class="sub">正在分析你的朗读和回答……</p>
      </div>`,await new Promise(f=>setTimeout(f,1400)),!g&&W()},ee=f=>{const M=ht(f);if(M.length<3)return null;const E=new Map;for(const h of M)E.set(h,(E.get(h)??0)+1);const q=ht(dt);let H=0;for(const h of q){const L=E.get(h)??0;L>0&&(H++,E.set(h,L-1))}return Math.round(H/q.length*100)},W=()=>{I(!1);const f=k??{seconds:0,text:"",words:0,pauses:0},M=ee(f.text),E=d.reduce((T,R)=>T+R.seconds,0),q=d.reduce((T,R)=>T+R.words,0),H=d.reduce((T,R)=>T+R.pauses,0),h=E/60,L=h>0?H/h:12,de=h>0?q/h:0,ne=(T,R,X)=>Math.max(R,Math.min(X,T)),oe=Math.round(ne(100-L*8,20,95)),ae=Math.round(ne(de/1.5,20,95)),J=d.filter(T=>T.seconds>=8).length,ie=d.length===0?30:Math.round(30+J/d.length*70),re=Math.round(M===null?oe*.4+ae*.3+ie*.3:M*.35+oe*.25+ae*.2+ie*.2),me=re>=80?"B2":re>=55?"B1":"A2",w=[],N=[...os],B=[...as],te=[...is];let V="",Y="";const z=(T,R,X="")=>`
      <div class="metric">
        <div class="metric-row"><span>${T}</span><b>${R===null?"—":R+X}</b></div>
        <div class="metric-bar"><i style="width:${R??0}%"></i></div>
      </div>`,se=()=>`
      <div class="qblock">
        <div class="q">① 休息时你最愿意点开什么？<span class="q-hint">可多选</span></div>
        <div class="opts" data-group="interest">
          ${[...N,"__other__"].map(T=>T==="__other__"?'<button class="opt other" type="button" data-other="interest">+ 其他</button>':`<button class="opt ${w.includes(T)?"on":""}" type="button">${T}</button>`).join("")}
        </div>
      </div>

      <div class="qblock">
        <div class="q">② 走进一个全是陌生人的房间，你会？</div>
        <div class="opts" data-group="social">
          ${[...B,"__other__"].map(T=>T==="__other__"?'<button class="opt other" type="button" data-other="social">+ 其他</button>':`<button class="opt ${V===T?"on":""}" type="button">${T}</button>`).join("")}
        </div>
      </div>

      <div class="qblock">
        <div class="q">③ 一次练习你想聊多久？</div>
        <div class="opts" data-group="rhythm">
          ${[...te,"__other__"].map(T=>T==="__other__"?'<button class="opt other" type="button" data-other="rhythm">+ 其他</button>':`<button class="opt ${Y===T?"on":""}" type="button">${T}</button>`).join("")}
        </div>
      </div>

      <div class="qblock">
        <div class="q">④ 你认为你是……<span class="q-hint">可以不填</span></div>
        <input class="self-input" id="self-desc" maxlength="40" placeholder="比如：大三学生 / 程序员 / 话痨但怕生（可留空）" />
      </div>`,Z=()=>{t.innerHTML=`
        <div class="result-head">
          <div>
            <div class="sub">初步等级</div>
            <div class="grade"><b>${me}</b></div>
          </div>
          <div class="result-meta">
            <div>朗读 <b>${f.seconds}</b> 秒 · 停顿 <b>${f.pauses}</b> 次</div>
            <div>回答 <b>${J}</b> / ${d.length} 题达标（≥8 秒）</div>
            <div class="muted">评分来自：朗读准确度、停顿、语速、完成度</div>
          </div>
        </div>

        <div class="metrics">
          ${z("朗读准确度",M,"%")}
          ${z("流利度（停顿）",oe)}
          ${z("语速",ae)}
          ${z("完成度",ie)}
        </div>

        <div class="quiz" id="quiz">${se()}</div>
        <p class="err" id="level-err" hidden></p>
        <button class="btn" id="level-done" type="button">完成，进入大厅</button>`,t.querySelectorAll(".opts").forEach(R=>{R.onclick=async X=>{const ce=X.target,we=ce.closest("[data-other]");if(we){const m=we.dataset.other,p=await cs("自己写一个标签","最多 12 个字",12);if(!p)return;m==="interest"?(N.includes(p)||N.push(p),w.includes(p)||w.push(p)):m==="social"?(B.includes(p)||B.push(p),V=p):(te.includes(p)||te.push(p),Y=p),Z();return}const ke=ce.closest(".opt");if(!ke)return;const c=R.dataset.group,u=ke.textContent?.trim()??"";if(c==="interest"){const m=w.indexOf(u);m>=0?w.splice(m,1):w.push(u)}else c==="social"?V=V===u?"":u:Y=Y===u?"":u;Z()}});const T=t.querySelector("#self-desc");le("#level-done").onclick=async()=>{const R=le("#level-err");if(w.length===0||!V){R.textContent="第 ① 题至少选一个、第 ② 题选一个，我们才知道给你配谁",R.hidden=!1;return}const X=await A.level({account:e.account,readingSeconds:f.seconds,readingAccuracy:M,readingWords:f.words,answers:d.map(ce=>({seconds:ce.seconds,words:ce.words,pauses:ce.pauses})),interests:w,social:V,rhythm:Y,selfDesc:T?.value.trim()??""});if(!X.ok){R.textContent=X.error,R.hidden=!1;return}Ut({level:X.data.level,tags:X.data.tags,assessed:1}),location.hash="#/app"}};Z()};G(),window.addEventListener("hashchange",()=>{g=!0,b?.();try{Te?.stop()}catch{}S(),r?.getTracks().forEach(f=>f.stop()),r=null},{once:!0})}let Te=null;const pt=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,ht=e=>e.toLowerCase().replace(/[^a-z'\s]/g," ").split(/\s+/).filter(Boolean),y=e=>document.querySelector(e),Pe=e=>`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`,ds={new:"准备中",connecting:"正在连接…",connected:"已连接",disconnected:"连接中断",failed:"连接失败",closed:"已关闭"},us={最近一件让你开心的小事:{words:["honestly","tiny","unexpected","make my day","cheer up"],phrases:["The smallest thing made my day.","Out of nowhere, something good happened.","It still makes me smile when I think about it."],questions:["What was the last small thing that made you happy?","Do small things matter more than big ones?"]},你最近在追的剧或游戏:{words:["episode","plot twist","hooked","character","recommend"],phrases:["I'm three episodes in and already hooked.","The plot is simple, but the acting carries it.","I'd recommend it if you like slow stories."],questions:["What are you watching or playing right now?","Would you recommend it to a beginner?"]},如果能立刻去一个地方:{words:["somewhere","beach","crowded","get away","someday"],phrases:["If I could teleport, I would be on a beach right now.","I prefer small towns to big cities.","I have been saving for that trip for months."],questions:["Where would you go tomorrow if you could?","Do you prefer cities or small towns?"]},你最近在学什么:{words:["practise","struggle with","get the hang of","progress","step by step"],phrases:["I've been learning it for about two months.","The hardest part is remembering new words.","I try to practise a little every day."],questions:["What are you learning these days?","What is the hardest part of it?"]},工作或学习里最烦的事:{words:["annoying","deadline","handle","figure out","give up"],phrases:["The most annoying thing is waiting for others.","I haven't figured out a good way to handle it.","I try not to give up, but sometimes I do."],questions:["What is the most annoying part of your week?","How do you usually deal with it?"]}};function wt(e){return`<div class="room-top">
    <div class="brand"><span class="logo">L</span>LinguaMate</div>
    <div class="top-actions">${e}</div>
  </div>`}function ps(e){return`<div class="room-shell">
    ${wt('<a class="pill-link" href="#/app">返回大厅</a>')}
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
  </div>`}function hs(e){const t=y("#wait-code");let s=!1,a;y("#wait-copy").onclick=()=>{navigator.clipboard?.writeText(e),y("#wait-copy").textContent="已复制"},y("#wait-cancel").onclick=()=>{s=!0,a&&window.clearInterval(a),A.roomLeave({clientId:ve()}),location.hash="#/app"};const o=async()=>{if(s)return;const r=await A.roomState(e,ve());if(!r.ok){t.textContent="房间已结束",y("#wait-cancel").textContent="返回大厅";return}r.data.room.guest&&(s=!0,a&&window.clearInterval(a),location.hash="#/room/"+e)};o(),a=window.setInterval(()=>{o()},1e3),Ge(()=>{s=!0,a&&window.clearInterval(a)})}function ms(){return`<div class="room-shell">
    ${wt('<a class="pill-link" href="#/app">返回大厅</a>')}
    <section class="card waiting">
      <h1>加入房间</h1>
      <p class="sub">输入对方给你的 6 位房间号</p>
      <label class="field">房间号
        <input id="join-code" maxlength="6" placeholder="例如 A1B2C3" autocomplete="off" />
      </label>
      <p class="err" id="join-err" hidden></p>
      <button class="btn" id="join-go" type="button">加入</button>
    </section>
  </div>`}function fs(){const e=he();if(!e){location.hash="#/login";return}const t=y("#join-code"),s=y("#join-err"),a=async()=>{const o=t.value.trim().toUpperCase();if(o.length!==6){s.textContent="房间号是 6 位",s.hidden=!1;return}const r=await A.roomJoin({account:e.account,clientId:ve()});if(!r.ok){s.textContent=r.error,s.hidden=!1;return}location.hash="#/room/"+o};y("#join-go").onclick=()=>{a()},t.onkeydown=o=>{o.key==="Enter"&&a()}}function vs(e){return`<div class="room-shell">
    <div class="rbar">
      <div class="rwho">
        <b id="r-title">房间 ${e}</b>
        <span class="muted" id="r-peer">正在确认对方…</span>
      </div>
      <div class="prog">
        <div class="track"><i id="r-bar"></i></div>
        <div class="lbl"><span>已练 <b id="r-clock">00:00</b></span><span id="r-goal">最低 3:00 · 优秀 10:00</span></div>
      </div>
      <button class="btn ghost sm" id="r-copy" type="button">复制房间号</button>
      <button class="btn ghost sm" id="r-end" type="button">结束练习</button>
    </div>

    <div class="rbanner" id="r-banner" hidden></div>

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
            <p id="r-topic">最近一件让你开心的小事</p>
          </div>

          <div class="cblock">
            <button class="btn ghost sm" id="r-switch" type="button">聊不下去了，换个话题</button>
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
              <ul class="rescue-ideas" id="r-rescue-ideas"></ul>
              <button class="link" id="r-rescue-say" type="button">🔊 听一下</button>
            </div>
          </div>

          <div class="cblock">
            <button class="btn ghost sm" id="r-switch" type="button">聊不下去了，换个话题</button>
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

    <div class="mask" id="save-mask" hidden>
      <div class="modal save-modal">
        <p class="left-text">要保存这次对话的文字记录吗？</p>
        <p class="sub">保存后以后可以复盘；不保存就只留时长和标签。</p>
        <div class="save-actions">
          <button class="btn ghost sm" id="save-no" type="button">不保存</button>
          <button class="btn sm" id="save-yes" type="button">保存并离开</button>
        </div>
      </div>
    </div>
  </div>`}function gs(e){const t=he();if(!t){location.hash="#/login";return}const s=ve();let a=0,o,r=!0;const l=new URLSearchParams(location.search).get("fast")==="1",b=t.level??"B1",g=b==="A2"?2:b==="B1"?5:10,k=l?g*6:g*60,d=Math.round(k/2),I=y("#r-goal");I&&(I.textContent=`最低 ${Pe(d)} · 目标 ${Pe(k)}${l?" · 测试模式":""}`);const O=y("#r-link"),$=y("#r-live"),S=y("#r-mic"),j=y("#r-ear"),D=y("#r-remote");D.muted=!0;let G=null,K=!1,P=!1;const ee=()=>{$.textContent=`麦克风${K?"已开启":"未开启"} · 听筒${P?"已开":"关闭"}${K?" · 转写由浏览器提供，需联网":""}`};ee();const W=y("#r-stream"),f=y("#r-rescue"),M=y("#r-rescue-text");let E="对方",q=Date.now(),H=!1;const h=["Honestly, the smallest thing made my day…","That reminds me of something that happened last week.","I can't remember the word, but it's like…","What about you? Has anything like that happened to you?"];let L=null;const de=()=>{try{const n=speechSynthesis.getVoices().filter(i=>i.lang.toLowerCase().startsWith("en"));L=n.find(i=>!/online|natural/i.test(i.name))??n[0]??null}catch{L=null}},ne=n=>{try{speechSynthesis.paused&&speechSynthesis.resume(),speechSynthesis.cancel();const i=new SpeechSynthesisUtterance(n);i.lang="en-US",i.rate=.9,L&&(i.voice=L),window.setTimeout(()=>{try{speechSynthesis.speak(i)}catch{}},20)}catch{}},oe=()=>{try{de();const n=new SpeechSynthesisUtterance(" ");n.volume=0,n.rate=2,L&&(n.voice=L),speechSynthesis.speak(n),window.setTimeout(()=>{try{speechSynthesis.cancel()}catch{}},30)}catch{}};de(),oe();try{speechSynthesis.onvoiceschanged=()=>{de(),oe()}}catch{}document.addEventListener("pointerdown",oe,{once:!0});const ae=()=>{q=Date.now(),H&&(H=!1,f.hidden=!0)},J=[],ie=n=>n.replace(/[&<>"]/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[i]??i),re=(n,i,v="")=>{W.querySelector(".stream-empty")?.remove();const ue=document.createElement("div");ue.className=`msg ${i?"self":""}`;const pe=i?t?.account?.[0]??"我":E[0]??"对",F=v?`<div class="bub"><b class="bub-text">${ie(v)}</b><span class="tr">🎤 ${n} 秒</span></div>`:`<div class="bub voice">🎤 ${n} 秒<span class="tr">（没识别到文字）</span></div>`;ue.innerHTML=`<span class="m-ava" style="background:${i?"#ff6b4a":"#7c6cf6"}">${pe}</span>${F}`,W.appendChild(ue),W.scrollTop=W.scrollHeight,v&&J.push(`${i?"我":E}：${v}`)},me=n=>{W.querySelector(".stream-empty")?.remove();const i=document.createElement("div");i.className="sys-row",i.textContent=n,W.appendChild(i),W.scrollTop=W.scrollHeight};let w=null;const N=n=>{if(!n){w?.remove(),w=null;return}W.querySelector(".stream-empty")?.remove(),w||(w=document.createElement("div"),w.className="msg self draft",w.innerHTML=`<span class="m-ava" style="background:#ff6b4a">${t?.account?.[0]??"我"}</span><div class="bub draft-bub"></div>`,W.appendChild(w));const i=w.querySelector(".draft-bub");i&&(i.textContent=n),W.scrollTop=W.scrollHeight},B=y("#r-banner");let te;const V=(n,i,v)=>{B.textContent=n,B.className=`rbanner ${i}`,B.hidden=!1,B.onclick=v??null,te&&window.clearTimeout(te),te=window.setTimeout(()=>{B.hidden=!0},i==="strong"?9e3:6e3)},Y=["最近一件让你开心的小事","你最近在追的剧或游戏","如果能立刻去一个地方","你最近在学什么","工作或学习里最烦的事"],z=y("#r-topic");let se=0,Z=[];const T=y("#r-rescue-ideas"),R=n=>{const i=gt(n);if(i)return[i.questions[0],i.followUps[0],i.phrases[1]].filter(Boolean);const v=us[n];return v?v.questions:[]},X=()=>{se=(se+1)%Y.length;const n=Y[se];z.textContent=n,me(`已切换到话题：${n}`),Z=[],A.signalSend({}),ae()},ce=()=>{const n=Date.now();Z=Z.filter(i=>n-i<6e4),Z.push(n),Z.length>=3&&(V("连着卡住几次了 · 点这里换个话题","hint",X),Z=[])},we=window.setInterval(()=>{if(!a||H||Date.now()-q<8e3)return;H=!0,M.textContent=h[Math.floor(Math.random()*h.length)];const n=R(z.textContent??"");T.innerHTML=n.map(i=>`<li>${i}</li>`).join(""),f.hidden=!1,ce()},1e3),ke=window.SpeechRecognition??window.webkitSpeechRecognition;let c=null,u=!1,m="",p="";const x=()=>{if(!(!ke||c))try{const n=new ke;n.lang="en-US",n.continuous=!0,n.interimResults=!0,n.onresult=i=>{const v=i;let ue="";for(let pe=v.resultIndex;pe<v.results.length;pe++){const F=v.results[pe];F.isFinal?m=`${m} ${F[0].transcript}`.trim():ue+=F[0].transcript}p=ue.trim(),N(p)},n.onerror=()=>{},n.onend=()=>{if(u)try{n.start()}catch{}},n.start(),c=n,u=!0}catch{c=null}},$e=()=>{u=!1;try{c?.stop()}catch{}c=null,m="",p="",N("")};document.querySelectorAll("[data-say]").forEach(n=>{const i=()=>ne(n.dataset.say??"");n.querySelector(".say")?.addEventListener("click",v=>{v.stopPropagation(),i()}),n.addEventListener("click",i)}),y("#r-rescue-say").onclick=()=>ne(M.textContent??"");let Ie=null,fe=null,Me,Se=!1,Ke=0,qe=0;const St=n=>{try{Ie=new AudioContext;const v=Ie.createMediaStreamSource(n);fe=Ie.createAnalyser(),fe.fftSize=512,v.connect(fe)}catch{return}const i=new Float32Array(fe.fftSize);Me=window.setInterval(()=>{if(!fe)return;fe.getFloatTimeDomainData(i);let v=0;for(let F=0;F<i.length;F++)v+=i[F]*i[F];const ue=Math.sqrt(v/i.length),pe=Date.now();if(ue>.02)qe=pe,ae(),Se||(Se=!0,Ke=pe);else if(Se&&pe-qe>600){Se=!1;const F=qe-Ke;if(F>=700){const At=String(Math.max(1,Math.round(F/1e3))),Et=(m||p).trim();m="",p="",N(""),re(At,!0,Et),A.signalSend({})}}},100)},Tt=()=>{Me&&window.clearInterval(Me),Me=void 0,fe=null,Ie?.close().catch(()=>{}),Ie=null,Se=!1};let C=null,be=null,He=!1,xe=[],Re=0;const Je=()=>{const n=C?.connectionState??"new";O.textContent=`连接：${ds[n]??n}`},je=()=>{C?.close(),C=null,be=null},Ze=async()=>{if(C){for(const n of xe)try{await C.addIceCandidate(n)}catch{}xe=[]}},De=()=>{je(),C=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]}),be=null,He=!1,xe=[],C.ontrack=n=>{D.srcObject=n.streams[0]??new MediaStream([n.track]),D.muted=!P},C.onicecandidate=n=>{n.candidate&&A.signalSend({data:n.candidate.toJSON()})},C.onconnectionstatechange=Je,Je()};De();const Ce=async()=>{if(!C)return;const n=C.getTransceivers(),i=n.find(v=>v.mid!==null)??n[0];if(i&&(i.direction!=="sendrecv"&&(i.direction="sendrecv"),be=i.sender,G)){const v=G.getAudioTracks()[0];v&&await be.replaceTrack(v).catch(()=>{})}},Lt=async()=>{if(!C||He)return;He=!0,C.getTransceivers().length===0&&C.addTransceiver("audio",{direction:"sendrecv"}),await Ce();const n=await C.createOffer();await C.setLocalDescription(n),await Ce(),await A.signalSend({data:C.localDescription})},Mt=async(n,i)=>{if(C){if(n==="offer"){await C.setRemoteDescription(i),await Ce(),await Ze();const v=await C.createAnswer();await C.setLocalDescription(v),await A.signalSend({data:C.localDescription})}else if(n==="answer")await C.setRemoteDescription(i),await Ce(),await Ze();else if(n==="ice")if(C.remoteDescription)try{await C.addIceCandidate(i)}catch{}else xe.push(i);else if(n==="retry")De();else if(n==="bubble"){const v=i;re(String(v.seconds??1),!1,typeof v.text=="string"?v.text:""),ae()}else if(n==="topic"){const v=i;v.name&&(z.textContent=v.name,me(`对方切换了话题：${v.name}`),ae())}}};let Xe=!1,Qe=!1;const Ue=n=>{Qe||(Qe=!0,y("#left-text").textContent=n,y("#left-mask").hidden=!1)},et=async()=>{if(!r)return;const n=await A.roomState(e,s);if(!n.ok){Ue("房间已结束");return}const i=n.data.room,v=n.data.role==="host";if(i.mode,i.topic&&z.textContent!==i.topic&&(z.textContent=i.topic),n.data.role==="none"){Ue("你已不在这个房间里");return}const ue=v?i.guest?.account:i.host.account;if(ue&&(E=ue),y("#r-peer").textContent=i.guest?`对方已进入：${ue??""}`:"等待对方进入…",i.guest&&(Xe=!0),v&&Xe&&!i.guest){Ue("对方已离开房间");return}i.startedAt&&!a&&(a=i.startedAt,o=window.setInterval(xt,1e3)),v&&i.guest&&await Lt();const pe=await A.signalPoll(e,Re);if(pe.ok)for(const F of pe.data.messages)Re=Math.max(Re,F.seq),F.from!==s&&await Mt(F.kind,F.data)};let tt=!1,st=!1;const xt=()=>{if(!a)return;const n=Math.floor((Date.now()-a)/1e3);y("#r-clock").textContent=Pe(n),y("#r-bar").style.width=`${Math.min(100,n/k*100)}%`,!tt&&n>=d&&(tt=!0,V("已聊满最低时间，保持住","soft")),!st&&n>=k&&(st=!0,V(`${g} 分钟达成，这次练得很扎实 🎉`,"strong"),me(`🎉 达到目标时间：${g} 分钟`))},We=async()=>{Tt(),$e(),G?.getTracks().forEach(n=>n.stop()),G=null,K=!1,be&&await be.replaceTrack(null).catch(()=>{}),S.textContent="麦克风",ee()};S.onclick=async()=>{if(K){await We();return}try{if(!navigator.mediaDevices?.getUserMedia){$.textContent="这个浏览器不支持麦克风";return}G=await navigator.mediaDevices.getUserMedia({audio:!0});const n=G.getAudioTracks()[0];be&&await be.replaceTrack(n),St(G),x(),K=!0,S.textContent="关闭麦克风",ee()}catch(n){const i=n instanceof DOMException?n.name:"";$.textContent=i==="NotAllowedError"?"你拒绝了麦克风权限：点地址栏左边的锁，把麦克风改成允许":i==="NotFoundError"?"没检测到麦克风设备":"开启麦克风失败，看控制台报错"}},j.onclick=()=>{P=!P,D.muted=!P,j.textContent=P?"听筒已开":"听筒",ee()},y("#r-retry").onclick=()=>{De(),A.signalSend({})},y("#r-switch").onclick=()=>X();const Be=y("#save-mask"),_e=n=>{n&&J.length>0&&A.saveTranscript({account:t.account}),r=!1,We(),je(),o&&window.clearInterval(o),window.clearInterval(we),A.roomLeave({}),location.hash="#/app"},nt=()=>{if(J.length>0){Be.hidden=!1;return}_e(!1)};y("#save-yes").onclick=()=>{Be.hidden=!0,_e(!0)},y("#save-no").onclick=()=>{Be.hidden=!0,_e(!1)},y("#r-copy").onclick=()=>{navigator.clipboard?.writeText(e),y("#r-copy").textContent="已复制"},y("#r-end").onclick=nt,y("#left-go").onclick=nt,et();const Ct=window.setInterval(()=>{et()},800);Ge(()=>{r=!1,We(),je(),o&&window.clearInterval(o),window.clearInterval(Ct),window.clearInterval(we)})}const bs=document.querySelector("#app"),mt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let Ee="";function kt(){Ee=Array.from({length:4},()=>mt[Math.floor(Math.random()*mt.length)]).join("")}const Q=e=>document.querySelector(e);function ge(e,t){t?(e.textContent=t,e.hidden=!1):(e.textContent="",e.hidden=!0)}function ys(){return`
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
  </div>`}function ws(){return`
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
            <button class="code" type="button" id="r-refresh" title="点一下换一个">${Ee}</button>
          </div>
        </label>
        <p class="err" id="r-err" hidden></p>
        <button class="btn" type="submit">注册并登录</button>
        <div class="row"><a class="link" href="#/login">已有账号，去登录</a></div>
      </form>
    </div>
  </div>`}function ks(){const e=Q("#login-form"),t=Q("#l-err");e.addEventListener("submit",async s=>{s.preventDefault();const a=e.querySelector('button[type="submit"]'),o=Q("#l-account").value.trim(),r=Q("#l-pass").value;if(!o||!r)return ge(t,"请输入账号和密码");a.disabled=!0;const l=await Bt(o,r);if(a.disabled=!1,!l.ok)return ge(t,l.msg);$t()}),Q("#l-forgot").addEventListener("click",()=>{Q("#l-note").hidden=!1})}function $s(){const e=Q("#reg-form"),t=Q("#r-err");Q("#r-refresh").addEventListener("click",()=>{kt(),Q("#r-refresh").textContent=Ee}),e.addEventListener("submit",async s=>{s.preventDefault();const a=e.querySelector('button[type="submit"]'),o=Q("#r-account").value.trim(),r=Q("#r-pass").value,l=Q("#r-pass2").value,b=Q("#r-phone").value.trim(),g=Q("#r-email").value.trim(),k=Q("#r-code").value.trim();if(!/^[A-Za-z0-9_]{2,20}$/.test(o))return ge(t,"账号要 2–20 位字母、数字或下划线");if(r.length<6)return ge(t,"密码至少 6 位");if(r!==l)return ge(t,"两次输入的密码不一致");if(!/^1[3-9]\d{9}$/.test(b))return ge(t,"手机号格式不对");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g))return ge(t,"邮箱格式不对");if(k.toUpperCase()!==Ee)return ge(t,"验证码不对");a.disabled=!0;const d=await Wt({account:o,password:r});if(a.disabled=!1,!d.ok)return ge(t,d.msg);$t()})}function ye(e,t){_t(),bs.innerHTML=e,t()}function $t(){const e=he();location.hash=e&&!e.assessed?"#/level":"#/app"}function It(){const e=location.hash.replace(/^#\/?/,""),[t="login",s=""]=e.split("/");if(t==="register"){kt(),ye(ws(),$s);return}if((t==="app"||t==="me"||t==="level"||t==="wait"||t==="join"||t==="room")&&!he()){location.hash="#/login";return}if(t==="level"){ye(rs(),ls);return}if(t==="app"){const o=he();if(o&&!o.assessed){location.hash="#/level";return}ye(Gt(),Kt);return}if(t==="me"){ye(ss(),ns);return}if(t==="wait"&&s){ye(ps(s),()=>hs(s));return}if(t==="join"){ye(ms(),fs);return}if(t==="room"&&s){ye(vs(s),()=>gs(s));return}ye(ys(),ks)}window.addEventListener("hashchange",It);It();{const e=document.createElement("div");e.className="demo-banner",e.textContent="静态演示版 · 演示账号 demo / 123456 · 房间与语音需在本地运行完整版",document.body.prepend(e),document.body.classList.add("has-demo-banner")}
