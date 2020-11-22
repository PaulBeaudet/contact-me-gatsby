// media.ts Copyright 2020 Paul Beaudet MIT License
import { mediaConfig } from '../config/communication';

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

export { getStream };
