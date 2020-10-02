// communication.ts Copyright 2020 Paul Beaudet MIT License
// If env var for video is true set it that otherwise default false
const useVideo: boolean =
  process.env.GATSBY_USE_VIDEO === 'true' ? true : false;
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

export { configRTC, offerConfig, mediaConfig };
