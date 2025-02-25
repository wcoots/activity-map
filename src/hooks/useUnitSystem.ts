import { useEffect } from "react";
import { useUIStore } from "@/store";
import { LocalStorageKey, UnitSystem } from "@/types";
import { unitSystemConfig } from "@/configs";

export function useUnitSystem() {
  const { unitSystem, setUnitSystem } = useUIStore();

  useEffect(
    function handleUnitSystemChange() {
      const localUnitSystem = localStorage.getItem(LocalStorageKey.UnitSystem);
      if (
        localUnitSystem &&
        Object.keys(unitSystemConfig).includes(localUnitSystem)
      ) {
        setUnitSystem(localUnitSystem as UnitSystem);
      }
    },
    [setUnitSystem]
  );

  function toggleUnitSystem() {
    const { toggle } = unitSystemConfig[unitSystem];
    localStorage.setItem(LocalStorageKey.UnitSystem, toggle);
    setUnitSystem(toggle);
  }

  return { toggleUnitSystem };
}
