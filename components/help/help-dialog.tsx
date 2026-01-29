"use client"

import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type HelpDialogProps = {
  title: string
  description?: string
  steps: string[]
  tips?: string[]
  className?: string
}

export function HelpDialog({ title, description, steps, tips, className }: HelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          aria-label="Ajuda"
          className={cn("fixed bottom-4 right-4 z-50 rounded-full shadow-lg", className)}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-4">
          <ol className="space-y-2 text-sm text-muted-foreground">
            {steps.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-2">
                <span className="text-primary font-medium">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {tips && tips.length > 0 ? (
            <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Dica rápida</p>
              <ul className="mt-2 space-y-1">
                {tips.map((tip, index) => (
                  <li key={`${tip}-${index}`}>• {tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
