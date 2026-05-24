export interface Equipment {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
  location?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  installDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentRequest {
  assetTag: string;
  name: string;
  category: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
}

export interface UpdateEquipmentRequest {
  name: string;
  category: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
}
export interface EquipmentDocument {
  id: string;
  equipmentId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  version: number;
  checksumSha256: string;
  extractedTextSnippet?: string | null;
  uploadedAt: string;
  uploadedBy?: string | null;
}

export type TelemetryMetricType = 'TEMPERATURE' | 'VIBRATION' | 'PRESSURE' | 'RUNTIME_HOURS';

export interface TelemetryPoint {
  id: string;
  equipmentId: string;
  metricType: TelemetryMetricType;
  metricValue: number;
  unit?: string | null;
  recordedAt: string;
  source?: string | null;
  createdAt: string;
}

export type EquipmentMediaType = 'PHOTO' | 'VIDEO';

export interface EquipmentMediaItem {
  id: string;
  equipmentId: string;
  mediaType: EquipmentMediaType;
  fileName: string;
  filePath: string;
  mimeType?: string | null;
  fileSize?: number | null;
  checksumSha256: string;
  annotation?: string | null;
  uploadedAt: string;
  uploadedBy?: string | null;
}

export interface ChangeRequest {
  id: string;
  entityType: string;
  entityId?: string | null;
  changeType: 'CREATE' | 'UPDATE';
  proposedData: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy?: string | null;
  approvedBy?: string | null;
  approvalNotes?: string | null;
  createdAt: string;
  decidedAt?: string | null;
}

export interface CreateChangeRequest {
  entityType: string;
  entityId?: string;
  changeType: 'CREATE' | 'UPDATE';
  proposedData: string;
}

export interface DecideChangeRequest {
  approvalNotes?: string;
}
