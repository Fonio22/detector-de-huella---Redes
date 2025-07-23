"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Camera,
  Calendar,
  Clock,
  User,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

interface StudentDetail {
  id: number;
  name: string;
  cedula: string;
  present: boolean;
  time: string | null;
}

interface GroupAttendanceDetail {
  isOK: boolean;
  id: string; // ID del grupo como cadena
  name: string; // Nombre del grupo
  students: number; // Total de estudiantes en el grupo
  color: string; // Color asociado al grupo (hex)
  allStudents: StudentDetail[];
}

export default function GroupSummary() {
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const params = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState(
    date || new Date().toISOString().split("T")[0]
  );
  const [groupData, setGroupsData] = useState<GroupAttendanceDetail | null>(
    null
  );
  const [lastUpdate, setLastUpdate] = useState<null | Date>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getGroupById(params.id);
  }, [selectedDate, params.id]);

  const getGroupById = async (id: string) => {
    console.log("Fetching group data for ID:", id);
    try {
      const response = await fetch(
        `/api/by-group-id?groupId=${id}&date=${selectedDate}`
      );
      if (!response.ok) {
        throw new Error("Error fetching group data");
      }
      const data = await response.json();
      console.log("Group data fetched:", data);
      setGroupsData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching group data:", error);
      return null;
    }
  };

  const descargarExcel = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/export-excel-date-id?groupId=${params.id}&date=${selectedDate}`
      );
      if (!response.ok) {
        throw new Error("Error downloading Excel");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asistencia_g${params.id}_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setLoading(false);
    } catch (error) {
      console.log("Error downloading Excel:", error);
    }
  };

  return groupData ? (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {groupData.name}
            </h1>
            <p className="text-gray-600 mt-1">Resumen de asistencia</p>
          </div>
          <Badge
            className="text-xs"
            style={{ backgroundColor: groupData.color, color: "white" }}
          >
            {(
              (groupData.allStudents
                .map((student) => (student.present ? 1 : 0)) // [0, 0, 0, …]
                .reduce<number>((sum, curr) => sum + curr, 0) / // suma cuántos 1 hay
                groupData.students) *
              100
            ).toFixed(0)}
            % Asistencia
          </Badge>
        </div>

        {/* Selector de Fecha */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div className="flex items-center gap-2">
                <label htmlFor="date-select" className="text-sm font-medium">
                  Fecha:
                </label>
                <input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                />
              </div>
              <div className="ml-auto text-sm text-gray-600">
                Última actualización:{" "}
                {lastUpdate &&
                  lastUpdate.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    groupData.allStudents.filter((student) => student.present)
                      .length
                  }
                </div>
                <p className="text-xs text-gray-600">Presentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {
                    groupData.allStudents.filter((student) => !student.present)
                      .length
                  }
                </div>
                <p className="text-xs text-gray-600">Ausentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {groupData.allStudents.length}
                </div>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(
                    (groupData.allStudents
                      .map((student) => (student.present ? 1 : 0)) // [0, 0, 0, …]
                      .reduce<number>((sum, curr) => sum + curr, 0) / // suma cuántos 1 hay
                      groupData.students) *
                    100
                  ).toFixed(0)}
                  %
                </div>
                <p className="text-xs text-gray-600">Asistencia</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Estudiantes Presentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Estudiantes Presentes (
                {
                  groupData.allStudents.filter((student) => student.present)
                    .length
                }
                )
              </CardTitle>
              <CardDescription>
                Estudiantes que validaron su asistencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {groupData.allStudents.filter((student) => student.present)
                  .length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay estudiantes presentes</p>
                  </div>
                ) : (
                  groupData.allStudents
                    .filter((student) => student.present)
                    .map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              {student.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              C.I: {student.cedula}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{student.time}</p>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Presente
                          </Badge>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Estudiantes Ausentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Estudiantes Ausentes (
                {
                  groupData.allStudents.filter((student) => !student.present)
                    .length
                }
                )
              </CardTitle>
              <CardDescription>
                Estudiantes que no han validado su asistencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {groupData.allStudents.filter((student) => !student.present)
                  .length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Todos los estudiantes están presentes</p>
                  </div>
                ) : (
                  groupData.allStudents
                    .filter((student) => !student.present)
                    .map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              {student.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              C.I: {student.cedula}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="text-xs">
                            Ausente
                          </Badge>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/validate-attendance">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Iniciar Validación
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={descargarExcel}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-600" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Descargar Asistencia
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cargando grupo...
            </h1>
            <p className="text-gray-600 mb-4">Por favor, espere un momento.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
