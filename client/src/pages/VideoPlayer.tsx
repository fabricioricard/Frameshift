import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [commentText, setCommentText] = useState("");

  const videoId = parseInt(id || "0");

  const videoQuery = trpc.videos.getById.useQuery({ id: videoId });
  const video = videoQuery.data;

  const commentsQuery = trpc.comments.getByVideoId.useQuery({ videoId });
  const comments = commentsQuery.data || [];

  const likeCountQuery = trpc.likes.count.useQuery({ videoId });
  const likeCount = likeCountQuery.data || 0;

  const hasLikedQuery = trpc.likes.hasLiked.useQuery({ videoId }, { enabled: isAuthenticated });
  const hasLiked = hasLikedQuery.data || false;

  const toggleLikeMutation = trpc.likes.toggle.useMutation({
    onSuccess: () => { likeCountQuery.refetch(); hasLikedQuery.refetch(); },
  });

  const createCommentMutation = trpc.comments.create.useMutation({
    onSuccess: () => { setCommentText(""); commentsQuery.refetch(); toast.success("Comentário adicionado!"); },
    onError: () => toast.error("Erro ao adicionar comentário"),
  });

  if (!video) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Carregando vídeo...</p>
      </div>
    );
  }

  const handleLike = () => {
    if (!isAuthenticated) { toast.error("Faça login para curtir"); return; }
    toggleLikeMutation.mutate({ videoId });
  };

  const handleCommentSubmit = () => {
    if (!isAuthenticated) { toast.error("Faça login para comentar"); return; }
    if (!commentText.trim()) { toast.error("Escreva um comentário"); return; }
    createCommentMutation.mutate({ videoId, content: commentText });
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
              {video.videoUrl ? (
                <video src={video.videoUrl} controls className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white">Vídeo não disponível</p>
                </div>
              )}
            </div>

            <Card className="bg-slate-800 border-slate-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white">{video.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">{video.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{video.views} visualizações</span>
                  <div className="flex gap-2">
                    <Button variant={hasLiked ? "default" : "outline"} size="sm" className="gap-2" onClick={handleLike} disabled={toggleLikeMutation.isPending}>
                      <ThumbsUp className="w-4 h-4" />
                      {likeCount}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      {comments.length}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white">Comentários</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isAuthenticated && (
                  <div className="space-y-2 pb-4 border-b border-slate-700">
                    <Textarea placeholder="Adicione um comentário..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                    <Button onClick={handleCommentSubmit} disabled={createCommentMutation.isPending} className="w-full">Comentar</Button>
                  </div>
                )}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Nenhum comentário ainda</p>
                  ) : (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="border-b border-slate-700 pb-4">
                        <p className="text-slate-300 font-medium">Usuário #{comment.userId}</p>
                        <p className="text-slate-400 text-sm mt-1">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white text-sm">Sobre</CardTitle></CardHeader>
              <CardContent className="text-slate-300 text-sm space-y-2">
                <p>Criador: Usuário #{video.userId}</p>
                <p>Duração: {video.duration ? `${video.duration}s` : "N/A"}</p>
                <p>Publicado em: {new Date(video.createdAt).toLocaleDateString("pt-BR")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}