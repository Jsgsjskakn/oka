/**
 * THE GOLDEN OAK — VALIDATED DISH ASSET MANIFEST (PHASE 7)
 * Agent 1 & Agent 2: 3D Food Model Engineer, Authenticity Auditor & Visual Fidelity Specialist
 *
 * Generated from scripts/phase5-build-dish-manifest.mjs.
 * Ground-truth verified metadata for all 22 menu dishes + golden-oak-signature-burger (23 canonical entries).
 *
 * Metric Integrity:
 * - Triangle counts, vertex counts, draw calls: physically measured from binary GLB buffers.
 * - Draco decode duration: physically measured via Google draco3d WASM in Node.js runtime.
 * - Units: strictly 1 world unit = 1 metre (+Y up, canonical footprint-centred ground contact).
 * - Colour pipeline: Khronos PBR Neutral (NeutralToneMapping, SRGBColorSpace, exposure 1.0).
 * - Authenticity honesty: only visually verified dish-specific models are marked authentic-dedicated.
 */

import type { CulinaryMaterialCategory } from './model-config';

export type DishAuthenticityClassification =
  | 'authentic-dedicated'
  | 'duplicate-primary-mesh'
  | 'same-family-variant'
  | 'cross-recipe-stand-in'
  | 'untextured-generic-placeholder';

export interface PbrMaterialAuditSummary {
  zeroMetallicVerified: boolean;
  roughnessRange: [number, number];
  zeroEmissiveVerified: boolean;
  textureSlotsCount: number;
}

export interface BoundingBox3D {
  min: [number, number, number];
  max: [number, number, number];
  width: number;
  height: number;
  depth: number;
}

export interface LodProfileMetrics {
  path: string;
  sizeBytes: number;
  sizeKb: number;
  triangleCount: number;
  vertexCount: number;
  drawCalls: number;
  materialsCount: number;
  texturesCount: number;
  hasUVs: boolean;
  bboxM: BoundingBox3D;
  dracoDecodeTimeMs: number;
  estimatedGpuMemoryBytes: number;
  estimatedGpuMemoryMb: number;
}

export interface UsdzAssetMetrics {
  path: string;
  sizeBytes: number;
  sizeKb: number;
  format: 'usdz';
  validZip: boolean;
}

export interface DishAssetManifestEntry {
  dishId: string;
  modelName: string;
  assetVersion: string;
  units: 'meters';
  culinaryCategory: CulinaryMaterialCategory;
  secondaryCategories: CulinaryMaterialCategory[];
  isSharedPlaceholder: boolean;
  authenticityClassification: DishAuthenticityClassification;
  authenticityVerified: boolean;
  sourceBlendAsset: string | null;
  plateDiameterCm: number;
  pbrMaterialAudit: PbrMaterialAuditSummary;
  missingIngredientsOrLimitations: string[];
  dimensionSource: 'estimated-typical-portion' | 'caliper-measured';
  dimensions: {
    widthCm: number;
    depthCm: number;
    heightCm: number;
  };
  modelScaleFactor: number;
  groundContactValidated: boolean;
  colorValidated: boolean;
  scaleValidated: boolean;
  canonicalOrigin: 'footprint-centre-ground-contact';
  profiles: {
    high: LodProfileMetrics;
    balanced: LodProfileMetrics;
    ultraLight: LodProfileMetrics;
    usdz: UsdzAssetMetrics;
  };
}

export const DISH_ASSET_MANIFEST: Record<string, DishAssetManifestEntry> = {
  "tandoori-paneer-pizza": {
    "dishId": "tandoori-paneer-pizza",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "melted-cheese",
    "secondaryCategories": [
      "bread-crust",
      "glossy-sauce",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "paneer_pizza.blend",
    "plateDiameterCm": 30,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.22,
        0.72
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 6
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated 12-inch pizza sample pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 30,
      "depthCm": 30,
      "heightCm": 3.5
    },
    "modelScaleFactor": 0.125,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/tandoori-paneer-pizza-high.glb",
        "sizeBytes": 540100,
        "sizeKb": 527.44,
        "triangleCount": 43531,
        "vertexCount": 27043,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0,
            -1.2
          ],
          "max": [
            1.1992,
            0.1184,
            1.2
          ],
          "width": 2.3984,
          "height": 0.1184,
          "depth": 2.4
        },
        "dracoDecodeTimeMs": 18.79,
        "estimatedGpuMemoryBytes": 34672604,
        "estimatedGpuMemoryMb": 33.07
      },
      "balanced": {
        "path": "/models/optimized/tandoori-paneer-pizza-balanced.glb",
        "sizeBytes": 256468,
        "sizeKb": 250.46,
        "triangleCount": 22548,
        "vertexCount": 16032,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0.0001,
            -1.2
          ],
          "max": [
            1.1992,
            0.1177,
            1.2
          ],
          "width": 2.3984,
          "height": 0.1175,
          "depth": 2.4
        },
        "dracoDecodeTimeMs": 6.05,
        "estimatedGpuMemoryBytes": 9034818,
        "estimatedGpuMemoryMb": 8.62
      },
      "ultraLight": {
        "path": "/models/optimized/tandoori-paneer-pizza-ultralight.glb",
        "sizeBytes": 123768,
        "sizeKb": 120.87,
        "triangleCount": 9981,
        "vertexCount": 9056,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0.0001,
            -1.2
          ],
          "max": [
            1.1992,
            0.1177,
            1.1988
          ],
          "width": 2.3984,
          "height": 0.1175,
          "depth": 2.3988
        },
        "dracoDecodeTimeMs": 3.01,
        "estimatedGpuMemoryBytes": 2446300,
        "estimatedGpuMemoryMb": 2.33
      },
      "usdz": {
        "path": "/models/optimized/tandoori-paneer-pizza.usdz",
        "sizeBytes": 625578,
        "sizeKb": 610.92,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "chicken-tikka-pizza": {
    "dishId": "chicken-tikka-pizza",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "grilled-meat",
    "secondaryCategories": [
      "melted-cheese",
      "bread-crust",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "chicken_pizza.blend",
    "plateDiameterCm": 30,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.36,
        0.75
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 1
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated 12-inch pizza sample pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 30,
      "depthCm": 30,
      "heightCm": 3.5
    },
    "modelScaleFactor": 0.1253,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/chicken-tikka-pizza-high.glb",
        "sizeBytes": 253464,
        "sizeKb": 247.52,
        "triangleCount": 40959,
        "vertexCount": 21071,
        "drawCalls": 2,
        "materialsCount": 2,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1977,
            -0.0016,
            -1.195
          ],
          "max": [
            1.1965,
            0.0541,
            1.1953
          ],
          "width": 2.3942,
          "height": 0.0557,
          "depth": 2.3904
        },
        "dracoDecodeTimeMs": 14,
        "estimatedGpuMemoryBytes": 6511033,
        "estimatedGpuMemoryMb": 6.21
      },
      "balanced": {
        "path": "/models/optimized/chicken-tikka-pizza-balanced.glb",
        "sizeBytes": 129032,
        "sizeKb": 126.01,
        "triangleCount": 20480,
        "vertexCount": 10747,
        "drawCalls": 2,
        "materialsCount": 2,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1977,
            -0.0016,
            -1.195
          ],
          "max": [
            1.1965,
            0.0541,
            1.1953
          ],
          "width": 2.3942,
          "height": 0.0557,
          "depth": 2.3904
        },
        "dracoDecodeTimeMs": 7.85,
        "estimatedGpuMemoryBytes": 1864535,
        "estimatedGpuMemoryMb": 1.78
      },
      "ultraLight": {
        "path": "/models/optimized/chicken-tikka-pizza-ultralight.glb",
        "sizeBytes": 56760,
        "sizeKb": 55.43,
        "triangleCount": 8190,
        "vertexCount": 4494,
        "drawCalls": 2,
        "materialsCount": 2,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1977,
            -0.0016,
            -1.195
          ],
          "max": [
            1.1965,
            0.0541,
            1.1953
          ],
          "width": 2.3942,
          "height": 0.0557,
          "depth": 2.3904
        },
        "dracoDecodeTimeMs": 3.13,
        "estimatedGpuMemoryBytes": 542385,
        "estimatedGpuMemoryMb": 0.52
      },
      "usdz": {
        "path": "/models/optimized/chicken-tikka-pizza.usdz",
        "sizeBytes": 1219165,
        "sizeKb": 1190.59,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "mushroom-truffle-pizza": {
    "dishId": "mushroom-truffle-pizza",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "melted-cheese",
    "secondaryCategories": [
      "bread-crust",
      "fresh-vegetables",
      "glossy-sauce"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "truffle_mushroom_pizza.blend",
    "plateDiameterCm": 30,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        1,
        1
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 2
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated 12-inch pizza sample pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 30,
      "depthCm": 30,
      "heightCm": 3.5
    },
    "modelScaleFactor": 0.1255,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/mushroom-truffle-pizza-high.glb",
        "sizeBytes": 416188,
        "sizeKb": 406.43,
        "triangleCount": 29340,
        "vertexCount": 16590,
        "drawCalls": 1,
        "materialsCount": 1,
        "texturesCount": 2,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1951,
            0,
            -1.1951
          ],
          "max": [
            1.1954,
            0.0555,
            1.1953
          ],
          "width": 2.3906,
          "height": 0.0555,
          "depth": 2.3904
        },
        "dracoDecodeTimeMs": 6.83,
        "estimatedGpuMemoryBytes": 11888934,
        "estimatedGpuMemoryMb": 11.34
      },
      "balanced": {
        "path": "/models/optimized/mushroom-truffle-pizza-balanced.glb",
        "sizeBytes": 176824,
        "sizeKb": 172.68,
        "triangleCount": 14670,
        "vertexCount": 9189,
        "drawCalls": 1,
        "materialsCount": 1,
        "texturesCount": 2,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1951,
            0,
            -1.1951
          ],
          "max": [
            1.1954,
            0.0552,
            1.1951
          ],
          "width": 2.3906,
          "height": 0.0552,
          "depth": 2.3903
        },
        "dracoDecodeTimeMs": 3.68,
        "estimatedGpuMemoryBytes": 3177570,
        "estimatedGpuMemoryMb": 3.03
      },
      "ultraLight": {
        "path": "/models/optimized/mushroom-truffle-pizza-ultralight.glb",
        "sizeBytes": 70044,
        "sizeKb": 68.4,
        "triangleCount": 6112,
        "vertexCount": 4862,
        "drawCalls": 1,
        "materialsCount": 1,
        "texturesCount": 2,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1951,
            0,
            -1.1951
          ],
          "max": [
            1.195,
            0.055,
            1.1951
          ],
          "width": 2.3901,
          "height": 0.055,
          "depth": 2.3903
        },
        "dracoDecodeTimeMs": 1.66,
        "estimatedGpuMemoryBytes": 891130,
        "estimatedGpuMemoryMb": 0.85
      },
      "usdz": {
        "path": "/models/optimized/mushroom-truffle-pizza.usdz",
        "sizeBytes": 383389,
        "sizeKb": 374.4,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "peri-peri-fiesta-pizza": {
    "dishId": "peri-peri-fiesta-pizza",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "melted-cheese",
    "secondaryCategories": [
      "bread-crust",
      "glossy-sauce",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": true,
    "authenticityClassification": "same-family-variant",
    "authenticityVerified": false,
    "sourceBlendAsset": "paneer_pizza.blend",
    "plateDiameterCm": 30,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.22,
        0.72
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 6
    },
    "missingIngredientsOrLimitations": [
      "Reuses tandoori-paneer-pizza geometry/textures; dedicated peri-peri chicken/chili ring & sweet corn topping scan required"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 30,
      "depthCm": 30,
      "heightCm": 3.5
    },
    "modelScaleFactor": 0.125,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/tandoori-paneer-pizza-high.glb",
        "sizeBytes": 540100,
        "sizeKb": 527.44,
        "triangleCount": 43531,
        "vertexCount": 27043,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0,
            -1.2
          ],
          "max": [
            1.1992,
            0.1184,
            1.2
          ],
          "width": 2.3984,
          "height": 0.1184,
          "depth": 2.4
        },
        "dracoDecodeTimeMs": 9.27,
        "estimatedGpuMemoryBytes": 34672604,
        "estimatedGpuMemoryMb": 33.07
      },
      "balanced": {
        "path": "/models/optimized/tandoori-paneer-pizza-balanced.glb",
        "sizeBytes": 256468,
        "sizeKb": 250.46,
        "triangleCount": 22548,
        "vertexCount": 16032,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0.0001,
            -1.2
          ],
          "max": [
            1.1992,
            0.1177,
            1.2
          ],
          "width": 2.3984,
          "height": 0.1175,
          "depth": 2.4
        },
        "dracoDecodeTimeMs": 5.73,
        "estimatedGpuMemoryBytes": 9034818,
        "estimatedGpuMemoryMb": 8.62
      },
      "ultraLight": {
        "path": "/models/optimized/tandoori-paneer-pizza-ultralight.glb",
        "sizeBytes": 123768,
        "sizeKb": 120.87,
        "triangleCount": 9981,
        "vertexCount": 9056,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0.0001,
            -1.2
          ],
          "max": [
            1.1992,
            0.1177,
            1.1988
          ],
          "width": 2.3984,
          "height": 0.1175,
          "depth": 2.3988
        },
        "dracoDecodeTimeMs": 2.83,
        "estimatedGpuMemoryBytes": 2446300,
        "estimatedGpuMemoryMb": 2.33
      },
      "usdz": {
        "path": "/models/optimized/tandoori-paneer-pizza.usdz",
        "sizeBytes": 625578,
        "sizeKb": 610.92,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "bbq-chicken-overload": {
    "dishId": "bbq-chicken-overload",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "grilled-meat",
    "secondaryCategories": [
      "glossy-sauce",
      "melted-cheese",
      "bread-crust"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "bbq_chicken_overload_pizza.blend",
    "plateDiameterCm": 30,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.14,
        0.72
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 8
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated 12-inch pizza sample pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 30,
      "depthCm": 30,
      "heightCm": 3.5
    },
    "modelScaleFactor": 0.1267,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/bbq-chicken-overload-high.glb",
        "sizeBytes": 1608476,
        "sizeKb": 1570.78,
        "triangleCount": 47969,
        "vertexCount": 63718,
        "drawCalls": 9,
        "materialsCount": 9,
        "texturesCount": 8,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1845,
            0.0045,
            -1.1821
          ],
          "max": [
            1.1834,
            0.2159,
            1.1839
          ],
          "width": 2.3679,
          "height": 0.2114,
          "depth": 2.366
        },
        "dracoDecodeTimeMs": 17.52,
        "estimatedGpuMemoryBytes": 47054846,
        "estimatedGpuMemoryMb": 44.87
      },
      "balanced": {
        "path": "/models/optimized/bbq-chicken-overload-balanced.glb",
        "sizeBytes": 700444,
        "sizeKb": 684.03,
        "triangleCount": 21523,
        "vertexCount": 22185,
        "drawCalls": 9,
        "materialsCount": 9,
        "texturesCount": 8,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1666,
            0.0045,
            -1.1817
          ],
          "max": [
            1.1723,
            0.2101,
            1.1815
          ],
          "width": 2.3389,
          "height": 0.2055,
          "depth": 2.3631
        },
        "dracoDecodeTimeMs": 10.13,
        "estimatedGpuMemoryBytes": 12021066,
        "estimatedGpuMemoryMb": 11.46
      },
      "ultraLight": {
        "path": "/models/optimized/bbq-chicken-overload-ultralight.glb",
        "sizeBytes": 264484,
        "sizeKb": 258.29,
        "triangleCount": 8959,
        "vertexCount": 10012,
        "drawCalls": 9,
        "materialsCount": 9,
        "texturesCount": 8,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0744,
            0.0067,
            -1.1297
          ],
          "max": [
            1.159,
            0.1988,
            1.033
          ],
          "width": 2.2334,
          "height": 0.1921,
          "depth": 2.1627
        },
        "dracoDecodeTimeMs": 4.24,
        "estimatedGpuMemoryBytes": 3169634,
        "estimatedGpuMemoryMb": 3.02
      },
      "usdz": {
        "path": "/models/optimized/bbq-chicken-overload.usdz",
        "sizeBytes": 745321,
        "sizeKb": 727.85,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "classic-smash-burger": {
    "dishId": "classic-smash-burger",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "grilled-meat",
    "secondaryCategories": [
      "melted-cheese",
      "bread-crust",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "chiken_burger.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.38,
        0.44
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 6
    },
    "missingIngredientsOrLimitations": [
      "Shares base burger mesh topology with golden-oak-signature-burger; physical caliper measurement pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 12,
      "depthCm": 12,
      "heightCm": 9.5
    },
    "modelScaleFactor": 0.06,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/classic-smash-burger-high.glb",
        "sizeBytes": 1222580,
        "sizeKb": 1193.93,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 3.44,
        "estimatedGpuMemoryBytes": 33857786,
        "estimatedGpuMemoryMb": 32.29
      },
      "balanced": {
        "path": "/models/optimized/classic-smash-burger-balanced.glb",
        "sizeBytes": 369784,
        "sizeKb": 361.12,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 2.87,
        "estimatedGpuMemoryBytes": 8698250,
        "estimatedGpuMemoryMb": 8.3
      },
      "ultraLight": {
        "path": "/models/optimized/classic-smash-burger-ultralight.glb",
        "sizeBytes": 154260,
        "sizeKb": 150.64,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 2.82,
        "estimatedGpuMemoryBytes": 2408366,
        "estimatedGpuMemoryMb": 2.3
      },
      "usdz": {
        "path": "/models/optimized/classic-smash-burger.usdz",
        "sizeBytes": 703517,
        "sizeKb": 687.03,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "golden-oak-signature-burger": {
    "dishId": "golden-oak-signature-burger",
    "modelName": "Golden Oak Signature Burger",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "grilled-meat",
    "secondaryCategories": [
      "bread-crust",
      "melted-cheese",
      "glossy-sauce",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "duplicate-primary-mesh",
    "authenticityVerified": true,
    "sourceBlendAsset": "chiken_burger.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.38,
        0.44
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 6
    },
    "missingIngredientsOrLimitations": [
      "Uses identical geometry/textures as classic-smash-burger (scaled to 12.5cm vs 12.0cm); dedicated double-patty / gold-leaf garnish sculpture pending"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 12.5,
      "depthCm": 12.5,
      "heightCm": 10.5
    },
    "modelScaleFactor": 0.0625,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/golden-oak-burger-high.glb",
        "sizeBytes": 1222580,
        "sizeKb": 1193.93,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 2.79,
        "estimatedGpuMemoryBytes": 33857786,
        "estimatedGpuMemoryMb": 32.29
      },
      "balanced": {
        "path": "/models/optimized/golden-oak-burger-balanced.glb",
        "sizeBytes": 369784,
        "sizeKb": 361.12,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 3.22,
        "estimatedGpuMemoryBytes": 8698250,
        "estimatedGpuMemoryMb": 8.3
      },
      "ultraLight": {
        "path": "/models/optimized/golden-oak-burger-ultralight.glb",
        "sizeBytes": 154260,
        "sizeKb": 150.64,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 3.31,
        "estimatedGpuMemoryBytes": 2408366,
        "estimatedGpuMemoryMb": 2.3
      },
      "usdz": {
        "path": "/models/optimized/golden-oak-burger.usdz",
        "sizeBytes": 703512,
        "sizeKb": 687.02,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "crispy-paneer-burger": {
    "dishId": "crispy-paneer-burger",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "fried-food",
    "secondaryCategories": [
      "bread-crust",
      "melted-cheese",
      "fresh-vegetables",
      "glossy-sauce"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "paneer_burger.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.14,
        0.58
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 4
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated burger sample pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 12,
      "depthCm": 12,
      "heightCm": 10
    },
    "modelScaleFactor": 0.0608,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/crispy-paneer-burger-high.glb",
        "sizeBytes": 915436,
        "sizeKb": 893.98,
        "triangleCount": 41292,
        "vertexCount": 66160,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9826,
            0,
            -0.9808
          ],
          "max": [
            0.9796,
            1.4613,
            0.9944
          ],
          "width": 1.9622,
          "height": 1.4613,
          "depth": 1.9752
        },
        "dracoDecodeTimeMs": 14.29,
        "estimatedGpuMemoryBytes": 21933396,
        "estimatedGpuMemoryMb": 20.92
      },
      "balanced": {
        "path": "/models/optimized/crispy-paneer-burger-balanced.glb",
        "sizeBytes": 383960,
        "sizeKb": 374.96,
        "triangleCount": 19560,
        "vertexCount": 20081,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9826,
            0,
            -0.9567
          ],
          "max": [
            0.9796,
            1.4013,
            0.9944
          ],
          "width": 1.9622,
          "height": 1.4013,
          "depth": 1.9511
        },
        "dracoDecodeTimeMs": 8.27,
        "estimatedGpuMemoryBytes": 5652080,
        "estimatedGpuMemoryMb": 5.39
      },
      "ultraLight": {
        "path": "/models/optimized/crispy-paneer-burger-ultralight.glb",
        "sizeBytes": 156332,
        "sizeKb": 152.67,
        "triangleCount": 9230,
        "vertexCount": 9996,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9826,
            0,
            -0.9567
          ],
          "max": [
            0.9637,
            1.4013,
            0.9897
          ],
          "width": 1.9463,
          "height": 1.4013,
          "depth": 1.9464
        },
        "dracoDecodeTimeMs": 4.66,
        "estimatedGpuMemoryBytes": 1598281,
        "estimatedGpuMemoryMb": 1.52
      },
      "usdz": {
        "path": "/models/optimized/crispy-paneer-burger.usdz",
        "sizeBytes": 591637,
        "sizeKb": 577.77,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "wok-tossed-chow-mein": {
    "dishId": "wok-tossed-chow-mein",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "glossy-sauce",
    "secondaryCategories": [
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "chowmein_noodles.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.22,
        0.55
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 1
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on stoneware noodle bowl pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 18,
      "depthCm": 18,
      "heightCm": 8
    },
    "modelScaleFactor": 0.0818,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/wok-tossed-chow-mein-high.glb",
        "sizeBytes": 480420,
        "sizeKb": 469.16,
        "triangleCount": 30158,
        "vertexCount": 49712,
        "drawCalls": 8,
        "materialsCount": 8,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0995,
            0,
            -1.0992
          ],
          "max": [
            1.0997,
            1.4784,
            1.0992
          ],
          "width": 2.1992,
          "height": 1.4784,
          "depth": 2.1984
        },
        "dracoDecodeTimeMs": 15.42,
        "estimatedGpuMemoryBytes": 3169483,
        "estimatedGpuMemoryMb": 3.02
      },
      "balanced": {
        "path": "/models/optimized/wok-tossed-chow-mein-balanced.glb",
        "sizeBytes": 270292,
        "sizeKb": 263.96,
        "triangleCount": 12909,
        "vertexCount": 26148,
        "drawCalls": 8,
        "materialsCount": 8,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0993,
            0,
            -1.0976
          ],
          "max": [
            1.0997,
            1.4784,
            1.0992
          ],
          "width": 2.1991,
          "height": 1.4784,
          "depth": 2.1968
        },
        "dracoDecodeTimeMs": 7.51,
        "estimatedGpuMemoryBytes": 2311941,
        "estimatedGpuMemoryMb": 2.2
      },
      "ultraLight": {
        "path": "/models/optimized/wok-tossed-chow-mein-ultralight.glb",
        "sizeBytes": 152452,
        "sizeKb": 148.88,
        "triangleCount": 6538,
        "vertexCount": 14663,
        "drawCalls": 8,
        "materialsCount": 8,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0864,
            0,
            -1.0918
          ],
          "max": [
            1.0997,
            1.4735,
            1.098
          ],
          "width": 2.1862,
          "height": 1.4735,
          "depth": 2.1898
        },
        "dracoDecodeTimeMs": 4.64,
        "estimatedGpuMemoryBytes": 857881,
        "estimatedGpuMemoryMb": 0.82
      },
      "usdz": {
        "path": "/models/optimized/wok-tossed-chow-mein.usdz",
        "sizeBytes": 542766,
        "sizeKb": 530.04,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "dynamite-chilli-potatoes": {
    "dishId": "dynamite-chilli-potatoes",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "fried-food",
    "secondaryCategories": [
      "glossy-sauce",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "_potatoes bolls .blend",
    "plateDiameterCm": 20,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.24,
        0.65
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 3
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on dolsot stone pot pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 20,
      "depthCm": 20,
      "heightCm": 5.5
    },
    "modelScaleFactor": 0.0911,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/dynamite-chilli-potatoes-high.glb",
        "sizeBytes": 742700,
        "sizeKb": 725.29,
        "triangleCount": 32742,
        "vertexCount": 23172,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0974,
            0.0008,
            -1.0974
          ],
          "max": [
            1.0988,
            1.3144,
            1.0987
          ],
          "width": 2.1962,
          "height": 1.3136,
          "depth": 2.1961
        },
        "dracoDecodeTimeMs": 13.57,
        "estimatedGpuMemoryBytes": 17710977,
        "estimatedGpuMemoryMb": 16.89
      },
      "balanced": {
        "path": "/models/optimized/dynamite-chilli-potatoes-balanced.glb",
        "sizeBytes": 298628,
        "sizeKb": 291.63,
        "triangleCount": 16548,
        "vertexCount": 12633,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0887,
            0.004,
            -1.0974
          ],
          "max": [
            1.0987,
            1.3144,
            1.0987
          ],
          "width": 2.1874,
          "height": 1.3103,
          "depth": 2.1961
        },
        "dracoDecodeTimeMs": 6.32,
        "estimatedGpuMemoryBytes": 4696797,
        "estimatedGpuMemoryMb": 4.48
      },
      "ultraLight": {
        "path": "/models/optimized/dynamite-chilli-potatoes-ultralight.glb",
        "sizeBytes": 126840,
        "sizeKb": 123.87,
        "triangleCount": 6704,
        "vertexCount": 6992,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0553,
            0.0281,
            -1.0974
          ],
          "max": [
            1.0987,
            1.3127,
            1.0974
          ],
          "width": 2.1539,
          "height": 1.2847,
          "depth": 2.1949
        },
        "dracoDecodeTimeMs": 2.89,
        "estimatedGpuMemoryBytes": 1312279,
        "estimatedGpuMemoryMb": 1.25
      },
      "usdz": {
        "path": "/models/optimized/dynamite-chilli-potatoes.usdz",
        "sizeBytes": 951389,
        "sizeKb": 929.09,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "keema-masala-pizza": {
    "dishId": "keema-masala-pizza",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "grilled-meat",
    "secondaryCategories": [
      "melted-cheese",
      "bread-crust",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": true,
    "authenticityClassification": "cross-recipe-stand-in",
    "authenticityVerified": false,
    "sourceBlendAsset": "chicken_pizza.blend",
    "plateDiameterCm": 30,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.36,
        0.75
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 1
    },
    "missingIngredientsOrLimitations": [
      "Cross-recipe stand-in borrowing chicken-tikka-pizza asset; dedicated minced spiced lamb keema & green chili topping model required"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 30,
      "depthCm": 30,
      "heightCm": 3.5
    },
    "modelScaleFactor": 0.1253,
    "groundContactValidated": true,
    "colorValidated": false,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/chicken-tikka-pizza-high.glb",
        "sizeBytes": 253464,
        "sizeKb": 247.52,
        "triangleCount": 40959,
        "vertexCount": 21071,
        "drawCalls": 2,
        "materialsCount": 2,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1977,
            -0.0016,
            -1.195
          ],
          "max": [
            1.1965,
            0.0541,
            1.1953
          ],
          "width": 2.3942,
          "height": 0.0557,
          "depth": 2.3904
        },
        "dracoDecodeTimeMs": 13.19,
        "estimatedGpuMemoryBytes": 6511033,
        "estimatedGpuMemoryMb": 6.21
      },
      "balanced": {
        "path": "/models/optimized/chicken-tikka-pizza-balanced.glb",
        "sizeBytes": 129032,
        "sizeKb": 126.01,
        "triangleCount": 20480,
        "vertexCount": 10747,
        "drawCalls": 2,
        "materialsCount": 2,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1977,
            -0.0016,
            -1.195
          ],
          "max": [
            1.1965,
            0.0541,
            1.1953
          ],
          "width": 2.3942,
          "height": 0.0557,
          "depth": 2.3904
        },
        "dracoDecodeTimeMs": 8.75,
        "estimatedGpuMemoryBytes": 1864535,
        "estimatedGpuMemoryMb": 1.78
      },
      "ultraLight": {
        "path": "/models/optimized/chicken-tikka-pizza-ultralight.glb",
        "sizeBytes": 56760,
        "sizeKb": 55.43,
        "triangleCount": 8190,
        "vertexCount": 4494,
        "drawCalls": 2,
        "materialsCount": 2,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1977,
            -0.0016,
            -1.195
          ],
          "max": [
            1.1965,
            0.0541,
            1.1953
          ],
          "width": 2.3942,
          "height": 0.0557,
          "depth": 2.3904
        },
        "dracoDecodeTimeMs": 3.02,
        "estimatedGpuMemoryBytes": 542385,
        "estimatedGpuMemoryMb": 0.52
      },
      "usdz": {
        "path": "/models/optimized/chicken-tikka-pizza.usdz",
        "sizeBytes": 1219165,
        "sizeKb": 1190.59,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "farmhouse-supreme-pizza": {
    "dishId": "farmhouse-supreme-pizza",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "fresh-vegetables",
    "secondaryCategories": [
      "melted-cheese",
      "bread-crust",
      "glossy-sauce"
    ],
    "isSharedPlaceholder": true,
    "authenticityClassification": "cross-recipe-stand-in",
    "authenticityVerified": false,
    "sourceBlendAsset": "paneer_pizza.blend",
    "plateDiameterCm": 30,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.22,
        0.72
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 6
    },
    "missingIngredientsOrLimitations": [
      "Cross-recipe stand-in borrowing tandoori-paneer-pizza asset; dedicated black olive, baby corn & mushroom farmhouse topping model required"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 30,
      "depthCm": 30,
      "heightCm": 3.5
    },
    "modelScaleFactor": 0.125,
    "groundContactValidated": true,
    "colorValidated": false,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/tandoori-paneer-pizza-high.glb",
        "sizeBytes": 540100,
        "sizeKb": 527.44,
        "triangleCount": 43531,
        "vertexCount": 27043,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0,
            -1.2
          ],
          "max": [
            1.1992,
            0.1184,
            1.2
          ],
          "width": 2.3984,
          "height": 0.1184,
          "depth": 2.4
        },
        "dracoDecodeTimeMs": 10.08,
        "estimatedGpuMemoryBytes": 34672604,
        "estimatedGpuMemoryMb": 33.07
      },
      "balanced": {
        "path": "/models/optimized/tandoori-paneer-pizza-balanced.glb",
        "sizeBytes": 256468,
        "sizeKb": 250.46,
        "triangleCount": 22548,
        "vertexCount": 16032,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0.0001,
            -1.2
          ],
          "max": [
            1.1992,
            0.1177,
            1.2
          ],
          "width": 2.3984,
          "height": 0.1175,
          "depth": 2.4
        },
        "dracoDecodeTimeMs": 5.75,
        "estimatedGpuMemoryBytes": 9034818,
        "estimatedGpuMemoryMb": 8.62
      },
      "ultraLight": {
        "path": "/models/optimized/tandoori-paneer-pizza-ultralight.glb",
        "sizeBytes": 123768,
        "sizeKb": 120.87,
        "triangleCount": 9981,
        "vertexCount": 9056,
        "drawCalls": 11,
        "materialsCount": 11,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1992,
            0.0001,
            -1.2
          ],
          "max": [
            1.1992,
            0.1177,
            1.1988
          ],
          "width": 2.3984,
          "height": 0.1175,
          "depth": 2.3988
        },
        "dracoDecodeTimeMs": 3.49,
        "estimatedGpuMemoryBytes": 2446300,
        "estimatedGpuMemoryMb": 2.33
      },
      "usdz": {
        "path": "/models/optimized/tandoori-paneer-pizza.usdz",
        "sizeBytes": 625578,
        "sizeKb": 610.92,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "paneer-royale-burger": {
    "dishId": "paneer-royale-burger",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "fried-food",
    "secondaryCategories": [
      "bread-crust",
      "melted-cheese",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": true,
    "authenticityClassification": "same-family-variant",
    "authenticityVerified": false,
    "sourceBlendAsset": "paneer_burger.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.14,
        0.58
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 4
    },
    "missingIngredientsOrLimitations": [
      "Reuses crispy-paneer-burger asset; dedicated makhani glaze & pickled red onion crown sculpture required"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 12,
      "depthCm": 12,
      "heightCm": 10
    },
    "modelScaleFactor": 0.0608,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/crispy-paneer-burger-high.glb",
        "sizeBytes": 915436,
        "sizeKb": 893.98,
        "triangleCount": 41292,
        "vertexCount": 66160,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9826,
            0,
            -0.9808
          ],
          "max": [
            0.9796,
            1.4613,
            0.9944
          ],
          "width": 1.9622,
          "height": 1.4613,
          "depth": 1.9752
        },
        "dracoDecodeTimeMs": 16.9,
        "estimatedGpuMemoryBytes": 21933396,
        "estimatedGpuMemoryMb": 20.92
      },
      "balanced": {
        "path": "/models/optimized/crispy-paneer-burger-balanced.glb",
        "sizeBytes": 383960,
        "sizeKb": 374.96,
        "triangleCount": 19560,
        "vertexCount": 20081,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9826,
            0,
            -0.9567
          ],
          "max": [
            0.9796,
            1.4013,
            0.9944
          ],
          "width": 1.9622,
          "height": 1.4013,
          "depth": 1.9511
        },
        "dracoDecodeTimeMs": 8.58,
        "estimatedGpuMemoryBytes": 5652080,
        "estimatedGpuMemoryMb": 5.39
      },
      "ultraLight": {
        "path": "/models/optimized/crispy-paneer-burger-ultralight.glb",
        "sizeBytes": 156332,
        "sizeKb": 152.67,
        "triangleCount": 9230,
        "vertexCount": 9996,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9826,
            0,
            -0.9567
          ],
          "max": [
            0.9637,
            1.4013,
            0.9897
          ],
          "width": 1.9463,
          "height": 1.4013,
          "depth": 1.9464
        },
        "dracoDecodeTimeMs": 3.87,
        "estimatedGpuMemoryBytes": 1598281,
        "estimatedGpuMemoryMb": 1.52
      },
      "usdz": {
        "path": "/models/optimized/crispy-paneer-burger.usdz",
        "sizeBytes": 591637,
        "sizeKb": 577.77,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "truffle-mushroom-cheese-burger": {
    "dishId": "truffle-mushroom-cheese-burger",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "melted-cheese",
    "secondaryCategories": [
      "bread-crust",
      "glossy-sauce",
      "fried-food"
    ],
    "isSharedPlaceholder": true,
    "authenticityClassification": "cross-recipe-stand-in",
    "authenticityVerified": false,
    "sourceBlendAsset": "chiken_burger.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.38,
        0.44
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 6
    },
    "missingIngredientsOrLimitations": [
      "Cross-recipe stand-in borrowing classic-smash-burger asset; dedicated sautéed wild mushroom & Swiss cheese melt layer required"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 12,
      "depthCm": 12,
      "heightCm": 10
    },
    "modelScaleFactor": 0.06,
    "groundContactValidated": true,
    "colorValidated": false,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/classic-smash-burger-high.glb",
        "sizeBytes": 1222580,
        "sizeKb": 1193.93,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 3.29,
        "estimatedGpuMemoryBytes": 33857786,
        "estimatedGpuMemoryMb": 32.29
      },
      "balanced": {
        "path": "/models/optimized/classic-smash-burger-balanced.glb",
        "sizeBytes": 369784,
        "sizeKb": 361.12,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 2.87,
        "estimatedGpuMemoryBytes": 8698250,
        "estimatedGpuMemoryMb": 8.3
      },
      "ultraLight": {
        "path": "/models/optimized/classic-smash-burger-ultralight.glb",
        "sizeBytes": 154260,
        "sizeKb": 150.64,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 2.74,
        "estimatedGpuMemoryBytes": 2408366,
        "estimatedGpuMemoryMb": 2.3
      },
      "usdz": {
        "path": "/models/optimized/classic-smash-burger.usdz",
        "sizeBytes": 703517,
        "sizeKb": 687.03,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "hakka-street-chow-mein": {
    "dishId": "hakka-street-chow-mein",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "glossy-sauce",
    "secondaryCategories": [
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": true,
    "authenticityClassification": "same-family-variant",
    "authenticityVerified": false,
    "sourceBlendAsset": "chowmein_noodles.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.22,
        0.55
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 1
    },
    "missingIngredientsOrLimitations": [
      "Reuses wok-tossed-chow-mein asset; dedicated street-style chili garlic oil & bean sprout garnish model required"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 18,
      "depthCm": 18,
      "heightCm": 8
    },
    "modelScaleFactor": 0.0818,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/wok-tossed-chow-mein-high.glb",
        "sizeBytes": 480420,
        "sizeKb": 469.16,
        "triangleCount": 30158,
        "vertexCount": 49712,
        "drawCalls": 8,
        "materialsCount": 8,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0995,
            0,
            -1.0992
          ],
          "max": [
            1.0997,
            1.4784,
            1.0992
          ],
          "width": 2.1992,
          "height": 1.4784,
          "depth": 2.1984
        },
        "dracoDecodeTimeMs": 14.87,
        "estimatedGpuMemoryBytes": 3169483,
        "estimatedGpuMemoryMb": 3.02
      },
      "balanced": {
        "path": "/models/optimized/wok-tossed-chow-mein-balanced.glb",
        "sizeBytes": 270292,
        "sizeKb": 263.96,
        "triangleCount": 12909,
        "vertexCount": 26148,
        "drawCalls": 8,
        "materialsCount": 8,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0993,
            0,
            -1.0976
          ],
          "max": [
            1.0997,
            1.4784,
            1.0992
          ],
          "width": 2.1991,
          "height": 1.4784,
          "depth": 2.1968
        },
        "dracoDecodeTimeMs": 7.68,
        "estimatedGpuMemoryBytes": 2311941,
        "estimatedGpuMemoryMb": 2.2
      },
      "ultraLight": {
        "path": "/models/optimized/wok-tossed-chow-mein-ultralight.glb",
        "sizeBytes": 152452,
        "sizeKb": 148.88,
        "triangleCount": 6538,
        "vertexCount": 14663,
        "drawCalls": 8,
        "materialsCount": 8,
        "texturesCount": 1,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0864,
            0,
            -1.0918
          ],
          "max": [
            1.0997,
            1.4735,
            1.098
          ],
          "width": 2.1862,
          "height": 1.4735,
          "depth": 2.1898
        },
        "dracoDecodeTimeMs": 4.03,
        "estimatedGpuMemoryBytes": 857881,
        "estimatedGpuMemoryMb": 0.82
      },
      "usdz": {
        "path": "/models/optimized/wok-tossed-chow-mein.usdz",
        "sizeBytes": 542766,
        "sizeKb": 530.04,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "golden-chilli-potato": {
    "dishId": "golden-chilli-potato",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "fried-food",
    "secondaryCategories": [
      "glossy-sauce",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": true,
    "authenticityClassification": "same-family-variant",
    "authenticityVerified": false,
    "sourceBlendAsset": "_potatoes bolls .blend",
    "plateDiameterCm": 20,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.24,
        0.65
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 3
    },
    "missingIngredientsOrLimitations": [
      "Reuses dynamite-chilli-potatoes asset; dedicated finger-cut honey-chilli potato fries geometry required"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 20,
      "depthCm": 20,
      "heightCm": 5.5
    },
    "modelScaleFactor": 0.0911,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/dynamite-chilli-potatoes-high.glb",
        "sizeBytes": 742700,
        "sizeKb": 725.29,
        "triangleCount": 32742,
        "vertexCount": 23172,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0974,
            0.0008,
            -1.0974
          ],
          "max": [
            1.0988,
            1.3144,
            1.0987
          ],
          "width": 2.1962,
          "height": 1.3136,
          "depth": 2.1961
        },
        "dracoDecodeTimeMs": 11.94,
        "estimatedGpuMemoryBytes": 17710977,
        "estimatedGpuMemoryMb": 16.89
      },
      "balanced": {
        "path": "/models/optimized/dynamite-chilli-potatoes-balanced.glb",
        "sizeBytes": 298628,
        "sizeKb": 291.63,
        "triangleCount": 16548,
        "vertexCount": 12633,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0887,
            0.004,
            -1.0974
          ],
          "max": [
            1.0987,
            1.3144,
            1.0987
          ],
          "width": 2.1874,
          "height": 1.3103,
          "depth": 2.1961
        },
        "dracoDecodeTimeMs": 6.02,
        "estimatedGpuMemoryBytes": 4696797,
        "estimatedGpuMemoryMb": 4.48
      },
      "ultraLight": {
        "path": "/models/optimized/dynamite-chilli-potatoes-ultralight.glb",
        "sizeBytes": 126840,
        "sizeKb": 123.87,
        "triangleCount": 6704,
        "vertexCount": 6992,
        "drawCalls": 7,
        "materialsCount": 7,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0553,
            0.0281,
            -1.0974
          ],
          "max": [
            1.0987,
            1.3127,
            1.0974
          ],
          "width": 2.1539,
          "height": 1.2847,
          "depth": 2.1949
        },
        "dracoDecodeTimeMs": 2.81,
        "estimatedGpuMemoryBytes": 1312279,
        "estimatedGpuMemoryMb": 1.25
      },
      "usdz": {
        "path": "/models/optimized/dynamite-chilli-potatoes.usdz",
        "sizeBytes": 951389,
        "sizeKb": 929.09,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "truffle-mushroom-risotto": {
    "dishId": "truffle-mushroom-risotto",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "melted-cheese",
    "secondaryCategories": [
      "glossy-sauce",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "truffle_mushroom_risotto.blend",
    "plateDiameterCm": 19,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.22,
        0.42
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 4
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated porcelain risotto bowl pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 19,
      "depthCm": 19,
      "heightCm": 7
    },
    "modelScaleFactor": 0.095,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/truffle-mushroom-risotto-high.glb",
        "sizeBytes": 153020,
        "sizeKb": 149.43,
        "triangleCount": 22840,
        "vertexCount": 11472,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1,
            0,
            -1
          ],
          "max": [
            1,
            0.7368,
            1
          ],
          "width": 2,
          "height": 0.7368,
          "depth": 2
        },
        "dracoDecodeTimeMs": 4.65,
        "estimatedGpuMemoryBytes": 5046834,
        "estimatedGpuMemoryMb": 4.81
      },
      "balanced": {
        "path": "/models/optimized/truffle-mushroom-risotto-balanced.glb",
        "sizeBytes": 124272,
        "sizeKb": 121.36,
        "triangleCount": 12560,
        "vertexCount": 6332,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0019,
            0,
            -1.0019
          ],
          "max": [
            1.0019,
            0.737,
            1.0019
          ],
          "width": 2.0038,
          "height": 0.737,
          "depth": 2.0038
        },
        "dracoDecodeTimeMs": 2.86,
        "estimatedGpuMemoryBytes": 4820674,
        "estimatedGpuMemoryMb": 4.6
      },
      "ultraLight": {
        "path": "/models/optimized/truffle-mushroom-risotto-ultralight.glb",
        "sizeBytes": 101744,
        "sizeKb": 99.36,
        "triangleCount": 6392,
        "vertexCount": 3248,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9971,
            0,
            -0.9971
          ],
          "max": [
            0.9959,
            0.7373,
            0.9971
          ],
          "width": 1.9929,
          "height": 0.7373,
          "depth": 1.9941
        },
        "dracoDecodeTimeMs": 1.56,
        "estimatedGpuMemoryBytes": 4684978,
        "estimatedGpuMemoryMb": 4.47
      },
      "usdz": {
        "path": "/models/optimized/truffle-mushroom-risotto.usdz",
        "sizeBytes": 536053,
        "sizeKb": 523.49,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "butter-chicken-bao": {
    "dishId": "butter-chicken-bao",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "bread-crust",
    "secondaryCategories": [
      "grilled-meat",
      "glossy-sauce"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "butter_chicken_bao.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.2,
        0.68
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 4
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated slate bao platter pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 18,
      "depthCm": 18,
      "heightCm": 7
    },
    "modelScaleFactor": 0.09,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/butter-chicken-bao-high.glb",
        "sizeBytes": 161756,
        "sizeKb": 157.96,
        "triangleCount": 32992,
        "vertexCount": 16542,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1,
            0,
            -1
          ],
          "max": [
            1,
            0.7778,
            1
          ],
          "width": 2,
          "height": 0.7778,
          "depth": 2
        },
        "dracoDecodeTimeMs": 5.99,
        "estimatedGpuMemoryBytes": 4221672,
        "estimatedGpuMemoryMb": 4.03
      },
      "balanced": {
        "path": "/models/optimized/butter-chicken-bao-balanced.glb",
        "sizeBytes": 118984,
        "sizeKb": 116.2,
        "triangleCount": 18144,
        "vertexCount": 9118,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0019,
            -0.0002,
            -1.0019
          ],
          "max": [
            1.0019,
            0.7782,
            1.0019
          ],
          "width": 2.0037,
          "height": 0.7784,
          "depth": 2.0037
        },
        "dracoDecodeTimeMs": 3.84,
        "estimatedGpuMemoryBytes": 3895016,
        "estimatedGpuMemoryMb": 3.71
      },
      "ultraLight": {
        "path": "/models/optimized/butter-chicken-bao-ultralight.glb",
        "sizeBytes": 84876,
        "sizeKb": 82.89,
        "triangleCount": 9236,
        "vertexCount": 4664,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0019,
            -0.0005,
            -1.0019
          ],
          "max": [
            1.0019,
            0.7784,
            1.0019
          ],
          "width": 2.0037,
          "height": 0.7788,
          "depth": 2.0037
        },
        "dracoDecodeTimeMs": 2.07,
        "estimatedGpuMemoryBytes": 3699040,
        "estimatedGpuMemoryMb": 3.53
      },
      "usdz": {
        "path": "/models/optimized/butter-chicken-bao.usdz",
        "sizeBytes": 713005,
        "sizeKb": 696.29,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "dahi-ke-kebab": {
    "dishId": "dahi-ke-kebab",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "fried-food",
    "secondaryCategories": [
      "melted-cheese",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "dahi_ke_kebab.blend",
    "plateDiameterCm": 22,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.2,
        0.54
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 3
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated oval kebab tasting platter pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 22,
      "depthCm": 16,
      "heightCm": 4.5
    },
    "modelScaleFactor": 0.1,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/dahi-ke-kebab-high.glb",
        "sizeBytes": 61180,
        "sizeKb": 59.75,
        "triangleCount": 6092,
        "vertexCount": 3062,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1,
            0,
            -0.7997
          ],
          "max": [
            1.1,
            0.45,
            0.7997
          ],
          "width": 2.2,
          "height": 0.45,
          "depth": 1.5994
        },
        "dracoDecodeTimeMs": 1.31,
        "estimatedGpuMemoryBytes": 2231161,
        "estimatedGpuMemoryMb": 2.13
      },
      "balanced": {
        "path": "/models/optimized/dahi-ke-kebab-balanced.glb",
        "sizeBytes": 47512,
        "sizeKb": 46.4,
        "triangleCount": 3348,
        "vertexCount": 1690,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.102,
            0,
            -0.8012
          ],
          "max": [
            1.102,
            0.4507,
            0.8012
          ],
          "width": 2.2041,
          "height": 0.4507,
          "depth": 1.6024
        },
        "dracoDecodeTimeMs": 0.72,
        "estimatedGpuMemoryBytes": 2170793,
        "estimatedGpuMemoryMb": 2.07
      },
      "ultraLight": {
        "path": "/models/optimized/dahi-ke-kebab-ultralight.glb",
        "sizeBytes": 40316,
        "sizeKb": 39.37,
        "triangleCount": 1704,
        "vertexCount": 868,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.102,
            0,
            -0.8012
          ],
          "max": [
            1.102,
            0.4512,
            0.8012
          ],
          "width": 2.2041,
          "height": 0.4512,
          "depth": 1.6024
        },
        "dracoDecodeTimeMs": 0.43,
        "estimatedGpuMemoryBytes": 2134625,
        "estimatedGpuMemoryMb": 2.04
      },
      "usdz": {
        "path": "/models/optimized/dahi-ke-kebab.usdz",
        "sizeBytes": 161715,
        "sizeKb": 157.92,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "crispy-chilli-babycorn": {
    "dishId": "crispy-chilli-babycorn",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "fried-food",
    "secondaryCategories": [
      "glossy-sauce",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "crispy_chilli_babycorn.blend",
    "plateDiameterCm": 20,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.24,
        0.35
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 3
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on plated shallow ceramic wok dish pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 20,
      "depthCm": 20,
      "heightCm": 5.5
    },
    "modelScaleFactor": 0.1,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/crispy-chilli-babycorn-high.glb",
        "sizeBytes": 88880,
        "sizeKb": 86.8,
        "triangleCount": 13800,
        "vertexCount": 6966,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1,
            0,
            -1
          ],
          "max": [
            1,
            0.55,
            1
          ],
          "width": 2,
          "height": 0.55,
          "depth": 2
        },
        "dracoDecodeTimeMs": 2.99,
        "estimatedGpuMemoryBytes": 2402337,
        "estimatedGpuMemoryMb": 2.29
      },
      "balanced": {
        "path": "/models/optimized/crispy-chilli-babycorn-balanced.glb",
        "sizeBytes": 64828,
        "sizeKb": 63.31,
        "triangleCount": 7586,
        "vertexCount": 3859,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0019,
            0,
            -1.0019
          ],
          "max": [
            1.0019,
            0.548,
            1.0019
          ],
          "width": 2.0037,
          "height": 0.548,
          "depth": 2.0037
        },
        "dracoDecodeTimeMs": 1.82,
        "estimatedGpuMemoryBytes": 2265629,
        "estimatedGpuMemoryMb": 2.16
      },
      "ultraLight": {
        "path": "/models/optimized/crispy-chilli-babycorn-ultralight.glb",
        "sizeBytes": 48424,
        "sizeKb": 47.29,
        "triangleCount": 3862,
        "vertexCount": 1997,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.0019,
            0,
            -1.0019
          ],
          "max": [
            1.0019,
            0.5484,
            1.0019
          ],
          "width": 2.0037,
          "height": 0.5484,
          "depth": 2.0037
        },
        "dracoDecodeTimeMs": 1.02,
        "estimatedGpuMemoryBytes": 2183701,
        "estimatedGpuMemoryMb": 2.08
      },
      "usdz": {
        "path": "/models/optimized/crispy-chilli-babycorn.usdz",
        "sizeBytes": 314387,
        "sizeKb": 307.02,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "dim-sum-platter": {
    "dishId": "dim-sum-platter",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "bread-crust",
    "secondaryCategories": [
      "glossy-sauce",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "dim_sum_platter.blend",
    "plateDiameterCm": 22,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.14,
        0.68
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 4
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on bamboo dim sum steamer basket pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 21,
      "depthCm": 21,
      "heightCm": 6
    },
    "modelScaleFactor": 0.0955,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/dim-sum-platter-high.glb",
        "sizeBytes": 97892,
        "sizeKb": 95.6,
        "triangleCount": 10240,
        "vertexCount": 5138,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1,
            0,
            -1.1
          ],
          "max": [
            1.1,
            0.65,
            1.1
          ],
          "width": 2.2,
          "height": 0.65,
          "depth": 2.2
        },
        "dracoDecodeTimeMs": 2.02,
        "estimatedGpuMemoryBytes": 4768546,
        "estimatedGpuMemoryMb": 4.55
      },
      "balanced": {
        "path": "/models/optimized/dim-sum-platter-balanced.glb",
        "sizeBytes": 83492,
        "sizeKb": 81.54,
        "triangleCount": 5628,
        "vertexCount": 2832,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1021,
            0,
            -1.1021
          ],
          "max": [
            1.1021,
            0.65,
            1.1021
          ],
          "width": 2.2041,
          "height": 0.65,
          "depth": 2.2041
        },
        "dracoDecodeTimeMs": 1.27,
        "estimatedGpuMemoryBytes": 4667082,
        "estimatedGpuMemoryMb": 4.45
      },
      "ultraLight": {
        "path": "/models/optimized/dim-sum-platter-ultralight.glb",
        "sizeBytes": 73200,
        "sizeKb": 71.48,
        "triangleCount": 2864,
        "vertexCount": 1450,
        "drawCalls": 4,
        "materialsCount": 4,
        "texturesCount": 4,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -1.1021,
            0,
            -1.0954
          ],
          "max": [
            1.0954,
            0.65,
            1.1021
          ],
          "width": 2.1975,
          "height": 0.65,
          "depth": 2.1975
        },
        "dracoDecodeTimeMs": 0.77,
        "estimatedGpuMemoryBytes": 4606274,
        "estimatedGpuMemoryMb": 4.39
      },
      "usdz": {
        "path": "/models/optimized/dim-sum-platter.usdz",
        "sizeBytes": 269775,
        "sizeKb": 263.45,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "kaffir-lime-mocktail": {
    "dishId": "kaffir-lime-mocktail",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "beverage",
    "secondaryCategories": [
      "glass-container",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "authentic-dedicated",
    "authenticityVerified": true,
    "sourceBlendAsset": "kaffir_lime_mocktail.blend",
    "plateDiameterCm": 8.5,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.08,
        0.36
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 3
    },
    "missingIngredientsOrLimitations": [
      "Physical caliper measurement on crystal Collins highball tumbler pending (scaleValidated: false)"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 8,
      "depthCm": 8,
      "heightCm": 16
    },
    "modelScaleFactor": 0.0941,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/kaffir-lime-mocktail-high.glb",
        "sizeBytes": 53984,
        "sizeKb": 52.72,
        "triangleCount": 3620,
        "vertexCount": 1830,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.425,
            0,
            -0.3839
          ],
          "max": [
            0.425,
            1.65,
            0.3839
          ],
          "width": 0.85,
          "height": 1.65,
          "depth": 0.7678
        },
        "dracoDecodeTimeMs": 1.12,
        "estimatedGpuMemoryBytes": 3225219,
        "estimatedGpuMemoryMb": 3.08
      },
      "balanced": {
        "path": "/models/optimized/kaffir-lime-mocktail-balanced.glb",
        "sizeBytes": 47316,
        "sizeKb": 46.21,
        "triangleCount": 1988,
        "vertexCount": 1014,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.425,
            0,
            -0.3841
          ],
          "max": [
            0.425,
            1.65,
            0.3841
          ],
          "width": 0.85,
          "height": 1.65,
          "depth": 0.7681
        },
        "dracoDecodeTimeMs": 0.56,
        "estimatedGpuMemoryBytes": 3189315,
        "estimatedGpuMemoryMb": 3.04
      },
      "ultraLight": {
        "path": "/models/optimized/kaffir-lime-mocktail-ultralight.glb",
        "sizeBytes": 43284,
        "sizeKb": 42.27,
        "triangleCount": 1010,
        "vertexCount": 525,
        "drawCalls": 3,
        "materialsCount": 3,
        "texturesCount": 3,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.4246,
            0,
            -0.3832
          ],
          "max": [
            0.4253,
            1.65,
            0.3818
          ],
          "width": 0.8499,
          "height": 1.65,
          "depth": 0.765
        },
        "dracoDecodeTimeMs": 0.33,
        "estimatedGpuMemoryBytes": 3167799,
        "estimatedGpuMemoryMb": 3.02
      },
      "usdz": {
        "path": "/models/optimized/kaffir-lime-mocktail.usdz",
        "sizeBytes": 110371,
        "sizeKb": 107.78,
        "format": "usdz",
        "validZip": true
      }
    }
  },
  "golden-oak-burger": {
    "dishId": "golden-oak-burger",
    "modelName": "3D Interactive Model Showcase [Prototype Asset]",
    "assetVersion": "2.1.0",
    "units": "meters",
    "culinaryCategory": "grilled-meat",
    "secondaryCategories": [
      "bread-crust",
      "melted-cheese",
      "fresh-vegetables"
    ],
    "isSharedPlaceholder": false,
    "authenticityClassification": "duplicate-primary-mesh",
    "authenticityVerified": true,
    "sourceBlendAsset": "chiken_burger.blend",
    "plateDiameterCm": 18,
    "pbrMaterialAudit": {
      "zeroMetallicVerified": true,
      "roughnessRange": [
        0.38,
        0.44
      ],
      "zeroEmissiveVerified": true,
      "textureSlotsCount": 6
    },
    "missingIngredientsOrLimitations": [
      "Canonical archetype alias for golden-oak-signature-burger; shares chiken_burger.blend geometry"
    ],
    "dimensionSource": "estimated-typical-portion",
    "dimensions": {
      "widthCm": 12.5,
      "depthCm": 12.5,
      "heightCm": 10.5
    },
    "modelScaleFactor": 0.0625,
    "groundContactValidated": true,
    "colorValidated": true,
    "scaleValidated": false,
    "canonicalOrigin": "footprint-centre-ground-contact",
    "profiles": {
      "high": {
        "path": "/models/optimized/golden-oak-burger-high.glb",
        "sizeBytes": 1222580,
        "sizeKb": 1193.93,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 2.84,
        "estimatedGpuMemoryBytes": 33857786,
        "estimatedGpuMemoryMb": 32.29
      },
      "balanced": {
        "path": "/models/optimized/golden-oak-burger-balanced.glb",
        "sizeBytes": 369784,
        "sizeKb": 361.12,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 3.03,
        "estimatedGpuMemoryBytes": 8698250,
        "estimatedGpuMemoryMb": 8.3
      },
      "ultraLight": {
        "path": "/models/optimized/golden-oak-burger-ultralight.glb",
        "sizeBytes": 154260,
        "sizeKb": 150.64,
        "triangleCount": 12080,
        "vertexCount": 7477,
        "drawCalls": 13,
        "materialsCount": 3,
        "texturesCount": 6,
        "hasUVs": true,
        "bboxM": {
          "min": [
            -0.9881,
            0,
            -1
          ],
          "max": [
            0.9881,
            1.211,
            1
          ],
          "width": 1.9763,
          "height": 1.211,
          "depth": 2
        },
        "dracoDecodeTimeMs": 2.75,
        "estimatedGpuMemoryBytes": 2408366,
        "estimatedGpuMemoryMb": 2.3
      },
      "usdz": {
        "path": "/models/optimized/golden-oak-burger.usdz",
        "sizeBytes": 703512,
        "sizeKb": 687.02,
        "format": "usdz",
        "validZip": true
      }
    }
  }
};

/**
 * Retrieves the validated asset manifest entry for any dish slug.
 * Falls back to golden-oak-signature-burger if unknown.
 */
export function getDishAssetManifest(dishSlug: string): DishAssetManifestEntry {
  const normalized = (dishSlug || '').toLowerCase();
  return (
    DISH_ASSET_MANIFEST[normalized] ||
    DISH_ASSET_MANIFEST['golden-oak-signature-burger']
  );
}

/**
 * Returns all validated dish slugs in the manifest.
 */
export function getAllManifestDishSlugs(): string[] {
  return Object.keys(DISH_ASSET_MANIFEST);
}
