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
 * Class managing OpenTelemetry error reporting.
 *
 * Proof of concept. Emits OTLP log records for errors that Site Kit currently
 * reports as truncated GA events, which cap the payload at 500 bytes and so
 * cannot carry a stack trace.
 *
 * Two deliberate constraints, both of which the design doc argues for:
 *
 * - No OpenTelemetry SDK. The PHP SDK requires PHP 8.1 and Site Kit supports
 *   7.4, and vendoring it would add a dependency tree to a plugin that already
 *   ships the Google API client. OTLP is a documented JSON shape over HTTP, so
 *   we build it by hand and keep the vendor-neutrality that is the actual
 *   point of adopting OpenTelemetry.
 *
 * - No new consent. This rides the existing `Tracking_Consent` opt-in. Note
 *   that consent is stored per WordPress user rather than per site, so any
 *   error raised outside an authenticated request has no consent to check and
 *   must not be reported.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Telemetry {

	use Method_Proxy_Trait;

	/**
	 * Default OTLP endpoint.
	 *
	 * In production this would be the Site Kit Service telemetry endpoint,
	 * exactly as Google_Proxy::PRODUCTION_BASE_URL is the proxy's. It points
	 * at localhost here because that service endpoint does not exist yet —
	 * standing it up is the ask this proposal is making.
	 */
	const DEFAULT_ENDPOINT = 'http://localhost:4318';

	/**
	 * Constant a site defines to override the endpoint, following the
	 * GOOGLESITEKIT_PROXY_URL precedent.
	 *
	 * Defining it as an empty string or false disables reporting entirely,
	 * which is the escape hatch for a site that has consented to tracking but
	 * does not want error reports leaving the server.
	 *
	 * Unlike Google_Proxy, the override is deliberately not restricted to an
	 * allowlist of Google URLs. The proxy carries OAuth tokens, so pointing it
	 * somewhere unexpected is an attack; telemetry carries redacted error
	 * reports, and pointing it at your own collector is a feature — it is how
	 * a site owner would debug their own install, and it is the strongest
	 * open-source argument for adopting a standard protocol rather than a
	 * vendor SDK. Production should still make this choice deliberately rather
	 * than inheriting it from the PoC.
	 */
	const ENDPOINT_CONSTANT = 'GOOGLESITEKIT_OTLP_ENDPOINT';

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

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
		$this->context = $context;
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
	 * Gets a URL to the OTLP endpoint with optional path.
	 *
	 * Mirrors Google_Proxy::url(): a built-in default, overridable by a
	 * constant, so nothing needs configuring for the common case.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $path Optional. Path to append to the base URL.
	 * @return string Endpoint URL, or empty string when reporting is disabled.
	 */
	public function url( $path = '' ) {
		$url = self::DEFAULT_ENDPOINT;

		if ( defined( self::ENDPOINT_CONSTANT ) ) {
			$override = constant( self::ENDPOINT_CONSTANT );

			// An explicitly empty or falsy constant turns reporting off.
			if ( ! is_string( $override ) || '' === $override ) {
				return '';
			}

			$url = esc_url_raw( $override );
		}

		$url = untrailingslashit( $url );

		if ( $path && is_string( $path ) ) {
			$url .= '/' . ltrim( $path, '/' );
		}

		return $url;
	}

	/**
	 * Determines whether error reporting should emit at all.
	 *
	 * Consent is the condition that is not negotiable: WordPress.org plugin
	 * guideline 7 requires data collection to be opt-in and disabled by
	 * default. Note that consent is stored per WordPress user, so this is
	 * only meaningful inside an authenticated request.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if telemetry is active.
	 */
	public function is_active() {
		return '' !== $this->url() && (bool) $this->consent->get();
	}

	/**
	 * Adds telemetry configuration to the data passed to JS.
	 *
	 * Reuses the existing tracking inline-data channel rather than adding a
	 * second one, so there is a single place where "what Site Kit tells the
	 * browser about reporting" is assembled.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_telemetry_data( $data ) {
		$data['otlpEndpoint'] = $this->is_active() ? $this->url() : '';

		// Resource attributes describe the emitter rather than any single
		// error, so they are resolved once here instead of on every record.
		// Everything in this list is either already sent to Google Analytics
		// today or is non-identifying environment detail.
		$data['otlpResource'] = array(
			'wpVersion'   => get_bloginfo( 'version' ),
			'phpVersion'  => PHP_VERSION,
			'isMultisite' => is_multisite(),
		);

		return $data;
	}
}
