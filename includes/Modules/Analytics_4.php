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

use Exception;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Tags\Guards\Tag_Production_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Analytics\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Tag_Guard;
use Google\Site_Kit\Modules\Analytics_4\Web_Tag;
use Google\Site_Kit_Dependencies\Google\Model as Google_Model;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaDataStream;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaDataStreamWebStreamData;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListDataStreamsResponse;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaProperty as Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaProperty;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use stdClass;
use WP_Error;

/**
 * Class representing the Analytics 4 module.
 *
 * @since 1.30.0
 * @access private
 * @ignore
 */
final class Analytics_4 extends Module
	implements Module_With_Scopes, Module_With_Settings, Module_With_Debug_Fields, Module_With_Owner, Module_With_Assets, Module_With_Deactivation {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'analytics-4';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.30.0
	 */
	public function register() {
		$this->register_scopes_hook();

		add_action( 'googlesitekit_analytics_handle_provisioning_callback', $this->get_method_proxy( 'handle_provisioning_callback' ) );
		// Analytics 4 tag placement logic.
		add_action( 'template_redirect', $this->get_method_proxy( 'register_tag' ) );
		add_action( 'googlesitekit_analytics_tracking_opt_out', $this->get_method_proxy( 'analytics_tracking_opt_out' ) );
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
			Analytics::READONLY_SCOPE,
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
			// TODO: These can be uncommented when Analytics and Analytics 4 modules are officially separated.
			/* 'accountID', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			/* 'adsConversionID', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
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
			// phpcs:disable
			/*
			TODO: This can be uncommented when Analytics and Analytics 4 modules are officially separated.
			'analytics_4_account_id'         => array(
				'label' => __( 'Analytics 4 account ID', 'google-site-kit' ),
				'value' => $settings['accountID'],
				'debug' => Debug_Data::redact_debug_value( $settings['accountID'] ),
			),
			'analytics_4_ads_conversion_id'         => array(
				'label' => __( 'Analytics 4 ads conversion ID', 'google-site-kit' ),
				'value' => $settings['adsConversionID'],
				'debug' => Debug_Data::redact_debug_value( $settings['adsConversionID'] ),
			),
			*/
			// phpcs:enable
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
			'GET:account-summaries'     => array( 'service' => 'analyticsadmin' ),
			'GET:accounts'              => array( 'service' => 'analyticsadmin' ),
			'POST:create-property'      => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( Analytics::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics 4 property on your behalf.', 'google-site-kit' ),
			),
			'POST:create-webdatastream' => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( Analytics::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics 4 Measurement ID for this site on your behalf.', 'google-site-kit' ),
			),
			'GET:properties'            => array( 'service' => 'analyticsadmin' ),
			'GET:property'              => array( 'service' => 'analyticsadmin' ),
			'GET:webdatastreams'        => array( 'service' => 'analyticsadmin' ),
			'GET:webdatastreams-batch'  => array( 'service' => 'analyticsadmin' ),
		);
	}

	/**
	 * Creates a new property for provided account.
	 *
	 * @since 1.35.0
	 *
	 * @param string $account_id Account ID.
	 * @return Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaProperty A new property.
	 */
	private function create_property( $account_id ) {
		$timezone = get_option( 'timezone_string' );
		if ( empty( $timezone ) ) {
			$timezone = 'UTC';
		}

		$property = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaProperty();
		$property->setParent( self::normalize_account_id( $account_id ) );
		$property->setDisplayName( wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST ) );
		$property->setTimeZone( $timezone );

		return $this->get_service( 'analyticsadmin' )->properties->create( $property );
	}

	/**
	 * Creates a new web data stream for provided property.
	 *
	 * @since 1.35.0
	 *
	 * @param string $property_id Property ID.
	 * @return GoogleAnalyticsAdminV1alphaDataStream A new web data stream.
	 */
	private function create_webdatastream( $property_id ) {
		$site_url = $this->context->get_reference_site_url();
		$data     = new GoogleAnalyticsAdminV1alphaDataStreamWebStreamData();
		$data->setDefaultUri( $site_url );

		$datastream = new GoogleAnalyticsAdminV1alphaDataStream();
		$datastream->setDisplayName( wp_parse_url( $site_url, PHP_URL_HOST ) );
		$datastream->setType( 'WEB_DATA_STREAM' );
		$datastream->setWebStreamData( $data );

		/* @var Google_Service_GoogleAnalyticsAdmin $analyticsadmin phpcs:ignore Squiz.PHP.CommentedOutCode.Found */
		$analyticsadmin = $this->get_service( 'analyticsadmin' );

		return $analyticsadmin
			->properties_dataStreams // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->create(
				self::normalize_property_id( $property_id ),
				$datastream
			);
	}

	/**
	 * Handles Analytics measurement opt-out for a GA4 property.
	 *
	 * @since 1.41.0
	 */
	private function analytics_tracking_opt_out() {
		$settings       = $this->get_settings()->get();
		$measurement_id = $settings['measurementID'];
		if ( ! $measurement_id ) {
			return;
		}
		BC_Functions::wp_print_inline_script_tag( sprintf( 'window["ga-disable-%s"] = true;', esc_attr( $measurement_id ) ) );

	}

	/**
	 * Provisions new GA4 property and web data stream for provided account.
	 *
	 * @since 1.35.0
	 *
	 * @param string $account_id Account ID.
	 */
	private function handle_provisioning_callback( $account_id ) {
		// TODO: remove this try/catch once GA4 API stabilizes.
		try {
			// Reset the current GA4 settings.
			$this->get_settings()->merge(
				array(
					'propertyID'      => '',
					'webDataStreamID' => '',
					'measurementID'   => '',
				)
			);

			$property = $this->create_property( $account_id );
			$property = self::filter_property_with_ids( $property );

			if ( empty( $property->_id ) ) {
				return;
			}

			$this->get_settings()->merge( array( 'propertyID' => $property->_id ) );

			$web_datastream = $this->create_webdatastream( $property->_id );
			$web_datastream = self::filter_webdatastream_with_ids( $web_datastream );

			if ( empty( $web_datastream->_id ) ) {
				return;
			}

			$this->get_settings()->merge(
				array(
					'webDataStreamID' => $web_datastream->_id,
					'measurementID'   => $web_datastream->webStreamData->measurementId, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				)
			);
		} catch ( Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Suppress this exception because it might be caused by unstable GA4 API.
		}
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
			case 'GET:account-summaries':
				return $this->get_service( 'analyticsadmin' )->accountSummaries->listAccountSummaries( array( 'pageSize' => 200 ) );
			case 'POST:create-property':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}

				return $this->create_property( $data['accountID'] );
			case 'POST:create-webdatastream':
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}

				return $this->create_webdatastream( $data['propertyID'] );
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
						'filter' => 'parent:' . self::normalize_account_id( $data['accountID'] ),
					)
				);
			case 'GET:property':
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}

				return $this->get_service( 'analyticsadmin' )->properties->get( self::normalize_property_id( $data['propertyID'] ) );
			case 'GET:webdatastreams':
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}

				/* @var Google_Service_GoogleAnalyticsAdmin $analyticsadmin phpcs:ignore Squiz.PHP.CommentedOutCode.Found */
				$analyticsadmin = $this->get_service( 'analyticsadmin' );

				return $analyticsadmin
					->properties_dataStreams // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					->listPropertiesDataStreams(
						self::normalize_property_id( $data['propertyID'] )
					);
			case 'GET:webdatastreams-batch':
				if ( ! isset( $data['propertyIDs'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyIDs' ),
						array( 'status' => 400 )
					);
				}

				if ( ! is_array( $data['propertyIDs'] ) || count( $data['propertyIDs'] ) > 10 ) {
					return new WP_Error(
						'rest_invalid_param',
						/* translators: %s: List of invalid parameters. */
						sprintf( __( 'Invalid parameter(s): %s', 'google-site-kit' ), 'propertyIDs' ),
						array( 'status' => 400 )
					);
				}

				/* @var Google_Service_GoogleAnalyticsAdmin $analyticsadmin phpcs:ignore Squiz.PHP.CommentedOutCode.Found */
				$analyticsadmin = $this->get_service( 'analyticsadmin' );
				$batch_request  = $analyticsadmin->createBatch();

				foreach ( $data['propertyIDs'] as $property_id ) {
					$batch_request->add(
						$analyticsadmin
							->properties_dataStreams // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
							->listPropertiesDataStreams(
								self::normalize_property_id( $property_id )
							)
					);
				}

				return function() use ( $batch_request ) {
					return $batch_request->execute();
				};
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
				return array_map( array( self::class, 'filter_account_with_ids' ), $response->getAccounts() );
			case 'GET:account-summaries':
				return array_map(
					function( $account ) {
						$obj                    = self::filter_account_with_ids( $account, 'account' );
						$obj->propertySummaries = array_map( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
							function( $property ) {
								return self::filter_property_with_ids( $property, 'property' );
							},
							$account->getPropertySummaries()
						);

						return $obj;
					},
					$response->getAccountSummaries()
				);
			case 'POST:create-property':
				return self::filter_property_with_ids( $response );
			case 'POST:create-webdatastream':
				return self::filter_webdatastream_with_ids( $response );
			case 'GET:properties':
				return array_map( array( self::class, 'filter_property_with_ids' ), $response->getProperties() );
			case 'GET:property':
				return self::filter_property_with_ids( $response );
			case 'GET:webdatastreams':
				/* @var GoogleAnalyticsAdminV1alphaListDataStreamsResponse $response phpcs:ignore Squiz.PHP.CommentedOutCode.Found */
				$webdatastreams = self::filter_web_datastreams( $response->getDataStreams() );
				return array_map( array( self::class, 'filter_webdatastream_with_ids' ), $webdatastreams );
			case 'GET:webdatastreams-batch':
				return self::parse_webdatastreams_batch( $response );
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
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Analytics 4 (Alpha)', 'Service name', 'google-site-kit' ),
			'description' => __( 'Get a deeper understanding of your customers. Google Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ),
			'order'       => 3,
			'homepage'    => __( 'https://analytics.google.com/analytics/web', 'google-site-kit' ),
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

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.31.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-analytics-4',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-analytics-4.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-forms',
					),
				)
			),
		);
	}

	/**
	 * Registers the Analytics 4 tag.
	 *
	 * @since 1.31.0
	 */
	private function register_tag() {
		if ( $this->context->is_amp() ) {
			return;
		}

		$settings = $this->get_settings()->get();
		$tag      = new Web_Tag( $settings['measurementID'], self::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new Tag_Guard( $this->get_settings() ) );
		$tag->use_guard( new Tag_Production_Guard() );

		if ( $tag->can_register() ) {
			// Here we need to retrieve the ads conversion ID from the
			// classic/UA Analytics settings as it does not exist yet for this module.
			// TODO: Update the value to be sourced from GA4 module settings once decoupled.
			$ua_settings = ( new Analytics_Settings( $this->options ) )->get();
			$tag->set_ads_conversion_id( $ua_settings['adsConversionID'] );

			$tag->register();
		}
	}

	/**
	 * Parses account ID, adds it to the model object and returns updated model.
	 *
	 * @since 1.31.0
	 *
	 * @param Google_Model $account Account model.
	 * @param string       $id_key   Attribute name that contains account id.
	 * @return stdClass Updated model with _id attribute.
	 */
	public static function filter_account_with_ids( $account, $id_key = 'name' ) {
		$obj = $account->toSimpleObject();

		$matches = array();
		if ( preg_match( '#accounts/([^/]+)#', $account[ $id_key ], $matches ) ) {
			$obj->_id = $matches[1];
		}

		return $obj;
	}

	/**
	 * Parses account and property IDs, adds it to the model object and returns updated model.
	 *
	 * @since 1.31.0
	 *
	 * @param Google_Model $property Property model.
	 * @param string       $id_key   Attribute name that contains property id.
	 * @return stdClass Updated model with _id and _accountID attributes.
	 */
	public static function filter_property_with_ids( $property, $id_key = 'name' ) {
		$obj = $property->toSimpleObject();

		$matches = array();
		if ( preg_match( '#properties/([^/]+)#', $property[ $id_key ], $matches ) ) {
			$obj->_id = $matches[1];
		}

		$matches = array();
		if ( preg_match( '#accounts/([^/]+)#', $property['parent'], $matches ) ) {
			$obj->_accountID = $matches[1]; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		return $obj;
	}

	/**
	 * Parses property and web datastream IDs, adds it to the model object and returns updated model.
	 *
	 * @since 1.31.0
	 *
	 * @param Google_Model $webdatastream Web datastream model.
	 * @return stdClass Updated model with _id and _propertyID attributes.
	 */
	public static function filter_webdatastream_with_ids( $webdatastream ) {
		$obj = $webdatastream->toSimpleObject();

		$matches = array();
		if ( preg_match( '#properties/([^/]+)/dataStreams/([^/]+)#', $webdatastream['name'], $matches ) ) {
			$obj->_id         = $matches[2];
			$obj->_propertyID = $matches[1]; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		return $obj;
	}

	/**
	 * Filters a list of data stream objects and returns only web data streams.
	 *
	 * @since 1.49.1
	 *
	 * @param GoogleAnalyticsAdminV1alphaDataStream[] $datastreams Data streams to filter.
	 * @return GoogleAnalyticsAdminV1alphaDataStream[] Web data streams.
	 */
	public static function filter_web_datastreams( array $datastreams ) {
		return array_filter(
			$datastreams,
			function ( GoogleAnalyticsAdminV1alphaDataStream $datastream ) {
				return $datastream->getType() === 'WEB_DATA_STREAM';
			}
		);
	}

	/**
	 * Parses a response, adding the _id and _propertyID params and converting to an array keyed by the propertyID and web datastream IDs.
	 *
	 * @since 1.39.0
	 *
	 * @param GoogleAnalyticsAdminV1alphaListDataStreamsResponse[] $batch_response Array of GoogleAnalyticsAdminV1alphaListWebDataStreamsResponse objects.
	 * @return stdClass[] Array of models containing _id and _propertyID attributes, keyed by the propertyID.
	 */
	public static function parse_webdatastreams_batch( $batch_response ) {
		$mapped = array();

		foreach ( $batch_response as $response ) {
			$webdatastreams = self::filter_web_datastreams( $response->getDataStreams() );

			foreach ( $webdatastreams as $webdatastream ) {
				$value            = self::filter_webdatastream_with_ids( $webdatastream );
				$key              = $value->_propertyID; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$mapped[ $key ]   = isset( $mapped[ $key ] ) ? $mapped[ $key ] : array();
				$mapped[ $key ][] = $value;
			}
		}

		return $mapped;
	}

	/**
	 * Normalizes account ID and returns it.
	 *
	 * @since 1.31.0
	 *
	 * @param string $account_id Account ID.
	 * @return string Updated account ID with "accounts/" prefix.
	 */
	public static function normalize_account_id( $account_id ) {
		return 'accounts/' . $account_id;
	}

	/**
	 * Normalizes property ID and returns it.
	 *
	 * @since 1.31.0
	 *
	 * @param string $property_id Property ID.
	 * @return string Updated property ID with "properties/" prefix.
	 */
	public static function normalize_property_id( $property_id ) {
		return 'properties/' . $property_id;
	}

}
