import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,calculate,validate,cents} from '../budget.js';
test('November includes the corrected overdraft repayment',()=>{const c=calculate(seed());assert.equal(c.income,274580);assert.equal(c.total,345100);assert.equal(c.balance,-70520);});
test('December includes pottery and increased Klarna',()=>{const c=calculate(seed('2026-12'));assert.equal(c.total,365724);assert.equal(c.balance,-91144);});
test('essentials precede flexible spending and money is never allocated twice',()=>{const b=seed();b.income=[{amount:90000}];const c=calculate(b);const rent=b.bills.find(r=>r.name==='Rent'),family=b.bills.find(r=>r.name==='Family spending');assert.equal(c.allocations[rent.id].allocated,77800);assert.equal(c.allocations[family.id].allocated,0);assert.equal(Object.values(c.allocations).reduce((s,a)=>s+a.allocated,0),90000);});
test('payments reduce remaining income without changing planned shortfall',()=>{const b=seed();b.bills[0].paid=77800;const c=calculate(b);assert.equal(c.allocations[b.bills[0].id].allocated,0);assert.equal(c.paid,77800);assert.equal(c.balance,-70520);assert.equal(Object.values(c.allocations).reduce((s,a)=>s+a.allocated,0),196780);});
test('explicit savings contribution reduces shortfall',()=>{const b=seed();b.savingsBalance=100000;b.savings=20000;assert.equal(calculate(b).balance,-50520);});
test('overspending is surfaced and no negative allocation occurs',()=>{const b=seed();b.bills[0].paid=300000;const c=calculate(b);assert.equal(c.overspent,25420);assert.equal(Object.values(c.allocations).reduce((s,a)=>s+a.allocated,0),0);});
test('backup validation rejects malformed money and priorities',()=>{const d={version:1,months:{'2026-11':seed()}};assert.equal(validate(d),d);d.months['2026-11'].bills[0].amount=-1;assert.throws(()=>validate(d));});
test('currency input rounds to pennies',()=>{assert.equal(cents('40.85'),4085);assert.equal(cents('-1'),0);});

import {forecast,quarters} from '../budget.js';
test('forecast carries recurring commitments and known quarterly art but excludes one-offs',()=>{const months={'2026-11':seed(),'2026-12':seed('2026-12')};const rows=forecast(months,'2027-01',4);assert.equal(rows[0].total,307424);assert.equal(rows[1].total,267424);assert.equal(rows[2].total,267424);assert.equal(rows[3].total,307424);assert.equal(rows[0].budget.savings,0);assert.ok(!rows[0].budget.bills.some(b=>b.name==='Pottery'||b.name==='Klarna'));});
test('quarter totals agree with constituent monthly balances',()=>{const rows=forecast({'2026-12':seed('2026-12')},'2027-01',3);const q=quarters(rows);assert.equal(q.length,1);assert.equal(q[0].key,'2027 Q1');assert.equal(q[0].balance,rows.reduce((s,r)=>s+r.balance,0));assert.equal(q[0].balance,-18532);});

import {includeOverdraft} from '../budget.js';
test('overdraft migration adds the repayment once without overwriting existing changes',()=>{const b=seed();b.bills=b.bills.filter(r=>r.name!=='Halifax overdraft');const state={version:1,months:{'2026-11':b}};includeOverdraft(state);const overdraft=b.bills.find(r=>r.name==='Halifax overdraft');assert.equal(overdraft.amount,43600);overdraft.amount=20000;includeOverdraft(state);assert.equal(b.bills.filter(r=>r.name==='Halifax overdraft').length,1);assert.equal(overdraft.amount,20000);});
test('overdraft affects November and its quarter once, not future monthly forecasts',()=>{const months={'2026-11':seed(),'2026-12':seed('2026-12')};const rows=forecast(months,'2026-11',3);assert.equal(rows[0].balance,-70520);assert.equal(rows[1].balance,-91144);assert.ok(!rows[2].budget.bills.some(r=>r.name==='Halifax overdraft'));assert.equal(quarters(rows)[0].balance,-161664);});
test('an overdraft paid from monthly income stays in the monthly cost',()=>{const b=seed();const r=b.bills.find(r=>r.name==='Halifax overdraft');r.paid=43600;assert.equal(calculate(b).balance,-70520);assert.equal(calculate(b).paid,43600);});
