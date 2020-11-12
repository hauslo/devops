# devops

## Requirements

- Docker

That's it.

## Install

Clone :

```bash
git clone github.com/hauslo/devops
```

Build :

```bash
cd devops
docker build -t hauslo-devops:latest .
```

Link or add to your \$PATH :

```bash
chmod +x ./devops
ln -s $(pwd)/devops/devops /usr/bin/devops
```

Enjoy :

```bash
devops help
```

## Overview

```bash
devops start <deployment>
devops stop <deployment>
devops test <suite> [...arguments]

devops <service> <script> [...arguments]

# WIP
devops build <service>
devops release <service>

devops provision <infrastructure> <apply|plan|destroy> [...arguments]
devops provision-cluster <infrastructure> <cluster>
devops deploy <cluster> <stack>

devops backup <cluster> <storage-service>
devops restore <cluster> <storage-service>
```

```
.devops/
    share.env
    local.env
    local/<deployment>.yml
    dev/<service>/<script>.Dockerfile
    test/<suite>.Dockerfile
```

## Common

The `devops` command must be run in the project directory and a `.devops` directory must exist in this directory

### Configuration

`.devops/share.env` and `.devops/local.env`

```env
DEVOPS_NAMESPACE=super-unique-namespace
TF_BACKEND=...
CONTAINER_REGISTRY=...
```

### CLI

Top-level options

```bash
--it       # runs the command (container) is interactive mode
--env-file # sources environment variables from a dotenv file
```

## Features

### `start <deployment>` and `stop <deployment>`

Starts/stops a local deployment.

A local deployment is a composition of multiple services development containers.

#### Configuration

The `<deployment>.yml` docker-compose configuration files in the configuration directory `.devops/local`

### `test <suite> [...arguments]`

Run a test suite as a container against the current local deployment.

### `<service> <script> [...arguments]`

Run a development script as a container mounted on the service source

#### Configuration

A `<script>.Dockerfile` in the `.devops/dev/<service>` directory

---

## Features (WIP)

### `build <service>`

Builds the deployment-ready images of the service. These images are automatically tagged with `:latest`

#### Configuration

A `<service>.Dockerfile` in the `.devops/config/build` directory

### `release <service>`

Releases the previously build image of a service to the container registry and tag it with a version number

### Configuration

A `<service>.Dockerfile` in the `.devops/config/build` directory and the version number in the `.devops/config/releases/<service>` file

### `provision <infrastructure>`

Provision the infrastructure with terraform.

For example DNS records and CDN at cloudflare and a cluster of compute and storage instances in private networks in ovh public cloud.

#### Configuration

A terraform configuration in `.devops/config/infrastructure/<infrastructure>`

### `provision-swarm <swarm> <infrastructure>`

---

## CI

No CI configuration is included by default.
