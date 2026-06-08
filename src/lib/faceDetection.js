import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

// URL dos modelos pré-treinados (hospedados em CDN para facilitar)
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export const loadFaceModels = async () => {
  if (modelsLoaded) return;
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('IA: Modelos de detecção facial carregados.');
  } catch (err) {
    console.error('IA: Erro ao carregar modelos faciais:', err);
    throw new Error('Não foi possível carregar o sistema de detecção de rostos.');
  }
};

export const detectFace = async (imageElement) => {
  await loadFaceModels();
  
  // Opções do detector (TinyFaceDetector é o mais rápido)
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5 // Exige pelo menos 50% de confiança
  });

  const detection = await faceapi.detectSingleFace(imageElement, options);
  return !!detection;
};

// Função auxiliar para validar arquivo antes do upload
export const validateImageFace = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = async () => {
      try {
        const hasFace = await detectFace(img);
        URL.revokeObjectURL(img.src);
        resolve(hasFace);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => reject(new Error('Erro ao processar imagem.'));
  });
};

// Função auxiliar para validar imagem já hospedada (via URL)
export const validateImageUrlFace = async (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    
    img.onload = async () => {
      try {
        const hasFace = await detectFace(img);
        resolve(hasFace);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => reject(new Error('Erro ao processar imagem via URL.'));
  });
};
