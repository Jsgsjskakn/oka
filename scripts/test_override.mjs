// Temporary test check
import { getModelConfig, dishModelOverrides } from '../src/data/model-config.ts';
console.log('Original config:', getModelConfig('golden-oak-signature-burger'));
dishModelOverrides['golden-oak-signature-burger'] = {
  modelPath: '/models/optimized/golden-oak-burger-high.glb',
  lodPaths: {
    high: '/models/optimized/golden-oak-burger-high.glb',
    balanced: '/models/optimized/golden-oak-burger-balanced.glb',
    ultraLight: '/models/optimized/golden-oak-burger-ultralight.glb',
  },
  usdzPath: '/models/optimized/golden-oak-burger.usdz',
  isSharedPlaceholder: false,
  modelName: 'Golden Oak Signature Burger',
};
console.log('Overridden config:', getModelConfig('golden-oak-signature-burger'));
