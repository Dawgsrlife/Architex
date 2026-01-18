"""Utility functions for agent runner"""
import logging
import re
from typing import Callable, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def sanitize_log_line(line: str) -> str:
    """Remove sensitive information from log lines"""
    # Remove tokens from URLs
    line = re.sub(
        r'(https?://)([^@]+@)?([^\s]+)',
        lambda m: m.group(1) + ('***@' if m.group(2) else '') + m.group(3).split('@')[-1],
        line
    )
    
    # Remove potential token patterns
    line = re.sub(r'(token|key|secret|password)\s*[:=]\s*[\w\-_\.]+', r'\1: ***', line, flags=re.IGNORECASE)
    
    return line


def format_exception(exc: Exception, include_traceback: bool = False) -> str:
    """Format exception for logging without secrets"""
    message = f"{type(exc).__name__}: {str(exc)}"
    
    if include_traceback:
        import traceback
        tb = traceback.format_exc()
        # Filter out lines with potential secrets
        tb_lines = tb.split('\n')
        filtered_lines = [sanitize_log_line(line) for line in tb_lines]
        message += f"\n{''.join(filtered_lines)}"
    
    return sanitize_log_line(message)


def truncate_logs(logs: list[str], max_lines: int = 500) -> list[str]:
    """Truncate logs to maximum number of lines, keeping most recent"""
    if len(logs) <= max_lines:
        return logs
    return logs[-max_lines:]


def get_timestamp() -> datetime:
    """Get current UTC timestamp"""
    return datetime.utcnow()


class LogBuffer:
    """Buffer for batching log writes to MongoDB"""
    
    def __init__(self, max_buffer_size: int = 20, flush_interval_seconds: float = 1.0):
        self.max_buffer_size = max_buffer_size
        self.flush_interval_seconds = flush_interval_seconds
        self.buffer: list[str] = []
        self.last_flush: datetime = get_timestamp()
        self.on_flush: Optional[Callable[[list[str]], None]] = None
    
    def append(self, line: str) -> None:
        """Append a log line to buffer"""
        self.buffer.append(line)
        
        # Check if flush needed
        now = get_timestamp()
        should_flush = (
            len(self.buffer) >= self.max_buffer_size or
            (now - self.last_flush).total_seconds() >= self.flush_interval_seconds
        )
        
        if should_flush and self.buffer:
            self.flush()
    
    def flush(self) -> None:
        """Flush buffer to callback"""
        if self.buffer and self.on_flush:
            self.on_flush(list(self.buffer))
            self.buffer.clear()
            self.last_flush = get_timestamp()
    
    def set_flush_callback(self, callback: Callable[[list[str]], None]) -> None:
        """Set callback for flushing logs"""
        self.on_flush = callback
