<?php
/**
 * Class Google\Site_Kit\Core\Util\DeveloperPluginInstaller
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class responsible for providing the helper plugin via the automatic updater.
 *
 * @since n.e.x.t
 */
class Developer_Plugin_Installer {

	const SLUG = 'google-site-kit-dev-settings';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'plugins_api',
			function( $value, $action, $args ) {
				return $this->plugin_info( $value, $action, $args );
			},
			10,
			3
		);
	}

	/**
	 * Retrieves plugin information data from the Site Kit REST API.
	 *
	 * @since n.e.x.t
	 *
	 * @param false|object|array $value  The result object or array. Default false.
	 * @param string             $action The type of information being requested from the Plugin Installation API.
	 * @param object             $args   Plugin API arguments.
	 * @return false|object|array Updated $value, or passed-through $value on failure.
	 */
	private function plugin_info( $value, $action, $args ) {
		if ( 'plugin_information' !== $action || self::SLUG !== $args->slug ) {
			return $value;
		}

		$data = $this->fetch_plugin_data();
		if ( ! $data ) {
			return $value;
		}

		$new_data = array(
			'slug'          => self::SLUG,
			'name'          => $data['name'],
			'version'       => $data['version'],
			'author'        => '<a href="https://opensource.google.com">Google</a>',
			'download_link' => $data['download_url'],
			'trunk'         => $data['download_url'],
			'tested'        => $data['tested'],
			'requires'      => $data['requires'],
			'requires_php'  => $data['requires_php'],
			'last_updated'  => $data['last_updated'],
		);
		if ( ! empty( $data['icons'] ) ) {
			$new_data['icons'] = $data['icons'];
		}
		if ( ! empty( $data['banners'] ) ) {
			$new_data['banners'] = $data['banners'];
		}
		if ( ! empty( $data['banners_rtl'] ) ) {
			$new_data['banners_rtl'] = $data['banners_rtl'];
		}

		return (object) $new_data;
	}

	/**
	 * Gets plugin data from the API.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|null Associative array of plugin data, or null on failure.
	 */
	private function fetch_plugin_data() {
		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get
		$response = wp_remote_get( 'https://sitekit.withgoogle.com/service/dev-plugin-updates/' );

		// Retrieve data from the body and decode json format.
		return json_decode( wp_remote_retrieve_body( $response ), true );
	}
}
