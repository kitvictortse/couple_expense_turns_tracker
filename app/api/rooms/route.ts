import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateRoomId, normalizeRoomId } from "@/lib/room";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = normalizeRoomId(searchParams.get("roomId") ?? "");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required." }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  return NextResponse.json({ members: room.members });
}

type CreateJoinBody = {
  mode?: "create" | "join";
  roomId?: string;
  userName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateJoinBody;
    const userName = (body.userName ?? "").trim();

    if (!userName) {
      return NextResponse.json(
        { error: "Display name is required." },
        { status: 400 },
      );
    }

    if (body.mode === "join") {
      const normalized = normalizeRoomId(body.roomId ?? "");

      if (!normalized) {
        return NextResponse.json(
          { error: "Room ID is required." },
          { status: 400 },
        );
      }

      const room = await prisma.room.findUnique({ where: { id: normalized } });

      if (!room) {
        return NextResponse.json({ error: "Room not found." }, { status: 404 });
      }

      let members = room.members ?? [];

      if (!members.includes(userName) && members.length >= 2) {
        return NextResponse.json(
          {
            error:
              "This room already has two members. Join as an existing member name or create a new room.",
            code: "ROOM_FULL",
            members,
          },
          { status: 409 },
        );
      }

      if (!members.includes(userName)) {
        const updated = await prisma.room.update({
          where: { id: normalized },
          data: { members: { push: userName } },
        });
        members = updated.members ?? [];
      }

      return NextResponse.json({
        roomId: room.id,
        members,
        createdAt: room.createdAt,
      });
    }

    let roomId = generateRoomId();
    let existing = await prisma.room.findUnique({ where: { id: roomId } });

    // Very low collision chance, but this keeps room creation deterministic.
    while (existing) {
      roomId = generateRoomId();
      existing = await prisma.room.findUnique({ where: { id: roomId } });
    }

    const room = await prisma.room.create({
      data: {
        id: roomId,
        members: [userName],
      },
    });

    return NextResponse.json(
      { roomId: room.id, members: room.members, createdAt: room.createdAt },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid request body.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
