import React, { useState, useRef, useEffect } from 'react';
import { MECHANICS } from '../data';
import { Mechanic, TimeEntry } from '../types';
import { Wrench, Camera, MapPin, Loader2, CheckCircle2, ScanFace, UserPlus } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Props = {
  onLogin: (mechanic: Mechanic, timeEntry?: TimeEntry) => void;
};

export default function Login({ onLogin }: Props) {
  const [step, setStep] = useState<'credentials' | 'facial'>('credentials');
  const [selectedMechanicId, setSelectedMechanicId] = useState(MECHANICS[0].id);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [locationData, setLocationData] = useState<string>('');
  const [registeredFace, setRegisteredFace] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123') {
      const mechanic = MECHANICS.find((m) => m.id === selectedMechanicId);
      if (mechanic) {
        const savedFace = localStorage.getItem(`face_${mechanic.id}`);
        setRegisteredFace(savedFace);
        setStep('facial');
        startCamera();
      }
    } else {
      setError('Senha incorreta. A senha padrão é 123.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError("Não foi possível acessar a câmera para reconhecimento facial.");
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg').split(',')[1];
  };

  const handleRegisterFace = () => {
    const base64 = captureFrame();
    if (base64) {
      localStorage.setItem(`face_${selectedMechanicId}`, base64);
      setRegisteredFace(base64);
      setError('');
    }
  };

  const handleFacialRecognition = async () => {
    setIsProcessing(true);
    setError('');
    
    const currentFace = captureFrame();
    if (!currentFace || !registeredFace) {
      setError('Não foi possível capturar a imagem ou rosto não cadastrado.');
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Verify Face
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { inlineData: { data: registeredFace, mimeType: 'image/jpeg' } },
          { inlineData: { data: currentFace, mimeType: 'image/jpeg' } },
          { text: "Are these two images of the exact same person? Answer only YES or NO." }
        ]
      });

      const isMatch = response.text?.trim().toUpperCase().includes('YES');
      if (!isMatch) {
        setError('Rosto não reconhecido. Tente novamente.');
        setIsProcessing(false);
        return;
      }

      // 2. Get Location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              
              const mapResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Qual é o endereço exato ou local para estas coordenadas: Lat ${lat}, Lng ${lng}? Responda de forma curta e direta com o nome da rua, número e cidade.`,
                config: {
                  tools: [{ googleMaps: {} }],
                  toolConfig: {
                    retrievalConfig: {
                      latLng: {
                        latitude: lat,
                        longitude: lng
                      }
                    }
                  }
                }
              });

              const loc = mapResponse.text?.trim() || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
              setLocationData(loc);
              setLocationStatus('success');
              finalizeLogin(loc);
            } catch (mapErr) {
              console.error("Erro ao buscar endereço:", mapErr);
              const loc = `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`;
              setLocationData(loc);
              setLocationStatus('success');
              finalizeLogin(loc);
            }
          },
          (err) => {
            console.error("Erro de localização:", err);
            const loc = "Localização não disponível";
            setLocationData(loc);
            setLocationStatus('error');
            finalizeLogin(loc);
          },
          { timeout: 10000 }
        );
      } else {
        const loc = "Geolocalização não suportada";
        setLocationData(loc);
        setLocationStatus('error');
        finalizeLogin(loc);
      }
    } catch (err) {
      console.error("Erro no reconhecimento:", err);
      setError('Erro ao processar o reconhecimento facial.');
      setIsProcessing(false);
    }
  };

  const finalizeLogin = (loc: string) => {
    const mechanic = MECHANICS.find((m) => m.id === selectedMechanicId);
    if (mechanic) {
      const entry: TimeEntry = {
        id: Date.now().toString(),
        mechanicId: mechanic.id,
        mechanicName: mechanic.name,
        timestamp: new Date().toISOString(),
        location: loc
      };
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setTimeout(() => {
        onLogin(mechanic, entry);
      }, 1000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl border border-zinc-100">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30 mb-4">
            <Wrench size={32} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">FM Oficina</h1>
          <p className="text-sm text-zinc-500 mt-1">Acesso ao Sistema</p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 ml-1">Usuário</label>
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none"
              >
                {MECHANICS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.isAdmin ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700 ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
              />
              {error && <p className="mt-2 text-sm font-medium text-orange-500 ml-1">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 px-4 py-3.5 font-semibold text-white transition-all hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98] mt-2"
            >
              Continuar
            </button>
          </form>
        ) : (
          <div className="space-y-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold text-zinc-900">
              {registeredFace ? 'Reconhecimento Facial' : 'Cadastro Facial'}
            </h2>
            <p className="text-sm text-zinc-500 text-center px-4">
              {registeredFace 
                ? 'Posicione seu rosto na câmera para registrar o ponto.' 
                : 'Você ainda não tem um rosto cadastrado. Posicione-se para cadastrar.'}
            </p>
            
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-orange-500 bg-zinc-100 flex items-center justify-center shadow-sm">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover"
              />
              {!streamRef.current && <Camera size={32} className="text-zinc-400" />}
              
              {isProcessing && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={32} className="text-orange-500 animate-spin" />
                </div>
              )}
            </div>

            {error && <p className="text-sm font-medium text-orange-500 text-center">{error}</p>}

            {locationStatus !== 'pending' && (
              <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full ${locationStatus === 'success' ? 'bg-zinc-100 text-zinc-900 border border-zinc-200' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                {locationStatus === 'success' ? <CheckCircle2 size={16} /> : <MapPin size={16} />}
                {locationStatus === 'success' ? 'Ponto Registrado!' : locationData}
              </div>
            )}

            {!registeredFace ? (
              <button
                onClick={handleRegisterFace}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 font-semibold text-white transition-all hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98]"
              >
                <UserPlus size={20} />
                Cadastrar Meu Rosto
              </button>
            ) : (
              <button
                onClick={handleFacialRecognition}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 font-semibold text-white transition-all hover:bg-black focus:outline-none focus:ring-4 focus:ring-zinc-900/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <ScanFace size={20} />}
                {isProcessing ? 'Verificando...' : 'Bater Ponto'}
              </button>
            )}
            
            {registeredFace && (
              <button
                onClick={() => {
                  localStorage.removeItem(`face_${selectedMechanicId}`);
                  setRegisteredFace(null);
                }}
                className="text-xs text-zinc-400 hover:text-orange-500 underline underline-offset-2"
              >
                Recadastrar Rosto
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
