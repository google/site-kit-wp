<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_SecretTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Secret;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Settings;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Exception as Google_Service_Exception;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaMeasurementProtocolSecret;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Analytics_4
 */
class Measurement_Protocol_SecretTest extends TestCase {

	/**
	 * Analytics_4 instance.
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

	/**
	 * Measurement_Protocol_Secret instance under test.
	 *
	 * @var Measurement_Protocol_Secret
	 */
	private $measurement_protocol_secret;

	/**
	 * Requests sent to the Google Analytics Admin API.
	 *
	 * @var Request[]
	 */
	private $requests;

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );

		$this->analytics                     = new Analytics_4( $context, $options, $user_options, $authentication );
		$this->measurement_protocol_settings = new Measurement_Protocol_Settings( new Encrypted_Options( $options ) );
		$this->measurement_protocol_secret   = $this->analytics->get_measurement_protocol_secret();
		$this->requests                      = array();

		$this->analytics->get_settings()->merge(
			array(
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
			)
		);
	}

	public function test_get_api_secret__matching_property_and_stream() {
		$this->measurement_protocol_settings->set(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'secretID'        => 'test-secret-id',
			)
		);

		$this->assertSame(
			'',
			$this->analytics->get_settings()->get()['measurementProtocolSecretID'],
			'The `measurementProtocolSecretID` setting should be empty for this test.'
		);
		$this->assertSame(
			'test-secret-value',
			$this->measurement_protocol_secret->get_api_secret(),
			'The secret value should be returned when its property and stream match the settings, even with an empty `measurementProtocolSecretID`.'
		);
	}

	/**
	 * @dataProvider data_other_property_or_stream
	 *
	 * @param string $property_id        Property ID of the stored secret.
	 * @param string $web_data_stream_id Web data stream ID of the stored secret.
	 */
	public function test_get_api_secret__other_property_or_stream( $property_id, $web_data_stream_id ) {
		$is_stored = $this->measurement_protocol_settings->set(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => $property_id,
				'webDataStreamID' => $web_data_stream_id,
				'secretID'        => 'test-secret-id',
			)
		);

		$this->assertTrue( $is_stored, 'The secret of another property or stream should be stored for this test.' );

		$this->assertSame(
			'',
			$this->measurement_protocol_secret->get_api_secret(),
			'An empty string should be returned when the stored secret belongs to another property or stream.'
		);
	}

	public function test_store() {
		$secret = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
		$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/test-secret-id' );
		$secret->setSecretValue( 'test-secret-value' );

		$this->assertTrue(
			$this->measurement_protocol_secret->store( $secret ),
			'Storing a secret of the connected stream should succeed.'
		);
		$this->assertSame(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'secretID'        => 'test-secret-id',
			),
			$this->measurement_protocol_settings->get(),
			'The secret value should be stored with the property, stream and secret ID from its name.'
		);
		$this->assertSame(
			'test-secret-id',
			$this->analytics->get_settings()->get()['measurementProtocolSecretID'],
			'The `measurementProtocolSecretID` setting should be set to the stored secret ID.'
		);
	}

	public function test_store__without_secret_value() {
		$secret = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
		$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/test-secret-id' );
		$secret->setSecretValue( '' );

		$this->assertFalse(
			$this->measurement_protocol_secret->store( $secret ),
			'Storing a secret without a value should fail.'
		);
		$this->assertOptionNotExists(
			Measurement_Protocol_Settings::OPTION,
			'Nothing should be stored for a secret without a value.'
		);
		$this->assertSame(
			'',
			$this->analytics->get_settings()->get()['measurementProtocolSecretID'],
			'The `measurementProtocolSecretID` setting should stay empty for a secret without a value.'
		);
	}

	public function test_store__value_not_saved() {
		// Returning the old value makes `update_option()` skip the write and return false.
		add_filter(
			'pre_update_option_' . Measurement_Protocol_Settings::OPTION,
			fn ( $value, $old_value ) => $old_value,
			10,
			2
		);
		$secret = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
		$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/test-secret-id' );
		$secret->setSecretValue( 'test-secret-value' );

		$this->assertFalse(
			$this->measurement_protocol_secret->store( $secret ),
			'Storing should fail when the secret value cannot be saved.'
		);
		$this->assertSame(
			'',
			$this->analytics->get_settings()->get()['measurementProtocolSecretID'],
			'The `measurementProtocolSecretID` setting should stay empty when the secret value cannot be saved.'
		);
	}

	/**
	 * @dataProvider data_other_property_or_stream
	 *
	 * @param string $property_id        Property ID in the secret's name.
	 * @param string $web_data_stream_id Web data stream ID in the secret's name.
	 */
	public function test_store__other_property_or_stream( $property_id, $web_data_stream_id ) {
		$secret = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
		$secret->setName( "properties/{$property_id}/dataStreams/{$web_data_stream_id}/measurementProtocolSecrets/test-secret-id" );
		$secret->setSecretValue( 'test-secret-value' );

		$this->assertFalse(
			$this->measurement_protocol_secret->store( $secret ),
			'Storing a secret of another property or stream should fail.'
		);
		$this->assertOptionNotExists(
			Measurement_Protocol_Settings::OPTION,
			'Nothing should be stored for a secret of another property or stream.'
		);
		$this->assertSame(
			'',
			$this->analytics->get_settings()->get()['measurementProtocolSecretID'],
			'The `measurementProtocolSecretID` setting should stay empty for a secret of another property or stream.'
		);
	}

	public function data_other_property_or_stream() {
		return array(
			'other property' => array( '111111111', '987654321' ),
			'other stream'   => array( '123456789', '222222222' ),
		);
	}

	public function test_adopt__secret_on_second_page() {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->requests[] = $request;

				parse_str( $request->getUri()->getQuery(), $query );

				$response = new GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse();

				if ( 'page-2' === $query['pageToken'] ) {
					$secret = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
					$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/test-secret-id' );
					$secret->setDisplayName( 'Site Kit by Google' );
					$secret->setSecretValue( 'test-secret-value' );
					$response->setMeasurementProtocolSecrets( array( $secret ) );
				} else {
					$secret = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
					$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/other-secret-id' );
					$secret->setDisplayName( 'Other secret' );
					$secret->setSecretValue( 'other-secret-value' );
					$response->setMeasurementProtocolSecrets( array( $secret ) );
					$response->setNextPageToken( 'page-2' );
				}

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);

		$this->assertTrue(
			$this->measurement_protocol_secret->adopt(),
			'Adopting should succeed when a "Site Kit by Google" secret is on the second page.'
		);
		$this->assertCount( 2, $this->requests, 'Adopting should request the second page of secrets.' );
		$this->assertSame(
			'https://analyticsadmin.googleapis.com/v1beta/properties/123456789/dataStreams/987654321/measurementProtocolSecrets?pageToken=page-2',
			(string) $this->requests[1]->getUri(),
			'The second page of secrets should be requested for the connected web data stream.'
		);
		$this->assertSame(
			'test-secret-value',
			$this->measurement_protocol_secret->get_api_secret(),
			'The "Site Kit by Google" secret should be stored.'
		);
	}

	public function test_adopt__no_site_kit_secret() {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->requests[] = $request;

				$response = new GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse();
				$secret   = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
				$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/other-secret-id' );
				$secret->setDisplayName( 'Other secret' );
				$secret->setSecretValue( 'other-secret-value' );
				$response->setMeasurementProtocolSecrets( array( $secret ) );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);

		$this->assertFalse(
			$this->measurement_protocol_secret->adopt(),
			'Adopting should return false when no secret is named "Site Kit by Google".'
		);
		$this->assertOptionNotExists(
			Measurement_Protocol_Settings::OPTION,
			'A secret with another display name should not be stored.'
		);
		$this->assertCount( 1, $this->requests, 'Adopting should send only the request that lists the secrets.' );
		$this->assertSame(
			'GET',
			$this->requests[0]->getMethod(),
			'Adopting should only send a `GET` request, so no secret is created.'
		);
	}

	public function test_adopt__request_fails() {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function () {
				return new FulfilledPromise(
					new Response(
						404,
						array(),
						wp_json_encode(
							array(
								'error' => array(
									'code'    => 404,
									'message' => 'Requested entity was not found.',
									'status'  => 'NOT_FOUND',
								),
							)
						)
					)
				);
			}
		);

		$result = $this->measurement_protocol_secret->adopt();

		$this->assertWPError( $result, 'Adopting should return a WP_Error when the request fails.' );
		$this->assertSame(
			'analytics_admin_request_failed',
			$result->get_error_code(),
			'The error code should be `analytics_admin_request_failed`.'
		);
		$this->assertSame(
			'Requested entity was not found.',
			$result->get_error_message(),
			'The error message should be the `error.message` of the response body, not the whole body.'
		);
		$this->assertOptionNotExists(
			Measurement_Protocol_Settings::OPTION,
			'Nothing should be stored when the request fails.'
		);
	}

	/**
	 * @dataProvider data_missing_property_or_stream
	 *
	 * @param array $settings Settings that leave the property or the stream empty.
	 */
	public function test_adopt__missing_property_or_stream( $settings ) {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->requests[] = $request;

				return new FulfilledPromise( new Response( 200 ) );
			}
		);
		$this->analytics->get_settings()->merge( $settings );

		$result = $this->measurement_protocol_secret->adopt();

		$this->assertWPError( $result, 'Adopting should return a WP_Error without a connected web data stream.' );
		$this->assertSame(
			'missing_required_setting',
			$result->get_error_code(),
			'The error code should say that a setting is missing.'
		);
		$this->assertCount( 0, $this->requests, 'No request should be sent without a connected web data stream.' );
	}

	public function data_missing_property_or_stream() {
		return array(
			'empty property' => array( array( 'propertyID' => '' ) ),
			'empty stream'   => array( array( 'webDataStreamID' => '' ) ),
		);
	}

	public function test_create__existing_secret() {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->requests[] = $request;

				$response = new GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse();
				$secret   = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
				$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/test-secret-id' );
				$secret->setDisplayName( 'Site Kit by Google' );
				$secret->setSecretValue( 'test-secret-value' );
				$response->setMeasurementProtocolSecrets( array( $secret ) );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);

		$this->assertTrue(
			$this->measurement_protocol_secret->create(),
			'Creating should succeed when the stream already has a "Site Kit by Google" secret.'
		);
		$this->assertCount( 1, $this->requests, 'No secret should be created when the stream already has a "Site Kit by Google" secret.' );
		$this->assertSame(
			'GET',
			$this->requests[0]->getMethod(),
			'The one request sent should list the secrets.'
		);
		$this->assertSame(
			'test-secret-value',
			$this->measurement_protocol_secret->get_api_secret(),
			'The existing "Site Kit by Google" secret should be stored.'
		);
	}

	public function test_create__no_existing_secret() {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->requests[] = $request;

				if ( 'POST' === $request->getMethod() ) {
					$secret = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
					$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/new-secret-id' );
					$secret->setDisplayName( 'Site Kit by Google' );
					$secret->setSecretValue( 'new-secret-value' );

					return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $secret ) ) );
				}

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( new GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse() ) ) );
			}
		);

		$this->assertTrue(
			$this->measurement_protocol_secret->create(),
			'Creating should succeed when the stream has no "Site Kit by Google" secret.'
		);
		$this->assertCount( 2, $this->requests, 'The secrets should be listed, then a secret should be created.' );
		$this->assertSame(
			'POST https://analyticsadmin.googleapis.com/v1beta/properties/123456789/dataStreams/987654321/measurementProtocolSecrets',
			$this->requests[1]->getMethod() . ' ' . $this->requests[1]->getUri(),
			'The secret should be created under the connected web data stream.'
		);
		$this->assertSame(
			array( 'displayName' => 'Site Kit by Google' ),
			json_decode( (string) $this->requests[1]->getBody(), true ),
			'The created secret should be named "Site Kit by Google".'
		);
		$this->assertSame(
			'new-secret-value',
			$this->measurement_protocol_secret->get_api_secret(),
			'The created secret should be stored.'
		);
	}

	public function test_create__list_request_fails() {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->requests[] = $request;

				return new FulfilledPromise(
					new Response(
						404,
						array(),
						wp_json_encode(
							array(
								'error' => array(
									'code'    => 404,
									'message' => 'Requested entity was not found.',
									'status'  => 'NOT_FOUND',
								),
							)
						)
					)
				);
			}
		);

		$result = $this->measurement_protocol_secret->create();

		$this->assertWPError( $result, 'Creating should return a WP_Error when listing the secrets fails.' );
		$this->assertSame(
			'Requested entity was not found.',
			$result->get_error_message(),
			'The error of the list request should be returned.'
		);
		$this->assertCount( 1, $this->requests, 'No secret should be created when listing the secrets fails.' );
		$this->assertSame(
			'GET',
			$this->requests[0]->getMethod(),
			'The one request sent should list the secrets.'
		);
	}

	public function test_create__create_request_fails() {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				if ( 'POST' === $request->getMethod() ) {
					return new FulfilledPromise(
						new Response(
							400,
							array(),
							wp_json_encode(
								array(
									'error' => array(
										'code'    => 400,
										'message' => 'User has not acknowledged the user data collection terms for this property.',
										'status'  => 'FAILED_PRECONDITION',
									),
								)
							)
						)
					);
				}

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( new GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse() ) ) );
			}
		);

		$result = $this->measurement_protocol_secret->create();

		$this->assertWPError( $result, 'Creating should return a WP_Error when the Admin API refuses the create request.' );
		$this->assertSame(
			'analytics_admin_request_failed',
			$result->get_error_code(),
			'The error code should be `analytics_admin_request_failed` for a refused create request.'
		);
		$this->assertSame(
			'User has not acknowledged the user data collection terms for this property.',
			$result->get_error_message(),
			'The error message should be the `error.message` of the response body.'
		);
		$this->assertSame(
			array(
				'status' => 400,
				'reason' => 'FAILED_PRECONDITION',
			),
			$result->get_error_data(),
			'The error data should contain the HTTP status and the `error.status` of the response body.'
		);
		$this->assertOptionNotExists(
			Measurement_Protocol_Settings::OPTION,
			'Nothing should be stored when the create request fails.'
		);
	}

	/**
	 * @dataProvider data_create__stream_changes
	 *
	 * @param string   $display_name     Display name of the secret that the list request returns.
	 * @param string   $request_method   Method of the request whose response returns the secret to store.
	 * @param array    $changed_settings Settings that change while that request is sent.
	 * @param string[] $expected_methods Methods of the requests that should be sent.
	 */
	public function test_create__stream_changes( $display_name, $request_method, $changed_settings, $expected_methods ) {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) use ( $display_name, $request_method, $changed_settings ) {
				$this->requests[] = $request;

				// Another property or web data stream gets connected while the request that returns the secret is sent.
				if ( $request_method === $request->getMethod() ) {
					$this->analytics->get_settings()->merge( $changed_settings );
				}

				$secret = new GoogleAnalyticsAdminV1betaMeasurementProtocolSecret();
				$secret->setName( 'properties/123456789/dataStreams/987654321/measurementProtocolSecrets/test-secret-id' );
				$secret->setDisplayName( $display_name );
				$secret->setSecretValue( 'test-secret-value' );

				if ( 'POST' === $request->getMethod() ) {
					return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $secret ) ) );
				}

				$response = new GoogleAnalyticsAdminV1betaListMeasurementProtocolSecretsResponse();
				$response->setMeasurementProtocolSecrets( array( $secret ) );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);

		$result = $this->measurement_protocol_secret->create();

		$this->assertWPError( $result, 'Creating should return a WP_Error when the secret belongs to a property or stream that is no longer connected.' );
		$this->assertSame(
			'measurement_protocol_secret_not_stored',
			$result->get_error_code(),
			'The error code should be `measurement_protocol_secret_not_stored`.'
		);
		$this->assertSame(
			array( 'status' => 409 ),
			$result->get_error_data(),
			'The error data should contain status 409, since the connected property or web data stream changed.'
		);
		$this->assertSame(
			$expected_methods,
			array_map(
				fn ( Request $request ) => $request->getMethod(),
				$this->requests
			),
			'The secrets should be listed, and a secret should be created only when none is named "Site Kit by Google".'
		);
		$this->assertOptionNotExists(
			Measurement_Protocol_Settings::OPTION,
			'The secret of a property or stream that is no longer connected should not be stored.'
		);
	}

	public function data_create__stream_changes() {
		return array(
			'stream changes, existing secret reused'   => array( 'Site Kit by Google', 'GET', array( 'webDataStreamID' => '222222222' ), array( 'GET' ) ),
			'stream changes, new secret created'       => array( 'Other secret', 'POST', array( 'webDataStreamID' => '222222222' ), array( 'GET', 'POST' ) ),
			'property changes, existing secret reused' => array( 'Site Kit by Google', 'GET', array( 'propertyID' => '111111111' ), array( 'GET' ) ),
			'property changes, new secret created'     => array( 'Other secret', 'POST', array( 'propertyID' => '111111111' ), array( 'GET', 'POST' ) ),
		);
	}

	/**
	 * @dataProvider data_exception_to_error__body_not_json
	 *
	 * @param string $body   Response body.
	 * @param int    $status HTTP status of the response.
	 */
	public function test_exception_to_error__body_not_json( $body, $status ) {
		$result = Measurement_Protocol_Secret::exception_to_error( new Google_Service_Exception( $body, $status ) );

		$this->assertSame(
			'analytics_admin_request_failed',
			$result->get_error_code(),
			'The error code should be `analytics_admin_request_failed` for a response body that is not JSON, even with status 403.'
		);
		$this->assertSame(
			$body,
			$result->get_error_message(),
			'The error message should be the whole response body when it is not JSON.'
		);
		$this->assertSame(
			array(
				'status' => $status,
				'reason' => '',
			),
			$result->get_error_data(),
			'The error data should contain the HTTP status and an empty reason when the response body is not JSON.'
		);
	}

	public function data_exception_to_error__body_not_json() {
		return array(
			'502 Bad Gateway' => array( 'Bad Gateway', 502 ),
			'403 Forbidden'   => array( 'Forbidden', 403 ),
		);
	}

	public function test_clear() {
		$is_stored = $this->measurement_protocol_settings->set(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'secretID'        => 'test-secret-id',
			)
		);
		$this->assertTrue( $is_stored, 'The secret should be stored before it is cleared.' );
		$this->analytics->get_settings()->merge( array( 'measurementProtocolSecretID' => 'test-secret-id' ) );

		$this->measurement_protocol_secret->clear();

		$this->assertOptionNotExists(
			Measurement_Protocol_Settings::OPTION,
			'The stored secret should be deleted.'
		);
		$this->assertSame(
			'',
			$this->analytics->get_settings()->get()['measurementProtocolSecretID'],
			'The `measurementProtocolSecretID` setting should be emptied.'
		);
	}
}
