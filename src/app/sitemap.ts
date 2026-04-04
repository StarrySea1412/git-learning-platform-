import { MetadataRoute } from 'next';
import { practiceTasks } from '@/lib/practice';
import { tutorials } from '@/lib/tutorials';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://git-learn.example.com';

export default function sitemap(): MetadataRoute.Sitemap {

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${baseUrl}/tutorials`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/practice`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/animations`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/sandbox`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  const tutorialPages = tutorials.map(t => ({
    url: `${baseUrl}/tutorials/${t.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const practicePages = practiceTasks.map(t => ({
    url: `${baseUrl}/practice/${t.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...tutorialPages, ...practicePages];
}
