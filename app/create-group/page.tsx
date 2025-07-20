"use client";

import type React from "react";

import { useState } from "react";
import { ArrowLeft, Users, CheckCircle, AlertCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

type CreationStep = "form" | "success" | "error";

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [currentStep, setCurrentStep] = useState<CreationStep>("form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    const res = await fetch("/api/create-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName, description }),
    });

    if (!res.ok) {
      setCurrentStep("error");
      return;
    }

    setCurrentStep("success");
  };

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setCurrentStep("form");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Crear Grupo
            </h1>
            <p className="text-gray-600 mt-1">
              Configura un nuevo grupo de estudiantes
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Nuevo Grupo
            </CardTitle>
            <CardDescription>
              Completa los datos para crear un nuevo grupo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === "form" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre del Grupo */}
                <div className="space-y-2">
                  <Label
                    htmlFor="groupName"
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Nombre del Grupo
                  </Label>
                  <Input
                    id="groupName"
                    type="text"
                    placeholder="Ej: Matemáticas A, Física Avanzada, etc."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el contenido o características del grupo..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full"
                    rows={3}
                  />
                </div>

                {groupName && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">
                      Resumen del Grupo
                    </h3>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>
                        <strong>Nombre:</strong> {groupName}
                      </p>
                      {description && (
                        <p>
                          <strong>Descripción:</strong> {description}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!groupName}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Crear Grupo
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

            {currentStep === "success" && (
              <div className="text-center space-y-6 py-8">
                <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-900">
                    ¡Grupo Creado Exitosamente!
                  </h3>
                  <p className="text-gray-600">
                    El grupo ha sido configurado y está listo para recibir
                    estudiantes
                  </p>
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{groupName}</strong> ha sido creado correctamente
                  </AlertDescription>
                </Alert>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">
                    Detalles del Grupo
                  </h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p>
                      <strong>Nombre:</strong> {groupName}
                    </p>
                    {description && (
                      <p>
                        <strong>Descripción:</strong> {description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={resetForm} className="flex-1">
                    Crear Otro Grupo
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      Volver al Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {currentStep === "error" && (
              <div className="text-center space-y-6 py-8">
                <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-900">
                    Error al Crear Grupo
                  </h3>
                  <p className="text-gray-600">
                    No se pudo crear el grupo. Por favor, intenta nuevamente.
                  </p>
                </div>

                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Posibles causas: Conflicto de horarios, nombre duplicado, o
                    error del sistema
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setCurrentStep("form")}
                    className="flex-1"
                  >
                    Intentar Nuevamente
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 bg-transparent"
                  >
                    Cancelar
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
                Consejos para Crear Grupos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    Usa nombres descriptivos que identifiquen claramente la
                    materia y nivel
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
