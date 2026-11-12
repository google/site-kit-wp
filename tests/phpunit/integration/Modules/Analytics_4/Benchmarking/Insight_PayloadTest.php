<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Insight_PayloadTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Insight_Payload;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Insight_PayloadTest extends TestCase {

	/**
	 * The ID of the user the payloads are built for.
	 */
	const USER_ID = 7;

	/**
	 * Gets a request as `Insight_Request_Builder::build()` returns it.
	 *
	 * @return array The request.
	 */
	private function get_request() {
		return array(
			'end_date'        => '2026-09-15',
			'days_in_period'  => 28,
			'visits'          => array(
				'current_period'  => 412,
				'previous_period' => 388,
				'last_year'       => array(
					'current_period'  => 351,
					'previous_period' => 340,
				),
			),
			'baseline'        => array(
				'expected_range_min' => 344,
				'expected_range_max' => 441,
			),
			'contextual_data' => array(
				'search_query_shifts' => array(
					array(
						'query'    => 'plant garlic',
						'clicks'   => array(
							'current'  => 300,
							'previous' => 210,
						),
						'position' => array(
							'current'  => 3.4,
							'previous' => 12.5,
						),
					),
				),
			),
		);
	}

	/**
	 * Encodes data as base64url without padding, as the payload does.
	 *
	 * @param string $data The data.
	 * @return string The encoded data.
	 */
	private function base64url_encode( $data ) {
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}

	/**
	 * Signs a body for a user the way the payload is signed: a base64url
	 * HMAC-SHA256 of the user ID, a dot and the body, keyed with the `auth` salt.
	 *
	 * @param string $body    The base64url-encoded body.
	 * @param int    $user_id The ID of the user.
	 * @return string The signature.
	 */
	private function sign( $body, $user_id ) {
		return $this->base64url_encode( hash_hmac( 'sha256', $user_id . '.' . $body, wp_salt( 'auth' ), true ) );
	}

	/**
	 * Builds a correctly signed payload for any body, so that decoding gets
	 * past the signature check and reads the body.
	 *
	 * @param mixed $data    The data to encode as JSON, or a string that is the decoded body itself.
	 * @param int   $user_id Optional. The ID of the user. Default `USER_ID`.
	 * @return string The payload.
	 */
	private function get_signed_payload( $data, $user_id = self::USER_ID ) {
		$body = $this->base64url_encode( is_string( $data ) ? $data : wp_json_encode( $data ) );

		return $body . '.' . $this->sign( $body, $user_id );
	}

	public function test_encode__returns_a_payload_that_decode_reads_back_for_the_same_user() {
		$payload = Insight_Payload::encode( $this->get_request(), 'de_DE', self::USER_ID );

		$this->assertSame(
			array(
				'request' => $this->get_request(),
				'locale'  => 'de_DE',
			),
			Insight_Payload::decode( $payload, self::USER_ID ),
			'Decoding a payload for the user it was built for should give back its request, with every count still an integer and every position still a float, and its locale.'
		);
	}

	public function test_encode__writes_the_request_as_base64url_json_signed_for_the_user() {
		$payload = Insight_Payload::encode( $this->get_request(), 'de_DE_formal', self::USER_ID );

		$this->assertMatchesRegularExpression( '/\A[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\z/', $payload, 'The payload should be a base64url body and a base64url signature, joined by a dot, with no padding.' );

		list( $body, $signature ) = explode( '.', $payload );

		$this->assertSame(
			array(
				'locale'  => 'de_DE_formal',
				'request' => $this->get_request(),
			),
			json_decode( base64_decode( strtr( $body, '-_', '+/' ) ), true ),
			'The body should be the locale and the request, as JSON.'
		);
		$this->assertSame( $this->sign( $body, self::USER_ID ), $signature, 'The signature should be the HMAC-SHA256 of the user ID and the body, keyed with the `auth` salt.' );
	}

	public function test_encode__returns_the_same_payload_for_the_same_request() {
		$this->assertSame(
			Insight_Payload::encode( $this->get_request(), 'de_DE', self::USER_ID ),
			Insight_Payload::encode( $this->get_request(), 'de_DE', self::USER_ID ),
			'Encoding the same request for the same user twice should give the same payload.'
		);
	}

	public function test_encode__returns_null_for_a_request_json_cannot_encode() {
		$this->assertNull(
			Insight_Payload::encode( array( 'end_date' => INF ), 'de_DE', self::USER_ID ),
			'A request with a value JSON has no number for should give no payload.'
		);
	}

	public function test_decode__returns_the_request_and_the_locale_of_a_payload_signed_for_the_user() {
		$this->assertSame(
			array(
				'request' => $this->get_request(),
				'locale'  => 'pt_BR',
			),
			Insight_Payload::decode(
				$this->get_signed_payload(
					array(
						'locale'  => 'pt_BR',
						'request' => $this->get_request(),
					)
				),
				self::USER_ID
			),
			'A payload signed for the user should decode to its request and its locale.'
		);
	}

	public function test_decode__reads_a_body_with_the_characters_base64url_replaces() {
		$request = $this->get_request();
		// Three in a row put one of each on the third byte of a base64 group,
		// where `?` is encoded as `/` and `~` as `+`.
		$request['contextual_data']['search_query_shifts'][0]['query'] = 'plant garlic???~~~';

		$payload = Insight_Payload::encode( $request, 'de_DE', self::USER_ID );

		list( $body ) = explode( '.', $payload );

		$this->assertStringContainsString( '-', $body, 'The body should have a `-`, which base64url writes for `+`.' );
		$this->assertStringContainsString( '_', $body, 'The body should have a `_`, which base64url writes for `/`.' );
		$this->assertSame(
			array(
				'request' => $request,
				'locale'  => 'de_DE',
			),
			Insight_Payload::decode( $payload, self::USER_ID ),
			'A body with `-` and `_` should decode to the request it was encoded from.'
		);
	}

	public function test_decode__returns_null_for_a_payload_built_for_another_user() {
		$payload = Insight_Payload::encode( $this->get_request(), 'de_DE', self::USER_ID );

		$this->assertNull( Insight_Payload::decode( $payload, self::USER_ID + 1 ), 'A payload built for one user should not decode for another.' );
	}

	/**
	 * @dataProvider data_non_string_payloads
	 *
	 * @param mixed $payload A payload that is not a string.
	 */
	public function test_decode__returns_null_for_a_payload_that_is_not_a_string( $payload ) {
		$this->assertNull( Insight_Payload::decode( $payload, self::USER_ID ), 'A payload that is not a string should not decode.' );
	}

	public function data_non_string_payloads() {
		return array(
			'null'    => array( null ),
			'integer' => array( 123 ),
			'array'   => array( array( 'payload' ) ),
			'boolean' => array( true ),
		);
	}

	public function test_decode__returns_null_for_a_payload_longer_than_the_maximum_length() {
		$long_request                = $this->get_request();
		$long_request['description'] = str_repeat( 'a', Insight_Payload::MAX_LENGTH );
		$long_payload                = Insight_Payload::encode( $long_request, 'de_DE', self::USER_ID );

		$short_request                = $this->get_request();
		$short_request['description'] = str_repeat( 'a', (int) ( Insight_Payload::MAX_LENGTH * 0.7 ) );
		$short_payload                = Insight_Payload::encode( $short_request, 'de_DE', self::USER_ID );

		$this->assertGreaterThan( Insight_Payload::MAX_LENGTH, strlen( $long_payload ), 'The long payload should be longer than the maximum length.' );
		$this->assertLessThan( Insight_Payload::MAX_LENGTH, strlen( $short_payload ), 'The short payload should be shorter than the maximum length.' );
		$this->assertNull( Insight_Payload::decode( $long_payload, self::USER_ID ), 'A correctly signed payload longer than the maximum length should not decode.' );
		$this->assertNotNull( Insight_Payload::decode( $short_payload, self::USER_ID ), 'A correctly signed payload shorter than the maximum length should decode.' );
	}

	/**
	 * @dataProvider data_malformed_payloads
	 *
	 * @param string $payload A payload that is not a body and a signature joined by one dot.
	 */
	public function test_decode__returns_null_for_a_payload_that_is_not_a_body_and_a_signature( $payload ) {
		$this->assertNull( Insight_Payload::decode( $payload, self::USER_ID ), 'A payload that is not a body and a signature joined by one dot should not decode.' );
	}

	public function data_malformed_payloads() {
		$body = $this->base64url_encode(
			wp_json_encode(
				array(
					'locale'  => 'de_DE',
					'request' => $this->get_request(),
				)
			)
		);

		return array(
			'empty string'      => array( '' ),
			'no dot'            => array( $body ),
			'three parts'       => array( $body . '.' . $body . '.' . $body ),
			'empty body'        => array( '.' . $body ),
			'empty signature'   => array( $body . '.' ),
			'only a dot'        => array( '.' ),
			'two trailing dots' => array( $body . '..' ),
		);
	}

	public function test_decode__returns_null_for_a_payload_whose_body_or_signature_changed() {
		$payload                  = Insight_Payload::encode( $this->get_request(), 'de_DE', self::USER_ID );
		list( $body, $signature ) = explode( '.', $payload );

		$other_payload  = Insight_Payload::encode( $this->get_request(), 'en_US', self::USER_ID );
		$changed_body   = $this->base64url_encode(
			wp_json_encode(
				array(
					'locale'  => 'de_DE',
					'request' => array_merge( $this->get_request(), array( 'days_in_period' => 7 ) ),
				)
			)
		);
		$flipped_letter = 'A' === $signature[0] ? 'B' : 'A';

		$this->assertNotNull( Insight_Payload::decode( $payload, self::USER_ID ), 'The unchanged payload should decode.' );
		$this->assertNull( Insight_Payload::decode( $changed_body . '.' . $signature, self::USER_ID ), 'A payload whose body changed should not decode with the signature of the original body.' );
		$this->assertNull( Insight_Payload::decode( $body . '.' . $flipped_letter . substr( $signature, 1 ), self::USER_ID ), 'A payload whose signature changed should not decode.' );
		$this->assertNull( Insight_Payload::decode( $body . '.' . explode( '.', $other_payload )[1], self::USER_ID ), 'A payload with the signature of another payload should not decode.' );
	}

	/**
	 * @dataProvider data_signed_bodies_that_are_not_json_objects
	 *
	 * @param string $body The decoded body of the payload, or a body that is not base64url.
	 * @param bool   $raw  Whether the body is sent as it is rather than base64url-encoded.
	 */
	public function test_decode__returns_null_for_a_signed_body_that_is_not_base64url_json_of_an_object( $body, $raw ) {
		$payload = $raw ? $body . '.' . $this->sign( $body, self::USER_ID ) : $this->get_signed_payload( $body );

		$this->assertNull( Insight_Payload::decode( $payload, self::USER_ID ), 'A correctly signed payload whose body is not base64url JSON of an object should not decode.' );
	}

	public function data_signed_bodies_that_are_not_json_objects() {
		return array(
			'not base64url'  => array( 'not*base64!', true ),
			'not JSON'       => array( 'not JSON', false ),
			'a JSON string'  => array( '"de_DE"', false ),
			'a JSON number'  => array( '28', false ),
			'JSON null'      => array( 'null', false ),
			'truncated JSON' => array( '{"locale":"de_DE","request":{', false ),
		);
	}

	/**
	 * @dataProvider data_payloads_without_their_required_fields
	 *
	 * @param array $data The data the payload holds.
	 */
	public function test_decode__returns_null_for_a_signed_payload_without_its_required_fields( array $data ) {
		$this->assertNull( Insight_Payload::decode( $this->get_signed_payload( $data ), self::USER_ID ), 'A correctly signed payload that misses a field the service requires, or has it of another type, should not decode.' );
	}

	public function data_payloads_without_their_required_fields() {
		$request = $this->get_request();

		$without = function ( array $fields, $key ) {
			unset( $fields[ $key ] );

			return $fields;
		};

		$with = function ( array $fields, $key, $value ) {
			$fields[ $key ] = $value;

			return $fields;
		};

		$data = function ( $request, $locale = 'de_DE' ) {
			return array(
				'locale'  => $locale,
				'request' => $request,
			);
		};

		return array(
			'no locale'                          => array( array( 'request' => $request ) ),
			'no request'                         => array( array( 'locale' => 'de_DE' ) ),
			'a locale that is not a string'      => array( $data( $request, 5 ) ),
			'a null locale'                      => array( $data( $request, null ) ),
			'a request that is not an object'    => array( $data( 'request' ) ),
			'no end_date'                        => array( $data( $without( $request, 'end_date' ) ) ),
			'an end_date that is not a string'   => array( $data( $with( $request, 'end_date', 20260915 ) ) ),
			'no days_in_period'                  => array( $data( $without( $request, 'days_in_period' ) ) ),
			'a days_in_period string'            => array( $data( $with( $request, 'days_in_period', '28' ) ) ),
			'a days_in_period with decimals'     => array( $data( $with( $request, 'days_in_period', 28.5 ) ) ),
			'no visits'                          => array( $data( $without( $request, 'visits' ) ) ),
			'visits that are not an object'      => array( $data( $with( $request, 'visits', 800 ) ) ),
			'no current_period visits'           => array( $data( $with( $request, 'visits', $without( $request['visits'], 'current_period' ) ) ) ),
			'no previous_period visits'          => array( $data( $with( $request, 'visits', $without( $request['visits'], 'previous_period' ) ) ) ),
			'a null current_period'              => array( $data( $with( $request, 'visits', $with( $request['visits'], 'current_period', null ) ) ) ),
			'a top-level list instead of object' => array( array( 'de_DE', $request ) ),
		);
	}
}
