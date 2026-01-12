'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMangaDetail, crawlChapterRange } from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  History,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function MangaDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showCrawlModal, setShowCrawlModal] = useState(false);
  const [startChapter, setStartChapter] = useState('');
  const [endChapter, setEndChapter] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const { toast } = useToast();
  
  const { data: manga, isLoading, error } = useQuery({
    queryKey: ['manga', id],
    queryFn: () => getMangaDetail(id),
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Get last read chapter from localStorage
  const getLastRead = () => {
    if (typeof window !== 'undefined') {
      const lastRead = localStorage.getItem(`lastRead_${id}`);
      return lastRead || null;
    }
    return null;
  };

  // Filtered chapters based on search
  const filteredChapters = useMemo(() => {
    if (!manga?.chapters) return [];
    
    const reversed = [...manga.chapters].reverse();
    
    if (!searchQuery.trim()) return reversed;
    
    const query = searchQuery.toLowerCase();
    return reversed.filter(chapter => 
      chapter.title.toLowerCase().includes(query) ||
      chapter.id.toLowerCase().includes(query)
    );
  }, [manga?.chapters, searchQuery]);

  // Display chapters (collapsed or full)
  const displayedChapters = useMemo(() => {
    if (isCollapsed) {
      return filteredChapters.slice(0, 20);
    }
    return filteredChapters;
  }, [filteredChapters, isCollapsed]);

  // Quick action handlers
  const readFirst = () => {
    if (manga?.chapters && manga.chapters.length > 0) {
      const firstChapter = [...manga.chapters].reverse()[0];
      router.push(`/manga/${id}/${firstChapter.id}`);
    }
  };

  const readLatest = () => {
    if (manga?.chapters && manga.chapters.length > 0) {
      const latestChapter = manga.chapters[0];
      router.push(`/manga/${id}/${latestChapter.id}`);
    }
  };

  const continueReading = () => {
    const lastRead = getLastRead();
    if (lastRead) {
      router.push(`/manga/${id}/${lastRead}`);
    } else {
      readFirst();
    }
  };

  // Crawl multiple chapters
  const handleCrawlRange = async () => {
    if (!startChapter || !endChapter) {
      toast({
        title: "Error",
        description: "Please select both start and end chapters",
        variant: "destructive"
      });
      return;
    }

    const chapters = manga?.chapters || [];
    const startIdx = chapters.findIndex(ch => ch.id === startChapter);
    const endIdx = chapters.findIndex(ch => ch.id === endChapter);

    if (startIdx === -1 || endIdx === -1) {
      toast({
        title: "Error",
        description: "Invalid chapter selection",
        variant: "destructive"
      });
      return;
    }

    // Ensure start comes before end (reverse order since newest is first)
    if (startIdx < endIdx) {
      toast({
        title: "Error",
        description: "Start chapter must come before end chapter",
        variant: "destructive"
      });
      return;
    }

    const chapterCount = startIdx - endIdx + 1;
    
    setIsCrawling(true);
    try {
      const result = await crawlChapterRange(id, startChapter, endChapter);
      
      toast({
        title: "Success!",
        description: `Crawled ${result.crawledCount} chapters successfully`,
      });
      
      setShowCrawlModal(false);
      setStartChapter('');
      setEndChapter('');
    } catch (error: any) {
      toast({
        title: "Crawl Failed",
        description: error?.response?.data?.message || "An error occurred while crawling chapters",
        variant: "destructive"
      });
    } finally {
      setIsCrawling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Loading Manga...</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            If this is your first time viewing this manga, we're fetching it from NetTruyen.
            This may take 15-30 seconds.
          </p>
          <div className="text-xs text-muted-foreground space-y-1 mt-4">
            <p>🔓 Bypassing Cloudflare...</p>
            <p>☁️ Uploading cover image...</p>
            <p>📜 Generating chapters...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 p-6 max-w-md">
          <h2 className="text-2xl font-bold text-destructive">Failed to Load Manga</h2>
          <p className="text-muted-foreground">
            {(error as any)?.message || 'An error occurred while loading this manga.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} variant="default">
              Retry
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!manga) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Manga not found</h2>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const lastReadChapterId = getLastRead();
  const totalChapters = manga.chapters?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[35vh] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={manga.thumbnail} 
            className="w-full h-full object-cover blur-3xl opacity-30 scale-110" 
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />
        </div>
        
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          
          <div className="flex gap-6 items-end">
            <img 
              src={manga.thumbnail} 
              className="w-32 h-48 md:w-40 md:h-60 object-cover rounded-lg shadow-2xl border-2 border-background/50" 
              alt={manga.title}
            />
            
            <div className="flex-1 space-y-3 pb-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                {manga.title}
              </h1>
              
              <div className="flex flex-wrap gap-2">
                {manga.genres?.slice(0, 5).map(g => (
                  <span 
                    key={g} 
                    className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                  >
                    {g}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-4 items-center text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" /> {totalChapters} Chapters
                </span>
                <span>•</span>
                <span>{manga.author || 'Unknown'}</span>
                <span>•</span>
                <span className="capitalize">{manga.status || 'Ongoing'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 space-y-8 max-w-6xl">
        {/* Quick Actions */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              onClick={readFirst}
              className="flex items-center gap-2 h-12"
              variant="default"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Read First</span>
              <span className="sm:hidden">First</span>
            </Button>
            
            <Button 
              onClick={readLatest}
              className="flex items-center gap-2 h-12"
              variant="secondary"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Latest</span>
              <span className="sm:hidden">Latest</span>
            </Button>
            
            <Button 
              onClick={continueReading}
              className="flex items-center gap-2 h-12"
              variant={lastReadChapterId ? "default" : "outline"}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">
                {lastReadChapterId ? 'Continue' : 'Start'}
              </span>
              <span className="sm:hidden">
                {lastReadChapterId ? 'Continue' : 'Start'}
              </span>
            </Button>
            
            <Button 
              onClick={() => setShowCrawlModal(true)}
              className="flex items-center gap-2 h-12"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Crawl Range</span>
              <span className="sm:hidden">Crawl</span>
            </Button>
          </div>
        </Card>

        {/* Synopsis */}
        {manga.description && (
          <section>
            <h2 className="text-xl font-bold mb-3">Synopsis</h2>
            <p className="text-muted-foreground leading-relaxed">
              {manga.description}
            </p>
          </section>
        )}

        {/* Chapters Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              Chapters ({filteredChapters.length})
            </h2>
            
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            {displayedChapters.map((chapter) => {
              const chapterNumber = totalChapters - manga.chapters!.indexOf(chapter);
              const isLastRead = chapter.id === lastReadChapterId;
              
              return (
                <Link 
                  key={chapter.id} 
                  href={`/manga/${id}/${chapter.id}`}
                >
                  <div className={`
                    p-4 rounded-lg border transition-all duration-200
                    hover:border-primary/50 hover:bg-muted/50 hover:shadow-md
                    flex items-center justify-between gap-4 group cursor-pointer
                    ${isLastRead ? 'bg-primary/5 border-primary/30' : 'bg-card'}
                  `}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
                        transition-colors flex-shrink-0
                        ${isLastRead 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                        }
                      `}>
                        {chapterNumber}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className="font-medium group-hover:text-primary transition-colors block truncate">
                          {chapter.title}
                        </span>
                        {isLastRead && (
                          <span className="text-xs text-primary flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Last read
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Read →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Show More/Less Button */}
          {filteredChapters.length > 20 && (
            <div className="mt-6 text-center">
              <Button
                onClick={() => setIsCollapsed(!isCollapsed)}
                variant="outline"
                className="w-full max-w-md"
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show {filteredChapters.length - 20} more chapters
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show less
                  </>
                )}
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Crawl Range Modal */}
      {showCrawlModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Crawl Chapter Range</h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowCrawlModal(false)}
                disabled={isCrawling}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Chapter</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={startChapter}
                  onChange={(e) => setStartChapter(e.target.value)}
                  disabled={isCrawling}
                >
                  <option value="">Select start chapter</option>
                  {manga?.chapters?.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Chapter</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={endChapter}
                  onChange={(e) => setEndChapter(e.target.value)}
                  disabled={isCrawling}
                >
                  <option value="">Select end chapter</option>
                  {manga?.chapters?.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </option>
                  ))}
                </select>
              </div>

              {startChapter && endChapter && (() => {
                const chapters = manga?.chapters || [];
                const startIdx = chapters.findIndex(ch => ch.id === startChapter);
                const endIdx = chapters.findIndex(ch => ch.id === endChapter);
                const count = startIdx >= endIdx ? startIdx - endIdx + 1 : 0;
                
                return count > 0 ? (
                  <div className="p-3 bg-primary/10 rounded-md text-sm">
                    Will crawl <span className="font-bold">{count} chapters</span>
                  </div>
                ) : (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    Invalid range - Start must come before End
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCrawlModal(false)}
                disabled={isCrawling}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCrawlRange}
                disabled={isCrawling || !startChapter || !endChapter}
                className="flex-1"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Start Crawl
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
