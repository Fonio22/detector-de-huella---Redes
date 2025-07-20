import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/config/mysql";

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear JSON del body
    const { groupId, memberId, assistanceDate } = await request.json();

    // 2. Validaciones básicas
    if (
      groupId === undefined ||
      typeof groupId !== "number" ||
      !Number.isInteger(groupId)
    ) {
      return NextResponse.json(
        {
          isOK: false,
          code: "invalid_groupId",
          message: "El campo 'groupId' debe ser un entero válido.",
        },
        { status: 400 }
      );
    }
    if (
      memberId === undefined ||
      typeof memberId !== "number" ||
      !Number.isInteger(memberId)
    ) {
      return NextResponse.json(
        {
          isOK: false,
          code: "invalid_memberId",
          message: "El campo 'memberId' debe ser un entero válido.",
        },
        { status: 400 }
      );
    }
    if (
      !assistanceDate ||
      typeof assistanceDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(assistanceDate)
    ) {
      return NextResponse.json(
        {
          isOK: false,
          code: "invalid_date",
          message:
            "El campo 'assistanceDate' debe estar en formato YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    // 3. Verificar que el grupo exista
    const [groupRows]: [RowDataPacket[], any] = await pool.execute(
      `SELECT id FROM \`groups\` WHERE id = ?;`,
      [groupId]
    );
    if (groupRows.length === 0) {
      return NextResponse.json(
        {
          isOK: false,
          code: "group_not_found",
          message: "El grupo especificado no existe.",
        },
        { status: 404 }
      );
    }

    // 4. Verificar que el miembro exista
    const [memberRows]: [RowDataPacket[], any] = await pool.execute(
      `SELECT id FROM \`members\` WHERE id = ?;`,
      [memberId]
    );
    if (memberRows.length === 0) {
      return NextResponse.json(
        {
          isOK: false,
          code: "member_not_found",
          message: "El miembro especificado no existe.",
        },
        { status: 404 }
      );
    }

    // 5. Evitar duplicados para la misma fecha
    const [dupRows]: [RowDataPacket[], any] = await pool.execute(
      `SELECT id FROM \`assistance\`
       WHERE group_id = ? AND member_id = ? AND assistance_date = ?;`,
      [groupId, memberId, assistanceDate]
    );
    if (dupRows.length > 0) {
      return NextResponse.json(
        {
          isOK: false,
          code: "already_registered",
          message:
            "La asistencia ya fue registrada para este miembro en esta fecha.",
        },
        { status: 409 }
      );
    }

    // 6. Insertar en la tabla `assistance`
    const [result]: [ResultSetHeader, any] = await pool.execute(
      `INSERT INTO \`assistance\`
         (group_id, member_id, assistance_date, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP);`,
      [groupId, memberId, assistanceDate]
    );
    if (result.affectedRows !== 1) {
      return NextResponse.json(
        {
          isOK: false,
          code: "creation_failed",
          message: "No se pudo registrar la asistencia.",
        },
        { status: 500 }
      );
    }

    const assistanceId = result.insertId;

    // 7. Responder con el registro creado
    return NextResponse.json(
      {
        isOK: true,
        message: "Asistencia registrada correctamente.",
        record: {
          id: assistanceId,
          groupId,
          memberId,
          assistanceDate,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en POST /api/assistance:", error);
    return NextResponse.json(
      {
        isOK: false,
        code: "internal_error",
        message: "Error interno del servidor.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
