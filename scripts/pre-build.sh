#!/bin/sh

echo "Build environment value: $BUILD_ENV_VAL"
if test "$BUILD_ENV_VAL" = "production"; then
  cp ./.prod.env ./.env
elif test "$BUILD_ENV_VAL" = "non-production"; then
  cp ./.non-prod.env ./.env
elif test "$BUILD_ENV_VAL" = "uat"; then
  cp ./.uat.env ./.env
fi
