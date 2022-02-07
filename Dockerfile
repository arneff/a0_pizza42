FROM node:16

WORKDIR /app
COPY . .
RUN npm install
ENV DEBUG=myapp:*
EXPOSE 3000 3001
CMD ["npm", "run", "start"]
