import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { emitKeypressEvents } from 'node:readline';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
const path=resolve(process.env.DATA_DIR||'data','portfolio.sqlite');
if(!existsSync(path))throw Error('Iniciá la web con npm start antes de configurar la contraseña.');
if(!process.stdin.isTTY)throw Error('Ejecutá este comando en una terminal interactiva.');
emitKeypressEvents(process.stdin);
async function secret(prompt){return new Promise(resolve=>{let value='';process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();function key(str,key){if(key?.ctrl&&key.name==='c'){process.stdin.setRawMode(false);process.stdout.write('\n');process.exit(1);}if(key?.name==='return'){process.stdin.off('keypress',keyHandler);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value);}else if(key?.name==='backspace'){value=value.slice(0,-1);}else if(str&&!key?.ctrl&&!key?.meta&&value.length<200){value+=str;}}const keyHandler=key;process.stdin.on('keypress',keyHandler);});}
const password=await secret('Nueva contraseña (mínimo 12 caracteres, no se muestra): ');
const confirmation=await secret('Repetir contraseña: ');
if(password.length<12||password.length>200||password!==confirmation)throw Error('Las contraseñas deben coincidir y tener entre 12 y 200 caracteres. No se cambió nada.');
const salt=randomBytes(16).toString('hex');const hash=(await promisify(scrypt)(password,salt,64)).toString('hex');
const db=new DatabaseSync(path);db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO admin VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET salt=excluded.salt, hash=excluded.hash').run(salt,hash);db.exec('DELETE FROM sessions; COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}finally{db.close();}
console.log('Contraseña actualizada. Se cerraron las sesiones anteriores.');
