import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Eraser, Trash2, Fish } from "lucide-react";
import { createFish, saveFish } from "@/lib/fishStore";
import { toast } from "sonner";

const COLORS = [
  "#FF6B6B", "#FF8E53", "#FFC857", "#A8E06C",
  "#56C596", "#36B5A0", "#2EC4B6", "#3ABEF9",
  "#5B8DEF", "#7C5CFC", "#C77DFF", "#FF6EC7",
  "#FFFFFF", "#1A1A2E", "#4A4A68", "#E8B4B8",
];

const DrawingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3ABEF9");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [fishName, setFishName] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // Canvas trasparente - niente sfondo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,0)" : color;
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, brushSize, isEraser, color, getPos]);

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const [saving, setSaving] = useState(false);
  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const name = fishName.trim() || `Pesce #${Date.now() % 1000}`;
    const imageData = canvas.toDataURL("image/png");
    const fish = createFish(name, imageData);
    setSaving(true);
    try {
      await saveFish(fish);
      toast.success(`"${name}" è nell'acquario! 🐟`);
      navigate("/aquarium");
    } catch (e) {
      toast.error("Errore nel salvataggio del pesce");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b bg-card">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Fish className="w-6 h-6 text-primary" />
          Disegna il tuo pesce
        </h1>
        <Button variant="outline" size="sm" onClick={() => navigate("/aquarium")}>
          Vai all'acquario
        </Button>
      </header>

      {/* Canvas */}
      <div className="flex-1 flex flex-col p-3 gap-3 max-w-2xl mx-auto w-full">
        <canvas
          ref={canvasRef}
          className="w-full aspect-[4/3] rounded-xl border-2 border-border cursor-crosshair touch-none shadow-md"
          style={{ backgroundImage: "linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px", backgroundColor: "#f5f5f5" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />

        {/* Color palette */}
        <div className="flex flex-wrap gap-2 justify-center">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c && !isEraser ? "border-foreground scale-110 ring-2 ring-primary" : "border-border"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => { setColor(c); setIsEraser(false); }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[150px]">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Pennello:</span>
            <Slider
              value={[brushSize]}
              onValueChange={(v) => setBrushSize(v[0])}
              min={1}
              max={30}
              step={1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-6 text-center">{brushSize}</span>
          </div>

          <Button
            variant={isEraser ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEraser(!isEraser)}
          >
            <Eraser className="w-4 h-4 mr-1" /> Gomma
          </Button>

          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4 mr-1" /> Cancella
          </Button>
        </div>

        {/* Name + Submit */}
        <div className="flex gap-2">
          <Input
            placeholder="Nome del pesce..."
            value={fishName}
            onChange={(e) => setFishName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Fish className="w-4 h-4 mr-1" /> {saving ? "Salvataggio..." : "Inserisci!"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DrawingPage;
