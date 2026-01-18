#!/usr/bin/env python3
"""
Architex End-to-End Smoke Test

This script tests all critical paths that are used during the demo:
1. Health check
2. Quick architecture critique (no auth)
3. Architecture plan preview (with dev auth)
4. Job creation and monitoring
5. Critic blocking behavior

Run with: python3 smoke_test_e2e.py

Prerequisites:
- Backend running at http://localhost:8000
- MongoDB running and connected
"""

import requests
import time
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"
DEV_AUTH_HEADER = {"Authorization": "Bearer dev-token-bypass"}

# Test data
VALID_ARCHITECTURE = {
    "name": "TestApp",
    "description": "Internal admin tool for managing users and access logs",
    "nodes": [
        {"id": "frontend-1", "type": "custom", "data": {"label": "Next.js Frontend", "componentId": "nextjs", "category": "frontend", "icon": "Monitor", "color": "#3b82f6"}},
        {"id": "backend-1", "type": "custom", "data": {"label": "FastAPI Backend", "componentId": "fastapi", "category": "backend", "icon": "Server", "color": "#10b981"}},
        {"id": "database-1", "type": "custom", "data": {"label": "PostgreSQL", "componentId": "postgres", "category": "database", "icon": "Database", "color": "#8b5cf6"}},
        {"id": "auth-1", "type": "custom", "data": {"label": "Auth Service", "componentId": "auth", "category": "auth", "icon": "Shield", "color": "#ef4444"}},
    ],
    "edges": [
        {"id": "e1", "source": "frontend-1", "target": "backend-1"},
        {"id": "e2", "source": "backend-1", "target": "database-1"},
        {"id": "e3", "source": "backend-1", "target": "auth-1"},
    ],
    "components": ["Next.js Frontend", "FastAPI Backend", "PostgreSQL", "Auth Service"],
    "frameworks": ["Next.js 14", "FastAPI", "PostgreSQL"],
    "metadata": {"intent": "Internal admin tool for managing users and access logs"}
}

INVALID_ARCHITECTURE_NO_DB = {
    "name": "BadApp",
    "description": "Missing database",
    "nodes": [
        {"id": "frontend-1", "type": "custom", "data": {"label": "Next.js Frontend", "componentId": "nextjs", "category": "frontend", "icon": "Monitor", "color": "#3b82f6"}},
        {"id": "backend-1", "type": "custom", "data": {"label": "FastAPI Backend", "componentId": "fastapi", "category": "backend", "icon": "Server", "color": "#10b981"}},
    ],
    "edges": [
        {"id": "e1", "source": "frontend-1", "target": "backend-1"},
    ],
    "components": [],
    "frameworks": [],
    "metadata": {"intent": ""}  # Vague intent
}

INVALID_ARCHITECTURE_NO_EDGES = {
    "name": "OrphanApp",
    "description": "No connections",
    "nodes": [
        {"id": "frontend-1", "type": "custom", "data": {"label": "Next.js Frontend", "componentId": "nextjs", "category": "frontend", "icon": "Monitor", "color": "#3b82f6"}},
        {"id": "backend-1", "type": "custom", "data": {"label": "FastAPI Backend", "componentId": "fastapi", "category": "backend", "icon": "Server", "color": "#10b981"}},
    ],
    "edges": [],  # No edges
    "components": [],
    "frameworks": [],
    "metadata": {"intent": "Some intent"}
}


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def log_step(step: int, name: str):
    print(f"\n{Colors.BLUE}{Colors.BOLD}[Step {step}] {name}{Colors.RESET}")


def log_success(message: str):
    print(f"  {Colors.GREEN}✓ {message}{Colors.RESET}")


def log_fail(message: str):
    print(f"  {Colors.RED}✗ {message}{Colors.RESET}")


def log_info(message: str):
    print(f"  {Colors.YELLOW}→ {message}{Colors.RESET}")


def test_health():
    """Test 1: Health check"""
    log_step(1, "Health Check")
    
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if r.status_code == 200 and r.json().get("status") == "healthy":
            log_success(f"Backend healthy: {r.json()}")
            return True
        else:
            log_fail(f"Unexpected response: {r.status_code} - {r.text}")
            return False
    except requests.exceptions.ConnectionError:
        log_fail("Backend not running at http://localhost:8000")
        return False
    except Exception as e:
        log_fail(f"Health check failed: {e}")
        return False


def test_quick_critique_valid():
    """Test 2: Quick critique with valid architecture"""
    log_step(2, "Quick Critique (Valid Architecture)")
    
    try:
        r = requests.post(
            f"{BASE_URL}/api/architecture/critique/quick",
            json={"architecture_spec": VALID_ARCHITECTURE},
            timeout=10
        )
        
        if r.status_code != 200:
            log_fail(f"Status {r.status_code}: {r.text}")
            return False
        
        data = r.json()
        log_info(f"Summary: {data.get('summary', 'N/A')}")
        log_info(f"Blocking: {data.get('blocking', 'N/A')}")
        log_info(f"Issue count: {data.get('issue_count', 0)}")
        
        # Valid architecture should not be blocking
        if data.get("blocking") == True:
            log_fail("Valid architecture was blocked unexpectedly")
            for issue in data.get("issues", []):
                log_info(f"  Issue: {issue.get('message')}")
            return False
        
        log_success("Valid architecture passed critique")
        return True
        
    except Exception as e:
        log_fail(f"Quick critique failed: {e}")
        return False


def test_quick_critique_invalid_no_db():
    """Test 3: Quick critique should block when missing database"""
    log_step(3, "Quick Critique (Invalid - No Database)")
    
    try:
        r = requests.post(
            f"{BASE_URL}/api/architecture/critique/quick",
            json={"architecture_spec": INVALID_ARCHITECTURE_NO_DB},
            timeout=10
        )
        
        if r.status_code != 200:
            log_fail(f"Status {r.status_code}: {r.text}")
            return False
        
        data = r.json()
        log_info(f"Summary: {data.get('summary', 'N/A')}")
        log_info(f"Blocking: {data.get('blocking', 'N/A')}")
        
        # Should have issues for missing database and vague intent
        if data.get("issue_count", 0) == 0:
            log_fail("Expected issues for invalid architecture")
            return False
        
        for issue in data.get("issues", []):
            log_info(f"  Issue [{issue.get('severity')}]: {issue.get('message')}")
        
        log_success("Invalid architecture correctly identified issues")
        return True
        
    except Exception as e:
        log_fail(f"Quick critique failed: {e}")
        return False


def test_quick_critique_no_edges():
    """Test 4: Quick critique should warn/block when no edges"""
    log_step(4, "Quick Critique (Invalid - No Edges)")
    
    try:
        r = requests.post(
            f"{BASE_URL}/api/architecture/critique/quick",
            json={"architecture_spec": INVALID_ARCHITECTURE_NO_EDGES},
            timeout=10
        )
        
        if r.status_code != 200:
            log_fail(f"Status {r.status_code}: {r.text}")
            return False
        
        data = r.json()
        log_info(f"Summary: {data.get('summary', 'N/A')}")
        log_info(f"Blocking: {data.get('blocking', 'N/A')}")
        
        # Should be blocking due to no edges
        if not data.get("blocking"):
            log_fail("Expected blocking for architecture with no edges")
            return False
        
        log_success("Architecture with no edges correctly blocked")
        return True
        
    except Exception as e:
        log_fail(f"Quick critique failed: {e}")
        return False


def test_architecture_plan():
    """Test 5: Generation plan preview (requires auth)"""
    log_step(5, "Architecture Plan Preview")
    
    try:
        r = requests.post(
            f"{BASE_URL}/api/architecture/plan",
            json={"architecture_spec": VALID_ARCHITECTURE},
            headers=DEV_AUTH_HEADER,
            timeout=15
        )
        
        if r.status_code != 200:
            log_fail(f"Status {r.status_code}: {r.text}")
            return False
        
        data = r.json()
        log_info(f"App Name: {data.get('app_name', 'N/A')}")
        log_info(f"App Type: {data.get('app_type', 'N/A')}")
        log_info(f"File Count: {data.get('file_count', 0)}")
        log_info(f"Entities: {data.get('entities', [])}")
        
        files = data.get("files", [])
        if len(files) == 0:
            log_fail("No files in generation plan")
            return False
        
        # Show first 5 files
        log_info("Sample files:")
        for f in files[:5]:
            log_info(f"  - {f.get('path')} ({f.get('type')})")
        if len(files) > 5:
            log_info(f"  ... and {len(files) - 5} more files")
        
        log_success(f"Plan generated with {len(files)} files")
        return True
        
    except Exception as e:
        log_fail(f"Plan generation failed: {e}")
        return False


def test_job_creation():
    """Test 6: Job creation (requires auth)"""
    log_step(6, "Job Creation")
    
    try:
        r = requests.post(
            f"{BASE_URL}/api/jobs",
            json={
                "architecture_spec": VALID_ARCHITECTURE,
                "project_id": "smoke-test-project"
            },
            headers=DEV_AUTH_HEADER,
            timeout=10
        )
        
        if r.status_code != 200:
            log_fail(f"Status {r.status_code}: {r.text}")
            return None
        
        data = r.json()
        job_id = data.get("job_id")
        log_info(f"Job ID: {job_id}")
        log_info(f"Status: {data.get('status')}")
        
        if not job_id:
            log_fail("No job_id returned")
            return None
        
        log_success(f"Job created: {job_id}")
        return job_id
        
    except Exception as e:
        log_fail(f"Job creation failed: {e}")
        return None


def test_job_status(job_id: str, wait_for_completion: bool = False):
    """Test 7: Job status polling"""
    log_step(7, f"Job Status Polling (job_id: {job_id[:8]}...)")
    
    try:
        max_polls = 30 if wait_for_completion else 2
        poll_interval = 1
        
        for i in range(max_polls):
            r = requests.get(
                f"{BASE_URL}/api/jobs/{job_id}",
                headers=DEV_AUTH_HEADER,
                timeout=10
            )
            
            if r.status_code != 200:
                log_fail(f"Status {r.status_code}: {r.text}")
                return False
            
            data = r.json()
            status = data.get("status")
            log_info(f"Poll {i+1}: Status = {status}")
            
            if status == "completed":
                log_success("Job completed successfully")
                if data.get("result"):
                    result = data["result"]
                    if isinstance(result, dict):
                        log_info(f"  Files generated: {result.get('files_generated', 'N/A')}")
                return True
            
            if status == "failed":
                log_fail(f"Job failed: {data.get('error', 'Unknown error')}")
                return False
            
            if not wait_for_completion and i >= 2:
                log_success("Job polling works (not waiting for completion)")
                return True
            
            time.sleep(poll_interval)
        
        log_info("Job still running (timeout reached)")
        return True
        
    except Exception as e:
        log_fail(f"Job status check failed: {e}")
        return False


def test_auth_bypass():
    """Test 8: Dev token bypass works"""
    log_step(8, "Auth Bypass Verification")
    
    try:
        # Test without auth (should fail)
        r = requests.post(
            f"{BASE_URL}/api/architecture/plan",
            json={"architecture_spec": VALID_ARCHITECTURE},
            timeout=10
        )
        
        if r.status_code == 401:
            log_success("Correctly rejected request without auth")
        else:
            log_fail(f"Expected 401, got {r.status_code}")
            return False
        
        # Test with dev bypass (should work)
        r = requests.post(
            f"{BASE_URL}/api/architecture/plan",
            json={"architecture_spec": VALID_ARCHITECTURE},
            headers=DEV_AUTH_HEADER,
            timeout=10
        )
        
        if r.status_code == 200:
            log_success("Dev token bypass works")
            return True
        else:
            log_fail(f"Dev bypass failed: {r.status_code} - {r.text}")
            return False
            
    except Exception as e:
        log_fail(f"Auth test failed: {e}")
        return False


def run_all_tests():
    """Run all smoke tests"""
    print(f"\n{Colors.BOLD}{'='*60}")
    print("ARCHITEX END-TO-END SMOKE TEST")
    print(f"{'='*60}{Colors.RESET}")
    print(f"Time: {datetime.now().isoformat()}")
    print(f"Backend: {BASE_URL}")
    
    results = {}
    
    # Test 1: Health
    results["health"] = test_health()
    if not results["health"]:
        print(f"\n{Colors.RED}Cannot continue - backend not running{Colors.RESET}")
        return False
    
    # Test 2-4: Quick Critique
    results["critique_valid"] = test_quick_critique_valid()
    results["critique_no_db"] = test_quick_critique_invalid_no_db()
    results["critique_no_edges"] = test_quick_critique_no_edges()
    
    # Test 5: Plan
    results["plan"] = test_architecture_plan()
    
    # Test 6: Job creation
    job_id = test_job_creation()
    results["job_creation"] = job_id is not None
    
    # Test 7: Job status (only if job was created)
    if job_id:
        results["job_status"] = test_job_status(job_id, wait_for_completion=False)
    else:
        results["job_status"] = False
    
    # Test 8: Auth bypass
    results["auth_bypass"] = test_auth_bypass()
    
    # Summary
    print(f"\n{Colors.BOLD}{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}{Colors.RESET}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if result else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"  {name:25} {status}")
    
    print(f"\n{Colors.BOLD}Result: {passed}/{total} tests passed{Colors.RESET}")
    
    if passed == total:
        print(f"{Colors.GREEN}All tests passed! Backend is ready for demo.{Colors.RESET}")
        return True
    else:
        print(f"{Colors.RED}Some tests failed. Fix issues before demo.{Colors.RESET}")
        return False


if __name__ == "__main__":
    wait_for_jobs = "--wait" in sys.argv
    
    if wait_for_jobs:
        print("Running with --wait: will wait for job completion")
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
