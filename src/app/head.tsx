import React from "react";

export default function Head() {
  return React.createElement(
    React.Fragment,
    null,
    // iOS Safari를 위한 apple-touch-icon
    React.createElement("link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=1" }),
    React.createElement("link", {
      rel: "apple-touch-icon-precomposed",
      href: "/apple-touch-icon-precomposed.png?v=1",
    }),
    React.createElement("link", {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-icon-180x180.png?v=1",
    }),

    // Favicon 설정
    React.createElement("link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }),
    React.createElement("link", {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon-16x16.png",
    }),
    React.createElement("link", {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    }),
    React.createElement("link", {
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
      href: "/favicon-96x96.png",
    }),
    React.createElement("link", { rel: "apple-touch-icon", href: "/apple-icon.png" }),
    React.createElement("link", { rel: "apple-touch-icon-precomposed", href: "/apple-icon-precomposed.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "57x57", href: "/apple-icon-57x57.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "60x60", href: "/apple-icon-60x60.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "72x72", href: "/apple-icon-72x72.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "76x76", href: "/apple-icon-76x76.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "114x114", href: "/apple-icon-114x114.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "120x120", href: "/apple-icon-120x120.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "144x144", href: "/apple-icon-144x144.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "152x152", href: "/apple-icon-152x152.png" }),
    React.createElement("link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-icon-180x180.png" }),
    React.createElement("link", {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      href: "/android-icon-192x192.png",
    }),
    React.createElement("link", { rel: "manifest", href: "/manifest.json" }),

    React.createElement("meta", { name: "msapplication-TileColor", content: "#ffffff" }),
    React.createElement("meta", { name: "msapplication-TileImage", content: "/ms-icon-144x144.png" }),
    React.createElement("meta", { name: "msapplication-config", content: "/browserconfig.xml" }),
    React.createElement("meta", { name: "theme-color", content: "#ffffff" }),

    React.createElement("meta", { name: "apple-mobile-web-app-title", content: "HUB" }),
    React.createElement("meta", { name: "apple-mobile-web-app-capable", content: "yes" }),
    React.createElement("meta", { name: "apple-mobile-web-app-status-bar-style", content: "black" }),

    // Wanted Sans Variable (external)
    React.createElement("link", {
      rel: "preconnect",
      href: "https://cdn.jsdelivr.net",
      crossOrigin: "anonymous",
    }),
    React.createElement("link", {
      rel: "preload",
      as: "style",
      crossOrigin: "anonymous",
      href: "https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css",
    }),
    React.createElement("link", {
      rel: "stylesheet",
      href: "https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css",
      crossOrigin: "anonymous",
    }),
  );
}

