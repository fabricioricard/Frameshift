import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, Radio, LogIn, FileVideo } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { getIdToken } from "@/lib/firebase";

export default function Upload() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState("video");

  // Video form
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stream form
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");

  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("Vídeo publicado com sucesso!");
      setVideoTitle(""); setVideoDescription(""); setVideoFile(null);
      setTimeout(() => navigate("/"), 2000);
    },
    onError: () => toast.error("Erro ao publicar vídeo"),
  });

  const createStreamMutation = trpc.liveStreams.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Transmissão criada! Redirecionando...");
      setTimeout(() => navigate(`/live/${data.insertId}`), 1500);
    },
    onError: () => toast.error("Erro ao criar transmissão"),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use MP4, WebM, MOV ou MKV.");
      return;
    }
    setVideoFile(file);
  };

  const handleUploadVideo = async () => {
    if (!videoTitle.trim()) { toast.error("Título é obrigatório"); return; }
    if (!videoFile) { toast.error("Selecione um arquivo de vídeo"); return; }

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = await getIdToken();
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("title", videoTitle);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const ipfsUrl = await new Promise<string>((resolve, reject) => {
        xhr.open("POST", "/api/upload/video");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url);
          } else {
            reject(new Error("Falha no upload"));
          }
        };
        xhr.onerror = () => reject(new Error("Erro de rede"));
        xhr.send(formData);
      });

      await createVideoMutation.mutateAsync({
        title: videoTitle,
        description: videoDescription,
        videoUrl: ipfsUrl,
      });

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao fazer upload");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateStream = () => {
    if (!streamTitle.trim()) { toast.error("Título é obrigatório"); return; }

    // Generate a unique room name
    const roomName = `stream-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    createStreamMutation.mutate({
      title: streamTitle,
      description: streamDescription,
      streamUrl: roomName, // store room name as the stream identifier
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Faça login para continuar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">Você precisa estar autenticado para fazer upload.</p>
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-8 bg-slate-800 border border-slate-700 p-1 flex gap-2">
            <TabsTrigger value="video" className="flex-1 gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400">
              <UploadIcon className="w-4 h-4" />
              Upload de Vídeo
            </TabsTrigger>
            <TabsTrigger value="stream" className="flex-1 gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400">
              <Radio className="w-4 h-4" />
              Transmissão ao Vivo
            </TabsTrigger>
          </TabsList>

          {/* Video Tab */}
          <TabsContent value="video">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white">Enviar Vídeo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Título *</label>
                  <Input placeholder="Título do seu vídeo" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} className="bg-slate-700 border-slate-600 text-white" disabled={uploading} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                  <Textarea placeholder="Descreva seu vídeo" value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} className="bg-slate-700 border-slate-600 text-white" rows={3} disabled={uploading} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Arquivo de Vídeo *</label>
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
                      ${videoFile ? "border-green-500 bg-green-500/5" : "border-slate-600 hover:border-slate-400 bg-slate-700/30"}
                      ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska" className="hidden" onChange={handleFileSelect} disabled={uploading} />
                    <FileVideo className={`w-10 h-10 mx-auto mb-3 ${videoFile ? "text-green-400" : "text-slate-500"}`} />
                    {videoFile ? (
                      <div>
                        <p className="text-green-400 font-medium">{videoFile.name}</p>
                        <p className="text-slate-400 text-sm mt-1">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-300 font-medium">Clique para selecionar</p>
                        <p className="text-slate-500 text-sm mt-1">MP4, WebM, MOV ou MKV</p>
                      </div>
                    )}
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>{uploadProgress < 100 ? "Enviando para IPFS..." : "Publicando..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500">O vídeo está sendo publicado na rede IPFS de forma descentralizada.</p>
                  </div>
                )}

                <Button onClick={handleUploadVideo} disabled={uploading || !videoFile} className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50">
                  <UploadIcon className="w-4 h-4" />
                  {uploading ? `Enviando... ${uploadProgress}%` : "Publicar Vídeo"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stream Tab */}
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
                  <Textarea placeholder="Descreva sua transmissão" value={streamDescription} onChange={(e) => setStreamDescription(e.target.value)} className="bg-slate-700 border-slate-600 text-white" rows={3} />
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="w-4 h-4 text-red-500" />
                    <span className="text-slate-300 text-sm font-medium">Transmissão via navegador</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Ao criar a transmissão, você será redirecionado para a sala ao vivo onde poderá ativar sua câmera e microfone diretamente pelo navegador. Nenhum software adicional necessário.
                  </p>
                </div>

                <Button
                  onClick={handleCreateStream}
                  disabled={createStreamMutation.isPending}
                  className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Radio className="w-4 h-4" />
                  {createStreamMutation.isPending ? "Criando..." : "Criar e Ir para a Sala"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}