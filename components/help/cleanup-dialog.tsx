"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function CleanupDialog() {
  const [days, setDays] = useState("7")
  const [token, setToken] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const handleValidateToken = async () => {
    setIsValidating(true)
    setResult(null)
    try {
      if (!token.trim()) {
        throw new Error("Informe o codigo admin para continuar")
      }
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), dryRun: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao limpar")
      }
      setIsTokenValid(true)
      setResult("Codigo validado. Confirme a limpeza para continuar.")
    } catch (error) {
      setIsTokenValid(false)
      setResult(error instanceof Error ? error.message : "Falha ao validar")
    } finally {
      setIsValidating(false)
    }
  }

  const handleCleanup = async () => {
    setLoading(true)
    setResult(null)
    try {
      if (!token.trim() || !isTokenValid) {
        throw new Error("Valide o codigo antes de limpar")
      }
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number(days) || 7, token: token.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao limpar")
      }
      setResult(`Limpeza feita: ${data.removedRooms} sala(s) removida(s).`)
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Falha ao limpar")
    } finally {
      setLoading(false)
    }
  }

  const handleTokenChange = (value: string) => {
    setToken(value)
    setIsTokenValid(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11">
          Limpar jogos antigos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Limpar jogos antigos</DialogTitle>
          <DialogDescription>
            Remove salas antigas para limpar a base. Isso nao afeta salas recentes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block text-sm text-muted-foreground">
            Manter os ultimos (dias)
          </label>
          <Input
            type="number"
            min={1}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
          <label className="block text-sm text-muted-foreground">Codigo admin (obrigatorio)</label>
          <Input
            type="password"
            value={token}
            onChange={(event) => handleTokenChange(event.target.value)}
            placeholder="Informe o codigo"
          />
          {result && <p className="text-sm text-muted-foreground">{result}</p>}
        </div>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button onClick={handleValidateToken} disabled={isValidating || !token.trim()}>
              {isValidating ? "Validando..." : "Validar codigo"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={loading || !isTokenValid}
                >
                  {loading ? "Limpando..." : "Confirmar limpeza"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar limpeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acao remove salas antigas e seus dados. Isso nao pode ser desfeito.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanup}>Apagar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
