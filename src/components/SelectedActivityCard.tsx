"use client";
import React from "react";
import dayjs from "dayjs";
import classNames from "classnames";

import "@ant-design/v5-patch-for-react-19";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  EyeFilled,
} from "@ant-design/icons";
import { Button, Card } from "antd";

import { useActivityStore } from "@/store";
import { convertSpeedToPace, formatSeconds, isMobile } from "@/utils";

import styles from "./SelectedActivityCard.module.css";

export default function SelectedActivityCard({
  fitBoundsOfSelectedActivity,
  getPreviousActivityId,
  getNextActivityId,
}: {
  fitBoundsOfSelectedActivity(activityId?: number): void;
  getPreviousActivityId(): number | null;
  getNextActivityId(): number | null;
}) {
  const { selectedActivityId, activities, filteredActivityIds } =
    useActivityStore();

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
        <div
          className={classNames(styles.title, {
            [styles.titleMobile]: isMobile(),
          })}
        >
          {selectedActivity.name}
        </div>
        {location && (
          <div
            className={classNames(styles.subtitle, {
              [styles.subtitleMobile]: isMobile(),
            })}
          >
            {location}
          </div>
        )}
        <div className={styles.subtitle}>{date}</div>
      </div>
      <Button
        type="primary"
        color="default"
        variant="outlined"
        size="middle"
        icon={<EyeFilled />}
        onClick={() => fitBoundsOfSelectedActivity()}
      />
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
        {selectedActivity.type}
        <br />
        <strong>Distance: </strong>
        {+(selectedActivity.distance / 1000).toFixed(2)}km
        <br />
        <strong>Moving Time: </strong>
        {formatSeconds(selectedActivity.movingTime)}
        <br />
        <strong>Average Pace: </strong>
        {convertSpeedToPace(selectedActivity.averageSpeed)}
        <br />
        <strong>Elevation Gain: </strong>
        {Math.floor(selectedActivity.totalElevationGain)}m
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
