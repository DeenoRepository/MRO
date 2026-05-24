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

