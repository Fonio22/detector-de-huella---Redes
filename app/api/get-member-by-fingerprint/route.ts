import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/config/mysql";

export async function GET(request: NextRequest) {
  try {
    // 1. Leer fingerprintId del querystring
    const fingerprintId = request.nextUrl.searchParams.get("fingerprintId");
    if (!fingerprintId) {
      return NextResponse.json(
        {
          isOK: false,
          code: "missing_fingerprintId",
          message: "Falta el parámetro 'fingerprintId'.",
        },
        { status: 400 }
      );
    }

    // 2. Buscar el miembro con ese fingerprint
    const [rows]: [RowDataPacket[], any] = await pool.query(
      `SELECT id, name, cedula
       FROM \`members\`
       WHERE fingerprint = ?;`,
      [fingerprintId]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        {
          isOK: false,
          code: "not_found",
          message: "No se encontró estudiante con ese fingerprintId.",
        },
        { status: 404 }
      );
    }

    const { id, name, cedula } = (rows as any[])[0];

    // 3. Responder
    return NextResponse.json(
      { isOK: true, student: { id, name, cedula } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en GET /api/students/by-fingerprint:", error);
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
