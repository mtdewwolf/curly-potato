import { FileText } from "lucide-react";

import type { PolicyDocument } from "@/lib/supabase/types";

export function PolicyDocumentList({ documents }: { documents: PolicyDocument[] }) {
  if (!documents.length) {
    return <p className="text-sm text-slate-500">No active policy documents are configured yet.</p>;
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <a
          key={document.id}
          href={document.url}
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-cyan-300"
          target="_blank"
          rel="noreferrer"
        >
          <FileText className="mt-1 h-4 w-4 text-cyan-600" />
          <div>
            <p className="font-semibold text-slate-950">{document.title || document.document_type}</p>
            <p className="text-sm text-slate-500">{document.document_type}</p>
            <p className="mt-1 break-all text-xs text-slate-400">{document.url}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
