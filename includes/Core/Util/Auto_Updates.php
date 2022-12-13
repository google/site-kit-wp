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
	 * Check whether the site has auto updates enabled for Site Kit.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool `true` if auto updates are enabled, otherwise `false`.
	 */
	public static function is_sitekit_autoupdates_enabled() {
		$enabled_auto_updates = (array) get_site_option( 'auto_update_plugins', array() );

		if ( ! $enabled_auto_updates ) {
			return false;
		}

		// Check if the Site Kit is in the list of auto-updated plugins.
		return in_array( GOOGLESITEKIT_PLUGIN_BASENAME, $enabled_auto_updates, true );
	}
}
