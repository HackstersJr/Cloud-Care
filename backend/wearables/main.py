import sentry_sdk
from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
load_dotenv()

try:
    sentry_sdk.init(
        dsn=os.environ['SENTRY_DSN'],
        traces_sample_rate=1.0,
    )
except: pass

app = Flask(__name__)
CORS(app)

# Root endpoint for basic info
@app.route('/')
def root():
    return {'service': 'wearables-gateway', 'version': 'v2', 'endpoints': ['/api/v2/']}, 200

# deprecate v1 for security reasons
# from apiVersions.v1 import init_app as init_v1
# init_v1(app)

from apiVersions.v2 import init_app as init_v2
init_v2(app)

if __name__ == '__main__':
    app.run(host=os.environ.get('APP_HOST', '0.0.0.0'), port=int(os.environ.get('APP_PORT', 6644)), debug=bool(os.environ.get('APP_DEBUG', False)))
