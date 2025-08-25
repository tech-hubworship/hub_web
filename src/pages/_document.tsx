import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  // iOS Safari 파비콘 캐시를 강제로 갱신하기 위한 무작위 버전 문자열
  const cacheBuster = new Date().getTime();
  
  return (
    <Html lang="ko" dir="ltr">
      <Head>
        {/* iOS Safari를 위한 apple-touch-icon */}
        <link rel="apple-touch-icon" href={`/apple-touch-icon.png?v=${cacheBuster}`} />
        <link rel="apple-touch-icon-precomposed" href={`/apple-touch-icon-precomposed.png?v=${cacheBuster}`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`/apple-icon-180x180.png?v=${cacheBuster}`} />
        
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-icon-precomposed.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#ffffff" />
        
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link 
          rel="preload" 
          as="style" 
          crossOrigin="anonymous" 
          href="https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css" 
        />
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css" 
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
