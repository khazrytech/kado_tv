import React, {useEffect, useRef, useState} from "react";
import Hls from "hls.js";
import {Maximize, Pause, Play, Volume2, VolumeX} from "lucide-react";

export default function Player({src,poster,onProgress,live=false}){
  const videoRef=useRef(null), wrapRef=useRef(null), hlsRef=useRef(null);
  const [playing,setPlaying]=useState(false), [muted,setMuted]=useState(false);
  useEffect(()=>{
    const video=videoRef.current;
    if(!video||!src)return;
    if(Hls.isSupported() && src.includes(".m3u8")){
      const hls=new Hls({enableWorker:true});
      hls.loadSource(src); hls.attachMedia(video); hlsRef.current=hls;
    } else video.src=src;
    const onTime=()=>{if(!live&&onProgress)onProgress(video.currentTime,video.duration||0)};
    video.addEventListener("timeupdate",onTime);
    return ()=>{video.removeEventListener("timeupdate",onTime); hlsRef.current?.destroy();};
  },[src,live,onProgress]);
  async function toggle(){const v=videoRef.current;if(!v)return;if(v.paused){await v.play();setPlaying(true)}else{v.pause();setPlaying(false)}}
  function fullscreen(){wrapRef.current?.requestFullscreen?.()}
  return <div className="player" ref={wrapRef}>
    <video ref={videoRef} poster={poster} playsInline onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} />
    <div className="player-gradient"/>
    <div className="player-controls">
      <button onClick={toggle}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button>
      <button onClick={()=>{videoRef.current.muted=!videoRef.current.muted;setMuted(!muted)}}>{muted?<VolumeX/>:<Volume2/>}</button>
      <div className="player-spacer"/><button onClick={fullscreen}><Maximize/></button>
    </div>
    {live&&<span className="live-badge">LIVE</span>}
  </div>;
}
