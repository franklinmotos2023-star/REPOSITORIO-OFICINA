import { Mechanic, Motorcycle } from './types';

export const MECHANICS: Mechanic[] = [
  { id: 'admin1', name: 'Franklin', isAdmin: true },
  { id: 'm1', name: 'Gleison Ribeiro' },
  { id: 'm2', name: 'Jonathan Oliveira' },
  { id: 'm3', name: 'Pedro Gerson' },
];

export const MOCK_MOTORCYCLES: Motorcycle[] = [
  // Gleison
  {
    id: 'moto1',
    mechanicId: 'm1',
    model: 'CG 160 Titan',
    brand: 'Honda',
    plate: 'ABC-1234',
    year: 2022,
    color: 'Vermelha',
    status: 'OFICINA',
    condition: 'BOM',
    observations: 'Cliente reclama de barulho no motor ao acelerar. Verificar também a folga da corrente.',
  },
  {
    id: 'moto2',
    mechanicId: 'm1',
    model: 'CB 300F Twister',
    brand: 'Honda',
    plate: 'DEF-5678',
    year: 2023,
    color: 'Dourada',
    status: 'OFICINA',
    condition: 'REGULAR',
    observations: 'Revisão de 10.000km. Verificar pastilhas de freio e trocar óleo.',
  },
  {
    id: 'moto3',
    mechanicId: 'm1',
    model: 'Fazer 250',
    brand: 'Yamaha',
    plate: 'GHI-9012',
    year: 2020,
    color: 'Azul',
    status: 'ORCAMENTO',
    condition: 'RUIM',
    observations: 'Moto não liga. Bateria descarregando rápido. Suspeita de problema no estator.',
    budgetDescription: '- Troca do estator\n- Troca do retificador\n- Carga lenta na bateria',
    parts: [
      { id: 'p1', name: 'Estator', quantity: 1 },
      { id: 'p2', name: 'Retificador', quantity: 1 }
    ]
  },
  // Jonathan
  {
    id: 'moto4',
    mechanicId: 'm2',
    model: 'XRE 300',
    brand: 'Honda',
    plate: 'JKL-3456',
    year: 2021,
    color: 'Cinza',
    status: 'OFICINA',
    condition: 'MUITO_RUIM',
    observations: 'Vazamento crônico de óleo na junta do cabeçote. Moto fumaçando.',
  },
  {
    id: 'moto5',
    mechanicId: 'm2',
    model: 'MT-03',
    brand: 'Yamaha',
    plate: 'MNO-7890',
    year: 2022,
    color: 'Preta',
    status: 'EM_ANDAMENTO',
    condition: 'MUITO_BOM',
    observations: 'Apenas troca de pneu traseiro e óleo. Cliente aguardando.',
    budgetDescription: '- Troca do pneu traseiro\n- Troca de óleo do motor\n- Troca do filtro de óleo',
    parts: [
      { id: 'p6', name: 'Pneu Traseiro 140/70-17', quantity: 1 },
      { id: 'p7', name: 'Óleo 10w40', quantity: 2 },
      { id: 'p8', name: 'Filtro de Óleo', quantity: 1 }
    ]
  },
  {
    id: 'moto6',
    mechanicId: 'm2',
    model: 'Ninja 400',
    brand: 'Kawasaki',
    plate: 'PQR-1234',
    year: 2023,
    color: 'Verde',
    status: 'AGUARDANDO_PECAS',
    condition: 'REGULAR',
    observations: 'Queda leve. Carenagem lateral ralada, pisca quebrado e manete torto.',
    budgetDescription: '- Substituição da carenagem direita\n- Troca do pisca dianteiro direito\n- Troca do manete de freio',
    parts: [
      { id: 'p3', name: 'Carenagem Direita', quantity: 1 },
      { id: 'p4', name: 'Pisca Dianteiro', quantity: 1 },
      { id: 'p5', name: 'Manete de Freio', quantity: 1 }
    ]
  },
  // Pedro
  {
    id: 'moto7',
    mechanicId: 'm3',
    model: 'Bros 160',
    brand: 'Honda',
    plate: 'STU-5678',
    year: 2019,
    color: 'Branca',
    status: 'OFICINA',
    condition: 'RUIM',
    observations: 'Suspensão dianteira vazando muito óleo. Retentores estourados.',
  },
  {
    id: 'moto8',
    mechanicId: 'm3',
    model: 'Crosser 150',
    brand: 'Yamaha',
    plate: 'VWX-9012',
    year: 2021,
    color: 'Areia',
    status: 'OFICINA',
    condition: 'REGULAR',
    observations: 'Relação gasta, estalando muito. Precisa trocar kit relação completo.',
  },
  {
    id: 'moto9',
    mechanicId: 'm3',
    model: 'GS 310',
    brand: 'BMW',
    plate: 'YZA-3456',
    year: 2022,
    color: 'Preta/Branca',
    status: 'ORCAMENTO',
    condition: 'MUITO_BOM',
    observations: 'Instalação de farol de milha e protetor de motor carenagem.',
    budgetDescription: '- Instalação do farol de milha\n- Instalação do protetor de carenagem\n- Revisão elétrica básica',
    parts: []
  }
];
