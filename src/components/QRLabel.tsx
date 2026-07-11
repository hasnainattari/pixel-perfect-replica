import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function QRPanel({ url, assetName, assetCode, location }: {
  url: string; assetName: string; assetCode: string; location?: string | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  function downloadPNG() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${assetCode}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Scan-to-report label</div>
          <div className="text-xs text-muted-foreground">Print and attach to the asset</div>
        </div>
      </div>
      <div ref={wrapRef} className="mx-auto w-fit rounded-lg border bg-white p-4">
        <div className="mb-3 text-center">
          <div className="text-xs uppercase tracking-wider text-neutral-500">MaintainIQ</div>
          <div className="text-base font-semibold text-neutral-900">{assetName}</div>
          <div className="text-xs text-neutral-600">{assetCode}{location ? ` · ${location}` : ""}</div>
        </div>
        <QRCodeCanvas value={url} size={192} level="M" includeMargin={false} />
        <div className="mt-3 max-w-[220px] text-center text-[11px] leading-tight text-neutral-600">
          Scan to view status or report an issue with this equipment.
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={downloadPNG}>
          <Download className="mr-1.5 h-4 w-4" /> Download PNG
        </Button>
        <Button size="sm" variant="secondary" onClick={copyLink}>
          <Copy className="mr-1.5 h-4 w-4" /> Copy link
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-1.5 h-4 w-4" /> Open public page
          </a>
        </Button>
      </div>
    </div>
  );
}
