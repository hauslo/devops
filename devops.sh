#!/usr/bin/env bash
DEVOPS_ROOT=$(pwd)
DEVOPS_IMAGE=hauslo-devops:latest

COLOR_ON="\033[1;33m"
COLOR_OFF="\033[0m"

echo -e "  ${COLOR_ON}@hauslo/devops${COLOR_OFF}" docker run --rm -it "\\" "\n" \
"\t" -v /var/run/docker.sock:/var/run/docker.sock "\\" "\n" \
"\t" -v ${DEVOPS_ROOT}/:${DEVOPS_ROOT}/ "\\" "\n" \
"\t" -w ${DEVOPS_ROOT} "\\" "\n" \
"\t" -e "DEBUG=${DEBUG}" "\\" "\n" \
"\t" ${DEVOPS_IMAGE} "\\" "\n" \
"\t" "$@" \
    "\n"

docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ${DEVOPS_ROOT}/:${DEVOPS_ROOT}/ \
  -w ${DEVOPS_ROOT} \
  -e "DEBUG=${DEBUG}" \
  ${DEVOPS_IMAGE} \
  "$@"
