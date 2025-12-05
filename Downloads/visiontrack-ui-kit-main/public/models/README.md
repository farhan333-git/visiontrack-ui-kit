# Face Detection Models

To enable real face detection, download the pre-trained models from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Required files:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2

Place all files in this `/public/models` directory.

Alternatively, the app will fall back to simulated detection if models are not found.
