'use client';

import { useState, useEffect } from 'react';
import { getMangas, searchManga, deleteManga, deleteChapters, getMangaDetail } from '@/services/api';
import { Manga } from '@/types';
import Link from 'next/link';
import { Trash2, Loader2, Eye, ArrowLeft, CheckSquare, Square, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMangas();
  }, []);

  const fetchMangas = async () => {
    setLoading(true);
    try {
      const { data } = await getMangas(1, query); // Fetch page 1 for now
      setMangas(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load mangas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (query.trim()) {
        const result = await searchManga(query);
        setMangas(result.results);
      } else {
        await fetchMangas();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManga = async (manga: Manga) => {
    if (!confirm(`Are you sure you want to delete "${manga.title}"?\nThis will remove all chapters and images from the cloud.`)) {
      return;
    }

    setProcessing(true);
    try {
      await deleteManga(manga.id);
      setMangas(prev => prev.filter(m => m.id !== manga.id));
      if (selectedManga?.id === manga.id) setSelectedManga(null);
    } catch (error) {
      console.error(error);
      alert('Failed to delete manga');
    } finally {
      setProcessing(false);
    }
  };

  const handleManageChapters = async (mangaId: string) => {
    setProcessing(true);
    try {
      // Re-fetch manga detail to get comprehensive chapter list
      const details = await getMangaDetail(mangaId);
      setSelectedManga(details);
      setSelectedChapters([]);
    } catch (error) {
      console.error(error);
      alert('Failed to load details');
    } finally {
      setProcessing(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const toggleAllChapters = () => {
    if (!selectedManga?.chapters) return;
    if (selectedChapters.length === selectedManga.chapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(selectedManga.chapters.map(c => c.id));
    }
  };

  const handleDeleteSelectedChapters = async () => {
    if (selectedChapters.length === 0) return;
    if (!selectedManga) return;
    
    if (!confirm(`Delete ${selectedChapters.length} chapters?\nThis cannot be undone.`)) {
      return;
    }

    setProcessing(true);
    try {
      await deleteChapters(selectedManga.id, selectedChapters);
      
      // Update local state: Just clear selection because chapters still exist in DB (as metadata)
      alert(`Successfully reset ${selectedChapters.length} chapters.`);
      
      // Refresh details to update 'downloaded' status
      if (selectedManga) {
          const freshDetails = await getMangaDetail(selectedManga.id);
          setSelectedManga(freshDetails);
      }
      
      setSelectedChapters([]);
    } catch (error) {
      console.error(error);
      alert('Failed to delete chapters');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft size={20} /> Back to Home
          </Link>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Manga List Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search manga..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
                </button>
              </form>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {mangas.map(manga => (
                  <div 
                    key={manga.id}
                    className={`p-3 rounded-lg border transition cursor-pointer flex justify-between items-center group
                      ${selectedManga?.id === manga.id 
                        ? 'bg-purple-900/20 border-purple-500/50' 
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                    onClick={() => handleManageChapters(manga.id)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img 
                        src={manga.thumbnail} 
                        alt={manga.title} 
                        className="w-10 h-14 object-cover rounded bg-zinc-800"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{manga.title}</h3>
                        <p className="text-xs text-zinc-500 truncate">{manga.author}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                         e.stopPropagation();
                         handleDeleteManga(manga);
                      }}
                      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="Delete Manga"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                {mangas.length === 0 && !loading && (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    No manga found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chapter Manager Column */}
          <div className="lg:col-span-2">
             {selectedManga ? (
               <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 h-full flex flex-col">
                 <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
                   <div>
                     <h2 className="text-xl font-bold">{selectedManga.title}</h2>
                     <p className="text-zinc-500 text-sm mt-1">
                       Total Chapters: {selectedManga.chapters?.length || 0}
                     </p>
                   </div>
                   <div className="flex gap-2">
                     <button
                        onClick={() => handleDeleteManga(selectedManga)}
                        className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                     >
                       <Trash2 size={16} /> Delete All
                     </button>
                   </div>
                 </div>

                 <div className="p-4 bg-zinc-900/30 flex items-center justify-between border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={toggleAllChapters}
                        className="p-1 hover:bg-zinc-800 rounded transition"
                      >
                         {selectedChapters.length > 0 && selectedChapters.length === (selectedManga.chapters?.length || 0) 
                            ? <CheckSquare className="text-purple-500" size={20} />
                            : <Square className="text-zinc-500" size={20} />
                         }
                      </button>
                      <span className="text-sm text-zinc-400">
                        {selectedChapters.length} Selected
                      </span>
                    </div>

                    {selectedChapters.length > 0 && (
                      <button 
                        onClick={handleDeleteSelectedChapters}
                        disabled={processing}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                      >
                        {processing ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                        Reset Content
                      </button>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                   <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                     {selectedManga.chapters?.map((chapter) => (
                       <div 
                         key={chapter.id}
                         onClick={() => toggleChapter(chapter.id)}
                         className={`
                           p-3 rounded-lg border text-sm cursor-pointer transition flex items-center justify-between gap-3
                           ${selectedChapters.includes(chapter.id)
                             ? 'bg-purple-900/20 border-purple-500/50 text-purple-200'
                             : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'}
                         `}
                       >
                         <div className="flex items-center gap-3 overflow-hidden">
                            {selectedChapters.includes(chapter.id)
                              ? <CheckSquare className="text-purple-500 flex-shrink-0" size={16} />
                              : <Square className="text-zinc-600 flex-shrink-0" size={16} />
                            }
                            <span className="truncate">{chapter.title}</span>
                         </div>

                         {chapter.downloaded && (
                           <div className="flex-shrink-0" title="Downloaded">
                             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             ) : (
               <div className="h-full flex items-center justify-center bg-zinc-900/30 border border-zinc-900 rounded-xl border-dashed">
                 <div className="text-center text-zinc-500">
                    <p className="text-lg font-medium mb-2">Select a manga to manage details</p>
                    <p className="text-sm">Click on a manga from the list to view chapters</p>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
