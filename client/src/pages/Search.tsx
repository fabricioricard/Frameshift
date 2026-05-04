import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Radio, Search as SearchIcon, ArrowLeft } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useState } from "react";
import { Link } from "wouter";

export default function Search() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const query = new URLSearchParams(searchParams).get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);

  // Fetch all videos and streams for client-side filtering
  const videosQuery = trpc.videos.list.useQuery({ limit: 100, offset: 0 });
  const streamsQuery = trpc.liveStreams.list.useQuery({ limit: 100, offset: 0 });

  const videos = videosQuery.data || [];
  const streams = streamsQuery.data || [];

  // Filter results based on search query
  const filteredVideos = videos.filter(
    (v: any) =>
      v.title.toLowerCase().includes(query.toLowerCase()) ||
      v.description?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredStreams = streams.filter(
    (s: any) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.description?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

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
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar vídeos, transmissões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Button type="submit" className="gap-2">
              <SearchIcon className="w-4 h-4" />
              Buscar
            </Button>
          </div>
        </form>

        {/* Results */}
        {query ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">
              Resultados para &quot;{query}&quot;
            </h2>

            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="videos" className="gap-2">
                  <Play className="w-4 h-4" />
                  Vídeos ({filteredVideos.length})
                </TabsTrigger>
                <TabsTrigger value="streams" className="gap-2">
                  <Radio className="w-4 h-4" />
                  Transmissões ({filteredStreams.length})
                </TabsTrigger>
              </TabsList>

              {/* Videos Results */}
              <TabsContent value="videos">
                {filteredVideos.length === 0 ? (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6 text-center">
                      <p className="text-slate-300">Nenhum vídeo encontrado</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video: any) => (
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
                            <CardTitle className="text-white line-clamp-2 text-base">
                              {video.title}
                            </CardTitle>
                            <p className="text-slate-400 text-xs">
                              {video.views} visualizações
                            </p>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Streams Results */}
              <TabsContent value="streams">
                {filteredStreams.length === 0 ? (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6 text-center">
                      <p className="text-slate-300">Nenhuma transmissão encontrada</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStreams.map((stream: any) => (
                      <Link key={stream.id} href={`/live/${stream.id}`}>
                        <Card className="bg-slate-800 border-slate-700 hover:border-red-600 transition cursor-pointer h-full border-2">
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
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Buscar Conteúdo</h2>
            <p className="text-slate-400">
              Use a barra de busca acima para encontrar vídeos e transmissões
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
