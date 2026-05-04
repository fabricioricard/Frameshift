import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Radio, Share2, ArrowLeft } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function LiveStream() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const streamId = parseInt(id || "0");

  // Fetch live stream
  const streamQuery = trpc.liveStreams.getById.useQuery({ id: streamId });
  const stream = streamQuery.data;

  if (!stream) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Carregando transmissão...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Frameshift</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stream Player */}
          <div className="lg:col-span-2">
            {/* Stream Player Container */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 relative">
              {stream.streamUrl ? (
                <iframe
                  src={stream.streamUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white">Stream não disponível</p>
                </div>
              )}
              {stream.status === "live" && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-2 rounded-full">
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                  <span className="text-sm font-bold text-white">AO VIVO</span>
                </div>
              )}
            </div>

            {/* Stream Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{stream.title}</CardTitle>
                    <p className="text-slate-400 text-sm mt-2">
                      {stream.viewers} espectadores
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Compartilhar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stream.description && (
                  <p className="text-slate-300">{stream.description}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Informações</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-sm space-y-2">
                <p>Transmissor: Usuário #{stream.userId}</p>
                <p>Status: {stream.status === "live" ? "🔴 Ao Vivo" : stream.status}</p>
                <p>
                  Iniciado em:{" "}
                  {stream.startedAt
                    ? new Date(stream.startedAt).toLocaleString("pt-BR")
                    : "Não iniciado"}
                </p>
              </CardContent>
            </Card>

            {/* Chat Placeholder */}
            <Card className="bg-slate-800 border-slate-700 mt-4">
              <CardHeader>
                <CardTitle className="text-white text-sm">Chat ao Vivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-700 rounded p-4 h-64 flex items-center justify-center">
                  <p className="text-slate-400 text-center">
                    Chat em tempo real em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
