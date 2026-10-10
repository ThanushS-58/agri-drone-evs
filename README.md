<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e610c3b2-b006-4608-982b-1f29428c919f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firebase setup

The app uses Firebase Authentication and Cloud Firestore for farmer, field, drone image metadata, AI analysis, claim, verification, and environmental-event records. Image data uploaded or captured in the app is stored in Firebase Storage. When signed out, the app keeps its existing local-device storage and syncs it to Firebase after sign-in.

1. Open the [Firebase console](https://console.firebase.google.com/), create or select a project, then use **Project settings → General → Your apps → Add app → Web** to register a web app.
2. Copy the web app's Firebase SDK configuration into `firebase-applet-config.json`. Keep its `firestoreDatabaseId` set to the ID of the Firestore database you create (use `(default)` for the default database).
3. In **Build → Authentication → Sign-in method**, enable the providers used by the app (Google and Email/Password).
4. In **Build → Firestore Database**, create the selected database and publish the project's `firestore.rules` rules in the Firestore **Rules** tab.
5. In **Build → Storage**, enable the default bucket and publish `storage.rules` in the Storage **Rules** tab.

Firebase web configuration is intended to be included in client apps; it is not a server credential. Never put a service-account private key in this frontend project or share it in chat. Restrict the web API key to your app's domains in Google Cloud Console.

## Adding records to Firestore

The recommended way to add dataset records is to sign in to the app and create farmers, fields, images, claims, or other records through its screens. The app writes each record to Firestore, and Firestore creates the collection automatically on the first write. Records created while signed out stay in this browser until sign-in and sync.

To add a small number of records manually, open **Firebase console → Build → Firestore Database → Data**, choose **Start collection** (or **Add collection**), enter the collection name below, and add a document. Use the app's record ID as the document ID. Supported collection names are `farmers`, `fields`, `images`, `analyses`, `claims`, `verifications`, and `environmental_events`. Sign in to the app before testing: the Firestore rules deny unauthenticated reads and writes.

For example, a farmer document belongs in `farmers` and can use a document ID such as `FRM-2026-081`. A field document belongs in `fields`, with an `id` matching its document ID and a `farmerId` matching an existing farmer document. Add field coordinates as numbers (`latitude`, `longitude`). If adding `boundaryCoordinates`, use an array of maps such as `[{ "latitude": 29.68, "longitude": 76.99 }]`; Firestore does not accept nested arrays.

Drone image files should be added through the app so they are uploaded to Firebase Storage; store their metadata in `images`. The Firestore console is suitable for a few manual documents, but does not provide a general CSV/JSON dataset import. For bulk imports, use a trusted one-time Admin SDK script on a secured machine; never put a service-account key in this frontend app.

## Importing the sample dataset and images

Open the app's **Farmers** tab and select **Sample CSV** to download [`public/sample-agri-dataset.csv`](./public/sample-agri-dataset.csv), or select **Import CSV** to load a CSV with the same columns. Each row creates or reuses a farmer and field, then adds a generated sample drone image with the row's crop stage and damage scenario. The sample names, contact details, policy numbers, and generated images are fictional demonstrations, not real farmer records or training data. Importing again reuses matching farmer emails and field names.

To add an actual image, open **Drone Monitoring**, select the target field, choose **Upload / Acquire New Drone Orthophoto**, then select **Upload Drone Image** and pick the image file. Sign in first to sync the image to Firebase; image files are stored in Firebase Storage, while their field/capture metadata is stored in Firestore. The CSV sample does not contain actual image files.

## Optional pretrained leaf-disease model

The **AI Damage Analysis** tab also has a separate leaf-photo checker powered by [`mesabo/agri-plant-disease-resnet50`](https://huggingface.co/mesabo/agri-plant-disease-resnet50), a public ResNet-50 model trained on PlantVillage. Its model card declares the Apache-2.0 license and reports 38 leaf-disease/healthy classes. This is a close-up leaf classifier—not an aerial/drone damage model—and the reported evaluation is from the dataset's test set, not a guarantee for field photos. Use predictions as research/demo assistance only, not insurance evidence or a diagnosis.

Inference runs locally through the optional Python service; it does not use a paid hosted inference API and does not save the uploaded leaf photo in Firebase. The first run needs internet to download the model weights (about 91 MB, as reported by the model card), then requires a Python 3.11 environment and local CPU/memory. From the project root in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\ml-service\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir .\ml-service --host 127.0.0.1 --port 8000
```

Keep that service running while using the web app. The browser sends only the selected leaf photo to this local service. The service accepts image uploads up to 10 MB and allows the app's local development origins by default. To change the API address, set `VITE_LEAF_MODEL_API_URL` in the Vite environment before starting the web app. Do not expose this development service publicly without adding authentication, HTTPS, and deployment-specific access controls.
