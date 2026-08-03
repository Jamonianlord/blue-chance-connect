declare module "lamejs" {
  class Mp3Encoder {
    constructor(channels: number, sampleRate: number, bitrate: number);
    encodeBuffer(samples: Int16Array): number[];
    flush(): number[];
    buffer: number[];
  }

  export { Mp3Encoder };
  export default { Mp3Encoder };
}
