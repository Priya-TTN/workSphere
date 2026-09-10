import documentsData from '@/data/documents.json'
import { formatRelativeTime } from '@/lib/utils'
import type { Document } from '@/types'
import { FileText, File } from 'lucide-react'

export function DocumentsPage() {
  const documents = documentsData as Document[]

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Files & Documents</h2>
        <p className="text-slate-500 mt-1">
          {documents.length} documents · {documents.filter((d) => d.isNew).length} new updates
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center col-span-2">
          <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-medium text-slate-700">No Documents Uploaded</p>
          <p className="text-xs text-slate-500 mt-1">
            Uploaded files and shared documents will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                    {doc.isNew && (
                      <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <File className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{doc.type}</span>
                    <span className="text-xs text-slate-400">· Shared by {doc.sharedBy}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Updated {formatRelativeTime(doc.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
