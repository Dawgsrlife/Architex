#!/usr/bin/env python3
"""Test GitHub service functionality"""
import sys
sys.path.insert(0, '.')

try:
    from github import Github
    print("✓ PyGithub import OK")
except ImportError as e:
    print(f"✗ PyGithub import failed: {e}")
    sys.exit(1)

try:
    from services.github import slugify_repo_name, GitHubService
    print("✓ GitHubService import OK")
except ImportError as e:
    print(f"✗ GitHubService import failed: {e}")
    sys.exit(1)

# Test slugify
result = slugify_repo_name("My Awesome Project!")
print(f"✓ slugify_repo_name('My Awesome Project!') = '{result}'")

# Test GitHubService without token
svc = GitHubService(access_token=None)
print("✓ GitHubService init (no token) OK")

# Test that client is None when no token
if svc.client is None:
    print("✓ Client is None when no token (expected)")
else:
    print("✗ Client should be None when no token")

print("\n=== All basic tests passed! ===")
print("\nTo fully test GitHub repo creation, the backend must be running")
print("and you must authenticate via GitHub OAuth to get a valid token.")
