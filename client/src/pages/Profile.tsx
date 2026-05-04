import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Radio, LogOut } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser, isAuthenticated, logout } = useAuth();

  const userId = parseInt(id || "0");
  const isOwnProfile = isAuthenticated && currentUser?.id === userId;

  // Fetch user videos
  const videosQuery = trpc.videos.getByUserId.useQuery({ userId, limit: 20, offset: 0 });
  const videos = videosQuery.data || [];

  // Fetch user live streams
  const streamsQuery = trpc.liveStreams.getByUserId.useQuery({ userId, limit: 20, offset: 0 });
  const streams = streamsQuery.data || [];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">Frameshift</h1>
          </div>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentUser?.name || `Usuário #${userId}`}
                </h2>
                <p className="text-slate-400 mb-4">
                  Membro desde {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString("pt-BR")}
                </p>
                {isOwnProfile && (
                  <Button variant="outline" size="sm">
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="videos" className="gap-2">
              <Play className="w-4 h-4" />
              Vídeos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="streams" className="gap-2">
              <Radio className="w-4 h-4" />
              Transmissões ({streams.length})
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos">
            {videos.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-300">
                    {isOwnProfile ? "Você não tem vídeos ainda" : "Este usuário não tem vídeos"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video: any) => (
                  <Card
                    key={video.id}
                    className="bg-slate-800 border-slate-700 hover:border-slate-600 transition cursor-pointer"
                    onClick={() => navigate(`/video/${video.id}`)}
                  >
                    {video.thumbnailUrl && (
                      <div className="relative aspect-video bg-slate-700 overflow-hidden">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white line-clamp-2 text-base">
                        {video.title}
                      </CardTitle>
                      <p className="text-slate-400 text-xs">
                        {video.views} visualizações
                      </p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Streams Tab */}
          <TabsContent value="streams">
            {streams.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-300">
                    {isOwnProfile ? "Você não tem transmissões ainda" : "Este usuário não tem transmissões"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {streams.map((stream: any) => (
                  <Card
                    key={stream.id}
                    className="bg-slate-800 border-slate-700 hover:border-red-600 transition cursor-pointer border-2"
                    onClick={() => navigate(`/live/${stream.id}`)}
                  >
                    {stream.thumbnailUrl && (
                      <div className="relative aspect-video bg-slate-700 overflow-hidden">
                        <img
                          src={stream.thumbnailUrl}
                          alt={stream.title}
                          className="w-full h-full object-cover"
                        />
                        {stream.status === "live" && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 px-2 py-1 rounded">
                            <Radio className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-xs font-bold text-white">AO VIVO</span>
                          </div>
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white line-clamp-2 text-base">
                        {stream.title}
                      </CardTitle>
                      <p className="text-slate-400 text-xs">
                        {stream.viewers} espectadores
                      </p>
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
