"""Test GitHub integration with real token"""
import asyncio
from database.mongo import init_mongo, close_mongo, get_db
from services.github import GitHubService, slugify_repo_name


async def test_github():
    await init_mongo()
    db = get_db()
    user = await db.users.find_one({})
    
    if not user or not user.get('github_access_token'):
        print('No user with token found')
        return
    
    token = user.get('github_access_token')
    print(f'Testing with user: {user.get("username")}')
    
    # Test GitHubService
    github_service = GitHubService(access_token=token)
    
    try:
        username = github_service.get_username()
        print(f'Authenticated as: {username}')
    except Exception as e:
        print(f'Failed to get username: {e}')
        await close_mongo()
        return
    
    # Test slugify
    test_name = 'Test Project 123!'
    slug = slugify_repo_name(test_name)
    print(f'Slugified "{test_name}" -> "{slug}"')
    
    # Check if test repo exists
    try:
        exists = github_service.repo_exists('architex-test-delete-me')
        print(f'Repo "architex-test-delete-me" exists: {exists}')
    except Exception as e:
        print(f'Error checking repo: {e}')
    
    # Test creating a repository
    try:
        result = await github_service.create_repository(
            name='architex-test-delete-me',
            description='Test repo - can be deleted',
            private=False
        )
        print(f'Created repo: {result}')
    except Exception as e:
        print(f'Error creating repo: {e}')
    
    await close_mongo()
    print('Test completed successfully!')


if __name__ == '__main__':
    asyncio.run(test_github())
