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
class DeveloperPluginInstaller {

	const SLUG      = 'google-site-kit-dev-settings';
	const TRANSIENT = 'googlesitekit_helper_updater';

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

		add_filter(
			'pre_set_site_transient_update_plugins',
			function( $value ) {
				return $this->updater_data( $value );
			}
		);

		add_action(
			'load-update-core.php',
			function() {
				$this->clear_plugin_data();
			}
		);

		add_action(
			'upgrader_process_complete',
			function( $upgrader, $options ) {
				if ( 'update' !== $options['action'] || 'plugin' !== $options['type'] || ! isset( $options['plugins'] ) || ! in_array( self::SLUG, $options['plugins'], true ) ) {
					return;
				}

				$this->clear_plugin_data();
			},
			10,
			2
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
	 * Retrieves plugin update data from the Site Kit REST API.
	 *
	 * @since n.e.x.t
	 *
	 * @param object $value Update check object.
	 * @return object Modified update check object.
	 */
	private function updater_data( $value ) {

		// Stop here if the current user does not have sufficient capabilities.
		if ( ! current_user_can( 'update_plugins' ) ) {
			return $value;
		}

		$data = $this->fetch_plugin_data();

		if ( empty( $data['download_url'] ) ) {
			return $value;
		}

		$new_data = array(
			'id'           => 'sitekit.withgoogle.com/' . self::SLUG,
			'slug'         => self::SLUG,
			'plugin'       => self::SLUG,
			'new_version'  => $data['version'],
			'url'          => $data['url'],
			'package'      => $data['download_url'],
			'tested'       => $data['tested'],
			'requires'     => $data['requires'],
			'requires_php' => $data['requires_php'],
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

		$value->response[ self::SLUG ] = (object) $new_data;

		return $value;
	}

	/**
	 * Gets plugin data from the API.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|false Associative array of plugin data, or false on failure.
	 */
	private function fetch_plugin_data() {
		$data = get_site_transient( self::TRANSIENT );

		// Query the Site Kit REST API if the transient is expired.
		if ( empty( $data ) ) {
			// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get
			$response = wp_remote_get( 'https://sitekit.withgoogle.com/service/dev-plugin-updates/' );

			// Retrieve data from the body and decode json format.
			$data = json_decode( wp_remote_retrieve_body( $response ), true );

			// Stop here if there is an error, set a temporary transient and bail out.
			if ( is_wp_error( $response ) || isset( $data['error'] ) || ! isset( $data['version'] ) ) {
				set_site_transient( self::TRANSIENT, array( 'version' => '0.3.0' ), 30 * MINUTE_IN_SECONDS );
				return false;
			}

			set_site_transient( self::TRANSIENT, $data, DAY_IN_SECONDS );
		}

		return $data;
	}

	/**
	 * Clears plugin data transient.
	 *
	 * @since n.e.x.t
	 */
	private function clear_plugin_data() {
		delete_site_transient( self::TRANSIENT );
	}
}
