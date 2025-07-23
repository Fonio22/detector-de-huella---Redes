import { NextRequest } from "next/server";
import pool from "@/config/mysql";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const date = searchParams.get("date");

  if (!groupId || !date) {
    return new Response(
      JSON.stringify({
        isOK: false,
        code: "missing_params",
        message:
          "Debes indicar groupId y date: /api/group-attendance/export?groupId=1&date=YYYY-MM-DD",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 1) Obtener info del grupo
  const [[groupInfo]] = await pool.query<any[]>(
    `SELECT name FROM \`groups\` WHERE id = ?`,
    [groupId]
  );
  if (!groupInfo) {
    return new Response(
      JSON.stringify({
        isOK: false,
        code: "not_found",
        message: "Grupo no encontrado",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2) Total de miembros
  const [[{ totalStudents }]] = await pool.query<any[]>(
    `SELECT COUNT(*) AS totalStudents
       FROM group_members
      WHERE group_id = ?`,
    [groupId]
  );

  // 3) Listado de todos con asistencia
  const [rows] = await pool.query<any[]>(
    `
    SELECT
      m.id,
      m.name,
      m.cedula,
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
    ORDER BY m.name
    `,
    [date, groupId]
  );

  const presentCount = rows.filter((r) => r.present).length;
  const absentCount = totalStudents - presentCount;

  // 4) Generar Excel
  const workbook = new ExcelJS.Workbook();

  // 4a) Hoja Resumen
  const summarySheet = workbook.addWorksheet("Resumen");
  summarySheet.addRows([
    ["Grupo", groupInfo.name],
    ["Fecha", date],
    ["Total miembros", totalStudents],
    ["Asistieron", presentCount],
    ["No asistieron", absentCount],
  ]);

  // 4b) Hoja Detalle
  const detailSheet = workbook.addWorksheet("Detalle");
  detailSheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Nombre", key: "name", width: 30 },
    { header: "Cédula", key: "cedula", width: 20 },
    { header: "Estado", key: "status", width: 12 },
    { header: "Hora", key: "time", width: 12 },
  ];
  rows.forEach((r) =>
    detailSheet.addRow({
      id: r.id,
      name: r.name,
      cedula: r.cedula,
      status: r.present ? "Presente" : "Ausente",
      time: r.time ?? "",
    })
  );

  // 5) Devolver como .xlsx
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="asistencia_g${groupId}_${date}.xlsx"`,
    },
  });
}
