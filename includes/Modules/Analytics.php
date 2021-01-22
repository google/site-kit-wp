<?php
/**
 * Class Google\Site_Kit\Modules\Analytics
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Admin_Bar;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Screen_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Analytics\Google_Service_AnalyticsProvisioning;
use Google\Site_Kit\Modules\Analytics\AMP_Tag;
use Google\Site_Kit\Modules\Analytics\Settings;
use Google\Site_Kit\Modules\Analytics\Tag_Guard;
use Google\Site_Kit\Modules\Analytics\Web_Tag;
use Google\Site_Kit\Modules\Analytics\Proxy_AccountTicket;
use Google\Site_Kit\Modules\Analytics\Advanced_Tracking;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_DateRangeValues;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_Report;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_ReportData;
use Google\Site_Kit_Dependencies\Google_Service_Analytics;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_GetReportsRequest;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_ReportRequest;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_Dimension;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_DimensionFilter;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_DimensionFilterClause;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_DateRange;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_Metric;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsReporting_OrderBy;
use Google\Site_Kit_Dependencies\Google_Service_Analytics_Accounts;
use Google\Site_Kit_Dependencies\Google_Service_Analytics_Account;
use Google\Site_Kit_Dependencies\Google_Service_Analytics_Webproperties;
use Google\Site_Kit_Dependencies\Google_Service_Analytics_Webproperty;
use Google\Site_Kit_Dependencies\Google_Service_Analytics_Profile;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;
use Exception;

/**
 * Class representing the Analytics module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Analytics extends Module
	implements Module_With_Screen, Module_With_Scopes, Module_With_Settings, Module_With_Assets, Module_With_Admin_Bar, Module_With_Debug_Fields, Module_With_Owner {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Screen_Trait;
	use Module_With_Settings_Trait;

	const PROVISION_ACCOUNT_TICKET_ID = 'googlesitekit_analytics_provision_account_ticket_id';

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'analytics';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		$this->register_screen_hook();

		/**
		 * This filter only exists to be unhooked by the AdSense module if active.
		 *
		 * @see \Google\Site_Kit\Modules\Analytics\Settings::register
		 */
		add_filter( 'googlesitekit_analytics_adsense_linked', '__return_false' );

		add_action( 'admin_init', $this->get_method_proxy( 'handle_provisioning_callback' ) );
		// For non-AMP and AMP.
		add_action( 'wp_head', $this->get_method_proxy( 'print_tracking_opt_out' ), 0 );
		// For Web Stories plugin.
		add_action( 'web_stories_story_head', $this->get_method_proxy( 'print_tracking_opt_out' ), 0 );
		// Analytics tag placement logic.
		add_action( 'template_redirect', $this->get_method_proxy( 'register_tag' ) );

		( new Advanced_Tracking( $this->context ) )->register();
	}

	/**
	 * Checks whether or not tracking snippet should be contextually disabled for this request.
	 *
	 * @since 1.1.0
	 *
	 * @return bool
	 */
	protected function is_tracking_disabled() {
		$option   = $this->get_settings()->get();
		$disabled = in_array( 'loggedinUsers', $option['trackingDisabled'], true ) && is_user_logged_in();

		/**
		 * Filters whether or not the Analytics tracking snippet is output for the current request.
		 *
		 * @since 1.1.0
		 *
		 * @param $disabled bool Whether to disable tracking or not.
		 */
		return (bool) apply_filters( 'googlesitekit_analytics_tracking_disabled', $disabled );
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/analytics.readonly',
		);
	}

	/**
	 * Returns all module information data for passing it to JavaScript.
	 *
	 * @since 1.0.0
	 *
	 * @return array Module information data.
	 */
	public function prepare_info_for_js() {
		$info = parent::prepare_info_for_js();

		$info['provides'] = array(
			__( 'Audience overview', 'google-site-kit' ),
			__( 'Top pages', 'google-site-kit' ),
			__( 'Top acquisition channels', 'google-site-kit' ),
		);

		return $info;
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$required_keys = array(
			'accountID',
			'propertyID',
			'profileID',
			'internalWebPropertyID',
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
	 * @since 1.0.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
		$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
	}

	/**
	 * Checks if the module is active in the admin bar for the given URL.
	 *
	 * @since 1.4.0
	 *
	 * @param string $url URL to determine active state for.
	 * @return bool
	 */
	public function is_active_in_admin_bar( $url ) {
		if ( ! $this->is_connected() ) {
			return false;
		}

		return $this->has_data_for_url( $url );
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		return array(
			'analytics_account_id'  => array(
				'label' => __( 'Analytics account ID', 'google-site-kit' ),
				'value' => $settings['accountID'],
				'debug' => Debug_Data::redact_debug_value( $settings['accountID'] ),
			),
			'analytics_property_id' => array(
				'label' => __( 'Analytics property ID', 'google-site-kit' ),
				'value' => $settings['propertyID'],
				'debug' => Debug_Data::redact_debug_value( $settings['propertyID'], 7 ),
			),
			'analytics_profile_id'  => array(
				'label' => __( 'Analytics view ID', 'google-site-kit' ),
				'value' => $settings['profileID'],
				'debug' => Debug_Data::redact_debug_value( $settings['profileID'] ),
			),
			'analytics_use_snippet' => array(
				'label' => __( 'Analytics snippet placed', 'google-site-kit' ),
				'value' => $settings['useSnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useSnippet'] ? 'yes' : 'no',
			),
		);
	}

	/**
	 * Handles the provisioning callback after the user completes the terms of service.
	 *
	 * @since 1.9.0
	 */
	protected function handle_provisioning_callback() {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return;
		}

		if ( ! current_user_can( Permissions::MANAGE_OPTIONS ) ) {
			return;
		}

		$input = $this->context->input();

		if ( ! $input->filter( INPUT_GET, 'gatoscallback' ) ) {
			return;
		}

		// The handler should check the received Account Ticket id parameter against the id stored in the provisioning step.
		$account_ticket_id        = $input->filter( INPUT_GET, 'accountTicketId', FILTER_SANITIZE_STRING );
		$stored_account_ticket_id = get_transient( self::PROVISION_ACCOUNT_TICKET_ID . '::' . get_current_user_id() );
		delete_transient( self::PROVISION_ACCOUNT_TICKET_ID . '::' . get_current_user_id() );

		if ( $stored_account_ticket_id !== $account_ticket_id ) {
			wp_safe_redirect(
				$this->context->admin_url( 'module-analytics', array( 'error_code' => 'account_ticket_id_mismatch' ) )
			);
			exit;
		}

		// Check for a returned error.
		$error = $input->filter( INPUT_GET, 'error', FILTER_SANITIZE_STRING );
		if ( ! empty( $error ) ) {
			wp_safe_redirect(
				$this->context->admin_url( 'module-analytics', array( 'error_code' => $error ) )
			);
			exit;
		}

		$account_id      = $input->filter( INPUT_GET, 'accountId', FILTER_SANITIZE_STRING );
		$web_property_id = $input->filter( INPUT_GET, 'webPropertyId', FILTER_SANITIZE_STRING );
		$profile_id      = $input->filter( INPUT_GET, 'profileId', FILTER_SANITIZE_STRING );

		if ( empty( $account_id ) || empty( $web_property_id ) || empty( $profile_id ) ) {
			wp_safe_redirect(
				$this->context->admin_url( 'module-analytics', array( 'error_code' => 'callback_missing_parameter' ) )
			);
			exit;
		}

		// Retrieve the internal web property id.
		try {
			$web_property = $this->get_service( 'analytics' )->management_webproperties->get( $account_id, $web_property_id );
		} catch ( Exception $e ) {
			wp_safe_redirect(
				$this->context->admin_url( 'module-analytics', array( 'error_code' => 'property_not_found' ) )
			);
			exit;
		}

		$this->get_settings()->merge(
			array(
				'accountID'             => $account_id,
				'propertyID'            => $web_property_id,
				'profileID'             => $profile_id,
				'internalWebPropertyID' => $web_property->getInternalWebPropertyId(),
			)
		);

		wp_safe_redirect(
			$this->context->admin_url(
				'dashboard',
				array(
					'notification' => 'authentication_success',
					'slug'         => 'analytics',
				)
			)
		);
		exit;
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.9.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:accounts-properties-profiles' => array( 'service' => 'analytics' ),
			'POST:create-account-ticket'       => array(
				'service'                => 'analyticsprovisioning',
				'scopes'                 => array( 'https://www.googleapis.com/auth/analytics.provision' ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics account on your behalf.', 'google-site-kit' ),
			),
			'POST:create-profile'              => array(
				'service'                => 'analytics',
				'scopes'                 => array( 'https://www.googleapis.com/auth/analytics.edit' ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics view on your behalf.', 'google-site-kit' ),
			),
			'POST:create-property'             => array(
				'service'                => 'analytics',
				'scopes'                 => array( 'https://www.googleapis.com/auth/analytics.edit' ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics property on your behalf.', 'google-site-kit' ),
			),
			'GET:goals'                        => array( 'service' => 'analytics' ),
			'GET:profiles'                     => array( 'service' => 'analytics' ),
			'GET:properties-profiles'          => array( 'service' => 'analytics' ),
			'GET:report'                       => array( 'service' => 'analyticsreporting' ),
			'GET:tag-permission'               => array( 'service' => '' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:accounts-properties-profiles':
				return function () use ( $data ) {
					$restore_defer = $this->with_client_defer( false );

					try {
						return $this->get_service( 'analytics' )->management_accounts->listManagementAccounts();
					} catch ( Google_Service_Exception $exception ) {
						// The exception message is a JSON object of all errors, so we'll convert it to our WP Error first.
						$wp_error = $this->exception_to_error( $exception, $data->datapoint );
						// Unfortunately there isn't a better way to identify this without checking the message.
						if ( 'User does not have any Google Analytics account.' === $wp_error->get_error_message() ) {
							return new Google_Service_Analytics_Accounts();
						}
						// If any other exception was caught, re-throw it.
						throw $exception;
					} finally {
						$restore_defer(); // Will be called before returning in all cases.
					}
				};
			case 'POST:create-account-ticket':
				if ( ! isset( $data['accountName'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountName' ), array( 'status' => 400 ) );
				}
				if ( ! isset( $data['propertyName'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyName' ), array( 'status' => 400 ) );
				}
				if ( ! isset( $data['profileName'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'profileName' ), array( 'status' => 400 ) );
				}
				if ( ! isset( $data['timezone'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'timezone' ), array( 'status' => 400 ) );
				}

				if ( ! $this->authentication->credentials()->using_proxy() ) {
					return new WP_Error( 'requires_service', __( 'Analytics provisioning requires connecting via the Site Kit Service.', 'google-site-kit' ), array( 'status' => 400 ) );
				}

				$account = new Google_Service_Analytics_Account();
				$account->setName( $data['accountName'] );

				$property = new Google_Service_Analytics_Webproperty();
				$property->setName( $data['propertyName'] );
				$property->setWebsiteUrl( $this->context->get_reference_site_url() );

				$profile = new Google_Service_Analytics_Profile();
				$profile->setName( $data['profileName'] );
				$profile->setTimezone( $data['timezone'] );

				$account_ticket = new Proxy_AccountTicket();
				$account_ticket->setAccount( $account );
				$account_ticket->setWebproperty( $property );
				$account_ticket->setProfile( $profile );
				$account_ticket->setRedirectUri( $this->get_provisioning_redirect_uri() );

				// Add site id and secret.
				$creds = $this->authentication->credentials()->get();
				$account_ticket->setSiteId( $creds['oauth2_client_id'] );
				$account_ticket->setSiteSecret( $creds['oauth2_client_secret'] );

				return $this->get_service( 'analyticsprovisioning' )
					->provisioning->createAccountTicket( $account_ticket );
			case 'GET:goals':
				$connection = $this->get_settings()->get();
				if (
					empty( $connection['accountID'] ) ||
					empty( $connection['internalWebPropertyID'] ) ||
					empty( $connection['profileID'] )
				) {
					// This is needed to return and emulate the same error format from Analytics API.
					return function() {
						return array(
							'error' => array(
								'code'    => 400,
								'message' => __( 'Analytics module needs to be configured.', 'google-site-kit' ),
								'status'  => 'INVALID_ARGUMENT',
							),
						);
					};
				}
				$service = $this->get_service( 'analytics' );
				return $service->management_goals->listManagementGoals( $connection['accountID'], $connection['propertyID'], $connection['profileID'] );
			case 'GET:profiles':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}

				return $this->get_service( 'analytics' )->management_profiles->listManagementProfiles( $data['accountID'], $data['propertyID'] );
			case 'GET:properties-profiles':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}

				return $this->get_service( 'analytics' )->management_webproperties->listManagementWebproperties( $data['accountID'] );
			case 'GET:report':
				$request_args = array();

				if ( empty( $data['metrics'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'metrics' ), array( 'status' => 400 ) );
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
								$dimension = new Google_Service_AnalyticsReporting_Dimension();

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
						$request_args['dimensions'] = $dimensions;
					}
				}

				$dimension_filters          = $data['dimensionFilters'];
				$dimension_filter_instances = array();
				if ( ! empty( $dimension_filters ) && is_array( $dimension_filters ) ) {
					foreach ( $dimension_filters as $dimension_name => $dimension_value ) {
						$dimension_filter = new Google_Service_AnalyticsReporting_DimensionFilter();
						$dimension_filter->setDimensionName( $dimension_name );
						$dimension_filter->setOperator( 'EXACT' );
						$dimension_filter->setExpressions( array( $dimension_value ) );
						$dimension_filter_instances[] = $dimension_filter;
					}

					if ( ! empty( $dimension_filter_instances ) ) {
						$request_args['dimension_filters'] = $dimension_filter_instances;
					}
				}

				$request = $this->create_analytics_site_data_request( $request_args );

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

					// When using multiple date ranges, it changes the structure of the response,
					// where each date range becomes an item in a list.
					if ( strtotime( $compare_start_date ) && strtotime( $compare_end_date ) ) {
						$date_ranges[] = array( $compare_start_date, $compare_end_date );
					}
				} else {
					$date_range    = $data['dateRange'] ?: 'last-28-days';
					$date_ranges[] = $this->parse_date_range( $date_range, $data['compareDateRanges'] ? 2 : 1 );

					// When using multiple date ranges, it changes the structure of the response,
					// where each date range becomes an item in a list.
					if ( ! empty( $data['multiDateRange'] ) ) {
						$date_ranges[] = $this->parse_date_range( $date_range, 1, 1, true, true );
					}
				}

				$date_ranges = array_map(
					function ( $date_range ) {
						list ( $start_date, $end_date ) = $date_range;
						$date_range                     = new Google_Service_AnalyticsReporting_DateRange();
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
								$metric = new Google_Service_AnalyticsReporting_Metric();

								if ( is_string( $metric_def ) ) {
									$metric->setAlias( $metric_def );
									$metric->setExpression( $metric_def );
								} elseif ( is_array( $metric_def ) && ! empty( $metric_def['expression'] ) ) {
									$metric->setExpression( $metric_def['expression'] );
									$metric->setAlias( ! empty( $metric_def['alias'] ) ? $metric_def['alias'] : $metric_def['expression'] );
								} else {
									return null;
								}

								return $metric;
							},
							array_filter( $metrics )
						)
					);

					if ( ! empty( $metrics ) ) {
						$request->setMetrics( $metrics );
					}
				}

				// Order by.
				$orderby = $this->parse_reporting_orderby( $data['orderby'] );
				if ( ! empty( $orderby ) ) {
					$request->setOrderBys( $orderby );
				}

				// Batch reports requests.
				$body = new Google_Service_AnalyticsReporting_GetReportsRequest();
				$body->setReportRequests( array( $request ) );

				return $this->get_analyticsreporting_service()->reports->batchGet( $body );
			case 'POST:create-profile':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}
				$profile_name = trim( $data['profileName'] );
				if ( empty( $profile_name ) ) {
					$profile_name = _x( 'All Web Site Data', 'default Analytics view name', 'google-site-kit' );
				}
				$profile = new Google_Service_Analytics_Profile();
				$profile->setName( $profile_name );
				return $profile = $this->get_service( 'analytics' )->management_profiles->insert( $data['accountID'], $data['propertyID'], $profile );
			case 'POST:create-property':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				$property = new Google_Service_Analytics_Webproperty();
				$property->setName( wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST ) );
				$property->setWebsiteUrl( $this->context->get_reference_site_url() );
				return $this->get_service( 'analytics' )->management_webproperties->insert( $data['accountID'], $property );
			case 'GET:tag-permission':
				return function() use ( $data ) {
					if ( ! isset( $data['propertyID'] ) ) {
						return new WP_Error(
							'missing_required_param',
							/* translators: %s: Missing parameter name */
							sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
							array( 'status' => 400 )
						);
					}
					$property_id = $data['propertyID'];
					return array_merge(
						array(
							'accountID'  => '', // Set the accountID to be an empty string and let has_access_to_property handle determining actual ID.
							'propertyID' => $property_id,
						),
						$this->has_access_to_property( $property_id )
					);
				};
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Parses the orderby value of the data request into an array of reporting orderby object instances.
	 *
	 * @since 1.13.1
	 *
	 * @param array|null $orderby Data request orderby value.
	 * @return Google_Service_AnalyticsReporting_OrderBy[] An array of reporting orderby objects.
	 */
	protected function parse_reporting_orderby( $orderby ) {
		if ( empty( $orderby ) || ! is_array( $orderby ) ) {
			return array();
		}

		$results = array_map(
			function ( $order_def ) {
				$order_def = array_merge(
					array(
						'fieldName' => '',
						'sortOrder' => '',
					),
					(array) $order_def
				);

				if ( empty( $order_def['fieldName'] ) || empty( $order_def['sortOrder'] ) ) {
					return null;
				}

				$order_by = new Google_Service_AnalyticsReporting_OrderBy();
				$order_by->setFieldName( $order_def['fieldName'] );
				$order_by->setSortOrder( $order_def['sortOrder'] );

				return $order_by;
			},
			// When just object is passed we need to convert it to an array of objects.
			wp_is_numeric_array( $orderby ) ? $orderby : array( $orderby )
		);

		$results = array_filter( $results );
		$results = array_values( $results );

		return $results;
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:accounts-properties-profiles':
				/* @var Google_Service_Analytics_Accounts $response listManagementAccounts response. */
				$accounts            = (array) $response->getItems();
				$account_ids         = array_map(
					function ( Google_Service_Analytics_Account $account ) {
						return $account->getId();
					},
					$accounts
				);
				$properties_profiles = array(
					'properties' => array(),
					'profiles'   => array(),
				);

				if ( empty( $accounts ) ) {
					return array_merge( compact( 'accounts' ), $properties_profiles );
				}

				if ( $data['existingAccountID'] && $data['existingPropertyID'] ) {
					// If there is an existing tag, pass it through to ensure only the existing tag is matched.
					$properties_profiles = $this->get_data(
						'properties-profiles',
						array(
							'accountID'          => $data['existingAccountID'],
							'existingPropertyID' => $data['existingPropertyID'],
						)
					);
				} else {
					// Get the account ID from the saved settings.
					$option     = $this->get_settings()->get();
					$account_id = $option['accountID'];
					// If the saved account ID is in the list of accounts the user has access to, it's a match.
					if ( in_array( $account_id, $account_ids, true ) ) {
						$properties_profiles = $this->get_data( 'properties-profiles', array( 'accountID' => $account_id ) );
					} else {
						$fallback_properties_profiles = null;
						// Iterate over the first 25 accounts to avoid making too many requests.
						foreach ( array_slice( $accounts, 0, 25 ) as $account ) {
							/* @var Google_Service_Analytics_Account $account Analytics account object. */
							$properties_profiles = $this->get_data( 'properties-profiles', array( 'accountID' => $account->getId() ) );

							if ( is_wp_error( $properties_profiles ) ) {
								$properties_profiles = $fallback_properties_profiles;
								// Stop iteration to avoid potential quota errors.
								break;
							}
							// If we found a matchedProperty, we're all done.
							if ( isset( $properties_profiles['matchedProperty'] ) ) {
								break;
							}
							// If we didn't find a matched property yet,
							// save the response as a fallback, if none set yet.
							if ( null === $fallback_properties_profiles ) {
								$fallback_properties_profiles = $properties_profiles;
							}
						}
					}
				}

				if ( is_wp_error( $properties_profiles ) || ! $properties_profiles ) {
					$properties_profiles = array(
						'properties' => array(),
						'profiles'   => array(),
					);
				}

				return array_merge( compact( 'accounts' ), $properties_profiles );
			case 'GET:goals':
				if ( is_array( $response ) ) {
					return $response;
				}
				// TODO: Parse this response to a regular array.
				break;
			case 'GET:profiles':
				// TODO: Parse this response to a regular array.
				$response = $response->getItems();

				return $response;
			case 'GET:properties-profiles':
				/* @var Google_Service_Analytics_Webproperties $response listManagementWebproperties response. */
				$properties = (array) $response->getItems();
				$response   = array(
					'properties' => $properties,
					'profiles'   => array(),
				);

				if ( 0 === count( $properties ) ) {
					return $response;
				}

				$found_property = new Google_Service_Analytics_Webproperty();
				$current_url    = $this->context->get_reference_site_url();

				// If requested for a specific property, only match by property ID.
				if ( ! empty( $data['existingPropertyID'] ) ) {
					$property_id  = $data['existingPropertyID'];
					$current_urls = array();
				} else {
					$option       = $this->get_settings()->get();
					$property_id  = $option['propertyID'];
					$current_urls = $this->permute_site_url( $current_url );
				}

				// If there's no match for the saved account ID, try to find a match using the properties of each account.
				foreach ( $properties as $property ) {
					/* @var Google_Service_Analytics_Webproperty $property Property instance. */
					if (
						// Attempt to match by property ID.
						$property->getId() === $property_id ||
						// Attempt to match by site URL, with and without http/https and 'www' subdomain.
						in_array( untrailingslashit( $property->getWebsiteUrl() ), $current_urls, true )
					) {
						$found_property              = $property;
						$response['matchedProperty'] = $property;
						break;
					}
				}

				// If no match is found, fetch profiles for the first property if available.
				if ( ! $found_property->getAccountId() && $properties ) {
					$found_property = array_shift( $properties );
				} elseif ( ! $found_property->getAccountId() ) {
					// If no found property, skip the call to 'profiles' as it would be empty/fail.
					return $response;
				}

				$profiles = $this->get_data(
					'profiles',
					array(
						'accountID'  => $found_property->getAccountId(),
						'propertyID' => $found_property->getId(),
					)
				);

				if ( is_wp_error( $profiles ) ) {
					return $profiles;
				}

				$response['profiles'] = $profiles;

				return $response;
			case 'GET:report':
				// If AdSense metric successfully requested, set adsenseLinked to true.
				if ( $this->is_adsense_request( $data ) ) {
					$this->get_settings()->merge( array( 'adsenseLinked' => true ) );
				}

				return $response->getReports();
			case 'POST:create-account-ticket':
				// Cache the create ticket id long enough to verify it upon completion of the terms of service.
				set_transient(
					self::PROVISION_ACCOUNT_TICKET_ID . '::' . get_current_user_id(),
					$response->getId(),
					15 * MINUTE_IN_SECONDS
				);
				return $response;
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Creates a new Analytics site request for the current site and given arguments.
	 *
	 * @since 1.0.0
	 * @since 1.24.0 Added $dimension_filters
	 *
	 * @param array $args {
	 *     Optional. Additional arguments.
	 *
	 *     @type array                                               $dimensions        List of request dimensions. Default empty array.
	 *     @type Google_Service_AnalyticsReporting_DimensionFilter[] $dimension_filters List of dimension filter instances for the specified request dimensions. Default empty array.
	 *     @type string                                              $start_date        Start date in 'Y-m-d' format. Default empty string.
	 *     @type string                                              $end_date          End date in 'Y-m-d' format. Default empty string.
	 *     @type string                                              $page              Specific page URL to filter by. Default empty string.
	 *     @type int                                                 $row_limit         Limit of rows to return. Default 100.
	 * }
	 * @return Google_Service_AnalyticsReporting_ReportRequest|WP_Error Analytics site request instance.
	 */
	protected function create_analytics_site_data_request( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions'        => array(),
				'dimension_filters' => array(),
				'start_date'        => '',
				'end_date'          => '',
				'page'              => '',
				'row_limit'         => 100,
			)
		);

		$option     = $this->get_settings()->get();
		$profile_id = $option['profileID'];

		$request = new Google_Service_AnalyticsReporting_ReportRequest();
		$request->setIncludeEmptyRows( true );
		$request->setViewId( $profile_id );

		if ( ! empty( $args['dimensions'] ) ) {
			$request->setDimensions( (array) $args['dimensions'] );
		}

		if ( ! empty( $args['start_date'] ) && ! empty( $args['end_date'] ) ) {
			$date_range = new Google_Service_AnalyticsReporting_DateRange();
			$date_range->setStartDate( $args['start_date'] );
			$date_range->setEndDate( $args['end_date'] );
			$request->setDateRanges( array( $date_range ) );
		}

		$dimension_filter_clauses = array();
		if ( ! empty( $args['dimension_filters'] ) ) {
			$dimension_filters       = $args['dimension_filters'];
			$dimension_filter_clause = new Google_Service_AnalyticsReporting_DimensionFilterClause();
			$dimension_filter_clause->setFilters( $dimension_filters );
			$dimension_filter_clause->setOperator( 'AND' );
			$dimension_filter_clauses[] = $dimension_filter_clause;
		}

		if ( ! empty( $args['page'] ) ) {
			$dimension_filter = new Google_Service_AnalyticsReporting_DimensionFilter();
			$dimension_filter->setDimensionName( 'ga:pagePath' );
			$dimension_filter->setOperator( 'EXACT' );
			$args['page'] = str_replace( trim( $this->context->get_reference_site_url(), '/' ), '', esc_url_raw( $args['page'] ) );
			$dimension_filter->setExpressions( array( rawurldecode( $args['page'] ) ) );
			$dimension_filter_clause = new Google_Service_AnalyticsReporting_DimensionFilterClause();
			$dimension_filter_clause->setFilters( array( $dimension_filter ) );
			$dimension_filter_clauses[] = $dimension_filter_clause;
		}

		if ( ! empty( $dimension_filter_clauses ) ) {
			$request->setDimensionFilterClauses( $dimension_filter_clauses );
		}

		if ( ! empty( $args['row_limit'] ) ) {
			$request->setPageSize( $args['row_limit'] );
		}

		return $request;
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'analytics',
			'name'        => _x( 'Analytics', 'Service name', 'google-site-kit' ),
			'description' => __( 'Get a deeper understanding of your customers. Google Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ),
			'cta'         => __( 'Get to know your customers.', 'google-site-kit' ),
			'order'       => 3,
			'homepage'    => __( 'https://analytics.google.com/analytics/web', 'google-site-kit' ),
			'learn_more'  => __( 'https://marketingplatform.google.com/about/analytics/', 'google-site-kit' ),
		);
	}

	/**
	 * Gets the configured Analytics Reporting service object instance.
	 *
	 * @return Google_Service_AnalyticsReporting The Analytics Reporting API service.
	 */
	private function get_analyticsreporting_service() {
		return $this->get_service( 'analyticsreporting' );
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Now requires Google_Site_Kit_Client instance.
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Site_Kit_Client $client ) {
		$google_proxy = new Google_Proxy( $this->context );
		return array(
			'analytics'             => new Google_Service_Analytics( $client ),
			'analyticsreporting'    => new Google_Service_AnalyticsReporting( $client ),
			'analyticsprovisioning' => new Google_Service_AnalyticsProvisioning( $client, $google_proxy->url() ),
		);
	}

	/**
	 * Gets the provisioning redirect URI that listens for the Terms of Service redirect.
	 *
	 * @since 1.9.0
	 *
	 * @return string Provisioning redirect URI.
	 */
	private function get_provisioning_redirect_uri() {
		$google_proxy = new Google_Proxy( $this->context );
		return $google_proxy->get_site_fields()['analytics_redirect_uri'];
	}

	/**
	 * Verifies that user has access to the property found in the existing tag.
	 *
	 * @since 1.0.0
	 * @since 1.8.0 Simplified to return a boolean and require account ID.
	 *
	 * @param string $property_id Property found in the existing tag.
	 * @return array A string representing the accountID and a boolean representing if the user has access to the property.
	 */
	protected function has_access_to_property( $property_id ) {
		if ( empty( $property_id ) ) {
			return array(
				'permission' => false,
			);
		}

		$account_id = $this->parse_account_id( $property_id );

		/**
		 * Helper method to check check if a given account
		 * contains the property_id
		 */
		$has_property = function ( $account_id ) use ( $property_id ) {
			$response = $this->get_data( 'properties-profiles', array( 'accountID' => $account_id ) );
			if ( is_wp_error( $response ) ) {
				return false;
			}
			foreach ( $response['properties'] as $property ) {
				if ( $property->getId() === $property_id ) {
					return true;
				}
			}
			return false;
		};

		// Ensure there is access to the property.
		if ( $has_property( $account_id ) ) {
			return array(
				'accountID'  => $account_id,
				'permission' => true,
			);
		}

		// Check all of the accounts for this user.
		$user_accounts_properties_profiles = $this->get_data( 'accounts-properties-profiles' );
		$user_account_ids                  = is_wp_error( $user_accounts_properties_profiles ) ? array() : wp_list_pluck( $user_accounts_properties_profiles['accounts'], 'id' );
		foreach ( $user_account_ids as $user_account_id ) {
			// Skip the inferred account id, that ship has sailed.
			if ( $account_id === $user_account_id ) {
				continue;
			}
			if ( $has_property( $user_account_id ) ) {
				return array(
					'accountID'  => $user_account_id,
					'permission' => true,
				);
			}
		}

		// No property matched the account ID.
		return array(
			'permission' => false,
		);
	}

	/**
	 * Transforms an exception into a WP_Error object.
	 *
	 * @since 1.0.0
	 *
	 * @param Exception $e         Exception object.
	 * @param string    $datapoint Datapoint originally requested.
	 * @return WP_Error WordPress error object.
	 */
	protected function exception_to_error( Exception $e, $datapoint ) {
		$cache_ttl = false;

		if ( 'report' === $datapoint && $e instanceof Google_Service_Exception ) {
			$errors = $e->getErrors();
			// If error is because of AdSense metric being requested, set adsenseLinked to false.
			if ( isset( $errors[0]['message'] ) ) {
				if ( $this->is_adsense_metric( substr( $errors[0]['message'], strlen( 'Restricted metric(s): ' ) ) ) ) {
					$this->get_settings()->merge( array( 'adsenseLinked' => false ) );
				}

				if ( preg_match( '#^Restricted metric\(s\)\:#im', $errors[0]['message'] ) ) {
					$cache_ttl = ( 10 * MINUTE_IN_SECONDS );
				}
			}
		}

		$error = parent::exception_to_error( $e, $datapoint );

		if ( $cache_ttl && is_wp_error( $error ) ) {
			$error_code = $error->get_error_code();
			if ( ! empty( $error->error_data[ $error_code ] ) ) {
				$error->error_data[ $error_code ]['cacheTTL'] = $cache_ttl;
			} else {
				$error->add_data(
					array(
						'cacheTTL' => $cache_ttl,
					),
					$error_code
				);
			}
		}

		return $error;
	}

	/**
	 * Determines whether the given request is for an adsense request.
	 *
	 * @param Data_Request $data Data request object.
	 *
	 * @return bool
	 */
	private function is_adsense_request( $data ) {
		foreach ( (array) $data['metrics'] as $metric ) {
			$metric = (array) $metric;
			if ( isset( $metric['expression'] ) && $this->is_adsense_metric( $metric['expression'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Determines whether the given metric expression is for an AdSense metric.
	 *
	 * @since 1.8.0
	 *
	 * @param string $metric Metric expression.
	 * @return bool True if AdSense metric, false otherwise.
	 */
	private function is_adsense_metric( $metric ) {
		return 0 === strpos( $metric, 'ga:adsense' );
	}

	/**
	 * Outputs the user tracking opt-out script.
	 *
	 * This script opts out of all Google Analytics tracking, for all measurement IDs, regardless of implementation.
	 * E.g. via Tag Manager, etc.
	 *
	 * @since 1.5.0
	 * @link https://developers.google.com/analytics/devguides/collection/analyticsjs/user-opt-out
	 */
	private function print_tracking_opt_out() {
		if ( ! $this->is_tracking_disabled() ) {
			return;
		}

		?>
		<!-- <?php esc_html_e( 'Google Analytics user opt-out added via Site Kit by Google', 'google-site-kit' ); ?> -->
		<?php if ( $this->context->is_amp() ) : ?>
			<script type="application/ld+json" id="__gaOptOutExtension"></script>
		<?php else : ?>
			<script type="text/javascript">window["_gaUserPrefs"] = { ioo : function() { return true; } }</script>
		<?php endif; ?>
		<?php
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.2.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.8.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-analytics',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-analytics.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-datastore-forms',
						'googlesitekit-google-charts',
					),
				)
			),
		);
	}

	/**
	 * Checks whether Analytics data exists for the given URL.
	 *
	 * @since 1.4.0
	 *
	 * @param string $url The url to check data for.
	 * @return bool
	 */
	protected function has_data_for_url( $url ) {
		if ( ! $url ) {
			return false;
		}

		$transient_key = 'googlesitekit_analytics_has_data_' . md5( $url );
		$has_data      = get_transient( $transient_key );

		if ( false === $has_data ) {
			/* @var Google_Service_AnalyticsReporting_Report[]|WP_Error $reports Array of reporting report instances. */
			$reports = $this->get_data(
				'report',
				array(
					'url'     => $url,
					'metrics' => array(
						array( 'expression' => 'ga:users' ),
						array( 'expression' => 'ga:sessions' ),
					),
				)
			);

			if ( is_wp_error( $reports ) ) {
				$reports = array(); // Bypass data check and cache.
			}

			foreach ( $reports as $report ) {
				/* @var Google_Service_AnalyticsReporting_Report $report Report instance. */
				$report_data = $report->getData();
				/* @var Google_Service_AnalyticsReporting_ReportData $report_data Report data instance. */
				foreach ( $report_data->getTotals() as $date_range_values ) {
					/* @var Google_Service_AnalyticsReporting_DateRangeValues $date_range_values Values instance. */
					if (
						isset( $date_range_values[0], $date_range_values[1] )
						&& ( 0 < $date_range_values[0] || 0 < $date_range_values[1] )
					) {
						$has_data = true;
						break 2;
					}
				}
			}

			// Cache "data found" status for one day, "no data" status for one hour.
			set_transient( $transient_key, (int) $has_data, $has_data ? DAY_IN_SECONDS : HOUR_IN_SECONDS );
		}

		return (bool) $has_data;
	}

	/**
	 * Determines the Analytics account ID from a given Analytics property ID.
	 *
	 * @since 1.8.0
	 *
	 * @param string $property_id Analytics property ID.
	 * @return string Analytics account ID, or empty string if invalid property ID.
	 */
	protected function parse_account_id( $property_id ) {
		if ( ! preg_match( '/^UA-([0-9]+)-[0-9]+$/', $property_id, $matches ) ) {
			return '';
		}
		return $matches[1];
	}

	/**
	 * Registers the Analytics tag.
	 *
	 * @since 1.24.0
	 */
	private function register_tag() {
		$tag             = null;
		$module_settings = $this->get_settings();
		$settings        = $module_settings->get();

		if ( $this->context->is_amp() ) {
			$tag = new AMP_Tag( $settings['propertyID'], self::MODULE_SLUG );
		} else {
			$tag = new Web_Tag( $settings['propertyID'], self::MODULE_SLUG );
			$tag->set_anonymize_ip( ! empty( $settings['anonymizeIP'] ) );
		}

		if ( $tag && ! $tag->is_tag_blocked() ) {
			$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
			$tag->use_guard( new Tag_Guard( $module_settings ) );

			if ( $tag->can_register() ) {
				if ( $this->context->get_amp_mode() ) {
					$home = $this->context->get_canonical_home_url();
					$home = wp_parse_url( $home, PHP_URL_HOST );
					$tag->set_home_domain( $home );
				}

				$tag->register();
			}
		}
	}

}
