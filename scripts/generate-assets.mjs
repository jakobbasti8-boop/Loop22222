#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";

const root = process.cwd();
const imageDir = path.join(root, "assets", "images");
const audioDir = path.join(root, "assets", "audio");
mkdirSync(imageDir, { recursive: true });
mkdirSync(audioDir, { recursive: true });

// ---------- deterministic PNG writer (RGBA8, no external dependencies) ----------
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuf.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 8 + data.length);
  return out;
}
function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
function renderMark(size, transparent = false) {
  const data = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4; data[i]=r; data[i+1]=g; data[i+2]=b; data[i+3]=a;
  };
  for (let y=0;y<size;y+=1) for (let x=0;x<size;x+=1) {
    if (transparent) set(x,y,0,0,0,0);
    else {
      const nx=(x/size)-0.5, ny=(y/size)-0.46;
      const r=Math.min(1,Math.hypot(nx,ny)*1.55), t=(x+y)/(2*size);
      set(x,y,Math.round(10+14*(1-r)+8*t),Math.round(12+18*(1-r)+3*t),Math.round(18+30*(1-r)+20*t),255);
    }
  }
  const cx=size/2, cy=size/2, radius=size*0.325;
  const drawCircleStroke=(thickness,color,start=0.10,end=0.92)=>{
    const inner=radius-thickness/2, outer=radius+thickness/2;
    for (let y=0;y<size;y+=1) for (let x=0;x<size;x+=1) {
      const dx=x-cx, dy=y-cy, dist=Math.hypot(dx,dy);
      if (dist<inner || dist>outer) continue;
      let a=Math.atan2(dy,dx)/(Math.PI*2); if(a<0)a+=1;
      if(a>=start && a<=end) set(x,y,...color,255);
    }
  };
  drawCircleStroke(size*0.064,[42,222,183],0.05,0.90);
  drawCircleStroke(size*0.035,[71,148,255],0.05,0.90);
  const bars=[[-.185,.13],[-.13,.235],[-.075,.33],[-.02,.19],[.035,.285],[.09,.39],[.145,.245],[.20,.145]];
  for (const [ox,h] of bars) {
    const bx=Math.round(cx+ox*size), half=Math.round(h*size/2), w=Math.max(2,Math.round(size*.018));
    for(let y=Math.round(cy-half);y<=Math.round(cy+half);y+=1) for(let x=bx-w;x<=bx+w;x+=1) set(x,y,248,250,255,255);
  }
  // simple loop arrow head
  const ax=Math.round(size*.80), ay=Math.round(size*.26), aw=Math.round(size*.055);
  for(let yy=-aw;yy<=aw;yy+=1) for(let xx=-aw;xx<=aw;xx+=1) if(xx+Math.abs(yy) < aw) set(ax+xx,ay+yy,75,213,255,255);
  return png(size,size,data);
}
writeFileSync(path.join(imageDir,"icon.png"), renderMark(512,false));
writeFileSync(path.join(imageDir,"splash-icon.png"), renderMark(512,false));
writeFileSync(path.join(imageDir,"favicon.png"), renderMark(128,false));
writeFileSync(path.join(imageDir,"android-icon-foreground.png"), renderMark(512,true));

// ---------- deterministic PCM16 WAV synthesis ----------
const SR = 48000;
let seed = 838;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
const env = (t,d,p=2) => Math.max(0,1-t/d) ** p;
function wav(samples) {
  const pcm = Buffer.alloc(samples.length*2);
  let peak = 1e-9; for (const s of samples) peak=Math.max(peak,Math.abs(s));
  const scale=Math.min(1,.94/peak);
  samples.forEach((s,i)=>pcm.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(s*scale*32767))),i*2));
  const out=Buffer.alloc(44+pcm.length);
  out.write("RIFF",0); out.writeUInt32LE(36+pcm.length,4); out.write("WAVEfmt ",8);
  out.writeUInt32LE(16,16); out.writeUInt16LE(1,20); out.writeUInt16LE(1,22); out.writeUInt32LE(SR,24);
  out.writeUInt32LE(SR*2,28); out.writeUInt16LE(2,32); out.writeUInt16LE(16,34); out.write("data",36); out.writeUInt32LE(pcm.length,40); pcm.copy(out,44);
  return out;
}
const save=(name,s)=>writeFileSync(path.join(audioDir,name),wav(s));
let phase=0;
save("kick.wav",Array.from({length:Math.round(SR*.24)},(_,i)=>{const t=i/SR,f=150*Math.exp(-t*24)+43;phase+=2*Math.PI*f/SR;return Math.sin(phase)*env(t,.24,2.4)+.10*(rnd()*2-1)*env(t,.035,2);}));
save("snare.wav",Array.from({length:Math.round(SR*.18)},(_,i)=>{const t=i/SR;return .82*(rnd()*2-1)*env(t,.18,3)+.28*Math.sin(2*Math.PI*185*t)*env(t,.11,2);}));
function hat(name,duration,decay){let prev=0;save(name,Array.from({length:Math.round(SR*duration)},(_,i)=>{const t=i/SR,x=rnd()*2-1,hp=x-prev*.92;prev=x;const metal=[6200,7800,9300,11200].reduce((a,f)=>a+Math.sin(2*Math.PI*f*t),0)/4;return(.7*hp+.3*metal)*env(t,duration,decay);}));}
hat("hihat.wav",.075,3.8); hat("openhat.wav",.28,1.9);
save("clap.wav",Array.from({length:Math.round(SR*.20)},(_,i)=>{const t=i/SR;return [[0,.9],[.018,.72],[.036,.56],[.07,.35]].reduce((a,[st,amp])=>{const dt=t-st;return a+(dt>=0?amp*(rnd()*2-1)*Math.exp(-dt*45):0);},0);}));
for (const [name,freq,amp] of [["click.wav",1450,.65],["click_accent.wav",2050,.85]]) save(name,Array.from({length:Math.round(SR*.045)},(_,i)=>{const t=i/SR;return amp*Math.sin(2*Math.PI*freq*t)*env(t,.045,5);}));
save("reverb_ir.wav",Array.from({length:Math.round(SR*.28)},(_,i)=>{const t=i/SR;const direct=i===0?1:0;const noise=(rnd()*2-1)*Math.exp(-t*16)*.08;const comb=[[.021,.38],[.037,.29],[.061,.21],[.089,.14],[.137,.09]].reduce((a,[d,g])=>a+(Math.abs(t-d)<1/SR?g:0),0);return direct+noise+comb;}));

console.log("LoopForge deterministic assets generated.");
