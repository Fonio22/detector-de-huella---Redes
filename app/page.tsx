"use client";

import { useState } from "react";
import {
  Users,
  UserCheck,
  Calendar,
  Camera,
  Fingerprint,
  Plus,
  Play,
  UserPlus,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/useSocket";

// Datos de ejemplo
const dashboardStats = {
  totalStudents: 156,
  totalGroups: 8,
  studentsToday: 89,
  attendanceRate: 85,
};

const attendanceData = [
  { day: "Lun", students: 78 },
  { day: "Mar", students: 85 },
  { day: "Mié", students: 92 },
  { day: "Jue", students: 89 },
  { day: "Vie", students: 76 },
  { day: "Sáb", students: 45 },
  { day: "Dom", students: 23 },
];

const groupsData = [
  { name: "Matemáticas A", students: 25, present: 22, color: "#8884d8" },
  { name: "Física B", students: 28, present: 24, color: "#82ca9d" },
  { name: "Química C", students: 22, present: 18, color: "#ffc658" },
  { name: "Historia D", students: 30, present: 25, color: "#ff7300" },
];

const recentStudents = [
  {
    id: 1,
    name: "Ana García",
    cedula: "12345678",
    time: "08:15",
    status: "present",
  },
  {
    id: 2,
    name: "Carlos López",
    cedula: "87654321",
    time: "08:18",
    status: "present",
  },
  {
    id: 3,
    name: "María Rodríguez",
    cedula: "11223344",
    time: "08:22",
    status: "present",
  },
  {
    id: 4,
    name: "José Martínez",
    cedula: "44332211",
    time: "08:25",
    status: "present",
  },
  {
    id: 5,
    name: "Laura Fernández",
    cedula: "55667788",
    time: "08:30",
    status: "present",
  },
];

export default function Dashboard() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const { socketConnected, resetCounter, resetMessage } = useSocket();

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Control de Acceso
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Dashboard de administración
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link href="/register-fingerprint">
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Estudiante
              </Button>
            </Link>
            <Link href="/create-group">
              <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Grupo
              </Button>
            </Link>
            <Link href="/validate-attendance">
              <Button
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent w-full sm:w-auto"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Validación
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total Estudiantes
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold">
                {dashboardStats.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Registrados en el sistema
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Grupos
              </CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold">
                {dashboardStats.totalGroups}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Clases programadas
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Hoy
              </CardTitle>
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold">
                {dashboardStats.studentsToday}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {Math.round(
                  (dashboardStats.studentsToday /
                    dashboardStats.totalStudents) *
                    100
                )}
                % asistencia
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Sistema
              </CardTitle>
              <div className="flex gap-1">
                <Fingerprint className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 bg-${
                    socketConnected ? "green" : "red"
                  }-500 rounded-full`}
                ></div>
                <span className="text-xs sm:text-sm font-medium">
                  {socketConnected ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Huella y cámara operativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Attendance Chart */}
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">
                Asistencia Semanal
              </CardTitle>
              <CardDescription className="text-sm">
                Estudiantes presentes por día
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <ChartContainer
                config={{
                  students: {
                    label: "Estudiantes",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px] sm:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="students"
                      fill="var(--color-students)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Groups and Recent Activity */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Groups List */}
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-base sm:text-lg">
                Grupos Activos
              </CardTitle>
              <CardDescription className="text-sm">
                Selecciona una fecha para ver la asistencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
              {/* Selector de Fecha */}
              <div className="flex items-center gap-2">
                <Label htmlFor="date-select" className="text-sm font-medium">
                  Fecha:
                </Label>
                <Input
                  id="date-select"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-auto text-sm"
                />
              </div>

              {/* Lista de Grupos */}
              {groupsData.map((group, index) => (
                <Link
                  key={index}
                  href={`/group-summary/${group.name
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      ></div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">
                          {group.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {group.present}/{group.students} presentes
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        group.present / group.students > 0.8
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs flex-shrink-0"
                    >
                      {Math.round((group.present / group.students) * 100)}%
                    </Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">
              Acciones Rápidas
            </CardTitle>
            <CardDescription className="text-sm">
              Herramientas principales
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Button
                variant="outline"
                className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm"
                onClick={() => {
                  if (socketConnected) {
                    resetCounter();
                  }
                }}
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                <span>Reset huella completo</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
