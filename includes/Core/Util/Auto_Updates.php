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

use stdClass;

/**
 * Utility class for auto-updates settings.
 *
 * @since 1.93.0
 * @access private
 * @ignore
 */
class Auto_Updates {

	/**
	 * Auto updated forced enabled.
	 *
	 * @since 1.93.0
	 * @var true
	 */
	const AUTO_UPDATE_FORCED_ENABLED = true;

	/**
	 * Auto updated forced disabled.
	 *
	 * @since 1.93.0
	 * @var false
	 */
	const AUTO_UPDATE_FORCED_DISABLED = false;

	/**
	 * Auto updated not forced.
	 *
	 * @since 1.93.0
	 * @var false
	 */
	const AUTO_UPDATE_NOT_FORCED = null;

	/**
	 * Checks whether plugin auto-updates are enabled for the site.
	 *
	 * @since 1.93.0
	 *
	 * @return bool `false` if auto-updates are disabled, `true` otherwise.
	 */
	public static function is_plugin_autoupdates_enabled() {
		if ( self::AUTO_UPDATE_FORCED_DISABLED === self::sitekit_forced_autoupdates_status() ) {
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
	 * @since 1.93.0
	 *
	 * @return bool `true` if auto updates are enabled, otherwise `false`.
	 */
	public static function is_sitekit_autoupdates_enabled() {
		if ( self::AUTO_UPDATE_FORCED_ENABLED === self::sitekit_forced_autoupdates_status() ) {
			return true;
		}

		if ( self::AUTO_UPDATE_FORCED_DISABLED === self::sitekit_forced_autoupdates_status() ) {
			return false;
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
	 * @since 1.93.0
	 *
	 * @return bool|null
	 */
	public static function sitekit_forced_autoupdates_status() {
		if ( ! function_exists( 'wp_is_auto_update_forced_for_item' ) ) {
			return self::AUTO_UPDATE_NOT_FORCED;
		}

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$sitekit_plugin_data = get_plugin_data( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$sitekit_update_data = self::get_sitekit_update_data();
		$item                = (object) array_merge( $sitekit_plugin_data, $sitekit_update_data );

		$is_auto_update_forced_for_sitekit = wp_is_auto_update_forced_for_item( 'plugin', null, $item );

		if ( true === $is_auto_update_forced_for_sitekit ) {
			return self::AUTO_UPDATE_FORCED_ENABLED;
		}

		if ( false === $is_auto_update_forced_for_sitekit ) {
			return self::AUTO_UPDATE_FORCED_DISABLED;
		}

		return self::AUTO_UPDATE_NOT_FORCED;
	}

	/**
	 * Merges plugin update data in the site transient with some default plugin data.
	 *
	 * @since 1.113.0
	 *
	 * @return array Site Kit plugin update data.
	 */
	protected static function get_sitekit_update_data() {
		$sitekit_update_data = array(
			'id'            => 'w.org/plugins/' . dirname( GOOGLESITEKIT_PLUGIN_BASENAME ),
			'slug'          => dirname( GOOGLESITEKIT_PLUGIN_BASENAME ),
			'plugin'        => GOOGLESITEKIT_PLUGIN_BASENAME,
			'new_version'   => '',
			'url'           => '',
			'package'       => '',
			'icons'         => array(),
			'banners'       => array(),
			'banners_rtl'   => array(),
			'tested'        => '',
			'requires_php'  => GOOGLESITEKIT_PHP_MINIMUM,
			'compatibility' => new stdClass(),
		);

		$plugin_updates = get_site_transient( 'update_plugins' );

		$transient_data = array();

		if ( isset( $plugin_updates->noupdate[ GOOGLESITEKIT_PLUGIN_BASENAME ] ) ) {
			$transient_data = $plugin_updates->noupdate[ GOOGLESITEKIT_PLUGIN_BASENAME ];
		}

		if ( isset( $plugin_updates->response[ GOOGLESITEKIT_PLUGIN_BASENAME ] ) ) {
			$transient_data = $plugin_updates->response[ GOOGLESITEKIT_PLUGIN_BASENAME ];
		}

		return array_merge( $sitekit_update_data, (array) $transient_data );
	}
}
