import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/config/mysql";

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear JSON del body
    const { name, cedula, fingerprint, groupId } = await request.json();
    const groupID = Number(groupId); // Asegurarse de que groupId es un número
    console.log("Received data:", { name, cedula, fingerprint, groupId });

    // 2. Validaciones
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          isOK: false,
          code: "missing_name",
          message: "El campo 'name' es obligatorio.",
        },
        { status: 400 }
      );
    }
    if (!cedula || typeof cedula !== "string") {
      return NextResponse.json(
        {
          isOK: false,
          code: "missing_cedula",
          message: "El campo 'cedula' es obligatorio.",
        },
        { status: 400 }
      );
    }
    if (
      fingerprint === undefined ||
      typeof fingerprint !== "number" ||
      !Number.isInteger(fingerprint)
    ) {
      return NextResponse.json(
        {
          isOK: false,
          code: "invalid_fingerprint",
          message: "El campo 'fingerprint' debe ser un entero válido.",
        },
        { status: 400 }
      );
    }
    if (
      groupID === undefined ||
      typeof groupID !== "number" ||
      !Number.isInteger(groupID)
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

    // 3. Verificar que el grupo existe
    const [groupRows]: [RowDataPacket[], any] = await pool.execute(
      `SELECT id FROM \`groups\` WHERE id = ?;`,
      [groupId]
    );
    if ((groupRows as RowDataPacket[]).length === 0) {
      return NextResponse.json(
        {
          isOK: false,
          code: "group_not_found",
          message: "El grupo especificado no existe.",
        },
        { status: 404 }
      );
    }

    // 4. Insertar en la tabla `members`
    const [memberResult]: [ResultSetHeader, any] = await pool.execute(
      `INSERT INTO \`members\` (name, cedula, fingerprint, created_at, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      [name.trim(), cedula.trim(), fingerprint]
    );

    if (memberResult.affectedRows !== 1) {
      return NextResponse.json(
        {
          isOK: false,
          code: "creation_failed",
          message: "No se pudo crear el estudiante.",
        },
        { status: 500 }
      );
    }
    const memberId = memberResult.insertId;

    // 5. Insertar en `group_members`
    const [gmResult]: [ResultSetHeader, any] = await pool.execute(
      `INSERT INTO \`group_members\` (group_id, member_id, joined_at)
       VALUES (?, ?, CURRENT_TIMESTAMP);`,
      [groupID, memberId]
    );
    if (gmResult.affectedRows !== 1) {
      return NextResponse.json(
        {
          isOK: false,
          code: "membership_failed",
          message: "Error al asignar el estudiante al grupo.",
        },
        { status: 500 }
      );
    }

    // 6. Recuperar el nuevo estudiante
    const [rows]: [RowDataPacket[], any] = await pool.execute(
      `SELECT id, name, cedula, fingerprint, created_at, updated_at
       FROM \`members\`
       WHERE id = ?;`,
      [memberId]
    );
    const newStudent = (rows as RowDataPacket[])[0];

    // 7. Responder con el estudiante creado y su membership
    return NextResponse.json(
      {
        isOK: true,
        message: "Estudiante creado y asignado al grupo correctamente.",
        student: newStudent,
        groupId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en /api/students:", error);
    return NextResponse.json(
      {
        isOK: false,
        code: "internal_error",
        message: "Error interno del servidor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
