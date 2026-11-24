<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Secret
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol;

use Exception;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaMeasurementProtocolSecret;
use WP_Error;

/**
 * Class that reads, stores, reuses and clears the Measurement Protocol secret of the connected web data stream.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Measurement_Protocol_Secret {

	/**
	 * Display name of the Measurement Protocol secret that Site Kit uses. It is an API value, so it is not translated.
	 *
	 * @since n.e.x.t
	 */
	const DISPLAY_NAME = 'Site Kit by Google';

	/**
	 * Analytics 4 settings instance.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Measurement_Protocol_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Measurement_Protocol_Settings
	 */
	private $measurement_protocol_settings;

	/**
	 * Function that returns the Google Analytics Admin service.
	 *
	 * @since n.e.x.t
	 * @var callable
	 */
	private $get_service;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Settings                      $settings                      Analytics 4 settings instance.
	 * @param Measurement_Protocol_Settings $measurement_protocol_settings Measurement_Protocol_Settings instance.
	 * @param callable                      $get_service                   Function that returns the Google Analytics Admin service.
	 */
	public function __construct( Settings $settings, Measurement_Protocol_Settings $measurement_protocol_settings, callable $get_service ) {
		$this->settings                      = $settings;
		$this->measurement_protocol_settings = $measurement_protocol_settings;
		$this->get_service                   = $get_service;
	}

	/**
	 * Gets the stored secret value when it belongs to the connected property and web data stream.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The secret value, or an empty string when no secret is stored for the connected web data stream.
	 */
	public function get_api_secret() {
		$stored_secret = $this->measurement_protocol_settings->get();
		$settings      = $this->settings->get();

		if ( $stored_secret['propertyID'] !== $settings['propertyID'] || $stored_secret['webDataStreamID'] !== $settings['webDataStreamID'] ) {
			return '';
		}

		return $stored_secret['secretValue'];
	}

	/**
	 * Stores the given secret when it belongs to the connected property and web data stream.
	 *
	 * @since n.e.x.t
	 *
	 * @param GoogleAnalyticsAdminV1betaMeasurementProtocolSecret $secret Secret returned by the Google Analytics Admin API.
	 * @return bool True if the secret was stored, otherwise false.
	 */
	public function store( GoogleAnalyticsAdminV1betaMeasurementProtocolSecret $secret ) {
		$secret_value = $secret->getSecretValue();

		if ( empty( $secret_value ) || ! preg_match( '#^properties/([^/]+)/dataStreams/([^/]+)/measurementProtocolSecrets/([^/]+)$#', $secret->getName(), $matches ) ) {
			return false;
		}

		list( , $property_id, $web_data_stream_id, $secret_id ) = $matches;

		$settings = $this->settings->get();

		if ( $property_id !== $settings['propertyID'] || $web_data_stream_id !== $settings['webDataStreamID'] ) {
			return false;
		}

		$is_stored = $this->measurement_protocol_settings->set(
			array(
				'secretValue'     => $secret_value,
				'propertyID'      => $property_id,
				'webDataStreamID' => $web_data_stream_id,
				'secretID'        => $secret_id,
			)
		);

		if ( ! $is_stored ) {
			return false;
		}

		$this->settings->merge( array( 'measurementProtocolSecretID' => $secret_id ) );

		return true;
	}

	/**
	 * Finds the "Site Kit by Google" secret on the connected web data stream and stores it.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool|WP_Error True if a "Site Kit by Google" secret was found, false if there is none,
	 *                       or a WP_Error when no web data stream is connected or the request fails.
	 */
	public function adopt() {
		$settings = $this->settings->get();

		if ( empty( $settings['propertyID'] ) || empty( $settings['webDataStreamID'] ) ) {
			return new WP_Error(
				'missing_required_setting',
				__( 'No connected Google Analytics web data stream.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		$parent     = Analytics_4::get_web_data_stream_name( $settings['propertyID'], $settings['webDataStreamID'] );
		$page_token = '';

		try {
			/**
			 * Google Analytics Admin service instance.
			 *
			 * @var GoogleAnalyticsAdmin $service
			 */
			$service = ( $this->get_service )();

			do {
				$response = $service
					->properties_dataStreams_measurementProtocolSecrets // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					->listPropertiesDataStreamsMeasurementProtocolSecrets( $parent, array( 'pageToken' => $page_token ) );

				foreach ( $response->getMeasurementProtocolSecrets() as $secret ) {
					if ( self::DISPLAY_NAME === $secret->getDisplayName() ) {
						// The secret counts as found even when it is not stored, so that no second "Site Kit by Google"
						// secret is created; `get_api_secret()` tells whether it was stored.
						$this->store( $secret );

						return true;
					}
				}

				$page_token = $response->getNextPageToken();
			} while ( ! empty( $page_token ) );
		} catch ( Exception $error ) {
			return new WP_Error( 'analytics_admin_request_failed', $error->getMessage() );
		}

		return false;
	}

	/**
	 * Deletes the stored secret and empties the `measurementProtocolSecretID` setting.
	 *
	 * @since n.e.x.t
	 */
	public function clear() {
		$this->measurement_protocol_settings->delete();
		$this->settings->merge( array( 'measurementProtocolSecretID' => '' ) );
	}
}
