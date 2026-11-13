<?php
/**
 * Class Google\Site_Kit\Core\Telemetry\Telemetry
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Telemetry;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tracking\Tracking_Consent;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class providing OpenTelemetry error reporting configuration to JS.
 *
 * Proof of concept. Records are emitted by the browser; this class only
 * decides where they go and whether the current user has consented.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Telemetry {

	use Method_Proxy_Trait;

	/**
	 * Default OTLP endpoint: the local PoC collector. In production this would
	 * be the Site Kit Service.
	 */
	const DEFAULT_ENDPOINT = 'http://localhost:4318';

	/**
	 * Constant that overrides the endpoint. An empty value disables reporting.
	 */
	const ENDPOINT_CONSTANT = 'GOOGLESITEKIT_OTLP_ENDPOINT';

	/**
	 * Tracking_Consent instance.
	 *
	 * @since n.e.x.t
	 * @var Tracking_Consent
	 */
	protected $consent;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context      Context instance.
	 * @param User_Options $user_options Optional. User_Options instance. Default is a new instance.
	 */
	public function __construct( Context $context, ?User_Options $user_options = null ) {
		$this->consent = new Tracking_Consent( $user_options ?: new User_Options( $context ) );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter( 'googlesitekit_inline_tracking_data', $this->get_method_proxy( 'inline_js_telemetry_data' ) );
	}

	/**
	 * Gets the OTLP endpoint.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Endpoint base URL, or empty string when reporting is disabled.
	 */
	public function get_endpoint() {
		if ( ! defined( self::ENDPOINT_CONSTANT ) ) {
			return self::DEFAULT_ENDPOINT;
		}

		$endpoint = constant( self::ENDPOINT_CONSTANT );

		return is_string( $endpoint ) ? untrailingslashit( esc_url_raw( $endpoint ) ) : '';
	}

	/**
	 * Adds telemetry configuration to the data passed to JS.
	 *
	 * The endpoint is only provided to users who have consented to tracking.
	 * Consent is stored per user, so there is none to check outside an
	 * authenticated request.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_telemetry_data( $data ) {
		$data['otlpEndpoint'] = $this->consent->get() ? $this->get_endpoint() : '';
		$data['otlpResource'] = array(
			'wpVersion'  => get_bloginfo( 'version' ),
			'phpVersion' => PHP_VERSION,
		);

		return $data;
	}
}
