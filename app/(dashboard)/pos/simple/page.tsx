import { POSPanel } from "@/components/pos/pos-panel"

export default function SimplePOSPage() {
  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md mx-auto h-full">
        <POSPanel />
      </div>
    </div>
  )
}