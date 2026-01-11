import subprocess
import requests
import json
import time

OLLAMA_API = "http://localhost:11434/api"

def get_installed_models():
    try:
        resp = requests.get(f"{OLLAMA_API}/tags")
        if resp.status_code == 200:
            return resp.json()['models']
    except Exception as e:
        print(f"API List failed: {e}")
    return []

def get_model_details(model_name):
    # Fallback to info API
    details = {}
    try:
        resp = requests.post(f"{OLLAMA_API}/show", json={"name": model_name})
        if resp.status_code == 200:
            data = resp.json()
            # print(data.keys())
            if 'details' in data:
                details.update(data['details'])
            if 'parameters' in data:
                details['parameters_len'] = len(data['parameters'])
            return details
    except:
        pass
    return details

def benchmark_model(model_name):
    prompt = "Explain quantum computing in one sentence."
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": 100,
            "temperature": 0.7
        }
    }
    
    try:
        start_t = time.time()
        resp = requests.post(f"{OLLAMA_API}/generate", json=payload)
        
        if resp.status_code == 200:
            data = resp.json()
            eval_count = data.get('eval_count', 0)
            eval_duration = data.get('eval_duration', 0) # nanoseconds
            
            if eval_duration > 0:
                tps = eval_count / (eval_duration / 1e9)
            else:
                tps = 0
                
            return {
                "success": True,
                "tps": tps,
                "eval_count": eval_count,
                "eval_duration_s": eval_duration / 1e9,
                "total_duration_s": data.get('total_duration', 0) / 1e9,
                "load_duration_s": data.get('load_duration', 0) / 1e9,
            }
    except Exception as e:
        return {"success": False, "error": str(e)}
    
    return {"success": False, "error": "Unknown Code"}

def main():
    models = get_installed_models()
    report = []
    
    print(f"Found {len(models)} models. Starting audit...")
    
    for m in models:
        name = m.get('name')
        print(f"Analyzing {name}...", end='', flush=True)
        
        size_gb = m.get('size', 0) / (1024**3)
        
        details = get_model_details(name)
        
        # Benchmark if reasonable size (< 20GB)
        metrics = {}
        if size_gb < 20: 
            metrics = benchmark_model(name)
            if metrics['success']:
                print(f" Done. {metrics['tps']:.2f} t/s")
            else:
                print(f" Failed: {metrics.get('error')}")
        else:
            print(" Skipped (Too Large)")
            metrics = {"success": False, "error": "Skipped > 20GB"}
            
        entry = {
            "name": name,
            "size_bytes": m.get('size'),
            "size_gb": size_gb,
            "details": details,
            "metrics": metrics
        }
        report.append(entry)
        
    with open("ollama_audit_results.json", "w") as f:
        json.dump(report, f, indent=2)
    print("Audit complete. Saved to ollama_audit_results.json")

if __name__ == "__main__":
    main()
