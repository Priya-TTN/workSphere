import excelData from '@/data/excel.json'
import { formatRelativeTime } from '@/lib/utils'
import type { ExcelFile } from '@/types'
import { Table2, AlertCircle } from 'lucide-react'

export function ExcelPage() {
  const files = excelData as ExcelFile[]

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Excel Insights</h2>
        <p className="text-slate-500 mt-1">
          {files.length} files · {files.filter((f) => f.needsReview).length} needs review
        </p>
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50">
                <Table2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                  {file.needsReview && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      Needs Review
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{file.description}</p>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Last modified {formatRelativeTime(file.lastModified)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
