"use client";

import type React from "react";

import { Fragment, useEffect, useState } from "react";
import {
  ArrowLeft,
  Fingerprint,
  User,
  CreditCard,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";

type groupType = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  studentCount: number;
};

type RegistrationStep = "form" | "scanning" | "success" | "error";

export default function RegisterFingerprint() {
  const router = useRouter();
  const { socketConnected, registerFingerprint, enrollStep, enrolledData } =
    useSocket();
  const [groups, setGroups] = useState<groupType[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("form");
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [sendingData, setSendingData] = useState<number>(0);

  useEffect(() => {
    getAllGroups();
  }, []);

  useEffect(() => {
    if (enrolledData) {
      setCurrentStep("success");
      setScanProgress(100);
      handleSubmit();
    } else if (enrollStep) {
      if (enrollStep.step === "scan1") {
        setCurrentStep("scanning");
        setScanProgress(0);
      } else {
        setCurrentStep("scanning");
        setScanProgress(50);
      }
    }
  }, [enrollStep, enrolledData]);

  const handleSubmit = async () => {
    if (!selectedGroup || !studentName || !studentId) return;

    if (enrolledData?.slot === null) {
      setCurrentStep("error");
      console.error("Huella no registrada correctamente");
      return;
    }

    try {
      setSendingData(1);
      // Enviar datos al servidor
      const res = await fetch("/api/register-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentName.trim(),
          cedula: studentId.trim(),
          fingerprint: enrolledData?.slot || null,
          groupId: selectedGroup,
        }),
      });

      if (!res.ok) {
        setCurrentStep("error");
        console.error("Error al registrar estudiante:", res);
        return;
      }

      const data = await res.json();
      console.log("Registro exitoso:", data);

      setSendingData(2);
    } catch (error) {
      console.error("Error al enviar datos:", error);
      setCurrentStep("error");
    }
  };

  const resetForm = () => {
    setSendingData(0);
    setSelectedGroup("");
    setStudentName("");
    setStudentId("");
    setCurrentStep("form");
    setScanProgress(0);
  };

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  const getAllGroups = async () => {
    try {
      const res = await fetch("/api/get-all-group");
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

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Registrar Huella
            </h1>
            <p className="text-gray-600 mt-1">
              Registra un nuevo estudiante en el sistema
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-600" />
              Registro de Estudiante
            </CardTitle>
            <CardDescription>
              Completa la información del estudiante y registra su huella
              dactilar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === "form" && (
              <form className="space-y-6">
                {/* Selector de Grupo */}
                <div className="space-y-2">
                  <Label htmlFor="group" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Grupo
                  </Label>
                  <Select
                    value={selectedGroup ? selectedGroup.toString() : ""}
                    onValueChange={(value) => {
                      console.log("value:", value);
                      setSelectedGroup(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem
                          key={group.id.toString()}
                          value={group.id.toString()}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{group.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGroupData && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedGroupData.name}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Nombre del Estudiante */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nombre Completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ingresa el nombre completo del estudiante"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Cédula */}
                <div className="space-y-2">
                  <Label htmlFor="cedula" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Cédula de Identidad
                  </Label>
                  <Input
                    id="cedula"
                    type="text"
                    placeholder="Ingresa la cédula del estudiante"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Resumen */}
                {selectedGroup && studentName && studentId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">
                      Resumen del Registro
                    </h3>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>
                        <strong>Grupo:</strong> {selectedGroupData?.name}
                      </p>
                      <p>
                        <strong>Estudiante:</strong> {studentName}
                      </p>
                      <p>
                        <strong>Cédula:</strong> {studentId}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={registerFingerprint}
                    type="button"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={
                      !selectedGroup ||
                      !studentName ||
                      !studentId ||
                      !socketConnected
                    }
                  >
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Iniciar Registro de Huella
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 bg-transparent"
                  >
                    Limpiar Formulario
                  </Button>
                </div>
              </form>
            )}

            {currentStep === "scanning" && (
              <div className="text-center space-y-6 py-8">
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Fingerprint className="w-12 h-12 text-blue-600 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Escaneando Huella Dactilar
                  </h3>
                  <p className="text-gray-600">
                    {enrollStep?.step === "scan1"
                      ? "Por favor, coloca tu dedo en el sensor y mantén presionado"
                      : "Retira tu dedo y colócalo nuevamente en el sensor para completar el escaneo"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {scanProgress}% completado
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Instrucciones:</strong>{" "}
                    {enrollStep?.step === "scan1"
                      ? "Mantén el dedo firme en el sensor hasta que se complete el escaneo"
                      : "Retira tu dedo y colócalo nuevamente en el sensor para completar el escaneo"}
                  </p>
                </div>
              </div>
            )}

            {currentStep === "success" && (
              <div className="text-center space-y-6 py-8">
                <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-900">
                    ¡Registro Exitoso!
                  </h3>
                  <p className="text-gray-600">
                    La huella dactilar ha sido registrada correctamente
                  </p>
                </div>

                {sendingData === 2 ? (
                  <Fragment>
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>{studentName}</strong> ha sido registrado en el
                        grupo <strong>{selectedGroupData?.name}</strong>
                      </AlertDescription>
                    </Alert>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={resetForm} className="flex-1">
                        Registrar Otro Estudiante
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => router.push("/dashboard")}
                      >
                        Volver al Dashboard
                      </Button>
                    </div>
                  </Fragment>
                ) : sendingData === 1 ? (
                  <div>
                    <Alert className="border-blue-200 bg-blue-50">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-600"></div>
                        <span className="text-blue-800">
                          Enviando datos al servidor...
                        </span>
                      </div>
                    </Alert>
                  </div>
                ) : null}
              </div>
            )}

            {currentStep === "error" && (
              <div className="text-center space-y-6 py-8">
                <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-900">
                    Error en el Registro
                  </h3>
                  <p className="text-gray-600">
                    No se pudo completar el registro de la huella dactilar
                  </p>
                </div>

                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Posibles causas: Sensor desconectado, huella no clara, o
                    error del sistema
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setCurrentStep("scanning")}
                    className="flex-1"
                  >
                    Intentar Nuevamente
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 bg-transparent"
                  >
                    Cancelar Registro
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información Adicional */}
        {currentStep === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 ${
                      socketConnected ? "bg-green-500" : "bg-red-500"
                    } rounded-full`}
                  ></div>
                  <span>
                    Sistema: {socketConnected ? "Conectado" : "Desconectado"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Base de datos: Activa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Grupos activos: {groups.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
