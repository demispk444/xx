import { useState, useEffect, useRef } from 'react';
import { Scroll, Trash2, Download } from 'lucide-react';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface LogPaneProps {
  logs: LogEntry[];
  onClear: () => void;
  className?: string;
}

export function LogPane({ logs, onClear, className = '' }: LogPaneProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Check if user has scrolled up (disable auto-scroll)
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 5;
      setAutoScroll(isAtBottom);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return '•';
    }
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${formatTime(log.timestamp)}] ${log.level.toUpperCase()}: ${log.message}${log.details ? ' - ' + log.details : ''}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operation_log_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col bg-white border border-gray-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-300 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Scroll className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-sm text-gray-900">Operation Log</h3>
          <span className="text-xs text-gray-500">({logs.length} entries)</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="flex items-center space-x-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            <span>Export</span>
          </button>
          
          <button
            onClick={onClear}
            disabled={logs.length === 0}
            className="flex items-center space-x-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && logs.length > 0 && (
        <div className="px-2 py-1 bg-yellow-50 border-b border-yellow-200">
          <button
            onClick={() => {
              setAutoScroll(true);
              logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs text-yellow-800 hover:underline"
          >
            ↓ Auto-scroll disabled. Click to resume and scroll to bottom.
          </button>
        </div>
      )}

      {/* Log entries */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs leading-relaxed"
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No operations logged yet
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500 mr-2">
                [{formatTime(log.timestamp)}]
              </span>
              <span className={`mr-2 ${getLevelColor(log.level)}`}>
                {getLevelIcon(log.level)}
              </span>
              <span className={getLevelColor(log.level)}>
                {log.message}
              </span>
              {log.details && (
                <div className="ml-20 text-gray-600 mt-1">
                  {log.details}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

// Hook for managing logs
export function useOperationLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogEntry['level'], message: string, details?: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date(),
      level,
      message,
      details
    }]);
  };

  const clearLogs = () => setLogs([]);

  return {
    logs,
    addLog,
    clearLogs,
    info: (message: string, details?: string) => addLog('info', message, details),
    success: (message: string, details?: string) => addLog('success', message, details),
    warning: (message: string, details?: string) => addLog('warning', message, details),
    error: (message: string, details?: string) => addLog('error', message, details)
  };
}