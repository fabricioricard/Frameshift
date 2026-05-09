import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, ArrowLeft, Radio, LogIn } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Upload() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState("video");

  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [streamUrl, setStreamUrl] = useState("");

  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("Vídeo enviado com sucesso!");
      setVideoTitle(""); setVideoDescription(""); setVideoUrl("");
      setTimeout(() => navigate("/"), 2000);
    },
    onError: () => toast.error("Erro ao enviar vídeo"),
  });

  const createStreamMutation = trpc.liveStreams.create.useMutation({
    onSuccess: () => {
      toast.success("Transmissão criada com sucesso!");
      setStreamTitle(""); setStreamDescription(""); setStreamUrl("");
      setTimeout(() => navigate("/"), 2000);
    },
    onError: () => toast.error("Erro ao criar transmissão"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Faça login para continuar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">
              Você precisa estar autenticado para fazer upload de conteúdo.
            </p>
            <Link href="/login">
              <Button className="w-full gap-2 bg-red-500 hover:bg-red-600">
                <LogIn className="w-4 h-4" />
                Entrar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUploadVideo = () => {
    if (!videoTitle.trim()) { toast.error("Título do vídeo é obrigatório"); return; }
    if (!videoUrl.trim()) { toast.error("URL do vídeo é obrigatória"); return; }
    createVideoMutation.mutate({ title: videoTitle, description: videoDescription, videoUrl });
  };

  const handleCreateStream = () => {
    if (!streamTitle.trim()) { toast.error("Título da transmissão é obrigatório"); return; }
    if (!streamUrl.trim()) { toast.error("URL da transmissão é obrigatória"); return; }
    createStreamMutation.mutate({ title: streamTitle, description: streamDescription, streamUrl });
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Frameshift</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="video" className="gap-2">
              <UploadIcon className="w-4 h-4" />
              Upload de Vídeo
            </TabsTrigger>
            <TabsTrigger value="stream" className="gap-2">
              <Radio className="w-4 h-4" />
              Transmissão ao Vivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white">Enviar Vídeo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Título *</label>
                  <Input placeholder="Título do seu vídeo" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                  <Textarea placeholder="Descreva seu vídeo" value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} className="bg-slate-700 border-slate-600 text-white" rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL do Vídeo *</label>
                  <Input placeholder="https://exemplo.com/video.mp4" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="bg-slate-700 border-slate-600 text-white" type="url" />
                  <p className="text-xs text-slate-400 mt-2">Forneça uma URL pública para seu vídeo (MP4, WebM, etc.)</p>
                </div>
                <Button onClick={handleUploadVideo} disabled={createVideoMutation.isPending} className="w-full gap-2">
                  <UploadIcon className="w-4 h-4" />
                  {createVideoMutation.isPending ? "Enviando..." : "Enviar Vídeo"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stream">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white">Criar Transmissão ao Vivo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Título *</label>
                  <Input placeholder="Título da sua transmissão" value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                  <Textarea placeholder="Descreva sua transmissão" value={streamDescription} onChange={(e) => setStreamDescription(e.target.value)} className="bg-slate-700 border-slate-600 text-white" rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL da Transmissão *</label>
                  <Input placeholder="rtmp://exemplo.com/live/stream" value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} className="bg-slate-700 border-slate-600 text-white" type="url" />
                  <p className="text-xs text-slate-400 mt-2">Forneça uma URL RTMP ou HLS para sua transmissão</p>
                </div>
                <Button onClick={handleCreateStream} disabled={createStreamMutation.isPending} className="w-full gap-2">
                  <Radio className="w-4 h-4" />
                  {createStreamMutation.isPending ? "Criando..." : "Criar Transmissão"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}