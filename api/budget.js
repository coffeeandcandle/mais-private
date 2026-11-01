import {get,put} from '@vercel/blob';
import {createHandler} from '../budget-api.js';
const PATH='mais/budget.json';
export default createHandler({
 async read(){const result=await get(PATH,{access:'private',useCache:false});if(!result||result.statusCode!==200)return null;return JSON.parse(await new Response(result.stream).text());},
 async write(record){await put(PATH,JSON.stringify(record),{access:'private',allowOverwrite:true,addRandomSuffix:false,contentType:'application/json'});}
});
