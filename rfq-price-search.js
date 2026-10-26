import {guestProof} from '/rfq-attachments.js';
const endpoint='https://kcgfxzztblrueplxthvb.supabase.co/functions/v1/rfq-price-search';
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export function mountPriceSearch(form,details){
 if(!form||form.querySelector('.mq-price-search'))return;
 const panel=node('section');panel.className='mq-price-search portal-wide';panel.style.cssText='grid-column:1/-1;margin-top:16px;padding:16px;border:1px solid #cbdde6;border-radius:12px;background:#f5f9fc;color:#163b50';
 const heading=node('strong','Find an indicative price');const intro=node('p','Enter the manufacturer and exact model / part number. Search is for one product at a time.');intro.style.cssText='font-size:12px;line-height:1.5';
 const fields=node('div');fields.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px';
 const brandLabel=node('label','Manufacturer'),brand=node('input');brand.type='text';brand.maxLength=100;brand.placeholder='e.g. Danfoss';brandLabel.append(brand);
 const partLabel=node('label','Model / part number'),part=node('input');part.type='text';part.maxLength=100;part.placeholder='Exact product code';partLabel.append(part);
 for(const input of [brand,part])input.style.cssText='display:block;width:100%;box-sizing:border-box;padding:10px;margin-top:6px;border:1px solid #cbdde6;border-radius:6px;font:inherit;background:white;color:#163b50';
 fields.append(brandLabel,partLabel);
 const button=node('button','Find Price');button.type='button';button.className='portal-btn';button.style.cssText='margin-top:12px;padding:12px 18px;border:0;border-radius:6px;background:#082639;color:white;font:inherit;cursor:pointer';
 const result=node('div');result.setAttribute('aria-live','polite');result.style.cssText='margin-top:12px;line-height:1.6;overflow-wrap:anywhere';
 const privacy=node('small','Search sends only the manufacturer and product code to our search provider. Uploaded files and contact details are not included.');privacy.style.display='block';privacy.style.marginTop='10px';
 panel.append(heading,intro,fields,button,result,privacy);const submit=form.querySelector('button[type="submit"],.portal-btn');if(submit)submit.before(panel);else form.append(panel);
 let busy=false;
 button.onclick=async()=>{
  if(busy)return;const manufacturer=brand.value.trim(),code=part.value.trim();if(manufacturer.length<2||code.length<3){result.textContent='Enter the manufacturer and exact model / part number.';return;}
  busy=true;button.disabled=true;result.textContent='Searching for an exact product match…';
  try{
   const request_id=crypto.randomUUID(),proof=await guestProof(request_id);
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brand:manufacturer,part:code,request_id,...proof,website:document.getElementById('rfq_website')?.value||''}),signal:AbortSignal.timeout(35000)});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Search unavailable. Please submit your RFQ.');
   result.replaceChildren();if(data.status!=='estimate'){result.textContent=data.message||'Price on request.';return;}
   if(data.currency!=='EUR'||typeof data.unit_price!=='number'||!Number.isFinite(data.unit_price)||data.unit_price<=0)throw Error('No confirmed estimate available.');
   const price=new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(data.unit_price);
   const title=node('p',data.title),amount=node('strong','Indicative price: '+price);amount.style.fontSize='22px';const notice=node('p',data.notice);notice.style.fontSize='12px';
   const use=node('button','Add estimate reference to RFQ');use.type='button';use.style.cssText='background:transparent;border:0;color:#17658c;text-decoration:underline;cursor:pointer';use.onclick=()=>{const reference='Indicative estimate '+data.estimate_id+': '+data.title+' — '+price+' per listed unit/package, subject to confirmation.';if(!details.value.includes(data.estimate_id))details.value+=(details.value?'\n':'')+reference;use.disabled=true;use.textContent='Estimate reference added';};result.append(title,amount,notice,use);
  }catch(error){result.textContent=error.message||'Price search unavailable. Please submit your RFQ.';}finally{busy=false;button.disabled=false;}
 };
}
export async function mountPriceAdmin(db){
 const admin=document.getElementById('adminPanel');if(!admin||admin.hidden)return;
 let panel=document.getElementById('mqPriceAdmin');if(!panel){panel=node('section');panel.id='mqPriceAdmin';panel.className='portal-card';admin.append(panel);}panel.replaceChildren(node('h3','Price search · Private settings'));
 const [{data:settings,error},{data:estimates,error:auditError}]=await Promise.all([db.from('rfq_price_settings').select('markup_percent,enabled').eq('id',1).single(),db.from('rfq_price_estimates').select('*').order('created_at',{ascending:false}).limit(30)]);
 if(error){panel.append(node('p','Price settings unavailable.'));return;}
 const form=node('form'),label=node('label','Price uplift (%)'),input=node('input');input.type='number';input.min='10';input.max='15';input.step='0.5';input.required=true;input.value=settings.markup_percent;label.append(input);
 const toggleLabel=node('label',' Enable live price search '),enabled=node('input');enabled.type='checkbox';enabled.checked=settings.enabled;toggleLabel.prepend(enabled);const save=node('button','Save price settings');save.type='submit';save.className='portal-btn';const status=node('p');status.setAttribute('role','status');form.append(label,toggleLabel,save,status);panel.append(form);
 form.onsubmit=async e=>{e.preventDefault();const percent=Number(input.value);if(!Number.isFinite(percent)||percent<10||percent>15){status.textContent='Choose a percentage between 10% and 15%.';return;}
  save.disabled=true;try{if(enabled.checked){const response=await fetch(endpoint);const readiness=await response.json();if(!response.ok||!readiness.configured)throw Error('Add SERPAPI_API_KEY in Supabase Edge Function secrets before activation.');}const {error}=await db.from('rfq_price_settings').update({markup_percent:percent,enabled:enabled.checked}).eq('id',1);if(error)throw error;status.textContent='Price settings saved.';}catch(error){status.textContent=error.message;}finally{save.disabled=false;}
 };
 panel.append(node('p','Base prices and uplift are private. Public estimates show only the marked-up price.'));
 if(auditError){panel.append(node('p','Estimate history could not be loaded.'));return;}
 for(const row of estimates||[]){const item=node('div');item.className='request-record';item.append(node('strong',row.matched_title),node('p','Source: EUR '+Number(row.source_price).toFixed(2)+' · Uplift: '+row.markup_percent+'% · Customer: EUR '+Number(row.selling_price).toFixed(2)),node('p',row.created_at+' · '+row.id));try{const url=new URL(row.source_url);if(url.protocol==='https:'){const link=node('a','View original source');link.href=url.href;link.rel='noopener';link.target='_blank';item.append(link);}}catch{}panel.append(item);}
}
mountPriceSearch(document.getElementById('rfq'),document.getElementById('details'));
mountPriceSearch(document.getElementById('portalQuoteForm'),document.getElementById('portalQuoteItems'));
