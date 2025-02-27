"use client";
import React from "react";
import dayjs from "dayjs";
import classNames from "classnames";

import "@ant-design/v5-patch-for-react-19";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CaretRightOutlined,
  EyeFilled,
} from "@ant-design/icons";
import { Button, Card } from "antd";

import { useActivityStore, useUIStore } from "@/store";
import {
  formatActivityType,
  formatDistance,
  formatSpeed,
  formatSeconds,
  formatElevation,
  isMobile,
} from "@/utils";

import styles from "./SelectedActivityCard.module.css";

export default function SelectedActivityCard({
  fitBoundsOfSelectedActivity,
  getPreviousActivityId,
  getNextActivityId,
  animateSelectedActivity,
}: {
  fitBoundsOfSelectedActivity(activityId?: number): void;
  getPreviousActivityId(): number | null;
  getNextActivityId(): number | null;
  animateSelectedActivity(): void;
}) {
  const { selectedActivityId, activities, filteredActivityIds } =
    useActivityStore();
  const { unitSystem } = useUIStore();

  if (!selectedActivityId) return null;

  const selectedActivity = activities.find(
    (activity) => activity.id === selectedActivityId
  );

  if (!selectedActivity) return null;

  const date = dayjs(selectedActivity.startDate).format("dddd D MMMM YYYY");
  const location = selectedActivity.location?.address;

  const header = (
    <div className={styles.header}>
      <div>
        <div className={styles.title}>{selectedActivity.name}</div>
        {location && <div className={styles.subtitle}>{location}</div>}
        <div className={styles.subtitle}>{date}</div>
      </div>
    </div>
  );

  return (
    <div
      className={classNames({
        [styles.container]: !isMobile(),
        [styles.containerMobile]: isMobile(),
      })}
    >
      <Card
        className={classNames({
          [styles.activityCard]: !isMobile(),
          [styles.activityCardMobile]: isMobile(),
        })}
        title={header}
      >
        <strong>Type: </strong>
        {formatActivityType(selectedActivity.type)}
        <br />
        <strong>Distance: </strong>
        {formatDistance(selectedActivity.distance, unitSystem)}
        <br />
        <strong>Moving Time: </strong>
        {formatSeconds(selectedActivity.movingTime)}
        <br />
        <strong>Average Pace: </strong>
        {formatSpeed(
          selectedActivity.averageSpeed,
          selectedActivity.type,
          unitSystem
        )}
        <br />
        {selectedActivity.totalElevationGain && (
          <>
            <strong>Elevation Gain: </strong>
            {formatElevation(selectedActivity.totalElevationGain, unitSystem)}
          </>
        )}
        <div className={styles.headerButtons}>
          <Button
            type="primary"
            color="default"
            variant="outlined"
            size="middle"
            icon={<CaretRightOutlined />}
            onClick={() => {
              fitBoundsOfSelectedActivity();
              animateSelectedActivity();
            }}
          />
          <Button
            type="primary"
            color="default"
            variant="outlined"
            size="middle"
            icon={<EyeFilled />}
            onClick={() => fitBoundsOfSelectedActivity()}
          />
        </div>
        <div className={styles.activityButtons}>
          <Button
            type="primary"
            color="default"
            variant="outlined"
            size="middle"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              const previousActivityId = getPreviousActivityId();
              if (previousActivityId) {
                fitBoundsOfSelectedActivity(previousActivityId);
              }
            }}
            disabled={filteredActivityIds[0] === selectedActivityId}
          />
          <Button
            type="primary"
            color="default"
            variant="outlined"
            size="middle"
            icon={<ArrowRightOutlined />}
            onClick={() => {
              const nextActivityId = getNextActivityId();
              if (nextActivityId) {
                fitBoundsOfSelectedActivity(nextActivityId);
              }
            }}
            disabled={
              filteredActivityIds[filteredActivityIds.length - 1] ===
              selectedActivityId
            }
          />
        </div>
      </Card>
    </div>
  );
}
