import React from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';

interface DisplayStateProps {
  title?: string;
  message?: string;
  compact?: boolean;
}

interface ActionStateProps extends DisplayStateProps {
  actionLabel?: string;
  onAction?: () => void;
}

const wrapperClass = (compact?: boolean): string =>
  `rounded-3xl border bg-white/90 text-center shadow-sm ${compact ? 'p-5' : 'p-8 md:p-12'}`;

export const LoadingState: React.FC<DisplayStateProps> = ({
  title = 'Cargando información',
  message = 'Esto tomará solo un momento.',
  compact,
}) => (
  <div className={`${wrapperClass(compact)} border-brand-100`} role="status" aria-live="polite">
    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
    <p className="font-semibold text-slate-900">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{message}</p>
  </div>
);

export const ErrorState: React.FC<ActionStateProps> = ({
  title = 'No pudimos cargar esta información',
  message = 'Revisa tu conexión e inténtalo nuevamente.',
  actionLabel = 'Reintentar',
  onAction,
  compact,
}) => (
  <div className={`${wrapperClass(compact)} border-red-100`} role="alert">
    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" aria-hidden="true" />
    <p className="font-semibold text-slate-900">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{message}</p>
    {onAction && (
      <button
        type="button"
        onClick={onAction}
        className="brand-focus mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {actionLabel}
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<ActionStateProps> = ({
  title = 'Aún no hay información',
  message = 'Los datos aparecerán aquí cuando estén disponibles.',
  actionLabel,
  onAction,
  compact,
}) => (
  <div className={`${wrapperClass(compact)} border-slate-200`}>
    <Inbox className="mx-auto mb-3 h-8 w-8 text-slate-400" aria-hidden="true" />
    <p className="font-semibold text-slate-900">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{message}</p>
    {onAction && actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="brand-gradient brand-focus mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
