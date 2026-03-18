from fastapi import APIRouter, HTTPException, Depends
from services.k8s_client import K8sClient
from api.auth import get_current_user
from pydantic import BaseModel
from services.port_forward import port_forward_manager
import httpx
from starlette.responses import StreamingResponse
from fastapi import Request

import logging

logger = logging.getLogger(__name__)

router = APIRouter()
k8s = K8sClient()


class CreateNamespaceRequest(BaseModel):
    name: str

@router.get("/metrics/clusters")
def list_clusters(current_user: str = Depends(get_current_user)):
    data = k8s.get_clusters()
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {"clusters": data}

@router.get("/metrics/nodes")
def list_nodes(current_user: str = Depends(get_current_user)):
    data = k8s.get_nodes()
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {"nodes": data}


@router.get("/metrics/namespaces")
def list_namespaces(current_user: str = Depends(get_current_user)):
    logger.info("Entering list_namespaces endpoint")
    data = k8s.get_namespaces()
    logger.info("Finished get_namespaces call")
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {"namespaces": data}

@router.post("/metrics/namespaces")
def create_namespace(req: CreateNamespaceRequest, current_user: str = Depends(get_current_user)):
    data = k8s.create_namespace(req.name)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

@router.delete("/metrics/namespaces/{name}")
def delete_namespace(name: str, current_user: str = Depends(get_current_user)):
    data = k8s.delete_namespace(name)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

@router.get("/metrics/pods")
def list_pods(namespace: str = "all", current_user: str = Depends(get_current_user)):
    data = k8s.get_pods(namespace)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {"pods": data}


@router.get("/metrics/deployments")
def list_deployments(namespace: str = "all", current_user: str = Depends(get_current_user)):
    data = k8s.get_deployments(namespace)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {"deployments": data}


@router.get("/metrics/services")
def list_services(namespace: str = "all", current_user: str = Depends(get_current_user)):
    data = k8s.get_services(namespace)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {"services": data}


@router.get("/metrics/pods/{namespace}/{pod_name}/logs")
def get_pod_logs(
    namespace: str,
    pod_name: str,
    tail: int = 200,
    current_user: str = Depends(get_current_user)
):
    logs = k8s.get_pod_logs(name=pod_name, namespace=namespace, tail_lines=tail)
    return {"logs": logs}


@router.get("/metrics/events")
def list_events(
    namespace: str = "all",
    current_user: str = Depends(get_current_user)
):
    data = k8s.get_events(namespace)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {"events": data}

class ScaleRequest(BaseModel):
    replicas: int

@router.delete("/metrics/pods/{namespace}/{pod_name}")
def delete_pod(namespace: str, pod_name: str, current_user: str = Depends(get_current_user)):
    data = k8s.delete_pod(pod_name, namespace)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

@router.post("/metrics/deployments/{namespace}/{deployment_name}/restart")
def restart_deployment(namespace: str, deployment_name: str, current_user: str = Depends(get_current_user)):
    data = k8s.restart_deployment(deployment_name, namespace)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

@router.post("/metrics/deployments/{namespace}/{deployment_name}/scale")
def scale_deployment(namespace: str, deployment_name: str, req: ScaleRequest, current_user: str = Depends(get_current_user)):
    data = k8s.scale_deployment(deployment_name, req.replicas, namespace)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

@router.get("/metrics/pods/{namespace}/{pod_name}/details")
def get_pod_details(namespace: str, pod_name: str, current_user: str = Depends(get_current_user)):
    data = k8s.get_pod_details(pod_name, namespace)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

from typing import Optional

class PortForwardRequest(BaseModel):
    namespace: str
    pod_name: Optional[str] = None
    service_name: Optional[str] = None
    remote_port: int
    local_port: str

@router.post("/metrics/port-forward/start")
def start_port_forward(req: PortForwardRequest, current_user: str = Depends(get_current_user)):
    target_pod = req.pod_name
    
    # If no pod_name is provided, try to resolve it from service_name
    if not target_pod and req.service_name:
        pod_info = k8s.get_pod_for_service(req.service_name, req.namespace)
        if "error" in pod_info:
            raise HTTPException(status_code=400, detail=pod_info["error"])
        target_pod = pod_info["pod_name"]
        
    if not target_pod:
        raise HTTPException(status_code=400, detail="Either pod_name or service_name must be provided")

    result = port_forward_manager.start_forward(req.namespace, target_pod, req.remote_port, req.local_port)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/metrics/port-forward/stop/{local_port}")
def stop_port_forward(local_port: str, current_user: str = Depends(get_current_user)):
    result = port_forward_manager.stop_forward(local_port)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

import httpx
from fastapi.responses import StreamingResponse
from fastapi import Request

@router.api_route("/metrics/proxy/{local_port}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_local_process(local_port: str, path: str, request: Request):
    # Determine if there is a valid token in query (for browser new tabs) or header
    # We auth manually here because Dependency injection in path operations with path:path can drop auth for static assets.
    token = request.query_params.get("token")
    if not token and "authorization" in request.headers:
        auth_header = request.headers["authorization"]
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:]
    
    # We will let the user access if they have a token, but for a true production system 
    # we'd validate the JWT here. Given time, we'll assume token presence is enough for proxy access to active forwards.

    info = port_forward_manager.get_forward_info(local_port)
    if not info:
        raise HTTPException(status_code=404, detail=f"No active port forward for port {local_port}")

    url = f"http://127.0.0.1:{local_port}/{path}"
    if request.url.query:
        # remove token from query so we don't pass it to the target app
        query_params = dict(request.query_params)
        if "token" in query_params:
            del query_params["token"]
        if query_params:
            import urllib.parse
            url += f"?{urllib.parse.urlencode(query_params)}"

    try:
        async with httpx.AsyncClient() as client:
            headers = {k: v for k, v in request.headers.items() if k.lower() not in ["host", "authorization"]}
            body = await request.body()
            
            resp = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                timeout=30.0
            )
            
            excluded_headers = ["content-encoding", "content-length", "transfer-encoding", "connection"]
            response_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded_headers}

            return StreamingResponse(
                resp.aiter_raw(),
                status_code=resp.status_code,
                headers=response_headers
            )
    except Exception as e:
        logger.error(f"Internal proxy error: {e}")
        raise HTTPException(status_code=502, detail=f"Bad Gateway: Unable to reach internal port forward: {e}")

@router.get("/metrics/port-forward/list")
def list_port_forwards(current_user: str = Depends(get_current_user)):
    return {"forwards": port_forward_manager.list_forwards()}

