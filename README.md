# devops

A fully containerized development and operation CLI.

This CLI wants itself as flexible as possible but has been designed with a the following constraints in mind :

- Continuous development (Complete local development deployment with mounted containers and docker-compose)
- Complex set of webservices
- Microservice architecture
- Monorepo
- Continuous deployment (Deploy new versions of each service independently, _todo: canary deployment_)
- Low-cost cloud providers (Reduced cloud services - Openstack nova or even bare-metal, starting from self-hosted datastores and message queues)
- Reduced ops requirements (Infrastructure as code - Terraform for provisionning, ansible for configuration, docker-swarm for simple container orchestration)

## Motivation

To make production faring development a joy.

## Requirements

- Git
- Docker

That's it.

We also use two bash scripts (`build.sh` and `devops.sh`) for convenience

- `build.sh` builds `hauslo/devops:${DEVOPS_VERSION:-dev}` from the source ;
- and `devops.sh` runs `hauslo/devops:${DEVOPS_VERSION:-dev}` mounted on the current working directory.

Note : `devops.sh` will pass along an eventual `DEBUG` environment variable for debugging.

## Install

Clone :

```bash
git clone github.com/hauslo/devops
cd devops
```

Build :

```bash
chmod +x build.sh
./build.sh # --no-cache
```

Link or add to your `PATH` :

```bash
chmod +x devops.sh
ln -s $(pwd)/devops/devops.sh /usr/bin/devops
```

Enjoy :

```bash
devops help
```

With debugging logs enabled :

```bash
DEBUG=* devops help
```

## Overview

### Overview of the CLI

```bash
devops start <deployment>
devops stop <deployment>
devops test <suite> -- [...options]

devops <service> <script> -- [...options]

devops build <service>
devops release <service>

devops provision <infrastructure> -- [...options]
devops configure <infrastructure> <playbook> -- [...options]
devops deploy <infrastructure> <stack>
```

### Overview of the configuration directory structure

```
.devops/
    share.env
    local.env
    .share/
    .local/
    local/<deployment>.yml
    dev/<service>/<script>.Dockerfile
    test/<suite>.Dockerfile
    build/<service>.Dockerfile
    release/<service>.version
    provision/<infrastructure>/
    configure/<infrastructure>/inventory
    configure/<infrastructure>/<playbook>
```

### Todo

- Deploy a standalone container to a cluster for maintenance task (backup, restore, etc) from the CLI
- Gather logs from the cluster from the CLI
- Add native support for a monitoring solution

---

## CLI Options and Environment Variables

The CLI accepts a couple of options (`--it`, `--env-file`), run `devops help` for details.

Moreover the CLI reads some environment variable if they are defined :

- `DEBUG` _(optional)_ - Enables the debugging logs (see [debug | npmjs.com](https://www.npmjs.com/package/debug))
- `DEVOPS_VERSION` _(optional)_ - The command will exit with an error if this environment variable is set and doesn't match the CLI version

Note : All environment variable must be sourced from a dotenv file (`share.env`, `local.env`, etc) except `DEBUG` which must be present in the environment in which the CLI is called.

Some commands require additional environment variables :

`build` requires

- `DEVOPS_NAMESPACE` to name the build images

`release` requires

- `DEVOPS_REGISTRY_LOGIN_URL`
- `DEVOPS_REGISTRY_URL`
- `DEVOPS_REGISTRY_USER`
- `DEVOPS_REGISTRY_PASSWORD`

`provision` (and thus terraform) will almost certainly require credentials depending on the choosen provider and backend.

`configure` (and thus ansible) uses ssh to connect to remote instances, you could ensure that the identity file (`id_rsa`, etc) is present in `DEVOPS_ROOT` (to be mounted in the container) and pass it as an [ansible cli options](https://docs.ansible.com/ansible/latest/cli/ansible.html) or let `devops` handle it by specifying its path in the `DEVOPS_ANSIBLE_IDENTITY_FILE` environment variable.

## Command Environment

The environment in which the commands are run is isolated from the original environment in which the CLI is run.

The commands environment is sourced from the `.devops/share.env` and `.devops/local.env` dotenv files. Additional dotenv files may be specified with the `--env-file` option.

In addition to the environment variable sourced from the dotenv files, a number of environment variables are automatically defined for all commands run from the CLI :

- `DEVOPS_VERSION` - The CLI version number (semver)
- `DEVOPS_ROOT` - The working directory in which `devops` was run
- `DEVOPS_CONFIG` - The relative path from `DEVOPS_ROOT` to the devops configuration (=`.devops`)

---

## CLI

`devops start <deployment>` starts a local deployment using docker-compose.

`devops stop <deployment>` stops the current local deployment.

`devops <service> <script>` runs a development script of a service (`npm` or `pip` for instance).

`devops test <suite>` runs a test suite from a Dockerfile in the current local deployment.

`devops build <service>` builds a release of a service.

`devops release <service>` releases a versionned build of a service to a remote container registry.

`devops provision <infrastructure>` runs terraform to provision/destroy/etc an infrastructure.

`devops configure <infrastructure> <playbook>` runs an ansible playbook to configure an infrastructure.

`devops deploy <infrastructure> <stack>` deploys a docker swarm stack to a provisionned cluster.
