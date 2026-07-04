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
	 * Entries as $handle => [ $filename, $hash ] map.
	 *
	 * @since 1.48.0
	 * @var array
	 */
	private static $data;

	/**
	 * Gets the manifest entry for the given handle.
	 *
	 * @since 1.48.0
	 *
	 * @param string $handle Asset handle to get manifest data for.
	 * @return array List of $filename and $hash, or `null` for both if not found.
	 */
	public static function get( $handle ) {
		if ( null === self::$data ) {
			self::load();
		}

		if ( isset( self::$data[ $handle ] ) ) {
			return self::$data[ $handle ];
		}

		return array( null, null );
	}

	/**
	 * Loads the generated manifest file.
	 *
	 * @since 1.48.0
	 */
	private static function load() {
		$path = Plugin::instance()->context()->path( 'dist/manifest.php' );

		if ( file_exists( $path ) ) {
			// If the include fails, $data will be `false`
			// so this should only be attempted once.
			self::$data = include $path;
		}
	}
}
