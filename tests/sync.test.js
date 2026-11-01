import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword} from '../lock-core.js';
import {dataKey,encryptState,decryptState} from '../sync-core.js';
import {createHandler} from '../budget-api.js';
const salt='00112233445566778899aabbccddeeff',iterations=1000;
const lock={salt,iterations,hash:await hashPassword('pw',salt,iterations)};
function call(handler,method,{password='pw',body}={}){
 return new Promise(async resolve=>{
  const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){resolve({code:this.code,body:b});},end(){resolve({code:this.code});}};
  await handler({method,headers:{'x-mais-password':password},body},res);
 });
}
const memory=()=>{let record=null;return {read:async()=>record,write:async r=>{record=r;}};};
test('encrypted state round trips and wrong password cannot read it',async()=>{
 const key=await dataKey('pw',lock),state={version:1,months:{a:1}};
 const payload=await encryptState(state,key);
 assert.ok(!JSON.stringify(payload).includes('months'));
 assert.deepEqual(await decryptState(payload,key),state);
 await assert.rejects(decryptState(payload,await dataKey('other',lock)));
});
test('api rejects a wrong password and a disabled lock',async()=>{
 assert.equal((await call(createHandler(memory(),lock),'GET',{password:'nope'})).code,401);
 assert.equal((await call(createHandler(memory(),{}),'GET')).code,503);
});
test('api stores, returns and protects against stale writes',async()=>{
 const handler=createHandler(memory(),lock),payload={iv:'aa',ct:'bb'};
 assert.equal((await call(handler,'GET')).code,204);
 const first=await call(handler,'PUT',{body:{baseUpdatedAt:0,payload}});
 assert.equal(first.code,200);
 assert.deepEqual((await call(handler,'GET')).body.payload,payload);
 assert.equal((await call(handler,'PUT',{body:{baseUpdatedAt:0,payload}})).code,409);
 const second=await call(handler,'PUT',{body:{baseUpdatedAt:first.body.updatedAt,payload}});
 assert.equal(second.code,200);assert.ok(second.body.updatedAt>first.body.updatedAt);
 assert.equal((await call(handler,'PUT',{body:{baseUpdatedAt:second.body.updatedAt,payload:{iv:1}}})).code,400);
});
