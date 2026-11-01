import config from './lock-config.js';
import {isLocked} from './lock-core.js';
import {dataKey,encryptState,decryptState} from './sync-core.js';
const PASSWORD='mais-key',AT='mais-synced-at',DIRTY='mais-dirty';
const store={get:k=>{try{return localStorage.getItem(k);}catch{return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch{}}};
let key,timer,chain=Promise.resolve();
const password=()=>{try{return sessionStorage.getItem(PASSWORD);}catch{return null;}};
const syncedAt=()=>Number(store.get(AT))||0,isDirty=()=>store.get(DIRTY)==='1';
export const enabled=()=>isLocked(config)&&Boolean(password());
async function cryptoKey(){return key??=await dataKey(password(),config);}
function request(method,body){return fetch('/api/budget',{method,headers:{'x-mais-password':password(),'content-type':'application/json'},body});}
async function fetchRemote(){
 try{
  const res=await request('GET');
  if(res.status===204)return {data:null};
  if(res.status===401)return {error:'unauthorized'};
  if(!res.ok)return {error:'offline'};
  const record=await res.json();
  return {data:{updatedAt:record.updatedAt,state:await decryptState(record.payload,await cryptoKey())}};
 }catch{return {error:'offline'};}
}
async function push(getState,report){
 try{
  const payload=await encryptState(getState(),await cryptoKey());
  const res=await request('PUT',JSON.stringify({baseUpdatedAt:syncedAt(),payload}));
  if(res.ok){store.set(AT,String((await res.json()).updatedAt));store.set(DIRTY,'0');report('synced');return;}
  if(res.status===409){const remote=await fetchRemote();if(remote.data){store.set(AT,String(remote.data.updatedAt));store.set(DIRTY,'0');report('conflict',remote.data.state);return;}}
  report(res.status===401?'unauthorized':'offline');
 }catch{report('offline');}
}
export function save(getState,report){
 if(!enabled())return;
 store.set(DIRTY,'1');clearTimeout(timer);
 timer=setTimeout(()=>{chain=chain.then(()=>push(getState,report));},600);
}
export function retry(getState,report){if(enabled()&&isDirty())chain=chain.then(()=>push(getState,report));}
export async function start(hadLocal,getState,report){
 if(!enabled())return {};
 const remote=await fetchRemote();
 if(remote.error)return {note:remote.error};
 const at=syncedAt(),dirty=isDirty()||(hadLocal&&at===0);
 if(!remote.data){if(hadLocal){store.set(DIRTY,'1');retry(getState,report);}return {};}
 const latest=remote.data.updatedAt;
 if(latest===at&&!dirty)return {};
 if(dirty&&(latest===at||!confirm('This device has changes that were not saved online, but a newer budget exists online. Press OK to use the online budget, or Cancel to keep this device’s changes and replace the online one.'))){
  store.set(AT,String(latest));store.set(DIRTY,'1');retry(getState,report);return {};
 }
 store.set(AT,String(latest));store.set(DIRTY,'0');return {state:remote.data.state};
}
export async function refresh(){
 if(!enabled()||isDirty())return null;
 const remote=await fetchRemote();
 if(!remote.data||remote.data.updatedAt===syncedAt())return null;
 store.set(AT,String(remote.data.updatedAt));return remote.data.state;
}
