export interface Chapter {
  id: string;
  title: string;
  url: string;
  downloaded?: boolean;
}

export interface Manga {
  id: string;
  title: string;
  thumbnail: string;
  description?: string;
  author?: string;
  status?: string;
  genres?: string[];
  chapters?: Chapter[];
  total_chapters?: number;
  updated_at: string;
}

export interface ChapterDetail {
  manga_id: string;
  chapter_id: string;
  images: string[];
  navigation?: {
    prev?: Chapter;
    next?: Chapter;
  }
}
