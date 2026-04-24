import { useState } from 'react';
import { Mechanic, Motorcycle, TimeEntry } from '../types';
import { MOCK_MOTORCYCLES } from '../data';
import KanbanBoard from './KanbanBoard';
import Chatbot from './Chatbot';
import { LogOut, User, MapPin, Clock, DollarSign, TrendingUp, TrendingDown, Wallet, PieChart, Package, LayoutDashboard } from 'lucide-react';

type Props = {
  mechanic: Mechanic;
  timeEntries: TimeEntry[];
  onLogout: () => void;
};

export default function Dashboard({ mechanic, timeEntries, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'kanban' | 'pontos' | 'financeiro'>(mechanic.isAdmin ? 'financeiro' : 'kanban');
  
  // Admin sees all, mechanic sees only theirs
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>(
    mechanic.isAdmin 
      ? MOCK_MOTORCYCLES 
      : MOCK_MOTORCYCLES.filter((m) => m.mechanicId === mechanic.id)
  );

  const updateMotorcycle = (updatedMoto: Motorcycle) => {
    setMotorcycles((prev) =>
      prev.map((m) => (m.id === updatedMoto.id ? updatedMoto : m))
    );
  };

  const visibleEntries = mechanic.isAdmin 
    ? timeEntries 
    : timeEntries.filter(e => e.mechanicId === mechanic.id);

  return (
    <div className="flex h-screen flex-col bg-zinc-100 relative font-sans">
      <header className="flex items-center justify-between bg-zinc-950 px-6 py-4 text-white shadow-md z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm shadow-orange-500/50">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {mechanic.isAdmin ? 'Administrador' : 'Mecânico Logado'}
            </h2>
            <p className="font-bold text-white text-sm">{mechanic.name}</p>
          </div>
        </div>
        
        <nav className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {mechanic.isAdmin && (
            <button 
              onClick={() => setActiveTab('financeiro')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'financeiro' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <PieChart size={16} />
              Financeiro
            </button>
          )}
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'kanban' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <LayoutDashboard size={16} />
            Operacional
          </button>
          <button 
            onClick={() => setActiveTab('pontos')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'pontos' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Clock size={16} />
            {mechanic.isAdmin ? 'Pontos' : 'Meus Pontos'}
          </button>
        </nav>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white active:scale-95"
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        {activeTab === 'kanban' && (
          <KanbanBoard motorcycles={motorcycles} onUpdateMotorcycle={updateMotorcycle} />
        )}
        
        {activeTab === 'pontos' && (
          <div className="h-full max-w-4xl mx-auto bg-white rounded-[2rem] shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                {mechanic.isAdmin ? 'Controle de Pontos' : 'Meus Registros de Ponto'}
              </h2>
              <p className="text-sm text-zinc-500 mt-1.5">Histórico de entradas no sistema com validação facial e localização.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              {visibleEntries.length > 0 ? (
                <div className="space-y-4">
                  {visibleEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-5 rounded-2xl border border-zinc-100 bg-white hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                          <Clock size={24} />
                        </div>
                        <div>
                          {mechanic.isAdmin && <p className="font-semibold text-zinc-900">{entry.mechanicName}</p>}
                          <p className={`text-sm ${mechanic.isAdmin ? 'text-zinc-500' : 'font-semibold text-zinc-900'}`}>
                            {new Date(entry.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100">
                        <MapPin size={14} className="text-zinc-400" />
                        {entry.location}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-zinc-400">
                  <Clock size={48} className="mb-4 text-zinc-200" />
                  <p>Nenhum registro de ponto encontrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && mechanic.isAdmin && (
          <div className="h-full max-w-6xl mx-auto flex flex-col gap-6 overflow-y-auto pb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Receita Total</h3>
                  <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <p className="text-4xl font-bold text-zinc-900 tracking-tight">R$ 24.500,00</p>
                <p className="text-sm text-zinc-500 mt-3 font-medium flex items-center gap-1">
                  <TrendingUp size={14} />
                  +12% em relação ao mês passado
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Despesas (Peças)</h3>
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <TrendingDown size={20} />
                  </div>
                </div>
                <p className="text-4xl font-bold text-zinc-900 tracking-tight">R$ 8.230,00</p>
                <p className="text-sm text-orange-500 mt-3 font-medium flex items-center gap-1">
                  <TrendingDown size={14} />
                  +5% em relação ao mês passado
                </p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Lucro Líquido</h3>
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <Wallet size={20} />
                  </div>
                </div>
                <p className="text-4xl font-bold text-zinc-900 tracking-tight">R$ 16.270,00</p>
                <p className="text-sm text-zinc-400 mt-3 font-medium">Atualizado hoje</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-zinc-200 p-8 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Últimas Transações</h2>
                  <button className="text-sm font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 px-4 py-2 rounded-full transition-colors">Ver todas</button>
                </div>
                
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  {[
                    { id: 1, desc: 'Serviço: Troca de Relação (Honda CG)', type: 'income', amount: 350.00, date: 'Hoje, 14:30' },
                    { id: 2, desc: 'Compra de Peças: Fornecedor MotoParts', type: 'expense', amount: 1200.00, date: 'Hoje, 10:15' },
                    { id: 3, desc: 'Serviço: Revisão Geral (Yamaha Fazer)', type: 'income', amount: 450.00, date: 'Ontem, 16:45' },
                    { id: 4, desc: 'Pagamento: Conta de Luz', type: 'expense', amount: 280.00, date: 'Ontem, 09:00' },
                    { id: 5, desc: 'Serviço: Troca de Óleo (Honda Biz)', type: 'income', amount: 80.00, date: 'Ontem, 08:30' },
                  ].map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-zinc-100 text-zinc-900' : 'bg-orange-50 text-orange-500'}`}>
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 text-[15px]">{tx.desc}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{tx.date}</p>
                        </div>
                      </div>
                      <p className={`font-bold text-lg tracking-tight ${tx.type === 'income' ? 'text-zinc-900' : 'text-orange-600'}`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-200 p-8 flex flex-col">
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight mb-6">Próximas Etapas</h2>
                <div className="space-y-4 flex-1">
                  <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-orange-100 p-2 rounded-xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Package size={20} />
                      </div>
                      <h3 className="font-semibold text-zinc-900">Organização de Estoque</h3>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">Em breve: Módulo para controle de entrada e saída de peças, alertas de estoque baixo e inventário.</p>
                  </div>
                  
                  <div className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-zinc-100 p-2 rounded-xl text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        <LayoutDashboard size={20} />
                      </div>
                      <h3 className="font-semibold text-zinc-900">Administração do Pátio</h3>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">Em breve: Visão geral do pátio, vagas ocupadas, tempo de permanência das motos e agendamentos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {activeTab === 'kanban' && <Chatbot motorcycles={motorcycles} />}
    </div>
  );
}
