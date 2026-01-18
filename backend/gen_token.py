"""Generate a test JWT token"""
import jwt
from config import JWT_SECRET

# Create a test token for the existing user
user_id = 'SquaredPiano'  # This should match the userId in the database
token = jwt.encode({'sub': user_id, 'exp': 9999999999}, JWT_SECRET, algorithm='HS256')
print(f'Authorization: Bearer {token}')
print()
print(f'TOKEN={token}')
