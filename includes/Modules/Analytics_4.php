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
use Google\Site_Kit\Core\Modules\Module_With_Data_Available_State;
use Google\Site_Kit\Core\Modules\Module_With_Data_Available_State_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\Sort;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Dimensions_Exception;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Metrics_Exception;
use Google\Site_Kit\Modules\Analytics\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Tag_Guard;
use Google\Site_Kit\Modules\Analytics_4\Web_Tag;
use Google\Site_Kit_Dependencies\Google\Model as Google_Model;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData as Google_Service_AnalyticsData;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DateRange as Google_Service_AnalyticsData_DateRange;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Dimension as Google_Service_AnalyticsData_Dimension;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionOrderBy as Google_Service_AnalyticsData_DimensionOrderBy;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Filter as Google_Service_AnalyticsData_Filter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpression as Google_Service_AnalyticsData_FilterExpression;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\FilterExpressionList as Google_Service_AnalyticsData_FilterExpressionList;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\InListFilter as Google_Service_AnalyticsData_InListFilter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricOrderBy as Google_Service_AnalyticsData_MetricOrderBy;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\OrderBy as Google_Service_AnalyticsData_OrderBy;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportRequest as Google_Service_AnalyticsData_RunReportRequest;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\StringFilter as Google_Service_AnalyticsData_StringFilter;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Metric as Google_Service_AnalyticsData_Metric;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStream;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStreamWebStreamData;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListDataStreamsResponse;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty as Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaProperty;
use Google\Site_Kit_Dependencies\Google\Service\TagManager as Google_Service_TagManager;
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
	implements Module_With_Scopes, Module_With_Settings, Module_With_Debug_Fields, Module_With_Owner, Module_With_Assets, Module_With_Service_Entity, Module_With_Deactivation, Module_With_Data_Available_State {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;
	use Module_With_Data_Available_State_Trait;

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

		// Ensure that the data available state is reset when the measurement ID changes.
		add_action(
			'update_option_googlesitekit_analytics-4_settings',
			function( $old_value, $new_value ) {
				if ( $old_value['measurementID'] !== $new_value['measurementID'] ) {
					$this->reset_data_available();
				}
			},
			10,
			2
		);
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.30.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		$scopes = array(
			Analytics::READONLY_SCOPE,
		);
		if ( Feature_Flags::enabled( 'gteSupport' ) ) {
			$scopes[] = 'https://www.googleapis.com/auth/tagmanager.readonly';
		}
		return $scopes;
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
		$this->reset_data_available();
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
		$datapoints = array(
			'GET:account-summaries'      => array( 'service' => 'analyticsadmin' ),
			'GET:accounts'               => array( 'service' => 'analyticsadmin' ),
			'GET:container-lookup'       => array( 'service' => 'tagmanager' ),
			'GET:container-destinations' => array( 'service' => 'tagmanager' ),
			'GET:google-tag-settings'    => array( 'service' => 'tagmanager' ),
			'POST:create-property'       => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( Analytics::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics 4 property on your behalf.', 'google-site-kit' ),
			),
			'POST:create-webdatastream'  => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( Analytics::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics 4 Measurement ID for this site on your behalf.', 'google-site-kit' ),
			),
			'GET:properties'             => array( 'service' => 'analyticsadmin' ),
			'GET:property'               => array( 'service' => 'analyticsadmin' ),
			'GET:webdatastreams'         => array( 'service' => 'analyticsadmin' ),
			'GET:webdatastreams-batch'   => array( 'service' => 'analyticsadmin' ),
			'GET:conversion-events'      => array( 'service' => 'analyticsadmin' ),
		);

		if ( Feature_Flags::enabled( 'ga4Reporting' ) ) {
			$datapoints['GET:report'] = array(
				'service'   => 'analyticsdata',
				'shareable' => Feature_Flags::enabled( 'dashboardSharing' ),
			);
		}

		return $datapoints;
	}

	/**
	 * Creates a new property for provided account.
	 *
	 * @since 1.35.0
	 *
	 * @param string $account_id Account ID.
	 * @return Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaProperty A new property.
	 */
	private function create_property( $account_id ) {
		$timezone = get_option( 'timezone_string' );
		if ( empty( $timezone ) ) {
			$timezone = 'UTC';
		}

		$property = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaProperty();
		$property->setParent( self::normalize_account_id( $account_id ) );
		$property->setDisplayName( URL::parse( $this->context->get_reference_site_url(), PHP_URL_HOST ) );
		$property->setTimeZone( $timezone );

		return $this->get_service( 'analyticsadmin' )->properties->create( $property );
	}

	/**
	 * Creates a new web data stream for provided property.
	 *
	 * @since 1.35.0
	 *
	 * @param string $property_id Property ID.
	 * @return GoogleAnalyticsAdminV1betaDataStream A new web data stream.
	 */
	private function create_webdatastream( $property_id ) {
		$site_url = $this->context->get_reference_site_url();
		$data     = new GoogleAnalyticsAdminV1betaDataStreamWebStreamData();
		$data->setDefaultUri( $site_url );

		$datastream = new GoogleAnalyticsAdminV1betaDataStream();
		$datastream->setDisplayName( URL::parse( $site_url, PHP_URL_HOST ) );
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
		$tag_id = $this->get_tag_id();
		if ( empty( $tag_id ) ) {
			return;
		}
		BC_Functions::wp_print_inline_script_tag( sprintf( 'window["ga-disable-%s"] = true;', esc_attr( $tag_id ) ) );
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

			$measurement_id = $web_datastream->webStreamData->measurementId; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

			$this->get_settings()->merge(
				array(
					'webDataStreamID' => $web_datastream->_id,
					'measurementID'   => $measurement_id,
				)
			);

			if ( Feature_Flags::enabled( 'gteSupport' ) ) {
				$container           = $this->get_tagmanager_service()->accounts_containers->lookup( array( 'destinationId' => $measurement_id ) );
				$google_tag_settings = $this->get_google_tag_settings_for_measurement_id( $container, $measurement_id );
				$this->get_settings()->merge( $google_tag_settings );
			}
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
			case 'GET:report':
				return $this->create_report_request( $data );
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
			case 'GET:container-lookup':
				if ( ! isset( $data['destinationID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'destinationID' ),
						array( 'status' => 400 )
					);
				}

				return $this->get_tagmanager_service()->accounts_containers->lookup( array( 'destinationId' => $data['destinationID'] ) );
			case 'GET:container-destinations':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				if ( ! isset( $data['internalContainerID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'internalContainerID' ),
						array( 'status' => 400 )
					);
				}

				return $this->get_tagmanager_service()->accounts_containers_destinations->listAccountsContainersDestinations(
					"accounts/{$data['accountID']}/containers/{$data['internalContainerID']}"
				);
			case 'GET:google-tag-settings':
				if ( ! isset( $data['measurementID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'measurementID' ),
						array( 'status' => 400 )
					);
				}

				return $this->get_tagmanager_service()->accounts_containers->lookup( array( 'destinationId' => $data['measurementID'] ) );
			case 'GET:conversion-events':
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}

				$analyticsadmin = $this->get_service( 'analyticsadmin' );
				$property_id    = self::normalize_property_id( $data['propertyID'] );

				return $analyticsadmin
					->properties_conversionEvents // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					->listPropertiesConversionEvents( $property_id );
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
				return Sort::case_insensitive_list_sort(
					array_map( array( self::class, 'filter_property_with_ids' ), $response->getProperties() ),
					'displayName'
				);
			case 'GET:property':
				return self::filter_property_with_ids( $response );
			case 'GET:webdatastreams':
				/* @var GoogleAnalyticsAdminV1betaListDataStreamsResponse $response phpcs:ignore Squiz.PHP.CommentedOutCode.Found */
				$webdatastreams = self::filter_web_datastreams( $response->getDataStreams() );
				return array_map( array( self::class, 'filter_webdatastream_with_ids' ), $webdatastreams );
			case 'GET:webdatastreams-batch':
				return self::parse_webdatastreams_batch( $response );
			case 'GET:container-destinations':
				return (array) $response->getDestination();
			case 'GET:google-tag-settings':
				return $this->get_google_tag_settings_for_measurement_id( $response, $data['measurementID'] );
			case 'GET:conversion-events':
				return (array) $response->getConversionEvents();
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Gets the configured TagManager service instance.
	 *
	 * @since 1.92.0
	 *
	 * @return Google_Service_TagManager instance.
	 * @throws Exception Thrown if the module did not correctly set up the service.
	 */
	private function get_tagmanager_service() {
		return $this->get_service( 'tagmanager' );
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
			'name'        => _x( 'Analytics 4', 'Service name', 'google-site-kit' ),
			'description' => __( 'Get a deeper understanding of your customers. Google Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ),
			'order'       => 3,
			'homepage'    => __( 'https://analytics.google.com/analytics/web', 'google-site-kit' ),
			'internal'    => true,
			'depends_on'  => array( 'analytics' ),
		);
	}


	/**
	 * Gets the configured Analytics Data service object instance.
	 *
	 * @since 1.93.0
	 *
	 * @return Google_Service_AnalyticsData The Analytics Data API service.
	 */
	protected function get_analyticsdata_service() {
		return $this->get_service( 'analyticsdata' );
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
			'analyticsdata'  => new Google_Service_AnalyticsData( $client ),
			'tagmanager'     => new Google_Service_TagManager( $client ),
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
						'googlesitekit-components',
						'googlesitekit-modules-data',
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

		$tag = new Web_Tag( $this->get_tag_id(), self::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new Tag_Guard( $this->get_settings() ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

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
	 * @param GoogleAnalyticsAdminV1betaDataStream[] $datastreams Data streams to filter.
	 * @return GoogleAnalyticsAdminV1betaDataStream[] Web data streams.
	 */
	public static function filter_web_datastreams( array $datastreams ) {
		return array_filter(
			$datastreams,
			function ( GoogleAnalyticsAdminV1betaDataStream $datastream ) {
				return $datastream->getType() === 'WEB_DATA_STREAM';
			}
		);
	}

	/**
	 * Parses a response, adding the _id and _propertyID params and converting to an array keyed by the propertyID and web datastream IDs.
	 *
	 * @since 1.39.0
	 *
	 * @param GoogleAnalyticsAdminV1betaListDataStreamsResponse[] $batch_response Array of GoogleAnalyticsAdminV1betaListWebDataStreamsResponse objects.
	 * @return stdClass[] Array of models containing _id and _propertyID attributes, keyed by the propertyID.
	 */
	public static function parse_webdatastreams_batch( $batch_response ) {
		$mapped = array();

		foreach ( $batch_response as $response ) {
			if ( $response instanceof Exception ) {
				continue;
			}

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

	/**
	 * Checks if the current user has access to the current configured service entity.
	 *
	 * @since 1.70.0
	 *
	 * @return boolean|WP_Error
	 */
	public function check_service_entity_access() {
		/* @var Google_Service_GoogleAnalyticsAdmin $analyticsadmin phpcs:ignore Squiz.PHP.CommentedOutCode.Found */
		$analyticsadmin = $this->get_service( 'analyticsadmin' );
		$settings       = $this->settings->get();

		try {
			$analyticsadmin
			->properties_dataStreams // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->listPropertiesDataStreams(
				self::normalize_property_id( $settings['propertyID'] )
			);
		} catch ( Exception $e ) {
			if ( $e->getCode() === 403 ) {
				return false;
			}
			return $this->exception_to_error( $e );
		}

		return true;
	}

	/**
	 * Gets the Google Tag Settings for the given measurement ID.
	 *
	 * @since 1.94.0
	 *
	 * @param Google_Service_TagManager_Container $container Tag Manager container.
	 * @param string                              $measurement_id Measurement ID.
	 * @return array Google Tag Settings.
	 */
	protected function get_google_tag_settings_for_measurement_id( $container, $measurement_id ) {
		return array(
			'googleTagAccountID'   => $container->getAccountId(),
			'googleTagContainerID' => $container->getContainerId(),
			'googleTagID'          => $this->determine_google_tag_id_from_tag_ids( $container->getTagIds(), $measurement_id ),
		);
	}

	/**
	 * Determines Google Tag ID from the given Tag IDs.
	 *
	 * @since 1.94.0
	 *
	 * @param array  $tag_ids Tag IDs.
	 * @param string $measurement_id Measurement ID.
	 * @return string Google Tag ID.
	 */
	private function determine_google_tag_id_from_tag_ids( $tag_ids, $measurement_id ) {
		// If there is only one tag id in the array, return it.
		if ( count( $tag_ids ) === 1 ) {
			return $tag_ids[0];
		}

		// If there are multiple tags, return the first one that starts with `GT-`.
		foreach ( $tag_ids as $tag_id ) {
			if ( substr( $tag_id, 0, 3 ) === 'GT-' ) { // strlen( 'GT-' ) === 3.
				return $tag_id;
			}
		}

		// Otherwise, return the `$measurement_id` if it is in the array.
		if ( in_array( $measurement_id, $tag_ids, true ) ) {
			return $measurement_id;
		}

		// Otherwise, return the first one that starts with `G-`.
		foreach ( $tag_ids as $tag_id ) {
			if ( substr( $tag_id, 0, 2 ) === 'G-' ) { // strlen( 'G-' ) === 2.
				return $tag_id;
			}
		}

		// If none of the above, return the first one.
		return $tag_ids[0];
	}

	/**
	 * Gets the Google Analytics 4 tag ID.
	 *
	 * @since 1.96.0
	 *
	 * @return string Google Analytics 4 tag ID.
	 */
	private function get_tag_id() {
		$settings = $this->get_settings()->get();

		if ( Feature_Flags::enabled( 'gteSupport' ) && ! empty( $settings['googleTagID'] ) ) {
			return $settings['googleTagID'];
		}
		return $settings['measurementID'];
	}

	/**
	 * Creates and executes a new Analytics 4 report request.
	 *
	 * @since 1.93.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|WP_Error Request object on success, or WP_Error on failure.
	 */
	protected function create_report_request( Data_Request $data ) {
		$request_args = array();

		$option = $this->get_settings()->get();

		if ( empty( $data['metrics'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'metrics' ),
				array( 'status' => 400 )
			);
		}

		if ( empty( $option['propertyID'] ) ) {
			return new WP_Error(
				'missing_required_setting',
				__( 'No connected Google Analytics 4 property ID.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		if ( ! empty( $data['url'] ) ) {
			$request_args['page'] = $data['url'];
		}

		if ( ! empty( $data['limit'] ) ) {
			$request_args['row_limit'] = $data['limit'];
		}

		$dimensions = $data['dimensions'];
		if ( ! empty( $dimensions ) && ( is_string( $dimensions ) || is_array( $dimensions ) ) ) {
			if ( is_string( $dimensions ) ) {
				$dimensions = explode( ',', $dimensions );
			} elseif ( is_array( $dimensions ) && ! wp_is_numeric_array( $dimensions ) ) { // If single object is passed.
				$dimensions = array( $dimensions );
			}

			$dimensions = array_filter(
				array_map(
					function ( $dimension_def ) {
						$dimension = new Google_Service_AnalyticsData_Dimension();

						if ( is_string( $dimension_def ) ) {
							$dimension->setName( $dimension_def );
						} elseif ( is_array( $dimension_def ) && ! empty( $dimension_def['name'] ) ) {
							$dimension->setName( $dimension_def['name'] );
						} else {
							return null;
						}

						return $dimension;
					},
					array_filter( $dimensions )
				)
			);

			if ( ! empty( $dimensions ) ) {
				try {
					$this->validate_report_dimensions( $dimensions );
				} catch ( Invalid_Report_Dimensions_Exception $exception ) {
					return new WP_Error(
						'invalid_analytics_4_report_dimensions',
						$exception->getMessage()
					);
				}

				$request_args['dimensions'] = $dimensions;
			}
		}

		$dimension_filters            = $data['dimensionFilters'];
		$dimension_filter_expressions = array();
		if ( ! empty( $dimension_filters ) && is_array( $dimension_filters ) ) {
			foreach ( $dimension_filters as $dimension_name => $dimension_value ) {
				$dimension_filter = new Google_Service_AnalyticsData_Filter();
				$dimension_filter->setFieldName( $dimension_name );
				if ( is_array( $dimension_value ) ) {
					$dimension_in_list_filter = new Google_Service_AnalyticsData_InListFilter();
					$dimension_in_list_filter->setValues( $dimension_value );
					$dimension_filter->setInListFilter( $dimension_in_list_filter );
				} else {
					$dimension_string_filter = new Google_Service_AnalyticsData_StringFilter();
					$dimension_string_filter->setMatchType( 'EXACT' );
					$dimension_string_filter->setValue( $dimension_value );
					$dimension_filter->setStringFilter( $dimension_string_filter );
				}
				$dimension_filter_expression = new Google_Service_AnalyticsData_FilterExpression();
				$dimension_filter_expression->setFilter( $dimension_filter );
				$dimension_filter_expressions[] = $dimension_filter_expression;
			}

			if ( ! empty( $dimension_filter_expressions ) ) {
				$request_args['dimension_filters'] = $dimension_filter_expressions;
			}
		}

		$request = $this->create_analytics_site_data_request( $option['propertyID'], $request_args );

		if ( is_wp_error( $request ) ) {
			return $request;
		}

		$date_ranges = array();
		$start_date  = $data['startDate'];
		$end_date    = $data['endDate'];
		if ( strtotime( $start_date ) && strtotime( $end_date ) ) {
			$compare_start_date = $data['compareStartDate'];
			$compare_end_date   = $data['compareEndDate'];
			$date_ranges[]      = array( $start_date, $end_date );

			// When using multiple date ranges, it changes the structure of the response:
			// Aggregate properties (minimum, maximum, totals) will have an entry per date range.
			// The rows property will have additional row entries for each date range.
			if ( strtotime( $compare_start_date ) && strtotime( $compare_end_date ) ) {
				$date_ranges[] = array( $compare_start_date, $compare_end_date );
			}
		} else {
			// Default the date range to the last 28 days.
			$date_ranges[] = $this->parse_date_range( 'last-28-days', 1 );
		}

		$date_ranges = array_map(
			function ( $date_range ) {
				list ( $start_date, $end_date ) = $date_range;
				$date_range                     = new Google_Service_AnalyticsData_DateRange();
				$date_range->setStartDate( $start_date );
				$date_range->setEndDate( $end_date );

				return $date_range;
			},
			$date_ranges
		);
		$request->setDateRanges( $date_ranges );

		$metrics = $data['metrics'];
		if ( is_string( $metrics ) || is_array( $metrics ) ) {
			if ( is_string( $metrics ) ) {
				$metrics = explode( ',', $data['metrics'] );
			} elseif ( is_array( $metrics ) && ! wp_is_numeric_array( $metrics ) ) { // If single object is passed.
				$metrics = array( $metrics );
			}

			$metrics = array_filter(
				array_map(
					function ( $metric_def ) {
						$metric = new Google_Service_AnalyticsData_Metric();

						if ( is_string( $metric_def ) ) {
							$metric->setName( $metric_def );
						} elseif ( is_array( $metric_def ) && ! empty( $metric_def['name'] ) ) {
							$metric->setName( $metric_def['name'] );
							if ( ! empty( $metric_def['expression'] ) ) {
								$metric->setExpression( $metric_def['expression'] );
							}
						} else {
							return null;
						}

						return $metric;
					},
					array_filter( $metrics )
				)
			);

			if ( ! empty( $metrics ) ) {
				try {
					$this->validate_report_metrics( $metrics );
				} catch ( Invalid_Report_Metrics_Exception $exception ) {
					return new WP_Error(
						'invalid_analytics_4_report_metrics',
						$exception->getMessage()
					);
				}

				$request->setMetrics( $metrics );
			}
		}

		// Order by.
		$orderby = $this->parse_reporting_orderby( $data['orderby'] );
		if ( ! empty( $orderby ) ) {
			$request->setOrderBys( $orderby );
		}

		// Ensure the total, minimum and maximum metric aggregations are included in order to match what is returned by the UA reports. We may wish to make this optional in future.
		$request->setMetricAggregations(
			array(
				'TOTAL',
				'MINIMUM',
				'MAXIMUM',
			)
		);

		return $this->get_analyticsdata_service()->properties->runReport( self::normalize_property_id( $option['propertyID'] ), $request );
	}

	/**
	 * Parses the orderby value of the data request into an array of AnalyticsData OrderBy object instances.
	 *
	 * @since 1.93.0
	 * @since 1.95.0 Updated to provide support for ordering by dimensions.
	 *
	 * @param array|null $orderby Data request orderby value.
	 * @return Google_Service_AnalyticsData_OrderBy[] An array of AnalyticsData OrderBy objects.
	 */
	protected function parse_reporting_orderby( $orderby ) {
		if ( empty( $orderby ) || ! is_array( $orderby ) || ! wp_is_numeric_array( $orderby ) ) {
			return array();
		}

		$results = array_map(
			function ( $order_def ) {
				$order_by = new Google_Service_AnalyticsData_OrderBy();
				$order_by->setDesc( ! empty( $order_def['desc'] ) );

				if ( isset( $order_def['metric'] ) && isset( $order_def['metric']['metricName'] ) ) {
					$metric_order_by = new Google_Service_AnalyticsData_MetricOrderBy();
					$metric_order_by->setMetricName( $order_def['metric']['metricName'] );
					$order_by->setMetric( $metric_order_by );
				} elseif ( isset( $order_def['dimension'] ) && isset( $order_def['dimension']['dimensionName'] ) ) {
					$dimension_order_by = new Google_Service_AnalyticsData_DimensionOrderBy();
					$dimension_order_by->setDimensionName( $order_def['dimension']['dimensionName'] );
					$order_by->setDimension( $dimension_order_by );
				} else {
					return null;
				}

				return $order_by;
			},
			$orderby
		);

		$results = array_filter( $results );
		$results = array_values( $results );

		return $results;
	}

	/**
	 * Creates a new Analytics 4 site request for the current site and given arguments.
	 *
	 * @since 1.93.0
	 *
	 * @param string $property_id Analytics 4 property ID.
	 * @param array  $args {
	 *     Optional. Additional arguments.
	 *
	 *     @type array                                           $dimensions        List of request dimensions. Default empty array.
	 *     @type Google_Service_AnalyticsData_FilterExpression[] $dimension_filters List of dimension filter instances for the specified request dimensions. Default empty array.
	 *     @type string                                          $start_date        Start date in 'Y-m-d' format. Default empty string.
	 *     @type string                                          $end_date          End date in 'Y-m-d' format. Default empty string.
	 *     @type string                                          $page              Specific page URL to filter by. Default empty string.
	 *     @type int                                             $row_limit         Limit of rows to return. Default empty string.
	 * }
	 * @return Google_Service_AnalyticsData_RunReportRequest|WP_Error Analytics 4 site request instance.
	 */
	protected function create_analytics_site_data_request( $property_id, array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions'        => array(),
				'dimension_filters' => array(),
				'start_date'        => '',
				'end_date'          => '',
				'page'              => '',
				'row_limit'         => '',
			)
		);

		$request = new Google_Service_AnalyticsData_RunReportRequest();
		$request->setProperty( self::normalize_property_id( $property_id ) );

		$request->setKeepEmptyRows( true );

		if ( ! empty( $args['dimensions'] ) ) {
			$request->setDimensions( (array) $args['dimensions'] );
		}

		if ( ! empty( $args['start_date'] ) && ! empty( $args['end_date'] ) ) {
			$date_range = new Google_Service_AnalyticsData_DateRange();
			$date_range->setStartDate( $args['start_date'] );
			$date_range->setEndDate( $args['end_date'] );
			$request->setDateRanges( array( $date_range ) );
		}

		$dimension_filter_expressions = array();

		$hostnames = $this->permute_site_hosts( URL::parse( $this->context->get_reference_site_url(), PHP_URL_HOST ) );

		$dimension_in_list_filter = new Google_Service_AnalyticsData_InListFilter();
		$dimension_in_list_filter->setValues( $hostnames );
		$dimension_filter = new Google_Service_AnalyticsData_Filter();
		$dimension_filter->setFieldName( 'hostName' );
		$dimension_filter->setInListFilter( $dimension_in_list_filter );
		$dimension_filter_expression = new Google_Service_AnalyticsData_FilterExpression();
		$dimension_filter_expression->setFilter( $dimension_filter );
		$dimension_filter_expressions[] = $dimension_filter_expression;

		if ( ! empty( $args['dimension_filters'] ) ) {
			$dimension_filter_expressions = array_merge( $dimension_filter_expressions, $args['dimension_filters'] );
		}

		if ( ! empty( $args['page'] ) ) {
			$args['page']            = str_replace( trim( $this->context->get_reference_site_url(), '/' ), '', esc_url_raw( $args['page'] ) );
			$dimension_string_filter = new Google_Service_AnalyticsData_StringFilter();
			$dimension_string_filter->setMatchType( 'EXACT' );
			$dimension_string_filter->setValue( rawurldecode( $args['page'] ) );
			$dimension_filter = new Google_Service_AnalyticsData_Filter();
			$dimension_filter->setFieldName( 'pagePath' );
			$dimension_filter->setStringFilter( $dimension_string_filter );
			$dimension_filter_expression = new Google_Service_AnalyticsData_FilterExpression();
			$dimension_filter_expression->setFilter( $dimension_filter );
			$dimension_filter_expressions[] = $dimension_filter_expression;
		}

		$dimension_filter_expression_list = new Google_Service_AnalyticsData_FilterExpressionList();
		$dimension_filter_expression_list->setExpressions( $dimension_filter_expressions );
		$dimension_filter_expression = new Google_Service_AnalyticsData_FilterExpression();
		$dimension_filter_expression->setAndGroup( $dimension_filter_expression_list );
		$request->setDimensionFilter( $dimension_filter_expression );

		if ( ! empty( $args['row_limit'] ) ) {
			$request->setLimit( $args['row_limit'] );
		}

		return $request;
	}

	/**
	 * Validates the report metrics.
	 *
	 * @since 1.93.0
	 *
	 * @param Google_Service_AnalyticsData_Metric[] $metrics The metrics to validate.
	 * @throws Invalid_Report_Metrics_Exception Thrown if the metrics are invalid.
	 */
	protected function validate_report_metrics( $metrics ) {
		if ( false === $this->is_using_shared_credentials ) {
			return;
		}

		$valid_metrics = apply_filters(
			'googlesitekit_shareable_analytics_4_metrics',
			array(
				// TODO: Add metrics to this allow-list as they are used in the plugin.
			)
		);

		$invalid_metrics = array_diff(
			array_map(
				function ( $metric ) {
					// If there is an expression, it means the name is there as an alias, otherwise the name should be a valid metric name.
					// Therefore, the expression takes precedence to the name for the purpose of allow-list validation.
					return ! empty( $metric->getExpression() ) ? $metric->getExpression() : $metric->getName();
				},
				$metrics
			),
			$valid_metrics
		);

		if ( count( $invalid_metrics ) > 0 ) {
			$message = count( $invalid_metrics ) > 1 ? sprintf(
				/* translators: %s: is replaced with a comma separated list of the invalid metrics. */
				__(
					'Unsupported metrics requested: %s',
					'google-site-kit'
				),
				join(
					/* translators: used between list items, there is a space after the comma. */
					__( ', ', 'google-site-kit' ),
					$invalid_metrics
				)
			) : sprintf(
				/* translators: %s: is replaced with the invalid metric. */
				__(
					'Unsupported metric requested: %s',
					'google-site-kit'
				),
				$invalid_metrics
			);

			throw new Invalid_Report_Metrics_Exception( $message );
		}
	}

	/**
	 * Validates the report dimensions.
	 *
	 * @since 1.93.0
	 *
	 * @param Google_Service_AnalyticsData_Dimension[] $dimensions The dimensions to validate.
	 * @throws Invalid_Report_Dimensions_Exception Thrown if the dimensions are invalid.
	 */
	protected function validate_report_dimensions( $dimensions ) {
		if ( false === $this->is_using_shared_credentials ) {
			return;
		}

		$valid_dimensions = apply_filters(
			'googlesitekit_shareable_analytics_4_dimensions',
			array(
				// TODO: Add dimensions to this allow-list as they are used in the plugin.
			)
		);

		$invalid_dimensions = array_diff(
			array_map(
				function ( $dimension ) {
					return $dimension->getName();
				},
				$dimensions
			),
			$valid_dimensions
		);

		if ( count( $invalid_dimensions ) > 0 ) {
			$message = count( $invalid_dimensions ) > 1 ? sprintf(
				/* translators: %s: is replaced with a comma separated list of the invalid dimensions. */
				__(
					'Unsupported dimensions requested: %s',
					'google-site-kit'
				),
				join(
					/* translators: used between list items, there is a space after the comma. */
					__( ', ', 'google-site-kit' ),
					$invalid_dimensions
				)
			) : sprintf(
				/* translators: %s: is replaced with the invalid dimension. */
				__(
					'Unsupported dimension requested: %s',
					'google-site-kit'
				),
				$invalid_dimensions
			);

			throw new Invalid_Report_Dimensions_Exception( $message );
		}
	}
}
