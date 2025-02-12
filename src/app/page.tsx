"use client";

import "@ant-design/v5-patch-for-react-19";
import {
  LoadingOutlined,
  MoonFilled,
  SettingFilled,
  SunFilled,
} from "@ant-design/icons";
import { Button, Card, Spin, Switch, Tooltip } from "antd";

import { SelectedActivityCard, SettingsDrawer } from "@/components";
import { themeConfig } from "@/configs";
import { useMap, useTheme } from "@/hooks";
import { isMobile } from "@/utils";
import {
  useActivityStore,
  useAuthStore,
  useMapStore,
  useUIStore,
} from "@/store";

import styles from "./page.module.css";

export default function Home() {
  const { toggleTheme } = useTheme();
  const {
    contextHolder,
    mapContainer,
    fitBoundsOfSelectedActivity,
    fitBoundsOfActivities,
  } = useMap();

  const { activitiesLoading } = useActivityStore();
  const { isAuthenticated, athleteLoading } = useAuthStore();
  const { mapLoading, theme } = useMapStore();
  const { setSettingsOpen } = useUIStore();

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
            title={
              isMobile() ? null : `toggle to ${themeConfig[theme].toggle} theme`
            }
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

          <Tooltip
            placement="left"
            title={isMobile() ? null : "settings"}
            arrow={false}
          >
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

          <SettingsDrawer fitBoundsOfActivities={fitBoundsOfActivities} />

          <SelectedActivityCard
            fitBoundsOfSelectedActivity={fitBoundsOfSelectedActivity}
          />
        </>
      )}
    </>
  );
}
