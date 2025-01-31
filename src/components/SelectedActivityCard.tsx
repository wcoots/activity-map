"use client";
import dayjs from "dayjs";

import "@ant-design/v5-patch-for-react-19";
import { EyeFilled } from "@ant-design/icons";
import { Button, Card } from "antd";

import { useStore } from "@/store";
import { convertSpeedToPace, formatSeconds } from "@/utils";

import styles from "./SelectedActivityCard.module.css";

export default function SelectedActivityCard({
  fitBoundsOfSelectedActivity,
}: {
  fitBoundsOfSelectedActivity(): void;
}) {
  const { selectedActivity } = useStore();
  if (!selectedActivity) return null;

  const header = (
    <div className={styles.header}>
      <div>
        {selectedActivity.name}
        <div className={styles.date}>
          {dayjs(selectedActivity.startDate).format("ddd D MMM YYYY")}
        </div>
      </div>
      <Button
        type="primary"
        color="default"
        variant="outlined"
        size="middle"
        icon={<EyeFilled />}
        onClick={fitBoundsOfSelectedActivity}
      />
    </div>
  );

  return (
    <Card className={styles.activityCard} title={header}>
      <strong>Type:</strong> {selectedActivity.type}
      <br />
      <strong>Distance:</strong>{" "}
      {+(selectedActivity.distance / 1000).toFixed(2)}km
      <br />
      <strong>Moving Time:</strong> {formatSeconds(selectedActivity.movingTime)}
      <br />
      <strong>Average Pace:</strong>{" "}
      {convertSpeedToPace(selectedActivity.averageSpeed)}
      <br />
      <strong>Elevation Gain:</strong>{" "}
      {Math.floor(selectedActivity.totalElevationGain)}m
    </Card>
  );
}
