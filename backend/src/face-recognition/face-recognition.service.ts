import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import * as https from 'https';
import { createWriteStream } from 'fs';

// Try to load canvas with a fallback
let Canvas: any, Image: any, ImageData: any, loadImage: any;
let isCanvasAvailable = false;
try {
  const canvas = require('canvas');
  Canvas = canvas.Canvas;
  Image = canvas.Image;
  ImageData = canvas.ImageData;
  loadImage = canvas.loadImage;
  // Check if we're using our own mock from main.ts or a real module
  isCanvasAvailable = canvas && !canvas._isMock && typeof loadImage === 'function';
} catch (e) {
  // If canvas fails to load (common on Windows without Cairo), we'll use a mock or fallback
  // Create minimal mocks for types
  Canvas = class {};
  Image = class {};
  ImageData = class {};
  loadImage = async () => { throw new Error('Canvas not available'); };
  isCanvasAvailable = false;
}

@Injectable()
export class FaceRecognitionService {
  private readonly logger = new Logger(FaceRecognitionService.name);
  private modelsPath: string;
  private modelsLoaded = false;

  constructor(private configService: ConfigService) {
    this.modelsPath = this.configService.get<string>('MODELS_PATH') || './models';
  }

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      this.logger.log(`Attempting to load models from: ${this.modelsPath}`);
      
      // Try multiple potential paths for the models
      const potentialPaths = [
        path.resolve(process.cwd(), this.modelsPath),
        path.resolve(process.cwd(), 'backend', this.modelsPath),
        path.resolve(__dirname, '..', '..', 'models'), // Relative to dist/face-recognition/
        path.resolve(__dirname, '..', 'models'),      // Relative to src/face-recognition/
      ];

      let modelPath = '';
      for (const p of potentialPaths) {
        try {
          const manifestPath = path.join(p, 'ssd_mobilenetv1_model-weights_manifest.json');
          const tinyManifestPath = path.join(p, 'tiny_face_detector_model-weights_manifest.json');
          const mtcnnManifestPath = path.join(p, 'mtcnn_model-weights_manifest.json');
          await Promise.all([
            fs.access(manifestPath),
            fs.access(tinyManifestPath),
            fs.access(mtcnnManifestPath)
          ]);
          modelPath = p;
          this.logger.log(`Found models at: ${modelPath}`);
          break;
        } catch (e) {
          // Continue searching
        }
      }

      // If models not found, try to download them to the default path
      if (!modelPath) {
        this.logger.warn('Models not found in any potential paths. Attempting to download...');
        modelPath = path.resolve(process.cwd(), this.modelsPath);
        await this.downloadModels(modelPath);
      }

      this.logger.log(`Loading models from verified path: ${modelPath}`);

      // Attempt to load the best available backend
      let backendLoaded = false;

      // 1. Try WebAssembly backend (Fast)
      try {
        const wasmBackend = require('@tensorflow/tfjs-backend-wasm');
        this.logger.log('Attempting to set TensorFlow WASM backend...');
        
        // Simpler path resolution for wasm
        const wasmPath = path.dirname(require.resolve('@tensorflow/tfjs-backend-wasm/package.json'));
        const wasmFile = path.join(wasmPath, 'dist', 'tfjs-backend-wasm.wasm');
        
        // Try to locate wasm files in various subdirectories
        const potentialWasmPaths = [
          path.join(wasmPath, 'dist'),
          path.join(wasmPath, 'wasm-out'),
          path.join(wasmPath, 'bin'),
        ];
        
        let foundWasmDir = '';
        for (const dir of potentialWasmPaths) {
          try {
            await fs.access(path.join(dir, 'tfjs-backend-wasm.wasm'));
            foundWasmDir = dir;
            break;
          } catch (e) {}
        }

        if (foundWasmDir) {
          this.logger.log(`Found WASM files at: ${foundWasmDir}`);
          wasmBackend.setWasmPaths({
            'tfjs-backend-wasm.wasm': path.join(foundWasmDir, 'tfjs-backend-wasm.wasm'),
            'tfjs-backend-wasm-simd.wasm': path.join(foundWasmDir, 'tfjs-backend-wasm-simd.wasm'),
            'tfjs-backend-wasm-threaded-simd.wasm': path.join(foundWasmDir, 'tfjs-backend-wasm-threaded-simd.wasm')
          });
        }

        await tf.setBackend('wasm');
        this.logger.log('Using TensorFlow WebAssembly backend (Fast)');
        backendLoaded = true;
      } catch (error) {
        this.logger.warn(`WASM backend failed to load: ${error.message}`);
        this.logger.warn('Falling back to CPU backend (Slow). For better performance, ensure @tensorflow/tfjs-backend-wasm is correctly installed.');
      }

      // 2. Fallback to CPU (Slower)
      if (!backendLoaded) {
        this.logger.warn('No high-performance TensorFlow backend found. Falling back to CPU (Slower).');
        try {
          await tf.setBackend('cpu');
        } catch (cpuError) {
          this.logger.error(`Failed to set CPU backend: ${cpuError.message}`);
        }
      }

      await tf.ready();
      this.logger.log(`Current TensorFlow backend: ${tf.getBackend()}`);
      
      const fs_node = require('fs');
      
      const customFetch = async (url: string) => {
        let filePath = url;

        // Normalize file: URLs robustly. We want a single leading slash for
        // absolute Unix paths. Handle variants like `file:/`, `file://` and
        // `file:///` consistently.
        if (filePath.startsWith('file:')) {
          filePath = filePath.slice(5); // remove 'file:' prefix
          // Collapse any leading slashes to a single one so path.isAbsolute works
          filePath = filePath.replace(/^\/+/,'/');
        }

        // If running on Windows and path begins with a leading '/', strip it
        if (filePath.startsWith('/') && process.platform === 'win32') {
          filePath = filePath.substring(1);
        }

        // If it's a relative path, resolve it against the verified modelPath
        if (!path.isAbsolute(filePath)) {
          filePath = path.resolve(modelPath, filePath);
        }

        filePath = filePath.replace(/\//g, path.sep);
        
        try {
          const data = fs_node.readFileSync(filePath);
          return {
            ok: true,
            status: 200,
            json: async () => JSON.parse(data.toString()),
            arrayBuffer: async () => {
              const ab = new ArrayBuffer(data.length);
              const view = new Uint8Array(ab);
              for (let i = 0; i < data.length; ++i) view[i] = data[i];
              return ab;
            }
          };
        } catch (e) {
          console.error(`Fetch mock failed for ${url} (resolved to ${filePath}): ${e.message}`);
          throw e;
        }
      };

      // Use loadFromUri with a custom fetch mock to avoid loadFromDisk issues
      faceapi.env.monkeyPatch({ 
        Canvas, Image, ImageData,
        fetch: customFetch
      } as any);

      // Also override global fetch if necessary for this scope
      if ((global as any).fetch) {
        const originalFetch = (global as any).fetch;
        (global as any).fetch = (url: string, ...args: any[]) => {
          if (typeof url === 'string' && (url.startsWith('file:') || !url.startsWith('http'))) {
            return customFetch(url);
          }
          return originalFetch(url, ...args);
        };
      }
      
      this.logger.log('FaceAPI environment patched with custom fetch for model loading');
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('file://' + modelPath),
        faceapi.nets.tinyFaceDetector.loadFromUri('file://' + modelPath),
        faceapi.nets.mtcnn.loadFromUri('file://' + modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri('file://' + modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri('file://' + modelPath),
      ]);
      
      this.modelsLoaded = true;
      this.logger.log('Face recognition models loaded successfully');
    } catch (error) {
      this.logger.error(`Failed to load face recognition models: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Detect faces and generate embeddings from image buffer
   */
  async detectFaces(
    imageBuffer: Buffer,
    detectorParam: 'ssd' | 'tiny' | 'mtcnn' = 'tiny',
    singleFace: boolean = false,
  ): Promise<{
    detections: any[];
    embeddings: Float32Array[];
    faceCount: number;
  }> {
    const detector = detectorParam || 'tiny';
    const startTime = Date.now();
    await this.loadModels();

    try {
      this.logger.log(`Processing image buffer of size: ${imageBuffer.length} bytes using ${detector.toUpperCase()} (singleFace: ${singleFace})...`);
      
      // Optimization: balance speed and accuracy using a capped detection size
      const detectionSize = singleFace ? 512 : 640; 
      
      const processedBuffer = await sharp(imageBuffer)
        .rotate()
        .resize({ width: detectionSize, height: detectionSize, fit: 'inside', withoutEnlargement: true }) 
        .toBuffer();

      this.logger.log(`Image processed with sharp (rotation/resize to ${detectionSize}px)`);
      
      let tensor: tf.Tensor3D | null = null;
      let img: any;

      if (isCanvasAvailable) {
        try {
          // Try to use loadImage from canvas first
          img = await loadImage(processedBuffer);
          this.logger.log(`Image loaded into canvas: ${img.width}x${img.height}`);
        } catch (e) {
          this.logger.warn(`Canvas loadImage failed, falling back to tensor: ${e.message}`);
          isCanvasAvailable = false;
        }
      }

      if (!isCanvasAvailable) {
        // Fallback to tensor using sharp
        const { data, info } = await sharp(processedBuffer)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        
        tensor = tf.tensor3d(data, [info.height, info.width, 3], 'int32');
        img = tensor;
        this.logger.log(`Image converted to tensor: ${info.width}x${info.height}`);
      }

      // Use SSD Mobilenet for high accuracy, Tiny Face Detector for speed, or MTCNN
      let detections;
      const detectionStartTime = Date.now();
      const imageWidth = img.width || (img.shape ? img.shape[1] : 0);
      const imageHeight = img.height || (img.shape ? img.shape[0] : 0);

      try {
        const detectionBase = singleFace 
          ? faceapi.detectSingleFace(
              img as any,
              detector === 'tiny'
                ? new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
                : new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }) as any
            )
          : faceapi.detectAllFaces(
              img as any,
              detector === 'tiny'
                ? new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.25 })
                : (detector === 'mtcnn'
                    ? new faceapi.MtcnnOptions()
                    : new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })) as any
            );

        this.logger.log(`Starting face detection (${detector.toUpperCase()}) with TF Backend: ${tf.getBackend()}...`);
        
        let rawDetections = await (detectionBase as any)
          .withFaceLandmarks()
          .withFaceDescriptors();

        // Fallback: only when Tiny detector finds 0 faces
        if (
          detector === 'tiny' &&
          (
            !rawDetections ||
            (Array.isArray(rawDetections) && rawDetections.length === 0)
          )
        ) {
          this.logger.log(
            `Tiny detector found 0 faces at ${detectionSize}px. Falling back to SSD Mobilenet for accuracy...`
          );
          const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.30 });
          const fallbackBase = singleFace 
            ? faceapi.detectSingleFace(img as any, ssdOptions)
            : faceapi.detectAllFaces(img as any, ssdOptions);
          
          const fallbackDetections = await (fallbackBase as any)
            .withFaceLandmarks()
            .withFaceDescriptors();
          rawDetections = fallbackDetections;
        }

        // Convert single detection to array for consistency
        detections = singleFace ? (rawDetections ? [rawDetections] : []) : (rawDetections || []);
      } finally {
        // Dispose tensor if we created one
        if (tensor) {
          tensor.dispose();
        }
      }

      const detectionDuration = Date.now() - detectionStartTime;
      const totalDuration = Date.now() - startTime;
      
      this.logger.log(`Detection complete in ${detectionDuration}ms. Found ${detections.length} faces. Total time: ${totalDuration}ms.`);

      // Extract and align faces before generating descriptors
      // This is crucial for accuracy as it normalizes the face orientation
      const embeddings: Float32Array[] = [];
      const results: any[] = [];

      for (const d of detections) {
        // Face-api's descriptors are already generated using landmarks alignment
        // if we use withFaceDescriptors() on the full image.
        // However, we can improve accuracy by ensuring the face is well-posed.
        
        embeddings.push(d.descriptor);
        results.push({
          score: d.detection.score,
          box: {
            x: d.detection.box.x,
            y: d.detection.box.y,
            width: d.detection.box.width,
            height: d.detection.box.height,
          },
          imageWidth,
          imageHeight,
        });
      }

      // Sort by detection area (largest faces first)
      const sortedIndices = results
        .map((r, i) => ({ area: r.box.width * r.box.height, index: i }))
        .sort((a, b) => b.area - a.area)
        .map(x => x.index);

      return {
        detections: sortedIndices.map(i => results[i]),
        embeddings: sortedIndices.map(i => embeddings[i]),
        faceCount: results.length,
      };
    } catch (error) {
      this.logger.error(`Error detecting faces: ${error.message}`, error.stack);
      throw new Error(`Failed to detect faces in image: ${error.message}`);
    }
  }

  /**
   * Compare face embeddings to find matches
   */
  async findMatches(
    targetEmbedding: Float32Array,
    photoEmbeddings: Array<{ photoId: string; embeddings: Float32Array[]; faceBoxes?: any[] }>,
    threshold: number = 0.5 // Adjusted from 0.45 to 0.5 for a better balance between accuracy and recall
  ): Promise<string[]> {
    if (!targetEmbedding || photoEmbeddings.length === 0) {
      return [];
    }

    const startTime = Date.now();
    const matchedPhotoIds: string[] = [];

    for (const photo of photoEmbeddings) {
      for (let i = 0; i < photo.embeddings.length; i++) {
        const embedding = photo.embeddings[i];
        
        // Filter out very small faces (likely background people) if we have box information
        if (photo.faceBoxes && photo.faceBoxes[i]) {
          const box = photo.faceBoxes[i].box || photo.faceBoxes[i];
          const area = box.width * box.height;
          // If the face is very small (e.g. < 40x40 in a high res image), skip it
          // This prevents "wrong face detected" by ignoring blurry background faces
          if (area < 1600) continue; 
        }

        const distance = faceapi.euclideanDistance(targetEmbedding, embedding);
        
        if (distance <= threshold) {
          matchedPhotoIds.push(photo.photoId);
          break; // Stop checking this photo if one face matches
        }
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Matching took ${duration}ms. Found ${matchedPhotoIds.length} matching photos with threshold ${threshold}`);
    return matchedPhotoIds;
  }

  /**
   * Generate face descriptor from selfie
   */
  async generateFaceDescriptor(selfieBuffer: Buffer): Promise<Float32Array | null> {
    // For selfies, we use fast TinyFaceDetector with single face optimization to reach 5-6s target
    const result = await this.detectFaces(selfieBuffer, 'tiny', true);
    
    if (result.faceCount === 0) {
      throw new Error('No face detected in selfie. Please upload a clear photo of your face.');
    }

    // If multiple faces are detected, we take the largest one (usually the closest person)
    // instead of throwing an error. This improves UX when others are in the background.
    if (result.faceCount > 1) {
      this.logger.warn(`Multiple faces (${result.faceCount}) detected in selfie. Using the largest face.`);
    }

    return result.embeddings[0];
  }

  /**
   * Generate face descriptors for all detected faces
   */
  async generateAllFaceDescriptors(selfieBuffer: Buffer): Promise<Float32Array[]> {
    const result = await this.detectFaces(selfieBuffer);
    
    if (result.faceCount === 0) {
      throw new Error('No face detected in selfie. Please upload a clear photo of your face.');
    }

    this.logger.log(`Generating descriptors for all ${result.faceCount} detected faces`);
    return result.embeddings;
  }

  /**
   * Check if models are loaded
   */
  isModelsLoaded(): boolean {
    return this.modelsLoaded;
  }

  private async downloadModels(modelsDir: string): Promise<void> {
    const MODELS = [
      'ssd_mobilenetv1_model-weights_manifest.json',
      'ssd_mobilenetv1_model-shard1',
      'ssd_mobilenetv1_model-shard2',
      'tiny_face_detector_model-weights_manifest.json',
      'tiny_face_detector_model-shard1',
      'mtcnn_model-weights_manifest.json',
      'mtcnn_model-shard1',
      'face_landmark_68_model-weights_manifest.json',
      'face_landmark_68_model-shard1',
      'face_recognition_model-weights_manifest.json',
      'face_recognition_model-shard1',
      'face_recognition_model-shard2'
    ];

    const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

    try {
      await fs.mkdir(modelsDir, { recursive: true });
      this.logger.log(`Created models directory: ${modelsDir}`);

      for (const model of MODELS) {
        const filePath = path.join(modelsDir, model);
        try {
          await fs.access(filePath);
          this.logger.log(`File already exists: ${model}`);
        } catch (e) {
          this.logger.log(`Downloading: ${model}...`);
          await this.downloadFile(BASE_URL + model, filePath);
        }
      }
      this.logger.log('All models downloaded successfully');
    } catch (error) {
      this.logger.error(`Failed to download models: ${error.message}`);
      throw new Error(`Face recognition models could not be found or downloaded. Please manually upload the 'models' folder to ${modelsDir}.`);
    }
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = createWriteStream(dest);
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        file.close();
        fs.unlink(dest).catch(() => {});
        reject(err);
      });
    });
  }
}
