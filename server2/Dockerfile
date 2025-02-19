# Базовый образ Node.js
FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование package.json и установка зависимостей
COPY package*.json ./
RUN npm install 
RUN npm install uuid

# Копирование остальных файлов приложения
COPY . .

# Открытие порта
EXPOSE 8080

# Запуск приложения
CMD ["npm", "start"]