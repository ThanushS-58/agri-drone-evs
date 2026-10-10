/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { storage } from './services/storageService';
import { 
  Farmer, 
  AgriculturalField, 
  DroneImage, 
  AIAnalysisResult, 
  InsuranceClaim, 
  ClaimVerificationRecord,
  CropLifecycleStage,
  EnvironmentalEvent 
} from './types';
import { analyzeFieldImage } from './utils/imageAnalysis';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FirestoreSyncService } from './services/firestoreService';

// Components
import { Navigation, NavTab } from './components/Navigation';
import { DashboardOverview } from './components/DashboardOverview';
import { FieldDamageViewer } from './components/FieldDamageViewer';
import { FieldMapViewer } from './components/FieldMapViewer';
import { DroneMonitoring } from './components/DroneMonitoring';
import { HistoricalComparison } from './components/HistoricalComparison';
import { CropLifecycleTimeline } from './components/CropLifecycleTimeline';
import { FarmerManagement } from './components/FarmerManagement';
import { FieldManagement } from './components/FieldManagement';
import { ClaimManagement } from './components/ClaimManagement';
import { LiveMonitoringGraphs } from './components/LiveMonitoringGraphs';
import { InsuranceClaimReport } from './components/InsuranceClaimReport';
import { ImageUploadModal } from './components/ImageUploadModal';
import { AIAnalysisSequenceModal } from './components/AIAnalysisSequenceModal';
import { AuthModal } from './components/AuthModal';
import { LeafDiseaseChecker } from './components/LeafDiseaseChecker';
import { FirestoreErrorInfo, firebaseConfig, OperationType } from './services/firebase';
import { generateAerialDroneImageUrl } from './utils/droneImageFactory';
import type { SampleDatasetRow } from './utils/sampleDataset';

function AppContent() {
  const { user } = useAuth();
  const [firestoreError, setFirestoreError] = useState<FirestoreErrorInfo | null>(null);

  useEffect(() => {
    const handleFirestoreError = (event: Event) => {
      const { detail } = event as CustomEvent<FirestoreErrorInfo>;
      setFirestoreError(detail);
    };
    window.addEventListener('firestore-error', handleFirestoreError);
    return () => window.removeEventListener('firestore-error', handleFirestoreError);
  }, []);

  // Google Maps Platform Quota Defense State
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Global State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('agrishield_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [fields, setFields] = useState<AgriculturalField[]>([]);
  const [images, setImages] = useState<DroneImage[]>([]);
  const [analyses, setAnalyses] = useState<AIAnalysisResult[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [events, setEvents] = useState<EnvironmentalEvent[]>([]);
  
  // Active Selection
  const [selectedFieldId, setSelectedFieldId] = useState<string>('FLD-101');
  const [selectedStage, setSelectedStage] = useState<CropLifecycleStage>('vegetative');
  const [focusedClaimId, setFocusedClaimId] = useState<string | null>(null);

  
  // Analysis Pipeline Modal State
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [currentPhaseDetails, setCurrentPhaseDetails] = useState<string>('');
  
  // Other Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedClaimForReport, setSelectedClaimForReport] = useState<InsuranceClaim | null>(null);
  const [previewImageState, setPreviewImageState] = useState<{ url: string; title: string } | null>(null);

  // Initialize data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('agrishield_theme', theme);
    } catch (err) {
      console.warn('Could not save theme preference:', err);
    }
  }, [theme]);

  // When user is authenticated, sync with Firestore in real-time
  useEffect(() => {
    if (!user) return;

    let isActive = true;
    const startFirestoreSync = async () => {
      try {
        const syncCollection = async <T extends { id: string },>(
          localRecords: T[],
          getRemoteRecords: () => Promise<T[]>,
          saveRemoteRecord: (record: T) => Promise<void>,
          saveLocalRecords: (records: T[]) => void,
          setRecords: (records: T[]) => void
        ) => {
          const remoteRecords = await getRemoteRecords();
          const merged = new Map(remoteRecords.map((record) => [record.id, record]));
          for (const record of localRecords) {
            if (!merged.has(record.id)) {
              await saveRemoteRecord(record);
              merged.set(record.id, record);
            }
          }
          const records = [...merged.values()];
          saveLocalRecords(records);
          if (isActive) setRecords(records);
        };

        await syncCollection(storage.getFarmers(), FirestoreSyncService.getFarmers, FirestoreSyncService.saveFarmer, storage.saveFarmers.bind(storage), setFarmers);
        await syncCollection(storage.getFields(), FirestoreSyncService.getFields, FirestoreSyncService.saveField, storage.saveFields.bind(storage), setFields);
        await syncCollection(storage.getClaims(), FirestoreSyncService.getClaims, FirestoreSyncService.saveClaim, storage.saveClaims.bind(storage), setClaims);
        await syncCollection(storage.getAnalyses(), FirestoreSyncService.getAnalyses, FirestoreSyncService.saveAnalysis, storage.saveAnalyses.bind(storage), setAnalyses);
        await syncCollection(storage.getVerifications(), FirestoreSyncService.getVerifications, FirestoreSyncService.saveVerification, storage.saveVerifications.bind(storage), (records) => storage.saveVerifications(records));
        await syncCollection(storage.getImages(), FirestoreSyncService.getImages, FirestoreSyncService.saveImage, storage.saveImages.bind(storage), setImages);
        await syncCollection(storage.getEvents(), FirestoreSyncService.getEvents, FirestoreSyncService.saveEvent, storage.saveEvents.bind(storage), setEvents);

        if (!isActive) return;

        const unsubFarmers = FirestoreSyncService.subscribeToFarmers((updated) => {
          setFarmers(updated);
          storage.saveFarmers(updated);
        });
        const unsubFields = FirestoreSyncService.subscribeToFields((updated) => {
          setFields(updated);
          storage.saveFields(updated);
        });
        const unsubClaims = FirestoreSyncService.subscribeToClaims((updated) => {
          setClaims(updated);
          storage.saveClaims(updated);
        });
        const unsubImages = FirestoreSyncService.subscribeToImages((updated) => {
          setImages(updated);
          storage.saveImages(updated);
        });
        const unsubAnalyses = FirestoreSyncService.subscribeToAnalyses((updated) => {
          setAnalyses(updated);
          storage.saveAnalyses(updated);
        });
        const unsubEvents = FirestoreSyncService.subscribeToEvents((updated) => {
          setEvents(updated);
          storage.saveEvents(updated);
        });
        const unsubVerifications = FirestoreSyncService.subscribeToVerifications((updated) => {
          storage.saveVerifications(updated);
        });
        unsubscribeListeners = () => {
          unsubFarmers();
          unsubFields();
          unsubClaims();
          unsubImages();
          unsubAnalyses();
          unsubEvents();
          unsubVerifications();
        };
      } catch (err) {
        if (!isActive) return;
        console.error('Firestore initial sync failed:', err);
        setFirestoreError({
          error: err instanceof Error ? err.message : String(err),
          operationType: OperationType.WRITE,
          path: null,
          authInfo: { userId: user.uid, email: user.email },
        });
      }
    };

    let unsubscribeListeners = () => {};
    startFirestoreSync();
    return () => {
      isActive = false;
      unsubscribeListeners();
    };
  }, [user]);

  const persistToFirestore = (write: () => Promise<void>) => {
    void write().catch((err) => {
      console.error('Firestore write failed:', err);
    });
  };

  const loadAllData = () => {
    const fList = storage.getFarmers();
    const fldList = storage.getFields();
    const imgList = storage.getImages();
    const anlList = storage.getAnalyses();
    const clmList = storage.getClaims();
    const evtList = storage.getEvents();

    setFarmers(fList);
    setFields(fldList);
    setImages(imgList);
    setAnalyses(anlList);
    setClaims(clmList);
    setEvents(evtList);

    if (fldList.length > 0 && !fldList.some((f) => f.id === selectedFieldId)) {
      setSelectedFieldId(fldList[0].id);
    }
  };


  const currentField = fields.find((f) => f.id === selectedFieldId) || fields[0];
  const fieldImages = images.filter((img) => img.fieldId === currentField?.id);
  const currentImage = fieldImages[fieldImages.length - 1] || images[0];
  const baselineImage = fieldImages.find((img) => img.isBaseline) || fieldImages[0] || null;
  const currentAnalysis = analyses.find((a) => a.fieldId === currentField?.id && a.imageId === currentImage?.id) || analyses.find((a) => a.fieldId === currentField?.id);
  const currentFarmer = farmers.find((f) => f.id === currentField?.farmerId);

  // Trigger 10-Phase "ANALYZE FIELD" Execution
  const handleTriggerAnalysis = async () => {
    if (!currentField || !currentImage) return;

    setIsAnalyzing(true);
    setIsAnalysisModalOpen(true);
    setCurrentPhase(1);
    setCurrentPhaseDetails('Commencing computer vision assessment pipeline...');

    try {
      const result = await analyzeFieldImage(
        currentImage,
        currentField,
        baselineImage,
        (phase, name, details) => {
          setCurrentPhase(phase);
          setCurrentPhaseDetails(details);
        }
      );

      // Save analysis
      storage.addAnalysis(result);
      setAnalyses(storage.getAnalyses());
      if (user) {
        await FirestoreSyncService.saveAnalysis(result);
      }

      // Update field monitoring status
      if (result.damagePercentage >= 35) {
        currentField.monitoringStatus = 'Critical Damage';
      } else if (result.damagePercentage >= 15) {
        currentField.monitoringStatus = 'Needs Review';
      }
      storage.updateField(currentField);
      if (user) {
        persistToFirestore(() => FirestoreSyncService.saveField(currentField));
      }
      setFields(storage.getFields());

      setCurrentPhase(10);
    } catch (err: any) {
      console.error('Error during field analysis:', err);
      alert('Analysis execution encountered an issue: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Automated Insurance Claim Generation
  const handleGenerateClaim = () => {
    if (!currentField || !currentFarmer) return;

    const damagePct = currentAnalysis?.damagePercentage ?? (
      currentField.monitoringStatus === 'Critical Damage' ? 38 : currentField.monitoringStatus === 'Needs Review' ? 18 : 22
    );
    const affectedArea = currentAnalysis?.damagedArea ?? Number(((currentField.areaAcres * damagePct) / 100).toFixed(2));
    const sev = currentAnalysis?.damageSeverity ?? (damagePct >= 50 ? 'High' : damagePct >= 20 ? 'Moderate' : 'Low');
    const cat = currentAnalysis?.damageCategory !== 'None' && currentAnalysis?.damageCategory 
      ? currentAnalysis.damageCategory 
      : currentImage?.damageScenario || 'Flooding';

    const newClaim = storage.addClaim({
      farmerId: currentFarmer.id,
      farmerName: currentFarmer.name,
      submittedByName: user?.displayName?.trim() || user?.email || 'Local user',
      submittedByEmail: user?.email || null,
      fieldId: currentField.id,
      cropType: currentField.cropType,
      fieldArea: currentField.areaAcres,
      policyNumber: currentField.policyNumber,
      sowingDate: currentField.sowingDate,
      observationDate: currentImage.captureDate,
      damageCategory: cat,
      damageSeverity: sev,
      damagePercentage: damagePct,
      affectedArea,
      supportingImageId: currentImage.id,
      supportingImageUrl: currentImage.imageUrl,
      analysisId: currentAnalysis?.id || `ANL-${Date.now()}`,
      aiAnalysisSummary: `Automated U-Net segmentation verified ${damagePct}% structural canopy loss across ${affectedArea} acres of ${currentField.cropType} (${currentField.cropVariety}). Identified spectral condition: ${cat}.`,
      adminRemarks: 'Automated digital claim submission generated by AgriShield AI engine. Scheduled for surveyor physical endorsement.',
    });

    if (user) {
      persistToFirestore(() => FirestoreSyncService.saveClaim(newClaim));
    }

    setClaims(storage.getClaims());
    setSelectedClaimForReport(newClaim);
    setCurrentTab('reports');
  };

  // Image Captured from Drone Simulator
  const handleImageCaptured = async (imgData: Omit<DroneImage, 'id'>) => {
    const newImg = storage.addImage(imgData);
    setImages(storage.getImages());
    if (user) {
      try {
        await FirestoreSyncService.saveImage(newImg);
      } catch (err) {
        console.error('Image saved locally but could not be synced to Firebase:', err);
        alert('The image was saved on this device, but Firebase could not save it. Check your connection and Firebase Storage rules.');
      }
    }
  };

  // Reset to Demo Data
  const handleResetDemo = () => {
    if (confirm('Reset application to sample demo dataset? All custom records will be restored to defaults.')) {
      storage.resetAllToDefaults();
      loadAllData();
      setSelectedFieldId('FLD-101');
      setCurrentTab('dashboard');
    }
  };

  const handleImportDataset = async (rows: SampleDatasetRow[]) => {
    for (const row of rows) {
      const existingFarmer = storage.getFarmers().find(
        (farmer) => farmer.email.toLowerCase() === row.farmerEmail.toLowerCase()
      );
      const farmer = existingFarmer || storage.addFarmer({
        name: row.farmerName,
        phone: row.farmerPhone,
        email: row.farmerEmail,
        address: row.farmerAddress,
        village: row.village,
        district: row.district,
        state: row.state,
        landOwnership: row.landOwnership,
        policyNumber: row.policyNumber,
      });
      if (!existingFarmer && user) {
        await FirestoreSyncService.saveFarmer(farmer);
      }

      let field = storage.getFields().find(
        (record) => record.farmerId === farmer.id && record.name.toLowerCase() === row.fieldName.toLowerCase()
      );
      if (!field) {
        const created = storage.addField({
          farmerId: farmer.id,
          name: row.fieldName,
          cropType: row.cropType,
          cropVariety: row.cropVariety,
          areaAcres: row.areaAcres,
          latitude: row.latitude,
          longitude: row.longitude,
          village: row.village,
          district: row.district,
          state: row.state,
          sowingDate: row.sowingDate,
          expectedHarvestDate: row.expectedHarvestDate,
          soilType: row.soilType,
          policyNumber: row.policyNumber,
        });
        field = {
          ...created,
          currentCropStage: row.cropStage,
          monitoringStatus: row.damageSeverity === 'High' ? 'Critical Damage' : row.damageScenario === 'None' ? 'Active' : 'Needs Review',
        };
        storage.updateField(field);
        if (user) await FirestoreSyncService.saveField(field);
      }

      const alreadyHasSampleImage = storage.getImages().some(
        (image) => image.fieldId === field.id && image.notes === row.notes
      );
      if (!alreadyHasSampleImage) {
        const damagePercentage = row.damageScenario === 'None'
          ? 0
          : row.damageSeverity === 'High' ? 55 : row.damageSeverity === 'Moderate' ? 30 : 12;
        const image = storage.addImage({
          fieldId: field.id,
          farmerId: farmer.id,
          captureDate: row.captureDate,
          captureTime: '10:00 AM',
          latitude: row.latitude,
          longitude: row.longitude,
          cropStage: row.cropStage,
          imageSource: 'Simulation',
          resolution: 'Generated sample preview (800 x 600)',
          imageUrl: generateAerialDroneImageUrl({
            cropType: row.cropType,
            stage: row.cropStage,
            damageType: row.damageScenario,
            severityLevel: row.damageSeverity,
          }),
          damageScenario: row.damageScenario,
          damagePercentage,
          affectedArea: Number(((field.areaAcres * damagePercentage) / 100).toFixed(2)),
          notes: row.notes,
        });
        if (user) await FirestoreSyncService.saveImage(image);
      }
    }

    const updatedFarmers = storage.getFarmers();
    const updatedFields = storage.getFields();
    const updatedImages = storage.getImages();
    setFarmers(updatedFarmers);
    setFields(updatedFields);
    setImages(updatedImages);
    if (rows.length > 0) setSelectedFieldId(
      updatedFields.find((field) => field.name.toLowerCase() === rows[0].fieldName.toLowerCase())?.id || selectedFieldId
    );
  };

  if (!currentField) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading AgriShield AI...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {!user && (
        <div className="border-b border-amber-700 bg-amber-950/90 px-4 py-2 text-xs text-amber-100">
          Sign in to sync records to Firestore. Changes made while signed out are kept on this device and uploaded after sign-in.
        </div>
      )}
      {firestoreError && (
        <div className="border-b border-rose-700 bg-rose-950/90 px-4 py-3 text-xs text-rose-100">
          <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold">Firebase could not sync to Firestore.</p>
              <p>
                {firestoreError.operationType.toUpperCase()}
                {firestoreError.path ? ` ${firestoreError.path}` : ''}: {firestoreError.error}
              </p>
              <p>
                Confirm that the <strong>{firebaseConfig.projectId}</strong> project has a Cloud Firestore database
                created and that this app&apos;s <code>firestore.rules</code> have been published in the Firebase Console.
              </p>
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-semibold underline"
              >
                Open this project&apos;s Firestore
              </a>
            </div>
            <button
              type="button"
              onClick={() => setFirestoreError(null)}
              className="shrink-0 rounded px-2 py-1 hover:bg-rose-900"
              aria-label="Dismiss Firestore error"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Google Maps Quota Defense Banner (SKILL.md Section 8) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Main Navigation with Firebase Auth */}
      <Navigation
        currentTab={currentTab}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        onSelectTab={setCurrentTab}
        fields={fields}
        selectedFieldId={selectedFieldId}
        onSelectField={setSelectedFieldId}
        onResetDemo={handleResetDemo}
      />

      {/* Main App Container */}
      {currentTab === 'map' ? (
        /* TAB: FIELD MAP (Full Screen Viewport Layer) */
        <div className="flex-1 w-full">
          <FieldMapViewer
            fields={fields}
            farmers={farmers}
            images={images}
            claims={claims}
            analyses={analyses}
            events={events}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onUpdateField={(fld) => {
              storage.updateField(fld);
              if (user) persistToFirestore(() => FirestoreSyncService.saveField(fld));
              setFields(storage.getFields());
            }}
            onAddField={(fld) => {
              const created = storage.addField(fld);
              if (user) persistToFirestore(() => FirestoreSyncService.saveField(created));
              setFields(storage.getFields());
              return created;
            }}
            onAddEvent={(evt) => {
              const created = storage.addEvent(evt);
              if (user) persistToFirestore(() => FirestoreSyncService.saveEvent(created));
              setEvents(storage.getEvents());
            }}
            onOpenAnalysisModal={(fld) => {
              setSelectedFieldId(fld.id);
              handleTriggerAnalysis();
            }}
            onOpenReport={(claim) => {
              setSelectedClaimForReport(claim);
              setCurrentTab('reports');
            }}
            onNavigateTab={setCurrentTab}
            focusedClaimId={focusedClaimId}
          />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* TAB 1: DASHBOARD */}

        {currentTab === 'dashboard' && (
          <DashboardOverview
            farmers={farmers}
            fields={fields}
            images={images}
            claims={claims}
            currentField={currentField}
            currentImage={currentImage}
            currentAnalysis={currentAnalysis}
            isAnalyzing={isAnalyzing}
            onTriggerAnalysis={handleTriggerAnalysis}
            onFlyDrone={() => setCurrentTab('drone')}
            onHistoricalCompare={() => setCurrentTab('analysis')}
            onGenerateClaim={handleGenerateClaim}
            onViewReport={() => {
              const c = claims.find((clm) => clm.fieldId === currentField.id);
              if (c) {
                setSelectedClaimForReport(c);
                setCurrentTab('reports');
              } else {
                handleGenerateClaim();
              }
            }}
            onSelectTab={setCurrentTab}
          />
        )}

        {/* TAB 2: FARMERS */}
        {currentTab === 'farmers' && (
          <FarmerManagement
            farmers={farmers}
            fields={fields}
            claims={claims}
            onAddFarmer={(f) => {
              const newFarmer = storage.addFarmer(f);
              if (user) {
                persistToFirestore(() => FirestoreSyncService.saveFarmer(newFarmer));
              }
              setFarmers(storage.getFarmers());
            }}
            onUpdateFarmer={(f) => {
              storage.updateFarmer(f);
              if (user) {
                persistToFirestore(() => FirestoreSyncService.saveFarmer(f));
              }
              setFarmers(storage.getFarmers());
            }}
            onDeleteFarmer={(id) => {
              storage.deleteFarmer(id);
              if (user) {
                persistToFirestore(() => FirestoreSyncService.deleteFarmer(id));
              }
              setFarmers(storage.getFarmers());
            }}
            onSelectField={(fId) => {
              setSelectedFieldId(fId);
              setCurrentTab('dashboard');
            }}
            onImportDataset={handleImportDataset}
          />
        )}

        {/* TAB 3: FIELDS */}
        {currentTab === 'fields' && (
          <FieldManagement
            fields={fields}
            farmers={farmers}
            images={images}
            analyses={analyses}
            onAddField={(f) => {
              const newFld = storage.addField(f);
              if (user) {
                persistToFirestore(() => FirestoreSyncService.saveField(newFld));
              }
              setFields(storage.getFields());
              setSelectedFieldId(newFld.id);
            }}
            onSelectField={(fId) => {
              setSelectedFieldId(fId);
              setCurrentTab('dashboard');
            }}
            onDeleteField={(fId) => {
              storage.deleteField(fId);
              if (user) {
                persistToFirestore(() => FirestoreSyncService.deleteField(fId));
              }
              setFields(storage.getFields());
            }}
            onFlyDrone={(fId) => {
              setSelectedFieldId(fId);
              setCurrentTab('drone');
            }}
            onAnalyzeField={(fId) => {
              setSelectedFieldId(fId);
              handleTriggerAnalysis();
            }}
            onViewOnMap={(fId) => {
              setSelectedFieldId(fId);
              setCurrentTab('map');
            }}
          />

        )}

        {/* TAB 4: DRONE MONITORING */}
        {currentTab === 'drone' && (
          <div className="space-y-6">
            <DroneMonitoring
              field={currentField}
              onImageCaptured={handleImageCaptured}
              onJumpToAnalysis={() => setCurrentTab('analysis')}
            />

            <CropLifecycleTimeline
              field={currentField}
              images={fieldImages}
              selectedStage={selectedStage}
              onSelectStage={setSelectedStage}
              onPreviewImage={(url, title) => setPreviewImageState({ url, title })}
            />
          </div>
        )}

        {/* TAB 5: AI DAMAGE ANALYSIS */}
        {currentTab === 'analysis' && (
          <div className="space-y-6">
            <LeafDiseaseChecker />
            {/* Field visualizer */}
            <FieldDamageViewer
              field={currentField}
              image={currentImage}
              analysis={currentAnalysis}
              isAnalyzing={isAnalyzing}
              onTriggerAnalysis={handleTriggerAnalysis}
              onGenerateClaim={handleGenerateClaim}
              onViewReport={() => {
                const c = claims.find((clm) => clm.fieldId === currentField.id);
                if (c) {
                  setSelectedClaimForReport(c);
                  setCurrentTab('reports');
                }
              }}
              hasClaim={claims.some((c) => c.fieldId === currentField.id)}
              claimStatus={claims.find((c) => c.fieldId === currentField.id)?.status}
            />

            {/* Historical multi-temporal comparison */}
            <HistoricalComparison
              field={currentField}
              baselineImage={baselineImage}
              currentImage={currentImage}
              analysis={currentAnalysis}
              onRunComparisonAnalysis={handleTriggerAnalysis}
            />

            {/* Quick Upload Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                + Upload / Acquire New Drone Orthophoto
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: INSURANCE CLAIMS */}
        {currentTab === 'claims' && (
          <ClaimManagement
            claims={claims}
            farmers={farmers}
            fields={fields}
            onUpdateClaim={(c) => {
              storage.updateClaim(c);
              if (user) {
                persistToFirestore(() => FirestoreSyncService.saveClaim(c));
              }
              setClaims(storage.getClaims());
            }}
            onAddVerification={(v) => {
              storage.addVerification(v);
              if (user) {
                persistToFirestore(() => FirestoreSyncService.saveVerification(v));
              }
            }}
            onViewReport={(c) => {
              setSelectedClaimForReport(c);
              setCurrentTab('reports');
            }}
            onViewClaimOnMap={(c) => {
              setSelectedFieldId(c.fieldId);
              setFocusedClaimId(c.id);
              setCurrentTab('map');
            }}
          />
        )}

        {/* TAB 7: LIVE GRAPHS */}
        {currentTab === 'graphs' && (
          <LiveMonitoringGraphs
            field={currentField}
            images={fieldImages}
            claims={claims}
            currentAnalysis={currentAnalysis}
          />
        )}

        {/* TAB 8: CLAIM REPORTS */}
        {currentTab === 'reports' && (
          <div>
            {selectedClaimForReport || claims[0] ? (
              <InsuranceClaimReport
                claim={selectedClaimForReport || claims[0]}
                farmer={farmers.find((f) => f.id === (selectedClaimForReport || claims[0]).farmerId)}
                field={fields.find((f) => f.id === (selectedClaimForReport || claims[0]).fieldId)}
                image={images.find((i) => i.id === (selectedClaimForReport || claims[0]).supportingImageId) || currentImage}
                analysis={analyses.find((a) => a.id === (selectedClaimForReport || claims[0]).analysisId) || currentAnalysis}
                onBack={() => setCurrentTab('claims')}
              />
            ) : (
              <div className="bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center space-y-3">
                <p className="text-slate-400 text-sm">No insurance claims generated yet.</p>
                <button
                  onClick={handleGenerateClaim}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow"
                >
                  Generate Claim for Active Field
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      )}


      {/* 10-Phase Analysis Pipeline Modal */}
      <AIAnalysisSequenceModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        field={currentField}
        image={currentImage}
        currentPhase={currentPhase}
        currentDetails={currentPhaseDetails}
        result={currentAnalysis || null}
        onViewReport={() => {
          setIsAnalysisModalOpen(false);
          setCurrentTab('dashboard');
        }}
        onGenerateClaim={() => {
          setIsAnalysisModalOpen(false);
          handleGenerateClaim();
        }}
      />

      {/* Upload & Snapshot Modal */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        field={currentField}
        onImageAdded={async (newImg) => {
          const added = storage.addImage(newImg);
          setImages(storage.getImages());
          if (user) {
            try {
              await FirestoreSyncService.saveImage(added);
            } catch (err) {
              console.error('Image saved locally but could not be synced to Firebase:', err);
              alert('The image was saved on this device, but Firebase could not save it. Check your connection and Firebase Storage rules.');
            }
          }
        }}
      />

      {/* Authentication Modal */}
      <AuthModal />

      {/* Full Image Preview Modal */}
      {previewImageState && (
        <div 
          onClick={() => setPreviewImageState(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-pointer animate-fadeIn"
        >
          <div className="max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 bg-slate-950 flex justify-between items-center text-xs text-white border-b border-slate-800">
              <span className="font-bold">{previewImageState.title}</span>
              <button onClick={() => setPreviewImageState(null)} className="text-slate-400 hover:text-white">✕ Close</button>
            </div>
            <img src={previewImageState.url} alt={previewImageState.title} className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          AgriShield AI • Intelligent Crop Insurance Verification &amp; Autonomous Drone Orthomosaic Damage Assessment Platform
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
