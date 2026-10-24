#!/bin/sh
set -e

# Install PHP dependencies if vendor is missing (fresh volume)
if [ ! -f /var/www/html/vendor/autoload.php ]; then
    echo "vendor/autoload.php not found — running composer install..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

exec "$@"
