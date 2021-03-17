FROM node

COPY package*.json ./

RUN npm install
RUN npm ci --only=production

COPY . .

EXPOSE 8041

CMD [ "npm", "start" ]