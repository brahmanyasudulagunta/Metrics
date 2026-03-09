from fastapi import APIRouter, Depends
from services.prometheus_client import PromClient
from api.auth import get_current_user

router = APIRouter()
client = PromClient()

@router.get("/metrics/optimization")
def resource_optimization(current_user: str = Depends(get_current_user)):
    """Calculate resource over-provisioning (Waste) by comparing requests vs actual usage"""
    try:
        mem_req_query = 'sum(kube_pod_container_resource_requests{resource="memory"}) by (namespace, pod)'
        mem_req_res = client.query(mem_req_query)

        mem_usage_query = 'sum(avg_over_time(container_memory_working_set_bytes{container!="POD", container!=""}[1h])) by (namespace, pod)'
        mem_usage_res = client.query(mem_usage_query)
        
        requests_map = {}
        for res in mem_req_res.get("data", {}).get("result", []):
            metric = res.get("metric", {})
            key = f'{metric.get("namespace", "")}/{metric.get("pod", "")}'
            if metric.get("pod"): 
                val = float(res.get("value", [0, 0])[1])
                requests_map[key] = val

        usage_map = {}
        for res in mem_usage_res.get("data", {}).get("result", []):
            metric = res.get("metric", {})
            key = f'{metric.get("namespace", "")}/{metric.get("pod", "")}'
            if metric.get("pod"):
                val = float(res.get("value", [0, 0])[1])
                usage_map[key] = val

        optimizations = []
        for key, req_bytes in requests_map.items():
            if key in usage_map:
                use_bytes = usage_map[key]
                waste_bytes = req_bytes - use_bytes
                
                if waste_bytes > 10 * 1024 * 1024:
                    parts = key.split("/")
                    optimizations.append({
                        "namespace": parts[0],
                        "pod": parts[1] if len(parts) > 1 else "",
                        "container": "All",
                        "requested_mb": round(req_bytes / (1024*1024), 2),
                        "used_mb": round(use_bytes / (1024*1024), 2),
                        "waste_mb": round(waste_bytes / (1024*1024), 2)
                    })
        
        optimizations.sort(key=lambda x: x["waste_mb"], reverse=True)
        total_waste_mb = sum(opt["waste_mb"] for opt in optimizations)
        estimated_monthly_waste = round((total_waste_mb / 1024) * 10, 2)
        
        return {
            "optimizations": optimizations,
            "total_waste_mb": round(total_waste_mb, 2),
            "estimated_monthly_waste_usd": estimated_monthly_waste
        }
    except Exception as e:
        return {"error": str(e), "optimizations": [], "total_waste_mb": 0, "estimated_monthly_waste_usd": 0}
