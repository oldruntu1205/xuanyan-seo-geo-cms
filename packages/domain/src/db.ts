import pg from 'pg';
import {AsyncLocalStorage} from 'node:async_hooks';
import type { PoolClient, QueryResultRow } from 'pg';
const globalDb = globalThis as unknown as { sunsPool?: pg.Pool };
export const pool = globalDb.sunsPool ??= new pg.Pool({connectionString:process.env.DATABASE_URL,max:10,statement_timeout:30000,options:'-c timezone=UTC'});
const scope=new AsyncLocalStorage<PoolClient>();
export async function query<T extends QueryResultRow = any>(sql:string,params:unknown[]=[]) {return (await (scope.getStore()||pool).query<T>(sql,params)).rows;}
export async function transaction<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T> {const c=await pool.connect();try{await c.query('BEGIN');const result=await scope.run(c,()=>fn(c));await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
export const identifier=(value:string)=>'"'+value.replaceAll('"','""')+'"';
