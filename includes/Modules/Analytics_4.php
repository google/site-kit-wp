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
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\Sort;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Analytics\Account_Ticket;
use Google\Site_Kit\Modules\Analytics\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\AMP_Tag;
use Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin\AccountProvisioningService;
use Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin\Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest;
use Google\Site_Kit\Modules\Analytics_4\Report\Request as Analytics_4_Report_Request;
use Google\Site_Kit\Modules\Analytics_4\Report\Response as Analytics_4_Report_Response;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Tag_Guard;
use Google\Site_Kit\Modules\Analytics_4\Web_Tag;
use Google\Site_Kit_Dependencies\Google\Model as Google_Model;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData as Google_Service_AnalyticsData;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaAccount;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStream;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStreamWebStreamData;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListDataStreamsResponse;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty as Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaProperty;
use Google\Site_Kit_Dependencies\Google\Service\TagManager as Google_Service_TagManager;
use Google\Site_Kit_Dependencies\Google_Service_TagManager_Container;
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

	const DASHBOARD_VIEW = 'google-analytics-4';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.30.0
	 * @since 1.101.0 Added a filter hook to add the required `https://www.googleapis.com/auth/tagmanager.readonly` scope for GTE support.
	 */
	public function register() {
		$this->register_scopes_hook();

		add_action(
			'googlesitekit_analytics_handle_provisioning_callback',
			$this->get_method_proxy( 'handle_provisioning_callback' ),
			10,
			2
		);
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

		if ( Feature_Flags::enabled( 'ga4Reporting' ) ) {
			// Replicate Analytics settings for Analytics-4 if not set.
			add_filter(
				'option_' . Module_Sharing_Settings::OPTION,
				$this->get_method_proxy( 'replicate_analytics_sharing_settings' )
			);
		}

		if ( Feature_Flags::enabled( 'gteSupport' ) ) {
			add_filter(
				'googlesitekit_auth_scopes',
				function( array $scopes ) {
					$oauth_client = $this->authentication->get_oauth_client();

					$needs_tagmanager_scope = false;

					if ( $oauth_client->has_sufficient_scopes(
						array(
							Analytics::READONLY_SCOPE,
							'https://www.googleapis.com/auth/tagmanager.readonly',
						)
					) ) {
						$needs_tagmanager_scope = true;
					} else {
						// Ensure the Tag Manager scope is not added as a required scope in the case where the user has
						// granted the Analytics scope but not the Tag Manager scope, in order to allow the GTE-specific
						// Unsatisfied Scopes notification to be displayed without the Additional Permissions Required
						// modal also appearing.
						if ( ! $oauth_client->has_sufficient_scopes(
							array(
								Analytics::READONLY_SCOPE,
							)
						) ) {
							$needs_tagmanager_scope = true;
						}
					}

					if ( $needs_tagmanager_scope ) {
						$scopes[] = 'https://www.googleapis.com/auth/tagmanager.readonly';
					}

					return $scopes;
				}
			);
		}

		add_filter( 'googlesitekit_allow_tracking_disabled', $this->get_method_proxy( 'filter_analytics_allow_tracking_disabled' ) );
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.30.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array( Analytics::READONLY_SCOPE );
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
		// GA4 is only shareable if ga4Reporting is also enabled.
		$shareable = Feature_Flags::enabled( 'dashboardSharing' ) && Feature_Flags::enabled( 'ga4Reporting' );
		if ( $shareable ) {
			// The dashboard view setting is stored in the UA/original Analytics
			// module, so fetch its settings to get the current dashboard view.
			$analytics_settings = ( new Analytics_Settings( $this->options ) )->get();
			$shareable          = self::DASHBOARD_VIEW === $analytics_settings['dashboardView'];
		}

		$datapoints = array(
			'GET:account-summaries'      => array( 'service' => 'analyticsadmin' ),
			'GET:accounts'               => array( 'service' => 'analyticsadmin' ),
			'GET:container-lookup'       => array(
				'service' => 'tagmanager',
				'scopes'  => array(
					'https://www.googleapis.com/auth/tagmanager.readonly',
				),
			),
			'GET:container-destinations' => array(
				'service' => 'tagmanager',
				'scopes'  => array(
					'https://www.googleapis.com/auth/tagmanager.readonly',
				),
			),
			'GET:conversion-events'      => array(
				'service'   => 'analyticsadmin',
				'shareable' => $shareable,
			),
			'POST:create-account-ticket' => array(
				'service'                => 'analyticsprovisioning',
				'scopes'                 => array( Analytics::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics account on your behalf.', 'google-site-kit' ),
			),
			'GET:google-tag-settings'    => array(
				'service' => 'tagmanager',
				'scopes'  => array(
					'https://www.googleapis.com/auth/tagmanager.readonly',
				),
			),
			'POST:create-property'       => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( Analytics::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics 4 property on your behalf.', 'google-site-kit' ),
			),
			'POST:create-webdatastream'  => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( Analytics::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics 4 web data stream for this site on your behalf.', 'google-site-kit' ),
			),
			'GET:properties'             => array( 'service' => 'analyticsadmin' ),
			'GET:property'               => array( 'service' => 'analyticsadmin' ),
			'GET:webdatastreams'         => array( 'service' => 'analyticsadmin' ),
			'GET:webdatastreams-batch'   => array( 'service' => 'analyticsadmin' ),
		);

		if ( Feature_Flags::enabled( 'ga4Reporting' ) ) {
			$datapoints['GET:report'] = array(
				'service'   => 'analyticsdata',
				'shareable' => $shareable,
			);
		}

		return $datapoints;
	}

	/**
	 * Creates a new property for provided account.
	 *
	 * @since 1.35.0
	 * @since 1.98.0 Added `$options` parameter.
	 *
	 * @param string $account_id Account ID.
	 * @param array  $options {
	 *     Property options.
	 *
	 *     @type string $displayName Display name.
	 *     @type string $timezone    Timezone.
	 * }
	 * @return Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaProperty A new property.
	 */
	private function create_property( $account_id, $options = array() ) {
		if ( ! empty( $options['displayName'] ) ) {
			$display_name = sanitize_text_field( $options['displayName'] );
		} else {
			$display_name = URL::parse( $this->context->get_reference_site_url(), PHP_URL_HOST );
		}

		if ( ! empty( $options['timezone'] ) ) {
			$timezone = $options['timezone'];
		} else {
			$timezone = get_option( 'timezone_string' ) ?: 'UTC';
		}

		$property = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaProperty();
		$property->setParent( self::normalize_account_id( $account_id ) );
		$property->setDisplayName( $display_name );
		$property->setTimeZone( $timezone );

		return $this->get_service( 'analyticsadmin' )->properties->create( $property );
	}

	/**
	 * Creates a new web data stream for provided property.
	 *
	 * @since 1.35.0
	 * @since 1.98.0 Added `$options` parameter.
	 *
	 * @param string $property_id Property ID.
	 * @param array  $options {
	 *     Web data stream options.
	 *
	 *     @type string $displayName Display name.
	 * }
	 * @return GoogleAnalyticsAdminV1betaDataStream A new web data stream.
	 */
	private function create_webdatastream( $property_id, $options = array() ) {
		$site_url = $this->context->get_reference_site_url();

		if ( ! empty( $options['displayName'] ) ) {
			$display_name = sanitize_text_field( $options['displayName'] );
		} else {
			$display_name = URL::parse( $site_url, PHP_URL_HOST );
		}

		$data = new GoogleAnalyticsAdminV1betaDataStreamWebStreamData();
		$data->setDefaultUri( $site_url );

		$datastream = new GoogleAnalyticsAdminV1betaDataStream();
		$datastream->setDisplayName( $display_name );
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
	 * @since 1.98.0 Added $account_ticket.
	 *
	 * @param string         $account_id     Account ID.
	 * @param Account_Ticket $account_ticket Account ticket instance.
	 */
	private function handle_provisioning_callback( $account_id, $account_ticket ) {
		// Reset the current GA4 settings.
		$this->get_settings()->merge(
			array(
				'propertyID'      => '',
				'webDataStreamID' => '',
				'measurementID'   => '',
			)
		);

		$property = $this->create_property(
			$account_id,
			array(
				'displayName' => $account_ticket->get_property_name(),
				'timezone'    => $account_ticket->get_timezone(),
			)
		);
		$property = self::filter_property_with_ids( $property );

		if ( empty( $property->_id ) ) {
			return;
		}

		$this->get_settings()->merge( array( 'propertyID' => $property->_id ) );

		$web_datastream = $this->create_webdatastream(
			$property->_id,
			array(
				'displayName' => $account_ticket->get_data_stream_name(),
			)
		);
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

		$this->sync_google_tag_settings();
	}

	/**
	 * Syncs Google tag settings for the currently configured measurementID.
	 *
	 * @since 1.102.0
	 */
	protected function sync_google_tag_settings() {
		if ( ! Feature_Flags::enabled( 'gteSupport' ) ) {
			return;
		}

		$settings       = $this->get_settings();
		$measurement_id = $settings->get()['measurementID'];

		if ( ! $measurement_id ) {
			return;
		}

		$google_tag_settings = $this->get_data( 'google-tag-settings', array( 'measurementID' => $measurement_id ) );

		if ( is_wp_error( $google_tag_settings ) ) {
			return;
		}

		$settings->merge( $google_tag_settings );
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
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing or empty.
	 * phpcs:ignore Squiz.Commenting.FunctionCommentThrowTag.WrongNumber
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:accounts':
				return $this->get_service( 'analyticsadmin' )->accounts->listAccounts();
			case 'GET:account-summaries':
				return $this->get_service( 'analyticsadmin' )->accountSummaries->listAccountSummaries( array( 'pageSize' => 200 ) );
			case 'POST:create-account-ticket':
				if ( empty( $data['displayName'] ) ) {
					throw new Missing_Required_Param_Exception( 'displayName' );
				}
				if ( empty( $data['regionCode'] ) ) {
					throw new Missing_Required_Param_Exception( 'regionCode' );
				}
				if ( empty( $data['propertyName'] ) ) {
					throw new Missing_Required_Param_Exception( 'propertyName' );
				}
				if ( empty( $data['dataStreamName'] ) ) {
					throw new Missing_Required_Param_Exception( 'dataStreamName' );
				}
				if ( empty( $data['timezone'] ) ) {
					throw new Missing_Required_Param_Exception( 'timezone' );
				}

				$account = new GoogleAnalyticsAdminV1betaAccount();
				$account->setDisplayName( $data['displayName'] );
				$account->setRegionCode( $data['regionCode'] );

				$credentials            = $this->authentication->credentials()->get();
				$account_ticket_request = new Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest();
				$account_ticket_request->setSiteId( $credentials['oauth2_client_id'] );
				$account_ticket_request->setSiteSecret( $credentials['oauth2_client_secret'] );
				$account_ticket_request->setRedirectUri( $this->get_provisioning_redirect_uri() );
				$account_ticket_request->setAccount( $account );

				return $this->get_service( 'analyticsprovisioning' )
					->accounts->provisionAccountTicket( $account_ticket_request );
			case 'POST:create-property':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}

				$options = array(
					'displayName' => $data['displayName'],
					'timezone'    => $data['timezone'],
				);

				return $this->create_property( $data['accountID'], $options );
			case 'POST:create-webdatastream':
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}

				$options = array(
					'displayName' => $data['displayName'],
				);

				return $this->create_webdatastream( $data['propertyID'], $options );
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
				if ( empty( $data['metrics'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'metrics' ),
						array( 'status' => 400 )
					);
				}

				$settings = $this->get_settings()->get();
				if ( empty( $settings['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_setting',
						__( 'No connected Google Analytics 4 property ID.', 'google-site-kit' ),
						array( 'status' => 500 )
					);
				}

				$report  = new Analytics_4_Report_Request( $this->context );
				$request = $report->create_request( $data, $this->is_shared_data_request( $data ) );
				if ( is_wp_error( $request ) ) {
					return $request;
				}

				$property_id = self::normalize_property_id( $settings['propertyID'] );
				$request->setProperty( $property_id );

				return $this->get_analyticsdata_service()->properties->runReport( $property_id, $request );
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
				if ( ! isset( $data['containerID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'containerID' ),
						array( 'status' => 400 )
					);
				}

				return $this->get_tagmanager_service()->accounts_containers_destinations->listAccountsContainersDestinations(
					"accounts/{$data['accountID']}/containers/{$data['containerID']}"
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
				$settings = $this->get_settings()->get();
				if ( empty( $settings['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_setting',
						__( 'No connected Google Analytics 4 property ID.', 'google-site-kit' ),
						array( 'status' => 500 )
					);
				}

				$analyticsadmin = $this->get_service( 'analyticsadmin' );
				$property_id    = self::normalize_property_id( $settings['propertyID'] );

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
			case 'POST:create-account-ticket':
				$account_ticket = new Account_Ticket();
				$account_ticket->set_id( $response->getAccountTicketId() );
				// Required in create_data_request.
				$account_ticket->set_property_name( $data['propertyName'] );
				$account_ticket->set_data_stream_name( $data['dataStreamName'] );
				$account_ticket->set_timezone( $data['timezone'] );
				// Cache the create ticket id long enough to verify it upon completion of the terms of service.
				set_transient(
					Analytics::PROVISION_ACCOUNT_TICKET_ID . '::' . get_current_user_id(),
					$account_ticket->to_array(),
					15 * MINUTE_IN_SECONDS
				);

				return $response;
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
			case 'GET:report':
				$report = new Analytics_4_Report_Response( $this->context );
				return $report->parse_response( $data, $response );
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
		$google_proxy = $this->authentication->get_google_proxy();

		return array(
			'analyticsadmin'        => new Google_Service_GoogleAnalyticsAdmin( $client ),
			'analyticsdata'         => new Google_Service_AnalyticsData( $client ),
			'analyticsprovisioning' => new AccountProvisioningService( $client, $google_proxy->url() ),
			'tagmanager'            => new Google_Service_TagManager( $client ),
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
	 * Gets the provisioning redirect URI that listens for the Terms of Service redirect.
	 *
	 * @since 1.98.0
	 *
	 * @return string Provisioning redirect URI.
	 */
	private function get_provisioning_redirect_uri() {
		return $this->authentication->get_google_proxy()
			->get_site_fields()['analytics_redirect_uri'];
	}

	/**
	 * Registers the Analytics 4 tag.
	 *
	 * @since 1.31.0
	 * @since 1.104.0 Added support for AMP tag.
	 */
	private function register_tag() {
		if ( $this->context->is_amp() ) {
			// AMP currently only works with the measurement ID.
			$tag = new AMP_Tag( $this->get_measurement_id(), self::MODULE_SLUG );
		} else {
			$tag = new Web_Tag( $this->get_tag_id(), self::MODULE_SLUG );
		}

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new Tag_Guard( $this->get_settings() ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( $tag->can_register() ) {
			$tag->set_home_domain(
				URL::parse( $this->context->get_canonical_home_url(), PHP_URL_HOST )
			);
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
	 * Gets the currently configured measurement ID.
	 *
	 * @since 1.104.0
	 *
	 * @return string Google Analytics 4 measurement ID.
	 */
	protected function get_measurement_id() {
		$settings = $this->get_settings()->get();

		return $settings['measurementID'];
	}

	/**
	 * Returns sharing settings with settings for Analytics-4 replicated from Analytics.
	 *
	 * Module sharing settings for Analytics and Analytics-4 are always kept "in-sync" when
	 * setting these settings in the datastore. However, this function ensures backwards
	 * compatibility before this replication was introduced, i.e. when sharing settings were
	 * saved for Analytics but not copied to Analytics-4.
	 *
	 * @since 1.98.0
	 *
	 * @param array $sharing_settings The dashboard_sharing settings option fetched from the database.
	 * @return array Dashboard sharing settings option with Analytics-4 settings.
	 */
	protected function replicate_analytics_sharing_settings( $sharing_settings ) {
		if ( ! isset( $sharing_settings[ self::MODULE_SLUG ] ) && isset( $sharing_settings[ Analytics::MODULE_SLUG ] ) ) {
			$sharing_settings[ self::MODULE_SLUG ] = $sharing_settings[ Analytics::MODULE_SLUG ];
		}

		return $sharing_settings;
	}

	/**
	 * Filters whether or not the option to exclude certain users from tracking should be displayed.
	 *
	 * If the Analytics-4 module is enabled, and the snippet is enabled, then the option to exclude
	 * the option to exclude certain users from tracking should be displayed.
	 *
	 * @since 1.101.0
	 *
	 * @param bool $allowed Whether to allow tracking exclusion.
	 * @return bool Filtered value.
	 */
	private function filter_analytics_allow_tracking_disabled( $allowed ) {
		if ( $allowed ) {
			return $allowed;
		}

		if ( Feature_Flags::enabled( 'ga4Reporting' ) && $this->get_settings()->get()['useSnippet'] ) {
			return true;
		}

		return $allowed;
	}
}
