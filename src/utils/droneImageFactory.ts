/**
 * Drone aerial image synthesizer and realistic canvas renderer.
 * Produces crisp, high-resolution aerial agricultural textures:
 * - Healthy lush paddy/wheat/cotton fields
 * - Flood inundated fields with muddy standing water
 * - Drought parched patches with cracked soil
 * - Pest defoliation circular rings
 * - Empty / plowed tilled soil
 */

export interface FieldSceneConfig {
  cropType: string;
  stage: string;
  damageType?: 'None' | 'Flooding' | 'Drought' | 'Pest Infestation' | 'Disease Blight' | 'Physical Lodging';
  severityLevel?: 'None' | 'Low' | 'Moderate' | 'High';
  seed?: number;
}

export function generateAerialDroneImageUrl(config: FieldSceneConfig): string {
  // We render an offscreen canvas to produce a high fidelity 800x600 aerial ortho-mosaic
  const width = 800;
  const height = 600;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const { cropType, stage, damageType = 'None', severityLevel = 'None' } = config;

  // 1. Background field soil base
  let soilHue = 32; // warm earthy brown
  let soilSat = 40;
  let soilLight = 28;

  if (cropType.includes('Cotton')) {
    soilHue = 24; // black/dark brown regur soil
    soilSat = 25;
    soilLight = 20;
  } else if (cropType.includes('Wheat')) {
    soilHue = 38; // alluvial loam
    soilSat = 35;
    soilLight = 32;
  }

  ctx.fillStyle = `hsl(${soilHue}, ${soilSat}%, ${soilLight}%)`;
  ctx.fillRect(0, 0, width, height);

  // Furrows / tractor lines
  ctx.strokeStyle = `hsla(${soilHue}, ${soilSat}%, ${soilLight - 8}%, 0.4)`;
  ctx.lineWidth = 3;
  const furrowAngle = 0.08; // slight ortho tilt
  for (let x = -100; x < width + 100; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height * Math.tan(furrowAngle), height);
    ctx.stroke();
  }

  // 2. Crop Canopy Layer based on stage
  let cropCoverage = 0; // 0 to 1
  let leafGreenHue = 120; // 120 = pure green, 85 = olive/stressed, 48 = golden
  let leafSat = 75;
  let leafLight = 34;

  if (stage === 'empty_land' || stage === 'land_prep') {
    cropCoverage = 0.02;
  } else if (stage === 'seed_sowing') {
    cropCoverage = 0.08;
    leafLight = 40;
  } else if (stage === 'germination' || stage === 'early_growth') {
    cropCoverage = 0.35;
    leafGreenHue = 110;
    leafLight = 42;
  } else if (stage === 'vegetative') {
    cropCoverage = 0.88;
    leafGreenHue = 125;
    leafSat = 82;
    leafLight = 32;
  } else if (stage === 'flowering') {
    cropCoverage = 0.94;
    leafGreenHue = 118;
    leafLight = 38;
  } else if (stage === 'maturity' || stage === 'pre_harvest') {
    cropCoverage = 0.92;
    leafGreenHue = cropType.includes('Wheat') ? 50 : 88; // Golden wheat or mature rice
    leafSat = 65;
    leafLight = 44;
  } else if (stage === 'harvest') {
    cropCoverage = 0.25;
    leafGreenHue = 55;
    leafLight = 36;
  }

  if (cropCoverage > 0.05) {
    // Draw agricultural crop rows
    const rowSpacing = 16;
    for (let r = 0; r < width; r += rowSpacing) {
      ctx.fillStyle = `hsl(${leafGreenHue + (Math.sin(r) * 6)}, ${leafSat}%, ${leafLight}%)`;
      // Draw clusters along the row
      for (let y = 10; y < height; y += 12) {
        if (Math.random() < cropCoverage) {
          ctx.beginPath();
          const rRadius = 6 + Math.random() * 4;
          ctx.arc(r + (Math.sin(y * 0.1) * 3), y, rRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // 3. Inject Damage Artifacts if configured
  if (damageType && damageType !== 'None') {
    const sevFactor = severityLevel === 'High' ? 0.7 : severityLevel === 'Moderate' ? 0.45 : 0.22;

    if (damageType === 'Flooding') {
      // Water inundation: dark murky reflective silt puddles and submerged muddy brown patches
      const numPuddles = severityLevel === 'High' ? 5 : 3;
      for (let i = 0; i < numPuddles; i++) {
        const cx = 200 + (i * 180) + Math.sin(i * 3) * 60;
        const cy = 250 + (i % 2 === 0 ? -70 : 80);
        const rx = (100 + i * 20) * (sevFactor * 1.6);
        const ry = (70 + i * 15) * (sevFactor * 1.5);

        const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, rx);
        grad.addColorStop(0, 'rgba(42, 60, 68, 0.95)'); // deep muddy flood pool
        grad.addColorStop(0.5, 'rgba(84, 94, 62, 0.9)'); // submerged decaying rice stalks
        grad.addColorStop(0.85, 'rgba(128, 120, 70, 0.7)'); // waterlogged saturated fringe
        grad.addColorStop(1, 'rgba(128, 120, 70, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Water specular glint
        ctx.fillStyle = 'rgba(210, 230, 240, 0.25)';
        ctx.beginPath();
        ctx.ellipse(cx - 15, cy - 10, rx * 0.4, ry * 0.25, 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (damageType === 'Drought') {
      // Parched desiccated patches, severe moisture loss, yellow-brown wilting
      const numPatches = severityLevel === 'High' ? 6 : 4;
      for (let i = 0; i < numPatches; i++) {
        const cx = 150 + ((i * 140) % 600);
        const cy = 180 + (Math.floor(i / 2) * 160);
        const rad = 80 * (sevFactor * 1.7);

        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
        grad.addColorStop(0, 'rgba(196, 154, 98, 0.92)'); // bare parched earth
        grad.addColorStop(0.5, 'rgba(215, 178, 92, 0.85)'); // bleached withered straw
        grad.addColorStop(0.85, 'rgba(180, 190, 70, 0.5)'); // chlorotic yellow margin
        grad.addColorStop(1, 'rgba(180, 190, 70, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (damageType === 'Pest Infestation') {
      // Brown spot / bollworm defoliation clusters with necrotic centers
      const numBlightCenters = severityLevel === 'High' ? 8 : 4;
      for (let i = 0; i < numBlightCenters; i++) {
        const cx = 120 + ((i * 170) % 650);
        const cy = 140 + ((i * 130) % 400);
        const rad = (50 + (i % 3) * 20) * (sevFactor * 1.5);

        const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rad);
        grad.addColorStop(0, 'rgba(112, 66, 32, 0.95)'); // necrotic eaten canopy
        grad.addColorStop(0.4, 'rgba(185, 130, 40, 0.85)'); // skeletonized leaves
        grad.addColorStop(0.75, 'rgba(205, 180, 50, 0.6)'); // pest stress halo
        grad.addColorStop(1, 'rgba(205, 180, 50, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (damageType === 'Physical Lodging' || damageType === 'Disease Blight') {
      // Flattened crop rows due to gale storms / lodging
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-0.35);
      const grad = ctx.createLinearGradient(-250, 0, 250, 0);
      grad.addColorStop(0, 'rgba(160, 130, 60, 0.1)');
      grad.addColorStop(0.4, 'rgba(135, 110, 45, 0.88)');
      grad.addColorStop(0.7, 'rgba(120, 95, 35, 0.85)');
      grad.addColorStop(1, 'rgba(160, 130, 60, 0.1)');

      ctx.fillStyle = grad;
      ctx.fillRect(-280, -120 * sevFactor, 560, 240 * sevFactor);
      ctx.restore();
    }
  }

  // 4. Drone Camera OSD / Field Boundary Overlay details
  // Field border canal / path
  ctx.strokeStyle = 'rgba(70, 55, 40, 0.7)';
  ctx.lineWidth = 14;
  ctx.strokeRect(0, 0, width, height);

  // Irrigation canal on left
  ctx.fillStyle = 'rgba(90, 115, 125, 0.75)';
  ctx.fillRect(4, 4, 18, height - 8);

  // Agricultural bund / bund walk
  ctx.fillStyle = 'rgba(175, 150, 115, 0.8)';
  ctx.fillRect(width - 20, 4, 16, height - 8);

  // Subtly stamp coordinate watermarking for telemetry realism
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '11px monospace';
  ctx.fillText('AGRI-DRONE-ORTHO // 4K HIGH RES', 32, height - 16);
  ctx.fillText(`FOV: 84° | GSD: 1.4 cm/px | STAGE: ${stage.toUpperCase()}`, width - 360, height - 16);

  return canvas.toDataURL('image/jpeg', 0.88);
}
