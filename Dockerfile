FROM alpine:latest
WORKDIR /usr/src/devops
RUN ["apk", "add", "nodejs"]
RUN ["apk", "add", "npm"]
RUN ["apk", "add", "docker"]
COPY ./package*.json ./
RUN ["npm", "install"]
COPY ./src ./src
ENTRYPOINT [ "node", "/usr/src/devops/src/bin.js" ]