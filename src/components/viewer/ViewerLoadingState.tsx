'use client';

interface ViewerLoadingStateProps {
  progress?: number;
}

export function ViewerLoadingState({ progress }: ViewerLoadingStateProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-obsidian">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-border-subtle" />
        <div
          className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
          style={{ animationDuration: '1.5s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">
            {progress !== undefined ? `${Math.round(progress)}%` : ''}
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">Loading 3D Model</p>
      <p className="text-[10px] text-text-primary/40">Preparing your experience...</p>
    </div>
  );
}
