"use client";
import dayjs from "dayjs";

import "@ant-design/v5-patch-for-react-19";
import { EyeFilled } from "@ant-design/icons";
import { Button, Card } from "antd";

import { useStore } from "@/store";
import { convertSpeedToPace, formatSeconds, isMobile } from "@/utils";

import styles from "./SelectedActivityCard.module.css";
import classNames from "classnames";

export default function SelectedActivityCard({
  fitBoundsOfSelectedActivity,
}: {
  fitBoundsOfSelectedActivity(): void;
}) {
  const { selectedActivityId, activities } = useStore();
  if (!selectedActivityId) return null;
  const selectedActivity = activities.find(
    (activity) => activity.id === selectedActivityId
  );
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
    <Card
      className={classNames({
        [styles.activityCard]: !isMobile(),
        [styles.activityCardMobile]: isMobile(),
      })}
      title={header}
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
