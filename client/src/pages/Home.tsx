import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/_core/trpc";
import { Play, Radio, Upload, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { logout } from "@/lib/firebase";

export default function Home() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const videosQuery = trpc.videos.list.useQuery({ limit: 20, offset: 0 });
  const liveStreamsQuery = trpc.liveStreams.list.useQuery({ limit: 20, offset: 0 });

  const videos = videosQuery.data || [];
  const liveStreams = liveStreamsQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white">Frameshift</h1>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
            <Input
              placeholder="Buscar vídeos, transmissões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </form>

          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/upload">
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </Link>
                <Link href={`/profile/${user?.uid}`}>
                  <Button variant="ghost" className="text-white">
                    {user?.displayName || user?.email || "Perfil"}
                  </Button>
                </Link>
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => logout()}>
                  Sair
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button className="gap-2 bg-red-500 hover:bg-red-600">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="feed" className="gap-2">
              <Play className="w-4 h-4" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-2">
              <Radio className="w-4 h-4" />
              Ao Vivo
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="feed" className="space-y-6">
            {videos.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-300">Nenhum vídeo disponível no momento</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video: any) => (
                  <Link key={video.id} href={`/video/${video.id}`}>
                    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition cursor-pointer h-full">
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
                        <CardTitle className="text-white line-clamp-2">{video.title}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {video.views} visualizações
                        </CardDescription>
                      </CardHeader>
                      {video.description && (
                        <CardContent>
                          <p className="text-slate-300 text-sm line-clamp-2">
                            {video.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Live Streams Tab */}
          <TabsContent value="live" className="space-y-6">
            {liveStreams.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-300">Nenhuma transmissão ao vivo no momento</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveStreams.map((stream: any) => (
                  <Link key={stream.id} href={`/live/${stream.id}`}>
                    <Card className="bg-slate-800 border-slate-700 hover:border-red-600 transition cursor-pointer h-full border-2">
                      {stream.thumbnailUrl && (
                        <div className="relative aspect-video bg-slate-700 overflow-hidden">
                          <img
                            src={stream.thumbnailUrl}
                            alt={stream.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 px-2 py-1 rounded">
                            <Radio className="w-3 h-3 text-white animate-pulse" />
                            <span className="text-xs font-bold text-white">AO VIVO</span>
                          </div>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-white line-clamp-2">{stream.title}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {stream.viewers} espectadores
                        </CardDescription>
                      </CardHeader>
                      {stream.description && (
                        <CardContent>
                          <p className="text-slate-300 text-sm line-clamp-2">
                            {stream.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}