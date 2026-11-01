const enc=new TextEncoder();
const hex=bytes=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
const unhex=text=>Uint8Array.from(text.match(/../g)||[],b=>parseInt(b,16));
export async function hashPassword(password,salt,iterations){
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(salt),iterations},key,256));
}
export const isLocked=config=>Boolean(config&&config.hash&&config.salt&&config.iterations);
export async function verifyPassword(password,config){
 if(!isLocked(config))return true;
 return await hashPassword(password,config.salt,config.iterations)===config.hash;
}
