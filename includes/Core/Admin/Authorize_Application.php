<?php
/**
 * Class Google\Site_Kit\Core\Admin\Authorize_Application
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;

/**
 * Class to handle all wp-admin Authorize Application related functionality.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Authorize_Application {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Assets Instance.
	 *
	 * @since n.e.x.t
	 * @var Assets
	 */
	private $assets;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param Assets  $assets  Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Assets $assets = null
	) {
		$this->context = $context;
		$this->assets  = $assets ?: new Assets( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action(
			'admin_enqueue_scripts',
			array( $this, 'enqueue_assets' )
		);
	}

	/**
	 * Checks if the current screen is the Authorize Application screen.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the current screen is the Authorize Application screen, false otherwise.
	 */
	protected function is_authorize_application_screen() {
		if ( function_exists( 'get_current_screen' ) && get_current_screen()->id === 'authorize-application' ) {
			return true;
		}

		return false;
	}

	/**
	 * Checks if the current service is Google.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the current service is Google, false otherwise.
	 */
	protected function is_google_service() {
		$success_url = isset( $_GET['success_url'] ) ? esc_url_raw( wp_unslash( $_GET['success_url'] ) ) : '';
		$success_url = sanitize_text_field( $success_url );

		$parsed_url = wp_parse_url( $success_url );

		if ( empty( $parsed_url['host'] ) ) {
			return false;
		}

		// Check if the domain is a '*.google.com' domain.
		return preg_match( '/\.google\.com$/', $parsed_url['host'] ) === 1;
	}

	/**
	 * Enqueues assets for the Authorize Application screen.
	 *
	 * @since n.e.x.t
	 */
	public function enqueue_assets() {
		if ( $this->is_authorize_application_screen() && $this->is_google_service() ) {
			$this->assets->enqueue_asset( 'googlesitekit-authorize-application' );
		}
	}

}
