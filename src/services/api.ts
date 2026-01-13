import axios from 'axios';
import { Manga, ChapterDetail } from '@/types';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://manga-verse-1.onrender.com/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL: API_URL });

export const getMangas = async (page = 1, search = ''): Promise<{ data: Manga[], pagination: any }> => {
  const { data } = await api.get('/mangas', { params: { page, search } });
  return data;
};

export const getMangaDetail = async (id: string): Promise<Manga> => {
  const { data } = await api.get(`/mangas/${id}`);
  return data;
};

export const getChapterImages = async (mangaId: string, chapterId: string): Promise<ChapterDetail> => {
  const { data } = await api.get(`/mangas/${mangaId}/${chapterId}`);
  return data;
};

export const searchManga = async (keyword: string): Promise<{ success: boolean, keyword: string, count: number, results: Manga[] }> => {
  const { data } = await api.get('/search', { params: { keyword } });
  return data;
};

export const crawlFromUrl = async (url: string): Promise<{ success: boolean, manga: Manga }> => {
  const { data } = await api.post('/crawl', { url });
  return data;
};

export const crawlChapterRange = async (
  mangaId: string, 
  startChapterId: string, 
  endChapterId: string
): Promise<{ success: boolean, message: string, crawledCount: number }> => {
  const { data } = await api.post('/crawl-chapter-range', { 
    mangaId, 
    startChapterId, 
    endChapterId 
  });
  return data;
};

export const updateChapters = async (mangaId: string): Promise<Manga> => {
  const { data } = await api.post(`/mangas/${mangaId}/update-chapters`);
  return data;
};

export interface CrawlerConfig {
  baseUrl: string;
  mangaDetailUrlPattern: string;
  chapterUrlPattern: string;
}

export const getConfig = async (): Promise<CrawlerConfig> => {
  const { data } = await api.get('/config');
  return data;
};

export const updateConfig = async (config: Partial<CrawlerConfig>): Promise<CrawlerConfig> => {
  const { data } = await api.post('/config', config);
  return data;
};


export const deleteManga = async (id: string): Promise<{ success: boolean, message: string }> => {
  const { data } = await api.delete(`/admin/mangas/${id}`);
  return data;
};

export const deleteChapters = async (mangaId: string, chapterIds: string[]): Promise<{ success: boolean, message: string }> => {
  const { data } = await api.delete(`/admin/mangas/${mangaId}/chapters`, { data: { chapterIds } });
  return data;
};
