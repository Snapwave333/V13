import sys
import os
from vibe_toolkit.debug import run_audit

def main():
    # Run a lightweight version of the audit for healthchecks
    try:
        audit = run_audit()
        # Ensure all core apps are running
        essential_apps = ["backend", "middleware", "frontend"]
        for app in essential_apps:
            found = False
            for container in audit["containers"]:
                if app in container.lower() and "up" in audit["containers"][container].lower():
                    found = True
                    break
            if not found:
                print(f"Healthcheck Failed: {app} not running.")
                sys.exit(1)
        
        print("System Health: OPTIMAL")
        sys.exit(0)
    except Exception as e:
        print(f"Healthcheck Critical Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
