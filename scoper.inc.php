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

$installed        = include __DIR__ . '/vendor/composer/installed.php';
$non_dev_packages = array_filter(
	$installed['versions'],
	fn ( $pkg ) => ! $pkg['dev_requirement']
);

return array(
	'prefix'                  => 'Google\\Site_Kit_Dependencies',
	'finders'                 => array(
		// All non-dev dependency package files.
		Finder::create()
			->files()
			->in( __DIR__ . '/vendor' )
			->path( array_keys( $non_dev_packages ) )
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
					'.github',
				)
			),
	),
	'exclude-files'           => array(
		// This dependency is a global function which should remain global.
		'vendor/ralouphie/getallheaders/src/getallheaders.php',
	),
	'patchers'                => array(
		function ( $file_path, $prefix, $contents ) {
			// Avoid prefixing the `static` keyword in some places.
			$contents = str_replace( "\\$prefix\\static", 'static', $contents );

			// Use double backslashes for class names in strings.
			$doubled_backslash_prefix = str_replace( '\\', '\\\\', $prefix );

			if ( false !== strpos( $file_path, 'vendor/google/apiclient/' ) ) {
				$contents = str_replace( "'\\\\GuzzleHttp\\\\ClientInterface", "'\\\\" . $doubled_backslash_prefix . '\\\\GuzzleHttp\\\\ClientInterface', $contents );
				$contents = str_replace( "'Google_", "'" . $prefix . '\Google_', $contents );
			}
			if ( false !== strpos( $file_path, 'vendor/google/auth/' ) ) {
				$contents = str_replace( "'GuzzleHttp\\\\ClientInterface", "'" . $doubled_backslash_prefix . '\\\\GuzzleHttp\\\\ClientInterface', $contents );
			}
			if ( false !== strpos( $file_path, 'apiclient-services-analyticsadmin.v1alpha' ) ) {
				// Put v1alpha library in alternate namespace to avoid collision with v1beta for some things.
				$contents = preg_replace(
					// Use a regular expression to avoid prefixing those that have V1alpha already.
					'/GoogleAnalyticsAdmin(V1alpha)?/',
					'GoogleAnalyticsAdminV1alpha',
					$contents
				);
			}
			if ( false !== strpos( $file_path, 'phpseclib' ) ) {
				// phpseclib dynamically constructs FQCNs from partial strings that
				// PHP-Scoper can't automatically prefix, e.g.:
				// $fqmain = 'phpseclib3\Math\BigInteger\Engines\' . $main
				//
				// This prefixes any string-quoted 'phpseclib3' namespace reference,
				// handling both single (\) and double (\\) backslash escaping forms
				// that may result from php-parser's normalization of single-quoted strings.
				//
				// Pattern (regex):  /'\\{0,2}phpseclib3(?=\\)/
				// '           — opening single quote of the string literal
				// \\{0,2}     — 0, 1, or 2 literal backslashes (covers all escaping forms)
				// phpseclib3  — the namespace root.
				// (?=\\)      — lookahead: must be followed by a backslash (avoids false matches).
				$prefixed_ns = str_replace( '\\', '\\\\', "\\{$prefix}\\phpseclib3" );
				$contents    = preg_replace_callback(
					"/'\\\\{0,2}phpseclib3(?=\\\\)/",
					fn() => "'" . $prefixed_ns,
					$contents
				);
			}

			return $contents;
		},
	),
	'expose-namespaces'       => array(),
	'expose-global-constants' => false,
	'expose-global-classes'   => false,
	'expose-global-functions' => false,
);
