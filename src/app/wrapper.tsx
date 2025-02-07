"use client";

import React, { Suspense } from "react";
import { ConfigProvider } from "antd";

import { themeConfig } from "@/configs";
import { useMapStore } from "@/store";

export default function Wrapper(props: { children: React.ReactNode }) {
  const { children } = props;
  const { theme } = useMapStore();

  return (
    <Suspense>
      <ConfigProvider
        theme={{
          algorithm: themeConfig[theme].algorithm,
          token: { colorPrimary: themeConfig[theme].primaryColour },
        }}
      >
        {children}
      </ConfigProvider>
    </Suspense>
  );
}
