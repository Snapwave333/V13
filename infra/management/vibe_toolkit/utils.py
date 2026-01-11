import os
import sys
import logging
import subprocess
import json
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple

# EQ_PRISM PALETTE FOR TERMINAL
COLORS = {
    "sun": "\033[38;5;220m",
    "heat": "\033[38;5;202m",
    "blood": "\033[38;5;160m",
    "void": "\033[38;5;125m",
    "deep": "\033[38;5;53m",
    "reset": "\033[0m",
    "bold": "\033[1m"
}

class VibeLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Console Handler
        ch = logging.StreamHandler()
        formatter = logging.Formatter(f'{COLORS["sun"]}%(asctime)s{COLORS["reset"]} | {COLORS["bold"]}%(name)s{COLORS["reset"]} | %(message)s', '%H:%M:%S')
        ch.setFormatter(formatter)
        self.logger.addHandler(ch)
        
        # File Handler (Audit Log)
        log_dir = os.path.join(os.getcwd(), "infra", "build", "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, f"{name}_{datetime.now().strftime('%Y%m%d')}.log")
        fh = logging.FileHandler(log_path)
        fh.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
        self.logger.addHandler(fh)

    def info(self, msg: str): self.logger.info(msg)
    def warn(self, msg: str): self.logger.warning(f"{COLORS['heat']}WARN: {msg}{COLORS['reset']}")
    def error(self, msg: str): self.logger.error(f"{COLORS['blood']}ERROR: {msg}{COLORS['reset']}")
    def success(self, msg: str): self.logger.info(f"{COLORS['sun']}SUCCESS: {msg}{COLORS['reset']}")

def run_cmd(cmd: List[str], cwd: Optional[str] = None) -> Tuple[bool, str]:
    try:
        # Use shell=True for Windows compatibility with npm/batch files
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=False, shell=True)
        return result.returncode == 0, result.stdout if result.returncode == 0 else result.stderr
    except Exception as e:
        return False, str(e)

def get_root_dir() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

def save_report(data: Dict[str, Any], filename: str):
    report_dir = os.path.join(get_root_dir(), "infra", "build", "reports")
    os.makedirs(report_dir, exist_ok=True)
    path = os.path.join(report_dir, f"{filename}_{datetime.now().strftime('%H%M%S')}.json")
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)
    return path
