#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django
django.setup()

if __name__ == '__main__':
    import subprocess
    import os
    print("Starting ASGI server with Daphne for WebSocket support...")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    subprocess.run([
        'daphne',
        '-b', '127.0.0.1',
        '-p', '8000',
        'backend.asgi:application'
    ])
