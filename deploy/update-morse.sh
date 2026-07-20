#!/bin/bash
#
# Обновление Morse Walker на VPS.
# Кладётся в репозиторий, чтобы скрипт деплоя жил вместе с кодом.
#
# Разовая подготовка на сервере (если раньше что-то ставили под root):
#   sudo chown -R www-data:www-data /var/www/morse
#
set -euo pipefail

SITE_DIR="/var/www/morse"
USER="www-data"
BRANCH="main"

echo "🎵 Начинаем обновление Morse Walker..."

cd "$SITE_DIR"

# ⚠️ Права проверяем РЕКУРСИВНО.
# Прежняя версия смотрела только на владельца самой папки сайта — а он был
# www-data. При этом внутри node_modules лежали файлы root (следы npm install
# из-под sudo), и `npm ci` падал с EACCES при попытке их удалить.
if find "$SITE_DIR" -maxdepth 2 ! -user "$USER" -print -quit | grep -q .; then
    echo "⚠️  Найдены файлы с чужим владельцем — исправляем..."
    sudo chown -R "$USER:$USER" "$SITE_DIR"
fi

sudo -u "$USER" git config --global --add safe.directory "$SITE_DIR" 2>/dev/null || true

echo "📥 Получение изменений из Git..."
# На сервере рабочая копия одноразовая: любые локальные правки здесь —
# это мусор, из-за которого git pull однажды встанет с конфликтом.
sudo -u "$USER" git fetch origin "$BRANCH"
sudo -u "$USER" git reset --hard "origin/$BRANCH"

echo "📦 Установка зависимостей..."
# --include=dev обязателен: webpack и прочая сборка живут в devDependencies.
# Старый флаг --production=false устарел, npm ругается на него предупреждением.
sudo -u "$USER" npm ci --include=dev --legacy-peer-deps

echo "🧪 Тесты..."
# npm test = `node --test` без аргументов: сам находит tests/**, исключая
# node_modules. Раньше в скрипте был glob-паттерн в аргументах — его умеет
# раскрывать только Node 22.6+, и на сервере тесты просто «не находились».
sudo -u "$USER" npm test

echo "🔨 Сборка проекта..."
sudo -u "$USER" npm run build

# Не выкатываем пустую сборку: если dist пуст, лучше упасть здесь,
# чем отдать пользователям белую страницу
if [ ! -s "$SITE_DIR/dist/index.html" ]; then
    echo "❌ dist/index.html пуст или отсутствует — выкатка отменена"
    exit 1
fi

echo "🧹 Очистка кеша Nginx..."
sudo rm -rf /var/cache/nginx/*

echo "🔄 Перезагрузка Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "✅ Morse Walker обновлён!"
echo ""
echo "🔍 Текущий коммит:"
git log -1 --oneline --decorate
echo ""
echo "📊 Размер dist:"
du -sh dist/ 2>/dev/null || echo "Папка dist не найдена"
echo ""
echo "💾 Использование диска:"
df -h / | tail -1
echo ""
echo "🌐 Сайт доступен: https://morse.r9o.ru"
