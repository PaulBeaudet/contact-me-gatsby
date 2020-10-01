// communication.ts Copyright 2020 Paul Beaudet MIT License
const mediaConfig = {
  audio: true,
  video: true,
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
