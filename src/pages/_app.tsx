// 파일 경로: src/pages/_app.tsx

import isValidProp from "@emotion/is-prop-valid";
import { MotionConfig } from "framer-motion";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { Global } from "@emotion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { global } from "@src/lib/styles/global";
import React from "react";
import { RecoilRoot } from 'recoil';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
// [변경] SessionProvider를 import합니다.
import { SessionProvider } from 'next-auth/react'; 

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 1800000, // 30 mins
      gcTime: 3600000, // 60 mins
    },
  },
});

// [변경] pageProps에서 session을 분리합니다.
function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <RecoilRoot>
      {/* [변경] GoogleOAuthProvider를 SessionProvider로 교체하고 앱 전체를 감쌉니다. */}
      <SessionProvider session={session}>
        <Head>
          <title>HUB</title>
          <meta name="title" content="HUB" />
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
          <meta name="apple-mobile-web-app-title" content="HUB" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=1" />
          <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png?v=1" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png?v=1" />
          <link rel="icon" href="/favicon.ico?v=1" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0,  maximum-scale=1" />
          <meta content="yes" name="apple-mobile-web-app-capable" />
        </Head>
        <Script id="jennifer-script" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function(j,ennifer) {
                j['dmndata']=[];j['jenniferFront']=function(args){window.dmndata.push(args)};
                j['dmnaid']=ennifer;j['dmnatime']=new Date();j['dmnanocookie']=false;j['dmnajennifer']='JENNIFER_FRONT@INTG';
            }(window, '49032406'));
          `
        }} />
        <Script id="jennifer-demian" src="https://d-collect.jennifersoft.com/49032406/demian.js" strategy="afterInteractive" />
        <Global styles={global} />
        <QueryClientProvider client={queryClient}>
          <MotionConfig isValidProp={isValidProp}>
            <Component {...pageProps} />
            <Analytics />
            <SpeedInsights />
          </MotionConfig>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </SessionProvider>
    </RecoilRoot>
  );
}

export default MyApp;