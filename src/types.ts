export type Mechanic = {
  id: string;
  name: string;
  isAdmin?: boolean;
};

export type TimeEntry = {
  id: string;
  mechanicId: string;
  mechanicName: string;
  timestamp: string;
  location: string;
};

export type ConditionLevel = 'MUITO_RUIM' | 'RUIM' | 'REGULAR' | 'BOM' | 'MUITO_BOM';

export type MotorcycleStatus = 'OFICINA' | 'ORCAMENTO' | 'AGUARDANDO_PECAS' | 'EM_ANDAMENTO' | 'FINALIZADO';

export type Part = {
  id: string;
  name: string;
  quantity: number;
};

export type ExtraPart = Part & {
  justification: string;
};

export type Motorcycle = {
  id: string;
  mechanicId: string;
  model: string;
  brand: string;
  plate: string;
  year: number;
  color: string;
  status: MotorcycleStatus;
  condition: ConditionLevel;
  observations: string;
  budgetDescription?: string;
  parts?: Part[];
  extraParts?: ExtraPart[];
  completedActions?: string[];
  usedParts?: string[];
};
