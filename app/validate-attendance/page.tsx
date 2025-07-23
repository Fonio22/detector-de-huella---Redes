"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Fingerprint,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
  Camera,
  ChevronRight,
  CalendarIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, set } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useSocket } from "@/hooks/useSocket";
import { CameraPreview } from "@/components/CameraPreview";

type groupType = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  studentCount: number;
  assistanceCount: number;
};

type ValidationStep =
  | "waiting"
  | "scanning"
  | "success"
  | "error"
  | "not-found";

interface AttendanceRecord {
  id: number;
  name: string;
  cedula: string;
  time: string;
  status: "present";
}

export default function ValidateAttendance() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [groups, setGroups] = useState<groupType[]>([]);
  const {
    socketConnected,
    verifyFingerprint,
    disableFingerprint,
    enableFingerprint,
    verifyResult,
    verifyError,
    isFingerprintActive,
    startPreview,
    stopPreview,
    previewFrame,
    previewRunning,
    takePhoto,
    photoData,
    photoError,
  } = useSocket();

  const [currentStep, setCurrentStep] = useState<ValidationStep>("waiting");
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [currentStudent, setCurrentStudent] = useState<any>(null);

  const [scanProgress, setScanProgress] = useState(0);

  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [totalDetected, setTotalDetected] = useState(0);
  const [error, setError] = useState("Error del sensor o huella no clara");
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  // console.log("photoData:", photoData);
  // console.log("photoError:", photoError);

  useEffect(() => {
    if (!date) return;
    getAllGroups();
  }, [date]);

  useEffect(() => {
    if (verifyResult) {
      // Manejar el resultado de la verificación
      console.log("Resultado de verificación:", verifyResult);
      setCurrentStep("success");
      getMembersByIDFingerPrint(verifyResult.id.toString());
    }
  }, [verifyResult]);

  useEffect(() => {
    if (photoData) {
      // Handle the photo data
      console.log("Datos de la foto:", photoData);
      // Update the captured image and detection count
      setCapturedImage(`data:image/jpeg;base64,${photoData.image}`);
      setTotalDetected(photoData.people_count);
      setIsProcessing(false);
    }
    if (photoError) {
      // Handle the photo error
      console.error("Error al tomar la foto:", photoError);
      if (photoError.includes("Huella no encontrada")) {
        setCurrentStep("not-found");
      }
    }
  }, [photoData, photoError]);

  useEffect(() => {
    getPresentStudents();
  }, [date, selectedGroup]);

  const getPresentStudents = async () => {
    try {
      const res = await fetch(
        `/api/by-group-id?groupId=${selectedGroup}&date=${format(
          date,
          "yyyy-MM-dd"
        )}`
      );
      if (!res.ok) throw new Error("Error al obtener estudiantes presentes");

      const data = await res.json();

      if (data.isOK) {
        console.log("Estudiantes presentes:", data);

        const asistieron = data.allStudents.filter(
          (persona: any) => persona.present
        );
        setAttendanceRecords(asistieron);
      } else {
        console.error("Error al obtener estudiantes presentes:", data.message);
      }
    } catch (error) {
      console.log("Error al obtener estudiantes presentes:", error);
    }
  };

  const getAllGroups = async () => {
    try {
      const res = await fetch(
        `/api/get-all-group-assist?date=${format(date, "yyyy-MM-dd")}`
      );
      if (!res.ok) throw new Error("Error al obtener grupos");

      const data = await res.json();

      if (data.isOK) {
        setGroups(data.groups);
      } else {
        console.error("Error al obtener grupos:", data.message);
      }
    } catch (error) {
      console.log("Error al obtener grupos:", error);
    }
  };

  const getMembersByIDFingerPrint = async (groupId: string) => {
    try {
      const res = await fetch(
        `/api/get-member-by-fingerprint?fingerprintId=${groupId}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error al obtener miembros: ${errorData.message}`);
        setCurrentStep("error");
        return;
      }

      const data = await res.json();

      if (data.isOK) {
        console.log("Miembros obtenidos:", data.student);

        // Agregar registro de asistencia a la base de datos
        const attendanceDate = format(date, "yyyy-MM-dd");
        const memberId = data.student.id; // Asumiendo que cedula es el ID del miembro
        const groupId = selectedGroupData?.id || "";

        const attendanceRes = await fetch("/api/assistance-register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupId,
            memberId,
            assistanceDate: attendanceDate,
          }),
        });

        if (!attendanceRes.ok) {
          const errorData = await attendanceRes.json();
          setError(
            `${errorData.message} - ${data.student.name} (${data.student.cedula})`
          );
          setCurrentStep("error");
          return;
        }

        setAttendanceRecords((prev) => [
          ...prev,
          {
            id: Date.now(),
            name: data.student.name,
            cedula: data.student.cedula,
            time: format(new Date(), "HH:mm:ss"),
            status: "present",
          },
        ]);
        setCurrentStudent(data.student);
      } else {
        setError(data.message);
        console.error("Error al obtener miembros:", data.message);
      }
    } catch (error) {
      console.log("Error al obtener miembros por ID de huella:", error);
    }
  };

  // const startValidation = () => {
  //   setIsActive(true);
  //   setCurrentStep("waiting");
  // };

  // const stopValidation = () => {
  //   setIsActive(false);
  //   setCurrentStep("waiting");
  //   setScanProgress(0);
  // };

  // Inicializar cámara
  const startCamera = async () => {
    try {
      // const mediaStream = await navigator.mediaDevices.getUserMedia({
      //   video: {
      //     width: { ideal: 1280 },
      //     height: { ideal: 720 },
      //     facingMode: "environment",
      //   },
      // });
      // setStream(mediaStream);
      // if (videoRef.current) {
      //   videoRef.current.srcObject = mediaStream;
      // }
      startPreview();
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // Detener cámara
  const stopCamera = () => {
    stopPreview();
  };

  // Tomar foto y procesar
  const captureAndCount = () => {
    setIsProcessing(true);
    takePhoto();
  };

  // Si no hay grupo seleccionado, mostrar selector de grupo
  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Validación de Asistencia
              </h1>
              <p className="text-gray-600 mt-1">
                Selecciona el grupo para iniciar la validación
              </p>
            </div>
          </div>
          {/* Selecion de dia */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* <Calendar className="w-5 h-5 text-blue-600" /> */}
                Seleccionar Día
              </CardTitle>
              <CardDescription>
                Elige el día para el cual deseas validar la asistencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!date}
                    className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate as any}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Selector de Grupo */}
          {date && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Seleccionar Grupo
                </CardTitle>
                <CardDescription>
                  Elige el grupo para el cual deseas validar la asistencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                      onClick={() => setSelectedGroup(group.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {group.name}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {group.studentCount} estudiantes
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Asistidos: {group.assistanceCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 bg-${
                      socketConnected ? "green" : "red"
                    }-500 rounded-full`}
                  ></div>
                  <span>
                    Sistema: {socketConnected ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Base de datos: Activa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // UI principal de validación (cuando ya hay grupo seleccionado)
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con información del grupo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => {
              setSelectedGroup(null);
              setAttendanceRecords([]);
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {selectedGroupData?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {selectedGroupData?.studentCount} estudiantes registrados
            </p>
          </div>
          <Badge className="text-xs">{format(date, "PPP")}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Validación */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-blue-600" />
                Sensor de Huella
              </CardTitle>
              <CardDescription>
                {socketConnected
                  ? "Sistema activo - Esperando huella dactilar"
                  : "Sistema inactivo"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Control de Sistema */}
              <div className="flex gap-3">
                {
                  !isFingerprintActive ? (
                    <Button
                      onClick={() => {
                        setError("Error del sensor o huella no clara");
                        enableFingerprint();
                        verifyFingerprint();
                        setCurrentStep("scanning");
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Iniciar Validación
                    </Button>
                  ) : null
                  // <Button
                  //   onClick={disableFingerprint}
                  //   variant="destructive"
                  //   className="flex-1"
                  // >
                  //   <XCircle className="w-4 h-4 mr-2" />
                  //   Detener Validación
                  // </Button>
                }
                {/* <Button onClick={simulateFingerprint} variant="outline" disabled={!isActive}>
                  Simular Huella
                </Button> */}
                {/* <Button
                  onClick={() => {
                    setShowCamera(true)
                    setTimeout(() => startCamera(), 100)
                  }}
                  variant="outline"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Contar
                </Button> */}
              </div>

              {/* Estado del Sistema */}
              <div className="text-center space-y-4">
                {currentStep === "waiting" && socketConnected && (
                  <div className="py-8">
                    <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Fingerprint className="w-12 h-12 text-blue-600 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold">Esperando Huella</h3>
                    <p className="text-gray-600">
                      Coloca tu dedo en el sensor para registrar asistencia
                    </p>
                  </div>
                )}

                {currentStep === "scanning" && (
                  <div className="py-8">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                        <Fingerprint className="w-12 h-12 text-blue-600" />
                      </div>
                      <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                    </div>
                    <h3 className="text-lg font-semibold">Escaneando...</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {scanProgress}% completado
                    </p>
                  </div>
                )}

                {currentStep === "success" && currentStudent && (
                  <div className="py-8">
                    <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-900">
                      ¡Asistencia Registrada!
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <p className="font-medium">{currentStudent.name}</p>
                      <p className="text-sm text-gray-600">
                        C.I: {currentStudent.cedula}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedGroupData?.name}
                      </p>
                      <Badge className="bg-green-100 text-green-800 mt-2">
                        Presente
                      </Badge>
                    </div>
                  </div>
                )}

                {currentStep === "error" && (
                  <div className="py-8">
                    <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-900">
                      Error
                    </h3>
                    <Alert className="border-red-200 bg-red-50 mt-4">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {currentStudent
                          ? `${currentStudent.name} ya registró asistencia hoy`
                          : error}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {currentStep === "not-found" && (
                  <div className="py-8">
                    <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle className="w-12 h-12 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-900">
                      Huella No Reconocida
                    </h3>
                    <Alert className="border-yellow-200 bg-yellow-50 mt-4">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Esta huella no está registrada en este grupo
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {!socketConnected && (
                  <div className="py-8">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Fingerprint className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600">
                      Sistema Inactivo
                    </h3>
                    <p className="text-gray-500">
                      Presiona "Iniciar Validación" para comenzar
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Panel de Asistencia */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Asistencia - {selectedGroupData?.name}
              </CardTitle>
              <CardDescription>
                {attendanceRecords.length} de {selectedGroupData?.studentCount}{" "}
                estudiantes presentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay registros de asistencia aún</p>
                    <p className="text-xs mt-1">
                      Los estudiantes aparecerán aquí al validar su huella
                    </p>
                  </div>
                ) : (
                  attendanceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{record.name}</h4>
                          <p className="text-xs text-gray-600">
                            C.I: {record.cedula}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{record.time}</p>
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

          <Card
            className="w-full"
            onClick={() => {
              setShowCamera(true);
              startPreview();
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Conteo de Estudiantes por IA
              </CardTitle>
              <CardDescription>
                Toma una foto del salón para contar automáticamente los
                estudiantes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Modal de Cámara */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-600" />
                      Contar Estudiantes - {selectedGroupData?.name}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Toma una foto del salón para contar automáticamente los
                      estudiantes
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCamera(false);
                      setCapturedImage(null);
                      setTotalDetected(0);
                      stopCamera();
                    }}
                    className="p-2"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Vista de cámara o imagen capturada */}
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {capturedImage ? (
                      <img
                        src={capturedImage || "/placeholder.svg"}
                        alt="Imagen capturada"
                        className="w-full h-full object-cover"
                      />
                    ) : previewFrame ? (
                      <div className="">
                        <CameraPreview
                          previewFrame={previewFrame}
                          isProcessing={isProcessing}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {/* spinner */}
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-lg font-semibold">
                            Contando estudiantes...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controles */}
                  <div className="flex gap-3">
                    {!capturedImage ? (
                      <>
                        <Button
                          onClick={captureAndCount}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Tomar Foto y Contar
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCamera(false);
                            stopCamera();
                          }}
                          variant="outline"
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => {
                            setCapturedImage(null);
                            setTotalDetected(0);
                            startCamera();
                          }}
                          variant="outline"
                        >
                          Tomar Otra Foto
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCamera(false);
                            setCapturedImage(null);
                            setTotalDetected(0);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Finalizar Conteo
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Resultados */}
                  {totalDetected > 0 && !isProcessing && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          {totalDetected}
                        </div>
                        <p className="text-sm text-gray-600">Detectados</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {attendanceRecords.length}
                        </div>
                        <p className="text-sm text-gray-600">Validados</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600">
                          {selectedGroupData?.studentCount}
                        </div>
                        <p className="text-sm text-gray-600">Registrados</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Estadísticas del Grupo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceRecords.length}
                </div>
                <p className="text-xs text-gray-600">Presentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedGroupData?.studentCount}
                </div>
                <p className="text-xs text-gray-600">Registrados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {selectedGroupData && selectedGroupData?.studentCount > 0
                    ? Math.round(
                        (attendanceRecords.length /
                          selectedGroupData?.studentCount) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-600">Asistencia</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      socketConnected ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-sm font-medium">
                    {socketConnected ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Estado</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
