import React, { useState, useRef, useEffect } from 'react';
import { Motorcycle, Part, ExtraPart } from '../types';
import { X, Wrench, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Loader2, Mic, ListChecks, ArrowRight } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Props = {
  motorcycle: Motorcycle;
  onClose: () => void;
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

export default function MotorcycleModal({ motorcycle, onClose, onUpdateMotorcycle }: Props) {
  // Budget Creation State
  const [budgetDesc, setBudgetDesc] = useState(motorcycle.budgetDescription || '');
  const [parts, setParts] = useState<Part[]>(motorcycle.parts || []);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  
  // AI & Audio State
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [aiServiceSuggestions, setAiServiceSuggestions] = useState<string[]>([]);
  const [aiPartSuggestions, setAiPartSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Execution State
  const [completedActions, setCompletedActions] = useState<string[]>(motorcycle.completedActions || []);
  const [usedParts, setUsedParts] = useState<string[]>(motorcycle.usedParts || []);
  const [extraParts, setExtraParts] = useState<ExtraPart[]>(motorcycle.extraParts || []);
  const [newExtraPartName, setNewExtraPartName] = useState('');
  const [newExtraPartQty, setNewExtraPartQty] = useState(1);
  const [newExtraPartJustification, setNewExtraPartJustification] = useState('');

  const actionsList = motorcycle.budgetDescription?.split('\n').filter(line => line.trim().length > 0) || [];

  // --- Actions ---

  const handleStartBudget = () => {
    onUpdateMotorcycle({ ...motorcycle, status: 'ORCAMENTO' });
    onClose();
  };

  const handleSendBudget = () => {
    onUpdateMotorcycle({
      ...motorcycle,
      status: 'AGUARDANDO_PECAS',
      budgetDescription: budgetDesc,
      parts,
    });
    onClose();
  };

  const handleStartExecution = () => {
    onUpdateMotorcycle({ ...motorcycle, status: 'EM_ANDAMENTO' });
    onClose();
  };

  const handleFinishOrRequestMore = () => {
    if (extraParts.length > 0) {
      // Merge extra parts into main parts list so they can be bought
      const mergedParts = [...(motorcycle.parts || []), ...extraParts.map(ep => ({ id: ep.id, name: ep.name, quantity: ep.quantity }))];
      
      // Append justifications to description
      const updatedDesc = motorcycle.budgetDescription + '\n\n*Adendo (Novas Peças Solicitadas):*\n' + extraParts.map(ep => `- ${ep.name} (${ep.quantity}x): ${ep.justification}`).join('\n');

      onUpdateMotorcycle({
        ...motorcycle,
        status: 'AGUARDANDO_PECAS',
        completedActions,
        usedParts,
        parts: mergedParts,
        extraParts: [], // cleared because they are now requested
        budgetDescription: updatedDesc
      });
    } else {
      onUpdateMotorcycle({
        ...motorcycle,
        status: 'FINALIZADO',
        completedActions,
        usedParts
      });
    }
    onClose();
  };

  // --- Parts Handlers ---

  const handleAddPart = () => {
    if (newPartName.trim()) {
      setParts([...parts, { id: Date.now().toString(), name: newPartName, quantity: newPartQty }]);
      setNewPartName('');
      setNewPartQty(1);
    }
  };

  const handleRemovePart = (id: string) => {
    setParts(parts.filter((p) => p.id !== id));
  };

  const handleAddExtraPart = () => {
    if (newExtraPartName.trim() && newExtraPartJustification.trim()) {
      setExtraParts([...extraParts, { 
        id: Date.now().toString(), 
        name: newExtraPartName, 
        quantity: newExtraPartQty,
        justification: newExtraPartJustification
      }]);
      setNewExtraPartName('');
      setNewExtraPartQty(1);
      setNewExtraPartJustification('');
    }
  };

  const handleRemoveExtraPart = (id: string) => {
    setExtraParts(extraParts.filter((p) => p.id !== id));
  };

  // --- AI & Audio Handlers ---

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    try {
      const prompt = `
        Atue como um mecânico de motos experiente.
        Com base nas observações do problema da moto, sugira de 3 a 6 tópicos curtos (tags) de serviços que provavelmente precisarão ser feitos, E TAMBÉM sugira peças que provavelmente precisarão ser trocadas.
        Modelo: ${motorcycle.model}
        Observações: ${motorcycle.observations || 'Nenhuma observação específica'}
        
        Retorne APENAS um objeto JSON com duas listas de strings curtas: "services" (para serviços) e "parts" (para peças). Exemplo: {"services": ["Troca de óleo", "Limpeza do carburador"], "parts": ["Filtro de óleo", "Vela de ignição"]}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              services: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de sugestões de serviços em tópicos curtos.'
              },
              parts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de sugestões de peças em tópicos curtos.'
              }
            },
            required: ['services', 'parts']
          }
        }
      });

      let text = response.text || '{"services":[], "parts":[]}';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let result = { services: [], parts: [] };
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          result.services = Array.isArray(parsed.services) ? parsed.services : [];
          result.parts = Array.isArray(parsed.parts) ? parsed.parts : [];
        }
      } catch (e) {
        console.error('Failed to parse JSON:', text);
      }
      
      setAiServiceSuggestions(result.services);
      setAiPartSuggestions(result.parts);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      alert('Não foi possível gerar sugestões automaticamente. Tente novamente.');
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          await transcribeAudio(base64data, audioBlob.type);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (base64data: string, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              data: base64data,
              mimeType: mimeType
            }
          },
          { text: "Transcreva o áudio deste mecânico descrevendo o serviço a ser feito na moto. Simplifique o áudio extraindo apenas o que deve ser feito. Faça em tópicos simples e diretos, começando com hífen e em letras MAIÚSCULAS. Exemplo:\n- TROCA DE ÓLEO\n- TROCAR EMBREAGEM\n- VERIFICAR BARULHO" }
        ]
      });
      
      const text = response.text || '';
      setBudgetDesc(prev => prev ? prev + '\n\n' + text : text);
    } catch (error) {
      console.error("Erro na transcrição:", error);
      alert("Erro ao transcrever o áudio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm font-sans">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[2rem] bg-white shadow-2xl overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{motorcycle.model}</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">{motorcycle.brand} • {motorcycle.plate}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${conditionColors[motorcycle.condition]}`}>
              Estado: {conditionLabels[motorcycle.condition]}
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Ano: {motorcycle.year}
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Cor: {motorcycle.color}
            </span>
          </div>

          <div className="mb-8">
            <h3 className="mb-3 font-semibold text-zinc-900 tracking-tight">Observações de Entrada</h3>
            <div className="rounded-2xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 border border-zinc-200">
              {motorcycle.observations}
            </div>
          </div>

          {/* ORCAMENTO STAGE */}
          {motorcycle.status === 'ORCAMENTO' && (
            <div className="space-y-6 border-t border-zinc-200 pt-6">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2 tracking-tight">
                <Wrench size={18} className="text-orange-500" />
                Criar Orçamento e Peças
              </h3>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-700 ml-1">Descrição do Serviço</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                        isRecording 
                          ? 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 animate-pulse' 
                          : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 shadow-sm'
                      }`}
                    >
                      {isTranscribing ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
                      {isRecording ? 'Parar Gravação' : isTranscribing ? 'Transcrevendo...' : 'Gravar Áudio'}
                    </button>
                    <button
                      onClick={handleGenerateTags}
                      disabled={isGeneratingTags}
                      className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isGeneratingTags ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {isGeneratingTags ? 'Gerando...' : 'Sugestões IA'}
                    </button>
                  </div>
                </div>

                {aiServiceSuggestions.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                    <span className="w-full text-xs font-semibold text-orange-800 mb-1">Sugestões de Serviço (clique para adicionar):</span>
                    {aiServiceSuggestions.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setBudgetDesc(prev => prev ? prev + '\n- ' + tag : '- ' + tag);
                          setAiServiceSuggestions(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={budgetDesc}
                  onChange={(e) => setBudgetDesc(e.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 text-sm text-zinc-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                  placeholder="Descreva o serviço a ser realizado..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 ml-1">Peças Necessárias</label>
                
                {aiPartSuggestions.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                    <span className="w-full text-xs font-semibold text-orange-800 mb-1">Sugestões de Peças (clique para adicionar):</span>
                    {aiPartSuggestions.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setParts(prev => [...prev, { id: Date.now().toString() + Math.random(), name: tag, quantity: 1 }]);
                          setAiPartSuggestions(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Nome da peça"
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm text-zinc-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(parseInt(e.target.value) || 1)}
                    className="w-20 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm text-zinc-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all text-center"
                  />
                  <button
                    onClick={handleAddPart}
                    className="flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-white hover:bg-black transition-all focus:outline-none focus:ring-4 focus:ring-zinc-900/20 active:scale-[0.98]"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {parts.length > 0 && (
                  <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                    {parts.map((part) => (
                      <li key={part.id} className="flex items-center justify-between p-3.5 text-sm">
                        <span className="font-medium text-zinc-700">{part.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-zinc-500 font-medium bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-100">Qtd: {part.quantity}</span>
                          <button onClick={() => handleRemovePart(part.id)} className="text-zinc-400 hover:text-orange-600 hover:bg-orange-50 p-1.5 rounded-md transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* AGUARDANDO_PECAS STAGE */}
          {motorcycle.status === 'AGUARDANDO_PECAS' && (
            <div className="space-y-6 border-t border-zinc-200 pt-6">
              <div className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 text-orange-800 border border-orange-100">
                <AlertCircle size={20} className="text-orange-500 flex-shrink-0" />
                <p className="text-sm font-medium">Aguardando aprovação do orçamento e entrega das peças.</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-zinc-900 tracking-tight">Serviço Orçado</h3>
                <p className="text-sm text-zinc-700 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 leading-relaxed whitespace-pre-wrap">{motorcycle.budgetDescription || 'Sem descrição.'}</p>
              </div>

              {motorcycle.parts && motorcycle.parts.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold text-zinc-900 tracking-tight">Peças Solicitadas</h3>
                  <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                    {motorcycle.parts.map((part) => (
                      <li key={part.id} className="flex items-center justify-between p-3.5 text-sm">
                        <span className="font-medium text-zinc-700">{part.name}</span>
                        <span className="text-zinc-500 font-medium bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-100">Qtd: {part.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* EM_ANDAMENTO (EXECUÇÃO) STAGE */}
          {motorcycle.status === 'EM_ANDAMENTO' && (
            <div className="space-y-6 border-t border-zinc-200 pt-6">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2 tracking-tight">
                <ListChecks size={18} className="text-orange-500" />
                Checklist de Execução
              </h3>

              {/* Actions Checklist */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-zinc-700">Ações do Orçamento</h4>
                {actionsList.length > 0 ? (
                  <div className="space-y-2">
                    {actionsList.map((action, idx) => (
                      <label key={idx} className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3.5 hover:bg-zinc-50 cursor-pointer transition-colors bg-white shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={completedActions.includes(action)}
                          onChange={(e) => {
                            if (e.target.checked) setCompletedActions([...completedActions, action]);
                            else setCompletedActions(completedActions.filter(a => a !== action));
                          }}
                          className="mt-0.5 h-4.5 w-4.5 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className={`text-sm ${completedActions.includes(action) ? 'text-zinc-400 line-through' : 'text-zinc-700 font-medium'}`}>
                          {action.replace(/^[-*]\s*/, '')}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 italic">Nenhuma ação descrita no orçamento.</p>
                )}
              </div>

              {/* Parts Checklist */}
              {motorcycle.parts && motorcycle.parts.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-zinc-700">Peças a Utilizar</h4>
                  <div className="space-y-2">
                    {motorcycle.parts.map((part) => (
                      <label key={part.id} className="flex items-center justify-between rounded-xl border border-zinc-200 p-3.5 hover:bg-zinc-50 cursor-pointer transition-colors bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={usedParts.includes(part.id)}
                            onChange={(e) => {
                              if (e.target.checked) setUsedParts([...usedParts, part.id]);
                              else setUsedParts(usedParts.filter(id => id !== part.id));
                            }}
                            className="h-4.5 w-4.5 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className={`text-sm font-medium ${usedParts.includes(part.id) ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                            {part.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-100">Qtd: {part.quantity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Parts Section */}
              <div className="rounded-2xl bg-orange-50 p-5 border border-orange-100">
                <h4 className="mb-3 text-sm font-semibold text-orange-900 flex items-center gap-2">
                  <Plus size={16} />
                  Necessita de Mais Peças?
                </h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExtraPartName}
                      onChange={(e) => setNewExtraPartName(e.target.value)}
                      placeholder="Nome da peça extra"
                      className="flex-1 rounded-xl border border-orange-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 bg-white"
                    />
                    <input
                      type="number"
                      min="1"
                      value={newExtraPartQty}
                      onChange={(e) => setNewExtraPartQty(parseInt(e.target.value) || 1)}
                      className="w-20 rounded-xl border border-orange-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 bg-white text-center"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExtraPartJustification}
                      onChange={(e) => setNewExtraPartJustification(e.target.value)}
                      placeholder="Justificativa obrigatória..."
                      className="flex-1 rounded-xl border border-orange-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 bg-white"
                    />
                    <button
                      onClick={handleAddExtraPart}
                      disabled={!newExtraPartName.trim() || !newExtraPartJustification.trim()}
                      className="flex items-center justify-center rounded-xl bg-orange-600 px-5 py-2.5 text-white font-medium hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      Adicionar
                    </button>
                  </div>

                  {extraParts.length > 0 && (
                    <ul className="mt-4 divide-y divide-orange-100 rounded-xl border border-orange-200 bg-white overflow-hidden shadow-sm">
                      {extraParts.map((part) => (
                        <li key={part.id} className="p-3.5 text-sm">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-zinc-800">{part.name} <span className="text-zinc-500 font-normal text-xs ml-2">Qtd: {part.quantity}</span></span>
                            <button onClick={() => handleRemoveExtraPart(part.id)} className="text-zinc-400 hover:text-orange-600 p-1 rounded-md hover:bg-orange-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-orange-800 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100 mt-2">
                            <span className="font-semibold">Justificativa:</span> {part.justification}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* FINALIZADO STAGE */}
          {motorcycle.status === 'FINALIZADO' && (
            <div className="space-y-6 border-t border-zinc-200 pt-6">
              <div className="flex items-center gap-3 rounded-2xl bg-zinc-100 p-4 text-zinc-800 border border-zinc-200">
                <CheckCircle2 size={20} className="text-zinc-500 flex-shrink-0" />
                <p className="text-sm font-medium">Serviço finalizado com sucesso.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-200 bg-zinc-50/80 px-6 py-4 flex justify-end gap-3 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-200/50 transition-colors focus:outline-none focus:ring-4 focus:ring-zinc-200"
          >
            Fechar
          </button>
          
          {motorcycle.status === 'OFICINA' && (
            <button
              onClick={handleStartBudget}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98] shadow-sm"
            >
              <Wrench size={16} />
              Iniciar Orçamento
            </button>
          )}

          {motorcycle.status === 'ORCAMENTO' && (
            <button
              onClick={handleSendBudget}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black transition-all focus:outline-none focus:ring-4 focus:ring-zinc-900/20 active:scale-[0.98] shadow-sm"
            >
              <ArrowRight size={16} />
              Enviar Orçamento
            </button>
          )}

          {motorcycle.status === 'AGUARDANDO_PECAS' && (
            <button
              onClick={handleStartExecution}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98] shadow-sm"
            >
              <Wrench size={16} />
              Peças Chegaram / Iniciar Serviço
            </button>
          )}

          {motorcycle.status === 'EM_ANDAMENTO' && (
            <button
              onClick={handleFinishOrRequestMore}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-4 active:scale-[0.98] shadow-sm ${
                extraParts.length > 0 
                  ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500/20' 
                  : 'bg-green-500 hover:bg-green-600 focus:ring-green-500/20'
              }`}
            >
              {extraParts.length > 0 ? (
                <>
                  <AlertCircle size={16} />
                  Solicitar Novas Peças
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Finalizar Serviço
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
