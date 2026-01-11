import argparse
import sys
from .utils import VibeLogger, COLORS
from .debug import run_audit
from .optimize import run_optimization
from .test_runner import run_tests
from .benchmark import run_benchmarks

def main():
    parser = argparse.ArgumentParser(
        description=f"{COLORS['sun']}V13 // VIBE_TOOLKIT [EQ_PRISM]{COLORS['reset']}",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Management Commands")

    # DEBUG
    subparsers.add_parser("debug", help="Run system diagnostics and audits")
    
    # OPTIMIZE
    subparsers.add_parser("optimize", help="Apply system optimizations and profiling")
    
    # TEST
    test_parser = subparsers.add_parser("test", help="Execute integrated test suites")
    test_parser.add_argument("--all", action="store_true", help="Run all service tests")
    test_parser.add_argument("--backend", action="store_true", help="Run Rust backend tests")
    
    # BENCH
    subparsers.add_parser("bench", help="Gather latency and throughput metrics")

    args = parser.parse_args()
    logger = VibeLogger("VIBE_CORE")

    if not args.command:
        parser.print_help()
        sys.exit(0)

    logger.info(f"Initializing Vibe Toolkit Core // Identity: EQ_PRISM")

    try:
        if args.command == "debug":
            run_audit()
        elif args.command == "optimize":
            run_optimization()
        elif args.command == "test":
            run_tests(args)
        elif args.command == "bench":
            run_benchmarks()
    except Exception as e:
        logger.error(f"Command execution failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
