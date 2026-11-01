import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,isLocked} from '../lock-core.js';
const salt='00112233445566778899aabbccddeeff',iterations=1000;
test('password lock accepts only the right password',async()=>{
 const config={salt,iterations,hash:await hashPassword('correct horse',salt,iterations)};
 assert.equal(isLocked(config),true);
 assert.equal(await verifyPassword('correct horse',config),true);
 assert.equal(await verifyPassword('wrong',config),false);
 assert.equal(await verifyPassword('',config),false);
});
test('no configured hash means no lock',async()=>{
 assert.equal(isLocked({}),false);
 assert.equal(await verifyPassword('anything',{}),true);
});
test('hash does not contain the password and depends on the salt',async()=>{
 const a=await hashPassword('secret',salt,iterations),b=await hashPassword('secret','ffeeddccbbaa99887766554433221100',iterations);
 assert.notEqual(a,b);assert.ok(!a.includes('secret'));
});
