FROM node:current
WORKDIR /usr/src/app
COPY ./index.js /usr/src/app
CMD ["index.js"]