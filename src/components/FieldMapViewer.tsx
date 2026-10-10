// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  AgriculturalField,
  Farmer,
  DroneImage,
  InsuranceClaim,
  AIAnalysisResult,
  EnvironmentalEvent,
  EnvironmentalEventType,
  CropLifecycleStage,
} from '../types';
import { calculatePolygonAreaAcres, generateDamageGridInsidePolygon, LatLngPoint } from '../utils/geoUtils';
import {
  MapPin,
  Layers,
  Search,
  Plus,
  Compass,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  CloudRain,
  Waves,
  Sun,
  Bug,
  Biohazard,
  Wind,
  CheckCircle2,
  X,
  Plane,
  FileText,
  Sliders,
  Sparkles,
  Maximize2,
  Undo2,
  Info,
  Eye,
  Crosshair,
  TrendingDown,
  LocateFixed
} from 'lucide-react';

interface FieldMapViewerProps {
  fields: AgriculturalField[];
  farmers: Farmer[];
  images: DroneImage[];
  claims: InsuranceClaim[];
  analyses: AIAnalysisResult[];
  events: EnvironmentalEvent[];
  selectedFieldId: string;
  onSelectField: (fieldId: string) => void;
  onUpdateField: (field: AgriculturalField) => void;
  onAddField: (field: Omit<AgriculturalField, 'id' | 'currentCropStage' | 'monitoringStatus'>) => AgriculturalField;
  onAddEvent?: (event: Omit<EnvironmentalEvent, 'id'>) => void;
  onOpenAnalysisModal?: (field: AgriculturalField) => void;
  onOpenReport?: (claim: InsuranceClaim) => void;
  onNavigateTab?: (tab: any) => void;
  focusedClaimId?: string | null;
}

// Declarative Polygon using Google Maps JS API under the hood
const MapPolygonOverlay: React.FC<{
  path: [number, number][];
  strokeColor: string;
  fillColor: string;
  fillOpacity: number;
  onClick?: () => void;
}> = ({ path, strokeColor, fillColor, fillOpacity, onClick }) => {
  const map = useMap();
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  useEffect(() => {
    if (!map || !path || path.length < 3) return;

    const googlePath = path.map(([lat, lng]) => ({ lat, lng }));

    const polygon = new google.maps.Polygon({
      paths: googlePath,
      strokeColor,
      strokeOpacity: 0.9,
      strokeWeight: 2.5,
      fillColor,
      fillOpacity,
      map,
      clickable: true,
      zIndex: 5,
    });

    polygonRef.current = polygon;

    let listener: google.maps.MapsEventListener | null = null;
    if (onClick) {
      listener = polygon.addListener('click', onClick);
    }

    return () => {
      if (listener) google.maps.event.removeListener(listener);
      polygon.setMap(null);
    };
  }, [map, path, strokeColor, fillColor, fillOpacity, onClick]);

  return null;
};

// Declarative Drawing Polyline preview while user draws boundary
const DrawingPolylinePreview: React.FC<{
  points: LatLngPoint[];
}> = ({ points }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || points.length < 2) {
      if (polylineRef.current) polylineRef.current.setMap(null);
      return;
    }

    const polyline = new google.maps.Polyline({
      path: points,
      strokeColor: '#059669', // Emerald
      strokeOpacity: 0.9,
      strokeWeight: 3,
      map,
      zIndex: 10,
    });
    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
    };
  }, [map, points]);

  return null;
};

// Camera Controller Helper to pan/zoom smoothly
const MapCameraController: React.FC<{
  center: LatLngPoint | null;
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    if (zoom) {
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return null;
};

export const FieldMapViewer: React.FC<FieldMapViewerProps> = ({
  fields,
  farmers,
  images,
  claims,
  analyses,
  events,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onAddField,
  onAddEvent,
  onOpenAnalysisModal,
  onOpenReport,
  onNavigateTab,
  focusedClaimId,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Selected & Active Elements
  const currentField = useMemo(() => fields.find((f) => f.id === selectedFieldId) || fields[0], [fields, selectedFieldId]);
  const currentFarmer = useMemo(() => farmers.find((f) => f.id === currentField?.farmerId), [farmers, currentField]);
  const currentClaim = useMemo(() => claims.find((c) => c.fieldId === currentField?.id), [claims, currentField]);

  // Selected Drone Monitoring / Timeline state
  const fieldImages = useMemo(() => {
    if (!currentField) return [];
    return images
      .filter((img) => img.fieldId === currentField.id)
      .sort((a, b) => new Date(a.captureDate).getTime() - new Date(b.captureDate).getTime());
  }, [images, currentField]);

  const [selectedImageId, setSelectedImageId] = useState<string>('');

  useEffect(() => {
    if (fieldImages.length > 0) {
      setSelectedImageId(fieldImages[fieldImages.length - 1].id);
    } else {
      setSelectedImageId('');
    }
  }, [fieldImages]);

  const activeDroneImage = useMemo(() => {
    return fieldImages.find((img) => img.id === selectedImageId) || fieldImages[fieldImages.length - 1] || null;
  }, [fieldImages, selectedImageId]);

  // Map Camera Control
  const [cameraCenter, setCameraCenter] = useState<LatLngPoint | null>({
    lat: currentField?.latitude || 29.6857,
    lng: currentField?.longitude || 76.9905,
  });
  const [cameraZoom, setCameraZoom] = useState<number>(13);
  const [deviceLocation, setDeviceLocation] = useState<LatLngPoint | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Infowindows & Popups
  const [infoWindowField, setInfoWindowField] = useState<AgriculturalField | null>(null);
  const [selectedDroneMarker, setSelectedDroneMarker] = useState<DroneImage | null>(null);
  const [selectedEventMarker, setSelectedEventMarker] = useState<EnvironmentalEvent | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Healthy' | 'Moderate' | 'Critical'>('All');
  const [damageFilter, setDamageFilter] = useState<'All' | '<20' | '20-50' | '>50'>('All');
  const [claimFilter, setClaimFilter] = useState<'All' | 'HasClaim' | 'Approved' | 'Review'>('All');

  // Layer Visibility
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showDamageOverlay, setShowDamageOverlay] = useState(true);
  const [showDroneMarkers, setShowDroneMarkers] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [mapTypeId, setMapTypeId] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');

  // Boundary Drawing Mode
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<LatLngPoint[]>([]);

  // Register Field via Map Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newFieldCoords, setNewFieldCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newFarmerId, setNewFarmerId] = useState<string>(farmers[0]?.id || '');
  const [newFieldName, setNewFieldName] = useState('');
  const [newCropType, setNewCropType] = useState<AgriculturalField['cropType']>('Paddy (Rice)');
  const [newCropVariety, setNewCropVariety] = useState('High Yield Hybrid');
  const [newFieldArea, setNewFieldArea] = useState<number>(4.5);

  // Add Environmental Event Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventFieldId, setNewEventFieldId] = useState(selectedFieldId);
  const [newEventType, setNewEventType] = useState<EnvironmentalEventType>('Flood');
  const [newEventSeverity, setNewEventSeverity] = useState<EnvironmentalEvent['severity']>('High');
  const [newEventDamage, setNewEventDamage] = useState<number>(45);
  const [newEventDesc, setNewEventDesc] = useState('');

  // Handle focused claim jump from Claims Tab
  useEffect(() => {
    if (focusedClaimId) {
      const claim = claims.find((c) => c.id === focusedClaimId);
      if (claim) {
        const f = fields.find((fld) => fld.id === claim.fieldId);
        if (f) {
          onSelectField(f.id);
          setCameraCenter({ lat: f.latitude, lng: f.longitude });
          setCameraZoom(15);
          setInfoWindowField(f);
        }
      }
    }
  }, [focusedClaimId, claims, fields, onSelectField]);

  // When selectedFieldId changes externally, center map
  useEffect(() => {
    if (currentField) {
      setCameraCenter({ lat: currentField.latitude, lng: currentField.longitude });
    }
  }, [selectedFieldId]);

  // Helper to compute dynamic damage percentage for field based on active drone image or field status
  const getFieldDamage = useCallback((field: AgriculturalField): number => {
    if (field.id === currentField?.id && activeDroneImage?.damagePercentage !== undefined) {
      return activeDroneImage.damagePercentage;
    }
    const latestImg = images
      .filter((i) => i.fieldId === field.id)
      .sort((a, b) => new Date(b.captureDate).getTime() - new Date(a.captureDate).getTime())[0];
    if (latestImg?.damagePercentage !== undefined) {
      return latestImg.damagePercentage;
    }
    if (field.monitoringStatus === 'Critical Damage') return 65;
    if (field.monitoringStatus === 'Needs Review') return 35;
    return 10;
  }, [currentField, activeDroneImage, images]);

  // Helper for status color
  const getFieldStatus = useCallback((field: AgriculturalField) => {
    const damage = getFieldDamage(field);
    if (damage >= 50) return { label: 'Severe Damage', color: 'rose', stroke: '#ef4444', fill: '#ef4444', badge: '🔴 Severe' };
    if (damage >= 20) return { label: 'Moderate Damage', color: 'amber', stroke: '#f59e0b', fill: '#f59e0b', badge: '🟡 Moderate' };
    return { label: 'Healthy', color: 'emerald', stroke: '#10b981', fill: '#10b981', badge: '🟢 Healthy' };
  }, [getFieldDamage]);

  // Filtered Fields
  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      const farmer = farmers.find((fm) => fm.id === f.farmerId);
      const matchQuery =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.toLowerCase().includes(searchQuery.toLowerCase());

      const damage = getFieldDamage(f);
      const matchDamage =
        damageFilter === 'All' ||
        (damageFilter === '<20' && damage < 20) ||
        (damageFilter === '20-50' && damage >= 20 && damage <= 50) ||
        (damageFilter === '>50' && damage > 50);

      const status = getFieldStatus(f);
      const matchRisk =
        riskFilter === 'All' ||
        (riskFilter === 'Healthy' && status.color === 'emerald') ||
        (riskFilter === 'Moderate' && status.color === 'amber') ||
        (riskFilter === 'Critical' && status.color === 'rose');

      const fieldClaim = claims.find((c) => c.fieldId === f.id);
      const matchClaim =
        claimFilter === 'All' ||
        (claimFilter === 'HasClaim' && !!fieldClaim) ||
        (claimFilter === 'Approved' && fieldClaim?.status === 'Approved') ||
        (claimFilter === 'Review' && fieldClaim?.status === 'Under Review');

      return matchQuery && matchDamage && matchRisk && matchClaim;
    });
  }, [fields, farmers, searchQuery, damageFilter, riskFilter, claimFilter, getFieldDamage, getFieldStatus, claims]);

  // Map Click Handler
  const handleMapClick = (e: any) => {
    const lat = e.detail?.latLng?.lat;
    const lng = e.detail?.latLng?.lng;
    if (lat === undefined || lng === undefined) return;

    if (isDrawingBoundary) {
      setDrawnPoints((prev) => [...prev, { lat, lng }]);
      return;
    }

    if (isRegisterModalOpen) {
      setNewFieldCoords({ lat, lng });
      return;
    }

    // Default: update coordinate preview
    setNewFieldCoords({ lat, lng });
  };

  // Drawing tools
  const handleStartDrawing = () => {
    setIsDrawingBoundary(true);
    setDrawnPoints([]);
    setInfoWindowField(null);
  };

  const handleUndoPoint = () => {
    setDrawnPoints((prev) => prev.slice(0, -1));
  };

  const handleCancelDrawing = () => {
    setIsDrawingBoundary(false);
    setDrawnPoints([]);
  };

  const currentDrawnArea = useMemo(() => {
    if (drawnPoints.length < 3) return 0;
    const coords: [number, number][] = drawnPoints.map((p) => [p.lat, p.lng]);
    return calculatePolygonAreaAcres(coords);
  }, [drawnPoints]);

  const handleSaveBoundary = () => {
    if (!currentField || drawnPoints.length < 3) return;
    const coords: [number, number][] = drawnPoints.map((p) => [p.lat, p.lng]);
    const computedAcres = calculatePolygonAreaAcres(coords);

    const updated: AgriculturalField = {
      ...currentField,
      boundaryCoordinates: coords,
      areaAcres: computedAcres > 0 ? computedAcres : currentField.areaAcres,
    };
    onUpdateField(updated);
    setIsDrawingBoundary(false);
    setDrawnPoints([]);
  };

  // Preset Region Jumps
  const handleJumpRegion = (lat: number, lng: number, zoom = 13) => {
    setCameraCenter({ lat, lng });
    setCameraZoom(zoom);
  };

  const handleLocateDevice = () => {
    if (!navigator.geolocation) {
      setLocationMessage('This browser does not support device location.');
      return;
    }

    setIsLocating(true);
    setLocationMessage(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        setDeviceLocation(location);
        setCameraCenter(location);
        setCameraZoom(16);
        if (isRegisterModalOpen) setNewFieldCoords(location);
        setIsLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location access is blocked. Allow location access in your browser settings and try again.'
          : error.code === error.POSITION_UNAVAILABLE
          ? 'Your device could not determine its location. Check that location services are enabled.'
          : 'Finding your location timed out. Please try again.';
        setLocationMessage(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  // Save new field from map click
  const handleSaveNewField = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newFieldCoords ||
      !newFieldName ||
      !Number.isFinite(newFieldCoords.lat) ||
      !Number.isFinite(newFieldCoords.lng) ||
      newFieldCoords.lat < -90 ||
      newFieldCoords.lat > 90 ||
      newFieldCoords.lng < -180 ||
      newFieldCoords.lng > 180
    ) return;

    const selectedFarmer = farmers.find((f) => f.id === newFarmerId) || farmers[0];
    if (!selectedFarmer) return;
    const created = onAddField({
      farmerId: selectedFarmer.id,
      name: newFieldName,
      cropType: newCropType,
      cropVariety: newCropVariety,
      areaAcres: newFieldArea,
      latitude: newFieldCoords.lat,
      longitude: newFieldCoords.lng,
      village: selectedFarmer.village,
      district: selectedFarmer.district,
      state: selectedFarmer.state,
      sowingDate: new Date().toISOString().split('T')[0],
      expectedHarvestDate: new Date(Date.now() + 100 * 24 * 3600 * 1000).toISOString().split('T')[0],
      policyNumber: selectedFarmer.policyNumber,
      isDemoData: false,
      boundaryCoordinates: [
        [newFieldCoords.lat + 0.0018, newFieldCoords.lng - 0.002],
        [newFieldCoords.lat + 0.002, newFieldCoords.lng + 0.0022],
        [newFieldCoords.lat - 0.0018, newFieldCoords.lng + 0.0024],
        [newFieldCoords.lat - 0.002, newFieldCoords.lng - 0.0019],
      ],
    });

    onSelectField(created.id);
    setIsRegisterModalOpen(false);
    setNewFieldName('');
    setCameraCenter(newFieldCoords);
    setCameraZoom(14);
  };

  // Save Environmental Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const targetField = fields.find((f) => f.id === newEventFieldId) || currentField;
    if (!targetField || !onAddEvent) return;

    onAddEvent({
      fieldId: targetField.id,
      eventType: newEventType,
      severity: newEventSeverity,
      timestamp: new Date().toISOString().split('T')[0],
      damagePercentage: newEventDamage,
      description: newEventDesc || `${newEventType} observed on field ${targetField.name}`,
      latitude: targetField.latitude + (Math.random() - 0.5) * 0.002,
      longitude: targetField.longitude + (Math.random() - 0.5) * 0.002,
    });

    setIsEventModalOpen(false);
    setNewEventDesc('');
  };

  // Render weather event icon
  const getEventIcon = (type: EnvironmentalEventType) => {
    switch (type) {
      case 'Flood':
        return <Waves className="w-3.5 h-3.5 text-blue-400" />;
      case 'Heavy Rain':
        return <CloudRain className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Drought':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'Pest':
        return <Bug className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Disease':
        return <Biohazard className="w-3.5 h-3.5 text-purple-400" />;
      case 'Storm':
        return <Wind className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
      {/* Top Controls & Navigation Bar */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-3 shadow-md backdrop-blur-xl">
        {/* Left: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farmer, field, crop..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Agricultural Region Presets */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/60 p-1 rounded-lg border border-slate-700/60">
            <span className="px-1 text-[10px] uppercase font-semibold text-slate-400">Jump To:</span>
            <button
              onClick={() => handleJumpRegion(29.6857, 76.9905)}
              className="px-2 py-0.5 rounded hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              Haryana (Paddy)
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => handleJumpRegion(30.901, 75.8573)}
              className="px-2 py-0.5 rounded hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-medium transition"
            >
              Punjab (Wheat)
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => handleJumpRegion(19.9975, 73.7898)}
              className="px-2 py-0.5 rounded hover:bg-slate-700 text-rose-400 hover:text-rose-300 font-medium transition"
            >
              Nashik (Cotton)
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => handleJumpRegion(17.9689, 79.5941)}
              className="px-2 py-0.5 rounded hover:bg-slate-700 text-teal-400 hover:text-teal-300 font-medium transition"
            >
              Telangana (Sugarcane)
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-1.5">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Risk Levels</option>
              <option value="Healthy">🟢 Healthy (&lt;20%)</option>
              <option value="Moderate">🟡 Moderate (20-50%)</option>
              <option value="Critical">🔴 Critical (&gt;50%)</option>
            </select>

            <select
              value={claimFilter}
              onChange={(e) => setClaimFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Claim States</option>
              <option value="HasClaim">Has Insurance Claim</option>
              <option value="Approved">Approved Claims</option>
              <option value="Review">Under Review</option>
            </select>
          </div>
        </div>

        {/* Right: Map Layers & Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleLocateDevice}
            disabled={isLocating}
            title="Center the map on your device's current location"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-sky-300 border border-sky-500/30 text-xs font-semibold shadow-sm transition"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-pulse' : ''}`} />
            {isLocating ? 'Locating…' : 'My location'}
          </button>

          {/* Map Type toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setMapTypeId('hybrid')}
              className={`px-2 py-1 rounded font-medium transition ${mapTypeId === 'hybrid' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapTypeId('roadmap')}
              className={`px-2 py-1 rounded font-medium transition ${mapTypeId === 'roadmap' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Map
            </button>
            <button
              onClick={() => setMapTypeId('terrain')}
              className={`px-2 py-1 rounded font-medium transition ${mapTypeId === 'terrain' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Terrain
            </button>
          </div>

          {/* Layer toggles */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800/80 rounded-lg px-2 py-1 border border-slate-700 text-[11px]">
            <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showBoundaries}
                onChange={(e) => setShowBoundaries(e.target.checked)}
                className="rounded border-slate-600 text-emerald-500 focus:ring-0"
              />
              Boundaries
            </label>
            <span className="text-slate-600">|</span>
            <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showDamageOverlay}
                onChange={(e) => setShowDamageOverlay(e.target.checked)}
                className="rounded border-slate-600 text-emerald-500 focus:ring-0"
              />
              Damage Grid
            </label>
            <span className="text-slate-600">|</span>
            <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showDroneMarkers}
                onChange={(e) => setShowDroneMarkers(e.target.checked)}
                className="rounded border-slate-600 text-emerald-500 focus:ring-0"
              />
              Drones
            </label>
            <span className="text-slate-600">|</span>
            <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showEvents}
                onChange={(e) => setShowEvents(e.target.checked)}
                className="rounded border-slate-600 text-emerald-500 focus:ring-0"
              />
              Events
            </label>
          </div>

          {/* Action: Draw Boundary */}
          {!isDrawingBoundary ? (
            <button
              onClick={handleStartDrawing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-sm transition"
              title="Draw field boundary polygon on map"
            >
              <Compass className="w-3.5 h-3.5" />
              Draw Boundary
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500 px-3 py-1 rounded-lg">
              <span className="text-xs text-emerald-300 font-medium">Drawing: {drawnPoints.length} pts</span>
              <button
                onClick={handleUndoPoint}
                disabled={drawnPoints.length === 0}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                title="Undo point"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSaveBoundary}
                disabled={drawnPoints.length < 3}
                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition"
              >
                Complete ({currentDrawnArea} ac)
              </button>
              <button
                onClick={handleCancelDrawing}
                className="p-1 text-rose-400 hover:text-rose-300"
                title="Cancel drawing"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action: Register Field */}
          <button
            onClick={() => {
              setIsRegisterModalOpen(true);
              setNewFieldCoords(deviceLocation || {
                lat: currentField?.latitude || 29.6857,
                lng: currentField?.longitude || 76.9905,
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Field
          </button>
        </div>
      </div>

      {/* Main Map View Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {locationMessage && (
          <div
            role="alert"
            className="absolute top-3 left-3 z-40 max-w-sm rounded-xl border border-amber-500/40 bg-slate-950/95 px-4 py-3 text-xs text-amber-100 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <span>{locationMessage}</span>
              <button
                type="button"
                onClick={() => setLocationMessage(null)}
                className="text-amber-200 hover:text-white"
                aria-label="Dismiss location message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Drawing Mode Instruction Banner */}
        {isDrawingBoundary && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-emerald-500 text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="font-semibold text-emerald-400">Boundary Drawing Active for: {currentField?.name}</p>
              <p className="text-slate-300 text-[11px]">Click on map to mark field corners. Double-click or click 'Complete' when finished.</p>
            </div>
          </div>
        )}

        {/* Demo Data Notice Bar */}
        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-200">Demo Data Layer Active</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Sample GPS coordinates for PMFBY verification preview</span>
        </div>

        {/* Selected Field GPS HUD Pill */}
        {newFieldCoords && (
          <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 shadow-lg flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPS: {newFieldCoords.lat.toFixed(5)}, {newFieldCoords.lng.toFixed(5)}</span>
          </div>
        )}

        {/* Google Map Container with explicit height */}
        <div className="w-full h-full">
          <APIProvider apiKey={apiKey} libraries={['marker', 'geometry', 'places']}>
            <Map
              id="field-map"
              mapId="DEMO_MAP_ID"
              center={cameraCenter || { lat: 29.6857, lng: 76.9905 }}
              zoom={cameraZoom}
              onCameraChanged={(e) => {
                setCameraCenter(e.detail.center);
                setCameraZoom(e.detail.zoom);
              }}
              onClick={handleMapClick}
              mapTypeId={mapTypeId}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <MapCameraController center={cameraCenter} zoom={cameraZoom} />

              {deviceLocation && (
                <AdvancedMarker position={deviceLocation} title="Your current location">
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sky-500 shadow-lg shadow-sky-950/50">
                    <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/60" />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                </AdvancedMarker>
              )}

              {/* Polygons for registered field boundaries */}
              {showBoundaries &&
                filteredFields.map((field) => {
                  if (!field.boundaryCoordinates || field.boundaryCoordinates.length < 3) return null;
                  const status = getFieldStatus(field);
                  const isSelected = field.id === currentField?.id;

                  return (
                    <MapPolygonOverlay
                      key={`poly-${field.id}`}
                      path={field.boundaryCoordinates}
                      strokeColor={isSelected ? '#38bdf8' : status.stroke}
                      fillColor={status.fill}
                      fillOpacity={isSelected ? 0.35 : 0.22}
                      onClick={() => {
                        onSelectField(field.id);
                        setInfoWindowField(field);
                      }}
                    />
                  );
                })}

              {/* Drawing Preview Polyline */}
              {isDrawingBoundary && drawnPoints.length > 1 && (
                <DrawingPolylinePreview points={drawnPoints} />
              )}

              {/* Visual Damage Grid inside selected field boundary (Section 6) */}
              {showDamageOverlay && currentField?.boundaryCoordinates && currentField.boundaryCoordinates.length >= 3 && (
                generateDamageGridInsidePolygon(
                  currentField.boundaryCoordinates,
                  getFieldDamage(currentField),
                  6,
                  4
                ).map((dot, idx) => (
                  <AdvancedMarker
                    key={`dot-${idx}`}
                    position={{ lat: dot.lat, lng: dot.lng }}
                    title={`Damage Zone: ${dot.status.toUpperCase()}`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full border border-slate-900/60 shadow-sm ${
                        dot.status === 'severe'
                          ? 'bg-rose-500 animate-pulse'
                          : dot.status === 'moderate'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400 opacity-60'
                      }`}
                    />
                  </AdvancedMarker>
                ))
              )}

              {/* Field Markers */}
              {filteredFields.map((field) => {
                const status = getFieldStatus(field);
                const isSelected = field.id === currentField?.id;
                const fieldClaim = claims.find((c) => c.fieldId === field.id);
                const damage = getFieldDamage(field);

                return (
                  <AdvancedMarker
                    key={`field-marker-${field.id}`}
                    position={{ lat: field.latitude, lng: field.longitude }}
                    title={`${field.name} (${field.cropType})`}
                    onClick={() => {
                      onSelectField(field.id);
                      setInfoWindowField(field);
                    }}
                  >
                    <div
                      className={`relative flex items-center justify-center transition transform cursor-pointer group ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                      }`}
                    >
                      {/* Outer pulse if critical */}
                      {damage >= 50 && (
                        <div className="absolute -inset-1 rounded-full bg-rose-500 opacity-60 animate-ping" />
                      )}

                      {/* Marker badge */}
                      <div
                        className={`px-2 py-1 rounded-lg shadow-xl font-bold text-[11px] flex items-center gap-1.5 border ${
                          damage >= 50
                            ? 'bg-rose-950 text-rose-300 border-rose-500'
                            : damage >= 20
                            ? 'bg-amber-950 text-amber-300 border-amber-500'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        } ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}`}
                      >
                        <span className="text-xs">
                          {damage >= 50 ? '🔴' : damage >= 20 ? '🟡' : '🟢'}
                        </span>
                        <div className="flex flex-col text-left leading-none">
                          <span className="font-extrabold text-[10px] tracking-tight text-white">{field.id}</span>
                          <span className="text-[9px] font-normal opacity-90">{damage}% Dmg</span>
                        </div>
                        {fieldClaim && (
                          <ShieldCheck className="w-3 h-3 text-emerald-400 ml-0.5" />
                        )}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Drone Monitoring Markers */}
              {showDroneMarkers &&
                images.map((img) => {
                  const isCurrent = img.id === activeDroneImage?.id;
                  return (
                    <AdvancedMarker
                      key={`drone-${img.id}`}
                      position={{ lat: img.latitude, lng: img.longitude }}
                      title={`Drone Monitoring: ${img.id}`}
                      onClick={() => setSelectedDroneMarker(img)}
                    >
                      <div
                        className={`p-1.5 rounded-full border transition cursor-pointer shadow-lg ${
                          isCurrent
                            ? 'bg-sky-500 text-white border-white ring-2 ring-sky-300 scale-110 z-20'
                            : 'bg-slate-900/90 text-sky-400 border-sky-500 hover:scale-110 z-10'
                        }`}
                      >
                        <Plane className="w-3.5 h-3.5 transform -rotate-45" />
                      </div>
                    </AdvancedMarker>
                  );
                })}

              {/* Environmental Event Markers (Section 9) */}
              {showEvents &&
                events.map((evt) => (
                  <AdvancedMarker
                    key={`event-${evt.id}`}
                    position={{ lat: evt.latitude, lng: evt.longitude }}
                    title={`${evt.eventType} Event (${evt.severity})`}
                    onClick={() => setSelectedEventMarker(evt)}
                  >
                    <div className="p-1 rounded-full bg-slate-900 border border-slate-700 shadow-md hover:scale-125 transition cursor-pointer z-10 flex items-center justify-center">
                      {getEventIcon(evt.eventType)}
                    </div>
                  </AdvancedMarker>
                ))}

              {/* InfoWindow for Clicked Field Marker */}
              {infoWindowField && (
                <InfoWindow
                  position={{ lat: infoWindowField.latitude, lng: infoWindowField.longitude }}
                  onCloseClick={() => setInfoWindowField(null)}
                >
                  <div className="text-slate-900 p-1 min-w-[260px] max-w-[320px]">
                    <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{infoWindowField.name}</span>
                        {infoWindowField.isDemoData && (
                          <span className="text-[9px] bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                            Demo Data
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700">{infoWindowField.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mb-3">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Farmer:</span>
                        <span className="font-semibold text-slate-800">
                          {farmers.find((f) => f.id === infoWindowField.farmerId)?.name || 'Registered Farmer'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Crop & Variety:</span>
                        <span className="font-semibold text-slate-800">{infoWindowField.cropType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Field Area:</span>
                        <span className="font-semibold text-slate-800">{infoWindowField.areaAcres} Acres</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Stage:</span>
                        <span className="font-semibold text-slate-800 capitalize">{infoWindowField.currentCropStage}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Health %:</span>
                        <span className="font-bold text-emerald-600">
                          {100 - getFieldDamage(infoWindowField)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Damage %:</span>
                        <span
                          className={`font-bold ${
                            getFieldDamage(infoWindowField) >= 50
                              ? 'text-rose-600'
                              : getFieldDamage(infoWindowField) >= 20
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {getFieldDamage(infoWindowField)}% ({getFieldStatus(infoWindowField).label})
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-100 rounded-lg p-2 text-[11px] mb-2 flex items-center justify-between">
                      <span className="text-slate-600">GPS Coordinates:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {infoWindowField.latitude.toFixed(4)}, {infoWindowField.longitude.toFixed(4)}
                      </span>
                    </div>

                    {/* Actions in InfoWindow */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          onSelectField(infoWindowField.id);
                          if (onOpenAnalysisModal) onOpenAnalysisModal(infoWindowField);
                        }}
                        className="flex-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold text-center transition"
                      >
                        AI Analysis
                      </button>
                      {onNavigateTab && (
                        <button
                          onClick={() => {
                            onSelectField(infoWindowField.id);
                            onNavigateTab('drone');
                          }}
                          className="py-1 px-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold transition"
                        >
                          Drone View
                        </button>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>

        {/* Floating Side Panel: Field Details, History & Claim */}
        <div className="absolute top-4 left-4 z-20 w-80 md:w-96 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100%-2rem)]">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white tracking-tight leading-tight">
                  {currentField?.name || 'Agricultural Field'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {currentFarmer?.name || 'Farmer'} • {currentField?.district}, {currentField?.state}
                </p>
              </div>
            </div>
            {currentField?.isDemoData && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30">
                Demo Data
              </span>
            )}
          </div>

          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Field Status & Damage Metric Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Field Area</span>
                <span className="text-base font-bold text-white">{currentField?.areaAcres || 0}</span>
                <span className="text-[10px] text-slate-500 block">Acres</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Health %</span>
                <span className="text-base font-bold text-emerald-400">
                  {100 - getFieldDamage(currentField!)}%
                </span>
                <span className="text-[10px] text-slate-500 block">NDVI / VARI</span>
              </div>
              <div
                className={`border rounded-xl p-2.5 ${
                  getFieldDamage(currentField!) >= 50
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-400'
                    : getFieldDamage(currentField!) >= 20
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                }`}
              >
                <span className="text-[10px] opacity-80 block uppercase font-medium">Damage %</span>
                <span className="text-base font-extrabold">{getFieldDamage(currentField!)}%</span>
                <span className="text-[10px] opacity-80 block">{getFieldStatus(currentField!).badge}</span>
              </div>
            </div>

            {/* Time-Based Field Monitoring (Section 8) */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Time-Based Drone Monitoring History
                </span>
                <span className="text-[10px] text-slate-400">{fieldImages.length} scans recorded</span>
              </div>

              {fieldImages.length > 0 ? (
                <div className="space-y-1.5">
                  {fieldImages.map((scan) => {
                    const isSelectedScan = scan.id === activeDroneImage?.id;
                    const dmg = scan.damagePercentage ?? 10;
                    return (
                      <button
                        key={scan.id}
                        onClick={() => setSelectedImageId(scan.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition border ${
                          isSelectedScan
                            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">
                            {dmg >= 50 ? '🔴' : dmg >= 20 ? '🟡' : '🟢'}
                          </span>
                          <div>
                            <span className="font-semibold block leading-tight">{scan.captureDate}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{scan.cropStage} stage</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-bold text-xs ${
                              dmg >= 50 ? 'text-rose-400' : dmg >= 20 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {dmg}% Dmg
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {scan.affectedArea ? `${scan.affectedArea} ac` : 'Baseline'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No historical drone images recorded yet for this field.</p>
              )}

              {/* Active Drone Scan Snapshot Preview */}
              {activeDroneImage && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-2.5">
                  <img
                    src={activeDroneImage.imageUrl}
                    alt="Active Drone Scan"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                  />
                  <div className="text-[11px] text-slate-300 leading-tight">
                    <p className="font-semibold text-white truncate">{activeDroneImage.notes || 'Drone Aerial Survey'}</p>
                    <p className="text-slate-400 text-[10px]">Capture: {activeDroneImage.captureTime}</p>
                    <p className="text-slate-400 text-[10px] font-mono">
                      GPS: {activeDroneImage.latitude.toFixed(4)}, {activeDroneImage.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Insurance Claim Card for this field (Section 10) */}
            {currentClaim ? (
              <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Active Insurance Claim</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentClaim.status === 'Approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : currentClaim.status === 'Under Review'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {currentClaim.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Claim ID:</span>
                    <span className="font-mono font-semibold text-white">{currentClaim.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Damaged Area:</span>
                    <span className="font-semibold text-rose-400">
                      {currentClaim.affectedArea} / {currentClaim.fieldArea} Acres
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calculated Loss %:</span>
                    <span className="font-bold text-rose-400">{currentClaim.damagePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Damage Cause:</span>
                    <span className="font-semibold text-white">{currentClaim.damageCategory}</span>
                  </div>
                </div>

                {onOpenReport && (
                  <button
                    onClick={() => onOpenReport(currentClaim)}
                    className="w-full mt-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Statutory Claim Dossier
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">No active insurance claim lodged for this field.</p>
                {onOpenAnalysisModal && (
                  <button
                    onClick={() => onOpenAnalysisModal(currentField!)}
                    className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    + Run AI Analysis to generate claim
                  </button>
                )}
              </div>
            )}

            {/* Field Boundary Stats */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Boundary Coordinates:</span>
                <span className="font-mono text-slate-300">
                  {currentField?.boundaryCoordinates?.length || 0} Polygon Vertices
                </span>
              </div>
              <button
                onClick={handleStartDrawing}
                className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-emerald-400 text-[11px] font-semibold transition"
              >
                Redraw Boundary
              </button>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  if (onOpenAnalysisModal && currentField) {
                    onOpenAnalysisModal(currentField);
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Crop Damage
              </button>
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
                title="Log Environmental Event (Flood, Pest, Drought)"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Drone Marker Modal Detail (Section 7) */}
        {selectedDroneMarker && (
          <div className="absolute bottom-6 right-6 z-30 w-84 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                <Plane className="w-4 h-4 text-sky-400" />
                Drone Capture: {selectedDroneMarker.id}
              </div>
              <button onClick={() => setSelectedDroneMarker(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <img
              src={selectedDroneMarker.imageUrl}
              alt="Drone capture"
              className="w-full h-32 rounded-lg object-cover mb-3 border border-slate-700"
            />

            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Field ID:</span>
                <span className="font-semibold text-white">{selectedDroneMarker.fieldId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capture Time:</span>
                <span>{selectedDroneMarker.captureDate} at {selectedDroneMarker.captureTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Crop Stage:</span>
                <span className="capitalize font-semibold text-emerald-400">{selectedDroneMarker.cropStage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Damage %:</span>
                <span className="font-bold text-rose-400">{selectedDroneMarker.damagePercentage ?? 15}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GPS Location:</span>
                <span className="font-mono text-[10px]">
                  {selectedDroneMarker.latitude.toFixed(4)}, {selectedDroneMarker.longitude.toFixed(4)}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 bg-slate-800/80 p-2 rounded">
                {selectedDroneMarker.notes || 'Sensor resolution 4K UHD survey at 45m AGL altitude.'}
              </p>
            </div>
          </div>
        )}

        {/* Selected Environmental Event Detail Card (Section 9) */}
        {selectedEventMarker && (
          <div className="absolute bottom-6 right-6 z-30 w-80 bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl p-4 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                {getEventIcon(selectedEventMarker.eventType)}
                {selectedEventMarker.eventType} Event
              </div>
              <button onClick={() => setSelectedEventMarker(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Field ID:</span>
                <span className="font-bold text-white">{selectedEventMarker.fieldId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span>{selectedEventMarker.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Severity:</span>
                <span className="font-bold text-rose-400">{selectedEventMarker.severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Damage %:</span>
                <span className="font-extrabold text-rose-400">{selectedEventMarker.damagePercentage}%</span>
              </div>
              <p className="text-[11px] text-slate-300 bg-slate-800 p-2 rounded-lg mt-2">
                {selectedEventMarker.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Register Field Using Map (Section 2) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Register Agricultural Field via Map</h3>
                  <p className="text-xs text-slate-400">Point coordinates on Google Map and link to Farmer profile</p>
                </div>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewField} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Farmer *</label>
                <select
                  value={newFarmerId}
                  onChange={(e) => setNewFarmerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  {farmers.map((fm) => (
                    <option key={fm.id} value={fm.id}>
                      {fm.name} ({fm.village}, {fm.district}) • {fm.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Field Name *</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. South Terrace Basmati Sector C"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Crop *</label>
                  <select
                    value={newCropType}
                    onChange={(e) => setNewCropType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Paddy (Rice)">Paddy (Rice)</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Maize">Maize</option>
                    <option value="Soybean">Soybean</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Field Area (Acres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={newFieldArea}
                    onChange={(e) => setNewFieldArea(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Map-Selected GPS Coordinates (Auto-populated from click) */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                <span className="text-xs font-semibold text-emerald-400 block mb-1 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  Field GPS Location
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="field-latitude" className="text-[10px] text-slate-400">Latitude</label>
                    <input
                      id="field-latitude"
                      type="number"
                      min="-90"
                      max="90"
                      step="any"
                      value={newFieldCoords && Number.isFinite(newFieldCoords.lat) ? newFieldCoords.lat : ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? Number.NaN : Number(e.target.value);
                        setNewFieldCoords((current) => current ? { ...current, lat: value } : null);
                      }}
                      placeholder="e.g. 29.685700"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="field-longitude" className="text-[10px] text-slate-400">Longitude</label>
                    <input
                      id="field-longitude"
                      type="number"
                      min="-180"
                      max="180"
                      step="any"
                      value={newFieldCoords && Number.isFinite(newFieldCoords.lng) ? newFieldCoords.lng : ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? Number.NaN : Number(e.target.value);
                        setNewFieldCoords((current) => current ? { ...current, lng: value } : null);
                      }}
                      placeholder="e.g. 76.990500"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Enter coordinates, click the map to fill them, or use your device location. Latitude must be -90 to 90; longitude -180 to 180.
                </p>
                {locationMessage && (
                  <p role="alert" className="mt-2 text-[11px] text-amber-300">{locationMessage}</p>
                )}
                <button
                  type="button"
                  onClick={handleLocateDevice}
                  disabled={isLocating}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-900/60 disabled:opacity-60"
                >
                  <LocateFixed className="h-3.5 w-3.5" />
                  {isLocating ? 'Finding location…' : 'Use my current location'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFieldCoords || !newFieldName}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition"
                >
                  Save Field Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Environmental Event (Section 9) */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Log Environmental Event</h3>
              </div>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Field</label>
                <select
                  value={newEventFieldId}
                  onChange={(e) => setNewEventFieldId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.cropType}) • {f.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Event Type</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Flood">🌊 Flood</option>
                    <option value="Heavy Rain">🌧 Heavy Rain</option>
                    <option value="Drought">☀️ Drought</option>
                    <option value="Pest">🐛 Pest Infestation</option>
                    <option value="Disease">🦠 Disease Blight</option>
                    <option value="Storm">🌪 Storm Wind</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity</label>
                  <select
                    value={newEventSeverity}
                    onChange={(e) => setNewEventSeverity(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Damage Percentage (%): {newEventDamage}%</label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={newEventDamage}
                  onChange={(e) => setNewEventDamage(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="e.g. Flash overflow from local irrigation breach submerged crops."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Add Marker to Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
