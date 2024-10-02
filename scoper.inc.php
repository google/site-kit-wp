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

// Google API services to include classes for.
$google_services = implode(
	'|',
	array(
		'Adsense',
		'AnalyticsData',
		'GoogleAnalyticsAdmin',
		'PagespeedInsights',
		'PeopleService',
		'SearchConsole',
		'SiteVerification',
		'TagManager',
	)
);

return array(
	'prefix'                     => 'Google\\Site_Kit_Dependencies',
	'finders'                    => array(

		// General dependencies, except Google API services.
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
			->path( '#^google/apiclient/#' )
			->path( '#^google/auth/#' )
			->path( '#^guzzlehttp/#' )
			->path( '#^monolog/#' )
			->path( '#^psr/#' )
			->path( '#^ralouphie/#' )
			->path( '#^react/#' )
			->path( '#^symfony/#' )
			->path( '#^true/#' )
			->in( 'vendor' ),

		// Google API service infrastructure classes.
		Finder::create()
			->files()
			->ignoreVCS( true )
			->notName( '/LICENSE|.*\\.md|.*\\.dist|Makefile|composer\\.json|composer\\.lock/' )
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
			->path( "#^google/apiclient-services/src/($google_services)/#" )
			->in( 'vendor' ),

		// Google API service entry classes.
		Finder::create()
			->files()
			->ignoreVCS( true )
			->name( "#^($google_services)\.php$#" )
			->depth( '== 0' )
			->in( 'vendor/google/apiclient-services/src' ),
		Finder::create()
			->files()
			->ignoreVCS( true )
			->name( '#^autoload.php$#' )
			->depth( '== 0' )
			->in( 'vendor/google/apiclient-services' ),
		// Temporary SwG client.
		Finder::create()
		->files()
		->name( '#\.php$#' )
		->in( 'vendor/google/apiclient-services-subscribewithgoogle' ),

		// Temporary support for `GoogleAnalyticsAdminV1alphaAdSenseLink` as it doesn't exist in the API client yet.
		Finder::create()
			->files()
			->name( '#\.php$#' )
			->in( 'vendor/google/apiclient-services-adsenselinks' ),
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
