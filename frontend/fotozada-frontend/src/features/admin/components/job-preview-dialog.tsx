import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export function JobPreviewDialog({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  async function onOpenChange(open: boolean) {
    if (open && !url) {
      const { data } = await supabase.storage.from("prints").createSignedUrl(path, 60);
      if (data?.signedUrl) setUrl(data.signedUrl);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" title="Visualizar">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pré-visualização</DialogTitle>
        </DialogHeader>
        {url ? (
          <img src={url} alt="Pré-visualização" className="max-h-[70vh] rounded bg-white" />
        ) : (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
