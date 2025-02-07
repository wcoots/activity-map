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
  Slider,
} from "antd";

import { useStore } from "@/store";
import { Label, LocalStorageKey } from "@/types";

import styles from "./SettingsDrawer.module.css";

export default function SettingsDrawer({
  open,
  setOpen,
  fitBoundsOfActivities,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  fitBoundsOfActivities: () => void;
}) {
  const {
    theme,
    athlete,
    activityTypeSettings,
    activityTypeColourSettings,
    highestDistance,
    keywordText,
    lastRefreshed,
    setActivityTypeSettings,
    setMinimumDistance,
    setMaximumDistance,
    setKeywordText,
    setYear,
  } = useStore();

  function logout() {
    window.location.href = "/api/auth/logout";
    localStorage.removeItem(LocalStorageKey.Athlete);
    localStorage.removeItem(LocalStorageKey.Activities);
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
      open={open}
      onClose={() => setOpen(false)}
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
              value={activityTypeColourSettings[label as Label][theme]}
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
  );
}
