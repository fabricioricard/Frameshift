import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Radio, LogOut, Pencil, Check, X } from "lucide-react";
import { useParams, useLocation, Link } from "wouter";
import {
  logout,
  updateUserDisplayName,
  compressImageToBase64,
  saveAvatarToFirestore,
  loadUserProfile,
} from "@/lib/firebase";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();

  const isOwnProfile = !!currentUser && currentUser.uid === id;

  const videosQuery = trpc.videos.getByUserId.useQuery(
    { userId: 0, limit: 20, offset: 0 },
    { enabled: false }
  );
  const streamsQuery = trpc.liveStreams.getByUserId.useQuery(
    { userId: 0, limit: 20, offset: 0 },
    { enabled: false }
  );
  const videos = videosQuery.data || [];
  const streams = streamsQuery.data || [];

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || "");
  const [savingName, setSavingName] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load avatar from Firestore on mount
  useEffect(() => {
    if (!currentUser) return;
    loadUserProfile(currentUser.uid).then((profile) => {
      if (profile?.avatar) setAvatarBase64(profile.avatar);
    }).catch(() => {});
  }, [currentUser?.uid]);

  const handleSaveName = async () => {
    if (!newName.trim()) { toast.error("Nome não pode ser vazio"); return; }
    setSavingName(true);
    try {
      await updateUserDisplayName(newName.trim());
      toast.success("Nome atualizado!");
      setEditingName(false);
    } catch {
      toast.error("Erro ao atualizar nome");
    } finally {
      setSavingName(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await compressImageToBase64(file);
      await saveAvatarToFirestore(currentUser!.uid, base64);
      setAvatarBase64(base64);
      toast.success("Foto atualizada!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar foto");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
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
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  {avatarBase64 ? (
                    <img src={avatarBase64} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{initial}</span>
                  )}
                </div>
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 bg-red-500 hover:bg-red-400 disabled:opacity-50 rounded-full p-1.5 border-2 border-slate-800 transition"
                      title="Trocar foto"
                    >
                      <Pencil className="w-3 h-3 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs">...</span>
                  </div>
                )}
              </div>

              {/* Name + email */}
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white max-w-xs"
                      placeholder="Seu nome"
                      onKeyDown={e => e.key === "Enter" && handleSaveName()}
                      autoFocus
                    />
                    <Button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="bg-green-600 hover:bg-green-500 text-white px-3"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setEditingName(false)}
                      className="bg-slate-600 hover:bg-slate-500 text-white px-3"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                    {isOwnProfile && (
                      <button
                        onClick={() => { setNewName(currentUser?.displayName || ""); setEditingName(true); }}
                        className="text-slate-400 hover:text-white transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-slate-400 text-sm">{currentUser?.email}</p>
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
                  <p className="text-slate-300">{isOwnProfile ? "Você não tem vídeos ainda" : "Este usuário não tem vídeos"}</p>
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
                  <p className="text-slate-300">{isOwnProfile ? "Você não tem transmissões ainda" : "Este usuário não tem transmissões"}</p>
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