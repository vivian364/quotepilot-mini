export const ENDPOINT='https://kcgfxzztblrueplxthvb.supabase.co/functions/v1/rfq-submit-v2';
const extensions=['pdf','xls','xlsx','csv','doc','docx','jpg','jpeg','png','webp','gif','zip'];
export function attachFiles(form){
 const wrap=document.createElement('div');wrap.className='rfq-files portal-wide';wrap.style.cssText='grid-column:1/-1;margin-top:16px;padding:16px;border:1px dashed #9fb9c9;border-radius:12px;background:#f5f9fc;color:#163b50';
 const label=document.createElement('label');label.textContent='Attach Files';label.style.cssText='display:block;font-weight:700';
 const input=document.createElement('input');input.type='file';input.multiple=true;input.accept=extensions.map(x=>'.'+x).join(',');input.style.cssText='display:block;width:100%;margin-top:10px;font:inherit';label.append(input);
 const note=document.createElement('p');note.textContent='PDF, Excel, Word, photos & ZIP · Up to 5 files · 15 MB each · 20 MB total';note.style.cssText='font-size:12px;margin:10px 0 0;line-height:1.5';
 const list=document.createElement('ul');list.style.cssText='padding-left:18px;font-size:13px;overflow-wrap:anywhere';
 const error=document.createElement('p');error.setAttribute('role','status');error.style.color='#9f2630';
 wrap.append(label,note,list,error);form.querySelector('button[type="submit"],button:last-child').before(wrap);
 let selected=[];
 function validate(files){if(files.length>5)throw Error('Choose up to 5 files.');if(files.reduce((s,f)=>s+f.size,0)>20*1024*1024)throw Error('Total attachments must not exceed 20 MB.');for(const f of files){if(!extensions.includes(f.name.split('.').pop().toLowerCase()))throw Error('Unsupported file type: '+f.name);if(!f.size||f.size>15*1024*1024)throw Error('Files must be between 1 byte and 15 MB: '+f.name);if(f.name.length>180||/[\x00-\x1f/\\]/.test(f.name))throw Error('Please shorten or rename: '+f.name);}}
 function render(){list.replaceChildren();for(const f of selected){const li=document.createElement('li');li.append(document.createTextNode(f.name+' · '+(f.size/1024/1024).toFixed(2)+' MB '));const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.style.cssText='border:0;background:transparent;color:#17658c;text-decoration:underline;cursor:pointer';remove.setAttribute('aria-label','Remove '+f.name);remove.onclick=()=>{selected=selected.filter(x=>x!==f);render();};li.append(remove);list.append(li);}}
 input.onchange=()=>{try{const files=[...selected,...input.files];validate(files);selected=files;error.textContent='';render();}catch(e){error.textContent=e.message;}input.value='';};
 return {getFiles(){validate(selected);return [...selected];},clear(){selected=[];input.value='';error.textContent='';render();},setDisabled(value){input.disabled=value;list.querySelectorAll('button').forEach(b=>b.disabled=value);}};
}
export async function sendFiles(payload,files,token){
 const form=new FormData();form.set('payload',JSON.stringify(payload));files.forEach(file=>form.append('files',file));
 const r=await fetch(ENDPOINT,{method:'POST',headers:token?{Authorization:'Bearer '+token}:{},body:form});
 const result=await r.json().catch(()=>({}));if(!r.ok||!result.success)throw Error(result.error||'Unable to submit. Please retry.');return result;
}
export async function guestProof(request_id){
 const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'challenge',request_id})});const data=await r.json();if(!r.ok)throw Error(data.error||'Verification unavailable');
 const enc=new TextEncoder(),start=Date.now();let proof=0;
 while(Date.now()-start<60000){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(data.challenge+':'+proof)));if(bytes[0]===0&&(bytes[1]&240)===0){const remaining=1600-(Date.now()-start);if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));return {challenge:data.challenge,signature:data.signature,proof};}proof++;if(proof%250===0)await new Promise(resolve=>setTimeout(resolve,0));}
 throw Error('Verification timed out. Please retry.');
}
export async function appendDownloads(db,container,quotationId,guest=false){
 const {data,error}=await db.from('rfq_attachments').select('filename,storage_path,size_bytes').eq(guest?'guest_request_id':'quotation_id',quotationId).order('created_at');if(error){const p=document.createElement('p');p.textContent='Attachments could not be loaded.';container.append(p);return;}
 for(const file of data||[]){const button=document.createElement('button');button.type='button';button.textContent='Download '+file.filename;button.className='fleet-request-link';button.onclick=async()=>{button.disabled=true;const {data,error}=await db.storage.from('marine-rfq-attachments').createSignedUrl(file.storage_path,60,{download:file.filename});button.disabled=false;if(error){button.textContent='Retry download: '+file.filename;return;}const a=document.createElement('a');a.href=data.signedUrl;a.rel='noopener';a.target='_blank';a.click();};container.append(button);}
}
