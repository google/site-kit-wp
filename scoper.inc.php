<?php
/**
 * PHP-Scoper configuration file.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Symfony\Component\Finder\Finder;

$installed             = include __DIR__ . '/vendor/composer/installed.php';
$non_dev_packages      = array_filter(
	$installed['versions'],
	fn ( $pkg ) => ! $pkg['dev_requirement']
);
$non_dev_package_names = array_keys( $non_dev_packages );

return array(
	'prefix'                     => 'Google\\Site_Kit_Dependencies',
	'finders'                    => array(
		// All non-dev vendor dependencies.
		Finder::create()
				->files()
				->ignoreVCS( true )
				->notName( '/LICENSE|.*\\.md|.*\\.dist|Makefile|composer\\.(json|lock)/' )
				->exclude(
					array(
						'doc',
						'test',
						'test_old',
						'tests',
						'Tests',
						'vendor-bin',
					)
				)
				->path( $non_dev_package_names )
				->in( 'vendor' ),
	),
	'files-whitelist'            => array(
		// This dependency is a global function which should remain global.
		'vendor/ralouphie/getallheaders/src/getallheaders.php',
	),
	'patchers'                   => array(
		function ( $file_path, $prefix, $contents ) {
			// Avoid prefixing the `static` keyword in some places.
			$contents = str_replace( "\\$prefix\\static", 'static', $contents );

			if ( preg_match( '#google/apiclient/src/Google/Http/REST\.php$#', $file_path ) ) {
				$contents = str_replace( "\\$prefix\\intVal", '\\intval', $contents );
			}
			if ( false !== strpos( $file_path, 'vendor/google/apiclient/' ) || false !== strpos( $file_path, 'vendor/google/auth/' ) ) {
				// Use modified prefix just for this patch.
				$s_prefix = str_replace( '\\', '\\\\', $prefix );
				$contents = str_replace( "'\\\\GuzzleHttp\\\\ClientInterface", "'\\\\" . $s_prefix . '\\\\GuzzleHttp\\\\ClientInterface', $contents );
				$contents = str_replace( '"\\\\GuzzleHttp\\\\ClientInterface', '"\\\\' . $s_prefix . '\\\\GuzzleHttp\\\\ClientInterface', $contents );
				$contents = str_replace( "'GuzzleHttp\\\\ClientInterface", "'" . $s_prefix . '\\\\GuzzleHttp\\\\ClientInterface', $contents );
				$contents = str_replace( '"GuzzleHttp\\\\ClientInterface', '"' . $s_prefix . '\\\\GuzzleHttp\\\\ClientInterface', $contents );
			}
			if ( false !== strpos( $file_path, 'vendor/google/apiclient/' ) ) {
				$contents = str_replace( "'Google_", "'" . $prefix . '\Google_', $contents );
				$contents = str_replace( '"Google_', '"' . $prefix . '\Google_', $contents );
			}
			if ( false !== strpos( $file_path, 'apiclient-services-adsenselinks' ) ) {
				// Rewrite "Class_Name" to Class_Name::class to inherit namespace.
				$contents = preg_replace( '/"(Google_[^"]+)"/', '\\1::class', $contents );
			}
			if ( false !== strpos( $file_path, 'apiclient-services-analyticsadmin-v1alpha' ) ) {
				// Put v1alpha library in alternate namespace to avoid collision with v1beta for some things.
				$contents = preg_replace(
					// Use a regular expression to avoid prefixing those that have V1alpha already.
					'/GoogleAnalyticsAdmin(V1alpha)?/',
					'GoogleAnalyticsAdminV1alpha',
					$contents
				);
			}

			if ( false !== strpos( $file_path, 'phpseclib' ) ) {
				// Use modified prefix just for this patch.
				$s_prefix = str_replace( '\\', '\\\\', $prefix );
				$contents = str_replace( "'phpseclib3\\\\", "'\\\\" . $s_prefix . '\\\\phpseclib3\\\\', $contents );
				$contents = str_replace( "'\\\\phpseclib3", "'\\\\" . $s_prefix . '\\\\phpseclib3', $contents );
			}

			if (
				// Bootstrap files polyfill global functions using namespaced implementations.
				preg_match( '#vendor/symfony/polyfill-.*/bootstrap\.php$#', $file_path )
				// The classes under Resources/stubs polyfill classes in the global namespace loaded via classmap.
				|| preg_match( '#vendor/symfony/polyfill-.*/Resources/stubs/.*\.php$#', $file_path )
			) {
				$contents = str_replace( "namespace $prefix;", "/* namespace $prefix intentionally removed */", $contents );
			}
			return $contents;
		},
	),
	'whitelist'                  => array(),
	'whitelist-global-constants' => false,
	'whitelist-global-classes'   => false,
	'whitelist-global-functions' => false,
);
