// media.ts Copyright 2020 Paul Beaudet MIT License
import { mediaConfig } from '../config/communication';

const getStream = async () => {
  if (typeof navigator !== 'undefined') {
    try {
      console.log(`trying to connect with video: ${mediaConfig.video}`);
      const stream = await navigator.mediaDevices.getUserMedia(mediaConfig);
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) {
        throw new Error(`No audio tracks!`);
      }
      // make sure the client's microphone is actually on
      audioTracks[0].enabled = audioTracks[0].enabled ? true : true;
      return stream;
    } catch (error) {
      console.log(`issue getting media stream: ${error} trying without video`);
      if (mediaConfig.video) {
        return;
      }
      mediaConfig.video = false;
      return getStream();
    }
  }
};

export { getStream };
