<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Insight_Payload
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * Encodes the request of the generated benchmarking insight for the trip
 * through the browser, and checks it on the way back.
 *
 * `GET:benchmarking-data` builds the request from the reports it has just
 * run, and the browser sends it back unread to `POST:benchmarking-insight`,
 * which forwards it to the service. No request holds both a report call and a
 * call to the model, so a slow or failed generation never costs the widget its
 * numbers. The payload is the request and its locale, as base64url-encoded
 * JSON, signed with a keyed hash of the site's `auth` salt and the user it was
 * built for. So a payload that a user wrote by hand, or that was built for
 * another user, is refused rather than forwarded into the model's prompt. The
 * browser re-encodes nothing, so the request reaches the service byte for byte
 * as it was built, and the service's cache key, which hashes the request's
 * values, stays the same for the same figures.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Insight_Payload {

	/**
	 * The hash algorithm of the signature.
	 *
	 * @since n.e.x.t
	 */
	const SIGNATURE_ALGORITHM = 'sha256';

	/**
	 * The longest payload that is decoded, in bytes. The request's lists are
	 * short, so a real payload is a few kilobytes.
	 *
	 * @since n.e.x.t
	 */
	const MAX_LENGTH = 262144;

	/**
	 * Encodes and signs a request for the given user.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $request The request, as `Insight_Request_Builder::build()` returns it.
	 * @param string $locale  The locale the insight is to be written in, such as `de_DE`.
	 * @param int    $user_id The ID of the user the payload is built for.
	 * @return string|null The payload, or null when the request can't be encoded as JSON.
	 */
	public static function encode( array $request, $locale, $user_id ) {
		$json = wp_json_encode(
			array(
				'locale'  => (string) $locale,
				'request' => $request,
			)
		);

		if ( ! is_string( $json ) ) {
			return null;
		}

		$body = self::base64url_encode( $json );

		return $body . '.' . self::sign( $body, $user_id );
	}

	/**
	 * Checks a payload's signature for the given user, and decodes it.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $payload The payload, as the browser sent it back.
	 * @param int   $user_id The ID of the user who sent it.
	 * @return array|null The decoded payload, with `request` and `locale`, or null when the payload isn't one this site built for the user.
	 */
	public static function decode( $payload, $user_id ) {
		if ( ! is_string( $payload ) || strlen( $payload ) > self::MAX_LENGTH ) {
			return null;
		}

		$parts = explode( '.', $payload );

		if ( 2 !== count( $parts ) || '' === $parts[0] ) {
			return null;
		}

		list( $body, $signature ) = $parts;

		if ( ! hash_equals( self::sign( $body, $user_id ), $signature ) ) {
			return null;
		}

		$data = json_decode( self::base64url_decode( $body ), true );

		if (
			! is_array( $data ) ||
			! isset( $data['locale'], $data['request'] ) ||
			! is_string( $data['locale'] ) ||
			! is_array( $data['request'] ) ||
			! self::is_request( $data['request'] )
		) {
			return null;
		}

		return array(
			'request' => $data['request'],
			'locale'  => $data['locale'],
		);
	}

	/**
	 * Checks whether a decoded request has the fields the service requires.
	 *
	 * The signature already proves that this site built the request, so this
	 * only guards against a request that a later version encoded differently.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $request The decoded request.
	 * @return bool True when the request has its required fields, false otherwise.
	 */
	private static function is_request( array $request ) {
		return isset( $request['end_date'], $request['days_in_period'], $request['visits'] )
			&& is_string( $request['end_date'] )
			&& is_int( $request['days_in_period'] )
			&& is_array( $request['visits'] )
			&& isset( $request['visits']['current_period'], $request['visits']['previous_period'] );
	}

	/**
	 * Signs an encoded body for the given user.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $body    The base64url-encoded body.
	 * @param int    $user_id The ID of the user.
	 * @return string The signature, base64url-encoded.
	 */
	private static function sign( $body, $user_id ) {
		return self::base64url_encode(
			hash_hmac( self::SIGNATURE_ALGORITHM, (int) $user_id . '.' . $body, wp_salt( 'auth' ), true )
		);
	}

	/**
	 * Encodes data as base64url, without padding, so the payload needs no
	 * escaping in a URL or in JSON.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $data The data.
	 * @return string The encoded data.
	 */
	private static function base64url_encode( $data ) {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Encodes the payload for transport, nothing is obfuscated.
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}

	/**
	 * Decodes base64url data.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $data The encoded data.
	 * @return string The decoded data, or an empty string when it is not base64url.
	 */
	private static function base64url_decode( $data ) {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decodes the payload of the transport, nothing is obfuscated.
		$decoded = base64_decode( strtr( $data, '-_', '+/' ), true );

		return is_string( $decoded ) ? $decoded : '';
	}
}
