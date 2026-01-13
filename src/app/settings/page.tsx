'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConfig, updateConfig, CrawlerConfig } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CrawlerConfig>({
    baseUrl: '',
    mangaDetailUrlPattern: '',
    chapterUrlPattern: ''
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        baseUrl: config.baseUrl || '',
        mangaDetailUrlPattern: config.mangaDetailUrlPattern || '',
        chapterUrlPattern: config.chapterUrlPattern || ''
      });
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Crawler configuration has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Crawler Settings</h1>
        </div>

        <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Base URL</label>
              <Input 
                value={formData.baseUrl}
                onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                placeholder="https://example.com"
                required
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                The main domain of the manga site (e.g., https://halcyonhomecare.co.uk)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Manga Detail URL Pattern</label>
              <Input 
                value={formData.mangaDetailUrlPattern}
                onChange={(e) => setFormData({...formData, mangaDetailUrlPattern: e.target.value})}
                placeholder="https://example.com/manga/{slug}"
                required
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Use <code>{'{slug}'}</code> as placeholder for manga ID.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chapter URL Pattern</label>
              <Input 
                value={formData.chapterUrlPattern}
                onChange={(e) => setFormData({...formData, chapterUrlPattern: e.target.value})}
                placeholder="https://example.com/manga/{slug}/{chapter}"
                required
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Use <code>{'{slug}'}</code> for manga ID and <code>{'{chapter}'}</code> for chapter ID (e.g. chapter-1).
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
