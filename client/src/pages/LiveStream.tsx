import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Share2, ArrowLeft, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useParams, useLocation, Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getIdToken } from "@/lib/firebase";
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
  RoomAudioRenderer,
  useTracks,
  VideoTrack,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

// Viewer component — shows all published video tracks
function ViewerLayout() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });

  if (tracks.length === 0) {
    return (
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-400">Aguardando o streamer iniciar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <VideoTrack trackRef={tracks[0]} className="w-full h-full object-cover" />
    </div>
  );
}

// Host component — shows local preview + controls
function HostLayout() {
  const { localParticipant } = useLocalParticipant();
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  useEffect(() => {
    localParticipant.setCameraEnabled(true);
    localParticipant.setMicrophoneEnabled(true);
  }, [localParticipant]);

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(!camEnabled);
    setCamEnabled(v => !v);
  };

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!micEnabled);
    setMicEnabled(v => !v);
  };

  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(t => t.participant.isLocal);

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
        {localTrack ? (
          <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-slate-400">Câmera desativada</p>
          </div>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
          <Button
            onClick={toggleMic}
            className={`rounded-full w-12 h-12 p-0 ${micEnabled ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-500"}`}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          <Button
            onClick={toggleCam}
            className={`rounded-full w-12 h-12 p-0 ${camEnabled ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-500"}`}
          >
            {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
        </div>
      </div>
      <p className="text-center text-slate-400 text-sm">Você está transmitindo ao vivo</p>
    </div>
  );
}

export default function LiveStream() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const streamId = parseInt(id || "0");
  const streamQuery = trpc.liveStreams.getById.useQuery({ id: streamId });
  const stream = streamQuery.data;

  const [token, setToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [joined, setJoined] = useState(false);

  const isHost = !!user && stream?.userId !== undefined;

  const joinRoom = useCallback(async () => {
    if (!stream) return;
    setConnecting(true);
    try {
      const idToken = await getIdToken();
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          roomName: `stream-${stream.id}`,
          participantName: user?.displayName || user?.email || "Espectador",
          isHost,
        }),
      });

      if (!res.ok) throw new Error("Falha ao obter token");
      const data = await res.json() as { token: string };
      setToken(data.token);
      setJoined(true);
    } catch {
      toast.error("Erro ao entrar na sala");
    } finally {
      setConnecting(false);
    }
  }, [stream, user, isHost]);

  if (!stream) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Carregando transmissão...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Radio className="w-7 h-7 text-red-500" />
              <h1 className="text-xl font-bold text-white">Frameshift</h1>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">

            {/* LiveKit Room */}
            {joined && token ? (
              <LiveKitRoom
                serverUrl={LIVEKIT_URL}
                token={token}
                connect={true}
                audio={isHost}
                video={isHost}
                onDisconnected={() => { setJoined(false); setToken(null); }}
              >
                <RoomAudioRenderer />
                {isHost ? <HostLayout /> : <ViewerLayout />}
              </LiveKitRoom>
            ) : (
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  {stream.status === "live" ? (
                    <>
                      <div className="flex items-center gap-2 justify-center bg-red-600 px-4 py-2 rounded-full mx-auto w-fit">
                        <Radio className="w-4 h-4 text-white animate-pulse" />
                        <span className="text-white font-bold">AO VIVO</span>
                      </div>
                      <Button
                        onClick={joinRoom}
                        disabled={connecting}
                        className="bg-red-500 hover:bg-red-600 text-white px-8"
                      >
                        {connecting ? "Conectando..." : isHost ? "Iniciar Transmissão" : "Assistir"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Radio className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-slate-400">
                        {stream.status === "scheduled" ? "Transmissão ainda não iniciada" : "Transmissão encerrada"}
                      </p>
                      {isHost && stream.status === "scheduled" && (
                        <Button onClick={joinRoom} disabled={connecting} className="bg-red-500 hover:bg-red-600 text-white px-8">
                          {connecting ? "Conectando..." : "Iniciar Transmissão"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Stream Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{stream.title}</CardTitle>
                    <p className="text-slate-400 text-sm mt-1">{stream.viewers} espectadores</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-slate-600 text-slate-300"
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar
                  </Button>
                </div>
              </CardHeader>
              {stream.description && (
                <CardContent>
                  <p className="text-slate-300">{stream.description}</p>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white text-sm">Informações</CardTitle></CardHeader>
              <CardContent className="text-slate-300 text-sm space-y-2">
                <p>Status: {stream.status === "live" ? "🔴 Ao Vivo" : stream.status === "scheduled" ? "🕐 Agendado" : "⏹ Encerrado"}</p>
                <p>Iniciado em: {stream.startedAt ? new Date(stream.startedAt).toLocaleString("pt-BR") : "—"}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white text-sm">Chat ao Vivo</CardTitle></CardHeader>
              <CardContent>
                <div className="bg-slate-700 rounded p-4 h-64 flex items-center justify-center">
                  <p className="text-slate-400 text-center text-sm">Chat em breve</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}