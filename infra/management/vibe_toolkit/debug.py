import os
import shutil
from .utils import VibeLogger, run_cmd, get_root_dir, save_report

logger = VibeLogger("VIBE_DEBUG")

def run_audit():
    logger.info("Starting System Audit // Identity: EQ_PRISM")
    
    audit_data = {
        "containers": {},
        "env_validation": {},
        "disk_space": {},
        "port_conflicts": []
    }

    # 1. Container Audit
    # Skipped: Docker removal (Local Build)
    logger.info("Skipping Container Audit (Local Environment)")

    # 2. Env Validation
    env_path = os.path.join(get_root_dir(), "infra", "config", ".env")
    if os.path.exists(env_path):
        audit_data["env_validation"]["exists"] = True
        logger.info(f"Environment configuration found at {env_path}")
    else:
        audit_data["env_validation"]["exists"] = False
        logger.error("CRITICAL: .env file missing in infra/config/")

    # 3. Disk Space Audit
    total, used, free = shutil.disk_usage("/")
    audit_data["disk_space"] = {
        "total_gb": total // (2**30),
        "used_gb": used // (2**30),
        "free_gb": free // (2**30)
    }
    logger.info(f"Disk space: {audit_data['disk_space']['free_gb']} GB available")

    report_path = save_report(audit_data, "audit_report")
    logger.success(f"Audit complete. Report generated: {report_path}")
    return audit_data
