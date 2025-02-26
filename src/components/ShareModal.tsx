"use client";
import React, { useState } from "react";

import "@ant-design/v5-patch-for-react-19";
import { EyeFilled, EyeInvisibleFilled } from "@ant-design/icons";
import { Button, Modal } from "antd";

import { useAuthStore, useUIStore } from "@/store";

export default function ShareModal() {
  const { athlete, setAthlete } = useAuthStore();
  const { shareModalOpen, setShareModalOpen } = useUIStore();

  const [confirmLoading, setConfirmLoading] = useState(false);

  if (!athlete) return null;

  async function setPublicity(publicity: boolean) {
    try {
      if (!athlete) return;

      setConfirmLoading(true);

      const response = await fetch("/api/publicity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId: athlete.id, publicity }),
      });
      if (!response.ok) return;

      const result = await response.json();

      if (result?.success) setAthlete({ ...athlete, public: publicity });
    } catch (err) {
      console.error("Error setting publicity:", err);
    } finally {
      setConfirmLoading(false);
    }
  }

  function close() {
    setShareModalOpen(false);
  }

  const footer = (
    <>
      <Button onClick={close}>Cancel</Button>
      <Button
        variant="outlined"
        color={athlete.public ? "lime" : "cyan"}
        icon={athlete.public ? <EyeInvisibleFilled /> : <EyeFilled />}
        onClick={() => setPublicity(!athlete.public)}
        loading={confirmLoading}
      >
        {athlete.public ? "Hide" : "Share"}
      </Button>
    </>
  );

  return (
    <Modal
      title="Activity Sharing"
      open={shareModalOpen}
      footer={footer}
      onCancel={close}
    >
      <br />
      {!athlete.public && (
        <>
          <p>
            Your activities are currently set to <b>private.</b>
          </p>
          <p>
            Sharing your activities will allow anyone with your Strava ID to see
            your activity map, meaning all of your activities will be publically
            visible.
          </p>
          <p>
            To make your activity map public, click <b>Share</b>.
          </p>
        </>
      )}
      {athlete.public && (
        <>
          <p>
            Your activities are currently set to <b>public.</b>
          </p>
          <p>You can share your activites with the following link:</p>
          <p>
            <a
              href={`https://activity-map.vercel.app/?user=${athlete.id}`}
              target="_blank"
            >
              https://activity-map.vercel.app/?user={athlete.id}
            </a>
          </p>
          <p>
            To make your activity map private, click <b>Hide</b>.
          </p>
        </>
      )}
    </Modal>
  );
}
