<?php
/**
 * Class Google\Site_Kit\Core\Util\Auto_Updates
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Utility class for auto-updates settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Auto_Updates {
	/**
	 * Checks whether plugin auto-updates are enabled for the site.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool `false` if auto-updates are disabled, `true` otherwise.
	 */
	public static function is_plugin_autoupdates_enabled() {
		if ( false === self::is_sitekit_autoupdates_forced() ) {
			return false;
		}

		if ( function_exists( 'wp_is_auto_update_enabled_for_type' ) ) {
			return wp_is_auto_update_enabled_for_type( 'plugin' );
		}

		return false;
	}

	/**
	 * Check whether the site has auto updates enabled for Site Kit.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool `true` if auto updates are enabled, otherwise `false`.
	 */
	public static function is_sitekit_autoupdates_enabled() {
		if ( true === self::is_sitekit_autoupdates_forced() ) {
			return true;
		}

		$enabled_auto_updates = (array) get_site_option( 'auto_update_plugins', array() );

		if ( ! $enabled_auto_updates ) {
			return false;
		}

		// Check if the Site Kit is in the list of auto-updated plugins.
		return in_array( GOOGLESITEKIT_PLUGIN_BASENAME, $enabled_auto_updates, true );
	}

	/**
	 * Checks whether auto-updates are forced for Site Kit.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool | null `true` if auto-updates are forced enabled, `false` if forced disabled, `null` if not forced.
	 */
	public static function is_sitekit_autoupdates_forced() {
		if ( ! function_exists( 'wp_is_auto_update_forced_for_item' ) ) {
			return null;
		}

		$sitekit_plugin_data = get_plugin_data( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		return wp_is_auto_update_forced_for_item( 'plugin', null, $sitekit_plugin_data );
	}
}
