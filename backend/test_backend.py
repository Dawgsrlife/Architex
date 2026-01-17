#!/usr/bin/env python3
"""
Architex Backend Test Script
Quick tests to verify the backend is working
"""
import asyncio
import httpx

BASE_URL = "http://localhost:8000"


async def test_health():
    """Test health endpoint"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


async def test_root():
    """Test root endpoint"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/")
        assert resp.status_code == 200
        data = resp.json()
        assert "Architex" in data["name"]
        print("✓ Root endpoint passed")


async def test_github_redirect():
    """Test GitHub OAuth redirect"""
    async with httpx.AsyncClient(follow_redirects=False) as client:
        resp = await client.get(f"{BASE_URL}/api/auth/github")
        # Should redirect to GitHub
        assert resp.status_code in [302, 307]
        location = resp.headers.get("location", "")
        assert "github.com" in location
        print("✓ GitHub OAuth redirect passed")


async def test_protected_endpoint_without_auth():
    """Test that protected endpoints require auth"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/users/me")
        assert resp.status_code == 401
        print("✓ Protected endpoint auth check passed")


async def test_projects_without_auth():
    """Test projects endpoint without auth"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/projects")
        assert resp.status_code == 401
        print("✓ Projects auth check passed")


async def main():
    print("=" * 50)
    print("Architex Backend Tests")
    print("=" * 50)
    print(f"Testing: {BASE_URL}")
    print()
    
    try:
        await test_health()
        await test_root()
        await test_github_redirect()
        await test_protected_endpoint_without_auth()
        await test_projects_without_auth()
        
        print()
        print("=" * 50)
        print("All tests passed! ✓")
        print("=" * 50)
        
    except httpx.ConnectError:
        print("✗ Cannot connect to server")
        print("  Make sure the server is running: python main.py")
    except AssertionError as e:
        print(f"✗ Test failed: {e}")
    except Exception as e:
        print(f"✗ Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
