// communication.ts Copyright 2020 Paul Beaudet MIT License
// If env var for video is true set it that otherwise default false

interface videoWindowSize {
  width: number
  height: number
}

// SD quality video is good enough, resources are better allocated towards audio
const videoState: videoWindowSize = {
  width: 640,
  height: 480,
};

const videoConstraints = {
  ...videoState,
  facingMode: "user",
};

const useVideo: any =
  process.env.GATSBY_USE_VIDEO === 'true' ? videoConstraints : false;

const mediaConfig = {
  audio: true,
  video: useVideo,
};

const configRTC = {
  iceServers: [
    { urls: process.env.GATSBY_ICE_SERVER_1 },
    { urls: process.env.GATSBY_ICE_SERVER_2 },
  ],
  // Chrome only flag to set unified-plan in case it would other wise decide plan-b is a good idea
  sdpSemantics: 'unified-plan',
};

const offerConfig = {
  offerToReceiveAudio: mediaConfig.audio,
  offerToReceiveVideo: mediaConfig.video,
};

export { configRTC, offerConfig, mediaConfig, videoState, videoWindowSize };
