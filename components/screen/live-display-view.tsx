"use client";

import type {
  Json,
  PhotoPayload,
  PoseBattlePayload,
  ScreenViewType,
  TriviaPayload,
} from "@/types/database";
import { IdleStage } from "@/components/screen/idle-stage";
import { LiveTriviaView } from "@/components/screen/live-trivia-view";
import { PhotoReveal } from "@/components/screen/photo-reveal";
import { PoseBattleView } from "@/components/screen/pose-battle-view";

export type LiveDisplayVariant = "tv" | "mirror";

type LiveDisplayViewProps = {
  view: ScreenViewType;
  payload: Json;
  variant: LiveDisplayVariant;
  eventName?: string;
};

function isPhotoPayload(payload: Json): payload is PhotoPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    !Array.isArray(payload) &&
    typeof (payload as PhotoPayload).photo_url === "string" &&
    typeof (payload as PhotoPayload).table_number === "number"
  );
}

function isTriviaPayload(payload: Json): payload is TriviaPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    !Array.isArray(payload) &&
    typeof (payload as TriviaPayload).question_id === "string" &&
    typeof (payload as TriviaPayload).question === "string" &&
    typeof (payload as TriviaPayload).started_at === "string" &&
    Array.isArray((payload as TriviaPayload).options)
  );
}

function isPosePayload(payload: Json): payload is PoseBattlePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    !Array.isArray(payload) &&
    typeof (payload as PoseBattlePayload).battle_id === "string" &&
    typeof (payload as PoseBattlePayload).photo_a_url === "string" &&
    typeof (payload as PoseBattlePayload).photo_b_url === "string" &&
    typeof (payload as PoseBattlePayload).started_at === "string"
  );
}

export function LiveDisplayView({
  view,
  payload,
  variant,
  eventName,
}: LiveDisplayViewProps) {
  if (view === "PHOTO" && isPhotoPayload(payload)) {
    const revealKey = payload.photo_id ?? payload.photo_url;
    return (
      <PhotoReveal payload={payload} variant={variant} revealKey={revealKey} />
    );
  }

  if (view === "TRIVIA" && isTriviaPayload(payload)) {
    return <LiveTriviaView payload={payload} variant={variant} />;
  }

  if (view === "POSE_BATTLE" && isPosePayload(payload)) {
    return <PoseBattleView payload={payload} variant={variant} />;
  }

  return <IdleStage variant={variant} eventName={eventName} />;
}
