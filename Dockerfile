FROM alpine:latest
WORKDIR /usr/src/devops
RUN ["apk", "add", "nodejs"]
RUN ["apk", "add", "docker"]
COPY ./package*.json ./
RUN ["npm", "install"]
COPY ./src ./
ENTRYPOINT [ "node", "./src/bin.js" ]