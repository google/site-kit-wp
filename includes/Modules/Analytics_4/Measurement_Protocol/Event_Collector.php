<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Event_Collector
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4\Settings;

/**
 * Class that collects the server-side events of a request, and sends them to Google Analytics in one request at its end.
 *
 * It writes nothing to the database.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Event_Collector {

	/**
	 * Maximum number of events in one request to the Measurement Protocol.
	 *
	 * @since n.e.x.t
	 */
	const MAX_EVENTS = 25;

	/**
	 * Maximum number of params in one event.
	 *
	 * The count includes the params that `Measurement_Protocol_Client::send()` adds.
	 *
	 * @since n.e.x.t
	 */
	const MAX_EVENT_PARAMS = 25;

	/**
	 * Pattern of a valid event name or param name.
	 *
	 * It ends on `\z`, because `$` also accepts a trailing newline.
	 *
	 * @since n.e.x.t
	 */
	const NAME_PATTERN = '/\A[A-Za-z][A-Za-z0-9_]{0,39}\z/';

	/**
	 * Event names that the Measurement Protocol refuses from a web data stream.
	 *
	 * Google reserves each of them, and allows the last three for app streams alone.
	 *
	 * @since n.e.x.t
	 */
	const RESERVED_EVENT_NAMES = array(
		'ad_activeview',
		'ad_click',
		'ad_exposure',
		'ad_query',
		'ad_reward',
		'adunit_exposure',
		'app_clear_data',
		'app_exception',
		'app_install',
		'app_remove',
		'app_store_refund',
		'app_update',
		'app_upgrade',
		'dynamic_link_app_open',
		'dynamic_link_app_update',
		'dynamic_link_first_open',
		'error',
		'firebase_campaign',
		'firebase_in_app_message_action',
		'firebase_in_app_message_dismiss',
		'firebase_in_app_message_impression',
		'first_open',
		'first_visit',
		'notification_dismiss',
		'notification_foreground',
		'notification_open',
		'notification_receive',
		'notification_send',
		'os_update',
		'session_start',
		'user_engagement',
		'ad_impression',
		'in_app_purchase',
		'screen_view',
	);

	/**
	 * Prefixes that the Measurement Protocol refuses at the start of a param name.
	 *
	 * `NAME_PATTERN` refuses the other two, `_` and `gtag.`.
	 *
	 * @since n.e.x.t
	 */
	const RESERVED_PARAM_PREFIXES = array( 'google_', 'ga_', 'firebase_' );

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Analytics 4 settings instance.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Measurement_Protocol_Secret instance.
	 *
	 * @since n.e.x.t
	 * @var Measurement_Protocol_Secret
	 */
	private $measurement_protocol_secret;

	/**
	 * Measurement_Protocol_Client instance.
	 *
	 * @since n.e.x.t
	 * @var Measurement_Protocol_Client
	 */
	private $measurement_protocol_client;

	/**
	 * Server_Events_Guard instance.
	 *
	 * @since n.e.x.t
	 * @var Server_Events_Guard
	 */
	private $server_events_guard;

	/**
	 * Events of the request, keyed by dedupe key.
	 *
	 * @since n.e.x.t
	 * @var Event[]
	 */
	private $events = array();

	/**
	 * Visitor's Google Analytics session, or null where the visitor has none.
	 *
	 * @since n.e.x.t
	 * @var GA_Session|null
	 */
	private $session;

	/**
	 * Whether the visitor's session was read in this request.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	private $has_read_session = false;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context                     $context                     Plugin context.
	 * @param Settings                    $settings                    Analytics 4 settings instance.
	 * @param Measurement_Protocol_Secret $measurement_protocol_secret Measurement_Protocol_Secret instance.
	 * @param Measurement_Protocol_Client $measurement_protocol_client Measurement_Protocol_Client instance.
	 * @param Server_Events_Guard         $server_events_guard         Server_Events_Guard instance.
	 */
	public function __construct(
		Context $context,
		Settings $settings,
		Measurement_Protocol_Secret $measurement_protocol_secret,
		Measurement_Protocol_Client $measurement_protocol_client,
		Server_Events_Guard $server_events_guard
	) {
		$this->context                     = $context;
		$this->settings                    = $settings;
		$this->measurement_protocol_secret = $measurement_protocol_secret;
		$this->measurement_protocol_client = $measurement_protocol_client;
		$this->server_events_guard         = $server_events_guard;
	}

	/**
	 * Adds an event, to send at the end of the request.
	 *
	 * It drops the event where `Server_Events_Guard` refuses it, or where the visitor has no current Google Analytics session.
	 * Of two events with one dedupe key, it keeps the more specific one, or the first where both are as specific.
	 *
	 * @since n.e.x.t
	 *
	 * @param Event $event Event to add.
	 */
	public function add( Event $event ) {
		$dedupe_key = $event->get_dedupe_key();

		if ( ! $this->server_events_guard->can_send( $dedupe_key ) || null === $this->get_session() ) {
			return;
		}

		if ( isset( $this->events[ $dedupe_key ] ) && $this->events[ $dedupe_key ]->get_specificity() >= $event->get_specificity() ) {
			return;
		}

		$this->events[ $dedupe_key ] = $event;
	}

	/**
	 * Checks whether an event of the given dedupe key is stored.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dedupe_key Key of the event, as `<event name>:<object type>:<object ID>`.
	 * @return bool True if an event of that key is stored, otherwise false.
	 */
	public function has( string $dedupe_key ) {
		return isset( $this->events[ $dedupe_key ] );
	}

	/**
	 * Sends the stored events to Google Analytics in one request.
	 *
	 * It sends nothing where the measurement ID or the API secret is empty.
	 * Otherwise it drops each event that breaks a limit of the Measurement Protocol, sends the first 25 of the rest, and empties the store.
	 *
	 * @since n.e.x.t
	 */
	public function flush() {
		if ( empty( $this->events ) || empty( $this->settings->get()['measurementID'] ) || empty( $this->measurement_protocol_secret->get_api_secret() ) ) {
			return;
		}

		$events       = array_values( array_filter( $this->events, fn ( Event $event ) => $this->is_valid_event( $event ) ) );
		$this->events = array();

		if ( empty( $events ) ) {
			return;
		}

		$mode = $this->get_dispatch_mode();

		if ( 'finish' === $mode ) {
			// A buffer still open was opened after core ended the buffers at priority 1, or cannot be removed. So the response is finished only with none open.
			$is_request_finished = 0 === $this->get_output_buffer_level() && $this->finish_request();
			$mode                = $is_request_finished ? 'blocking' : 'async';
		}

		$this->measurement_protocol_client->send( $this->session, array_slice( $events, 0, self::MAX_EVENTS ), $mode );
	}

	/**
	 * Gets the number of output buffers open.
	 *
	 * A test replaces it, because PHPUnit keeps an output buffer open.
	 *
	 * @since n.e.x.t
	 *
	 * @return int Output buffering level.
	 */
	protected function get_output_buffer_level() {
		return ob_get_level();
	}

	/**
	 * Finishes the visitor's response where the server can.
	 *
	 * The request to Google Analytics then adds no wait to the response.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the response was finished, otherwise false.
	 */
	protected function finish_request() {
		if ( function_exists( 'fastcgi_finish_request' ) ) {
			return fastcgi_finish_request();
		}

		if ( function_exists( 'litespeed_finish_request' ) ) {
			return litespeed_finish_request();
		}

		return false;
	}

	/**
	 * Gets the visitor's Google Analytics session.
	 *
	 * It reads the session once a request, at the first call.
	 *
	 * @since n.e.x.t
	 *
	 * @return GA_Session|null Session, or null where the visitor has none.
	 */
	private function get_session() {
		if ( ! $this->has_read_session ) {
			$this->session          = GA_Session::from_input( $this->context->input(), $this->settings->get()['measurementID'] );
			$this->has_read_session = true;
		}

		return $this->session;
	}

	/**
	 * Checks whether an event meets the limits of the Measurement Protocol.
	 *
	 * @since n.e.x.t
	 *
	 * @param Event $event Event to check.
	 * @return bool True if the Measurement Protocol takes the event, otherwise false.
	 */
	private function is_valid_event( Event $event ) {
		$name   = $event->get_name();
		$params = $event->get_params();

		if ( ! preg_match( self::NAME_PATTERN, $name ) || in_array( $name, self::RESERVED_EVENT_NAMES, true ) ) {
			return false;
		}

		if ( count( $params ) + Measurement_Protocol_Client::ADDED_PARAMS_COUNT > self::MAX_EVENT_PARAMS ) {
			return false;
		}

		foreach ( array_keys( $params ) as $param_name ) {
			if ( ! preg_match( self::NAME_PATTERN, $param_name ) ) {
				return false;
			}

			foreach ( self::RESERVED_PARAM_PREFIXES as $prefix ) {
				if ( 0 === strpos( $param_name, $prefix ) ) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Gets how to send the events of the request.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Dispatch mode: `finish`, `blocking` or `async`.
	 */
	private function get_dispatch_mode() {
		/**
		 * Filters how Site Kit sends the server-side events of a request to Google Analytics.
		 *
		 * `finish` finishes the visitor's response first, then waits up to 2 seconds for the response of Google Analytics.
		 * Where the server cannot finish the response, or an output buffer is open, the mode becomes `async`.
		 * `blocking` waits up to 2 seconds for the response of Google Analytics. `async` ignores the response, though
		 * WordPress's cURL transport still waits up to 1 second for the request to end. Any other value becomes `finish`.
		 *
		 * @since n.e.x.t
		 *
		 * @param string $mode Dispatch mode. Default `finish`.
		 */
		$mode = apply_filters( 'googlesitekit_analytics_4_mp_dispatch_mode', 'finish' );

		return in_array( $mode, array( 'blocking', 'async' ), true ) ? $mode : 'finish';
	}
}
