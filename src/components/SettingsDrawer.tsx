"use client";
import dayjs from "dayjs";

import "@ant-design/v5-patch-for-react-19";
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
import { Label } from "@/types";

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
    activityTypeSettings,
    activityTypeColourSettings,
    highestDistance,
    keywordText,
    lastRefreshed,
    setActivityTypeSettings,
    setActivityTypeColourSettings,
    setMinimumDistance,
    setMaximumDistance,
    setKeywordText,
    setYear,
  } = useStore();

  function logout() {
    window.location.href = "/api/auth/logout";
    localStorage.removeItem("activities");
  }

  const footer = (
    <span className={styles.footer}>
      {lastRefreshed && (
        <span className={styles.lastRefreshed}>
          Last refreshed: {dayjs(lastRefreshed).format("HH:mm ddd D MMM")}
        </span>
      )}
      <Button className={styles.logoutButton} danger onClick={logout}>
        Logout
      </Button>
    </span>
  );

  return (
    <Drawer
      title="Settings"
      onClose={() => setOpen(false)}
      open={open}
      footer={footer}
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
  );
}
