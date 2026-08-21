# if3110-tubes ("wbd.egolab.top") — vanilla PHP MVC job board on Postgres.
# Build context MUST be the repo root so it can see projects/ and labs/:
#   docker build -t egolab-if3110:latest -f labs/if3110-tubes/Dockerfile .
FROM php:8.3-apache

RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev \
 && docker-php-ext-install pdo pdo_pgsql pgsql \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/www/html/public/uploads \
 && chown -R www-data:www-data /var/www/html \
 && chmod -R 775 /var/www/html/public/uploads

COPY projects/if3110-tubes/php/php.ini /usr/local/etc/php/php.ini
COPY projects/if3110-tubes/php/src     /var/www/html
# Fixes on top of the upstream checkout — hardcoded localhost:8000 URLs
# (see labs/if3110-tubes/overrides for what and why).
COPY labs/if3110-tubes/overrides       /var/www/html

# The upstream repo only works on a case-INsensitive filesystem (its own dev
# machines): PHP `use App\Controllers\X` autoloads expect .../Controllers/,
# but the checked-in folder is .../controllers/ (lowercase) — and its view
# includes reference component files under both .../components/ AND
# .../Components/ interchangeably, with the two files actually split
# between them. Reconcile both on Linux without touching the many scattered
# include() call sites.
RUN mv /var/www/html/App/controllers /var/www/html/App/Controllers \
 && cp -n /var/www/html/App/components/*   /var/www/html/App/Components/ \
 && cp -n /var/www/html/App/Components/*   /var/www/html/App/components/ \
 && chown -R www-data:www-data /var/www/html/App

RUN a2enmod rewrite
COPY labs/if3110-tubes/apache/mpm-worker-limits.conf /etc/apache2/conf-enabled/mpm-worker-limits.conf
WORKDIR /var/www/html
EXPOSE 80
