import socketio
import logging

logger = logging.getLogger(__name__)

class SocketManager:
    def __init__(self):
        self.sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
        self.app = socketio.ASGIApp(self.sio)
    
    async def emit_log(self, message: str, job_id: str = None):
        """Emit a log message to clients"""
        try:
            payload = {"type": "log", "message": message}
            if job_id:
                payload["job_id"] = job_id
            
            await self.sio.emit('message', payload)
            logger.info(f"Emitted log: {message}")
        except Exception as e:
            logger.error(f"Failed to emit socket message: {e}")

    async def emit_status(self, status: str, job_id: str):
        """Emit job status update"""
        try:
            await self.sio.emit('status', {"type": "status", "job_id": job_id, "status": status})
        except Exception as e:
            logger.error(f"Failed to emit status: {e}")

# Global instance
socket_manager = SocketManager()
