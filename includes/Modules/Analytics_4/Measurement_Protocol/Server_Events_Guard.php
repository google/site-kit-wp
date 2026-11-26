<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Server_Events_Guard
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol;

use AMP_HTTP;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Tag_Guard;
use Google\Site_Kit\Modules\Analytics_4\Tracking_Exclusions;
use Google\Site_Kit\Modules\Analytics_4\Web_Tag;
use WP_Consent_API;

/**
 * Class that decides in the visitor's request whether Site Kit may send a server-side event.
 *
 * The opt-out snippet, Consent Mode and `data-block-on-consent` act only in the browser, so none of them stops a
 * server-side event.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Server_Events_Guard {

	use Method_Proxy_Trait;

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Analytics 4 module instance.
	 *
	 * @since n.e.x.t
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Conversion_Tracking_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Conversion_Tracking_Settings
	 */
	private $conversion_tracking_settings;

	/**
	 * Measurement_Protocol_Secret instance.
	 *
	 * @since n.e.x.t
	 * @var Measurement_Protocol_Secret
	 */
	private $measurement_protocol_secret;

	/**
	 * Tracking_Exclusions instance.
	 *
	 * @since n.e.x.t
	 * @var Tracking_Exclusions
	 */
	private $tracking_exclusions;

	/**
	 * Whether the tracking exclusions turned tracking off at the end of `init`, or null before then.
	 *
	 * @since n.e.x.t
	 * @var bool|null
	 */
	private $is_tracking_excluded_at_init;

	/**
	 * Result of the request checks, or null before the first `can_send()` call.
	 *
	 * @since n.e.x.t
	 * @var bool|null
	 */
	private $is_request_allowed;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context                      $context                      Plugin context.
	 * @param Analytics_4                  $analytics                    Analytics 4 module instance.
	 * @param Conversion_Tracking_Settings $conversion_tracking_settings Conversion_Tracking_Settings instance.
	 * @param Measurement_Protocol_Secret  $measurement_protocol_secret  Measurement_Protocol_Secret instance.
	 * @param Tracking_Exclusions          $tracking_exclusions          Tracking_Exclusions instance.
	 */
	public function __construct(
		Context $context,
		Analytics_4 $analytics,
		Conversion_Tracking_Settings $conversion_tracking_settings,
		Measurement_Protocol_Secret $measurement_protocol_secret,
		Tracking_Exclusions $tracking_exclusions
	) {
		$this->context                      = $context;
		$this->analytics                    = $analytics;
		$this->conversion_tracking_settings = $conversion_tracking_settings;
		$this->measurement_protocol_secret  = $measurement_protocol_secret;
		$this->tracking_exclusions          = $tracking_exclusions;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		// A registration can log the visitor in later in the request, so the exclusions are stored when `init` ends.
		add_action( 'init', $this->get_method_proxy( 'store_tracking_exclusion' ), PHP_INT_MAX );
	}

	/**
	 * Checks whether Site Kit may send a server-side event in the current request.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dedupe_key Dedupe key of the event, as `<event name>:<object type>:<object ID>`.
	 * @return bool True if every check passes, otherwise false.
	 */
	public function can_send( string $dedupe_key ) {
		return $this->is_request_allowed() && $this->is_event_allowed( $dedupe_key );
	}

	/**
	 * Gets the name of the WP Consent API cookie of the statistics category.
	 *
	 * @since n.e.x.t
	 *
	 * @return string|null Cookie name, or null without the WP Consent API or its config.
	 */
	protected function get_consent_cookie_name() {
		if ( ! class_exists( 'WP_Consent_API' ) || ! isset( WP_Consent_API::$config ) ) {
			return null;
		}

		return WP_Consent_API::$config->consent_cookie_prefix() . '_statistics';
	}

	/**
	 * Stores whether the tracking exclusions turn tracking off for the visitor.
	 *
	 * @since n.e.x.t
	 */
	private function store_tracking_exclusion() {
		$this->is_tracking_excluded_at_init = $this->tracking_exclusions->is_disabled();
	}

	/**
	 * Checks once whether the request may send server-side events, and keeps that result for the rest of the request.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if every check of the request passes, otherwise false.
	 */
	private function is_request_allowed() {
		if ( null === $this->is_request_allowed ) {
			$this->is_request_allowed = $this->has_valid_connection()
				&& $this->conversion_tracking_settings->is_conversion_tracking_enabled()
				&& ! empty( $this->measurement_protocol_secret->get_api_secret() )
				&& $this->can_place_tag()
				&& ! $this->is_tracking_excluded()
				&& ! $this->has_denied_statistics_consent()
				&& ! $this->is_amp_form_submission();
		}

		return $this->is_request_allowed;
	}

	/**
	 * Checks whether Analytics is connected with a valid property ID and measurement ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if Analytics is connected with valid IDs, otherwise false.
	 */
	private function has_valid_connection() {
		if ( ! $this->analytics->is_connected() ) {
			return false;
		}

		$settings = $this->analytics->get_settings()->get();

		return preg_match( '/\A\d+\z/', $settings['propertyID'] ) && preg_match( '/\AG-[A-Z0-9]+\z/', $settings['measurementID'] );
	}

	/**
	 * Checks whether the tag's filter, `Tag_Guard` and `Tag_Environment_Type_Guard` let Site Kit place the Analytics tag.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if neither the filter nor those two classes stop the tag, otherwise false.
	 */
	private function can_place_tag() {
		// Unlike `Analytics_4::register_tag()`, this leaves out `Tag_Verify_Guard`, which only hides the tag on Site Kit's own `tagverify` request.
		$tag = new Web_Tag( $this->analytics->get_settings()->get()['measurementID'], Analytics_4::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return false;
		}

		$tag->use_guard( new Tag_Guard( $this->analytics->get_settings() ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		return $tag->can_register();
	}

	/**
	 * Checks whether the tracking exclusions turn tracking off for the visitor.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if tracking is off for the visitor, otherwise false.
	 */
	private function is_tracking_excluded() {
		return $this->is_tracking_excluded_at_init ?? $this->tracking_exclusions->is_disabled();
	}

	/**
	 * Checks whether the visitor denied statistics consent through the WP Consent API.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the statistics cookie is `deny`, otherwise false.
	 */
	private function has_denied_statistics_consent() {
		$cookie_name = $this->get_consent_cookie_name();

		if ( null === $cookie_name ) {
			return false;
		}

		// `wp_has_consent()` returns true wherever no consent type is set, whatever the cookie says.
		return 'deny' === $this->context->input()->filter( INPUT_COOKIE, $cookie_name );
	}

	/**
	 * Checks whether the request is a form that the AMP plugin sent from an AMP page.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the AMP plugin marked the request as a form it sends from an AMP page, otherwise false.
	 */
	private function is_amp_form_submission() {
		// The AMP plugin adds this query var to each form it sends from an AMP page, and keeps it here from `init` on.
		// `Context::is_amp()` sees only the address the form posts to, never the page it was sent from.
		// The name is written out, because `AMP_HTTP::ACTION_XHR_CONVERTED_QUERY_VAR` only came in AMP 1.2.
		return class_exists( 'AMP_HTTP' ) && ! empty( AMP_HTTP::$purged_amp_query_vars['_wp_amp_action_xhr_converted'] );
	}

	/**
	 * Checks on every call whether the event may be sent.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dedupe_key Dedupe key of the event, as `<event name>:<object type>:<object ID>`.
	 * @return bool True if every check of the event passes, otherwise false.
	 */
	private function is_event_allowed( string $dedupe_key ) {
		// Action Scheduler, which WooCommerce bundles, can run its queue in an admin-ajax request that carries the visitor's cookies, where `wp_doing_cron()` is false.
		if ( wp_doing_cron() || ( defined( 'WP_CLI' ) && WP_CLI ) || doing_action( 'action_scheduler_run_queue' ) ) {
			return false;
		}

		return ! $this->is_prefetch_request() && ! $this->is_action_by_site_manager( $dedupe_key );
	}

	/**
	 * Checks whether the browser sent the request to prefetch a page.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if a prefetch header is set, otherwise false.
	 */
	private function is_prefetch_request() {
		$input = $this->context->input();

		return 0 === strpos( (string) $input->filter( INPUT_SERVER, 'HTTP_SEC_PURPOSE' ), 'prefetch' )
			|| 'prefetch' === $input->filter( INPUT_SERVER, 'HTTP_PURPOSE' )
			|| 'prefetch' === $input->filter( INPUT_SERVER, 'HTTP_X_MOZ' );
	}

	/**
	 * Checks whether someone managing the site took the action of the event.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dedupe_key Dedupe key of the event, as `<event name>:<object type>:<object ID>`.
	 * @return bool True if the current user can edit the comment, or can create users for an account, otherwise false.
	 */
	private function is_action_by_site_manager( string $dedupe_key ) {
		list( , $object_type, $object_id ) = explode( ':', $dedupe_key, 3 );

		if ( 'comment' === $object_type ) {
			return current_user_can( 'edit_comment', $object_id );
		}

		if ( 'user' === $object_type ) {
			return current_user_can( 'create_users' );
		}

		return false;
	}
}
