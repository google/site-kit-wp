<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\GA_Session
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Core\Util\Input;

/**
 * Class for the visitor's Google Analytics client and session IDs, read from their cookies.
 *
 * The format of these cookies is not a public contract, so all parsing of them stays in this class.
 * Each pattern ends on `\z`, because `$` also accepts a trailing newline, which a cookie's value can have.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class GA_Session {

	/**
	 * Seconds after the last hit that a session counts as current.
	 *
	 * @since n.e.x.t
	 */
	const DEFAULT_SESSION_TIMEOUT = 30 * MINUTE_IN_SECONDS;

	/**
	 * Google Analytics client ID.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $client_id;

	/**
	 * Google Analytics session ID.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $session_id;

	/**
	 * Unix time of the visitor's last Google Analytics hit.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $last_hit;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $client_id  Google Analytics client ID.
	 * @param string $session_id Google Analytics session ID.
	 * @param int    $last_hit   Unix time of the visitor's last hit.
	 */
	private function __construct( string $client_id, string $session_id, int $last_hit ) {
		$this->client_id  = $client_id;
		$this->session_id = $session_id;
		$this->last_hit   = $last_hit;
	}

	/**
	 * Gets the Google Analytics client ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Client ID.
	 */
	public function get_client_id() {
		return $this->client_id;
	}

	/**
	 * Gets the Google Analytics session ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Session ID.
	 */
	public function get_session_id() {
		return $this->session_id;
	}

	/**
	 * Gets the Unix time of the visitor's last hit.
	 *
	 * @since n.e.x.t
	 *
	 * @return int Unix time of the last hit.
	 */
	public function get_last_hit() {
		return $this->last_hit;
	}

	/**
	 * Gets a measurement ID's container ID, the suffix of its session cookie's name.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $measurement_id Measurement ID, such as `G-ABC123`.
	 * @return string Measurement ID without its `G-` prefix, or an empty string when it is invalid.
	 */
	public static function get_container_id( string $measurement_id ) {
		return preg_match( '/\AG-([A-Z0-9]+)\z/', $measurement_id, $matches ) ? $matches[1] : '';
	}

	/**
	 * Creates a session from the values of the two cookies.
	 *
	 * @since n.e.x.t
	 *
	 * @param string   $ga             Value of the `_ga` cookie.
	 * @param string   $ga_session     Value of the session cookie, in the GS1 or GS2 format.
	 * @param string   $measurement_id Measurement ID.
	 * @param int|null $now            Optional. Unix time to compare the last hit with. Default is the current time.
	 * @param int      $timeout        Optional. Seconds after the last hit that the session counts as current.
	 * @return GA_Session|null Session, or null when the measurement ID is invalid, a cookie cannot be read or the session timed out.
	 */
	public static function from_values( string $ga, string $ga_session, string $measurement_id, ?int $now = null, int $timeout = self::DEFAULT_SESSION_TIMEOUT ) {
		if ( '' === self::get_container_id( $measurement_id ) ) {
			return null;
		}

		if ( ! preg_match( '/\A(?:GA1\.\d+\.)?(\d+\.\d+)\z/', $ga, $client_matches ) ) {
			return null;
		}

		list( $session_id, $last_hit ) = self::parse_session_cookie( $ga_session );

		if ( ! preg_match( '/\A\d+\z/', $session_id ) || ! preg_match( '/\A\d+\z/', $last_hit ) ) {
			return null;
		}

		if ( ( $now ?? time() ) - (int) $last_hit > $timeout ) {
			return null;
		}

		return new self( $client_matches[1], $session_id, (int) $last_hit );
	}

	/**
	 * Creates a session from the visitor's cookies.
	 *
	 * @since n.e.x.t
	 *
	 * @param Input  $input          Input instance.
	 * @param string $measurement_id Measurement ID.
	 * @return GA_Session|null Session, or null when the measurement ID is invalid, a cookie is missing or cannot be read, or the session timed out.
	 */
	public static function from_input( Input $input, string $measurement_id ) {
		$default_cookie_names = array(
			'client'  => '_ga',
			'session' => '_ga_' . self::get_container_id( $measurement_id ),
		);

		/**
		 * Filters the names of the Google Analytics cookies that Site Kit reads.
		 *
		 * PHP reads a dot or a space in a cookie's name as an underscore, so return each name in that form.
		 * A result that is not an array with non-empty `client` and `session` strings is ignored.
		 *
		 * @since n.e.x.t
		 *
		 * @param array  $cookie_names   Cookie names, under the keys `client` and `session`.
		 * @param string $measurement_id Measurement ID.
		 */
		$cookie_names = apply_filters( 'googlesitekit_analytics_4_ga_cookie_names', $default_cookie_names, $measurement_id );

		if (
			! is_array( $cookie_names )
			|| ! is_string( $cookie_names['client'] ?? null )
			|| ! is_string( $cookie_names['session'] ?? null )
			|| '' === $cookie_names['client']
			|| '' === $cookie_names['session']
		) {
			$cookie_names = $default_cookie_names;
		}

		$ga         = $input->filter( INPUT_COOKIE, $cookie_names['client'] );
		$ga_session = $input->filter( INPUT_COOKIE, $cookie_names['session'] );

		if ( empty( $ga ) || empty( $ga_session ) ) {
			return null;
		}

		/**
		 * Filters how many seconds after the visitor's last Google Analytics activity their session counts as current.
		 *
		 * A result that is not a positive integer is ignored.
		 *
		 * @since n.e.x.t
		 *
		 * @param int $timeout Session timeout in seconds.
		 */
		$timeout = apply_filters( 'googlesitekit_analytics_4_session_timeout', self::DEFAULT_SESSION_TIMEOUT );

		if ( ! is_int( $timeout ) || $timeout <= 0 ) {
			$timeout = self::DEFAULT_SESSION_TIMEOUT;
		}

		return self::from_values( $ga, $ga_session, $measurement_id, null, $timeout );
	}

	/**
	 * Gets the session ID and the last hit from a session cookie.
	 *
	 * GS1 is `GS1.<n>.<session_id>.<session_count>.<engaged>.<last_hit>...`.
	 * GS2 is `GS2.<n>.s<session_id>$o...$t<last_hit>...`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $ga_session Value of the session cookie.
	 * @return array List with the session ID and the last hit, each an empty string where the cookie lacks it.
	 */
	private static function parse_session_cookie( string $ga_session ) {
		list( $format, , $values ) = array_pad( explode( '.', $ga_session, 3 ), 3, '' );

		if ( 'GS1' === $format ) {
			$fields = explode( '.', $values );

			return array( $fields[0], $fields[3] ?? '' );
		}

		if ( 'GS2' !== $format ) {
			return array( '', '' );
		}

		$entries = array();

		foreach ( explode( '$', $values ) as $entry ) {
			$entries[ substr( $entry, 0, 1 ) ] = substr( $entry, 1 );
		}

		return array( $entries['s'] ?? '', $entries['t'] ?? '' );
	}
}
