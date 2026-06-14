import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/simulatorCalc";

interface PercentualAdjustmentPanelProps {
  valorImovel: number;
  percentualAto: number;
  percentualPrimeiras: number;
  onAtoChange: (value: number) => void;
  onPrimeirasChange: (value: number) => void;
}

export default function PercentualAdjustmentPanel({
  valorImovel,
  percentualAto,
  percentualPrimeiras,
  onAtoChange,
  onPrimeirasChange,
}: PercentualAdjustmentPanelProps) {
  const [atoLocal, setAtoLocal] = useState(percentualAto);
  const [primeirasLocal, setPrimeirasLocal] = useState(percentualPrimeiras);
  const [atoInput, setAtoInput] = useState(percentualAto.toString());
  const [primeirasInput, setPrimeirasInput] = useState(percentualPrimeiras.toString());

  // Atualizar inputs quando props mudam
  useEffect(() => {
    setAtoLocal(percentualAto);
    setAtoInput(percentualAto.toString());
  }, [percentualAto]);

  useEffect(() => {
    setPrimeirasLocal(percentualPrimeiras);
    setPrimeirasInput(percentualPrimeiras.toString());
  }, [percentualPrimeiras]);

  const handleAtoSliderChange = (value: number[]) => {
    const newValue = value[0];
    setAtoLocal(newValue);
    setAtoInput(newValue.toString());
    onAtoChange(newValue);
  };

  const handlePrimeirasSliderChange = (value: number[]) => {
    const newValue = value[0];
    setPrimeirasLocal(newValue);
    setPrimeirasInput(newValue.toString());
    onPrimeirasChange(newValue);
  };

  const handleAtoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAtoInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setAtoLocal(numValue);
      onAtoChange(numValue);
    }
  };

  const handlePrimeirasInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrimeirasInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setPrimeirasLocal(numValue);
      onPrimeirasChange(numValue);
    }
  };

  const handleReset = () => {
    setAtoLocal(5);
    setAtoInput("5");
    setPrimeirasLocal(3);
    setPrimeirasInput("3");
    onAtoChange(5);
    onPrimeirasChange(3);
  };

  const valorAto = (valorImovel * atoLocal) / 100;
  const valorPrimeiras = (valorImovel * primeirasLocal) / 100;
  const totalEntrada = valorAto + valorPrimeiras;
  const percentualTotal = atoLocal + primeirasLocal;

  const isValidEntrada = totalEntrada >= valorImovel * 0.08;

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Painel de Ajuste de Percentuais</CardTitle>
            <CardDescription className="text-slate-400">
              Customize os percentuais de Ato e Primeiras Parcelas conforme a demanda
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Validação de Entrada */}
        {!isValidEntrada && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              ⚠️ Entrada insuficiente. O total deve atingir no mínimo 8% do valor do imóvel ({formatCurrency(valorImovel * 0.08)}).
            </AlertDescription>
          </Alert>
        )}

        {isValidEntrada && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950 border-2">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200 font-bold text-lg">
              ✓ ENTRADA SUFICIENTE - APROVADO
            </AlertDescription>
          </Alert>
        )}

        {/* Seção 1: ATO */}
        <div className="space-y-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">1. Ato</h3>
              <p className="text-slate-400 text-sm">Entrada inicial da negociação</p>
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-bold text-lg">{formatCurrency(valorAto)}</p>
              <p className="text-slate-400 text-sm">{atoLocal.toFixed(2)}% do imóvel</p>
            </div>
          </div>

          {/* Slider para Ato */}
          <div className="space-y-2">
            <Label className="text-slate-300">Percentual (%)</Label>
            <Slider
              value={[atoLocal]}
              onValueChange={handleAtoSliderChange}
              min={0}
              max={50}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Input para Ato */}
          <div className="space-y-2">
            <Label className="text-slate-300">Digite o percentual</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={atoInput}
                onChange={handleAtoInputChange}
                min="0"
                max="100"
                step="0.1"
                className="bg-slate-600 border-slate-500 text-white"
              />
              <span className="flex items-center text-slate-300">%</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-slate-600 rounded border border-slate-500">
            <p className="text-slate-300 text-sm">
              <span className="font-semibold">Valor do Ato:</span> {formatCurrency(valorAto)}
            </p>
          </div>
        </div>

        {/* Seção 2: PRIMEIRAS PARCELAS */}
        <div className="space-y-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">2. Primeiras Parcelas</h3>
              <p className="text-slate-400 text-sm">Defina a quantidade e valor das primeiras parcelas</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold text-lg">{formatCurrency(valorPrimeiras)}</p>
              <p className="text-slate-400 text-sm">{primeirasLocal.toFixed(2)}% do imóvel</p>
            </div>
          </div>

          {/* Slider para Primeiras Parcelas */}
          <div className="space-y-2">
            <Label className="text-slate-300">Percentual (%)</Label>
            <Slider
              value={[primeirasLocal]}
              onValueChange={handlePrimeirasSliderChange}
              min={0}
              max={50}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Input para Primeiras Parcelas */}
          <div className="space-y-2">
            <Label className="text-slate-300">Digite o percentual</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={primeirasInput}
                onChange={handlePrimeirasInputChange}
                min="0"
                max="100"
                step="0.1"
                className="bg-slate-600 border-slate-500 text-white"
              />
              <span className="flex items-center text-slate-300">%</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-slate-600 rounded border border-slate-500">
            <p className="text-slate-300 text-sm">
              <span className="font-semibold">Valor das Primeiras Parcelas:</span> {formatCurrency(valorPrimeiras)}
            </p>
          </div>
        </div>

        {/* Resumo Total */}
        <div className="space-y-3 p-4 bg-gradient-to-r from-amber-900 to-amber-950 rounded-lg border border-amber-700">
          <h3 className="text-amber-100 font-semibold text-lg">Resumo da Entrada</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-amber-800 rounded">
              <span className="text-amber-200">Ato ({atoLocal.toFixed(2)}%)</span>
              <span className="text-amber-100 font-bold">{formatCurrency(valorAto)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-amber-800 rounded">
              <span className="text-amber-200">Primeiras Parcelas ({primeirasLocal.toFixed(2)}%)</span>
              <span className="text-amber-100 font-bold">{formatCurrency(valorPrimeiras)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-amber-700 rounded border border-amber-600">
              <span className="text-amber-100 font-semibold">Total Entrada ({percentualTotal.toFixed(2)}%)</span>
              <span className="text-amber-200 font-bold text-lg">{formatCurrency(totalEntrada)}</span>
            </div>
          </div>

          {/* Validação */}
          <div className="mt-3 p-2 bg-amber-800 rounded text-amber-200 text-sm">
            <p>
              <span className="font-semibold">Mínimo Exigido (8%):</span> {formatCurrency(valorImovel * 0.08)}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Status:</span>{" "}
              <span className={isValidEntrada ? "text-green-400" : "text-red-400"}>
                {isValidEntrada ? "✓ OK ENTRADA" : "✗ INSUFICIENTE"}
              </span>
            </p>
          </div>
        </div>

        {/* Dica de Uso */}
        <div className="p-3 bg-slate-700 rounded border border-slate-600 text-slate-300 text-sm">
          <p className="font-semibold text-slate-200 mb-1">💡 Dica:</p>
          <p>
            Use os sliders para ajustar rapidamente os percentuais ou digite valores específicos nos campos de entrada. 
            Os valores são atualizados em tempo real na simulação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
