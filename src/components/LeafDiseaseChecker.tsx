import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Leaf, Upload } from 'lucide-react';

interface Prediction {
  label: string;
  score: number;
}

interface PredictionResponse {
  model: string;
  predictedLabel: string;
  confidence: number;
  predictions: Prediction[];
}

function isPredictionResponse(value: unknown): value is PredictionResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PredictionResponse>;
  return typeof candidate.model === 'string'
    && typeof candidate.predictedLabel === 'string'
    && typeof candidate.confidence === 'number'
    && Array.isArray(candidate.predictions)
    && candidate.predictions.every((prediction) =>
      typeof prediction.label === 'string' && typeof prediction.score === 'number'
    );
}

const modelApiUrl = (import.meta.env.VITE_LEAF_MODEL_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const LeafDiseaseChecker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const classifyLeaf = async () => {
    if (!file) return;
    setError('');
    setResult(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${modelApiUrl}/predict`, { method: 'POST', body: formData });
      const body: unknown = await response.json();
      if (!response.ok) {
        const detail = body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string'
          ? body.detail
          : `Model request failed (${response.status}).`;
        throw new Error(detail);
      }
      if (!isPredictionResponse(body)) throw new Error('The model service returned an invalid response.');
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error
        ? `${cause.message} Make sure the local model service is running at ${modelApiUrl}.`
        : 'Could not reach the local leaf disease model service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-800/70 bg-slate-900 p-5 shadow-xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-emerald-700 bg-emerald-950 p-2 text-emerald-300">
          <Leaf className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Pretrained Leaf Disease Checker</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Runs a pretrained PlantVillage classifier locally on the model service. Upload a close-up leaf photo;
            this model does not assess drone or whole-field images.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-3">
          <label className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-950/60 px-4 py-5 text-center text-xs text-slate-300 hover:border-emerald-500">
            <Upload className="h-4 w-4 text-emerald-400" />
            <span>{file ? file.name : 'Choose a leaf photo (JPG, PNG; max 10 MB)'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setResult(null);
                setError('');
              }}
            />
          </label>
          <button
            type="button"
            onClick={classifyLeaf}
            disabled={!file || isLoading}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Loading model / analyzing…' : 'Analyze leaf photo'}
          </button>
          {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
          {!error && !result && (
            <p className="text-xs text-slate-500">
              The first run downloads the model weights to the local Python service. Images are sent only to that service.
            </p>
          )}
        </div>

        {previewUrl && (
          <img src={previewUrl} alt="Selected leaf for classification" className="max-h-44 w-full rounded-xl border border-slate-700 object-contain" />
        )}
      </div>

      {result && (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="flex items-start gap-2">
            {result.predictedLabel.toLowerCase().includes('healthy')
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />}
            <div>
              <p className="text-sm font-bold text-white">{result.predictedLabel.replaceAll('_', ' ')}</p>
              <p className="text-xs text-slate-400">Model score: {(result.confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {result.predictions.map((prediction) => (
              <li key={prediction.label} className="flex justify-between gap-4">
                <span>{prediction.label.replaceAll('_', ' ')}</span>
                <span>{(prediction.score * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] leading-relaxed text-amber-200/80">
            Research/demo aid only. Model scores are not a field-damage estimate or an expert diagnosis.
            PlantVillage-style images may differ from real field conditions; confirm results with an agronomist.
          </p>
        </div>
      )}
    </section>
  );
};
