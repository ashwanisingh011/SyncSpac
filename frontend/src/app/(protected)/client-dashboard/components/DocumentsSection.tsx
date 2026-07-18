'use client';

import { FileText, Download, ChevronRight, FileCode, FileImage, FileSpreadsheet, FileArchive, File as FileIcon } from 'lucide-react';
import type { IFile } from '@/api/files';

interface DocumentsSectionProps {
  files: IFile[];
  onTabChange?: (tab: string) => void;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType?: string, name?: string) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) {
    return <FileImage className="w-4 h-4 text-pink-500" />;
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext || '')) {
    return <FileArchive className="w-4 h-4 text-amber-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  }
  if (['js', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'go'].includes(ext || '')) {
    return <FileCode className="w-4 h-4 text-blue-500" />;
  }
  if (['pdf'].includes(ext || '')) {
    return <FileText className="w-4 h-4 text-red-500" />;
  }
  return <FileIcon className="w-4 h-4 text-slate-400" />;
};

export default function DocumentsSection({ files, onTabChange }: DocumentsSectionProps): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-805 dark:text-white">Recent Documents</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Quick access to project attachments</p>
          </div>
        </div>
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => onTabChange?.('documents')}
            className="text-xs font-bold text-blue-605 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <p className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-3">
          {files.map((doc) => (
            <li
              key={doc._id}
              className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 px-3.5 py-3 hover:bg-slate-100/60 dark:hover:bg-slate-850/40 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  {getFileIcon(doc.mimeType, doc.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[180px] sm:max-w-[240px]">
                    {doc.name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono mt-0.5">
                    {formatBytes(doc.fileSize)}
                  </p>
                </div>
              </div>
              <a
                href={doc.fileUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-150/45 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-indigo-400 transition-colors"
                aria-label={`Download ${doc.name}`}
              >
                <Download className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
