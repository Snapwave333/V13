import os
import time
from .utils import VibeLogger, run_cmd, save_report

logger = VibeLogger("VIBE_BENCH")

def run_benchmarks():
    logger.info("Starting Performance Benchmarking // Load Profile: STD_RUN")
    
    bench_data = {
        "latency_metrics": {},
        "throughput_estimation": "N/A",
        "timestamp": time.time()
    }

    # 1. Memory Profiling (Consolidated)
    logger.info("Gathering memory footprint history...")
    success, output = run_cmd(["docker", "stats", "--no-stream", "--format", "{{.Name}}\t{{.MemUsage}}"])
    if success:
        for line in output.strip().split('\n'):
            if line:
                name, usage = line.split('\t')
                bench_data["latency_metrics"][name] = usage
    else:
        logger.warn("Benchmark: Docker stats unavailable")

    # 2. Network Check (Localhost Latency)
    logger.info("Measuring internal gateway latency...")
    success, output = run_cmd(["powershell", "Test-NetConnection -ComputerName localhost -Port 3000"])
    if success:
        logger.info("Network Gateway: Reachable")
        bench_data["latency_metrics"]["gateway_3000"] = "Online"
    else:
        logger.warn("Network Gateway: Unreachable")

    # 3. Visual Telemetry (New Bridge)
    logger.info("Fetching visual telemetry from frontend bridge...")
    success, output = run_cmd(["python", "-c", "import urllib.request; print(urllib.request.urlopen('http://localhost:3001/api/v1/telemetry/visual').read().decode())"])
    if success:
        try:
            import json
            telemetry = json.loads(output)
            if telemetry.get("status") == "success":
                data = telemetry.get("data", {})
                bench_data["visual_metrics"] = {
                    "fps": data.get("fps", 0),
                    "resolution": data.get("resolution", "0x0"),
                    "last_sync": data.get("timestamp")
                }
                logger.info(f"Visual Profile: {bench_data['visual_metrics']['fps']} FPS @ {bench_data['visual_metrics']['resolution']}")
            else:
                logger.warn("Visual Telemetry: Success flag false")
        except Exception as e:
            logger.warn(f"Visual Telemetry: Failed to parse data - {e}")
    else:
        logger.warn("Visual Telemetry: Unreachable (Frontend/Middleware offline?)")

    # 4. AI Pipeline Metrics
    logger.info("Fetching AI pipeline performance metrics...")
    success, output = run_cmd(["python", "-c", "import urllib.request; print(urllib.request.urlopen('http://localhost:3000/api/v1/ai/metrics').read().decode())"])
    if success:
        try:
            import json
            ai_metrics = json.loads(output)
            bench_data["ai_metrics"] = ai_metrics
            logger.info(f"AI Profile: {ai_metrics.get('avg_latency_ms', 0):.2f}ms latency | {ai_metrics.get('cache_hits', 0)} hits")
        except Exception as e:
            logger.warn(f"AI Metrics: Failed to parse data - {e}")
    else:
        logger.warn("AI Metrics: Unreachable (Backend offline?)")

    report_path = save_report(bench_data, "benchmark_report")
    logger.success(f"Benchmark complete. Performance baseline saved: {report_path}")
    return bench_data
