const enc=new TextEncoder(),dec=new TextDecoder();
const b64=bytes=>{let text='';for(const b of bytes)text+=String.fromCharCode(b);return btoa(text);};
const unb64=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
export async function dataKey(password,config){
 const base=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(config.salt+':data'),iterations:config.iterations},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptState(state,key){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(state)));
 return {iv:b64(iv),ct:b64(new Uint8Array(ct))};
}
export async function decryptState(payload,key){
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(payload.iv)},key,unb64(payload.ct));
 return JSON.parse(dec.decode(plain));
}
