<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit_Dependencies\Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaProperty;
use Google\Site_Kit_Dependencies\Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaWebDataStream;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the Analytics 4 module.
 *
 * @since 1.30.0
 * @access private
 * @ignore
 */
final class Analytics_4 extends Module
	implements Module_With_Scopes, Module_With_Settings, Module_With_Debug_Fields, Module_With_Owner {
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.30.0
	 */
	public function register() {
		$this->register_scopes_hook();
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.30.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/analytics.readonly',
		);
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.30.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$required_keys = array(
			'accountID',
			'propertyID',
			'webDataStreamID',
			'measurementID',
		);

		$options = $this->get_settings()->get();
		foreach ( $required_keys as $required_key ) {
			if ( empty( $options[ $required_key ] ) ) {
				return false;
			}
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.30.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.30.0
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		return array(
			'analytics_4_account_id'         => array(
				'label' => __( 'Analytics 4 account ID', 'google-site-kit' ),
				'value' => $settings['accountID'],
				'debug' => Debug_Data::redact_debug_value( $settings['accountID'] ),
			),
			'analytics_4_property_id'        => array(
				'label' => __( 'Analytics 4 property ID', 'google-site-kit' ),
				'value' => $settings['propertyID'],
				'debug' => Debug_Data::redact_debug_value( $settings['propertyID'], 7 ),
			),
			'analytics_4_web_data_stream_id' => array(
				'label' => __( 'Analytics 4 web data stream ID', 'google-site-kit' ),
				'value' => $settings['webDataStreamID'],
				'debug' => Debug_Data::redact_debug_value( $settings['webDataStreamID'] ),
			),
			'analytics_4_measurement_id'     => array(
				'label' => __( 'Analytics 4 measurement ID', 'google-site-kit' ),
				'value' => $settings['measurementID'],
				'debug' => Debug_Data::redact_debug_value( $settings['measurementID'] ),
			),
			'analytics_4_use_snippet'        => array(
				'label' => __( 'Analytics 4 snippet placed', 'google-site-kit' ),
				'value' => $settings['useSnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useSnippet'] ? 'yes' : 'no',
			),
		);
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.30.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:accounts'              => array( 'service' => 'analyticsadmin' ),
			'POST:create-property'      => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( 'https://www.googleapis.com/auth/analytics.edit' ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics 4 property on your behalf.', 'google-site-kit' ),
			),
			'POST:create-webdatastream' => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( 'https://www.googleapis.com/auth/analytics.edit' ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics 4 web data stream on your behalf.', 'google-site-kit' ),
			),
			'GET:properties'            => array( 'service' => 'analyticsadmin' ),
			'GET:webdatastreams'        => array( 'service' => 'analyticsadmin' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.30.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:accounts':
				return $this->get_service( 'analyticsadmin' )->accounts->listAccounts();
			case 'POST:create-property':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				$property = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaProperty();
				$property->setParent( 'accounts/' . $data['accountID'] );
				$property->setDisplayName( wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST ) );
				return $this->get_service( 'analyticsadmin' )->properties->create( $property );
			case 'POST:create-webdatastream':
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}
				$datastream = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaWebDataStream();
				$datastream->setDisplayName( wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST ) );
				$datastream->setDefaultUri( $this->context->get_reference_site_url() );
				return $this->get_service( 'analyticsadmin' )->properties_webDataStreams->create( 'properties/' . $data['propertyID'], $datastream );
			case 'GET:properties':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				return $this->get_service( 'analyticsadmin' )->properties->listProperties(
					array(
						'filter' => 'parent:accounts/' . $data['accountID'],
					)
				);
			case 'GET:webdatastreams':
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}
				return $this->get_service( 'analyticsadmin' )->properties_webDataStreams->listPropertiesWebDataStreams( 'properties/' . $data['propertyID'] );
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.30.0
	 *
	 * @param Data_Request $data     Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:accounts':
				return $response->getAccounts();
			case 'GET:properties':
				return $response->getProperties();
			case 'GET:webdatastreams':
				return $response->getWebDataStreams();
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.30.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'analytics-4',
			'name'        => _x( 'Analytics 4 (Alpha)', 'Service name', 'google-site-kit' ),
			'description' => __( 'Get a deeper understanding of your customers. Google Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ),
			'cta'         => __( 'Get to know your customers.', 'google-site-kit' ),
			'order'       => 3,
			'homepage'    => __( 'https://analytics.google.com/analytics/web', 'google-site-kit' ),
			'learn_more'  => __( 'https://marketingplatform.google.com/about/analytics/', 'google-site-kit' ),
			'internal'    => true,
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.30.0
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Site_Kit_Client $client ) {
		return array(
			'analyticsadmin' => new Google_Service_GoogleAnalyticsAdmin( $client ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.30.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}
}
