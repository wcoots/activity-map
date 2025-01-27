"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Feature, FeatureCollection } from "geojson";
import mapboxgl, { GeoJSONSource, LngLatBounds, Map } from "mapbox-gl";
import dayjs from "dayjs";

import "@ant-design/v5-patch-for-react-19";
import { LoadingOutlined, SettingFilled } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  ColorPicker as ColourPicker,
  DatePicker,
  Divider,
  Drawer,
  Input,
  Slider,
  Spin,
} from "antd";

import { activityTypeConfig } from "@/data";
import { useStore } from "@/store";
import { convertSpeedToPace, decodePolyline, formatSeconds } from "@/utils";
import { Activity, Label, RawActivity } from "@/types";

import styles from "./page.module.css";

const ACTIVITY_SOURCE = "activity-source";
const ACTIVITY_LAYER = "activity-layer";
const SELECTED_ACTIVITY_LAYER = "selected-activity-layer";

const INTERACTIVE_LAYERS = [ACTIVITY_LAYER, SELECTED_ACTIVITY_LAYER];

export default function Home() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  const {
    activities,
    selectedActivity,
    activityTypeSettings,
    activityTypeColourSettings,
    minimumDistance,
    maximumDistance,
    highestDistance,
    keywordText,
    year,
    setActivities,
    setSelectedActivity,
    setActivityTypeSettings,
    setActivityTypeColourSettings,
    setMinimumDistance,
    setMaximumDistance,
    setHighestDistance,
    setKeywordText,
    setYear,
  } = useStore();

  const [mapLoading, setMapLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [rawActivities, setRawActivities] = useState<RawActivity[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    console.log("USE EFFECT 1");
    if (map.current || !mapContainer.current) return;

    fetchActivities();

    mapboxgl.accessToken = process.env.MAPBOX_API_KEY!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-4, 54.2],
      zoom: 5,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disableRotation();
      map.current.touchPitch.disable();

      if (!map.current.getSource(ACTIVITY_SOURCE)) {
        map.current.addSource(ACTIVITY_SOURCE, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.current.getLayer(ACTIVITY_LAYER)) {
        map.current.addLayer({
          id: ACTIVITY_LAYER,
          source: ACTIVITY_SOURCE,
          filter: ["==", ["get", "selected"], false],
          type: "line",
          paint: {
            "line-color": ["get", "colour"],
            "line-width": 3,
            "line-blur": 2,
          },
        });
      }

      if (!map.current.getLayer(SELECTED_ACTIVITY_LAYER)) {
        map.current.addLayer({
          id: SELECTED_ACTIVITY_LAYER,
          source: ACTIVITY_SOURCE,
          filter: ["==", ["get", "selected"], true],
          type: "line",
          paint: {
            "line-color": ["get", "colour"],
            "line-width": 4,
            "line-border-color": "white",
            "line-border-width": 1,
          },
        });
      }

      map.current.on("mouseenter", INTERACTIVE_LAYERS, () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", INTERACTIVE_LAYERS, () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });

      setMapLoading(false);
    });
  }, []);

  useEffect(() => {
    console.log("USE EFFECT 2");
    if (!rawActivities.length || !map.current || mapLoading) return;

    const activities = rawActivities
      .filter((activity) => activity.map.summary_polyline.length)
      .map((activity): Activity => {
        return {
          id: activity.id,
          name: activity.name,
          distance: activity.distance,
          movingTime: activity.moving_time,
          elapsedTime: activity.elapsed_time,
          totalElevationGain: activity.total_elevation_gain,
          averageSpeed: activity.average_speed,
          type: activity.sport_type,
          startDate: new Date(activity.start_date),
          positions: decodePolyline(activity.map.summary_polyline),
        };
      })
      .reverse();

    const longitudes = activities.flatMap((activity) =>
      activity.positions.map((pos) => pos.lng)
    );

    const latitudes = activities.flatMap((activity) =>
      activity.positions.map((pos) => pos.lat)
    );

    const bounds = new LngLatBounds(
      [Math.max(...longitudes), Math.max(...latitudes)],
      [Math.min(...longitudes), Math.min(...latitudes)]
    );

    map.current.fitBounds(bounds, { padding: 20 });

    setActivities(activities);

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
        setSelectedActivity(null);
        return;
      }

      const [topFeature] = features;
      if (topFeature.properties?.id) {
        const activity = activities.find(
          (activity) => activity.id === topFeature.properties!.id
        );

        if (activity) setSelectedActivity(activity);
      }
    });
  }, [
    rawActivities,
    mapLoading,
    setSelectedActivity,
    setActivities,
    setHighestDistance,
    setMaximumDistance,
  ]);

  async function fetchActivities() {
    try {
      const response = await fetch("/api/activities/get", { method: "GET" });
      if (!response.ok) return;
      const result: RawActivity[] = await response.json();
      setRawActivities(result);
    } catch (err) {
      throw new Error((err as Error).message || "An error occurred");
    } finally {
      setActivitiesLoading(false);
    }
  }

  function fitBoundsOfActivities() {
    if (!map.current) return;

    const filteredActivities = filterActivities(activities);

    if (!filteredActivities.length) return;

    const longitudes = filteredActivities.flatMap((activity) =>
      activity.positions.map((pos) => pos.lng)
    );

    const latitudes = filteredActivities.flatMap((activity) =>
      activity.positions.map((pos) => pos.lat)
    );

    const bounds = new LngLatBounds(
      [Math.max(...longitudes), Math.max(...latitudes)],
      [Math.min(...longitudes), Math.min(...latitudes)]
    );

    map.current.fitBounds(bounds, {
      padding: { top: 20, left: 20, bottom: 20, right: 400 },
    });
  }

  const filterActivities = useCallback(
    (activities: Activity[]): Activity[] => {
      const minimumDistanceMetres = minimumDistance * 1000;
      const maximumDistanceMetres = maximumDistance * 1000;

      const filteredActivities = activities.filter((activity) => {
        const configItem = activityTypeConfig.find((config) =>
          config.activityTypes.includes(activity.type)
        );

        if (!configItem) return;

        const typeSelected = activityTypeSettings[configItem.label];
        const distanceInRange =
          activity.distance >= minimumDistanceMetres &&
          activity.distance <= maximumDistanceMetres;
        const textMatch = keywordText.length
          ? activity.name.toLowerCase().includes(keywordText.toLowerCase())
          : true;
        const yearMatch = year
          ? activity.startDate.getFullYear() === year
          : true;

        return typeSelected && distanceInRange && textMatch && yearMatch;
      });

      if (!filteredActivities.find(({ id }) => id === selectedActivity?.id)) {
        setSelectedActivity(null);
      }

      return filteredActivities;
    },
    [
      activityTypeSettings,
      minimumDistance,
      maximumDistance,
      keywordText,
      year,
      selectedActivity,
      setSelectedActivity,
    ]
  );

  useEffect(() => {
    console.log("USE EFFECT 3");
    if (!map.current) return;

    const activityFeatureCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: filterActivities(activities).reduce(
        (acc: Feature[], activity) => {
          const configItem = activityTypeConfig.find((config) =>
            config.activityTypes.includes(activity.type)
          );

          if (!configItem) return acc;

          const colour = activityTypeColourSettings[configItem.label];

          if (!colour) return acc;

          const feature: Feature = {
            type: "Feature",
            properties: {
              id: activity.id,
              colour,
              selected: activity.id === selectedActivity?.id,
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
      ?.getSource<GeoJSONSource>(ACTIVITY_SOURCE)
      ?.setData(activityFeatureCollection);
  }, [
    activities,
    activityTypeSettings,
    activityTypeColourSettings,
    filterActivities,
    selectedActivity,
  ]);

  return (
    <>
      <div className={styles.page} ref={mapContainer} />

      {activitiesLoading && (
        <Spin
          className={styles.spinner}
          indicator={<LoadingOutlined spin />}
          size="large"
        />
      )}

      <Button
        className={styles.settingsButton}
        type="primary"
        color="default"
        variant="solid"
        size="large"
        icon={<SettingFilled />}
        onClick={() => setSettingsOpen(true)}
      />

      <Drawer
        title="Settings"
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
      >
        <h3>Activity Types</h3>
        <div className={styles.checkboxes}>
          {Object.entries(activityTypeSettings).map(([label, visible]) => (
            <div key={label}>
              <Checkbox
                key={label}
                checked={visible}
                onChange={(event) => {
                  setActivityTypeSettings({
                    ...activityTypeSettings,
                    [label]: event.target.checked,
                  });
                }}
              >
                {label}
              </Checkbox>

              <ColourPicker
                className={styles.colourPicker}
                value={activityTypeColourSettings[label as Label]}
                size="small"
                disabledAlpha
                disabledFormat
                format="hex"
                onChangeComplete={(colour) => {
                  setActivityTypeColourSettings({
                    ...activityTypeColourSettings,
                    [label]: colour.toHexString(),
                  });
                }}
              />
            </div>
          ))}
        </div>

        <Divider />

        <h3>Distance (km)</h3>
        <Slider
          range
          min={0}
          max={highestDistance}
          defaultValue={[0, highestDistance]}
          marks={{
            0: "0km",
            [highestDistance]: `${highestDistance.toString()}km`,
          }}
          onChange={([min, max]) => {
            setMinimumDistance(min);
            setMaximumDistance(max);
          }}
        />

        <Divider />

        <h3>Year</h3>
        <DatePicker
          onChange={(a) => setYear(a?.year())}
          picker="year"
          maxDate={dayjs()}
        />

        <Divider />

        <h3>Keywords</h3>
        <Input
          placeholder="parkrun"
          value={keywordText}
          onChange={(event) => setKeywordText(event.target.value)}
        />

        <Divider />
        <Button onClick={fitBoundsOfActivities}>Fit Bounds</Button>
      </Drawer>

      {selectedActivity && (
        <Card
          className={styles.activityCard}
          title={
            <div className={styles.activityCardTitle}>
              {selectedActivity.name}
              <div className={styles.activityCardDate}>
                {dayjs(selectedActivity.startDate).format("ddd D MMM YYYY")}
              </div>
            </div>
          }
        >
          <strong>Type:</strong> {selectedActivity.type}
          <br />
          <strong>Distance:</strong>{" "}
          {+(selectedActivity.distance / 1000).toFixed(2)}km
          <br />
          <strong>Moving Time:</strong>{" "}
          {formatSeconds(selectedActivity.movingTime)}
          <br />
          <strong>Average Pace:</strong>{" "}
          {convertSpeedToPace(selectedActivity.averageSpeed)}
          <br />
          <strong>Elevation Gain:</strong>{" "}
          {Math.floor(selectedActivity.totalElevationGain)}m
        </Card>
      )}
    </>
  );
}
