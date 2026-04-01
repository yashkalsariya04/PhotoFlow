
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const MODELS = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'mtcnn_model-weights_manifest.json',
  'mtcnn_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1'
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dir: undefined, redownload: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dir' && args[i + 1]) {
      out.dir = args[i + 1];
      i++;
    } else if (a === '--redownload' || a === '--force') {
      out.redownload = true;
    }
  }
  return out;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function removeDir(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {}
}

function fileExistsNonEmpty(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function downloadFile(url, dest, attempt = 1) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    req.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  }).catch((err) => {
    if (attempt < 3) {
      return new Promise((r) => setTimeout(r, 500 * attempt)).then(() =>
        downloadFile(url, dest, attempt + 1)
      );
    }
    throw err;
  });
}

async function main() {
  const args = parseArgs();
  const targetDir =
    args.dir ||
    process.env.MODELS_PATH ||
    path.join(__dirname, 'models');

  if (args.redownload) {
    removeDir(targetDir);
  }

  ensureDir(targetDir);

  let downloaded = 0;
  let skipped = 0;
  console.log(`Models directory: ${targetDir}`);

  for (const name of MODELS) {
    const filePath = path.join(targetDir, name);
    const url = BASE_URL + name;
    try {
      if (!args.redownload && fileExistsNonEmpty(filePath)) {
        skipped++;
        continue;
      }
      await downloadFile(url, filePath);
      downloaded++;
      console.log(`Downloaded: ${name}`);
    } catch (e) {
      console.error(`Failed: ${name} -> ${e.message}`);
      process.exitCode = 1;
    }
  }

  console.log(`Done. Downloaded: ${downloaded}, Skipped: ${skipped}`);
}

main();
