import React from "react";

export default function NotFound() {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
      },
    },
    React.createElement("h1", null, "404"),
    React.createElement("p", null, "페이지를 찾을 수 없습니다.")
  );
}

