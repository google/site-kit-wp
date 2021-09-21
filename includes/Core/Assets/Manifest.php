<?php
/**
 * Class Google\Site_Kit\Core\Assets\Manifest
 *
 * @package   GoogleSite_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

use Google\Site_Kit\Plugin;

/**
 * Assets manifest.
 *
 * @since 1.15.0
 * @access private
 * @ignore
 */
class Manifest {

	private static $assets;

	public static function get_filename( $handler ) {
		if ( is_null( self::$assets ) ) {
			self::$assets = include Plugin::instance()->context()->path( "dist/manifest.php" );
		}
		if ( isset( self::$assets[ $handler ] ) ) {
			return self::$assets[ $handler ];
		}
		$handler = str_replace( 'googlesitekit-', '', $handler );
		if ( isset( self::$assets[ $handler ] ) ) {
			return self::$assets[ $handler ];
		}

		return null;
	}
}
