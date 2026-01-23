"use client";

import isValidProp from "@emotion/is-prop-valid";
import { Global } from "@emotion/react";
import { MotionConfig } from "framer-motion";
import Script from "next/script";
import React from "react";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { global } from "@src/lib/styles/global";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 1_800_000, // 30 mins
        gcTime: 3_600_000, // 60 mins
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(makeQueryClient);

  return (
    <RecoilRoot>
      <SessionProvider>
        {/* Jennifer Analytics 추적코드 */}
        <Script
          id="jennifer-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(j,ennifer) {
                  j['dmndata']=[];j['jenniferFront']=function(args){window.dmndata.push(args)};
                  j['dmnaid']=ennifer;j['dmnatime']=new Date();j['dmnanocookie']=false;j['dmnajennifer']='JENNIFER_FRONT@INTG';
              }(window, 'dde0c5d9'));
            `,
          }}
        />
        <Script
          id="jennifer-demian"
          src="https://d-collect.jennifersoft.com/dde0c5d9/demian.js"
          strategy="afterInteractive"
          async
        />

        <Global styles={global} />
        <QueryClientProvider client={queryClient}>
          <MotionConfig isValidProp={isValidProp}>
            {children}
            <Analytics />
            <SpeedInsights />
          </MotionConfig>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </SessionProvider>
    </RecoilRoot>
  );
}

