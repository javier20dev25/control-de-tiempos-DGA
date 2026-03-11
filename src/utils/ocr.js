import { createWorker } from 'tesseract.js';
import { sanitizeContainer, validateContainer } from './validation';

export const runOCR = async (videoElement, canvasElement, callback) => {
    const worker = await createWorker('eng');
    await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });

    const captureAndProcess = async () => {
        if (videoElement.paused || videoElement.ended) return;

        const ctx = canvasElement.getContext('2d');
        // Crop ROI (region of interest) - center of the video
        const roiHeight = 100;
        const roiWidth = canvasElement.width * 0.8;
        const roiX = (canvasElement.width - roiWidth) / 2;
        const roiY = (canvasElement.height - roiHeight) / 2;

        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        // Simple preprocessing: Grayscale + Contrast boost
        const imageData = ctx.getImageData(roiX, roiY, roiWidth, roiHeight);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const val = avg > 128 ? 255 : 0; // Thresholding
            data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imageData, roiX, roiY);

        const { data: { text } } = await worker.recognize(canvasElement);
        const sanitized = sanitizeContainer(text);

        // Pattern search: ISO 6346 [A-Z]{4}[0-9]{7}
        const match = sanitized.match(/[A-Z]{4}[0-9]{7}/);
        if (match) {
            const detectedId = match[0];
            if (validateContainer(detectedId)) {
                callback(detectedId);
                await worker.terminate();
                return;
            }
        }

        requestAnimationFrame(captureAndProcess);
    };

    captureAndProcess();
};
