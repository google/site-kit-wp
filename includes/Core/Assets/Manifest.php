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

	/**
	 * Files as $handle => $filename map.
	 *
	 * @since 1.43.0
	 * @var array|null
	 */
	private static $assets;

	/**
	 * Gets the filename for a given handle.
	 *
	 * @since 1.43.0
	 *
	 * @param string $handle  Script or stylesheet handle.
	 */
	public static function get_filename( $handle ) {
		if ( is_null( self::$assets ) ) {
			$path = Plugin::instance()->context()->path( "dist/manifest.php" );
			if ( file_exists( $path ) ) {
				self::$assets = include $path;
			}
		}
		if ( isset( self::$assets[ $handle ] ) ) {
			return self::$assets[ $handle ];
		}
		$handle = str_replace( 'googlesitekit-', '', $handle );
		if ( isset( self::$assets[ $handle ] ) ) {
			return self::$assets[ $handle ];
		}

		return null;
	}
}
