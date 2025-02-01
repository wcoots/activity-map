"use client";

import React, { Suspense } from "react";
import { ConfigProvider } from "antd";

import { useStore } from "@/store";
import { themeConfig } from "@/configs";

export default function Wrapper(props: { children: React.ReactNode }) {
  const { children } = props;
  const { theme } = useStore();

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
