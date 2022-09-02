<?php
/**
 * Class Google\Site_Kit\Core\Util\Build_Mode
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class for interacting with build mode configuration.
 *
 * @since 1.27.0
 * @access private
 * @ignore
 */
class Build_Mode {

	const MODE_PRODUCTION  = 'production';
	const MODE_DEVELOPMENT = 'development';

	/**
	 * Build mode.
	 *
	 * @since 1.27.0
	 * @var string
	 */
	private static $mode = self::MODE_PRODUCTION;

	/**
	 * Sets the build mode.
	 *
	 * @since 1.27.0
	 *
	 * @param string $mode Build mode.
	 */
	public static function set_mode( $mode ) {
		if ( $mode && is_string( $mode ) ) {
			static::$mode = $mode;
		}
	}

	/**
	 * Gets the current build mode.
	 *
	 * @since 1.27.0
	 *
	 * @return string Current mode.
	 */
	public static function get_mode() {
		/**
		 * Filter the build mode.
		 *
		 * @since 1.27.0
		 *
		 * @param string $mode The current build mode.
		 */
		return (string) apply_filters( 'googlesitekit_build_mode', static::$mode ) ?: self::MODE_PRODUCTION;
	}

}
