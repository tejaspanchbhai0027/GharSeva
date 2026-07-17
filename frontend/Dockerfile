FROM node:18-alpine

WORKDIR /code

COPY package.json package-lock.json* /code/

RUN npm install

COPY . /code

EXPOSE 3000

CMD ["npm", "run", "dev"]
