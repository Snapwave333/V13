# Troubleshooting Guide: VIBES v13

This guide covers common issues related to Hardware setup and Runtime operations.

## Quick Verification Checklist

Before diving deep, ensure:
- [ ] **Ollama** is running (`ollama serve`) and model is pulled (`llama3:8b`).
- [ ] **Windows Audio** has "Stereo Mix" enabled and set as default format (44.1kHz or 48kHz).
- [ ] **Browser** has Hardware Acceleration enabled.

---

## 1. Audio Subsystem (Windows)

### "No Audio Input Detected" / Idle State
**Symptom**: The visualizer remains in "Idle" mode despite music playing.
- **Cause**: The backend is not capturing the system audio loopback.
- **Resolution**:
    1.  Open **Sound Settings** -> **Manage Audio Devices**.
    2.  Ensure **Stereo Mix** is Enabled.
    3.  **Critical**: Set Stereo Mix as the **Default Recording Device**.
    4.  Check backend logs for: `Input device: Stereo Mix (Realtek...)`.

### "Device Not Found" / Backend Crash
**Symptom**: Backend panic with "Host has no input device".
- **Resolution**:
    - Disconnect any USB headsets interfering with default WASAPI routing.
    - Explicitly set `CPAL_HOST=wasapi` in your environment if using ASIO drivers elsewhere.

---



## 3. Networking & Connectivity

### "WebSocket Disconnected" Loop
**Symptom**: Frontend HUD flashes "Reconnecting...".
- **Cause**: Port mismatch or Firewall blocking port 3000.
- **Resolution**:
    - Ensure port `3000` (Backend) and `3001` (Middleware) are allowed through Windows Firewall.
    - Check browser console for CORS errors. If seen, verify `CORS_ALLOWED_ORIGINS` in `.env`.

### "Unauthorized" (401) on API Calls
**Symptom**: Controls fail with `401 Unauthorized`.
- **Cause**: Expired or missing JWT token.
- **Resolution**:
    - Reload the page to refresh the session.
    - Check Middleware logs (console output) for "Invalid Token" messages.

---

## 4. Frontend & Graphics

### Low FPS (< 30Hz)
**Symptom**: Stuttering visuals on high-end hardware.
- **Cause**: Browser unoptimised for WebGL2 or 4K Canvas.
- **Resolution**:
    - Resize browser window (The app uses Dynamic Resolution Scaling).
    - Go to `chrome://settings/system` -> Enable "Use graphics acceleration".
    - Visit `chrome://gpu` to verify WebGL2 support.

### "WebGL Context Lost"
**Symptom**: Black screen after running for a while.
- **Cause**: GPU Driver crash or TDR delay.
- **Resolution**:
    - Refresh the page (Application handles context restoration automatically).
    - Decrease `resolution_scale` in settings if system is overheating.

---

## Support & Diagnostics

Run the diagnostic script to generate a full system health report:

```powershell
powershell -File scripts/Update-Docs.ps1 -DiagnosticOnly
```
