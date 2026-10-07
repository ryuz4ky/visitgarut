import 'server-only'
import { createHmac,randomBytes,scryptSync,timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from './db'
function secret(){if(!process.env.SESSION_SECRET)throw new Error('SESSION_SECRET belum diatur');return process.env.SESSION_SECRET}
export function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`}
export function verifyPassword(password:string,hash:string){try{const [salt,value]=hash.split(':');const expected=Buffer.from(value,'hex');const actual=scryptSync(password,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual)}catch{return false}}
export function tokenMatches(a:string,b:string){const aa=Buffer.from(a);const bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb)}
export async function isAdmin(){const value=(await cookies()).get('vg_session')?.value;if(!value)return false;const [expires,signature]=value.split('.');if(!expires||!signature||Number(expires)<Date.now())return false;const row=(await db().query('SELECT password_hash FROM vg_admin WHERE id=1')).rows[0];if(!row)return false;const expected=createHmac('sha256',secret()).update(expires+'.'+row.password_hash).digest('hex');return tokenMatches(signature,expected)}
export async function requireAdmin(){if(!await isAdmin())redirect('/admin/login')}
export async function startSession(hash:string){const expires=String(Date.now()+8*60*60*1000);const signature=createHmac('sha256',secret()).update(expires+'.'+hash).digest('hex');(await cookies()).set('vg_session',`${expires}.${signature}`,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:8*60*60})}
export async function allowLogin(key:string){const row=(await db().query(`INSERT INTO vg_login_attempts(key,attempts,resets_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN vg_login_attempts.resets_at<now() THEN 1 ELSE vg_login_attempts.attempts+1 END,resets_at=CASE WHEN vg_login_attempts.resets_at<now() THEN now()+interval '15 minutes' ELSE vg_login_attempts.resets_at END RETURNING attempts`,[key])).rows[0];return row.attempts<=10}
