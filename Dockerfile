FROM node

COPY package*.json ./

RUN npm install

RUN npm ci --omit=dev

COPY . .

EXPOSE 8041

CMD [ "npm", "start" ]