from fastapi import APIRouter, HTTPException, Depends
from services.prometheus_client import PromClient
from api.auth import get_current_user

router = APIRouter()
client = PromClient()

@router.get("/metrics/query_range_raw")
def query_range_raw(
    query: str,
    current_user: str = Depends(get_current_user),
    start: int = None,
    end: int = None,
    step: str = '15s'
):
    """Execute raw PromQL and return the raw Prometheus JSON response"""
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    
    try:
        return client.query_range_result_like_prom(query, start=start, end=end, step=step)
    except Exception as e:
        error_msg = str(e)
        if "400" in error_msg or "Bad Request" in error_msg:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid PromQL for range query. If using a range vector selector like [5m], wrap it in a function like rate() or irate(). Error: {error_msg}"
            )
        raise HTTPException(status_code=500, detail=error_msg)
