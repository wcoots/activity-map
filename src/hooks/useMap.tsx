"use client";
import { useCallback, useEffect, useRef } from "react";
import { Feature } from "geojson";
import mapboxgl, {
  GeoJSONSource,
  LineLayerSpecification,
  LngLatBounds,
  Map,
  PaddingOptions,
} from "mapbox-gl";

import { activitiesConfig, themeConfig } from "@/configs";
import { useActivities, useAuth } from "@/hooks";
import { useActivityStore, useMapStore } from "@/store";
import { isMobile, createFeatureCollection } from "@/utils";

enum SourceIds {
  ActivitySource = "activity-source",
  HoveredActivitySource = "hovered-activity-source",
  SelectedActivitySource = "selected-activity-source",
}

enum LayerIds {
  ActivityLayer = "activity-layer",
  InteractiveActivityLayer = "interactive-activity-layer",
  HoveredActivityLayer = "hovered-activity-layer",
  SelectedActivityLayer = "selected-activity-layer",
}

const INTERACTIVE_LAYERS = [
  LayerIds.ActivityLayer,
  LayerIds.InteractiveActivityLayer,
  LayerIds.HoveredActivityLayer,
  LayerIds.SelectedActivityLayer,
];

export function useMap() {
  const { filterActivities, getNextActivityId, getPreviousActivityId } =
    useActivities();
  const { contextHolder } = useAuth();

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const europeBounds = new LngLatBounds([-10, 38], [25, 58]);

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

  function initialiseSource(sourceId: SourceIds) {
    if (map.current && !map.current.getSource(sourceId)) {
      const data = createFeatureCollection([]);
      map.current.addSource(sourceId, { type: "geojson", data });
    }
  }

  function initialiseLineLayer(
    layerId: LayerIds,
    sourceId: SourceIds,
    paint: LineLayerSpecification["paint"] = {}
  ) {
    if (map.current && !map.current.getLayer(layerId)) {
      map.current.addLayer({
        id: layerId,
        source: sourceId,
        type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          ...paint,
          "line-width": [
            "*",
            paint["line-width"] ?? 3, // Use the provided width or default to 3
            ["case", ["boolean", ["feature-state", "shown"], true], 1, 0], // Width of 0 if not shown
          ],
        },
      });
    }
  }

  const createMapLayers = useCallback(() => {
    if (!map.current) return;

    initialiseSource(SourceIds.ActivitySource);
    initialiseSource(SourceIds.HoveredActivitySource);
    initialiseSource(SourceIds.SelectedActivitySource);

    initialiseLineLayer(
      LayerIds.InteractiveActivityLayer,
      SourceIds.ActivitySource,
      { "line-color": "transparent", "line-width": 12 }
    );

    initialiseLineLayer(LayerIds.ActivityLayer, SourceIds.ActivitySource, {
      "line-color": ["get", "colour"],
      "line-width": 3,
      "line-blur": 2,
    });

    initialiseLineLayer(
      LayerIds.HoveredActivityLayer,
      SourceIds.HoveredActivitySource,
      { "line-color": ["get", "colour"], "line-width": 5, "line-blur": 2 }
    );

    initialiseLineLayer(
      LayerIds.SelectedActivityLayer,
      SourceIds.SelectedActivitySource,
      {
        "line-color": ["get", "colour"],
        "line-width": 7,
        "line-border-color": ["get", "borderColour"],
        "line-border-width": 2,
      }
    );
  }, []);

  const filterSourceActivities = useCallback(() => {
    const filteredActivities = filterActivities(activities);

    activities.forEach((activity) => {
      const shown = !!filteredActivities.find(({ id }) => id === activity.id);

      map.current?.setFeatureState(
        { source: SourceIds.ActivitySource, id: activity.id },
        { shown }
      );
    });
  }, [activities, filterActivities]);

  const populateActivitySource = useCallback(() => {
    const features = activities.reduce((acc: Feature[], activity) => {
      const configItem = activitiesConfig.find((config) =>
        config.activityTypes.includes(activity.type)
      );

      if (!configItem) return acc;

      const colour = configItem.colour[theme];
      const borderColour = themeConfig[theme].borderColour;

      if (!colour) return acc;

      const feature: Feature = {
        type: "Feature",
        id: activity.id,
        properties: { id: activity.id, colour, borderColour },
        geometry: {
          type: "LineString",
          coordinates: activity.positions.map((pos) => [pos.lng, pos.lat]),
        },
      };

      return [...acc, feature];
    }, []);

    const activityFeatureCollection = createFeatureCollection(features);

    map.current
      ?.getSource<GeoJSONSource>(SourceIds.ActivitySource)
      ?.setData(activityFeatureCollection);
  }, [theme, activities]);

  const populateHighlightedSource = useCallback(
    (source: GeoJSONSource, activityId: number | null) => {
      if (!source) return;

      const featureCollection = createFeatureCollection([]);

      const activity = activities.find(
        (activity) => activity.id === activityId
      );

      if (!activity) return source.setData(featureCollection);

      const featureState = map.current?.getFeatureState({
        source: SourceIds.ActivitySource,
        id: activity.id,
      });

      if (!featureState?.shown) return source.setData(featureCollection);

      const configItem = activitiesConfig.find((config) =>
        config.activityTypes.includes(activity.type)
      );

      if (!configItem) return source.setData(featureCollection);

      const colour = configItem.colour[theme];
      const borderColour = themeConfig[theme].borderColour;

      const feature: Feature = {
        type: "Feature",
        properties: { id: activity.id, colour, borderColour },
        geometry: {
          type: "LineString",
          coordinates: activity.positions.map((pos) => [pos.lng, pos.lat]),
        },
      };

      featureCollection.features.push(feature);

      source.setData(featureCollection);
    },
    [theme, activities]
  );

  function fitBoundsOfActivities(initialFit = false) {
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

    const maxLongitude = Math.max(...longitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLatitude = Math.max(...latitudes);
    const minLatitude = Math.min(...latitudes);

    const bounds = new LngLatBounds(
      [maxLongitude, maxLatitude],
      [minLongitude, minLatitude]
    );

    if (initialFit) {
      if (
        maxLatitude > europeBounds.getNorth() ||
        maxLongitude > europeBounds.getEast()
      ) {
        bounds.setNorthEast(europeBounds.getNorthEast());
      }

      if (
        minLatitude < europeBounds.getSouth() ||
        minLongitude < europeBounds.getWest()
      ) {
        bounds.setSouthWest(europeBounds.getSouthWest());
      }
    }

    map.current.fitBounds(bounds, { padding: 50 });
  }

  function fitBoundsOfSelectedActivity(activityId?: number) {
    if (!map.current || (!selectedActivityId && !activityId)) return;

    if (activityId) setSelectedActivityId(activityId);

    const selectedActivity = activities.find(
      (activity) => activity.id === (activityId ?? selectedActivityId)
    );

    if (!selectedActivity) return;

    const padding: PaddingOptions = isMobile()
      ? { top: 50, right: 50, bottom: 300, left: 50 }
      : { top: 100, right: 100, bottom: 250, left: 250 };

    map.current.fitBounds(selectedActivity.bounds, { padding });
  }

  useEffect(
    function prepareMap() {
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

        map.current.on("mousemove", INTERACTIVE_LAYERS, ({ features }) => {
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
    },
    [theme, activities, setHoveredActivityId, createMapLayers, setMapLoading]
  );

  useEffect(
    function initialBoundaryFitting() {
      if (!activitiesLoading) fitBoundsOfActivities(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activitiesLoading]
  );

  useEffect(
    function prepareActivities() {
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

          if (activity) {
            setHoveredActivityId(null);
            setSelectedActivityId(activity.id);
          }
        }
      });
    },
    [
      activities,
      mapLoading,
      setHoveredActivityId,
      setSelectedActivityId,
      setHighestDistance,
      setMaximumDistance,
    ]
  );

  useEffect(
    function handleThemeChange() {
      if (map.current) {
        map.current.setStyle(themeConfig[theme].style);

        map.current.once("style.load", () => {
          setHoveredActivityId(null);
          setSelectedActivityId(null);
          createMapLayers();
          populateActivitySource();
          filterSourceActivities();
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, createMapLayers]
  );

  useEffect(
    function initialiseActivites() {
      populateActivitySource();
    },
    [populateActivitySource]
  );

  useEffect(
    function updateActivites() {
      filterSourceActivities();
    },
    [filterSourceActivities]
  );

  useEffect(
    function updateHoveredActivity() {
      const source = map.current?.getSource<GeoJSONSource>(
        SourceIds.HoveredActivitySource
      );

      if (!source) return;

      populateHighlightedSource(source, hoveredActivityId);
    },
    [populateHighlightedSource, hoveredActivityId]
  );

  useEffect(
    function updateSelectedActivity() {
      const source = map.current?.getSource<GeoJSONSource>(
        SourceIds.SelectedActivitySource
      );

      if (!source) return;

      populateHighlightedSource(source, selectedActivityId);
    },
    [populateHighlightedSource, selectedActivityId]
  );

  return {
    contextHolder,
    mapContainer,
    fitBoundsOfSelectedActivity,
    fitBoundsOfActivities,
    getNextActivityId,
    getPreviousActivityId,
  };
}
