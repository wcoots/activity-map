"use client";
import dayjs from "dayjs";

import "@ant-design/v5-patch-for-react-19";
import { Card } from "antd";

import { useStore } from "@/store";
import { convertSpeedToPace, formatSeconds } from "@/utils";

import styles from "./SelectedActivityCard.module.css";

export default function SelectedActivityCard() {
  const { selectedActivity } = useStore();
  if (!selectedActivity) return null;

  return (
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
