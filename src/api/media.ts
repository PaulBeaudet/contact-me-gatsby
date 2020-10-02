// media.ts Copyright 2020 Paul Beaudet MIT License
import { mediaConfig } from '../config/communication';

const getStream = async (video = mediaConfig.video) => {
  if (typeof navigator !== 'undefined') {
    try {
      // if we were passed a video option override it, other wise stick with default
      mediaConfig.video = video;
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
      return getStream(false);
    }
  }
};

export { getStream };
