'use client';

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast" role="status">
      <span className="toast-dot" />
      {message}
    </div>
  );
}
