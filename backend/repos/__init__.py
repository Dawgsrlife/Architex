"""
Repository layer for data access

Clean exports for all repositories.
Usage:
    from repos import users_repo, projects_repo, jobs_repo
"""

from repos import users_repo
from repos import projects_repo
from repos import jobs_repo

__all__ = ["users_repo", "projects_repo", "jobs_repo"]
