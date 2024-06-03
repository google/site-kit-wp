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
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class to handle all wp-admin Authorize Application related functionality.
 *
 * @since 1.126.0
 * @access private
 * @ignore
 */
final class Authorize_Application {

	use Method_Proxy_Trait;

	/**
	 * Plugin context.
	 *
	 * @since 1.126.0
	 * @var Context
	 */
	private $context;

	/**
	 * Assets instance.
	 *
	 * @since 1.126.0
	 * @var Assets
	 */
	private $assets;

	/**
	 * Constructor.
	 *
	 * @since 1.126.0
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
	 * @since 1.126.0
	 */
	public function register() {
		add_action( 'admin_enqueue_scripts', $this->get_method_proxy( 'enqueue_assets' ) );
		add_action( 'admin_footer', $this->get_method_proxy( 'render_custom_footer' ) );
	}

	/**
	 * Checks if the current screen is the Authorize Application screen.
	 *
	 * @since 1.126.0
	 *
	 * @return bool True if the current screen is the Authorize Application screen, false otherwise.
	 */
	protected function is_authorize_application_screen() {
		$current_screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

		if ( $current_screen instanceof \WP_Screen && 'authorize-application' === $current_screen->id ) {
			return true;
		}

		return false;
	}

	/**
	 * Checks if the current service is a Google service.
	 *
	 * @since 1.126.0
	 *
	 * @return bool True if the current service is a Google service, false otherwise.
	 */
	protected function is_google_service() {
		$success_url = isset( $_GET['success_url'] ) ? esc_url_raw( wp_unslash( $_GET['success_url'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
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
	 * @since 1.126.0
	 */
	private function enqueue_assets() {
		if ( $this->is_authorize_application_screen() && $this->is_google_service() ) {
			$this->assets->enqueue_asset( 'googlesitekit-authorize-application-css' );
		}
	}

	/**
	 * Renders custom footer for the Authorize Application screen if the service is a Google service.
	 *
	 * @since 1.126.0
	 */
	private function render_custom_footer() {
		if ( $this->is_authorize_application_screen() && $this->is_google_service() ) {
			echo '<div class="googlesitekit-authorize-application__footer"><p>' . esc_html__( 'Powered by Site Kit', 'google-site-kit' ) . '</p></div>';
		}
	}
}
