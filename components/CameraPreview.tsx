import { useRef, useEffect } from "react";

interface Props {
  previewFrame: string; // base64 del frame actual
  isProcessing: boolean;
}

export function CameraPreview({ previewFrame, isProcessing }: Props) {
  // Ref donde guardamos el último frame "válido"
  const lastFrameRef = useRef<string>(previewFrame);

  // Cada vez que previewFrame cambie *y* NO estemos procesando,
  // actualizamos el ref con el frame más reciente.
  useEffect(() => {
    if (!isProcessing) {
      lastFrameRef.current = previewFrame;
    }
  }, [previewFrame, isProcessing]);

  // Elegimos qué frame mostrar: si procesando, el guardado; si no, el actual.
  const displayedFrame = isProcessing ? lastFrameRef.current : previewFrame;

  return (
    <div>
      <img
        src={`data:image/jpeg;base64,${displayedFrame}`}
        alt="Vista previa de cámara"
        className="w-full h-auto rounded-lg border"
      />
    </div>
  );
}
