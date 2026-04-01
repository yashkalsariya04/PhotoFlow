declare module 'canvas' {
  export class Canvas {
    width: number;
    height: number;
    constructor(width: number, height: number, type?: string);
    getContext(contextId: '2d'): any;
    toBuffer(mimeType?: string, config?: any): Buffer;
  }
  export class Image {
    src: string | Buffer;
    width: number;
    height: number;
  }
  export class ImageData {
    constructor(width: number, height: number);
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }
  export function loadImage(src: string | Buffer, options?: any): Promise<Image>;
}
