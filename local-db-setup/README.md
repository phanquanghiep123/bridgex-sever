# Setup Local DB

## Overview

setup DB to use in local macnihe by using docker compose. execute the following flow.

1. start DB of bridgex and gconnect
2. insert test data

## How to use

1. update ./local-db-setup/setup/bridgex-ddl and ./local-db-setup/setup/gconnect-ddl
2. move to ./local-db-setup directory
3. execute `docker-compose down`
4. execute `docker-compose up -d`

-   if volume cloudn't be mounted in process 4, execute `docker volume prune`

## connection info

-   bridgex db
    -   host: localhost
    -   port: 5433
    -   user: postgres
    -   password: postgres
    -   dbname: postgres
-   gconnect db
    -   host: localhost
    -   port: 5434
    -   user: postgres
    -   password: postgres
    -   dbname: postgres
