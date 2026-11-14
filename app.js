const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="wardrobe.items.v1", DB_NAME="wardrobe-local", DB_VERSION=1;
let items=[], photo="", filter="All", db=null, lastFlight=null, editingItemId=null, lastOutfitReason="";
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(s){let t=$("#toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function openDB(){return new Promise((resolve,reject)=>{if(!("indexedDB"in window)){reject(Error("IndexedDB unavailable"));return}let r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{let d=r.result;if(!d.objectStoreNames.contains("items"))d.createObjectStore("items",{keyPath:"id"})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function dbRequest(mode,fn){return new Promise((resolve,reject)=>{if(!db){reject(Error("Local database unavailable"));return}let tx=db.transaction("items",mode),store=tx.objectStore("items"),req=fn(store);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.onabort=()=>reject(tx.error)})}
async function persistItems(){try{if(db){await new Promise((resolve,reject)=>{let tx=db.transaction("items","readwrite"),s=tx.objectStore("items");s.clear();items.forEach(x=>s.put(x));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}else localStorage.setItem(KEY,JSON.stringify(items));}catch(e){console.error(e);toast("Storage is full. Export a backup and remove some photos.")}updateStorageStatus()}
async function initStorage(){try{db=await openDB();let saved=await dbRequest("readonly",s=>s.getAll());if(saved?.length){items=saved}else{let legacy=JSON.parse(localStorage.getItem(KEY)||"[]");items=legacy;if(legacy.length){await persistItems();localStorage.removeItem(KEY)}}if(navigator.storage?.persist)try{await navigator.storage.persist()}catch(e){} }catch(e){
 console.error("WARDROBE storage initialisation failed",e);
 try{items=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(parseError){items=[]}
 const status=$("#storageStatus");if(status)status.textContent="Using browser fallback storage · export a backup";
 }render();inspo();updateStorageStatus()}
async function updateStorageStatus(){let mb="";try{let e=await navigator.storage?.estimate?.();if(e?.usage!=null)mb=` · ${(e.usage/1048576).toFixed(1)} MB used`}catch(e){}let mode=db?"On this iPhone · IndexedDB":"On this iPhone · browser storage";let el=$("#storageStatus");if(el)el.textContent=`${mode} · ${items.length} pieces${mb}`}
function go(p){$$(".page").forEach(x=>x.classList.toggle("active",x.id===p));$$("nav button").forEach(x=>x.classList.toggle("active",x.dataset.go===p));scrollTo(0,0)}
$$("nav button").forEach(b=>b.onclick=()=>go(b.dataset.go));
$("#today").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",day:"numeric",month:"long"}).format(new Date()).toUpperCase();
$("#about").onclick=()=>alert("WARDROBE. Clothing photos and details are stored on this iPhone. Use Export backup regularly to keep a copy in Files.");
function addOpen(){
 editingItemId=null;$("#itemForm").reset();photo="";$("#preview").innerHTML="＋";
 $("#itemFormTitle").textContent="New wardrobe piece";$("#itemSaveButton").textContent="Save to wardrobe";
 $("#itemDialog").showModal();
}
function editOpen(id){
 const x=items.find(i=>i.id===id);if(!x)return;
 editingItemId=id;$("#itemForm").reset();photo=x.photo||"";
 $("#name").value=x.name||"";$("#category").value=x.category||"Tops";$("#colour").value=x.colour||"";
 $("#itemStyle").value=x.style||"Versatile";$("#warmth").value=String(x.warmth||2);$("#notes").value=x.notes||"";
 $("#preview").innerHTML=photo?`<img src="${photo}">`:"＋";
 $("#itemFormTitle").textContent="Edit wardrobe piece";$("#itemSaveButton").textContent="Save changes";
 $("#detailDialog").close();$("#itemDialog").showModal();
}
$("#add").onclick=$("#firstAdd").onclick=addOpen;
$("#homeAction").onclick=()=>items.length?go("stylist"):addOpen();
function compressPhoto(file){return new Promise(resolve=>{let reader=new FileReader();reader.onload=()=>{let img=new Image();img.onload=()=>{try{let max=1400,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext("2d").drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",.82))}catch(e){resolve(reader.result)}};img.onerror=()=>resolve(reader.result);img.src=reader.result};reader.onerror=()=>resolve("");reader.readAsDataURL(file)})}
$("#photo").onchange=async e=>{let f=e.target.files?.[0];if(!f)return;photo=await compressPhoto(f);$("#preview").innerHTML=`<img src="${photo}">`};
$("#itemForm").onsubmit=async e=>{
 e.preventDefault();let name=$("#name").value.trim();if(!name)return;
 const values={name,category:$("#category").value,colour:$("#colour").value,style:$("#itemStyle").value,warmth:+$("#warmth").value,notes:$("#notes").value,photo};
 if(editingItemId){
   const index=items.findIndex(x=>x.id===editingItemId);
   if(index>=0)items[index]={...items[index],...values};
   toast("Wardrobe item updated");
 }else{
   items.unshift({id:crypto.randomUUID(),...values});toast("Added to your wardrobe");
 }
 editingItemId=null;await persistItems();$("#itemDialog").close();render();
};
$$("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).close());
function render(){let q=$("#search").value.toLowerCase(),list=items.filter(x=>(filter==="All"||x.category===filter)&&`${x.name} ${x.colour} ${x.notes}`.toLowerCase().includes(q));$("#itemsGrid").innerHTML=list.map(x=>`<article class="item" data-id="${x.id}"><div class="item-photo">${x.photo?`<img src="${x.photo}">`:`<span>${esc(x.name[0])}</span>`}</div><div class="item-copy"><b>${esc(x.name)}</b><small>${esc(x.colour||x.category)} · ${esc(x.category)}</small>${x.notes?`<small class="item-notes">${esc(x.notes)}</small>`:""}<button type="button" class="item-edit" data-edit-id="${esc(x.id)}">Edit item</button></div></article>`).join("");$("#empty").classList.toggle("show",items.length===0);$("#count").textContent=items.length+" pieces";$("#homeTitle").textContent=items.length?"Your wardrobe is ready":"Build your first outfit";$("#homeDesc").textContent=items.length?`${items.length} pieces ready to style. Choose an occasion and generate a look.`:"Add a few pieces and let your stylist put them together.";$("#homeAction").textContent=items.length?"Style an outfit ↗":"Add clothes ↗";$$(".item").forEach(el=>el.onclick=()=>detail(el.dataset.id));$$(".item-edit").forEach(btn=>btn.onclick=e=>{e.stopPropagation();editOpen(btn.dataset.editId)});updateStorageStatus()}
$("#search").oninput=render;
$$("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));render()});
function detail(id){
 let x=items.find(i=>i.id===id);if(!x)return;
 $("#detail").innerHTML=`<div class="dialog-head"><div class="eyebrow">YOUR WARDROBE<h2>${esc(x.name)}</h2></div><button class="plain close" id="detailClose">×</button></div>${x.photo?`<img src="${x.photo}">`:""}<p class="muted">${esc(x.category)} · ${esc(x.colour)} · ${esc(x.style)}</p>${x.notes?`<p class="muted">${esc(x.notes)}</p>`:""}<div class="actions"><button class="primary" id="editItem">Edit item</button><button class="secondary" id="remove">Remove from wardrobe</button></div>`;
 $("#detailDialog").showModal();$("#detailClose").onclick=()=>$("#detailDialog").close();
 $("#editItem").onclick=()=>editOpen(id);
 $("#remove").onclick=async()=>{items=items.filter(i=>i.id!==id);await persistItems();$("#detailDialog").close();render();toast("Removed")};
}
$("#exportBackup").onclick=()=>{let backup={app:"WARDROBE",version:2,exportedAt:new Date().toISOString(),items,saved:JSON.parse(localStorage.getItem("wardrobe.saved")||"[]"),inspiration:JSON.parse(localStorage.getItem("wardrobe.inspo")||"[]"),location:localStorage.getItem("wardrobe.location")||""};let blob=new Blob([JSON.stringify(backup)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`WARDROBE-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast("Backup exported — save it in Files")};
$("#importBackup").onclick=()=>$("#backupFile").click();
$("#backupFile").onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{let b=JSON.parse(await f.text());if(!Array.isArray(b.items))throw Error("This doesn't look like a WARDROBE backup");if(!confirm(`Restore ${b.items.length} clothing items? This replaces the current wardrobe on this iPhone.`))return;{
 const seen=new Set();
 items=b.items.map((raw,index)=>{
   const x={...raw};
   if(!x.id||seen.has(String(x.id)))x.id=crypto.randomUUID();
   x.id=String(x.id);seen.add(x.id);
   x.name=String(x.name||`Wardrobe item ${index+1}`);
   x.category=["Tops","Bottoms","Layers","Shoes","Accessories"].includes(x.category)?x.category:"Tops";
   x.colour=String(x.colour||"");x.style=String(x.style||"Versatile");
   x.notes=String(x.notes||"");x.warmth=Number(x.warmth)||2;x.photo=x.photo||"";
   return x;
 });
}
await persistItems();localStorage.setItem("wardrobe.saved",JSON.stringify(b.saved||[]));localStorage.setItem("wardrobe.inspo",JSON.stringify(b.inspiration||[]));if(b.location)localStorage.setItem("wardrobe.location",b.location);render();toast("WARDROBE backup restored")}catch(err){toast(err.message||"Could not read that backup")}finally{e.target.value=""}};
const label={Tops:"Top",Bottoms:"Bottoms",Layers:"Layer",Shoes:"Shoes",Accessories:"Finishing touch"};
const TREND_CUES=[
  {name:"wide-leg proportions",re:/wide.?leg|relaxed fit|loose fit|pleated/i,weight:1.8},
  {name:"tailored layers",re:/blazer|overcoat|trench|tailored jacket/i,weight:1.6},
  {name:"rich chocolate and charcoal tones",re:/chocolate|brown|charcoal|espresso|pine green|forest green/i,weight:1.3},
  {name:"textured leather",re:/leather|suede/i,weight:1.2},
  {name:"classic denim",re:/denim|jeans/i,weight:0.8},
  {name:"stripes and pattern",re:/stripe|striped|check/i,weight:0.7}
];
function trendScore(x){let t=`${x.name} ${x.colour||""} ${x.notes||""}`;return TREND_CUES.reduce((n,c)=>n+(c.re.test(t)?c.weight:0),0)}
function pickTrendAware(list){if(!list.length)return null;let ranked=[...list].sort((a,b)=>trendScore(b)-trendScore(a));let pool=ranked.slice(0,Math.min(3,ranked.length));return pool[Math.floor(Math.random()*pool.length)]}
function trendNotes(out){let found=[];for(const x of out){let t=`${x.name} ${x.colour||""} ${x.notes||""}`;for(const cue of TREND_CUES)if(cue.re.test(t)&&!found.includes(cue.name))found.push(cue.name)}return found.slice(0,2)}


function colourFamily(value){
 const s=String(value||"").toLowerCase();
 const has=(...w)=>w.some(v=>s.includes(v));
 if(has("olive","sage","khaki green","forest","moss","green"))return "green";
 if(has("navy","blue","denim","indigo"))return "blue";
 if(has("cream","ecru","ivory","off-white","off white","white"))return "light-neutral";
 if(has("stone","beige","sand","tan","camel","khaki"))return "warm-neutral";
 if(has("brown","chocolate","espresso","cognac","rust","terracotta"))return "earth";
 if(has("grey","gray","charcoal","silver"))return "grey";
 if(has("black"))return "black";
 if(has("burgundy","wine","maroon"))return "burgundy";
 if(has("pink","red","orange","purple","yellow"))return "accent";
 return "unknown";
}
function garmentFormality(x){
 const t=`${x.name} ${x.notes||""}`.toLowerCase();
 const st=String(x.style||"").toLowerCase();
 // The user's explicit item style is the strongest signal. Garment names refine it,
 // but chinos and ordinary shirts are not automatically treated as smart/formal.
 if(st==="formal")return 4;
 if(st==="smart casual")return 3;
 if(st==="casual"||st==="sporty")return 1;
 if(/tuxedo|dinner jacket|black tie|suit jacket|formal shoe|oxford shoe|dress shoe|tailcoat/.test(t))return 4;
 if(/blazer|tailored trouser|dress shirt|formal shirt|business shirt|oxford shirt|loafer|derby shoe|chelsea boot/.test(t))return 3;
 if(/t.?shirt|tee|hoodie|sweatshirt|jogger|running|gym|track|graphic tee|cargo short/.test(t))return 1;
 if(/polo|overshirt|chino|jeans?|denim|casual trouser|shorts|crew.?neck|jumper|sweater|cardigan|trainer|sneaker|bomber|shacket/.test(t))return 2;
 return 2;
}
function paletteScore(top,bottom){
 const a=colourFamily(top.colour),b=colourFamily(bottom.colour);
 let score=0,reason="";
 if(a==="unknown"||b==="unknown"){score+=0;reason="Colour details are incomplete, so compatibility is less certain."}
 else if(a===b){
   score-=3;reason="The top and trousers are very similar in colour; tonal dressing needs a deliberate difference in shade or texture.";
 }else{
   const pairs=[
    [["green","light-neutral"],4,"Olive and cream/white create clear, easy contrast."],
    [["green","blue"],3,"Muted green and blue make a balanced, understated combination."],
    [["green","grey"],3,"Green and grey keep the palette quiet and balanced."],
    [["green","warm-neutral"],2,"Earthy green and warm neutrals create a relaxed palette."],
    [["blue","light-neutral"],4,"Navy/blue with a light neutral gives clear contrast."],
    [["blue","warm-neutral"],3,"Blue and warm neutrals create a classic contrast."],
    [["blue","grey"],3,"Blue and grey create a restrained, cohesive palette."],
    [["warm-neutral","light-neutral"],2,"Warm neutral trousers work with a lighter top when the tones are distinct."],
    [["earth","light-neutral"],3,"Brown and cream/white make a warm, clean combination."],
    [["black","light-neutral"],3,"Black and a light neutral create clear contrast."],
    [["grey","light-neutral"],2,"Grey and a light neutral keep the outfit simple and balanced."],
    [["burgundy","grey"],2,"Burgundy and grey keep the accent grounded."]
   ];
   for(const [pair,val,why] of pairs){if(pair.includes(a)&&pair.includes(b)){score+=val;reason=why;break}}
   if(!reason){score-=1;reason="This colour pairing needs checking for contrast and undertone."}
 }
 // Avoid two saturated statement colours without a neutral bridge.
 if(a==="accent"&&b==="accent")score-=4;
 return {score,reason};
}
function inferDressCode(event,activity,style){
 const t=`${event||""} ${activity||""}`.toLowerCase();
 const formal=[
  [/\b(black tie|white tie|gala|awards ceremony|formal wedding|wedding guest|wedding reception|cocktail attire|business formal|suit and tie|court|ceremony|graduation ceremony)\b/,5],
  [/\b(formal|dress code: formal|evening dress|tuxedo|dinner jacket)\b/,4],
  [/\b(board meeting|client presentation|interview|important meeting|corporate event)\b/,2]
 ];
 const smart=[
  [/\b(smart casual|business casual|wine tasting|nice restaurant|fine dining|date night|dinner date|cocktails|evening out|theatre|show|birthday dinner|restaurant|brunch)\b/,3],
  [/\b(dinner|date|work|office|meeting|pub meal)\b/,1]
 ];
 const casual=[
  [/\b(pub|pub with friends|mates|friends|beer|drinks with friends|casual drinks|bar|laid.?back|relaxed|everyday|day.?to.?day|coffee|walk|park|sightseeing|travel|airport|weekend|shopping| BBQ|barbecue|game night)\b/,3],
  [/\b(casual|informal|off.?duty|low.?key)\b/,2],
  [/\b(gym|run|running|hike|workout|sport)\b/,4]
 ];
 const score=list=>list.reduce((n,[re,w])=>n+(re.test(t)?w:0),0);
 let f=score(formal),s=score(smart),c=score(casual);
 if(/\b(gym|run|running|hike|workout|sport)\b/.test(t))return "casual";
 if(f>=4&&f>=s&&f>=c)return "formal";
 if(/\b(smart casual|business casual)\b/.test(t))return "smart casual";
 if(/\b(casual|informal|laid.?back|relaxed|off.?duty)\b/.test(t)&&f<4)return "casual";
 if(/\b(pub|pub with friends|mates|friends|beer|drinks with friends|casual drinks|bar|laid.?back|relaxed|everyday|coffee|walk|weekend|shopping)\b/.test(t)&&f<4)return "casual";
 if(s>c||(/\b(dinner|date|restaurant|work|office|meeting|cocktails|theatre)\b/.test(t)&&c===0))return "smart casual";
 if(c>0)return "casual";
 if(f>0)return "formal";
 // Style direction can refine an otherwise ambiguous prompt, but never overrides a clear occasion.
 if(style==="smart")return "smart casual";
 if(style==="relaxed")return "casual";
 return "casual";
}
function pairCompatibility(top,bottom,event,activity,style,dressCode){
 const palette=paletteScore(top,bottom);
 let score=palette.score;
 const f1=garmentFormality(top),f2=garmentFormality(bottom);
 score-=Math.abs(f1-f2)*.8;
 const t=`${event} ${activity}`.toLowerCase();
 const topText=`${top.name} ${top.notes||""} ${top.style||""}`.toLowerCase();
 const bottomText=`${bottom.name} ${bottom.notes||""} ${bottom.style||""}`.toLowerCase();
 const tee=/\b(t.?shirt|tee|graphic tee|pocket tee)\b/.test(topText);
 const casualTop=/\b(tee|t.?shirt|sweatshirt|hoodie|casual knit|crew.?neck|jumper|sweater|polo|overshirt|flannel|camp.?collar|cuban shirt)\b/.test(topText);
 const dressShirt=/\b(oxford shirt|dress shirt|formal shirt|business shirt|smart shirt)\b/.test(topText)||(/\bshirt\b/.test(topText)&&f1>=3);
 const casualBottom=/\b(jeans?|denim|casual trouser|cargo|shorts|chinos?)\b/.test(bottomText);
 if(dressCode==="formal"){
  score+=(f1>=3?4:-5)+(f2>=3?4:-5);
  if(dressShirt)score+=1.5;
 }else if(dressCode==="smart casual"){
  score+=(f1>=2&&f1<=3?3:-2)+(f2>=2&&f2<=3?3:-2);
  if(dressShirt)score+=.8;
  if(/tuxedo|dinner jacket|suit trouser/.test(`${top.name} ${bottom.name}`.toLowerCase()))score-=4;
 }else{
  score+=(f1<=2?3.5:-3.5)+(f2<=2?2.5:-2.5);
  score+=(casualTop?2:0)+(tee?1:0)+(casualBottom?1.5:0);
  if(dressShirt)score-=3.5;
 }
 if(/gym|run|running|hike|workout|sport/.test(t))score+=(f1===1?3:-3)+(f2===1?3:-3);
 // A requested style is a gentle nudge, not a substitute for interpreting the occasion.
 if(style==="smart"&&dressCode!=="casual")score+=(f1>=2?0.7:0)+(f2>=2?0.7:0);
 if(style==="relaxed"&&dressCode!=="formal")score+=(f1<=2?1:0)+(f2<=2?1:0);
 score+=Math.min(1.2,trendScore(top)*.2+trendScore(bottom)*.2);
 return {...palette,score};
}
function recentOutfitIds(){
 try{return (JSON.parse(localStorage.getItem("wardrobe.saved")||"[]").slice(0,5)).flatMap(x=>x.ids||[])}
 catch(e){return []}
}
function usePenalty(x,recent){
 // A small rotation nudge, not a hard exclusion: every item remains eligible.
 const count=recent.filter(id=>id===x.id).length;
 return Math.min(2.4,count*.8);
}
function itemText(x){return `${x.name||""} ${x.notes||""} ${x.style||""}`.toLowerCase()}
function isCasualTop(x){return /t.?shirt|\\btee\\b|polo|sweatshirt|hoodie|crew.?neck|jumper|sweater|casual knit|overshirt|flannel|camp.?collar|cuban shirt/.test(itemText(x)) || x.style==="Casual" || x.style==="Sporty"}
function isFormalTop(x){return /tuxedo|dress shirt|formal shirt|business shirt|oxford shirt|evening shirt/.test(itemText(x)) || x.style==="Formal"}
function pairCompatibility(top,bottom,event,activity,style,dressCode,recent=[]){
 const palette=paletteScore(top,bottom);
 let score=palette.score;
 const f1=garmentFormality(top),f2=garmentFormality(bottom);
 score-=Math.abs(f1-f2)*.55;
 const topText=itemText(top),bottomText=itemText(bottom);
 const casualBottom=/jeans?|denim|casual trouser|cargo|shorts|chinos?/.test(bottomText);
 const tailoredBottom=/tailored|suit trouser|dress trouser/.test(bottomText);
 if(dressCode==="formal"){
  score+=(f1>=3?4:-4)+(f2>=3?4:-4);
 }else if(dressCode==="smart casual"){
  score+=(f1>=2&&f1<=3?2.8:-1.8)+(f2>=2&&f2<=3?2.8:-1.8);
  if(/tuxedo|dinner jacket|suit trouser/.test(topText+" "+bottomText))score-=3;
 }else{
  score+=(f1<=2?3.5:-4)+(f2<=2?2.8:-3);
  if(isCasualTop(top))score+=2.2;
  if(isFormalTop(top))score-=4.5;
  if(casualBottom)score+=1.3;
  if(tailoredBottom)score-=2.2;
 }
 // Use style labels consistently for all categories; avoid treating chinos as inherently dressy.
 if(style==="smart"&&dressCode!=="casual")score+=(f1>=2?0.5:0)+(f2>=2?0.5:0);
 if(style==="relaxed"&&dressCode!=="formal")score+=(f1<=2?0.8:0)+(f2<=2?0.8:0);
 score-=usePenalty(top,recent)+usePenalty(bottom,recent);
 // Trend is a subtle tie-breaker, never enough to outweigh occasion or compatibility.
 score+=Math.min(.45,trendScore(top)*.06+trendScore(bottom)*.06);
 return {...palette,score};
}
function chooseBestPair(tops,bottoms,event,activity,style,dressCode,recent=[]){
 const pairs=[];
 // Every eligible top is paired against every eligible bottom. No top-N pre-filter.
 for(const top of tops)for(const bottom of bottoms){
   const c=pairCompatibility(top,bottom,event,activity,style,dressCode,recent);
   pairs.push({top,bottom,...c});
 }
 if(!pairs.length)return {top:pickTrendAware(tops),bottom:pickTrendAware(bottoms),reason:"Not enough wardrobe options to compare combinations."};
 pairs.sort((a,b)=>b.score-a.score);
 const best=pairs[0];
 // Keep a broad, high-quality choice pool so repeated generations rotate through
 // genuinely good alternatives instead of the same two garments.
 const pool=pairs.filter(p=>p.score>=best.score-2.0);
 const ranked=pool.map(p=>({...p,rotation:Math.random()})).sort((a,b)=>(b.score+b.rotation*.55)-(a.score+a.rotation*.55));
 let chosen=ranked[0]||best;
 // Avoid duplicate colour families only when there is a similarly good alternative.
 if(chosen.top&&chosen.bottom&&colourFamily(chosen.top.colour)===colourFamily(chosen.bottom.colour)){
   const contrast=ranked.find(p=>colourFamily(p.top.colour)!==colourFamily(p.bottom.colour)&&p.score>=chosen.score-1.1);
   if(contrast)chosen=contrast;
 }
 return {...chosen,reason:chosen.reason};
}

function isBlazer(x){return /blazer|suit jacket|dinner jacket|tuxedo/i.test(`${x.name} ${x.notes||""}`)}
function isFormalActivity(event,activity,style){
 const t=`${event} ${activity}`.toLowerCase();
 return /\b(black tie|formal|wedding|gala|ceremony|award|cocktail attire|business formal|suit and tie)\b/.test(t);
}
function layerScore(x,formal,cold,weather){
 const t=`${x.name} ${x.notes||""}`.toLowerCase();
 let score=0;
 if(formal){if(isBlazer(x))score+=8;else if(/tailored|structured|coat|overcoat/i.test(t))score+=4}
 else {if(isBlazer(x))score-=12;if(/overshirt|knit|cardigan|jumper|hoodie|casual jacket|denim jacket|bomber|shacket/i.test(t))score+=5;if(/coat|parka|puffer|waterproof|shell/i.test(t))score+=cold||weather!=="dry"?5:1}
 score+=(Number(x.warmth)||0)* (cold?1.5:.35);
 if(weather==="rain"&&/waterproof|rain|shell|coat/i.test(t))score+=12;
 if(weather==="wind"&&/coat|jacket|shell|wind/i.test(t))score+=5;
 return score;
}
function choose(event,temp,cond,style,activity=""){
 const dressCode=inferDressCode(event,activity,style);
 const by=c=>items.filter(x=>x.category===c);
 const layers=by("Layers"),tops=by("Tops"),bottoms=by("Bottoms"),shoes=by("Shoes"),accessories=by("Accessories");
 const recent=recentOutfitIds();
 const pair=chooseBestPair(tops,bottoms,event,activity,style,dressCode,recent);
 let out=[pair.top,pair.bottom].filter(Boolean),formal=dressCode==="formal",cold=temp<=12;
 let reasons=[pair.reason];
 const target= dressCode==="formal"?3.5:dressCode==="smart casual"?2.7:1.7;
 const shoeScore=x=>{
   let s=3-Math.abs(garmentFormality(x)-target)*1.6;
   const c=colourFamily(x.colour),bottom=colourFamily(pair.bottom?.colour);
   if(["earth","warm-neutral","black","grey"].includes(c))s+=.45;
   if(c==="light-neutral"&&bottom!=="light-neutral")s+=.35;
   if(dressCode==="casual"&&garmentFormality(x)<=2)s+=1.5;
   if(dressCode==="casual"&&garmentFormality(x)>=3)s-=3;
   if(dressCode==="formal"&&garmentFormality(x)>=3)s+=2;
   return s-usePenalty(x,recent)+trendScore(x)*.04;
 };
 if(shoes.length){const ranked=[...shoes].sort((a,b)=>shoeScore(b)-shoeScore(a));out.push(ranked[0])}
 const needsLayer=cold||cond==="rain"||cond==="wind"||(/outdoors|outside|boat|coastal|open air|walk|hike/i.test(activity)&&temp<18)||formal;
 if(needsLayer&&layers.length){
   const layerScoreFor=x=>layerScore(x,formal,cold,cond)-usePenalty(x,recent)+(dressCode==="casual"&&isBlazer(x)?-10:0);
   const candidates=[...layers].filter(x=>formal||cold||!isBlazer(x)).sort((a,b)=>layerScoreFor(b)-layerScoreFor(a));
   const chosen=candidates[0];
   if(chosen&&(!isBlazer(chosen)||formal||cold)){out.push(chosen);reasons.push(`A ${chosen.name} is included for ${formal?"the formal setting":cold?"the colder temperature":cond==="rain"?"rain protection":cond==="wind"?"wind protection":"the outdoor activity"}.`)}
 }
 // Add a finishing touch only when it improves the outfit; consider every accessory.
 if(accessories.length){
   const accessoryScore=x=>{
     let s=0,t=itemText(x);
     if(dressCode==="formal"&&/tie|pocket square|belt|watch|leather/.test(t))s+=1.4;
     if(dressCode!=="formal"&&/cap|beanie|watch|belt|bracelet|sunglasses/.test(t))s+=1;
     if(out.some(y=>colourFamily(y.colour)===colourFamily(x.colour))&&colourFamily(x.colour)!=="unknown")s+=.4;
     return s-usePenalty(x,recent)+trendScore(x)*.04;
   };
   const bestAccessory=[...accessories].sort((a,b)=>accessoryScore(b)-accessoryScore(a))[0];
   if(bestAccessory&&accessoryScore(bestAccessory)>.2)out.push(bestAccessory);
 }
 if(dressCode!=="formal")out=out.filter(x=>!isBlazer(x));
 lastOutfitReason=`Inferred dress code: ${dressCode}. Compared ${tops.length} tops × ${bottoms.length} bottoms (${tops.length*bottoms.length} combinations), plus ${shoes.length} shoes, ${layers.length} layers and ${accessories.length} accessories. `+reasons.filter(Boolean).join(" ");
 return out;
}

const AI_CONFIG_KEY="wardrobe.ai.connection.v1";
const BUILT_IN_AI_CONFIG={url:"https://wardrobe-ai.jonathandring.workers.dev",token:"WT9w68ZJIzHWIqlRPjZBlA9cP1HeubxcZywXGD2gUXs"};
function readAIConfig(){
 try{
  const saved=JSON.parse(localStorage.getItem(AI_CONFIG_KEY)||"{}");
  return saved.url&&saved.token?saved:BUILT_IN_AI_CONFIG;
 }catch(e){return BUILT_IN_AI_CONFIG}
}
function refreshAIConfig(){
 const c=readAIConfig(),u=$("#aiWorkerUrl"),k=$("#aiAccessKey"),st=$("#aiConfigStatus");
 if(u)u.value=c.url||"";if(k)k.value=c.token||"";
 if(st)st.textContent=c.url&&c.token?"AI connection saved on this iPhone.":"Not connected yet. Your wardrobe photos are not uploaded; only clothing descriptions are sent.";
}
const saveAiConfigButton=$("#saveAiConfig");
if(saveAiConfigButton)saveAiConfigButton.onclick=()=>{
 const url=$("#aiWorkerUrl")?.value.trim().replace(/\/+$/,"")||"",token=$("#aiAccessKey")?.value.trim()||"";
 if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(url)){toast("Enter your HTTPS Cloudflare Worker URL");return}
 if(token.length<20){toast("Enter the private access key from your Worker");return}
 localStorage.setItem(AI_CONFIG_KEY,JSON.stringify({url,token}));
 refreshAIConfig();toast("AI connection saved on this device");
};
function makeMannequinPrompt(out,event,temp,cond,activity="",dressCode="casual"){
 const garments=out.map(x=>`${label[x.category]}: ${x.name}${x.colour?`, ${x.colour}`:""}${x.style?`, ${x.style}`:""}${x.notes?`, ${x.notes}`:""}`).join("; ");
 return `Create a premium photorealistic menswear fashion editorial image. Show ONE full-length, adult male mannequin with a smooth featureless matte ivory head, standing naturally, front three-quarter view, entire figure visible from head to shoes. Dress it in this exact outfit: ${garments}. Occasion: ${event}. Activity and setting: ${activity||"general everyday wear"}. Weather: ${temp}°C, ${cond}. Inferred dress code: ${dressCode}. Match this level of formality throughout the outfit. Do not add a blazer or formal tailoring unless the selected garments include it and the occasion is genuinely formal or cold-weather layering is appropriate. Reproduce the described garments, colours, silhouettes and layering as closely as possible. Clean warm-grey studio background, soft editorial lighting, realistic fabric drape, understated contemporary British menswear, natural proportions. No text, no watermark, no extra garments, no collage, no cropped feet.`;
}
async function generateAIMannequin(prompt){
 const cfg=readAIConfig();
 if(!cfg.url||!cfg.token)throw new Error("Connect the free AI preview in the settings above first.");
 const res=await fetch(cfg.url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+cfg.token},body:JSON.stringify({prompt})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(data.error||`AI service returned ${res.status}. Check the Worker setup and daily free allowance.`);
 if(!data.image)throw new Error("The AI service returned no image. Please try again.");
 return data.image;
}
refreshAIConfig();

$("#generate").onclick=async()=>{
 if(!items.length){toast("Add clothes first");go("wardrobe");return}
 let event=$("#event").value,temp=+$("#temp").value,cond=$("#condition").value,activity=$("#activity").value.trim(),style=$("#style").value,dressCode=inferDressCode(event,activity,style),out=choose(event,temp,cond,style,activity);
 let cues=trendNotes(out),prompt=makeMannequinPrompt(out,event,temp,cond,activity,dressCode);
 const pieces=out.map(x=>`<div class="outfit-piece"><div class="thumb">${x.photo?`<img src="${x.photo}" alt="${esc(x.name)}">`:"◇"}</div><div><small>${label[x.category]}</small><b>${esc(x.name)}</b><small>${esc(x.colour||x.style)}</small></div></div>`).join("");
 $("#outfit").classList.remove("hidden");
 $("#outfit").innerHTML=`<div class="eyebrow">YOUR LOOK · ${esc(event.toUpperCase())} · ${esc(dressCode.toUpperCase())}</div><h2>Considered, not complicated.</h2><p class="fine">${esc(lastOutfitReason)}</p><p class="muted">${temp}°C · ${cond==="rain"?"Rain-aware":cond==="cold"?"Cold-weather":cond==="hot"?"Warm-weather":"Weather-balanced"} · ${activity?esc(activity):"Everyday styling"}</p><div class="ai-preview"><div class="eyebrow">AI MANNEQUIN PREVIEW</div><div class="ai-preview-status" id="aiPreviewStatus">Preparing your outfit illustration…</div><img id="aiMannequinImage" alt="AI-generated mannequin wearing the selected outfit" hidden><p class="fine">Generated from clothing names, colours and details. It is an interpretation, not an exact digital fitting. Your clothing photos are not sent to the AI service.</p></div><div class="eyebrow">THE PIECES SELECTED</div>${pieces}${cues.length?`<div class="trend-note"><b>ON-TREND DETAIL</b><p>${esc(cues.join(" · "))}</p><small>Matched to current menswear trend coverage, while prioritising pieces you own.</small></div>`:""}<div class="actions"><button class="primary" id="again">Try another ↻</button><button class="secondary" id="saveLook">Save this look ♡</button></div>`;
 $("#again").onclick=()=>$("#generate").click();
 $("#saveLook").onclick=()=>{let saved=JSON.parse(localStorage.getItem("wardrobe.saved")||"[]");saved.unshift({event,ids:out.map(x=>x.id),date:new Date().toISOString(),mockupPrompt:prompt});localStorage.setItem("wardrobe.saved",JSON.stringify(saved));toast("Look saved")};
 const status=$("#aiPreviewStatus"),img=$("#aiMannequinImage");
 try{
  status.textContent="Sending the outfit description to the free AI model. This can take a few seconds…";
  const src=await generateAIMannequin(prompt.slice(0,2048));
  img.onload=()=>{img.hidden=false;status.textContent="Your AI outfit mockup is ready."};
  img.onerror=()=>{status.textContent="The AI returned an image that could not be displayed. Try again.";status.classList.add("failed")};
  img.src=src;
 }catch(e){status.textContent=e.message;status.classList.add("failed");}
};
$$(".occasions button").forEach(b=>b.onclick=()=>{go("stylist");$("#event").value=b.dataset.event});
const looks=[["Quiet confidence","Minimal","Tonal layers, clean lines and understated texture.","#283c35","#c9c2b1","#7c8a7c"],["The modern classic","Smart casual","A relaxed jacket, crisp base layer and tailored trouser.","#9a8068","#e6e0d3","#343d38"],["Off-duty uniform","Weekend","Comfortable proportions with one considered detail.","#536b60","#d4d0c3","#8b8b78"],["Soft structure","Minimal","Neutral shades with shape and subtle contrast.","#b4aa99","#eee9df","#5e655d"],["Dinner, sorted","Smart casual","Dark foundations, tactile fabric and a sharper shoe.","#242d2b","#a88b6e","#e2ded3"],["Weekend layers","Weekend","Easy knitwear and practical outerwear.","#7b806e","#b5a48d","#303c35"]];
function inspo(v="All"){let a=looks.filter(x=>v==="All"||x[1]===v);$("#inspo").innerHTML=a.map(x=>`<article class="inspo"><div class="inspo-art" style="--a:${x[3]};--b:${x[4]};--c:${x[5]}"><span>${x[1].toUpperCase()}</span></div><div class="inspo-copy"><b>${x[0]}</b><p>${x[2]}</p><button class="save" data-save="${looks.indexOf(x)}">♡ Save inspiration</button></div></article>`).join("");$$("[data-save]").forEach(b=>b.onclick=()=>{let s=JSON.parse(localStorage.getItem("wardrobe.inspo")||"[]");s.push(looks[+b.dataset.save]);localStorage.setItem("wardrobe.inspo",JSON.stringify(s));toast("Inspiration saved")})}
$$("[data-vibe]").forEach(b=>b.onclick=()=>{$$("[data-vibe]").forEach(x=>x.classList.toggle("active",x===b));inspo(b.dataset.vibe)});
$("#start").value=new Date().toISOString().slice(0,10);$("#end").value=new Date(Date.now()+3*86400000).toISOString().slice(0,10);$("#arrivalDate").value=$("#start").value;
$("#start").onchange=()=>{lastFlight=null;$("#arrivalDate").value=$("#start").value;$("#flightStatus").textContent="Flight date changed. Look up the flight again or enter the arrival details manually."};
$("#flightNumber").oninput=()=>{lastFlight=null;$("#flightStatus").textContent="Enter the flight number and date, then look up the scheduled landing time."};
function getDateInZone(iso,tz){let d=new Date(iso),parts=new Intl.DateTimeFormat("en-GB",{timeZone:tz||"UTC",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(d),v={};parts.forEach(p=>v[p.type]=p.value);return {date:`${v.year}-${v.month}-${v.day}`,time:`${v.hour}:${v.minute}`}}
function normaliseFlightPayload(payload){
  const candidates=[];
  const add=v=>{if(Array.isArray(v))candidates.push(...v);else if(v&&typeof v==="object"){if(Array.isArray(v.flights))candidates.push(...v.flights);else if(Array.isArray(v.results))candidates.push(...v.results);else if(v.flight_no||v.flightNo||v.arrival_utc||v.arrivalUtc)candidates.push(v)}};
  add(payload?.data);add(payload?.flights);add(payload?.results);add(payload);
  return candidates;
}
function flightMatches(f,no){
  const clean=v=>String(v||"").toUpperCase().replace(/[\s-]/g,"");
  return clean(f.flight_no||f.flightNo)===no || (Array.isArray(f.codeshares)&&f.codeshares.some(c=>clean(typeof c==="string"?c:(c.flight_no||c.flightNo||c.code))===no));
}
function formatArrival(f){
  const dest=f.destination||f.to||f.arrival?.airport||{};
  const tz=dest.tz||dest.timezone||f.destination_tz||f.arrival_timezone||((f.board==="arr"||f.station===dest.iata)?f.tz:null);
  const iso=f.arrival_utc||f.arrivalUtc||f.scheduled_arrival_utc||f.arrival?.utc||f.arrival?.scheduled_utc||f.times?.arrival_utc;
  if(iso){
    const instant=typeof iso==="number"?new Date(iso>1e12?iso:iso*1000):new Date(iso);
    if(!Number.isNaN(instant.getTime()))return getDateInZone(instant.toISOString(),tz||"UTC");
  }
  const local=f.arrival_time_local||f.arrival_local||f.arrival?.time_local||((f.board==="arr"||f.station===dest.iata)?f.time_local:null);
  const localDate=f.arrival_date_local||f.arrival?.date_local||((f.board==="arr"||f.station===dest.iata)?f.date:null);
  if(local&&/^\d{1,2}:\d{2}/.test(String(local))&&localDate){
    return {date:String(localDate).slice(0,10),time:String(local).slice(0,5),timezone:tz||"destination local time"};
  }
  const val=f.arrival_time||f.arrivalTime||f.scheduled_arrival;
  if(val){const d=new Date(val);if(!Number.isNaN(d.getTime()))return getDateInZone(d.toISOString(),tz||"UTC")}
  return null;
}
$("#lookupFlight").onclick=async()=>{
  const no=$("#flightNumber").value.trim().toUpperCase().replace(/[\s-]/g,""),date=$("#start").value;
  if(!no||!date){toast("Enter a flight number and flight date");return}
  $("#flightStatus").textContent="Looking up the scheduled flight…";
  $("#lookupFlight").disabled=true;
  lastFlight=null;
  try{
    // Navo24's documented public beta endpoint returns scheduled legs, including arrival_utc and the destination IANA time zone.
    const url=`https://flight.navo24.com/api/v1/flights/${encodeURIComponent(no)}?date=${encodeURIComponent(date)}`;
    const r=await fetch(url,{headers:{Accept:"application/json"}});
    let payload={};try{payload=await r.json()}catch(e){}
    if(!r.ok){
      const apiMessage=payload?.error?.message||payload?.message;
      if(r.status===429)throw Error("The free flight lookup limit has been reached. Try again later or enter the arrival manually.");
      if(r.status===404)throw Error("This flight/date isn't in the schedule database. Check the flight date or enter the arrival manually.");
      throw Error(apiMessage||`Flight lookup returned error ${r.status}. You can enter the arrival details manually.`);
    }
    const flights=normaliseFlightPayload(payload);
    const flight=flights.find(f=>flightMatches(f,no));
    if(!flight)throw Error("The schedule service didn't return this flight number. It may not cover this airline or date; enter the arrival manually.");
    const arrival=formatArrival(flight);
    if(!arrival)throw Error("The flight was found, but the service didn't provide a usable arrival timestamp or destination time zone. Enter the arrival manually.");
    lastFlight=flight;
    $("#arrivalDate").value=arrival.date;
    $("#arrivalTime").value=arrival.time;
    const dest=flight.destination||flight.to||{};
    const destName=dest.city||dest.name||dest.iata||"destination";
    if(dest.city||dest.name)$("#destination").value=dest.city||dest.name;
    const refreshed=flight.updated_at?` Schedule data refreshed ${new Date(flight.updated_at).toLocaleString()}.`:"";
    $("#flightStatus").textContent=`Scheduled arrival: ${arrival.date} at ${arrival.time} local time in ${destName}.${refreshed} Please verify with your airline; this is a timetable, not live tracking.`;
    toast("Scheduled local arrival added");
  }catch(err){
    $("#flightStatus").textContent=err.message||"Flight lookup failed. Enter arrival details manually.";
    toast("Flight lookup unavailable");
  }finally{$("#lookupFlight").disabled=false}
};
function tripItems(outfits,climate,acts){let get=c=>items.filter(x=>x.category===c).sort((a,b)=>$("#light").checked?b.warmth-a.warmth:a.warmth-b.warmth);let tops=Math.max(1,Math.ceil(outfits*.7)),bottoms=Math.max(1,Math.ceil(outfits*.5));return [...get("Tops").slice(0,Math.min(outfits,tops)),...get("Bottoms").slice(0,Math.min(outfits,bottoms)),...get("Layers").slice(0,climate==="hot"?1:climate==="cold"?3:2),...get("Shoes").slice(0,acts.includes("Exploring")?2:1),...get("Accessories").slice(0,2)]}
function dateDiff(a,b){return Math.max(0,Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000))}
$("#plan").onclick=async()=>{let dest=$("#destination").value.trim(),start=$("#start").value,end=$("#end").value,arrivalDate=$("#arrivalDate").value||start,arrivalTime=$("#arrivalTime").value;if(!dest||!start||!end){toast("Add destination and flight dates");return}if(end<arrivalDate){toast("Return date must be on or after your arrival date");return}let span=dateDiff(arrivalDate,end),lateArrival=arrivalTime&&arrivalTime>="17:00",outfits=Math.max(1,span+(lateArrival?0:1)),acts=$$("#activities input:checked").map(x=>x.value),climate=$("#climate").value,weather="Weather estimate unavailable";if(span>21){toast("Prototype supports trips up to 21 days");return}if(climate==="auto"){try{let g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dest)}&count=1&language=en&format=json`).then(r=>r.json());if(g.results?.length){let p=g.results[0],f=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&daily=temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`).then(r=>r.json());weather=`Forecast: ${Math.min(...f.daily.temperature_2m_min)}–${Math.max(...f.daily.temperature_2m_max)}°C`}}catch(e){weather="Live forecast unavailable; check conditions before packing"}}else weather=({hot:"Hot / humid selected",mild:"Mild conditions selected",cold:"Cold conditions selected",wet:"Wet / rainy selected"})[climate];let pack=tripItems(outfits,climate,acts),daysList=Array.from({length:span+1},(_,i)=>{let d=new Date(new Date(arrivalDate+"T12:00:00").getTime()+i*86400000);return d.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}),topItems=pack.filter(x=>x.category==="Tops"),bottomItems=pack.filter(x=>x.category==="Bottoms"),shoe=pack.find(x=>x.category==="Shoes");$("#tripResult").classList.remove("hidden");$("#tripResult").innerHTML=`<div class="eyebrow">YOUR TRAVEL EDIT</div><h2>${esc(dest)}</h2><p class="muted">${span+1} calendar day${span===0?"":"s"} at destination · ${outfits} outfit${outfits===1?"":"s"} estimated · ${weather}</p><div class="flight-summary"><b>FLIGHT ARRIVAL</b><strong>${arrivalDate}${arrivalTime?" · "+arrivalTime:" · time not confirmed"}</strong><small>${lastFlight?esc(lastFlight.flight_no||$("#flightNumber").value):"Manually entered / estimated"} · local destination time</small></div><h3>Daily outfit schedule</h3>${daysList.map((d,i)=>{let type=i===0?(lateArrival?"Late arrival · no separate daytime outfit":"Arrival day · daytime outfit"):i===span?"Departure day · travel outfit":"Full day · daytime outfit";let pieces=[topItems.length?topItems[i%topItems.length]:null,bottomItems.length?bottomItems[i%bottomItems.length]:null,shoe].filter(Boolean).map(x=>esc(x.name)).join(" · ");return `<div class="pack-day"><h4>${d}</h4><p>${type}</p><p>${pieces||"Add more wardrobe pieces to build complete looks."}</p></div>`}).join("")}<h3>Packing checklist · ${pack.length} pieces</h3><div class="pack-list">${pack.map(x=>`<label><input type="checkbox"> ${esc(x.name)}</label>`).join("")}</div>${!pack.length?"<p class='muted'>Add wardrobe pieces to create a packing list.</p>":""}<p class="fine">Outfit count assumes one daytime outfit on arrival if you land before 17:00, one for each full day, and a travel outfit on departure. You can adjust this estimate for your plans.</p>`};
$("#weatherOpen").onclick=()=>$("#weatherDialog").showModal();
$("#weatherForm").onsubmit=async e=>{e.preventDefault();let loc=$("#location").value.trim();$("#weatherDialog").close();$("#weatherText").textContent="Checking weather…";try{let g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`).then(r=>r.json());if(!g.results?.length)throw Error("Location not found");let p=g.results[0],w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,precipitation,wind_speed_10m&timezone=auto`).then(r=>r.json()),c=w.current;$("#weatherText").textContent=`${p.name} · ${Math.round(c.temperature_2m)}°C · ${c.precipitation>0?"Rain":c.wind_speed_10m>25?"Windy":"Dry"}`;$("#temp").value=Math.round(c.temperature_2m);$("#condition").value=c.precipitation>0?"rain":c.wind_speed_10m>25?"wind":"dry";localStorage.setItem("wardrobe.location",loc);toast("Weather updated")}catch(err){$("#weatherText").textContent="Weather unavailable — enter conditions manually";toast(err.message)}};
let loc=localStorage.getItem("wardrobe.location");if(loc){$("#location").value=loc;$("#weatherText").textContent=`Saved location: ${loc}`;}
initStorage();
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
