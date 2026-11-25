<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Client
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Modules\Analytics_4\Settings;

/**
 * Class that sends server-side events to the Measurement Protocol.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Measurement_Protocol_Client {

	/**
	 * URL of the Measurement Protocol endpoint, unless a filter changes it.
	 *
	 * @since n.e.x.t
	 */
	const DEFAULT_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

	/**
	 * Size in bytes from which a request body is too large for Google.
	 *
	 * Google's limit is 130kB. It is read here at 1,000 bytes a kB, so a body sent is under the limit at 1,024 bytes a kB too.
	 *
	 * @since n.e.x.t
	 */
	const MAX_BODY_BYTES = 130000;

	/**
	 * Number of params that `send()` adds to each event.
	 *
	 * @since n.e.x.t
	 */
	const ADDED_PARAMS_COUNT = 3;

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
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Settings                    $settings                    Analytics 4 settings instance.
	 * @param Measurement_Protocol_Secret $measurement_protocol_secret Measurement_Protocol_Secret instance.
	 */
	public function __construct( Settings $settings, Measurement_Protocol_Secret $measurement_protocol_secret ) {
		$this->settings                    = $settings;
		$this->measurement_protocol_secret = $measurement_protocol_secret;
	}

	/**
	 * Sends events to the Measurement Protocol in one request.
	 *
	 * It sends nothing where the JSON body has `MAX_BODY_BYTES` or more.
	 *
	 * @since n.e.x.t
	 *
	 * @param GA_Session $session Session of the visitor the events belong to.
	 * @param Event[]    $events  Events to send.
	 * @param string     $mode    `blocking` to wait up to 2 seconds for the response, or `async` to ignore it. Under
	 *                            WordPress's cURL transport, `async` still waits up to 1 second for the request to end.
	 */
	public function send( GA_Session $session, array $events, string $mode ) {
		// These come after each event's own params, so they replace a param of the same name.
		$added_params = array(
			'session_id'           => $session->get_session_id(),
			'engagement_time_msec' => 1,
			'event_source'         => 'site-kit',
		);

		$body = wp_json_encode(
			array(
				'client_id' => $session->get_client_id(),
				'consent'   => array(
					'ad_user_data'       => 'DENIED',
					'ad_personalization' => 'DENIED',
				),
				'events'    => array_map(
					fn ( Event $event ) => array(
						'name'             => $event->get_name(),
						'timestamp_micros' => $event->get_timestamp_micros(),
						'params'           => array_merge( $event->get_params(), $added_params ),
					),
					$events
				),
			)
		);

		if ( strlen( $body ) >= self::MAX_BODY_BYTES ) {
			return;
		}

		/**
		 * Filters the URL of the Measurement Protocol endpoint that Site Kit sends server-side events to.
		 *
		 * @since n.e.x.t
		 *
		 * @param string $endpoint Endpoint URL.
		 */
		$endpoint    = apply_filters( 'googlesitekit_analytics_4_mp_endpoint', self::DEFAULT_ENDPOINT );
		$is_blocking = 'blocking' === $mode;

		wp_remote_post(
			add_query_arg(
				urlencode_deep(
					array(
						'measurement_id' => $this->settings->get()['measurementID'],
						'api_secret'     => $this->measurement_protocol_secret->get_api_secret(),
					)
				),
				$endpoint
			),
			array(
				'headers'  => array( 'Content-Type' => 'application/json' ),
				'body'     => $body,
				'blocking' => $is_blocking,
				'timeout'  => $is_blocking ? 2 : 0.01,
			)
		);
	}
}
