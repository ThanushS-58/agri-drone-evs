import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Camera, 
  Plane, 
  Compass, 
  BatteryCharging, 
  Crosshair, 
  Gauge, 
  Layers, 
  CheckCircle2, 
  Check, 
  MapPin,
  Sparkles
} from 'lucide-react';
import { AgriculturalField, DroneImage } from '../types';
import { generateAerialDroneImageUrl } from '../utils/droneImageFactory';

interface DroneMonitoringProps {
  field: AgriculturalField;
  onImageCaptured: (image: Omit<DroneImage, 'id'>) => void;
  onJumpToAnalysis: () => void;
}

interface Waypoint {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  captured: boolean;
}

export const DroneMonitoring: React.FC<DroneMonitoringProps> = ({
  field,
  onImageCaptured,
  onJumpToAnalysis,
}) => {
  // Flight state
  const [flightStatus, setFlightStatus] = useState<'IDLE' | 'FLYING' | 'PAUSED' | 'COMPLETED'>('IDLE');
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(0);
  const [dronePos, setDronePos] = useState<{ x: number; y: number }>({ x: 15, y: 18 });
  const [droneAngle, setDroneAngle] = useState<number>(0);
  const [altitudeMeters, setAltitudeMeters] = useState<number>(45);
  const [batteryLevel, setBatteryLevel] = useState<number>(98);
  const [flightSpeedMs, setFlightSpeedMs] = useState<number>(5.2);
  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [latestSnapshot, setLatestSnapshot] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  // Position and waypoint tracker refs to prevent state updates inside updater callbacks
  const dronePosRef = useRef({ x: 15, y: 18 });
  const wpIndexRef = useRef(0);

  // Pre-configured lawnmower survey path across the agricultural field
  const waypoints = useRef<Waypoint[]>([
    { x: 15, y: 18, captured: false },
    { x: 45, y: 18, captured: false },
    { x: 80, y: 18, captured: false },
    { x: 85, y: 38, captured: false },
    { x: 50, y: 38, captured: false },
    { x: 15, y: 38, captured: false },
    { x: 15, y: 62, captured: false },
    { x: 52, y: 62, captured: false },
    { x: 85, y: 62, captured: false },
    { x: 82, y: 84, captured: false },
    { x: 48, y: 84, captured: false },
    { x: 15, y: 84, captured: false },
  ]);

  // Simulation tick timer
  useEffect(() => {
    if (flightStatus !== 'FLYING') return;

    const interval = setInterval(() => {
      const idx = wpIndexRef.current;
      const targetWp = waypoints.current[idx];

      if (!targetWp) {
        setFlightStatus('COMPLETED');
        return;
      }

      const curPos = dronePosRef.current;
      const dx = targetWp.x - curPos.x;
      const dy = targetWp.y - curPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        // Reached waypoint!
        if (!targetWp.captured) {
          targetWp.captured = true;
          triggerAutoCapture(targetWp.x, targetWp.y);
        }

        const nextIdx = idx + 1;
        if (nextIdx >= waypoints.current.length) {
          setFlightStatus('COMPLETED');
        } else {
          wpIndexRef.current = nextIdx;
          setCurrentWaypointIndex(nextIdx);
        }
        return;
      }

      // Step towards waypoint
      const step = 2.5;
      const angle = Math.atan2(dy, dx);
      const nextPos = {
        x: curPos.x + Math.cos(angle) * step,
        y: curPos.y + Math.sin(angle) * step,
      };

      dronePosRef.current = nextPos;
      setDronePos(nextPos);
      setDroneAngle(angle);
      setBatteryLevel((b) => Math.max(12, Number((b - 0.05).toFixed(1))));
    }, 120);

    return () => clearInterval(interval);
  }, [flightStatus]);

  // Auto capture snapshot at waypoint
  const triggerAutoCapture = (xPct: number, yPct: number) => {
    // Camera shutter flash
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 250);

    // Determine damage scenario based on location
    const scenario = field.monitoringStatus === 'Critical Damage' 
      ? 'Flooding' 
      : field.monitoringStatus === 'Needs Review' 
      ? 'Pest Infestation' 
      : 'None';

    const snapUrl = generateAerialDroneImageUrl({
      cropType: field.cropType,
      stage: field.currentCropStage,
      damageType: scenario as any,
      severityLevel: scenario === 'None' ? 'None' : 'Moderate',
    });

    setLatestSnapshot(snapUrl);
    setCapturedCount((c) => c + 1);

    const latOffset = (yPct / 100 - 0.5) * 0.003;
    const lngOffset = (xPct / 100 - 0.5) * 0.003;

    setTimeout(() => {
      onImageCaptured({
        fieldId: field.id,
        farmerId: field.farmerId,
        captureDate: new Date().toISOString().split('T')[0],
        captureTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latitude: Number((field.latitude + latOffset).toFixed(6)),
        longitude: Number((field.longitude + lngOffset).toFixed(6)),
        cropStage: field.currentCropStage,
        imageSource: 'Simulation',
        resolution: '3840 x 2160 (4K Ultra-HD)',
        imageUrl: snapUrl,
        notes: `Autonomous drone flight waypoint ortho-capture. AGL: ${altitudeMeters}m, Speed: ${flightSpeedMs} m/s.`,
        damageScenario: scenario as any,
      });
    }, 0);
  };


  // Manual image capture button
  const handleManualCapture = () => {
    triggerAutoCapture(dronePos.x, dronePos.y);
  };

  const handleStartDrone = () => {
    setFlightStatus('FLYING');
  };

  const handlePauseDrone = () => {
    setFlightStatus('PAUSED');
  };

  const handleResumeDrone = () => {
    setFlightStatus('FLYING');
  };

  const handleResetDrone = () => {
    setFlightStatus('IDLE');
    dronePosRef.current = { x: 15, y: 18 };
    setDronePos({ x: 15, y: 18 });
    wpIndexRef.current = 0;
    setCurrentWaypointIndex(0);
    setBatteryLevel(98);
    waypoints.current.forEach((wp) => (wp.captured = false));
  };

  const progressPercent = Math.min(
    100,
    Math.round((waypoints.current.filter((w) => w.captured).length / waypoints.current.length) * 100)
  );

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Autonomous Drone Field Survey Simulator
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
              DRONE-UAV-X4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time autonomous aerial path planning, orthomosaic grid sweep, and multispectral camera capture for {field.name}.
          </p>
        </div>

        {/* Flight Control Buttons */}
        <div className="flex items-center gap-2">
          {flightStatus === 'IDLE' && (
            <button
              onClick={handleStartDrone}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition shadow-md shadow-emerald-950"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START DRONE</span>
            </button>
          )}

          {flightStatus === 'FLYING' && (
            <button
              onClick={handlePauseDrone}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 transition"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>PAUSE</span>
            </button>
          )}

          {flightStatus === 'PAUSED' && (
            <button
              onClick={handleResumeDrone}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>RESUME</span>
            </button>
          )}

          <button
            onClick={handleManualCapture}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition"
            title="Trigger instant high-resolution orthophoto capture"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">CAPTURE IMAGE</span>
          </button>

          <button
            onClick={handleResetDrone}
            className="p-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Reset flight coordinates to home base"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Interactive Field Canvas (8 cols) */}
        <div className="lg:col-span-8 p-4 sm:p-5 relative border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="relative w-full aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none shadow-inner">
            {/* Top-down Field Texture Background */}
            <div 
              className="absolute inset-0 opacity-80"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 80%),
                  linear-gradient(to right, rgba(40, 70, 50, 0.4) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(40, 70, 50, 0.4) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 36px 36px, 36px 36px',
                backgroundColor: '#142217',
              }}
            />

            {/* Field Boundary Polygon */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polygon
                points="40,30 750,45 720,540 60,520"
                fill="rgba(34, 197, 94, 0.08)"
                stroke="rgba(74, 222, 128, 0.6)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />

              {/* Planned Flight Path (Lawnmower pattern) */}
              <polyline
                points={waypoints.current.map((w) => `${(w.x * 8).toFixed(0)},${(w.y * 6).toFixed(0)}`).join(' ')}
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Waypoints */}
              {waypoints.current.map((wp, idx) => (
                <g key={idx} transform={`translate(${(wp.x * 8).toFixed(0)}, ${(wp.y * 6).toFixed(0)})`}>
                  <circle
                    r={wp.captured ? '6' : '4'}
                    fill={wp.captured ? '#22c55e' : 'rgba(255, 255, 255, 0.4)'}
                    stroke={wp.captured ? '#ffffff' : '#22c55e'}
                    strokeWidth="1.5"
                  />
                  {wp.captured && (
                    <text
                      y="-8"
                      textAnchor="middle"
                      fill="#86efac"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      ✓
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Camera FOV Projection on Ground */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg pointer-events-none transition-all duration-100"
              style={{
                left: `${dronePos.x}%`,
                top: `${dronePos.y}%`,
                width: '120px',
                height: '90px',
                background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.35) 0%, rgba(34, 197, 94, 0.05) 70%, transparent 100%)',
                border: '1px dashed rgba(74, 222, 128, 0.7)',
                transform: `translate(-50%, -50%) rotate(${droneAngle}rad)`,
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            {/* Drone Quadcopter Physical Model (animated rotating rotors) */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 z-20"
              style={{
                left: `${dronePos.x}%`,
                top: `${dronePos.y}%`,
                transform: `translate(-50%, -50%) rotate(${droneAngle + 0.3}rad)`,
              }}
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Drone X-Body */}
                <div className="absolute w-10 h-2 bg-slate-200 rounded-full shadow-md" />
                <div className="absolute w-2 h-10 bg-slate-200 rounded-full shadow-md" />
                {/* Central Body / Gimbal */}
                <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center z-10 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </div>
                {/* 4 Spinning Rotor Blades */}
                <div className={`absolute -top-1 -left-1 w-4 h-4 rounded-full border border-emerald-400/80 ${flightStatus === 'FLYING' ? 'animate-spin' : ''}`} />
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border border-emerald-400/80 ${flightStatus === 'FLYING' ? 'animate-spin' : ''}`} />
                <div className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border border-emerald-400/80 ${flightStatus === 'FLYING' ? 'animate-spin' : ''}`} />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-emerald-400/80 ${flightStatus === 'FLYING' ? 'animate-spin' : ''}`} />
              </div>
            </div>

            {/* Camera Flash Animation */}
            {flashActive && (
              <div className="absolute inset-0 bg-white/70 animate-fadeOut pointer-events-none z-30" />
            )}

            {/* Real-time Telemetry HUD Watermark */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-0.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>FLIGHT STATUS: {flightStatus}</span>
              </div>
              <div>LAT: {(field.latitude + (dronePos.y / 100 - 0.5) * 0.003).toFixed(6)}° N</div>
              <div>LNG: {(field.longitude + (dronePos.x / 100 - 0.5) * 0.003).toFixed(6)}° E</div>
              <div>ALT: {altitudeMeters}m AGL | SPD: {flightSpeedMs} m/s</div>
            </div>

            {/* Waypoint Progress Overlay */}
            <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-800 text-right">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Survey Coverage</span>
              <span className="text-base font-black text-emerald-400 font-mono">{progressPercent}%</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {waypoints.current.filter((w) => w.captured).length} / {waypoints.current.length} Waypoints
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span>* Autonomous lawnmower flight pattern configured for {field.areaAcres} acres boundary</span>
            <span className="text-slate-500">Camera: Sony RX1R II 42.4MP GSD 1.4cm</span>
          </p>
        </div>

        {/* Right: Drone Live Sensor Data & Latest Captures (4 cols) */}
        <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-slate-900/60">
          {/* Telemetry Gauge Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Telemetry Feed</span>
              <span className="text-[10px] font-mono text-emerald-400">915 MHz Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  Battery
                </span>
                <span className="text-lg font-bold text-white font-mono">{batteryLevel}%</span>
                <span className="text-[10px] text-slate-400 block">Est: 24 mins remaining</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  Altitude
                </span>
                <span className="text-lg font-bold text-white font-mono">{altitudeMeters}m</span>
                <span className="text-[10px] text-slate-400 block">AGL (Above Ground)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  Shutter Captures
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{capturedCount}</span>
                <span className="text-[10px] text-slate-400 block">4K RAW + GeoTIFF</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  RTK Precision
                </span>
                <span className="text-lg font-bold text-white font-mono">± 1.2 cm</span>
                <span className="text-[10px] text-emerald-400 block">RTK Fix Active</span>
              </div>
            </div>
          </div>

          {/* Latest Captured Snapshot Preview */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/50">
              <span className="text-xs font-bold text-slate-300">Latest Captured Orthomosaic</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {latestSnapshot ? 'STORED' : 'PENDING'}
              </span>
            </div>

            {latestSnapshot ? (
              <div className="space-y-2">
                <div className="w-full aspect-[16/10] bg-black rounded-lg overflow-hidden border border-slate-700">
                  <img src={latestSnapshot} alt="Latest Drone Capture" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Resolution: 3840 x 2160</span>
                  <button
                    onClick={onJumpToAnalysis}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>Run AI Analysis</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                <Camera className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                Press START DRONE or CAPTURE IMAGE to acquire field ortho-imagery.
              </div>
            )}
          </div>

          {/* Jump to Analysis CTA */}
          {capturedCount > 0 && (
            <button
              onClick={onJumpToAnalysis}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Proceed to AI Damage Analysis ({capturedCount} Captured)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
