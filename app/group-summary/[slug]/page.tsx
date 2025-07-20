"use client"

import { useState } from "react"
import { ArrowLeft, Users, CheckCircle, XCircle, Camera, Calendar, Clock, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// Datos de ejemplo de grupos
const groupsData: Record<string, any> = {
  "matematicas-a": {
    id: "1",
    name: "Matemáticas A",
    students: 25,
    color: "#8884d8",
    allStudents: [
      { id: 1, name: "Ana García", cedula: "12345678", present: true, time: "08:15" },
      { id: 2, name: "Pedro Sánchez", cedula: "99887766", present: true, time: "08:18" },
      { id: 3, name: "Carmen López", cedula: "11111111", present: false, time: null },
      { id: 4, name: "Luis Martín", cedula: "22222222", present: true, time: "08:22" },
      { id: 5, name: "María José", cedula: "33333333", present: false, time: null },
      { id: 6, name: "Carlos Ruiz", cedula: "44444444", present: true, time: "08:25" },
      { id: 7, name: "Elena Vega", cedula: "55555555", present: false, time: null },
      { id: 8, name: "Roberto Silva", cedula: "66666666", present: true, time: "08:30" },
    ],
    photoData: {
      taken: true,
      url: "/placeholder.svg?height=400&width=600",
      detectedCount: 22,
      timestamp: "08:35",
    },
  },
  "fisica-b": {
    id: "2",
    name: "Física B",
    students: 28,
    color: "#82ca9d",
    allStudents: [
      { id: 1, name: "Carlos López", cedula: "87654321", present: true, time: "09:10" },
      { id: 2, name: "Miguel Torres", cedula: "22222222", present: true, time: "09:15" },
      { id: 3, name: "Sandra Morales", cedula: "77777777", present: false, time: null },
      { id: 4, name: "Diego Herrera", cedula: "88888888", present: true, time: "09:20" },
    ],
    photoData: {
      taken: false,
      url: null,
      detectedCount: 0,
      timestamp: null,
    },
  },
}

interface GroupSummaryProps {
  params: {
    slug: string
  }
}

export default function GroupSummary({ params }: GroupSummaryProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  const groupData = groupsData[params.slug]

  if (!groupData) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Grupo no encontrado</h1>
              <p className="text-gray-600 mb-4">El grupo solicitado no existe o no está disponible.</p>
              <Link href="/">
                <Button>Volver al Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const presentStudents = groupData.allStudents.filter((student: any) => student.present)
  const absentStudents = groupData.allStudents.filter((student: any) => !student.present)
  const attendanceRate = Math.round((presentStudents.length / groupData.allStudents.length) * 100)

  return (
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{groupData.name}</h1>
            <p className="text-gray-600 mt-1">Resumen de asistencia</p>
          </div>
          <Badge className="text-xs" style={{ backgroundColor: groupData.color, color: "white" }}>
            {attendanceRate}% Asistencia
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
                Última actualización: {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{presentStudents.length}</div>
                <p className="text-xs text-gray-600">Presentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{absentStudents.length}</div>
                <p className="text-xs text-gray-600">Ausentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{groupData.allStudents.length}</div>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{attendanceRate}%</div>
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
                Estudiantes Presentes ({presentStudents.length})
              </CardTitle>
              <CardDescription>Estudiantes que validaron su asistencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {presentStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay estudiantes presentes</p>
                  </div>
                ) : (
                  presentStudents.map((student: any) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{student.name}</h4>
                          <p className="text-xs text-gray-600">C.I: {student.cedula}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{student.time}</p>
                        <Badge className="bg-green-100 text-green-800 text-xs">Presente</Badge>
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
                Estudiantes Ausentes ({absentStudents.length})
              </CardTitle>
              <CardDescription>Estudiantes que no han validado su asistencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {absentStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Todos los estudiantes están presentes</p>
                  </div>
                ) : (
                  absentStudents.map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{student.name}</h4>
                          <p className="text-xs text-gray-600">C.I: {student.cedula}</p>
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

        {/* Foto del Conteo (si existe) */}
        {groupData.photoData.taken && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Conteo Fotográfico
              </CardTitle>
              <CardDescription>
                Foto tomada a las {groupData.photoData.timestamp} - {groupData.photoData.detectedCount} personas
                detectadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Imagen */}
                <div className="lg:col-span-2">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <img
                      src={groupData.photoData.url || "/placeholder.svg"}
                      alt="Foto del salón"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {groupData.photoData.detectedCount} personas detectadas
                    </div>
                  </div>
                </div>

                {/* Comparación */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Comparación</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Detectados en foto</span>
                      <span className="text-xl font-bold text-blue-600">{groupData.photoData.detectedCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Validados con huella</span>
                      <span className="text-xl font-bold text-green-600">{presentStudents.length}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Diferencia</span>
                      <span className="text-xl font-bold text-orange-600">
                        {Math.abs(groupData.photoData.detectedCount - presentStudents.length)}
                      </span>
                    </div>
                  </div>

                  {groupData.photoData.detectedCount !== presentStudents.length && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> Hay una diferencia entre el conteo fotográfico y las validaciones por
                        huella. Esto puede deberse a visitantes, estudiantes sin huella registrada, o errores en la
                        detección.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <Button variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Ver Historial
              </Button>
              <Button variant="outline">
                <Camera className="w-4 h-4 mr-2" />
                Tomar Foto de Conteo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
