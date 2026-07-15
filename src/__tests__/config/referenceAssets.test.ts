import {
  getDiseaseImage,
  getPestImage,
  getPlantImage,
  PLANT_IMAGE_ALIASES,
  slugifyReferenceKey,
} from '@/config/referenceAssets';
import { DISEASE_IMAGES, PEST_IMAGES, PLANT_IMAGES } from '@/config/referenceImages.gen';
import { getAllDiseases } from '@/config/diseases';
import { getAllPests } from '@/config/pests';
import { getKnownPlantNames } from '@/utils/plantHelpers';

describe('slugifyReferenceKey', () => {
  it('lowercases and replaces separators with underscores', () => {
    expect(slugifyReferenceKey('Aloe Vera')).toBe('aloe_vera');
    expect(slugifyReferenceKey('Ladies Finger')).toBe('ladies_finger');
    expect(slugifyReferenceKey('Pasalai Keerai')).toBe('pasalai_keerai');
  });

  it('trims whitespace and strips punctuation', () => {
    expect(slugifyReferenceKey('  Tomato  ')).toBe('tomato');
    expect(slugifyReferenceKey("Farmer's Choice!")).toBe('farmer_s_choice');
    expect(slugifyReferenceKey('--Chilli--')).toBe('chilli');
  });
});

describe('image resolvers', () => {
  it('return undefined for unknown ids/names', () => {
    expect(getPestImage('not_a_real_pest')).toBeUndefined();
    expect(getDiseaseImage('not_a_real_disease')).toBeUndefined();
    expect(getPlantImage('Not A Real Plant')).toBeUndefined();
  });

  it('return undefined when imageAsset override is also unknown', () => {
    expect(getPestImage('aphids', 'no_such_asset')).toBeUndefined();
    expect(getDiseaseImage('powdery_mildew', 'no_such_asset')).toBeUndefined();
  });

  it('resolve every bundled pest/disease image by its id', () => {
    for (const id of Object.keys(PEST_IMAGES)) {
      expect(getPestImage(id)).toBeDefined();
    }
    for (const id of Object.keys(DISEASE_IMAGES)) {
      expect(getDiseaseImage(id)).toBeDefined();
    }
  });
});

describe('generated map integrity (gen file must match config ids)', () => {
  it('every PEST_IMAGES key is a known pest id or imageAsset', () => {
    const known = new Set<string>();
    for (const p of getAllPests()) {
      known.add(p.id);
      if (p.imageAsset) known.add(p.imageAsset);
    }
    for (const key of Object.keys(PEST_IMAGES)) {
      expect(known).toContain(key);
    }
  });

  it('every DISEASE_IMAGES key is a known disease id or imageAsset', () => {
    const known = new Set<string>();
    for (const d of getAllDiseases()) {
      known.add(d.id);
      if (d.imageAsset) known.add(d.imageAsset);
    }
    for (const key of Object.keys(DISEASE_IMAGES)) {
      expect(known).toContain(key);
    }
  });

  it('every PLANT_IMAGES key is a canonical slug of a known plant name', () => {
    const canonical = new Set(
      getKnownPlantNames().map((name) => {
        const slug = slugifyReferenceKey(name);
        return PLANT_IMAGE_ALIASES[slug] ?? slug;
      })
    );
    for (const key of Object.keys(PLANT_IMAGES)) {
      expect(canonical).toContain(key);
    }
  });
});

describe('PLANT_IMAGE_ALIASES', () => {
  it('maps slugs of known plant names to canonical slugs of known plant names', () => {
    const slugs = new Set(getKnownPlantNames().map(slugifyReferenceKey));
    for (const [alias, canonical] of Object.entries(PLANT_IMAGE_ALIASES)) {
      expect(slugs).toContain(alias);
      expect(slugs).toContain(canonical);
      expect(alias).not.toBe(canonical);
    }
  });

  it('resolves aliased plant names to the same image slot as the canonical name', () => {
    expect(getPlantImage('Eggplant')).toBe(getPlantImage('Brinjal'));
    expect(getPlantImage('Long Brinjal')).toBe(getPlantImage('Brinjal'));
    expect(getPlantImage('Maize')).toBe(getPlantImage('Corn'));
  });
});
