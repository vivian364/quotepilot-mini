// Local document reading. No document content is uploaded to an OCR service.
const scripts=new Map();
function script(url,name){if(!scripts.has(url))scripts.set(url,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=()=>resolve(window[name]);s.onerror=()=>{scripts.delete(url);reject(Error('Reader could not load. Check your connection and retry.'));};document.head.append(s);}));return scripts.get(url);}
const ext=name=>name.split('.').pop().toLowerCase();
export const READ_TYPES='pdf,doc,docx,xls,xlsx,csv,tsv,txt,jpg,jpeg,png,webp,gif,zip'.split(',');
export function validateReadFiles(files){if(!files.length||files.length>5)throw Error('Choose 1–5 files.');let total=0;for(const f of files){if(!READ_TYPES.includes(ext(f.name)))throw Error('Cannot read '+f.name);if(!f.size||f.size>15*1024*1024)throw Error('Each file must be 1 byte–15 MB.');total+=f.size;}if(total>20*1024*1024)throw Error('Choose up to 20 MB total.');}
export function draftRows(raw){
 const lines=String(raw).replace(/\r/g,'').split('\n'),out=[];let brand='',part='',qty='';
 const add=()=>{if(brand&&part){out.push([brand,part,qty||''].join('; '));brand=part=qty='';}};
 for(let line of lines){line=line.trim();if(!line)continue;
  if(/^(manufacturer|brand|maker)\s*[:=]/i.test(line)){add();brand=line.replace(/^[^:=]+[:=]\s*/,'');continue;}
  if(/^(part(?: number| no\.?)?|model|p\/n)\s*[:=]/i.test(line)){part=line.replace(/^[^:=]+[:=]\s*/,'');continue;}
  if(/^(qty|quantity)\s*[:=]/i.test(line)){qty=line.replace(/^[^:=]+[:=]\s*/,'');add();continue;}
  const cols=line.split(/\t|;|\s{2,}/).map(x=>x.trim()).filter(Boolean);
  if(cols.length===3&&!/manufacturer|part number/i.test(line)&&/^\d+(?:[.,]\d+)?$/.test(cols[2]))out.push(cols.join('; '));
 }
 add();if(out.length>50)throw Error('More than 50 rows found. Split the request into smaller files.');return out.join('\n');
}
export async function readDocuments(files,report=()=>{}){
 validateReadFiles(files);let worker=null,count=0,expanded=0;const sections=[],warnings=[];
 async function ocr(image){if(!worker){const T=await script('https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js','Tesseract');worker=await T.createWorker('eng');}return (await worker.recognize(image)).data.text;}
 async function imageText(blob){const bitmap=await createImageBitmap(blob);try{if(bitmap.width*bitmap.height>24000000)throw Error('Image exceeds 24 megapixels. Crop or resize it.');const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return await ocr(canvas);}finally{bitmap.close();}}
 async function read(file,nested=false){
 if(++count>25)throw Error('At most 25 documents including ZIP entries.');const type=ext(file.name);report('Reading '+file.name+'…');let text='';
 if(['xlsx','docx'].includes(type)){const Z=await script('https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js','JSZip');const archive=await Z.loadAsync(await file.arrayBuffer());const entries=Object.values(archive.files);let size=0;if(entries.length>2000)throw Error('Document contains too many entries.');for(const e of entries){if(e.dir)continue;const n=e._data?.uncompressedSize;if(!Number.isFinite(n)||(size+=n)>40*1024*1024)throw Error('Expanded document exceeds 40 MB.');}}
 if(['txt','csv','tsv'].includes(type))text=await file.text();
 else if(['xls','xlsx'].includes(type)){const X=await script('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js','XLSX');const book=X.read(await file.arrayBuffer(),{type:'array',cellFormula:false,cellHTML:false,sheetRows:1000});text=book.SheetNames.slice(0,10).map(n=>X.utils.sheet_to_csv(book.Sheets[n],{FS:'\t'})).join('\n');}
 else if(type==='docx'){const M=await script('https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js','mammoth');const html=(await M.convertToHtml({arrayBuffer:await file.arrayBuffer()})).value,dom=new DOMParser().parseFromString(html,'text/html');text=Array.from(dom.querySelectorAll('tr')).map(r=>Array.from(r.querySelectorAll('td,th')).map(c=>c.textContent.trim()).join('\t')).join('\n');text+='\n'+Array.from(dom.querySelectorAll('p')).filter(p=>!p.closest('table')).map(p=>p.textContent).join('\n');}
 else if(type==='doc'){const url=URL.createObjectURL(new Blob([`importScripts(location.origin+'/rfq-doc-reader.js');onmessage=async e=>{try{postMessage({text:await MarineDocReader(new Uint8Array(e.data))});}catch(e){postMessage({error:e.message});}}`],{type:'text/javascript'}));const w=new Worker(url);try{text=await new Promise(async(resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Word reading timed out. Save as DOCX and retry.')),20000);w.onmessage=e=>{clearTimeout(timer);e.data.error?reject(Error(e.data.error)):resolve(e.data.text);};w.onerror=()=>{clearTimeout(timer);reject(Error('Word reader failed. Save as DOCX and retry.'));};w.postMessage(await file.arrayBuffer());});}finally{w.terminate();URL.revokeObjectURL(url);}}
 else if(['jpg','jpeg','png','webp','gif'].includes(type))text=await imageText(file);
 else if(type==='pdf'){
 const P=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.min.mjs');P.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.worker.min.mjs';const task=P.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});const doc=await task.promise;
 try{if(doc.numPages>20)throw Error('PDF limit is 20 pages. Split the document.');for(let i=1;i<=doc.numPages;i++){report('Reading '+file.name+' · page '+i+'/'+doc.numPages);const page=await doc.getPage(i),content=await page.getTextContent();let pageText='',lastY=null;for(const item of content.items){if(!('str'in item))continue;const y=Math.round(item.transform[5]);if(lastY!==null&&Math.abs(y-lastY)>3)pageText+='\n';else if(pageText)pageText+='  ';pageText+=item.str;lastY=y;if(item.hasEOL)pageText+='\n';}
 if(pageText.replace(/\s/g,'').length<15){if(i>10)throw Error('Scanned PDF limit is 10 pages.');const viewport=page.getViewport({scale:1.5});if(viewport.width*viewport.height>12000000)throw Error('PDF page is too large.');const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;pageText=await ocr(canvas);}text+=pageText+'\n';if(text.length>200000)throw Error('Document text exceeds 200,000 characters.');}}finally{await task.destroy();}}
 else if(type==='zip'){
 if(nested)throw Error('Nested ZIP archives are not read.');const Z=await script('https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js','JSZip'),zip=await Z.loadAsync(await file.arrayBuffer());const entries=Object.values(zip.files).filter(e=>!e.dir);if(entries.length>20)throw Error('ZIP limit is 20 entries.');for(const entry of entries){const size=entry._data?.uncompressedSize;if(!Number.isFinite(size)||size>15*1024*1024||(expanded+=size)>40*1024*1024)throw Error('ZIP expanded-size limit exceeded.');}for(const entry of entries){if(!READ_TYPES.includes(ext(entry.name))||ext(entry.name)==='zip'){warnings.push('Skipped '+entry.name);continue;}await read(new File([await entry.async('uint8array')],entry.name),true);}return;}
 if(text.length>200000)throw Error('Document text exceeds 200,000 characters.');sections.push({name:file.name,text});
 }
 try{for(const file of files){try{await read(file);}catch(e){warnings.push(file.name+': '+e.message);}}}finally{if(worker)await worker.terminate();}
 const text=sections.map(s=>s.text).join('\n');if(text.length>300000)throw Error('Combined text is too large. Import fewer files.');return {text,rows:draftRows(text),warnings,sections};
}
