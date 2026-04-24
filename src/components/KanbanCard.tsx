import { useState } from 'react';
import { Motorcycle } from '../types';
import MotorcycleModal from './MotorcycleModal';
import { Calendar, Tag } from 'lucide-react';

type Props = {
  key?: string;
  motorcycle: Motorcycle;
  onUpdateMotorcycle: (moto: Motorcycle) => void;
};

const conditionColors = {
  MUITO_RUIM: 'bg-zinc-900 text-white border-zinc-800',
  RUIM: 'bg-zinc-700 text-white border-zinc-600',
  REGULAR: 'bg-zinc-500 text-white border-zinc-400',
  BOM: 'bg-orange-100 text-orange-800 border-orange-200',
  MUITO_BOM: 'bg-orange-500 text-white border-orange-400',
};

const conditionLabels = {
  MUITO_RUIM: 'Muito Ruim',
  RUIM: 'Ruim',
  REGULAR: 'Regular',
  BOM: 'Bom',
  MUITO_BOM: 'Muito Bom',
};

export default function KanbanCard({ motorcycle, onUpdateMotorcycle }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-500 active:scale-[0.98]"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h4 className="font-bold text-zinc-900 leading-tight tracking-tight">{motorcycle.model}</h4>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${
              conditionColors[motorcycle.condition]
            }`}
          >
            {conditionLabels[motorcycle.condition]}
          </span>
        </div>
        
        <div className="mb-3 flex items-center gap-3 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md">
            <Tag size={12} className="text-zinc-400" />
            <span>{motorcycle.plate}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md">
            <Calendar size={12} className="text-zinc-400" />
            <span>{motorcycle.year}</span>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-zinc-600 leading-relaxed">
          {motorcycle.observations}
        </p>
      </div>

      {isModalOpen && (
        <MotorcycleModal
          motorcycle={motorcycle}
          onClose={() => setIsModalOpen(false)}
          onUpdateMotorcycle={onUpdateMotorcycle}
        />
      )}
    </>
  );
}
