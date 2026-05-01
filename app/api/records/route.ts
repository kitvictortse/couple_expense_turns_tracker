import { NextResponse } from "next/server";

import { CATEGORIES, type RangeValue } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { normalizeRoomId } from "@/lib/room";

const VALID_RANGES: RangeValue[] = ["all", "1d", "7d", "30d"];
const MAX_CUSTOM_RANGE_DAYS = 366;
const RECORDABLE_CATEGORIES = [...CATEGORIES, "Baby", "Parking"] as const;

function getSinceDate(range: RangeValue): Date | undefined {
  if (range === "all") {
    return undefined;
  }

  const now = Date.now();
  const days = range === "1d" ? 1 : range === "7d" ? 7 : 30;
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = normalizeRoomId(searchParams.get("roomId") ?? "");
  const rangeInput = (searchParams.get("range") ?? "7d") as RangeValue;
  const range = VALID_RANGES.includes(rangeInput) ? rangeInput : "7d";
  const startDateInput = searchParams.get("startDate") ?? "";
  const endDateInput = searchParams.get("endDate") ?? "";

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required." }, { status: 400 });
  }

  let sinceDate = getSinceDate(range);
  let untilDate: Date | undefined;

  if (startDateInput || endDateInput) {
    if (!startDateInput || !endDateInput) {
      return NextResponse.json(
        { error: "startDate and endDate are both required." },
        { status: 400 },
      );
    }

    const customStart = new Date(`${startDateInput}T00:00:00.000Z`);
    const customEnd = new Date(`${endDateInput}T23:59:59.999Z`);

    if (
      Number.isNaN(customStart.getTime()) ||
      Number.isNaN(customEnd.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid custom date range." },
        { status: 400 },
      );
    }

    if (customStart > customEnd) {
      return NextResponse.json(
        { error: "startDate must be on or before endDate." },
        { status: 400 },
      );
    }

    const diffDays =
      (customEnd.getTime() - customStart.getTime()) / (24 * 60 * 60 * 1000);
    if (diffDays > MAX_CUSTOM_RANGE_DAYS) {
      return NextResponse.json(
        { error: "Custom range cannot be longer than 1 year." },
        { status: 400 },
      );
    }

    sinceDate = customStart;
    untilDate = customEnd;
  }

  try {
    const records = await prisma.record.findMany({
      where: {
        roomId,
        ...(sinceDate || untilDate
          ? {
              createdAt: {
                ...(sinceDate ? { gte: sinceDate } : {}),
                ...(untilDate ? { lte: untilDate } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: "Failed to fetch records." }, { status: 500 });
  }
}

type PostBody = {
  roomId?: string;
  paidBy?: string;
  category?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PostBody;
    const roomId = normalizeRoomId(body.roomId ?? "");
    const paidBy = (body.paidBy ?? "").trim();
    const category = (body.category ?? "").trim();

    if (!roomId || !paidBy || !category) {
      return NextResponse.json(
        { error: "roomId, paidBy, and category are required." },
        { status: 400 },
      );
    }

    if (
      !RECORDABLE_CATEGORIES.includes(
        category as (typeof RECORDABLE_CATEGORIES)[number],
      )
    ) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    if (!room.members.includes(paidBy)) {
      return NextResponse.json(
        { error: "Payer is not a member of this room." },
        { status: 400 },
      );
    }

    const record = await prisma.record.create({
      data: {
        roomId,
        paidBy,
        category,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";

  if (!id) {
    return NextResponse.json(
      { error: "Record id is required." },
      { status: 400 },
    );
  }

  try {
    await prisma.record.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }
}
