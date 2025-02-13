"use client";
import { useCallback, useEffect, useRef } from "react";
import { Feature, FeatureCollection } from "geojson";
import mapboxgl, {
  GeoJSONSource,
  LngLatBounds,
  Map,
  PaddingOptions,
} from "mapbox-gl";

import { activitiesConfig, themeConfig } from "@/configs";
import { useActivities, useAuth } from "@/hooks";
import { useActivityStore, useMapStore } from "@/store";
import { isMobile } from "@/utils";

enum Sources {
  ActivitySource = "activity-source",
}

enum Layers {
  ActivityLayer = "activity-layer",
  InteractiveActivityLayer = "interactive-activity-layer",
  HoveredActivityLayer = "hovered-activity-layer",
  SelectedActivityLayer = "selected-activity-layer",
}

const INTERACTIVE_LAYERS = [
  Layers.ActivityLayer,
  Layers.InteractiveActivityLayer,
  Layers.HoveredActivityLayer,
  Layers.SelectedActivityLayer,
];

export function useMap() {
  const { filterActivities } = useActivities();
  const { contextHolder } = useAuth();

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  const {
    activitiesLoading,
    activities,
    filteredActivityIds,
    hoveredActivityId,
    selectedActivityId,
    setHoveredActivityId,
    setSelectedActivityId,
    setMaximumDistance,
    setHighestDistance,
  } = useActivityStore();
  const { mapLoading, theme, setMapLoading } = useMapStore();

  const createMapLayers = useCallback(() => {
    if (!map.current) return;

    if (!map.current!.getSource(Sources.ActivitySource)) {
      map.current!.addSource(Sources.ActivitySource, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.current.getLayer(Layers.InteractiveActivityLayer)) {
      map.current.addLayer({
        id: Layers.InteractiveActivityLayer,
        source: Sources.ActivitySource,
        filter: ["==", ["get", "selected"], false],
        type: "line",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "transparent",
          "line-width": 12,
        },
      });
    }

    if (!map.current.getLayer(Layers.ActivityLayer)) {
      map.current.addLayer({
        id: Layers.ActivityLayer,
        source: Sources.ActivitySource,
        filter: [
          "all",
          ["==", ["get", "selected"], false],
          ["==", ["get", "hovered"], false],
        ],
        type: "line",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": ["get", "colour"],
          "line-width": 3,
          "line-blur": 2,
        },
      });
    }

    if (!map.current.getLayer(Layers.HoveredActivityLayer)) {
      map.current.addLayer({
        id: Layers.HoveredActivityLayer,
        source: Sources.ActivitySource,
        filter: [
          "all",
          ["==", ["get", "selected"], false],
          ["==", ["get", "hovered"], true],
        ],
        type: "line",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": ["get", "colour"],
          "line-width": 5,
          "line-blur": 2,
        },
      });
    }

    if (!map.current.getLayer(Layers.SelectedActivityLayer)) {
      map.current.addLayer({
        id: Layers.SelectedActivityLayer,
        source: Sources.ActivitySource,
        filter: ["==", ["get", "selected"], true],
        type: "line",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": ["get", "colour"],
          "line-width": 7,
          "line-border-color": ["get", "borderColour"],
          "line-border-width": 2,
        },
      });
    }
  }, []);

  const populateSource = useCallback(() => {
    const activityFeatureCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: filterActivities(activities).reduce(
        (acc: Feature[], activity) => {
          const configItem = activitiesConfig.find((config) =>
            config.activityTypes.includes(activity.type)
          );

          if (!configItem) return acc;

          const colour = configItem.colour[theme];
          const borderColour = themeConfig[theme].borderColour;

          if (!colour) return acc;

          const feature: Feature = {
            type: "Feature",
            properties: {
              id: activity.id,
              colour,
              borderColour,
              hovered: activity.id === hoveredActivityId,
              selected: activity.id === selectedActivityId,
            },
            geometry: {
              type: "LineString",
              coordinates: activity.positions.map((pos) => [pos.lng, pos.lat]),
            },
          };

          return [...acc, feature];
        },
        []
      ),
    };

    map.current
      ?.getSource<GeoJSONSource>(Sources.ActivitySource)
      ?.setData(activityFeatureCollection);
  }, [
    theme,
    activities,
    filterActivities,
    hoveredActivityId,
    selectedActivityId,
  ]);

  function fitBoundsOfActivities() {
    if (!map.current) return;

    const filteredActivities = activities.filter((activity) =>
      filteredActivityIds.includes(activity.id)
    );

    if (!filteredActivities.length) return;

    const longitudes = filteredActivities.flatMap((activity) => [
      activity.bounds.getNorthEast().lng,
      activity.bounds.getSouthWest().lng,
    ]);

    const latitudes = filteredActivities.flatMap((activity) => [
      activity.bounds.getNorthEast().lat,
      activity.bounds.getSouthWest().lat,
    ]);

    const bounds = new LngLatBounds(
      [Math.max(...longitudes), Math.max(...latitudes)],
      [Math.min(...longitudes), Math.min(...latitudes)]
    );

    map.current.fitBounds(bounds, { padding: 50 });
  }

  function fitBoundsOfSelectedActivity() {
    if (!map.current || !selectedActivityId) return;

    const selectedActivity = activities.find(
      (activity) => activity.id === selectedActivityId
    );

    if (!selectedActivity) return;

    const padding: PaddingOptions = isMobile()
      ? { top: 50, right: 50, bottom: 300, left: 50 }
      : { top: 100, right: 100, bottom: 250, left: 250 };

    map.current.fitBounds(selectedActivity.bounds, { padding });
  }

  useEffect(() => {
    // Map preparation useEffect. Called once on component mount.
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.MAPBOX_API_KEY!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: themeConfig[theme].style,
      center: [-4, 54.2],
      zoom: 5,
      attributionControl: false,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disableRotation();
      map.current.touchPitch.disable();

      createMapLayers();

      map.current.on("mouseenter", INTERACTIVE_LAYERS, ({ features }) => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
        if (features?.length) {
          const [topFeature] = features;
          setHoveredActivityId(topFeature.properties!.id);
        }
      });

      map.current.on("mouseleave", INTERACTIVE_LAYERS, () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
        setHoveredActivityId(null);
      });

      setMapLoading(false);
    });
  }, [theme, activities, setHoveredActivityId, createMapLayers, setMapLoading]);

  useEffect(() => {
    if (!activitiesLoading) fitBoundsOfActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activitiesLoading]);

  useEffect(() => {
    // Activities preparation useEffect. Called on activities load.
    if (!activities.length || !map.current || mapLoading) return;

    const maxDistance = Math.ceil(
      Math.max(...activities.map((activity) => activity.distance / 1000))
    );

    setMaximumDistance(maxDistance);
    setHighestDistance(maxDistance);

    map.current.on("click", (e) => {
      if (!map.current) return;

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: INTERACTIVE_LAYERS,
      });

      if (!features?.length) {
        setSelectedActivityId(null);
        return;
      }

      const [topFeature] = features;
      if (topFeature.properties?.id) {
        const activity = activities.find(
          (activity) => activity.id === topFeature.properties!.id
        );

        if (activity) setSelectedActivityId(activity.id);
      }
    });
  }, [
    activities,
    mapLoading,
    setSelectedActivityId,
    setHighestDistance,
    setMaximumDistance,
  ]);

  useEffect(() => {
    // Map theme useEffect. Called whenever theme changes.
    if (map.current) {
      map.current.setStyle(themeConfig[theme].style);

      map.current.once("style.load", () => {
        createMapLayers();
        populateSource();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, createMapLayers]);

  useEffect(() => {
    // Activities update useEffect. Called whenever activities or filters change.
    populateSource();
  }, [populateSource]);

  return {
    contextHolder,
    mapContainer,
    fitBoundsOfSelectedActivity,
    fitBoundsOfActivities,
  };
}
