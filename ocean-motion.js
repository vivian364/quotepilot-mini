/* A flowing water treatment of the original ocean photo; brand/content stay still. */
(()=>{
 const hero=document.querySelector('.hero'),canvas=document.getElementById('oceanMotion');if(!hero||!canvas)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return;
 const vert='attribute vec2 point; varying vec2 uv; void main(){ uv=point*.5+.5; gl_Position=vec4(point,0.,1.); }';
 const frag=`precision mediump float;
 varying vec2 uv; uniform sampler2D ocean; uniform vec2 size; uniform float time;
 vec2 cover(vec2 p){float ratio=size.x/size.y;vec2 crop=ratio>1.?vec2(1.,1./ratio):vec2(ratio,1.);return (p-.5)*crop*.84+vec2(.5,.53);}
 vec3 water(vec2 p,float phase){
  float strength=smoothstep(.15,.8,p.x);
  vec2 q=cover(p);
  q.y+=(phase-.5)*.11;
  q.x+=(phase-.5)*.027;
  q.x+=sin(p.y*19.+p.x*7.-time*1.1)*.006*strength;
  q.x+=sin(p.y*43.-time*1.7)*.0025*strength;
  q.y+=sin(p.x*18.+p.y*9.-time*.8)*.004*strength;
  return texture2D(ocean,clamp(q,.005,.995)).rgb;
 }
 void main(){
  float phase=fract(time*.12);float second=fract(phase+.5);
  float blend=abs(phase-.5)*2.;
  vec3 col=mix(water(uv,phase),water(uv,second),blend);
  float shade=mix(.17,.84,smoothstep(0.,.88,uv.x));
  col=mix(vec3(.012,.075,.13),col,shade);
  float bottom=smoothstep(0.,.2,uv.y);
  col=mix(vec3(.012,.094,.17),col,bottom);
  gl_FragColor=vec4(col,1.);
 }`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Water shader unavailable');return s;}
 let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vert));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;}catch{return}
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const point=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);
 const resolution=gl.getUniformLocation(program,'size'),clock=gl.getUniformLocation(program,'time');const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 let ready=false,visible=true,raf=0,last=0,elapsed=0;
 function resize(){const r=hero.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resolution,r.width,r.height);}
 function draw(now){raf=0;if(!ready||!visible||document.hidden||reduce.matches)return;if(!last)last=now;const delta=now-last;if(delta>=32){elapsed+=Math.min(delta,70)/1000;last=now;gl.uniform1f(clock,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);canvas.classList.add('is-flowing')}raf=requestAnimationFrame(draw)}
 function resume(){cancelAnimationFrame(raf);raf=0;last=0;canvas.classList.toggle('is-flowing',ready&&!reduce.matches);if(ready&&visible&&!document.hidden&&!reduce.matches)raf=requestAnimationFrame(draw)}
 const photo=new Image();photo.onload=()=>{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,photo);ready=true;resize();resume()};photo.src='/ocean.webp';
 new ResizeObserver(()=>{if(ready)resize()}).observe(hero);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume()},{threshold:0}).observe(hero);
 document.addEventListener('visibilitychange',resume);reduce.addEventListener('change',resume);
 canvas.addEventListener('webglcontextlost',()=>{ready=false;cancelAnimationFrame(raf);canvas.classList.remove('is-flowing')});
})();
