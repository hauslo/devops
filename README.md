# devops

## Requirements

- Docker

That's it.

We use two bash scripts (`build.sh` and `devops.sh`) and the environment variable `$PATH` for convenience

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

Link or add to your \$PATH :

```bash
chmod +x devops.sh
ln -s $(pwd)/devops/devops.sh /usr/bin/devops
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

devops build <service>
devops release <service>

devops provision <infrastructure> <apply|plan|destroy> [...arguments]
devops configure <infrastructure> <playbook>
devops deploy <infrastructure> <stack>

# WIP
devops backup <cluster> <storage-service>
devops restore <cluster> <storage-service>
devops logs <cluster> <service>
```

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

---

## Todo

Ensure that the DEVOPS_NAMESPACE and DEVOPS_VERSION environment variables are set.

Document available environment variables

- `*` in `share.env`
- `*` in `local.env`
- `DEVOPS_VERSION`
- `DEVOPS_ROOT`
- `DEVOPS_CONFIG`

Document required environment variables

- `DEVOPS_NAMESPACE`
- `DEVOPS_VERSION` (overridden with the exact version number)

`release` :

- `DEVOPS_REGISTRY_LOGIN_URL`
- `DEVOPS_REGISTRY_URL`
- `DEVOPS_REGISTRY_USER`
- `DEVOPS_REGISTRY_PASSWORD`

`provision` :

Depends on the choosen provider and backend, very little is automated here so refer to your provider and terraform documentation.

`configure` :

Ansible uses ssh to connect to the instances in the host file.

You can either use [ansible cli options](https://docs.ansible.com/ansible/latest/cli/ansible.html) or let this module handle some of them.

- `DEVOPS_ANSIBLE_IDENTITY_FILE`
