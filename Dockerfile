FROM node:9

COPY . /src

WORKDIR /src

RUN npm install

EXPOSE 10000

CMD ["npm", "start"]
