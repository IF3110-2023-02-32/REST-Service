FROM node:21-alpine

COPY . /app
WORKDIR /app

RUN npm install

# RUN npx prisma generate
# RUN npx prisma migrate deploy

CMD [ "npm", "run", "dev" ]

# CMD ["npm", "i", "-g", "prisma"]