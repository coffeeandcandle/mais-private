import config from './lock-config.js';
import {isLocked,verifyPassword} from './lock-core.js';
const MAX_CHARS=1000000,pause=ms=>new Promise(r=>setTimeout(r,ms));
const valid=p=>p&&typeof p.iv==='string'&&typeof p.ct==='string'&&p.iv.length<64&&p.ct.length<MAX_CHARS;
export function createHandler(store,lock=config){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!isLocked(lock))return res.status(503).json({error:'The password lock is switched off, so cloud saving is disabled.'});
  const password=req.headers['x-mais-password'];
  if(typeof password!=='string'||password.length>200||!(await verifyPassword(password,lock))){await pause(800);return res.status(401).json({error:'unauthorized'});}
  try{
   if(req.method==='GET'){const current=await store.read();return current?res.status(200).json(current):res.status(204).end();}
   if(req.method==='PUT'){
    const {baseUpdatedAt=0,payload}=req.body||{};
    if(!valid(payload))return res.status(400).json({error:'Invalid payload'});
    const current=await store.read();
    if(current&&current.updatedAt!==baseUpdatedAt)return res.status(409).json({updatedAt:current.updatedAt});
    const updatedAt=Math.max(Date.now(),(current?.updatedAt||0)+1);
    await store.write({updatedAt,payload});
    return res.status(200).json({updatedAt});
   }
   res.setHeader('Allow','GET, PUT');return res.status(405).json({error:'Method not allowed'});
  }catch(error){console.error(error);return res.status(500).json({error:'storage'});}
 };
}
