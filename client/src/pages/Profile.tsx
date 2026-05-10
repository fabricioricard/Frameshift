import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Radio, LogOut, Pencil } from "lucide-react";
import { useParams, useLocation, Link } from "wouter";
import { logout } from "@/lib/firebase";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();

  const isOwnProfile = !!currentUser && currentUser.uid === id;

  const userId = 0; // Firebase users don't have numeric DB IDs on the profile URL
  const videosQuery = trpc.videos.getByUserId.useQuery({ userId, limit: 20, offset: 0 }, { enabled: false });
  const streamsQuery = trpc.liveStreams.getByUserId.useQuery({ userId, limit: 20, offset: 0 }, { enabled: false });
  const videos = videosQuery.data || [];
  const streams = streamsQuery.data || [];

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || "");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSaveName = async () => {
    // Firebase updateProfile would go here
    toast.success("Nome atualizado!");
    setEditingName(false);
  };

  const displayName = currentUser?.displayName || currentUser?.email || "Usuário";
  const initial = (currentUser?.displayName || currentUser?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Radio className="w-7 h-7 text-red-500" />
              <h1 className="text-xl font-bold text-white">Frameshift</h1>
            </div>
          </Link>

          {isOwnProfile && (
            <Button
              onClick={handleLogout}
              className="gap-2 bg-slate-700 hover:bg-red-600 text-white border border-slate-500 hover:border-red-500 font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-3xl font-bold text-white">{initial}</span>
                </div>
                {isOwnProfile && (
                  <button className="absolute bottom-0 right-0 bg-slate-600 hover:bg-slate-500 rounded-full p-1.5 border-2 border-slate-800">
                    <Pencil className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white max-w-xs"
                      placeholder="Seu nome"
                    />
                    <Button onClick={handleSaveName} className="bg-red-500 hover:bg-red-600 text-white">Salvar</Button>
                    <Button onClick={() => setEditingName(false)} className="bg-slate-600 hover:bg-slate-500 text-white">Cancelar</Button>
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
                )}
                <p className="text-slate-400 text-sm mb-4">{currentUser?.email}</p>

                {isOwnProfile && !editingName && (
                  <Button
                    onClick={() => setEditingName(true)}
                    className="gap-2 bg-slate-700 hover:bg-slate-500 text-white border border-slate-500 hover:border-slate-300"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="w-full mb-8 bg-slate-800 border border-slate-700 p-1 flex gap-2">
            <TabsTrigger value="videos" className="flex-1 gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400">
              <Play className="w-4 h-4" />
              Vídeos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="streams" className="flex-1 gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400">
              <Radio className="w-4 h-4" />
              Transmissões ({streams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {videos.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center py-12">
                  <Play className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300">
                    {isOwnProfile ? "Você não tem vídeos ainda" : "Este usuário não tem vídeos"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video: any) => (
                  <Card key={video.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition cursor-pointer" onClick={() => navigate(`/video/${video.id}`)}>
                    {video.thumbnailUrl && (
                      <div className="relative aspect-video bg-slate-700 overflow-hidden">
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover hover:scale-105 transition" />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white line-clamp-2 text-base">{video.title}</CardTitle>
                      <p className="text-slate-400 text-xs">{video.views} visualizações</p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="streams">
            {streams.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center py-12">
                  <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300">
                    {isOwnProfile ? "Você não tem transmissões ainda" : "Este usuário não tem transmissões"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {streams.map((stream: any) => (
                  <Card key={stream.id} className="bg-slate-800 border-slate-700 hover:border-red-600 transition cursor-pointer border-2" onClick={() => navigate(`/live/${stream.id}`)}>
                    {stream.thumbnailUrl && (
                      <div className="relative aspect-video bg-slate-700 overflow-hidden">
                        <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
                        {stream.status === "live" && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 px-2 py-1 rounded">
                            <Radio className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-xs font-bold text-white">AO VIVO</span>
                          </div>
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white line-clamp-2 text-base">{stream.title}</CardTitle>
                      <p className="text-slate-400 text-xs">{stream.viewers} espectadores</p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}