FROM node

COPY package*.json ./

RUN npm install
RUN npm ci --only=production

COPY . .

EXPOSE 8040

CMD [ "npm", "start" ]