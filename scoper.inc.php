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
	// The root package (this plugin) is listed too, but `vendor/google/google-site-kit` is only used by
	// bin/prefix-dependencies.php to store its state, since Composer never installs the root package there.
	fn ( $pkg, $name ) => ! $pkg['dev_requirement'] && $installed['root']['name'] !== $name,
	ARRAY_FILTER_USE_BOTH
);

// When set (by bin/prefix-dependencies.php), only the given comma-separated packages are prefixed.
$only_packages = getenv( 'GOOGLESITEKIT_PREFIX_PACKAGES' );
if ( $only_packages ) {
	$non_dev_packages = array_intersect_key( $non_dev_packages, array_flip( explode( ',', $only_packages ) ) );

	if ( empty( $non_dev_packages ) ) {
		throw new InvalidArgumentException( 'None of the packages in GOOGLESITEKIT_PREFIX_PACKAGES are non-dev dependencies.' );
	}
}

return array(
	'prefix'                  => 'Google\\Site_Kit_Dependencies',
	'finders'                 => array(
		// All non-dev dependency package files.
		Finder::create()
			->files()
			->in( __DIR__ . '/vendor' )
			// Match package directories exactly, e.g. so that `google/apiclient` doesn't also match `google/apiclient-services-*`.
			->path(
				array_map(
					fn ( $name ) => '#^' . preg_quote( $name, '#' ) . '/#',
					array_keys( $non_dev_packages )
				)
			)
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
	'exclude-files'           => array_merge(
		array(
			// This dependency is a global function which should remain global.
			'vendor/ralouphie/getallheaders/src/getallheaders.php',
		),
		// PHP-Scoper writes files relative to the deepest directory common to all input files. Copying a
		// file from `vendor/composer` keeps that directory `vendor` when only some packages are prefixed,
		// so each package is written to `<output-dir>/<package-name>` just like in a full run.
		$only_packages ? array( 'vendor/composer/installed.php' ) : array()
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
