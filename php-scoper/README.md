# [PHP Scoper](https://github.com/humbug/php-scoper)

> PHP-Scoper is a tool which essentially moves any body of code, including all dependencies such as vendor directories, to a new and distinct namespace.

PHP Scoper is used to namespace all of Site Kit's dependencies under a first party namespace to prevent conflicts with other plugins and themes.

Site Kit requires that all dependencies are compatible with PHP 5.4. As a result, it is not possible to install PHP Scoper with the rest of Site Kit's vendor dependencies due to the library's requirement of PHP 7.2 or greater.

For this reason, Docker is used to run `composer install` on Travis, regardless of the build environment.

This can be done locally as well if needed using the following command from the plugin's root directory:

```sh
docker run --rm -v "$PWD:/app" composer install
```
