"use client";

import React, { Suspense } from "react";
import { ConfigProvider, theme } from "antd";

export default function Wrapper(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <Suspense>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: { colorPrimary: "#6082B6" },
        }}
      >
        {children}
      </ConfigProvider>
    </Suspense>
  );
}
