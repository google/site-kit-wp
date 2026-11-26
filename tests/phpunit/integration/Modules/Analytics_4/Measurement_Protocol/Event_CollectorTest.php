<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol\Event_CollectorTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Event;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Event_Collector;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Client;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Settings;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Server_Events_Guard;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\Measurement_Protocol_Requests_Trait;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Event_CollectorTest extends TestCase {

	use Measurement_Protocol_Requests_Trait;

	/**
	 * Plugin context, whose input reads `$_COOKIE` at each call.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Analytics 4 module instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Measurement_Protocol_Settings instance that reads and writes the same option as the module's own instance.
	 *
	 * @var Measurement_Protocol_Settings
	 */
	private $measurement_protocol_settings;

	public function set_up() {
		parent::set_up();

		$this->context                       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$options                             = new Options( $this->context );
		$this->analytics                     = new Analytics_4( $this->context, $options );
		$this->measurement_protocol_settings = new Measurement_Protocol_Settings( new Encrypted_Options( $options ) );

		$this->analytics->get_settings()->merge(
			array(
				'accountID'       => '12345678',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'measurementID'   => 'G-ABC123',
				'useSnippet'      => true,
			)
		);
		$this->measurement_protocol_settings->set(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'secretID'        => 'test-secret-id',
			)
		);
		$_COOKIE['_ga']        = 'GA1.1.1234567890.1700000000';
		$_COOKIE['_ga_ABC123'] = 'GS2.1.s1700000000$t' . time();

		add_filter( 'googlesitekit_analytics_4_mp_dispatch_mode', fn () => 'blocking' );

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

	public function tear_down() {
		// `WP_UnitTestCase_Base` does not empty `$_COOKIE`, so cookies would leak into later tests.
		$_COOKIE = array();

		parent::tear_down();
	}

	public function test_add__drops_event_the_guard_refuses() {
		$server_events_guard = $this->createMock( Server_Events_Guard::class );
		$server_events_guard->expects( $this->once() )->method( 'can_send' )->willReturn( false );
		$collector = $this->create_collector( $server_events_guard );

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );

		$this->assertFalse( $collector->has( 'sign_up:user:1' ), 'An event that `Server_Events_Guard` refuses should not be stored.' );

		$collector->flush();

		$this->assertCount( 0, $this->requests, 'No request should be sent for an event that `Server_Events_Guard` refuses.' );
	}

	public function test_add__drops_event_without_current_session() {
		$_COOKIE['_ga_ABC123'] = 'GS2.1.s1700000000$t' . ( time() - 31 * MINUTE_IN_SECONDS );
		$collector             = $this->create_collector();

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );

		$this->assertFalse( $collector->has( 'sign_up:user:1' ), 'An event of a visitor whose last hit was 31 minutes ago should not be stored.' );

		$collector->flush();

		$this->assertCount( 0, $this->requests, 'No request should be sent for a visitor with no current session.' );
	}

	/**
	 * @dataProvider data_cookies_after_the_first_event
	 *
	 * @param array $cookies Cookies of the request after the first `add()`.
	 */
	public function test_add__keeps_the_first_session( $cookies ) {
		$collector = $this->create_collector();

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$_COOKIE = $cookies;
		$collector->add( new Event( 'comment_submit', array(), 'comment_submit:comment:1' ) );

		$this->assertCount( 0, $this->requests, 'No request should be sent before `flush()`.' );

		$collector->flush();

		$this->assertCount( 1, $this->requests, 'Both events should be sent in one request.' );

		$body = $this->get_sent_body();

		$this->assertSame( '1234567890.1700000000', $body['client_id'], 'The client ID should come from the first session.' );
		$this->assertSame(
			array( '1700000000', '1700000000' ),
			array_column( array_column( $body['events'], 'params' ), 'session_id' ),
			'Both events should go with the session ID of the first session.'
		);
	}

	public function data_cookies_after_the_first_event() {
		return array(
			'another visitor\'s cookies' => array(
				array(
					'_ga'        => 'GA1.1.5555555555.1600000000',
					'_ga_ABC123' => 'GS2.1.s1600000000$t' . time(),
				),
			),
			'no cookies'                 => array( array() ),
		);
	}

	public function test_flush__empties_the_store() {
		$collector = $this->create_collector();
		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$collector->flush();

		$this->assertFalse( $collector->has( 'sign_up:user:1' ), 'No event should be stored after `flush()`.' );

		$collector->flush();

		$this->assertCount( 1, $this->requests, 'A second `flush()` should send nothing.' );
	}

	public function test_flush__sends_nothing_without_events() {
		$settings_reads = 0;
		add_filter(
			'pre_option_' . Settings::OPTION,
			function ( $pre_option ) use ( &$settings_reads ) {
				++$settings_reads;

				return $pre_option;
			}
		);

		$this->create_collector()->flush();

		$this->assertCount( 0, $this->requests, 'No request should be sent when no event was added.' );
		$this->assertSame( 0, $settings_reads, '`flush()` should read no setting when no event was added.' );
	}

	public function test_flush__sends_nothing_without_secret() {
		$collector = $this->create_collector();
		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$this->assertTrue( $collector->has( 'sign_up:user:1' ), 'The event should be stored before the secret is deleted.' );
		$this->measurement_protocol_settings->delete();

		$collector->flush();

		$this->assertCount( 0, $this->requests, 'No request should be sent without a stored secret.' );
	}

	public function test_flush__sends_nothing_without_measurement_id() {
		$collector = $this->create_collector();
		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$this->assertTrue( $collector->has( 'sign_up:user:1' ), 'The event should be stored before the measurement ID is emptied.' );
		$this->analytics->get_settings()->merge( array( 'measurementID' => '' ) );

		$collector->flush();

		$this->assertCount( 0, $this->requests, 'No request should be sent without a measurement ID.' );
	}

	public function test_add__keeps_the_most_specific_event() {
		$collector = $this->create_collector();

		$collector->add( new Event( 'sign_up', array( 'method' => 'accounts' ), 'sign_up:user:1', 0 ) );
		$collector->add( new Event( 'sign_up', array( 'method' => 'woocommerce' ), 'sign_up:user:1', 10 ) );
		$collector->add( new Event( 'sign_up', array( 'method' => 'other' ), 'sign_up:user:1', 5 ) );
		$collector->flush();

		$events = $this->get_sent_body()['events'];

		$this->assertCount( 1, $events, 'One event should be sent for one dedupe key.' );
		$this->assertSame( 'woocommerce', $events[0]['params']['method'], 'The most specific event should be sent.' );
	}

	public function test_add__keeps_the_first_event_on_a_tie() {
		$collector = $this->create_collector();

		$collector->add( new Event( 'sign_up', array( 'method' => 'first' ), 'sign_up:user:1' ) );
		$collector->add( new Event( 'sign_up', array( 'method' => 'second' ), 'sign_up:user:1' ) );
		$collector->flush();

		$events = $this->get_sent_body()['events'];

		$this->assertCount( 1, $events, 'One event should be sent for one dedupe key.' );
		$this->assertSame( 'first', $events[0]['params']['method'], 'Of two events as specific, the first should be sent.' );
	}

	public function test_has() {
		$collector = $this->create_collector();

		$this->assertFalse( $collector->has( 'sign_up:user:1' ), 'No event should be stored before `add()`.' );

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );

		$this->assertTrue( $collector->has( 'sign_up:user:1' ), 'The added event should be stored by its dedupe key.' );
		$this->assertFalse( $collector->has( 'sign_up:user:2' ), 'Another dedupe key should have no event.' );
	}

	/**
	 * @dataProvider data_invalid_events
	 *
	 * @param string $name   Event name.
	 * @param array  $params Event params.
	 */
	public function test_flush__drops_invalid_events( $name, $params ) {
		$collector = $this->create_collector();

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$collector->add( new Event( $name, $params, 'invalid:post:1' ) );
		$collector->flush();

		$this->assertSame( array( 'sign_up' ), array_column( $this->get_sent_body()['events'], 'name' ), 'Only the valid event should be sent.' );
	}

	public function data_invalid_events() {
		return array(
			'a name that starts with a number'          => array( '1st_event', array() ),
			'a name with a hyphen'                      => array( 'test-event', array() ),
			'a name of 41 characters'                   => array( 'e' . str_repeat( 'a', 40 ), array() ),
			'a name that ends in a newline'             => array( "test_event\n", array() ),
			'a param name that starts with `google_`'   => array( 'test_event', array( 'google_param' => 'a' ) ),
			'a param name that starts with `ga_`'       => array( 'test_event', array( 'ga_param' => 'a' ) ),
			'a param name that starts with `firebase_`' => array( 'test_event', array( 'firebase_param' => 'a' ) ),
			'23 params of its own'                      => array( 'test_event', self::create_params( 23 ) ),
		);
	}

	/**
	 * @dataProvider data_reserved_event_names
	 *
	 * @param string $name Event name.
	 */
	public function test_flush__drops_events_with_reserved_names( $name ) {
		$collector = $this->create_collector();

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$collector->add( new Event( $name, array(), "{$name}:post:1" ) );
		$collector->flush();

		$this->assertSame( array( 'sign_up' ), array_column( $this->get_sent_body()['events'], 'name' ), 'An event with a reserved name should not be sent.' );
	}

	public function data_reserved_event_names() {
		$names = array(
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

		return array_combine( $names, array_map( fn ( $name ) => array( $name ), $names ) );
	}

	/**
	 * @dataProvider data_invalid_param_names
	 *
	 * @param string $param_name Param name.
	 */
	public function test_flush__drops_events_with_invalid_param_name( $param_name ) {
		$collector = $this->create_collector();

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$collector->add( new Event( 'test_event', array( $param_name => 'a' ), 'test_event:post:1' ) );
		$collector->flush();

		$this->assertSame( array( 'sign_up' ), array_column( $this->get_sent_body()['events'], 'name' ), 'Only the event with valid param names should be sent.' );
	}

	public function data_invalid_param_names() {
		return array(
			'a hyphen'            => array( 'post-type' ),
			'a number first'      => array( '1st_param' ),
			'an underscore first' => array( '_param' ),
			'`gtag.` first'       => array( 'gtag.param' ),
			'a trailing newline'  => array( "param\n" ),
			'41 characters'       => array( 'p' . str_repeat( 'a', 40 ) ),
		);
	}

	public function test_flush__sends_events_at_the_limits() {
		$name      = 'e' . str_repeat( 'a', 39 );
		$collector = $this->create_collector();

		$collector->add( new Event( $name, self::create_params( 22 ), "{$name}:post:1" ) );
		$collector->add( new Event( 'sign_up', array( 'p' . str_repeat( 'a', 39 ) => 'a' ), 'sign_up:user:1' ) );
		$collector->flush();

		$events = $this->get_sent_body()['events'];

		$this->assertSame(
			array( $name, 'sign_up' ),
			array_column( $events, 'name' ),
			'An event name of 40 characters, 22 params of an event\'s own and a param name of 40 characters should be sent.'
		);
		$this->assertCount( 25, $events[0]['params'], 'The event should be sent with its 22 params and the 3 that the client adds.' );
		$this->assertArrayHasKey( 'p' . str_repeat( 'a', 39 ), $events[1]['params'], 'The param name of 40 characters should be sent.' );
	}

	public function test_flush__sends_the_first_25_valid_events() {
		$collector = $this->create_collector();

		for ( $i = 1; $i <= 27; $i++ ) {
			$name = 3 === $i ? '1st-event' : "event_{$i}";
			$collector->add( new Event( $name, array(), "event:post:{$i}" ) );
		}
		$collector->flush();

		$this->assertSame(
			array_map( fn ( $i ) => "event_{$i}", array_merge( array( 1, 2 ), range( 4, 26 ) ) ),
			array_column( $this->get_sent_body()['events'], 'name' ),
			'The first 25 valid events should be sent.'
		);
	}

	public function test_flush__sends_nothing_when_no_event_is_valid() {
		remove_all_filters( 'googlesitekit_analytics_4_mp_dispatch_mode' );
		$collector = $this->create_collector();

		$collector->add( new Event( '1st-event', array(), '1st-event:post:1' ) );
		$this->assertTrue( $collector->has( '1st-event:post:1' ), 'The invalid event should be stored until `flush()` checks it.' );
		$collector->flush();

		$this->assertCount( 0, $this->requests, 'No request should be sent when no event is valid.' );
		$this->assertSame( 0, $collector->finish_request_calls, 'The response should not be finished when nothing is sent.' );
	}

	/**
	 * @dataProvider data_output_buffer_states
	 *
	 * @param int  $output_buffer_level  Output buffering level at `shutdown`.
	 * @param bool $is_request_finished  What `finish_request()` returns.
	 * @param int  $finish_request_calls Expected calls of `finish_request()` before the request to Google Analytics.
	 * @param bool $blocking             Expected `blocking` request arg.
	 */
	public function test_flush__finishes_the_response_where_it_can( $output_buffer_level, $is_request_finished, $finish_request_calls, $blocking ) {
		remove_all_filters( 'googlesitekit_analytics_4_mp_dispatch_mode' );
		$collector                       = $this->create_collector( null, $output_buffer_level, $is_request_finished );
		$finish_request_calls_at_request = null;
		$this->subscribe_to_wp_http_requests(
			function () use ( $collector, &$finish_request_calls_at_request ) {
				$finish_request_calls_at_request = $collector->finish_request_calls;
			}
		);

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$collector->flush();

		$this->assertCount( 1, $this->requests, 'One request should be sent.' );
		$this->assertSame( $finish_request_calls, $finish_request_calls_at_request, 'The collector should try to finish the response before the request, and only with no output buffer open.' );
		$this->assertSame( $blocking, $this->requests[0]['args']['blocking'], 'The request should wait for Google Analytics only after the visitor\'s response is finished.' );
	}

	public function data_output_buffer_states() {
		return array(
			'no output buffer, and the response finished' => array( 0, true, 1, true ),
			'an output buffer open'                       => array( 1, true, 0, false ),
			'no output buffer, and the response not finished' => array( 0, false, 1, false ),
		);
	}

	/**
	 * @dataProvider data_dispatch_modes
	 *
	 * @param string $mode                 Value the mode filter returns.
	 * @param int    $finish_request_calls Expected calls of `finish_request()`.
	 * @param bool   $blocking             Expected `blocking` request arg.
	 */
	public function test_flush__takes_the_dispatch_mode_of_the_filter( $mode, $finish_request_calls, $blocking ) {
		remove_all_filters( 'googlesitekit_analytics_4_mp_dispatch_mode' );
		add_filter( 'googlesitekit_analytics_4_mp_dispatch_mode', fn () => $mode );
		$collector = $this->create_collector();

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$collector->flush();

		$this->assertCount( 1, $this->requests, 'One request should be sent.' );
		$this->assertSame( $finish_request_calls, $collector->finish_request_calls, 'Only `finish` mode should finish the response.' );
		$this->assertSame( $blocking, $this->requests[0]['args']['blocking'], 'The request should wait for the response in `finish` mode and in `blocking` mode alone.' );
	}

	public function data_dispatch_modes() {
		return array(
			'`blocking`'       => array( 'blocking', 0, true ),
			'`async`'          => array( 'async', 0, false ),
			'an unknown value' => array( 'later', 1, true ),
		);
	}

	public function test_add_and_flush__write_nothing_to_the_database() {
		$collector = $this->create_collector();
		$writes    = array();
		add_filter(
			'query',
			function ( $query ) use ( &$writes ) {
				if ( preg_match( '/^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i', $query ) ) {
					$writes[] = $query;
				}

				return $query;
			}
		);

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$collector->flush();

		$this->assertCount( 1, $this->requests, 'The event should be sent.' );
		$this->assertSame( array(), $writes, 'Collecting and sending an event should write nothing to the database.' );
	}

	public function test_flush__sends_event_that_the_real_guard_allows() {
		$conversion_tracking_settings = new Conversion_Tracking_Settings( new Options( $this->context ) );
		$conversion_tracking_settings->set( array( 'enabled' => true ) );
		$server_events_guard = new Server_Events_Guard(
			$this->context,
			$this->analytics,
			$conversion_tracking_settings,
			$this->analytics->get_measurement_protocol_secret(),
			$this->analytics->get_tracking_exclusions()
		);
		$collector           = new Event_Collector( ...$this->get_collector_args( $server_events_guard ) );

		$collector->add( new Event( 'sign_up', array(), 'sign_up:user:1' ) );
		$collector->flush();

		$this->assertSame( array( 'sign_up' ), array_column( $this->get_sent_body()['events'], 'name' ), 'An event that the real `Server_Events_Guard` allows should be sent.' );
	}

	public function test_get_output_buffer_level() {
		$collector = new Event_Collector( ...$this->get_collector_args() );

		$this->assertSame(
			ob_get_level(),
			$this->get_accessible_method( $collector, 'get_output_buffer_level' )->invoke( $collector ),
			'The level should be the output buffering level of PHP.'
		);
	}

	public function test_finish_request__without_php_fpm_or_litespeed() {
		$collector = new Event_Collector( ...$this->get_collector_args() );

		$this->assertFalse(
			$this->get_accessible_method( $collector, 'finish_request' )->invoke( $collector ),
			'No response should be finished where PHP runs neither under PHP-FPM nor under LiteSpeed, as under the CLI of the tests.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_finish_request__under_php_fpm() {
		require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/fastcgi-fake-functions.php';
		$collector = new Event_Collector( ...$this->get_collector_args() );

		$this->assertTrue(
			$this->get_accessible_method( $collector, 'finish_request' )->invoke( $collector ),
			'The response should be finished where PHP runs under PHP-FPM.'
		);
		// PHPUnit cannot report a failed `assertSame()` from a separate process, so the calls are compared with `===`.
		$this->assertTrue(
			array( 'fastcgi_finish_request' ) === $GLOBALS['googlesitekit_finish_request_calls'],
			'`fastcgi_finish_request()` should run once.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_finish_request__under_litespeed() {
		require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/litespeed-fake-functions.php';
		$collector = new Event_Collector( ...$this->get_collector_args() );

		$this->assertTrue(
			$this->get_accessible_method( $collector, 'finish_request' )->invoke( $collector ),
			'The response should be finished where PHP runs under LiteSpeed.'
		);
		// PHPUnit cannot report a failed `assertSame()` from a separate process, so the calls are compared with `===`.
		$this->assertTrue(
			array( 'litespeed_finish_request' ) === $GLOBALS['googlesitekit_finish_request_calls'],
			'`litespeed_finish_request()` should run once.'
		);
	}

	/**
	 * Creates the given number of params.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $count Number of params.
	 * @return array Params from `param_1` to `param_<count>`, each with the value `a`.
	 */
	private static function create_params( $count ) {
		$params = array();

		for ( $i = 1; $i <= $count; $i++ ) {
			$params[ "param_{$i}" ] = 'a';
		}

		return $params;
	}

	/**
	 * Gets the arguments of the collector's constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Server_Events_Guard|null $server_events_guard Optional. Server_Events_Guard instance of the collector. Default a stub that allows every event.
	 * @return array Arguments of `Event_Collector::__construct()`, with the real client.
	 */
	private function get_collector_args( $server_events_guard = null ) {
		if ( null === $server_events_guard ) {
			$server_events_guard = $this->createMock( Server_Events_Guard::class );
			$server_events_guard->method( 'can_send' )->willReturn( true );
		}

		$settings                    = $this->analytics->get_settings();
		$measurement_protocol_secret = $this->analytics->get_measurement_protocol_secret();

		return array(
			$this->context,
			$settings,
			$measurement_protocol_secret,
			new Measurement_Protocol_Client( $settings, $measurement_protocol_secret ),
			$server_events_guard,
		);
	}

	/**
	 * Creates a collector with the given output buffering level and the given result of finishing the response.
	 *
	 * PHPUnit keeps an output buffer open, and finishes no response, so the collector takes both from the test.
	 *
	 * @since n.e.x.t
	 *
	 * @param Server_Events_Guard|null $server_events_guard Optional. Server_Events_Guard instance of the collector. Default a stub that allows every event.
	 * @param int                      $output_buffer_level Optional. Output buffering level that the collector reads. Default 0.
	 * @param bool                     $is_request_finished Optional. What `finish_request()` returns. Default true.
	 * @return Event_Collector Instance under test, which counts the calls of `finish_request()` in `$finish_request_calls`.
	 */
	private function create_collector( $server_events_guard = null, $output_buffer_level = 0, $is_request_finished = true ) {
		return new class( $output_buffer_level, $is_request_finished, ...$this->get_collector_args( $server_events_guard ) ) extends Event_Collector {
			/**
			 * Number of calls of `finish_request()`.
			 *
			 * @var int
			 */
			public $finish_request_calls = 0;

			/**
			 * Output buffering level that `get_output_buffer_level()` returns.
			 *
			 * @var int
			 */
			private $output_buffer_level;

			/**
			 * What `finish_request()` returns.
			 *
			 * @var bool
			 */
			private $is_request_finished;

			/**
			 * Constructor.
			 *
			 * @since n.e.x.t
			 *
			 * @param int   $output_buffer_level Output buffering level.
			 * @param bool  $is_request_finished What `finish_request()` returns.
			 * @param mixed ...$args             Arguments of `Event_Collector::__construct()`.
			 */
			public function __construct( $output_buffer_level, $is_request_finished, ...$args ) {
				$this->output_buffer_level = $output_buffer_level;
				$this->is_request_finished = $is_request_finished;
				parent::__construct( ...$args );
			}

			protected function get_output_buffer_level() {
				return $this->output_buffer_level;
			}

			protected function finish_request() {
				++$this->finish_request_calls;

				return $this->is_request_finished;
			}
		};
	}
}
