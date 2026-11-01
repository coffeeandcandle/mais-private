export const money = n => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n/100);
export const cents = v => Math.max(0,Math.round(Number(v)*100)||0);
const household=[['Rent',778,1],['Sky',50,3],['Halifax account fee',19,3],['EE',61,2],['Water',40.85,1],['Amazon Prime',8.99,3],['Microsoft',8.49,3],['Phone insurance',7.99,3],['ChatGPT',20,3],['Council tax arrears',20,2],['Gas and electricity',150,1],['Learning People',80,2]];
export function seed(month='2026-11') {
 const dec=month==='2026-12';
 const rows=[...household.map(x=>[...x,'Household']),...[["King’s InterHigh",467,2],['Tutoring',240,2],['Boxing',40,2],['Swimming',82.92,2]].map(x=>[...x,'Education']),['Groceries',400,1,'Everyday'],['Family spending',200,4,'Everyday'],['Klarna',dec?493:212,3,'Repayments'],['Next account',60,3,'Repayments'],['Credit card (estimate)',30,3,'Repayments'],...(dec?[['Pottery',400,3,'Education']]:[['Essential subscription order',38.76,2,'Everyday']])];
 if(month==='2026-11')rows.push(['Halifax overdraft',436,3,'Repayments']);
 if(month==='2027-01')rows.push(['Art club',400,2,'Education']);
 return {income:[{id:'uc',name:'Universal Credit',amount:217800},{id:'maintenance',name:'Child maintenance',amount:38800},{id:'benefit',name:'Child Benefit',amount:17980}],savings:0,savingsBalance:0,notes:'',bills:rows.map((r,i)=>({id:crypto.randomUUID(),name:r[0],amount:cents(r[1]),priority:r[2],category:r[3],paid:0,due:'',frequency:['Halifax overdraft','Klarna','Next account','Credit card (estimate)','Essential subscription order','Pottery'].includes(r[0])?'once':r[0]==='Art club'?'quarterly':'monthly'}))};
}
export function calculate(budget){
 const income=budget.income.reduce((s,r)=>s+r.amount,0), total=budget.bills.reduce((s,r)=>s+r.amount,0),paid=budget.bills.reduce((s,r)=>s+r.paid,0);
 let available=Math.max(0,income+budget.savings-paid);
 const allocations={};
 [...budget.bills].sort((a,b)=>a.priority-b.priority||(a.due||'99').localeCompare(b.due||'99')).forEach(b=>{const needed=Math.max(0,b.amount-b.paid),allocated=Math.min(available,needed);available-=allocated;allocations[b.id]={allocated,gap:needed-allocated};});
 return {income,total,paid,available,allocations,balance:income+budget.savings-total,overspent:Math.max(0,paid-income-budget.savings)};
}
export function validate(data){
 if(!data||data.version!==1||!data.months||typeof data.months!=='object'||Array.isArray(data.months)||Object.keys(data.months).length===0)throw Error('This is not a Mais budget backup.');
 const amount=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000000;
 for(const [month,b] of Object.entries(data.months)){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!Array.isArray(b.income)||!Array.isArray(b.bills)||!amount(b.savings)||!amount(b.savingsBalance)||b.savings>b.savingsBalance||typeof b.notes!=='string')throw Error('Invalid budget data.');
 const ids=new Set();
 for(const r of [...b.income,...b.bills]){if(typeof r.id!=='string'||ids.has(r.id)||typeof r.name!=='string'||!amount(r.amount))throw Error('Invalid budget entry.');ids.add(r.id);}
 for(const b2 of b.bills)if(!amount(b2.paid)||![1,2,3,4].includes(b2.priority)||typeof b2.category!=='string'||typeof b2.due!=='string'||(b2.due&&!/^\d{4}-\d{2}-\d{2}$/.test(b2.due)))throw Error('Invalid payment data.');
 }return data;
}

export function shiftMonth(month,offset){const [y,m]=month.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+offset,1));return d.toISOString().slice(0,7);}
export function forecast(months,start,count=12){
 return Array.from({length:count},(_,i)=>{
 const month=shiftMonth(start,i);
 if(months[month])return {month,budget:months[month],...calculate(months[month]),saved:true};
 const previous=Object.keys(months).filter(m=>m<month).sort().at(-1)||Object.keys(months).sort()[0];
 const source=months[previous];
 const bills=source.bills.filter(b=>{const frequency=b.frequency||(['Halifax overdraft','Klarna','Next account','Credit card (estimate)','Essential subscription order','Pottery'].includes(b.name)?'once':'monthly');if(frequency==='once')return false;if(frequency==='quarterly'){const [y,m]=month.split('-').map(Number),[sy,sm]=(b.due?.slice(0,7)||previous).split('-').map(Number);return ((y-sy)*12+m-sm)%3===0;}return true;}).map(b=>({...b,paid:0,due:''}));
 // Confirmed £400 art club starts January 2027 and recurs quarterly.
 if(month>='2027-01'&&['01','04','07','10'].includes(month.slice(5))&&!bills.some(b=>b.name==='Art club'))bills.push({id:'art-'+month,name:'Art club',amount:40000,paid:0,priority:2,category:'Education',due:'',frequency:'quarterly'});
 const budget={...source,income:source.income.map(r=>({...r})),bills,savings:0,notes:''};
 return {month,budget,...calculate(budget),saved:false};
 });
}
export function quarters(rows){const result=[];for(const r of rows){const key=r.month.slice(0,4)+' Q'+Math.ceil(Number(r.month.slice(5))/3);let q=result.find(q=>q.key===key);if(!q){q={key,income:0,total:0,balance:0,months:[]};result.push(q);}q.income+=r.income+r.budget.savings;q.total+=r.total;q.balance+=r.balance;q.months.push(r.month);}return result;}

export function includeOverdraft(state){
 if(state.overdraftRevision===1)return state;
 const november=state.months['2026-11'];
 if(november&&!november.bills.some(b=>b.name.toLowerCase().includes('overdraft')))november.bills.push({id:crypto.randomUUID(),name:'Halifax overdraft',amount:43600,paid:0,priority:3,category:'Repayments',due:'',frequency:'once'});
 state.overdraftRevision=1;
 return state;
}
