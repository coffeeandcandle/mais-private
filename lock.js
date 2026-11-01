import config from './lock-config.js';
import {isLocked,verifyPassword} from './lock-core.js';
const KEY='mais-unlocked',$=s=>document.querySelector(s);
function start(){
 document.body.classList.remove('locked');$('#lock-screen')?.remove();
 if(isLocked(config)){const button=$('#lock');button.hidden=false;button.onclick=()=>{try{sessionStorage.removeItem(KEY);}catch{}location.reload();};}
 return import('./app.js');
}
function unlocked(){try{return sessionStorage.getItem(KEY)==='1';}catch{return false;}}
function ask(){
 const screen=document.createElement('section');screen.id='lock-screen';
 screen.innerHTML=`<form id="lock-form"><a class="brand" href="/">mais<span>your money, with a plan</span></a><h1>Welcome back.</h1><p>Enter your password to open your budget.</p><label>Password<input id="lock-password" type="password" autocomplete="current-password" required autofocus></label><p id="lock-error" role="alert"></p><button class="primary" type="submit">Unlock</button></form>`;
 document.body.append(screen);
 let failures=0;
 $('#lock-form').onsubmit=async event=>{
  event.preventDefault();const input=$('#lock-password'),error=$('#lock-error'),button=$('#lock-form button');
  button.disabled=true;error.textContent='';
  if(await verifyPassword(input.value,config)){try{sessionStorage.setItem(KEY,'1');}catch{}start();return;}
  failures++;input.value='';error.textContent='That password isn’t right. Please try again.';
  setTimeout(()=>{button.disabled=false;input.focus();},Math.min(failures*700,5000));
 };
}
if(!isLocked(config)||unlocked())start();else ask();
