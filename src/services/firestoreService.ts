import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { db, auth, firebaseStorage, handleFirestoreError, reportFirestoreError, OperationType } from './firebase';
import { Farmer, AgriculturalField, DroneImage, AIAnalysisResult, InsuranceClaim, ClaimVerificationRecord, EnvironmentalEvent } from '../types';

type FirestoreField = Omit<AgriculturalField, 'boundaryCoordinates'> & {
  boundaryCoordinates?: { latitude: number; longitude: number }[];
};

const fromFirestoreField = (data: FirestoreField): AgriculturalField => ({
  ...data,
  boundaryCoordinates: data.boundaryCoordinates?.map(({ latitude, longitude }) => [latitude, longitude]),
});

const toFirestoreField = (field: AgriculturalField): FirestoreField => ({
  ...field,
  boundaryCoordinates: field.boundaryCoordinates?.map(([latitude, longitude]) => ({ latitude, longitude })),
});

export class FirestoreSyncService {

  // Sync Farmers
  static async getFarmers(): Promise<Farmer[]> {
    const path = 'farmers';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => d.data() as Farmer);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  static async saveFarmer(farmer: Farmer): Promise<void> {
    const path = `farmers/${farmer.id}`;
    try {
      await setDoc(doc(db, 'farmers', farmer.id), {
        ...farmer,
        createdBy: auth.currentUser?.uid || 'system',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  static async deleteFarmer(farmerId: string): Promise<void> {
    const path = `farmers/${farmerId}`;
    try {
      await deleteDoc(doc(db, 'farmers', farmerId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // Sync Agricultural Fields
  static async getFields(): Promise<AgriculturalField[]> {
    const path = 'fields';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => fromFirestoreField(d.data() as FirestoreField));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  static async saveField(field: AgriculturalField): Promise<void> {
    const path = `fields/${field.id}`;
    try {
      await setDoc(doc(db, 'fields', field.id), {
        ...toFirestoreField(field),
        createdBy: auth.currentUser?.uid || 'system',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  static async deleteField(fieldId: string): Promise<void> {
    const path = `fields/${fieldId}`;
    try {
      await deleteDoc(doc(db, 'fields', fieldId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // Sync Drone Orthomosaic Images (Real-time storage)
  static async getImages(): Promise<DroneImage[]> {
    const path = 'images';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => d.data() as DroneImage);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  static async saveImage(image: DroneImage): Promise<void> {
    const path = `images/${image.id}`;
    try {
      let imageToSave = image;
      if (image.imageUrl.startsWith('data:')) {
        const fileRef = ref(firebaseStorage, `drone-images/${image.id}`);
        await uploadString(fileRef, image.imageUrl, 'data_url');
        imageToSave = { ...image, imageUrl: await getDownloadURL(fileRef) };
      }
      await setDoc(doc(db, 'images', image.id), {
        ...imageToSave,
        createdBy: auth.currentUser?.uid || 'system',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Sync AI analysis results
  static async getAnalyses(): Promise<AIAnalysisResult[]> {
    const path = 'analyses';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => d.data() as AIAnalysisResult);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  static async saveAnalysis(analysis: AIAnalysisResult): Promise<void> {
    const path = `analyses/${analysis.id}`;
    try {
      await setDoc(doc(db, 'analyses', analysis.id), {
        ...analysis,
        createdBy: auth.currentUser?.uid || 'system',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Sync Claims
  static async getClaims(): Promise<InsuranceClaim[]> {
    const path = 'claims';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => d.data() as InsuranceClaim);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  static async saveClaim(claim: InsuranceClaim): Promise<void> {
    const path = `claims/${claim.id}`;
    try {
      await setDoc(doc(db, 'claims', claim.id), {
        ...claim,
        supportingImageUrl: claim.supportingImageUrl?.startsWith('data:') ? '' : claim.supportingImageUrl || '',
        createdBy: auth.currentUser?.uid || 'system',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Sync Verifications
  static async saveVerification(record: ClaimVerificationRecord): Promise<void> {
    const path = `verifications/${record.id}`;
    try {
      await setDoc(doc(db, 'verifications', record.id), {
        ...record,
        verifiedByUid: auth.currentUser?.uid || 'admin',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  static async getVerifications(): Promise<ClaimVerificationRecord[]> {
    const path = 'verifications';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => d.data() as ClaimVerificationRecord);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  // Sync Environmental Events
  static async getEvents(): Promise<EnvironmentalEvent[]> {
    const path = 'environmental_events';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => d.data() as EnvironmentalEvent);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  }

  static async saveEvent(event: EnvironmentalEvent): Promise<void> {
    const path = `environmental_events/${event.id}`;
    try {
      await setDoc(doc(db, 'environmental_events', event.id), {
        ...event,
        createdBy: auth.currentUser?.uid || 'system',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Real-Time Listeners (onSnapshot)

  static subscribeToFarmers(onUpdate: (farmers: Farmer[]) => void): () => void {
    const path = 'farmers';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Farmer);
        onUpdate(list);
      },
      (error) => {
        reportFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  static subscribeToFields(onUpdate: (fields: AgriculturalField[]) => void): () => void {
    const path = 'fields';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list = snapshot.docs.map((d) => fromFirestoreField(d.data() as FirestoreField));
        onUpdate(list);
      },
      (error) => {
        reportFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  static subscribeToImages(onUpdate: (images: DroneImage[]) => void): () => void {
    const path = 'images';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as DroneImage);
        onUpdate(list);
      },
      (error) => {
        reportFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  static subscribeToClaims(onUpdate: (claims: InsuranceClaim[]) => void): () => void {
    const path = 'claims';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as InsuranceClaim);
        onUpdate(list);
      },
      (error) => {
        reportFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  static subscribeToAnalyses(onUpdate: (analyses: AIAnalysisResult[]) => void): () => void {
    const path = 'analyses';
    return onSnapshot(
      collection(db, path),
      (snapshot) => onUpdate(snapshot.docs.map((d) => d.data() as AIAnalysisResult)),
      (error) => reportFirestoreError(error, OperationType.GET, path)
    );
  }

  static subscribeToEvents(onUpdate: (events: EnvironmentalEvent[]) => void): () => void {
    const path = 'environmental_events';
    return onSnapshot(
      collection(db, path),
      (snapshot) => onUpdate(snapshot.docs.map((d) => d.data() as EnvironmentalEvent)),
      (error) => reportFirestoreError(error, OperationType.GET, path)
    );
  }

  static subscribeToVerifications(onUpdate: (records: ClaimVerificationRecord[]) => void): () => void {
    const path = 'verifications';
    return onSnapshot(
      collection(db, path),
      (snapshot) => onUpdate(snapshot.docs.map((d) => d.data() as ClaimVerificationRecord)),
      (error) => reportFirestoreError(error, OperationType.GET, path)
    );
  }
}
