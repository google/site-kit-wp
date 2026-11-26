<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_ClientTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Event;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\GA_Session;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Client;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Settings;
use Google\Site_Kit\Tests\Measurement_Protocol_Requests_Trait;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Measurement_Protocol_ClientTest extends TestCase {

	use Measurement_Protocol_Requests_Trait;

	/**
	 * Instance under test.
	 *
	 * @var Measurement_Protocol_Client
	 */
	private $client;

	/**
	 * Session of the visitor, with client ID `1234567890.1700000000` and session ID `1700000000`.
	 *
	 * @var GA_Session
	 */
	private $session;

	public function set_up() {
		parent::set_up();

		$context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options   = new Options( $context );
		$analytics = new Analytics_4( $context, $options );

		$analytics->get_settings()->merge(
			array(
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'measurementID'   => 'G-ABC123',
			)
		);
		( new Measurement_Protocol_Settings( new Encrypted_Options( $options ) ) )->set(
			array(
				// Its `+` fails the endpoint tests if the client leaves the query args unencoded.
				'secretValue'     => 'test-secret+value',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'secretID'        => 'test-secret-id',
			)
		);

		$this->client  = new Measurement_Protocol_Client( $analytics->get_settings(), $analytics->get_measurement_protocol_secret() );
		$this->session = GA_Session::from_values( 'GA1.1.1234567890.1700000000', 'GS2.1.s1700000000$t1700000500', 'G-ABC123', 1700000500 );

		// Answer each request with a 204 response, so no request leaves the test.
		$this->subscribe_to_wp_http_requests(
			function ( $url, $args ) {
				$this->requests[] = array(
					'url'  => $url,
					'args' => $args,
				);
			},
			array(
				'headers'  => array(),
				'body'     => '',
				'response' => array( 'code' => 204 ),
			)
		);
	}

	public function test_send__sends_measurement_id_and_api_secret_as_query_args() {
		$this->client->send( $this->session, array( new Event( 'sign_up', array(), 'sign_up:user:1' ) ), 'blocking' );

		$this->assertCount( 1, $this->requests, 'One request should be sent.' );
		$this->assertSame(
			'https://www.google-analytics.com/mp/collect?measurement_id=G-ABC123&api_secret=test-secret%2Bvalue',
			$this->requests[0]['url'],
			'The request should go to the Measurement Protocol endpoint, with the measurement ID and the API secret as query args.'
		);
	}

	public function test_send__sends_to_the_filtered_endpoint() {
		add_filter( 'googlesitekit_analytics_4_mp_endpoint', fn () => 'https://region1.google-analytics.com/mp/collect' );

		$this->client->send( $this->session, array( new Event( 'sign_up', array(), 'sign_up:user:1' ) ), 'blocking' );

		$this->assertCount( 1, $this->requests, 'One request should be sent.' );
		$this->assertSame(
			'https://region1.google-analytics.com/mp/collect?measurement_id=G-ABC123&api_secret=test-secret%2Bvalue',
			$this->requests[0]['url'],
			'The request should go to the URL the filter returns.'
		);
	}

	public function test_send__sends_ids_and_consent_in_body() {
		$event = new Event( 'sign_up', array( 'method' => 'email' ), 'sign_up:user:1' );

		$this->assertIsInt( $event->get_timestamp_micros(), 'The event should have its time before it is sent.' );

		$this->client->send( $this->session, array( $event ), 'blocking' );
		$body = $this->get_sent_body();

		$this->assertSame( 'application/json', $this->requests[0]['args']['headers']['Content-Type'], 'The body should be sent as JSON.' );
		$this->assertSame(
			array(
				'client_id' => '1234567890.1700000000',
				'consent'   => array(
					'ad_user_data'       => 'DENIED',
					'ad_personalization' => 'DENIED',
				),
				'events'    => array(
					array(
						'name'             => 'sign_up',
						'timestamp_micros' => $event->get_timestamp_micros(),
						'params'           => array(
							'method'               => 'email',
							'session_id'           => '1700000000',
							'engagement_time_msec' => 1,
							'event_source'         => 'site-kit',
						),
					),
				),
			),
			$body,
			'The body should have the visitor\'s IDs, denied consent, and each event with its time, its params and the params the client adds.'
		);
	}

	public function test_send__sends_the_visitor_session_id_over_an_event_param() {
		$event = new Event( 'sign_up', array( 'session_id' => '999' ), 'sign_up:user:1' );

		$this->assertSame( array( 'session_id' => '999' ), $event->get_params(), 'The event should have a `session_id` param of its own before it is sent.' );

		$this->client->send( $this->session, array( $event ), 'blocking' );

		$this->assertSame(
			'1700000000',
			$this->get_sent_body()['events'][0]['params']['session_id'],
			'An event\'s own `session_id` param should be replaced by the visitor\'s session ID.'
		);
	}

	public function test_send__sends_all_events_in_one_request() {
		$events = array(
			new Event( 'sign_up', array(), 'sign_up:user:1' ),
			new Event( 'comment_submit', array(), 'comment_submit:comment:1' ),
			new Event( 'product_download', array(), 'product_download:download:1' ),
		);

		$this->client->send( $this->session, $events, 'blocking' );

		$this->assertCount( 1, $this->requests, 'All events should be sent in one request.' );
		$this->assertSame(
			array( 'sign_up', 'comment_submit', 'product_download' ),
			array_column( $this->get_sent_body()['events'], 'name' ),
			'One request should have each event, in order.'
		);
	}

	/**
	 * @dataProvider data_modes
	 *
	 * @param string    $mode     Mode `send()` gets.
	 * @param bool      $blocking Expected `blocking` request arg.
	 * @param int|float $timeout  Expected `timeout` request arg.
	 */
	public function test_send__sends_request_args_of_each_mode( $mode, $blocking, $timeout ) {
		$this->client->send( $this->session, array( new Event( 'sign_up', array(), 'sign_up:user:1' ) ), $mode );

		$this->assertCount( 1, $this->requests, 'One request should be sent.' );
		$this->assertSame( $blocking, $this->requests[0]['args']['blocking'], 'The request should wait for the response only in `blocking` mode.' );
		$this->assertSame( $timeout, $this->requests[0]['args']['timeout'], 'The request should take the timeout of its mode.' );
	}

	public function data_modes() {
		return array(
			'blocking' => array( 'blocking', true, 2 ),
			'async'    => array( 'async', false, 0.01 ),
		);
	}

	public function test_send__sends_nothing_for_body_of_130_kb_or_more() {
		$this->client->send( $this->session, array( new Event( 'sign_up', array(), 'sign_up:user:1' ) ), 'blocking' );
		$this->assertCount( 1, $this->requests, 'A small body should be sent.' );
		// A param with an empty value adds its name and 6 characters to the body: `"<name>":"",`.
		$name_length = 130000 - strlen( $this->requests[0]['args']['body'] ) - 6;

		$this->client->send( $this->session, array( new Event( 'sign_up', array( str_repeat( 'a', $name_length - 1 ) => '' ), 'sign_up:user:1' ) ), 'blocking' );

		$this->assertCount( 2, $this->requests, 'A body under 130,000 bytes should be sent.' );
		$this->assertSame( 129999, strlen( $this->requests[1]['args']['body'] ), 'The second body should have 129,999 bytes.' );

		$this->client->send( $this->session, array( new Event( 'sign_up', array( str_repeat( 'a', $name_length ) => '' ), 'sign_up:user:1' ) ), 'blocking' );

		$this->assertCount( 2, $this->requests, 'A body of 130,000 bytes should not be sent.' );
	}
}
