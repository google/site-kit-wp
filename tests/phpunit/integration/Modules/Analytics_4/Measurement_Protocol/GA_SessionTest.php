<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol\GA_SessionTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol;

use ArrayObject;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\GA_Session;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class GA_SessionTest extends TestCase {

	public function set_up() {
		parent::set_up();

		// `WP_UnitTestCase_Base::set_up()` does not empty `$_COOKIE`, so cookies would leak between tests.
		$_COOKIE = array();
	}

	public function test_get_container_id() {
		$this->assertSame(
			'AZ09',
			GA_Session::get_container_id( 'G-AZ09' ),
			'The container ID should be the measurement ID without its prefix.'
		);
	}

	/**
	 * @dataProvider data_invalid_measurement_ids
	 *
	 * @param string $measurement_id Invalid measurement ID.
	 */
	public function test_get_container_id__returns_empty_string_for_invalid_measurement_id( $measurement_id ) {
		$this->assertSame(
			'',
			GA_Session::get_container_id( $measurement_id ),
			'An invalid measurement ID should have no container ID.'
		);
	}

	public function data_invalid_measurement_ids() {
		return array(
			'no prefix'              => array( 'ABC123' ),
			'another prefix'         => array( 'UA-123456' ),
			'text before the prefix' => array( 'XG-ABC123' ),
			'lowercase'              => array( 'G-abc123' ),
			'trailing newline'       => array( "G-ABC123\n" ),
		);
	}

	/**
	 * @dataProvider data_client_cookies
	 *
	 * @param string $ga Value of the `_ga` cookie.
	 */
	public function test_from_values__reads_client_id( $ga ) {
		$session = GA_Session::from_values( $ga, $this->get_session_cookie( 1700000500 ), 'G-ABC123', 1700000600 );

		$this->assertInstanceOf( GA_Session::class, $session, 'A session should be returned for a readable `_ga` cookie.' );
		$this->assertSame( '1234567890.1700000000', $session->get_client_id(), 'The client ID should be the last two fields of the cookie.' );
	}

	public function data_client_cookies() {
		return array(
			'GA1 cookie' => array( 'GA1.2.1234567890.1700000000' ),
			'raw value'  => array( '1234567890.1700000000' ),
		);
	}

	/**
	 * @dataProvider data_session_cookies
	 *
	 * @param string $ga_session Value of the session cookie.
	 */
	public function test_from_values__reads_session_id_and_last_hit( $ga_session ) {
		$session = GA_Session::from_values( 'GA1.1.1234567890.1700000000', $ga_session, 'G-ABC123', 1700000600 );

		$this->assertInstanceOf( GA_Session::class, $session, 'A session should be returned for a readable session cookie.' );
		$this->assertSame( '1700000000', $session->get_session_id(), 'The session ID should come from the session cookie.' );
		$this->assertSame( 1700000500, $session->get_last_hit(), 'The last hit should come from the session cookie.' );
	}

	public function data_session_cookies() {
		return array(
			'GS1 cookie'                        => array( 'GS1.1.1700000000.3.1.1700000500.0.0.0' ),
			'GS2 cookie'                        => array( 'GS2.1.s1700000000$o3$g1$t1700000500$j0$l0$h0' ),
			'GS2 cookie with an empty entry'    => array( 'GS2.1.s1700000000$$t1700000500' ),
			'GS2 cookie with a dot in an entry' => array( 'GS2.1.s1700000000$d1.2$t1700000500' ),
		);
	}

	/**
	 * @dataProvider data_unreadable_cookies
	 *
	 * @param string $ga         Value of the `_ga` cookie.
	 * @param string $ga_session Value of the session cookie.
	 */
	public function test_from_values__returns_null_for_unreadable_cookie( $ga, $ga_session ) {
		// No last hit is too old for this timeout, so `null` means an unreadable value.
		$timeout = PHP_INT_MAX;

		$this->assertNull(
			GA_Session::from_values( $ga, $ga_session, 'G-ABC123', 1700000600, $timeout ),
			'No session should be returned for an unreadable cookie.'
		);
	}

	public function data_unreadable_cookies() {
		return array(
			'empty client cookie'                   => array( '', 'GS2.1.s1700000000$o3$g1$t1700000500$j0$l0$h0' ),
			'client cookie with too few fields'     => array( 'GA1.1.1234567890', 'GS2.1.s1700000000$o3$g1$t1700000500$j0$l0$h0' ),
			'client cookie with too many fields'    => array( 'GA1.1.1.1234567890.1700000000', 'GS2.1.s1700000000$o3$g1$t1700000500$j0$l0$h0' ),
			'client cookie with an unknown prefix'  => array( 'GA2.1.1234567890.1700000000', 'GS2.1.s1700000000$o3$g1$t1700000500$j0$l0$h0' ),
			'non-numeric client cookie'             => array( 'GA1.1.abc.1700000000', 'GS2.1.s1700000000$o3$g1$t1700000500$j0$l0$h0' ),
			'client cookie with a trailing newline' => array( "GA1.1.1234567890.1700000000\n", 'GS2.1.s1700000000$o3$g1$t1700000500$j0$l0$h0' ),
			'unknown prefix on GS1 fields'          => array( 'GA1.1.1234567890.1700000000', 'GS3.1.1700000000.3.1.1700000500.0.0.0' ),
			'unknown prefix on GS2 entries'         => array( 'GA1.1.1234567890.1700000000', 'GS3.1.s1700000000$o3$g1$t1700000500$j0$l0$h0' ),
			'GS1 cookie with too few fields'        => array( 'GA1.1.1234567890.1700000000', 'GS1.1.1700000000.3.1' ),
			'session ID with letters before it'     => array( 'GA1.1.1234567890.1700000000', 'GS1.1.abc1700000000.3.1.1700000500.0.0.0' ),
			'session ID with letters after it'      => array( 'GA1.1.1234567890.1700000000', 'GS2.1.s1700000000abc$o3$g1$t1700000500$j0$l0$h0' ),
			'session ID with a trailing newline'    => array( 'GA1.1.1234567890.1700000000', "GS2.1.s1700000000\n" . '$t1700000500' ),
			'last hit with letters before it'       => array( 'GA1.1.1234567890.1700000000', 'GS1.1.1700000000.3.1.abc1700000500.0.0.0' ),
			'last hit with letters after it'        => array( 'GA1.1.1234567890.1700000000', 'GS2.1.s1700000000$o3$g1$t1700000500abc$j0$l0$h0' ),
			'last hit with a trailing newline'      => array( 'GA1.1.1234567890.1700000000', "GS1.1.1700000000.3.1.1700000500\n" ),
			'GS2 cookie with no third part'         => array( 'GA1.1.1234567890.1700000000', 'GS2.1' ),
			'GS2 cookie with no s entry'            => array( 'GA1.1.1234567890.1700000000', 'GS2.1.o3$g1$t1700000500$j0$l0$h0' ),
			'GS2 cookie with no t entry'            => array( 'GA1.1.1234567890.1700000000', 'GS2.1.s1700000000$o3$g1$j0$l0$h0' ),
		);
	}

	public function test_from_values__applies_session_timeout() {
		$this->assertInstanceOf(
			GA_Session::class,
			GA_Session::from_values( 'GA1.1.1234567890.1700000000', $this->get_session_cookie( 1700000600 - 1800 ), 'G-ABC123', 1700000600 ),
			'A session should be returned for a last hit 1800 seconds ago.'
		);
		$this->assertNull(
			GA_Session::from_values( 'GA1.1.1234567890.1700000000', $this->get_session_cookie( 1700000600 - 1801 ), 'G-ABC123', 1700000600 ),
			'No session should be returned for a last hit 1801 seconds ago.'
		);
	}

	public function test_from_values__returns_null_for_invalid_measurement_id() {
		$this->assertNull(
			GA_Session::from_values( 'GA1.1.1234567890.1700000000', 'GS2.1.s1700000000$o3$g1$t1700000500$j0$l0$h0', 'GT-ABC123', 1700000600 ),
			'No session should be returned for an invalid measurement ID.'
		);
	}

	public function test_from_input__reads_cookies_of_measurement_id() {
		$this->set_cookies( time() );

		$session = GA_Session::from_input( new MutableInput(), 'G-ABC123' );

		$this->assertInstanceOf( GA_Session::class, $session, 'A session should be returned when both cookies are set.' );
		$this->assertSame( '1234567890.1700000000', $session->get_client_id(), 'The client ID should come from the `_ga` cookie.' );
		$this->assertSame( '1700000000', $session->get_session_id(), 'The session ID should come from the cookie of the measurement ID.' );
	}

	public function test_from_input__does_not_change_cookies() {
		$this->set_cookies( time() );
		$cookies = $_COOKIE;

		$session = GA_Session::from_input( new MutableInput(), 'G-ABC123' );

		$this->assertInstanceOf( GA_Session::class, $session, 'A session should be returned when both cookies are set.' );
		$this->assertSame( $cookies, $_COOKIE, 'Reading the session should change no cookie.' );
	}

	public function test_from_input__ignores_session_cookie_of_another_measurement_id() {
		$_COOKIE['_ga']       = 'GA1.1.1234567890.1700000000';
		$_COOKIE['_ga_OTHER'] = $this->get_session_cookie( time() );

		$this->assertNull(
			GA_Session::from_input( new MutableInput(), 'G-ABC123' ),
			'No session should be returned for a session cookie of another measurement ID.'
		);
	}

	/**
	 * @dataProvider data_cookie_names
	 *
	 * @param string $cookie_name Name of the cookie the request lacks.
	 */
	public function test_from_input__returns_null_for_missing_cookie( $cookie_name ) {
		$this->set_cookies( time() );
		unset( $_COOKIE[ $cookie_name ] );

		$this->assertNull(
			GA_Session::from_input( new MutableInput(), 'G-ABC123' ),
			'No session should be returned for a missing cookie.'
		);
	}

	/**
	 * @dataProvider data_cookie_names
	 *
	 * @param string $cookie_name Name of the cookie sent as an array.
	 */
	public function test_from_input__returns_null_for_array_shaped_cookie( $cookie_name ) {
		$this->set_cookies( time() );
		$_COOKIE[ $cookie_name ] = array( 'x' => '1' );

		$this->assertNull(
			GA_Session::from_input( new MutableInput(), 'G-ABC123' ),
			'No session should be returned for a cookie sent as an array.'
		);
	}

	public function data_cookie_names() {
		return array(
			'client cookie'  => array( '_ga' ),
			'session cookie' => array( '_ga_ABC123' ),
		);
	}

	public function test_from_input__reads_filtered_cookie_names() {
		$_COOKIE['_ga']            = 'GA1.1.1111111111.1600000000';
		$_COOKIE['_ga_ABC123']     = 'GS2.1.s1600000000$t' . time();
		$_COOKIE['custom_client']  = 'GA1.1.1234567890.1700000000';
		$_COOKIE['custom_session'] = $this->get_session_cookie( time() );

		add_filter(
			'googlesitekit_analytics_4_ga_cookie_names',
			fn() => array(
				'client'  => 'custom_client',
				'session' => 'custom_session',
			)
		);

		$session = GA_Session::from_input( new MutableInput(), 'G-ABC123' );

		$this->assertInstanceOf( GA_Session::class, $session, 'A session should be returned from the filtered cookies.' );
		$this->assertSame( '1234567890.1700000000', $session->get_client_id(), 'The client ID should come from the filtered cookie name.' );
		$this->assertSame( '1700000000', $session->get_session_id(), 'The session ID should come from the filtered cookie name.' );
	}

	public function test_from_input__passes_default_cookie_names_and_measurement_id_to_filter() {
		$filter_args = null;
		add_filter(
			'googlesitekit_analytics_4_ga_cookie_names',
			function ( $cookie_names, $measurement_id ) use ( &$filter_args ) {
				$filter_args = array( $cookie_names, $measurement_id );

				return $cookie_names;
			},
			10,
			2
		);

		GA_Session::from_input( new MutableInput(), 'G-ABC123' );

		$this->assertSame(
			array(
				array(
					'client'  => '_ga',
					'session' => '_ga_ABC123',
				),
				'G-ABC123',
			),
			$filter_args,
			'The filter should get the default cookie names and the measurement ID.'
		);
	}

	/**
	 * @dataProvider data_invalid_cookie_names
	 *
	 * @param mixed $cookie_names Value the filter returns.
	 */
	public function test_from_input__falls_back_to_default_cookie_names( $cookie_names ) {
		$this->set_cookies( time() );
		$_COOKIE['custom_client']  = 'GA1.1.1111111111.1600000000';
		$_COOKIE['custom_session'] = 'GS2.1.s1600000000$t' . time();
		add_filter( 'googlesitekit_analytics_4_ga_cookie_names', fn() => $cookie_names );

		$session = GA_Session::from_input( new MutableInput(), 'G-ABC123' );

		$this->assertInstanceOf( GA_Session::class, $session, 'A session should be returned from the default cookies.' );
		$this->assertSame( '1234567890.1700000000', $session->get_client_id(), 'The client ID should come from the default cookie name.' );
		$this->assertSame( '1700000000', $session->get_session_id(), 'The session ID should come from the default cookie name.' );
	}

	public function data_invalid_cookie_names() {
		return array(
			'a non-array'               => array(
				new ArrayObject(
					array(
						'client'  => 'custom_client',
						'session' => 'custom_session',
					)
				),
			),
			'a missing client name'     => array( array( 'session' => 'custom_session' ) ),
			'a missing session name'    => array( array( 'client' => 'custom_client' ) ),
			'an empty client name'      => array(
				array(
					'client'  => '',
					'session' => 'custom_session',
				),
			),
			'an empty session name'     => array(
				array(
					'client'  => 'custom_client',
					'session' => '',
				),
			),
			'a non-string client name'  => array(
				array(
					'client'  => 123,
					'session' => 'custom_session',
				),
			),
			'a non-string session name' => array(
				array(
					'client'  => 'custom_client',
					'session' => 123,
				),
			),
		);
	}

	/**
	 * @dataProvider data_session_timeouts
	 *
	 * @param int $timeout Value the filter returns.
	 */
	public function test_from_input__applies_session_timeout_filter( $timeout ) {
		add_filter( 'googlesitekit_analytics_4_session_timeout', fn() => $timeout );

		$this->set_cookies( time() - $timeout + MINUTE_IN_SECONDS );
		$this->assertInstanceOf(
			GA_Session::class,
			GA_Session::from_input( new MutableInput(), 'G-ABC123' ),
			'A session should be returned for a last hit inside the filtered timeout.'
		);

		$this->set_cookies( time() - $timeout - MINUTE_IN_SECONDS );
		$this->assertNull(
			GA_Session::from_input( new MutableInput(), 'G-ABC123' ),
			'No session should be returned for a last hit past the filtered timeout.'
		);
	}

	public function data_session_timeouts() {
		return array(
			'above the default' => array( 3600 ),
			'below the default' => array( 600 ),
		);
	}

	/**
	 * @dataProvider data_invalid_session_timeouts
	 *
	 * @param mixed $timeout Value the filter returns.
	 */
	public function test_from_input__falls_back_to_default_session_timeout( $timeout ) {
		add_filter( 'googlesitekit_analytics_4_session_timeout', fn() => $timeout );

		$this->set_cookies( time() - 1740 );
		$this->assertInstanceOf(
			GA_Session::class,
			GA_Session::from_input( new MutableInput(), 'G-ABC123' ),
			'A session should be returned for a last hit inside 30 minutes.'
		);

		$this->set_cookies( time() - 1860 );
		$this->assertNull(
			GA_Session::from_input( new MutableInput(), 'G-ABC123' ),
			'No session should be returned for a last hit past 30 minutes.'
		);
	}

	public function data_invalid_session_timeouts() {
		return array(
			'zero'              => array( 0 ),
			'a negative number' => array( -60 ),
			'a numeric string'  => array( '3600' ),
			'a float'           => array( 3600.5 ),
		);
	}

	/**
	 * Gets a GS2 session cookie with the given last hit.
	 *
	 * @param int $last_hit Unix time of the last hit.
	 * @return string Value of the session cookie.
	 */
	private function get_session_cookie( $last_hit ) {
		return 'GS2.1.s1700000000$t' . $last_hit;
	}

	/**
	 * Sets the `_ga` cookie and the session cookie of the measurement ID.
	 *
	 * @param int $last_hit Unix time of the last hit.
	 */
	private function set_cookies( $last_hit ) {
		$_COOKIE['_ga']        = 'GA1.1.1234567890.1700000000';
		$_COOKIE['_ga_ABC123'] = $this->get_session_cookie( $last_hit );
	}
}
