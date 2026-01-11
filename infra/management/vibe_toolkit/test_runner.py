import os
from .utils import VibeLogger, run_cmd, get_root_dir, save_report

logger = VibeLogger("VIBE_TEST")

def run_tests(args):
    logger.info("Initializing Integrated Test Suite // Tech Stack: Rust, Node, Angular")
    
    test_results = {
        "summary": "Partial Execution",
        "detailed": []
    }

    root = get_root_dir()

    # 1. Backend Tests (Rust)
    if args.all or args.backend:
        logger.info("Executing Rust Backend Tests...")
        success, output = run_cmd(["cargo", "test"], cwd=os.path.join(root, "apps", "backend"))
        result = "PASSED" if success else "FAILED"
        test_results["detailed"].append({"module": "backend", "status": result, "logs": output if not success else "Success"})
        if success: logger.success("Backend Validation: PASSED")
        else: logger.error("Backend Validation: FAILED")

    # 2. Middleware Tests (Node)
    if args.all:
        logger.info("Executing Middleware Tests (Node/TS)...")
        success, output = run_cmd(["npm", "test"], cwd=os.path.join(root, "apps", "middleware"))
        result = "PASSED" if success else "FAILED"
        test_results["detailed"].append({"module": "middleware", "status": result, "logs": output if not success else "Success"})
        if success: logger.success("Middleware Validation: PASSED")
        else: logger.error("Middleware Validation: FAILED")

    # 3. Frontend Tests (Angular)
    if args.all:
        logger.info("Executing Frontend Tests (Angular/Karma)...")
        # Using --watch=false for CI-style run
        success, output = run_cmd(["npm", "test", "--", "--watch=false", "--browsers=ChromeHeadless"], cwd=os.path.join(root, "apps", "frontend"))
        result = "PASSED" if success else "FAILED"
        test_results["detailed"].append({"module": "frontend", "status": result, "logs": output if not success else "Success"})
        if success: logger.success("Frontend Validation: PASSED")
        else: logger.error("Frontend Validation: FAILED")

    report_path = save_report(test_results, "test_report")
    logger.success(f"Testing phase complete. Report: {report_path}")
    return test_results
