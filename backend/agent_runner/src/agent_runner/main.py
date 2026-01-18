"""Main entrypoint for agent runner"""
import asyncio
import logging
import signal
import sys
from .config import Config
from .runner import JobRunner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

logger = logging.getLogger(__name__)


async def main():
    """Main entrypoint"""
    # Validate configuration
    config_errors = Config.validate()
    if config_errors:
        logger.error("Configuration errors:")
        for error in config_errors:
            logger.error(f"  - {error}")
        sys.exit(1)
    
    logger.info("Agent Runner starting...")
    logger.info(f"MongoDB: {Config.MONGO_DB_NAME}")
    logger.info(f"Workdir: {Config.WORKDIR_ROOT}")
    logger.info(f"Poll interval: {Config.RUNNER_POLL_SECONDS}s")
    
    # Create runner
    runner = JobRunner()
    
    # Setup signal handlers
    def signal_handler(sig, frame):
        logger.info("Received shutdown signal")
        asyncio.create_task(runner.shutdown())
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Initialize
        await runner.initialize()
        
        # Run loop
        await runner.run_loop()
        
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
    finally:
        # Cleanup
        await runner.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
