// File: /app/api/group-attendance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/config/mysql";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const date = searchParams.get("date");

    if (!groupId || !date) {
      return NextResponse.json(
        {
          isOK: false,
          code: "missing_params",
          message:
            "Debes indicar groupId y date: /api/group-attendance?groupId=1&date=YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    // 1) Obtengo el nombre del grupo
    const [[groupInfo]] = await pool.query<RowDataPacket[]>(
      `SELECT id, name FROM \`groups\` WHERE id = ?`,
      [groupId]
    );
    if (!groupInfo) {
      return NextResponse.json(
        { isOK: false, code: "not_found", message: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    // 2) Total de estudiantes del grupo
    const [[{ totalStudents }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS totalStudents
         FROM group_members
        WHERE group_id = ?`,
      [groupId]
    );

    // 3) Listado de TODOS los estudiantes con su estado de asistencia
    const [studentsRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        m.id,
        m.name,
        m.cedula,
        -- si hay registro en assistance ese día, marca present=1 y toma la hora
        CASE WHEN a.id IS NULL THEN FALSE ELSE TRUE END AS present,
        TIME(a.created_at) AS time
      FROM group_members gm
      JOIN members m
        ON gm.member_id = m.id
      LEFT JOIN assistance a
        ON a.group_id = gm.group_id
       AND a.member_id = m.id
       AND a.assistance_date = ?
      WHERE gm.group_id = ?
      ORDER BY m.name;
      `,
      [date, groupId]
    );

    // 4) Color fijo o mapeado por id
    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#a4de6c"];
    const color = colors[(parseInt(groupId, 10) - 1) % colors.length];

    // 5) Armo el JSON de respuesta
    const allStudents = studentsRows.map((r) => ({
      id: r.id,
      name: r.name,
      cedula: r.cedula,
      present: Boolean(r.present),
      time: r.present ? r.time : null,
    }));

    return NextResponse.json(
      {
        isOK: true,
        id: groupId, // si prefieres número: parseInt(groupId,10)
        name: groupInfo.name,
        students: totalStudents, // total de miembros
        color,
        allStudents,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/group-attendance error:", error);
    return NextResponse.json(
      {
        isOK: false,
        code: "internal_error",
        message: "Error al obtener asistencia detallada",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
