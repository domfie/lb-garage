import './style.css';
import { vehicles } from './vehicles.js';
import { Garage } from './garage.js';
const $=selector=>document.querySelector(selector);
const BASE=import.meta.env.BASE_URL;
await document.fonts.load('700 16px Poppins');
let selected=0,filter='ALLE',garage;
const loadStatus=$('#loadStatus');
function status(message,failed=false){loadStatus.classList.toggle('done',!message);loadStatus.classList.toggle('failed',failed);loadStatus.replaceChildren();if(message){const spin=document.createElement('span');spin.className='spinner';loadStatus.append(spin,document.createTextNode(message));}}
try{garage=new Garage($('#stage'),status);}catch(error){console.error(error);$('#webglError').hidden=false;loadStatus.classList.add('done');}
$('#reload').addEventListener('click',()=>location.reload());

const silhouette=kind=>{
  const d=kind==='safety'||kind==='event'?'M7 29V9Q7 5 12 5H64L76 15L83 26H91V33H7Z M64 9V21H77L70 10Z':kind==='suv'?'M5 29L10 19L21 16L31 7H66L79 20L92 24V33H5Z M30 11L24 20H74L64 11Z':kind==='cabrio'?'M5 29L11 22L25 20L34 13L38 14L35 21H68L76 23L93 27V33H5Z':kind==='wagon'?'M5 29L11 22L24 18L35 9H71L81 22L93 26V33H5Z M36 12L29 21H76L69 12Z':'M5 29L10 23L23 20L35 10H62L77 22L90 26V33H5Z M36 13L29 22H72L61 13Z';
  return `<svg viewBox="0 0 100 42" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="${d}"/><circle cx="23" cy="32" r="7" fill="#10160e"/><circle cx="23" cy="32" r="3"/><circle cx="76" cy="32" r="7" fill="#10160e"/><circle cx="76" cy="32" r="3"/></svg>`;
};
function visibleVehicles(){return vehicles.filter(c=>filter==='ALLE'||c.company===filter);}
function renderFleet(){
  const fleet=$('#fleet');fleet.replaceChildren();
  for(const c of visibleVehicles()){
    const button=document.createElement('button');button.className=`tile ${vehicles[selected]===c?'active':''}`;button.dataset.id=c.id;button.setAttribute('aria-pressed',String(vehicles[selected]===c));button.setAttribute('aria-label',`${c.short}, LB ${c.company}`);
    button.innerHTML=`<span class="tile-top"><span>0${vehicles.indexOf(c)+1} / LB ${c.company}</span><span>${vehicles[selected]===c?'●':'＋'}</span></span><b class="tile-name">${c.short}</b><small>${c.trim}</small>${silhouette(c.kind)}`;
    button.addEventListener('click',()=>selectVehicle(vehicles.indexOf(c)));fleet.append(button);
  }
}
function renderFilters(){
  $('#filters').replaceChildren();
  for(const f of ['ALLE','SYSTEMS','ASSET','GRUPPE']){
    const b=document.createElement('button');b.textContent=f==='ALLE'?'ALLE':`LB ${f}`;b.classList.toggle('active',filter===f);b.setAttribute('aria-pressed',String(filter===f));
    b.addEventListener('click',()=>{filter=f;renderFilters();if(!visibleVehicles().includes(vehicles[selected]))selectVehicle(vehicles.indexOf(visibleVehicles()[0]));else renderFleet();});$('#filters').append(b);
  }
}
function setViewUI(mode){for(const m of ['Orbit','Front','Side','Detail']){const active=m.toLowerCase()===mode;$('#view'+m).classList.toggle('active',active);$('#view'+m).setAttribute('aria-pressed',String(active));}}
async function selectVehicle(i){
  selected=(i+vehicles.length)%vehicles.length;const c=vehicles[selected];
  $('#make').textContent=c.make;$('#modelName').replaceChildren();const code=document.createElement('span');code.className='model-code';code.textContent=c.name;const trim=document.createElement('span');trim.className='model-trim';trim.textContent=c.trim;$('#modelName').append(code,trim);const emblem=$('#modelEmblem');emblem.src=`${BASE}assets/badges/${c.kind==='safety'||c.kind==='event'?'sprinter':c.id}.svg`;emblem.dataset.model=c.id;for(const animation of emblem.getAnimations())animation.cancel();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)emblem.animate([{opacity:0,transform:'translateX(-12px)'},{opacity:1,transform:'translateX(0)'}],{duration:420,easing:'ease-out'});
  $('#category').textContent=c.category;$('#description').textContent=c.description;$('#company').textContent=c.company;$('#bodyType').textContent=c.body;$('#bay').textContent=String(selected+1).padStart(2,'0');$('#carNumber').textContent=`0${selected+1} / 06`;
  $('#counter').innerHTML=`0${selected+1} <i>/ 06</i>`;$('#bookingTitle').textContent=c.short;renderFleet();setViewUI('orbit');renderRecords();
  if(innerWidth<701){const tile=$(`.tile[data-id="${c.id}"]`);if(tile){const fleet=$('#fleet');fleet.scrollTo({left:tile.offsetLeft-fleet.clientWidth/2+tile.clientWidth/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
  if(garage)await garage.load(c);
}
function step(direction){const visible=visibleVehicles(),current=visible.indexOf(vehicles[selected]);selectVehicle(vehicles.indexOf(visible[(current+direction+visible.length)%visible.length]));}
$('#prev').addEventListener('click',()=>step(-1));$('#next').addEventListener('click',()=>step(1));
for(const mode of ['Orbit','Front','Side','Detail'])$('#view'+mode).addEventListener('click',()=>{garage?.preset(mode.toLowerCase());setViewUI(mode.toLowerCase());});
addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,dialog')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='ArrowRight'){e.preventDefault();step(1);}});

// Local reservations are retained from the earlier version of this garage.
const STORAGE='lb-garage-bookings';let bookings=[],storageAvailable=true,showAll=false;
try{const data=JSON.parse(localStorage.getItem(STORAGE)||'[]');if(Array.isArray(data))bookings=data.filter(b=>b&&typeof b.id==='string'&&typeof b.driver==='string'&&vehicles.some(c=>c.id===b.car)&&Number.isFinite(Date.parse(b.start))&&Number.isFinite(Date.parse(b.end)));}catch{storageAvailable=false;}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(bookings));return true;}catch{storageAvailable=false;return false;}}
const localDate=ms=>{const d=new Date(ms);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;};
function openBookings(all=false){showAll=all;$('#bookingMessage').textContent=storageAvailable?'':'Der Browserspeicher ist nicht verfügbar. Neue Buchungen können nicht dauerhaft gespeichert werden.';$('#start').min=localDate(Date.now());$('#start').value=localDate(Date.now()+3600000);$('#end').value=localDate(Date.now()+7200000);$('#end').min=$('#start').value;renderRecords();$('#bookingDialog').showModal();}
$('#reserve').addEventListener('click',()=>openBookings());$('#bookings').addEventListener('click',()=>openBookings(true));
$('#start').addEventListener('input',()=>{$('#end').min=$('#start').value;});
function renderRecords(){
  $('#bookingCount').textContent=String(bookings.filter(b=>Date.parse(b.end)>Date.now()).length);
  $('#recordsLabel').textContent=showAll?'· alle Fahrzeuge':`· ${vehicles[selected].short}`;
  const list=bookings.filter(b=>showAll||b.car===vehicles[selected].id).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)),records=$('#records');records.replaceChildren();
  if(!list.length){const p=document.createElement('p');p.textContent='Noch keine Reservierungen. Die nächste Fahrt wartet.';records.append(p);return;}
  for(const b of list){const row=document.createElement('div');row.className='record';const remove=document.createElement('button');remove.type='button';remove.textContent='Entfernen';remove.setAttribute('aria-label',`Reservierung von ${b.driver} entfernen`);remove.onclick=()=>{const old=bookings;bookings=bookings.filter(x=>x.id!==b.id);if(!save()){bookings=old;$('#bookingMessage').textContent='Änderung konnte nicht gespeichert werden.';}renderRecords();};const name=document.createElement('b');name.textContent=b.driver;const small=document.createElement('small');small.textContent=vehicles.find(c=>c.id===b.car)?.short;const time=document.createElement('div');time.textContent=`${new Date(b.start).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'})} – ${new Date(b.end).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'})}`;row.append(remove,name,small,time);records.append(row);}
}
$('#bookingForm').addEventListener('submit',e=>{
  e.preventDefault();const driver=$('#driver').value.trim(),start=$('#start').value,end=$('#end').value,startMs=Date.parse(start),endMs=Date.parse(end),message=$('#bookingMessage');
  if(!driver||!Number.isFinite(startMs)||!Number.isFinite(endMs)||startMs<=Date.now()||startMs>=endMs){message.textContent='Bitte einen Namen und einen gültigen Zeitraum in der Zukunft eingeben.';return;}
  if(bookings.some(b=>b.car===vehicles[selected].id&&startMs<Date.parse(b.end)&&endMs>Date.parse(b.start))){message.textContent='Dieses Fahrzeug ist im gewählten Zeitraum bereits reserviert.';return;}
  const booking={id:crypto.randomUUID(),car:vehicles[selected].id,driver,start,end};bookings.push(booking);
  if(!save()){bookings.pop();message.textContent='Reservierung konnte nicht gespeichert werden. Bitte Browserspeicher freigeben.';return;}
  renderRecords();message.textContent='Reservierung in diesem Browser gespeichert.';
});
for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}

// Audio remains user-initiated, so it works with mobile autoplay policies.
const audio=$('#garageMusic'),toggle=$('#musicToggle'),volume=$('#musicVolume');let previousVolume=.45;
audio.src=`${BASE}assets/audio/lb-i-do.mp3`;audio.volume=.45;
function audioUI(){const playing=!audio.paused;document.body.classList.toggle('playing',playing);toggle.textContent=playing?'Ⅱ':'▶';toggle.setAttribute('aria-label',playing?'Musik pausieren':'Musik abspielen');toggle.setAttribute('aria-pressed',String(playing));$('#mute').setAttribute('aria-label',audio.muted?'Stummschaltung aufheben':'Musik stummschalten');$('#mute').textContent=audio.muted||audio.volume===0?'♩':'♫';}
toggle.addEventListener('click',async()=>{if(audio.paused){try{await audio.play();$('#audioError').textContent='';}catch(error){$('#audioError').textContent='Musik konnte nicht starten. Bitte erneut auf Play tippen.';console.error(error);}}else audio.pause();});
for(const event of ['play','pause','volumechange'])audio.addEventListener(event,audioUI);
volume.addEventListener('input',()=>{audio.volume=Number(volume.value);audio.muted=false;if(audio.volume>0)previousVolume=audio.volume;});
$('#mute').addEventListener('click',()=>{audio.muted=!audio.muted;if(!audio.muted&&audio.volume===0){audio.volume=previousVolume;volume.value=String(previousVolume);}});
const time=seconds=>Number.isFinite(seconds)?`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`:'–:––';
audio.addEventListener('loadedmetadata',()=>{$('#trackDuration').textContent=time(audio.duration);});
audio.addEventListener('timeupdate',()=>{$('#trackTime').textContent=time(audio.currentTime);if(Number.isFinite(audio.duration))$('#seek').value=String(audio.currentTime/audio.duration*100);});
$('#seek').addEventListener('input',()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number($('#seek').value)/100*audio.duration;});
audio.addEventListener('error',()=>{$('#audioError').textContent='Soundtrack konnte nicht geladen werden. Bitte Verbindung prüfen.';});
$('#modelCredits').innerHTML=`<p class="source-note">Alle Fahrzeuge sind fest eingebundene 3D-Modelle. Kein Import und kein Sketchfab-Konto erforderlich.</p><h3>LB Corporate Design</h3><p>Offizielles Rautensignet und Poppins. Navy, Blau, Koralle und Signalgelb nach der <a href="https://www.lb-firmengruppe.de/" target="_blank" rel="noopener">LB Firmengruppe</a>. Markenrechte verbleiben bei der Firmengruppe; Poppins: SIL OFL.</p><h3>Audi A1 · A3 · RS6</h3><p>3D-Modelle: <strong>Mona x Supercars</strong> (Car2022 / früher GT Cars: Hyperspeed). <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Für diese Garage normalisiert, reduziert und lackiert. RS6 als eigener Cabrio-Umbau mit Felgenschäden.</p><h3>Audi Q7</h3><p><strong>razor24</strong>, aufbereitet von <strong>Dogan Ulus</strong> / OpenX Assets. CC BY 4.0 und MPL 2.0.</p><h3>Mercedes-Benz Sprinter</h3><p><strong>Max (Max-7215)</strong>, aufbereitet von <strong>Dogan Ulus</strong> / OpenX Assets. CC BY 4.0 und MPL 2.0. Zwei eigene LB-Varianten mit Beschriftungen und Dachaufbauten.</p>`;
$('#creditsButton').addEventListener('click',()=>$('#creditsDialog').showModal());
renderFilters();selectVehicle(0);
// Optional, visible integration audit for repeatable QA in a real WebGL browser.
if(new URLSearchParams(location.search).has('verify'))import('./verify.js').then(({verify})=>verify({garage,vehicles,selectVehicle,audio}));
