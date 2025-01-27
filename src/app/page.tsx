"use client";
import { useEffect, useRef } from "react";
import { Feature, FeatureCollection } from "geojson";
import mapboxgl, { GeoJSONSource, LngLat, Map } from "mapbox-gl";
import polyline from "@mapbox/polyline";

import { ActivityType, activityTypeConfig, rawActivities } from "./data";
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

      const activityFeatureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: activities.reduce((acc: Feature[], activity) => {
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
        }, []),
      };

      map.current
        ?.getSource<GeoJSONSource>(ACTIVITY_SOURCE)
        ?.setData(activityFeatureCollection);
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

  return (
    <>
      <div className={styles.page} ref={mapContainer} />

      <button className={styles.settingsButton}>Settings</button>
    </>
  );
}
