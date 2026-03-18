import threading
import logging
import time
import subprocess
import os
import signal
from services.k8s_client import K8sClient

logger = logging.getLogger(__name__)

class PortForwardManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(PortForwardManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.active_forwards = {} # local_port -> info (including process)
        self.k8s_client = K8sClient()
        self._initialized = True

    def start_forward(self, namespace, pod_name, remote_port, local_port):
        """
        Starts a port forward using kubectl port-forward as a subprocess.
        """
        if str(local_port) in self.active_forwards:
            return {"error": f"Port {local_port} is already in use. Please use another free port."}

        try:
            # Build kubectl command
            cmd = [
                "kubectl", "port-forward",
                f"pod/{pod_name}",
                f"{local_port}:{remote_port}",
                "-n", namespace,
                "--address", "0.0.0.0"
            ]

            # Pass kubeconfig context if applicable
            context = self.k8s_client.current_context
            if context:
                cmd.extend(["--context", context])

            # Override the server host since the kubeconfig uses localhost
            # and we are running inside a Docker container
            api_client = self.k8s_client.api_client
            if api_client and api_client.configuration:
                host = api_client.configuration.host
                if host:
                    cmd.extend(["--server", host])
                if not api_client.configuration.verify_ssl:
                    cmd.extend(["--insecure-skip-tls-verify=true"])

            logger.info(f"Executing: {' '.join(cmd)}")
            
            # Start the process in a new session so it doesn't receive our signals directly
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid
            )

            # Give it a tiny bit of time to fail immediately (e.g., port in use by OS)
            time.sleep(0.5)
            if process.poll() is not None:
                stderr = process.stderr.read().decode('utf-8')
                return {"error": f"Failed to start port forward: {stderr.strip()}"}

            self.active_forwards[str(local_port)] = {
                "namespace": namespace,
                "pod_name": pod_name,
                "remote_port": remote_port,
                "start_time": time.time(),
                "process": process
            }
            logger.info(f"Port forward started: {local_port} -> {pod_name}:{remote_port} (PID: {process.pid})")
            return {"success": True, "message": f"Port forward started on {local_port}", "local_port": local_port}

        except Exception as e:
            logger.error(f"Error starting port forward process: {e}")
            return {"error": str(e)}

    def stop_forward(self, local_port):
        local_port = str(local_port)
        if local_port in self.active_forwards:
            info = self.active_forwards[local_port]
            process = info.get("process")
            if process and process.poll() is None:
                logger.info(f"Stopping port forward on {local_port} (PID: {process.pid})")
                try:
                    # Kill the whole process group
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                    process.wait(timeout=2)
                except Exception as e:
                    logger.warning(f"Error terminating process group: {e}")
                    # Force kill if needed
                    try:
                        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                    except:
                        pass
            
            del self.active_forwards[local_port]
            return {"success": True, "message": f"Port forward {local_port} stopped"}
        return {"error": f"No active forward found for port {local_port}"}

    def list_forwards(self):
        return [
            {
                "local_port": lp,
                "pod_name": info["pod_name"],
                "namespace": info["namespace"],
                "remote_port": info["remote_port"],
                "age": int(time.time() - info["start_time"])
            }
            for lp, info in self.active_forwards.items()
        ]

    def get_forward_info(self, local_port_alias):
        return self.active_forwards.get(str(local_port_alias))

port_forward_manager = PortForwardManager()
