import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

let objectDetectorImage;
let objectDetectorVideo;
const initializeObjectDetector = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
    objectDetectorImage = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
            delegate: "GPU"
        },
        scoreThreshold: 0.5,
        runningMode: "IMAGE"
    });
    objectDetectorVideo = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
            delegate: "GPU"
        },
        scoreThreshold: 0.5,
        runningMode: "VIDEO"
    });
};
initializeObjectDetector();

async function detectObjectImage(img) {
    if (!objectDetectorImage) {
        return;
    }
    const detections = objectDetectorImage.detect(img);
    let output = [];
    for (let detection of detections.detections) {
      output.push({
        name: detection.categories[0].categoryName,
        score: detection.categories[0].score,
        x: detection.boundingBox.originX,
        y: detection.boundingBox.originY,
        w: detection.boundingBox.width,
        h: detection.boundingBox.height,
      });
    }
    return output;
}
async function detectObjectVideo(vid) {
    if (!objectDetectorVideo) {
        return;
    }
    let startTimeMs = performance.now();
    const detections = objectDetectorVideo.detectForVideo(vid, startTimeMs);
    let output = [];
    for (let detection of detections.detections) {
      output.push({
        name: detection.categories[0].categoryName,
        score: detection.categories[0].score,
        x: detection.boundingBox.originX,
        y: detection.boundingBox.originY,
        w: detection.boundingBox.width,
        h: detection.boundingBox.height,
      });
    }
    return output;
}

window.detectObjectImage = detectObjectImage;
window.detectObjectVideo = detectObjectVideo;