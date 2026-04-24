import { Motorcycle, MotorcycleStatus } from '../types';
import KanbanColumn from './KanbanColumn';

type Props = {
  motorcycles: Motorcycle[];
  onUpdateMotorcycle: (moto: Motorcycle) => void;
};

export default function KanbanBoard({ motorcycles, onUpdateMotorcycle }: Props) {
  const columns: { id: MotorcycleStatus; title: string }[] = [
    { id: 'OFICINA', title: 'Oficina' },
    { id: 'ORCAMENTO', title: 'Orçamento' },
    { id: 'AGUARDANDO_PECAS', title: 'Aguardando Peças' },
    { id: 'EM_ANDAMENTO', title: 'Em Execução' },
    { id: 'FINALIZADO', title: 'Finalizado' },
  ];

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      {columns.map((col) => (
        <KanbanColumn
          key={col.id}
          title={col.title}
          status={col.id}
          motorcycles={motorcycles.filter((m) => m.status === col.id)}
          onUpdateMotorcycle={onUpdateMotorcycle}
        />
      ))}
    </div>
  );
}
