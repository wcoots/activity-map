"use client";
import dayjs from "dayjs";

import "@ant-design/v5-patch-for-react-19";
import { GithubOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  ColorPicker as ColourPicker,
  DatePicker,
  Divider,
  Drawer,
  Input,
  Select,
  Slider,
} from "antd";

import { activitiesConfig } from "@/configs";
import {
  useActivityStore,
  useAuthStore,
  useMapStore,
  useUIStore,
} from "@/store";
import { Label } from "@/types";

import styles from "./SettingsDrawer.module.css";

export default function SettingsDrawer({
  fitBoundsOfActivities,
}: {
  fitBoundsOfActivities: () => void;
}) {
  const { athlete } = useAuthStore();
  const {
    activityTypeSettings,
    highestDistance,
    keywordText,
    lastRefreshed,
    countries,
    setActivityTypeSettings,
    setMinimumDistance,
    setMaximumDistance,
    setKeywordText,
    setYear,
    setSelectedCountry,
  } = useActivityStore();
  const { theme } = useMapStore();
  const { settingsOpen, setSettingsOpen } = useUIStore();

  function logout() {
    window.location.href = "/api/auth/logout";
  }

  const header = athlete ? (
    <span className={styles.header}>
      {`Welcome, ${athlete.firstName} ${athlete.lastName}`}
      <a
        className={styles.image}
        href={`https://www.strava.com/athletes/${athlete.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={athlete.imageUrl} alt="Profile" height={20} />
      </a>
    </span>
  ) : (
    <span className={styles.header}>Welcome</span>
  );

  const footer = (
    <span className={styles.footer}>
      {lastRefreshed && (
        <span className={styles.lastRefreshed}>
          Last refreshed: {dayjs(lastRefreshed).format("HH:mm ddd D MMM")}
        </span>
      )}
      <Button
        className={styles.githubButton}
        href={process.env.GITHUB_URL}
        target="_blank"
      >
        <GithubOutlined />
      </Button>
      <Button className={styles.logoutButton} danger onClick={logout}>
        Logout
      </Button>
    </span>
  );

  return (
    <Drawer
      title={header}
      footer={footer}
      open={settingsOpen}
      onClose={() => {
        setSettingsOpen(false);
        fitBoundsOfActivities();
      }}
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
              value={
                activitiesConfig.find(
                  (config) => config.label === (label as Label)
                )?.colour[theme]
              }
              open={false}
              size="small"
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

      <h3>Country</h3>
      <Select
        mode="multiple"
        maxCount={1}
        style={{ width: "100%" }}
        onChange={([val]) => setSelectedCountry(val ?? null)}
        placeholder="Please select"
        options={countries.map((country) => ({
          label: country,
          value: country,
        }))}
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

      <Button
        onClick={() => {
          fitBoundsOfActivities();
          setSettingsOpen(false);
        }}
      >
        Fit Bounds
      </Button>
    </Drawer>
  );
}
