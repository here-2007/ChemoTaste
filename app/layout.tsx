import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChemoTaste — Evidence-Grounded Computational Gastronomy for Oncology Supportive Care',
  description:
    'Clinically safety-conscious meal discovery engine for chemotherapy patients experiencing dysgeusia, xerostomia, and oral mucositis. Powered by FlavorDB & RecipeDB.',
  keywords: [
    'computational gastronomy',
    'FlavorDB',
    'RecipeDB',
    'chemotherapy dysgeusia',
    'oncology nutrition',
    'metallic taste',
    'mucositis',
    'IIIT Delhi',
  ],
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-black text-white min-h-screen selection:bg-[#8052ff] selection:text-white">
        {children}
      </body>
    </html>
  );
}
