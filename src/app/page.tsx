"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Feature, FeatureCollection } from "geojson";
import mapboxgl, { GeoJSONSource, LngLat, LngLatBounds, Map } from "mapbox-gl";
import polyline from "@mapbox/polyline";

import "@ant-design/v5-patch-for-react-19";
import { SettingFilled } from "@ant-design/icons";
import { Button, Checkbox, Divider, Drawer, Slider } from "antd";

import { ActivityType, Label, activityTypeConfig, rawActivities } from "./data";
import styles from "./page.module.css";

interface Activity {
  id: number;
  name: string;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  type: ActivityType;
  startDate: Date;
  positions: LngLat[];
}

const ACTIVITY_SOURCE = "activity-source";
const ACTIVITY_LAYER = "activity-layer";

export default function Home() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityTypeSettings, setActivityTypeSettings] = useState(
    activityTypeConfig.reduce(
      (acc, config) => ({ ...acc, [config.label]: true }),
      {} as Record<Label, boolean>
    )
  );
  const [minimumDistance, setMinimumDistance] = useState(0);
  const [maximumDistance, setMaximumDistance] = useState(100);
  const [highestDistance, setHighestDistance] = useState(100);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

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
          type: "line",
          paint: { "line-color": ["get", "colour"], "line-width": 3 },
        });
      }

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
            type: activity.sport_type,
            startDate: new Date(activity.start_date),
            positions: decodePolyline(activity.map.summary_polyline),
          };
        });

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
    });
  }, []);

  function decodePolyline(encoded: string): LngLat[] {
    const latLngArray = polyline.decode(encoded);
    return latLngArray.map(([lat, lng]) => new LngLat(lng, lat));
  }

  useEffect(() => {
    const fetchData = async () => {
      // const activities = rawActivities.map((activity): Activity => {
      //   return {
      //     id: activity.id,
      //     name: activity.name,
      //     distance: activity.distance,
      //     movingTime: activity.moving_time,
      //     elapsedTime: activity.elapsed_time,
      //     totalElevationGain: activity.total_elevation_gain,
      //     type: activity.type,
      //     startDate: new Date(activity.start_date),
      //     positions: decodePolyline(activity.map.summary_polyline),
      //   };
      // });
      // setData(activities);
      // const activityFeatureCollection: FeatureCollection = {
      //   type: "FeatureCollection",
      //   features: activities.map((activity): Feature => {
      //     return {
      //       type: "Feature",
      //       properties: { name: activity.name },
      //       geometry: {
      //         type: "LineString",
      //         coordinates: activity.positions.map((pos) => [pos.lng, pos.lat]),
      //       },
      //     };
      //   }),
      // };
      // map.current
      //   ?.getSource<GeoJSONSource>(ACTIVITY_SOURCE)
      //   ?.setData(activityFeatureCollection);
      // try {
      //   const baseUrl = "https://www.strava.com/api/v3/athlete/activities";
      //   const queryParams = new URLSearchParams({ per_page: "20" });
      //   const response = await fetch(`${baseUrl}?${queryParams.toString()}`, {
      //     method: "GET",
      //     headers: { Authorization: `Bearer ${process.env.STRAVA_API_KEY}` },
      //   });
      //   if (!response.ok) {
      //     throw new Error(`HTTP error! status: ${response.status}`);
      //   }
      //   const result: Activity[] = await response.json();
      //   setData(result);
      // } catch (err) {
      //   setError((err as Error).message || "An error occurred");
      // } finally {
      //   setLoading(false);
      // }
    };

    fetchData();
  }, []);

  const filterActivities = useCallback(
    (activities: Activity[]): Activity[] => {
      const minimumDistanceMetres = minimumDistance * 1000;
      const maximumDistanceMetres = maximumDistance * 1000;

      return activities.filter((activity) => {
        const configItem = activityTypeConfig.find((config) =>
          config.activityTypes.includes(activity.type)
        );

        if (!configItem) return;

        const typeSelected = activityTypeSettings[configItem.label];
        const distanceInRange =
          activity.distance >= minimumDistanceMetres &&
          activity.distance <= maximumDistanceMetres;

        return typeSelected && distanceInRange;
      });
    },
    [activityTypeSettings, minimumDistance, maximumDistance]
  );

  useEffect(() => {
    if (!map.current) return;

    const activityFeatureCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: filterActivities(activities).reduce(
        (acc: Feature[], activity) => {
          const colour = activityTypeConfig.find((config) =>
            config.activityTypes.includes(activity.type)
          )?.colour;

          if (!colour) return acc;

          const feature: Feature = {
            type: "Feature",
            properties: { colour },
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
  }, [activities, activityTypeSettings, filterActivities]);

  return (
    <>
      <div className={styles.page} ref={mapContainer} />

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
        title="Basic Drawer"
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
      >
        <h3>Activity Types</h3>
        <div className={styles.checkboxes}>
          {Object.entries(activityTypeSettings).map(([label, visible]) => (
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
          ))}
        </div>

        <Divider />

        <h3>Distance (km)</h3>
        <Slider
          range
          min={0}
          max={highestDistance}
          defaultValue={[0, highestDistance]}
          marks={{ 0: "0", [highestDistance]: highestDistance.toString() }}
          onChange={([min, max]) => {
            setMinimumDistance(min);
            setMaximumDistance(max);
          }}
        />
      </Drawer>
    </>
  );
}
