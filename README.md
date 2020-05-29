# Bridge-X Server

## overview

This app has been created to provide REST APIs with Bridge-X App user. So this app is usually called by Bridge-X Frontend. In addition, this app uses the mqtt protocol to manage asset status etc. to monitor assets.

## specification

-   <a href="./docs/overall-view/component-diagram.plantuml">overall view (plantuml)</a>
-   <a href="./docs/bridge-x-server.openapi.json">REST API (openapi)</a>
-   <a href="./docs/mqtt-interface.yaml">MQTT interface (asyncapi)</a>

## Set up

```bash
# 1. install Node.js
$ nvm install {node_verison}; nvm use {node_verison}

# 2. install dependency packages
$ npm ci

# 3. if needed, set up environment variables
```

## environment variables

There are two ways to set up environment variables.

-   (Top priority) edit .env
-   (Next priority) edit src/assets/conf/app-config.json

Using src/assets/conf/app-config.json is recommended

### All key of .env ( example values )

```env
APP_CONFIG_PATH=
SERVER_PORT=3000
HOSTNAME=localhost
PRODUCTION=false

FTP_CLIENT_CONFIG_PATH=
FTP_CLIENT_SERVER_HOST=localhost
FTP_CLIENT_SERVER_PORT=21
FTP_CLIENT_SECURE=false
FTP_CLIENT_LOGIN_USER=testuser1
FTP_CLIENT_LOGIN_PASSWORD=password1

FTP_CONFIG_PATH=
FTP_PROTOCOL=ftp
FTP_SERVER_HOST=localhost
FTP_SERVER_PORT=21
FTP_LOGIN_USER=testuser1
FTP_LOGIN_PASSWORD=password1
FTP_PATH_PREFIX=packages

DATABASE_ACCESS_SERVICE_CONFIG_PATH=
DATABASE_ACCESS_SERVICE_BASE_URL=http://localhsot:3001
USER_AUTH_SERVICE_BASE_URL=http://localhost:3002

MQTT_CONFIG_PATH=
MQTT_BROKER_PORT=1883
MQTT_BROKER_HOSTNAME=localhost
MQTT_PROTOCOL=mqtt
MQTT_PROTOCOL_VER=4
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CERT_PATH=

COS_CONFIG_PATH=
COS_ENDPOINT=
COS_PORT=
COS_BUCKET=
COS_HMAC_ACCESS_KEY_ID=
COS_HMAC_SECRET_ACCESS_KEY=
COS_PATH_PREFIX=
ASSET_LOGS_PREFIX=
LOG_SIGNED_URL_AVAILABLE_TIME=60
COS_PROXY=

PERSISTENT_VOLUME_CONFIG_PATH=
VALIDATE_PACKAGE_TMP_DIR=

POSTGRES_CONFIG_PATH=
POSTGRES_HOST=localhost
POSTGRES_DATABASE=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_KEEPALIVE=true
POSTGRES_USE_SSL=false
POSTGRES_CERT_PATH=
```

### src/assets/conf/app-config.json

reference to <a href="src/assets/conf/app-config.json">src/assets/conf/app-config.json</a>

## Debug

```bash
# start app with debug mode
$ npm run debug
```

## Test

```bash
# unit tests
$ npm run test
```

## Deploy to real environment

We have been adopting GitOps. When pushing changes to master or develop branch, a pipeline starts. If the pipeline finished successfully, docker image created by the pipeline is registered with container registory. We deploy this app by using this docker image in k8s cluster.
