"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Feature, FeatureCollection } from "geojson";
import mapboxgl, {
  GeoJSONSource,
  LngLatBounds,
  Map,
  PaddingOptions,
} from "mapbox-gl";
import dayjs from "dayjs";

import "@ant-design/v5-patch-for-react-19";
import {
  LoadingOutlined,
  MoonFilled,
  SettingFilled,
  SunFilled,
} from "@ant-design/icons";
import { Button, Card, message, Spin, Switch, Tooltip } from "antd";

import { SelectedActivityCard, SettingsDrawer } from "@/components";
import { activityTypeConfig, themeConfig } from "@/configs";
import { useStore } from "@/store";
import { decodePolyline, isMobile } from "@/utils";
import {
  Activity,
  Athlete,
  LocalStorageKey,
  RawActivity,
  RawAthelete,
  Theme,
} from "@/types";

import styles from "./page.module.css";

const ACTIVITY_SOURCE = "activity-source";
const ACTIVITY_LAYER = "activity-layer";
const SELECTED_ACTIVITY_LAYER = "selected-activity-layer";

const INTERACTIVE_LAYERS = [ACTIVITY_LAYER, SELECTED_ACTIVITY_LAYER];

export default function Home() {
  const searchParams = useSearchParams();
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const {
    theme,
    activities,
    selectedActivity,
    activityTypeSettings,
    activityTypeColourSettings,
    minimumDistance,
    maximumDistance,
    keywordText,
    year,
    setTheme,
    setAthlete,
    setActivities,
    setSelectedActivity,
    setMaximumDistance,
    setHighestDistance,
    setLastRefreshed,
  } = useStore();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [athleteLoading, setAthleteLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [rawActivities, setRawActivities] = useState<RawActivity[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const createMapLayers = useCallback(() => {
    if (!map.current) return;

    if (!map.current!.getSource(ACTIVITY_SOURCE)) {
      map.current!.addSource(ACTIVITY_SOURCE, {
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
          "line-border-color": themeConfig[theme].borderColour,
          "line-border-width": 1,
        },
      });
    }
  }, [theme]);

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

  const populateSource = useCallback(() => {
    const activityFeatureCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: filterActivities(activities).reduce(
        (acc: Feature[], activity) => {
          const configItem = activityTypeConfig.find((config) =>
            config.activityTypes.includes(activity.type)
          );

          if (!configItem) return acc;

          const colour = activityTypeColourSettings[configItem.label][theme];

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
    theme,
    activities,
    activityTypeColourSettings,
    filterActivities,
    selectedActivity,
  ]);

  function toggleTheme() {
    const { toggle } = themeConfig[theme];
    localStorage.setItem(LocalStorageKey.Theme, toggle);
    setTheme(toggle);
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

    setSettingsOpen(false);
    map.current.fitBounds(bounds, { padding: 20 });
  }

  function fitBoundsOfSelectedActivity() {
    if (!map.current || !selectedActivity) return;

    const bounds = new LngLatBounds(
      [
        Math.max(...selectedActivity.positions.map((pos) => pos.lng)),
        Math.max(...selectedActivity.positions.map((pos) => pos.lat)),
      ],
      [
        Math.min(...selectedActivity.positions.map((pos) => pos.lng)),
        Math.min(...selectedActivity.positions.map((pos) => pos.lat)),
      ]
    );

    const padding: PaddingOptions = isMobile()
      ? { top: 50, right: 50, bottom: 300, left: 50 }
      : { top: 100, right: 100, bottom: 250, left: 250 };

    map.current.fitBounds(bounds, { padding });
  }

  useEffect(() => {
    const localTheme = localStorage.getItem(LocalStorageKey.Theme);
    if (localTheme && Object.keys(themeConfig).includes(localTheme))
      setTheme(localTheme as Theme);

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

      map.current.on("mouseenter", INTERACTIVE_LAYERS, () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", INTERACTIVE_LAYERS, () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });

      setMapLoading(false);
    });
  }, [theme, setTheme, createMapLayers]);

  useEffect(() => {
    // Authentication and activity fetching useEffect. Called once on component mount.
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/check");

        if (response.status === 200) {
          setIsAuthenticated(true);
          await Promise.all([fetchAthlete(), fetchActivities()]);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    }

    async function fetchAthlete() {
      try {
        setAthleteLoading(true);
        const cachedAthlete = localStorage.getItem(LocalStorageKey.Athlete);

        if (cachedAthlete) {
          const { ts, data } = JSON.parse(cachedAthlete);
          setLastRefreshed(dayjs(parseInt(ts, 10)).toDate());

          const cacheAge = Date.now() - parseInt(ts, 10);

          if (cacheAge < 3600000) {
            setAthlete(data);
            return;
          }
        }

        const response = await fetch("/api/athlete");
        if (!response.ok) return;

        const result: RawAthelete = await response.json();
        const athlete: Athlete = {
          id: result.id,
          firstName: result.firstname,
          lastName: result.lastname,
          imageUrl: result.profile_medium,
        };

        setAthlete(athlete);

        localStorage.setItem(
          LocalStorageKey.Athlete,
          JSON.stringify({ ts: Date.now().toString(), data: athlete })
        );
      } catch (err) {
        console.error("Error fetching athlete:", err);
      } finally {
        setAthleteLoading(false);
      }
    }

    async function fetchActivities() {
      try {
        setActivitiesLoading(true);
        const cachedActivities = localStorage.getItem(
          LocalStorageKey.Activities
        );

        if (cachedActivities) {
          const { ts, data } = JSON.parse(cachedActivities);
          setLastRefreshed(dayjs(parseInt(ts, 10)).toDate());

          const cacheAge = Date.now() - parseInt(ts, 10);

          if (cacheAge < 3600000) {
            setRawActivities(data);
            return;
          }
        }

        const response = await fetch("/api/activities");
        if (!response.ok) return;

        const result: RawActivity[] = await response.json();
        setRawActivities(result);
        setLastRefreshed(new Date());
        localStorage.setItem(
          LocalStorageKey.Activities,
          JSON.stringify({ ts: Date.now().toString(), data: result })
        );
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setActivitiesLoading(false);
      }
    }

    checkAuth();
  }, [setAthlete, setLastRefreshed]);

  useEffect(() => {
    // Authentication error useEffect. Called once on component mount.
    const errorParam = searchParams.get("error");
    if (errorParam) {
      messageApi.open({ type: "error", content: "Authentication Cancelled" });
    }
  }, [searchParams, messageApi]);

  useEffect(() => {
    // Activities preparation useEffect. Called once on activities load.
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

  return (
    <>
      {contextHolder}

      <div className={styles.page} ref={mapContainer} />

      {(mapLoading ||
        isAuthenticated === false ||
        athleteLoading ||
        activitiesLoading) && <div className={styles.overlay} />}

      {isAuthenticated === false && (
        <Card className={styles.card}>
          <div className={styles.cardContent}>
            <div>Click below to connect your Strava account.</div>
            <Button
              className={styles.loginButton}
              onClick={() => {
                window.location.href = "/api/auth/strava";
              }}
            >
              Connect with Strava
              <img src="/strava.svg" alt="strava" height={16} />
            </Button>
          </div>
        </Card>
      )}

      {isAuthenticated === true && (athleteLoading || activitiesLoading) && (
        <Card className={styles.card}>
          <div className={styles.cardContent}>
            <Spin indicator={<LoadingOutlined spin />} size="large" />
            <div>Getting activities from Strava...</div>
          </div>
        </Card>
      )}

      {isAuthenticated === true && !athleteLoading && !activitiesLoading && (
        <>
          <Tooltip
            placement="right"
            title={`toggle to ${themeConfig[theme].toggle} theme`}
            arrow={false}
          >
            <Switch
              className={styles.themeButton}
              checkedChildren={<SunFilled />}
              unCheckedChildren={<MoonFilled />}
              checked={theme === "light"}
              onChange={toggleTheme}
            />
          </Tooltip>

          <Tooltip placement="left" title="settings" arrow={false}>
            <Button
              className={styles.settingsButton}
              type="primary"
              color="primary"
              variant="solid"
              size="large"
              icon={<SettingFilled />}
              onClick={() => setSettingsOpen(true)}
            />
          </Tooltip>

          <SettingsDrawer
            open={settingsOpen}
            setOpen={setSettingsOpen}
            fitBoundsOfActivities={fitBoundsOfActivities}
          />

          <SelectedActivityCard
            fitBoundsOfSelectedActivity={fitBoundsOfSelectedActivity}
          />
        </>
      )}
    </>
  );
}
