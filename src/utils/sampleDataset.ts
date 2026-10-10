import type { CropLifecycleStage, AgriculturalField, DroneImage } from '../types';

export interface SampleDatasetRow {
  farmerName: string;
  farmerPhone: string;
  farmerEmail: string;
  farmerAddress: string;
  village: string;
  district: string;
  state: string;
  landOwnership: string;
  policyNumber: string;
  fieldName: string;
  cropType: AgriculturalField['cropType'];
  cropVariety: string;
  areaAcres: number;
  latitude: number;
  longitude: number;
  sowingDate: string;
  expectedHarvestDate: string;
  soilType: string;
  cropStage: CropLifecycleStage;
  damageScenario: NonNullable<DroneImage['damageScenario']>;
  damageSeverity: 'Low' | 'Moderate' | 'High';
  captureDate: string;
  notes: string;
}

const requiredHeaders = [
  'farmer_name', 'farmer_phone', 'farmer_email', 'farmer_address',
  'village', 'district', 'state', 'land_ownership', 'policy_number',
  'field_name', 'crop_type', 'crop_variety', 'area_acres', 'latitude',
  'longitude', 'sowing_date', 'expected_harvest_date', 'soil_type',
  'crop_stage', 'damage_scenario', 'damage_severity', 'capture_date', 'notes',
];

const cropTypes: AgriculturalField['cropType'][] = [
  'Paddy (Rice)', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Soybean',
];
const cropStages: CropLifecycleStage[] = [
  'empty_land', 'land_prep', 'seed_sowing', 'germination', 'early_growth',
  'vegetative', 'flowering', 'maturity', 'pre_harvest', 'harvest',
];
const damageTypes: NonNullable<DroneImage['damageScenario']>[] = [
  'None', 'Flooding', 'Drought', 'Pest Infestation', 'Disease Blight', 'Physical Lodging',
];
const severities: SampleDatasetRow['damageSeverity'][] = ['Low', 'Moderate', 'High'];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted value.');
  row.push(cell.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

export function parseSampleDataset(text: string): SampleDatasetRow[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('CSV must include a header and at least one data row.');

  const headers = rows[0].map((header) => header.toLowerCase());
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`CSV is missing required columns: ${missing.join(', ')}`);

  return rows.slice(1).map((cells, rowIndex) => {
    if (cells.length !== headers.length) {
      throw new Error(`Row ${rowIndex + 2} has ${cells.length} values; expected ${headers.length}.`);
    }
    const values = Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
    const numberValue = (key: string) => {
      const value = Number(values[key]);
      if (!Number.isFinite(value)) throw new Error(`Row ${rowIndex + 2}: "${key}" must be a number.`);
      return value;
    };

    const cropType = values.crop_type as AgriculturalField['cropType'];
    const cropStage = values.crop_stage as CropLifecycleStage;
    const damageScenario = values.damage_scenario as NonNullable<DroneImage['damageScenario']>;
    const damageSeverity = values.damage_severity as SampleDatasetRow['damageSeverity'];
    if (!cropTypes.includes(cropType)) throw new Error(`Row ${rowIndex + 2}: unsupported crop_type "${values.crop_type}".`);
    if (!cropStages.includes(cropStage)) throw new Error(`Row ${rowIndex + 2}: unsupported crop_stage "${values.crop_stage}".`);
    if (!damageTypes.includes(damageScenario)) throw new Error(`Row ${rowIndex + 2}: unsupported damage_scenario "${values.damage_scenario}".`);
    if (!severities.includes(damageSeverity)) throw new Error(`Row ${rowIndex + 2}: damage_severity must be Low, Moderate, or High.`);

    const requiredText = ['farmer_name', 'farmer_email', 'village', 'district', 'state', 'policy_number', 'field_name', 'crop_variety'];
    const blank = requiredText.find((key) => !values[key]);
    if (blank) throw new Error(`Row ${rowIndex + 2}: "${blank}" cannot be blank.`);
    const areaAcres = numberValue('area_acres');
    const latitude = numberValue('latitude');
    const longitude = numberValue('longitude');
    if (areaAcres <= 0) throw new Error(`Row ${rowIndex + 2}: area_acres must be greater than 0.`);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error(`Row ${rowIndex + 2}: coordinates are outside valid latitude/longitude ranges.`);
    }

    return {
      farmerName: values.farmer_name,
      farmerPhone: values.farmer_phone,
      farmerEmail: values.farmer_email,
      farmerAddress: values.farmer_address,
      village: values.village,
      district: values.district,
      state: values.state,
      landOwnership: values.land_ownership,
      policyNumber: values.policy_number,
      fieldName: values.field_name,
      cropType,
      cropVariety: values.crop_variety,
      areaAcres,
      latitude,
      longitude,
      sowingDate: values.sowing_date,
      expectedHarvestDate: values.expected_harvest_date,
      soilType: values.soil_type,
      cropStage,
      damageScenario,
      damageSeverity,
      captureDate: values.capture_date,
      notes: values.notes,
    };
  });
}
