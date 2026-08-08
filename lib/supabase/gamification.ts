import { createClient } from "@/lib/supabase/client";
import { updateLiveState } from "@/lib/supabase/queries";
import type {
  Event,
  Json,
  Photo,
  PoseBattle,
  PoseBattlePayload,
  PoseVote,
  TriviaAnswer,
  TriviaPayload,
  TriviaQuestion,
} from "@/types/database";

const TRIVIA_DURATION = 15;
const POSE_DURATION = 15;

export function parseTriviaOptions(options: Json): string[] {
  if (Array.isArray(options)) {
    return options.map((o) => String(o));
  }
  return [];
}

export async function listTriviaQuestions(
  eventId: string,
): Promise<TriviaQuestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trivia_questions")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list trivia questions: ${error.message}`);
  }
  return data ?? [];
}

const DEMO_QUESTIONS: Array<{
  question: string;
  options: string[];
  correct_option: number;
}> = [
  {
    question: "¿Dónde se conocieron los festejados?",
    options: ["Universidad", "Trabajo", "Una boda", "Apps de citas"],
    correct_option: 0,
  },
  {
    question: "¿Cuál es el postre favorito de la pareja?",
    options: ["Tiramisú", "Cheesecake", "Chocolate", "Fruta"],
    correct_option: 1,
  },
  {
    question: "¿Quién dijo 'sí' primero?",
    options: ["Él", "Ella", "Al mismo tiempo", "El padrino"],
    correct_option: 2,
  },
];

export async function ensureDemoTriviaQuestions(
  eventId: string,
): Promise<TriviaQuestion[]> {
  const existing = await listTriviaQuestions(eventId);
  if (existing.length > 0) return existing;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("trivia_questions")
    .insert(
      DEMO_QUESTIONS.map((q) => ({
        event_id: eventId,
        question: q.question,
        options: q.options,
        correct_option: q.correct_option,
        is_active: false,
      })),
    )
    .select("*");

  if (error) {
    throw new Error(`Failed to seed trivia: ${error.message}`);
  }
  return data ?? [];
}

export async function launchTrivia(
  eventId: string,
  questionId: string,
): Promise<TriviaPayload> {
  const supabase = createClient();

  await supabase
    .from("trivia_questions")
    .update({ is_active: false })
    .eq("event_id", eventId);

  const { data: question, error } = await supabase
    .from("trivia_questions")
    .update({ is_active: true })
    .eq("id", questionId)
    .select("*")
    .single();

  if (error || !question) {
    throw new Error(error?.message ?? "Question not found");
  }

  const payload: TriviaPayload = {
    question_id: question.id,
    question: question.question,
    options: parseTriviaOptions(question.options),
    correct_option: question.correct_option,
    started_at: new Date().toISOString(),
    duration_sec: TRIVIA_DURATION,
    phase: "answering",
  };

  await updateLiveState(eventId, "TRIVIA", payload as unknown as Json);
  return payload;
}

export async function submitTriviaAnswer(
  questionId: string,
  tableNumber: number,
  selectedOption: number,
  correctOption: number,
): Promise<TriviaAnswer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trivia_answers")
    .insert({
      question_id: questionId,
      table_number: tableNumber,
      selected_option: selectedOption,
      is_correct: selectedOption === correctOption,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to submit answer: ${error.message}`);
  }
  return data;
}

export async function listTriviaAnswers(
  questionId: string,
): Promise<TriviaAnswer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trivia_answers")
    .select("*")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list answers: ${error.message}`);
  }
  return data ?? [];
}

export async function createAndLaunchPoseBattle(input: {
  eventId: string;
  tableA: number;
  tableB: number;
  photoAUrl: string;
  photoBUrl: string;
}): Promise<PoseBattlePayload> {
  const supabase = createClient();

  await supabase
    .from("pose_battles")
    .update({ is_active: false })
    .eq("event_id", input.eventId);

  const { data: battle, error } = await supabase
    .from("pose_battles")
    .insert({
      event_id: input.eventId,
      table_a: input.tableA,
      table_b: input.tableB,
      photo_a_url: input.photoAUrl,
      photo_b_url: input.photoBUrl,
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !battle) {
    throw new Error(error?.message ?? "Failed to create pose battle");
  }

  const payload: PoseBattlePayload = {
    battle_id: battle.id,
    table_a: battle.table_a,
    table_b: battle.table_b,
    photo_a_url: battle.photo_a_url,
    photo_b_url: battle.photo_b_url,
    started_at: new Date().toISOString(),
    duration_sec: POSE_DURATION,
  };

  await updateLiveState(input.eventId, "POSE_BATTLE", payload as unknown as Json);
  return payload;
}

export async function submitPoseVote(
  battleId: string,
  votedTable: number,
): Promise<PoseVote> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pose_votes")
    .insert({
      battle_id: battleId,
      voted_table: votedTable,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to submit vote: ${error.message}`);
  }
  return data;
}

export async function listPoseVotes(battleId: string): Promise<PoseVote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pose_votes")
    .select("*")
    .eq("battle_id", battleId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list votes: ${error.message}`);
  }
  return data ?? [];
}

export async function getApprovedPhotos(eventId: string): Promise<Photo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch approved photos: ${error.message}`);
  }
  return data ?? [];
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }
  return data;
}

export type TableScore = { table_number: number; score: number };

export async function getTriviaTableLeaders(
  eventId: string,
): Promise<TableScore[]> {
  const questions = await listTriviaQuestions(eventId);
  if (questions.length === 0) return [];

  const supabase = createClient();
  const scores = new Map<number, number>();

  for (const q of questions) {
    const { data } = await supabase
      .from("trivia_answers")
      .select("*")
      .eq("question_id", q.id)
      .eq("is_correct", true);

    for (const a of data ?? []) {
      scores.set(a.table_number, (scores.get(a.table_number) ?? 0) + 1);
    }
  }

  return Array.from(scores.entries())
    .map(([table_number, score]) => ({ table_number, score }))
    .sort((a, b) => b.score - a.score);
}

export async function getMostPhotogenicTable(
  eventId: string,
): Promise<TableScore | null> {
  const photos = await getApprovedPhotos(eventId);
  const counts = new Map<number, number>();
  for (const p of photos) {
    counts.set(p.table_number, (counts.get(p.table_number) ?? 0) + 1);
  }
  const ranked = Array.from(counts.entries())
    .map(([table_number, score]) => ({ table_number, score }))
    .sort((a, b) => b.score - a.score);
  return ranked[0] ?? null;
}

export async function getClosestPoseBattle(
  eventId: string,
): Promise<(PoseBattle & { votes_a: number; votes_b: number }) | null> {
  const supabase = createClient();
  const { data: battles } = await supabase
    .from("pose_battles")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (!battles?.length) return null;

  let closest: (PoseBattle & { votes_a: number; votes_b: number }) | null =
    null;
  let minDiff = Number.POSITIVE_INFINITY;

  for (const b of battles) {
    const votes = await listPoseVotes(b.id);
    const votes_a = votes.filter((v) => v.voted_table === b.table_a).length;
    const votes_b = votes.filter((v) => v.voted_table === b.table_b).length;
    const diff = Math.abs(votes_a - votes_b);
    if (diff < minDiff) {
      minDiff = diff;
      closest = { ...b, votes_a, votes_b };
    }
  }

  return closest;
}

export type TriviaLeaderRow = {
  table_number: number;
  correct: number;
  firstAt: string;
};

export function buildTriviaPodium(answers: TriviaAnswer[]): TriviaLeaderRow[] {
  const byTable = new Map<number, TriviaLeaderRow>();

  for (const a of answers) {
    if (!a.is_correct) continue;
    const existing = byTable.get(a.table_number);
    if (!existing) {
      byTable.set(a.table_number, {
        table_number: a.table_number,
        correct: 1,
        firstAt: a.created_at,
      });
    } else {
      existing.correct += 1;
      if (a.created_at < existing.firstAt) existing.firstAt = a.created_at;
    }
  }

  return Array.from(byTable.values()).sort((a, b) => {
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.firstAt.localeCompare(b.firstAt);
  });
}
