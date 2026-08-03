declare module "@breezystack/lamejs" {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, bitrate: number);
    encodeBuffer(samples: Int16Array): Uint8Array;
    flush(): Uint8Array;
    buffer: number[];
  }

  export { Mp3Encoder };
  export default { Mp3Encoder };
}
