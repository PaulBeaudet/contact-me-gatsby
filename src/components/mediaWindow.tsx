// mediaWindow.tsx Copyright 2020 Paul Beaudet MIT License
import React, { useState, useEffect } from 'react';
import {  mediaConfig, videoWindowSize } from '../config/communication';

interface props {
  videoWindowState: videoWindowSize
  rtcObj: RTCPeerConnection
  requestSetup: number
}

const getStream = async (video = mediaConfig.video, secondTry = false) => {
  if (typeof navigator !== 'undefined') {
    try {
      // if we were passed a video option override it, other wise stick with default
      const stream = await navigator.mediaDevices.getUserMedia({
        ...mediaConfig,
        video,
      });
      if (!stream.getAudioTracks().length) {
        throw new Error(`No audio tracks`);
      }
      return stream;
    } catch (error) {
      if (!secondTry && mediaConfig.video){
        // try without video if there was no video device
        console.log(`issue getting media stream: ${error} trying without video`);
        return getStream(false, true);
      }
      console.log(`getStream => ${error}`);
      return null
    }
  }
};

const MediaWindow: React.FC<props> = ({videoWindowState, rtcObj, requestSetup}) => {
  const [stream, setStream] = useState(null);
  const [muted, setMuted ] = useState(false);
  const [showVideo, setShowVideo ] = useState(mediaConfig.video);

  const setUpMedia = async (rtcObj: RTCPeerConnection) => {
    let ourStream = stream;
    if(!ourStream){
      try {
        ourStream = await getStream();
        ourStream.getAudioTracks().forEach(track => {
          track.enabled = !muted;
        });
        if(mediaConfig.video){
          ourStream.getVideoTracks().forEach(track => {
            track.enabled = showVideo;
          });
        }
        setStream(ourStream);
      } catch (error){
        console.log(error);
        return;
      }
    }
    ourStream.getTracks().forEach((track: MediaStreamTrack) => {
      rtcObj.addTrack(track, ourStream);
    });
    // On track needs to be called after getTracks or no candidates will be generated
    rtcObj.ontrack = (event: RTCTrackEvent) => {
      // Attach stream event to an html video element
      if(typeof document !== 'undefined'){
        const element = document.getElementById('mediaStream') as HTMLVideoElement;
        element.srcObject = event.streams[0];
      }
    }
  };

  useEffect(()=>{
    if(!rtcObj){
      return;
    }
    if(requestSetup){
      setUpMedia(rtcObj);
    }
  }, [requestSetup]);

  const muteToggle = () => {
    if(stream){
      stream.getAudioTracks().forEach(track => {
        track.enabled = muted
      });
    }
    setMuted(!muted);
  }

  const videoToggle = () => {
    if(stream){
      stream.getVideoTracks().forEach(track => {
        track.enabled = !showVideo
      });
    }
    setShowVideo(!showVideo);
  }

  return (
    <>
      <video 
        id="mediaStream"
        autoPlay={true}
        width={videoWindowState.height}
        height={videoWindowState.width}
        playsInline
      >
        unsupported
      </video>
      <button onClick={muteToggle} className="button">
        {muted ? 'unmute' : 'mute'}
      </button>
      {mediaConfig.video && <button onClick={videoToggle} className="button">
        {showVideo ? 'hide video' : 'share video'}
      </button>}
    </>
  )
}

export default MediaWindow;