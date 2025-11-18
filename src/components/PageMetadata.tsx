import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface PageMetadataProps {
  title?: string;
  description?: string;
}

export const PageMetadata: React.FC<PageMetadataProps> = ({ 
  title = 'HotWell.KZ',
  description = 'Управление бизнесом'
}) => {
  const location = useLocation();
  const currentUrl = window.location.origin + location.pathname;

  useEffect(() => {
    // Обновляем манифест для текущей страницы
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      const manifestUrl = new URL('/manifest.json', window.location.origin);
      manifestUrl.searchParams.set('start_url', location.pathname);
      manifestLink.setAttribute('href', manifestUrl.toString());
    }
  }, [location]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* PWA meta tags */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={title} />
      
      {/* Open Graph meta tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      
      {/* PWA related links */}
      <link rel="manifest" href={`/manifest.json?start_url=${location.pathname}`} />
      <link rel="apple-touch-icon" href="/icon-192x192.png" />
    </Helmet>
  );
};
