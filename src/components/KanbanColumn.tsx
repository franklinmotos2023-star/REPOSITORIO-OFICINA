import { Motorcycle, MotorcycleStatus } from '../types';
import KanbanCard from './KanbanCard';

type Props = {
  key?: string;
  title: string;
  status: MotorcycleStatus;
  motorcycles: Motorcycle[];
  onUpdateMotorcycle: (moto: Motorcycle) => void;
};

export default function KanbanColumn({ title, status, motorcycles, onUpdateMotorcycle }: Props) {
  return (
    <div className="flex h-full w-80 flex-shrink-0 flex-col rounded-[1.25rem] bg-zinc-200/60 border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-300/50 bg-white/40 backdrop-blur-sm rounded-t-[1.25rem]">
        <h3 className="font-semibold text-zinc-900 tracking-tight text-sm flex items-center gap-2.5">
          {status === 'OFICINA' && <span className="w-2 h-2 rounded-full bg-zinc-300 shadow-sm"></span>}
          {status === 'ORCAMENTO' && <span className="w-2 h-2 rounded-full bg-zinc-500 shadow-sm"></span>}
          {status === 'AGUARDANDO_PECAS' && <span className="w-2 h-2 rounded-full bg-orange-300 shadow-sm"></span>}
          {status === 'EM_ANDAMENTO' && <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm"></span>}
          {status === 'FINALIZADO' && <span className="w-2 h-2 rounded-full bg-zinc-900 shadow-sm"></span>}
          {title}
        </h3>
        <span className="flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-full bg-zinc-300/80 text-xs font-semibold text-zinc-700">
          {motorcycles.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {motorcycles.map((moto) => (
          <KanbanCard key={moto.id} motorcycle={moto} onUpdateMotorcycle={onUpdateMotorcycle} />
        ))}
        {motorcycles.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-500 bg-zinc-100/50">
            Nenhuma moto
          </div>
        )}
      </div>
    </div>
  );
}
