import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2";
import pool from "../../../config/mysql";

export async function POST(request: NextRequest) {
  try {
    // 1. Leer body como JSON
    const { name, description } = await request.json();

    // 2. Validaciones básicas
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

    // 3. Insertar en la base de datos
    const [result]: [ResultSetHeader, any] = await pool.execute(
      `INSERT INTO \`groups\` (name, description, created_at, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      [name.trim(), description ?? null]
    );

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        {
          isOK: false,
          code: "creation_failed",
          message: "No se pudo crear el grupo.",
        },
        { status: 500 }
      );
    }

    const groupId = result.insertId;

    // 4. Recuperar el registro recién creado (opcional)
    const [rows]: [any[], any] = await pool.execute(
      `SELECT id, name, description, created_at, updated_at
       FROM \`groups\`
       WHERE id = ?;`,
      [groupId]
    );

    const newGroup = rows[0];

    // 5. Respuesta exitosa
    return NextResponse.json(
      { isOK: true, message: "Grupo creado correctamente.", group: newGroup },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en /api/groups:", error);
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
