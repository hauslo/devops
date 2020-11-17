#!/usr/bin/env bash
DEVOPS_SRC=$(realpath $(dirname "$0"))
DEVOPS_VERSION=${DEVOPS_VERSION:-dev}
DEVOPS_IMAGE=hauslo/devops:${DEVOPS_VERSION}

COLOR_ON="\033[1;33m"
COLOR_OFF="\033[0m"

echo -e "  ${COLOR_ON}@hauslo/devops:build.sh${COLOR_OFF}" docker build "$@" -t ${DEVOPS_IMAGE} ${DEVOPS_SRC} "\n"

docker build "$@" -t ${DEVOPS_IMAGE} ${DEVOPS_SRC}