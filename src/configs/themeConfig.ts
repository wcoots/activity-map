import { Theme } from "@/types";
import { MappingAlgorithm, theme as themes } from "antd";

export const themeConfig: {
  [key in Theme]: {
    style: string;
    borderColour: string;
    toggle: Theme;
    algorithm: MappingAlgorithm;
    primaryColour: string;
  };
} = {
  light: {
    style: "mapbox://styles/mapbox/light-v11",
    borderColour: "black",
    toggle: "dark",
    algorithm: themes.defaultAlgorithm,
    primaryColour: "#4A6691",
  },
  dark: {
    style: "mapbox://styles/mapbox/dark-v11",
    borderColour: "white",
    toggle: "light",
    algorithm: themes.darkAlgorithm,
    primaryColour: "#6082B6",
  },
};
