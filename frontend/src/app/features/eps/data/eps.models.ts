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
