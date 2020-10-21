// communication.ts Copyright 2020 Paul Beaudet MIT License
// If env var for video is true set it that otherwise default false
const videoState = {
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
};

const offerConfig = {
  offerToReceiveAudio: mediaConfig.audio,
  offerToReceiveVideo: mediaConfig.video,
};

export { configRTC, offerConfig, mediaConfig, videoState };
