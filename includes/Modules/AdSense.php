<?php
/**
 * Class Google\Site_Kit\Modules\AdSense
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Metrics_Exception;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Dimensions_Exception;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\Sort;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag;
use Google\Site_Kit\Modules\AdSense\AMP_Tag;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit\Modules\AdSense\Tag_Guard;
use Google\Site_Kit\Modules\AdSense\Auto_Ad_Guard;
use Google\Site_Kit\Modules\AdSense\Web_Tag;
use Google\Site_Kit_Dependencies\Google\Model as Google_Model;
use Google\Site_Kit_Dependencies\Google\Service\Adsense as Google_Service_Adsense;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\Alert as Google_Service_Adsense_Alert;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\Guards\WP_Query_404_Guard;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag_Guard;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Web_Tag;
use WP_Error;
use WP_REST_Response;

/**
 * Class representing the AdSense module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class AdSense extends Module
	implements Module_With_Scopes, Module_With_Settings, Module_With_Assets, Module_With_Debug_Fields, Module_With_Owner, Module_With_Service_Entity, Module_With_Deactivation {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'adsense';

	/**
	 * Ad_Blocking_Recovery_Tag instance.
	 *
	 * @since 1.104.0
	 * @var Ad_Blocking_Recovery_Tag
	 */
	protected $ad_blocking_recovery_tag;

	/**
	 * Constructor.
	 *
	 * @since 1.104.0
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Assets         $assets  Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null,
		Assets $assets = null
	) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );
		$this->ad_blocking_recovery_tag = new Ad_Blocking_Recovery_Tag( new Encrypted_Options( $this->options ) );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		$this->ad_blocking_recovery_tag->register();

		add_action( 'wp_head', $this->get_method_proxy_once( 'render_platform_meta_tags' ) );

		if ( $this->is_connected() ) {
			/**
			 * Release filter forcing unlinked state.
			 *
			 * This is hooked into 'init' (default priority of 10), so that it
			 * runs after the original filter is added.
			 *
			 * @see \Google\Site_Kit\Modules\Analytics::register()
			 * @see \Google\Site_Kit\Modules\Analytics\Settings::register()
			 */
			add_action(
				'googlesitekit_init',
				function () {
					remove_filter( 'googlesitekit_analytics_adsense_linked', '__return_false' );
				}
			);
		}

		// AdSense tag placement logic.
		add_action( 'template_redirect', $this->get_method_proxy( 'register_tag' ) );
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.0.0
	 * @since 1.9.0 Changed to `adsense.readonly` variant.
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/adsense.readonly',
		);
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
		$settings = $this->get_settings()->get();

		if ( empty( $settings['accountSetupComplete'] ) || empty( $settings['siteSetupComplete'] ) ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.0.0
	 * @since 1.106.0 Remove Ad Blocking Recovery Tag setting on deactivation.
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();

		$this->ad_blocking_recovery_tag->delete();
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
			'adsense_account_id'                       => array(
				'label' => __( 'AdSense account ID', 'google-site-kit' ),
				'value' => $settings['accountID'],
				'debug' => Debug_Data::redact_debug_value( $settings['accountID'], 7 ),
			),
			'adsense_client_id'                        => array(
				'label' => __( 'AdSense client ID', 'google-site-kit' ),
				'value' => $settings['clientID'],
				'debug' => Debug_Data::redact_debug_value( $settings['clientID'], 10 ),
			),
			'adsense_account_status'                   => array(
				'label' => __( 'AdSense account status', 'google-site-kit' ),
				'value' => $settings['accountStatus'],
			),
			'adsense_site_status'                      => array(
				'label' => __( 'AdSense site status', 'google-site-kit' ),
				'value' => $settings['siteStatus'],
			),
			'adsense_use_snippet'                      => array(
				'label' => __( 'AdSense snippet placed', 'google-site-kit' ),
				'value' => $settings['useSnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useSnippet'] ? 'yes' : 'no',
			),
			'adsense_web_stories_adunit_id'            => array(
				'label' => __( 'Web Stories Ad Unit ID', 'google-site-kit' ),
				'value' => $settings['webStoriesAdUnit'],
				'debug' => $settings['webStoriesAdUnit'],
			),
			'adsense_setup_completed_timestamp'        => array(
				'label' => __( 'AdSense setup completed at', 'google-site-kit' ),
				'value' => $settings['setupCompletedTimestamp'] ? date_i18n(
					get_option( 'date_format' ),
					$settings['setupCompletedTimestamp']
				) : __( 'Not available', 'google-site-kit' ),
				'debug' => $settings['setupCompletedTimestamp'],
			),
			'adsense_abr_use_snippet'                  => array(
				'label' => __(
					'Ad Blocking Recovery snippet placed',
					'google-site-kit'
				),
				'value' => $settings['useAdBlockingRecoverySnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useAdBlockingRecoverySnippet'] ? 'yes' : 'no',
			),
			'adsense_abr_use_error_protection_snippet' => array(
				'label' => __(
					'Ad Blocking Recovery error protection snippet placed',
					'google-site-kit'
				),
				'value' => $settings['useAdBlockingRecoveryErrorSnippet'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['useAdBlockingRecoveryErrorSnippet'] ? 'yes' : 'no',
			),
			'adsense_abr_setup_status'                 => array(
				'label' => __(
					'Ad Blocking Recovery setup status',
					'google-site-kit'
				),
				'value' => $this->get_ad_blocking_recovery_setup_status_label(
					$settings['adBlockingRecoverySetupStatus']
				),
				'debug' => $settings['adBlockingRecoverySetupStatus'],
			),
		);

	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.12.0
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:accounts'                        => array( 'service' => 'adsense' ),
			'GET:adunits'                         => array( 'service' => 'adsense' ),
			'GET:alerts'                          => array( 'service' => 'adsense' ),
			'GET:clients'                         => array( 'service' => 'adsense' ),
			'GET:notifications'                   => array( 'service' => '' ),
			'GET:report'                          => array(
				'service'   => 'adsense',
				'shareable' => true,
			),
			'GET:sites'                           => array( 'service' => 'adsense' ),
			'POST:sync-ad-blocking-recovery-tags' => array( 'service' => 'adsense' ),
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
			case 'GET:accounts':
				$service = $this->get_service( 'adsense' );
				return $service->accounts->listAccounts();
			case 'GET:adunits':
				if ( ! isset( $data['accountID'] ) || ! isset( $data['clientID'] ) ) {
					$option            = $this->get_settings()->get();
					$data['accountID'] = $option['accountID'];
					if ( empty( $data['accountID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
					}
					$data['clientID'] = $option['clientID'];
					if ( empty( $data['clientID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ), array( 'status' => 400 ) );
					}
				}
				$service = $this->get_service( 'adsense' );
				return $service->accounts_adclients_adunits->listAccountsAdclientsAdunits( self::normalize_client_id( $data['accountID'], $data['clientID'] ) );
			case 'GET:alerts':
				if ( ! isset( $data['accountID'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
				}
				$service = $this->get_service( 'adsense' );
				return $service->accounts_alerts->listAccountsAlerts( self::normalize_account_id( $data['accountID'] ) );
			case 'GET:clients':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				$service = $this->get_service( 'adsense' );
				return $service->accounts_adclients->listAccountsAdclients( self::normalize_account_id( $data['accountID'] ) );
			case 'GET:notifications':
				return function() {
					$settings = $this->get_settings()->get();

					if ( empty( $settings['accountID'] ) ) {
						return array();
					}

					$alerts = $this->get_data( 'alerts', array( 'accountID' => $settings['accountID'] ) );

					if ( is_wp_error( $alerts ) || empty( $alerts ) ) {
						return array();
					}
					$alerts = array_filter(
						$alerts,
						function( Google_Service_Adsense_Alert $alert ) {
							return 'SEVERE' === $alert->getSeverity();
						}
					);

					// There is no SEVERE alert, return empty.
					if ( empty( $alerts ) ) {
						return array();
					}

					$notifications = array_map(
						function ( Google_Service_Adsense_Alert $alert ) {
							return array(
								'id'            => 'adsense::' . $alert->getName(),
								'description'   => $alert->getMessage(),
								'isDismissible' => true,
								'severity'      => 'win-info',
								'ctaURL'        => $this->get_account_url(),
								'ctaLabel'      => __( 'Go to AdSense', 'google-site-kit' ),
								'ctaTarget'     => '_blank',
							);
						},
						$alerts
					);

					return array_values( $notifications );
				};
			case 'GET:report':
				$start_date = $data['startDate'];
				$end_date   = $data['endDate'];
				if ( ! strtotime( $start_date ) || ! strtotime( $end_date ) ) {
					$dates = $this->date_range_to_dates( 'last-28-days' );
					if ( is_wp_error( $dates ) ) {
						return $dates;
					}

					list ( $start_date, $end_date ) = $dates;
				}

				$args = array(
					'start_date' => $start_date,
					'end_date'   => $end_date,
				);

				$metrics = $this->parse_string_list( $data['metrics'] );
				if ( ! empty( $metrics ) ) {
					if ( $this->is_shared_data_request( $data ) ) {
						try {
							$this->validate_shared_report_metrics( $metrics );
						} catch ( Invalid_Report_Metrics_Exception $exception ) {
							return new WP_Error(
								'invalid_adsense_report_metrics',
								$exception->getMessage()
							);
						}
					}

					$args['metrics'] = $metrics;
				}

				$dimensions = $this->parse_string_list( $data['dimensions'] );
				if ( ! empty( $dimensions ) ) {
					if ( $this->is_shared_data_request( $data ) ) {
						try {
							$this->validate_shared_report_dimensions( $dimensions );
						} catch ( Invalid_Report_Dimensions_Exception $exception ) {
							return new WP_Error(
								'invalid_adsense_report_dimensions',
								$exception->getMessage()
							);
						}
					}

					$args['dimensions'] = $dimensions;
				}

				$orderby = $this->parse_earnings_orderby( $data['orderby'] );
				if ( ! empty( $orderby ) ) {
					$args['sort'] = $orderby;
				}

				if ( ! empty( $data['limit'] ) ) {
					$args['limit'] = $data['limit'];
				}

				return $this->create_adsense_earning_data_request( array_filter( $args ) );
			case 'GET:sites':
				if ( ! isset( $data['accountID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
						array( 'status' => 400 )
					);
				}
				$service = $this->get_service( 'adsense' );
				return $service->accounts_sites->listAccountsSites( self::normalize_account_id( $data['accountID'] ) );
			case 'POST:sync-ad-blocking-recovery-tags':
				$settings = $this->get_settings()->get();
				if ( empty( $settings['accountID'] ) ) {
					return new WP_Error( 'module_not_connected', __( 'Module is not connected.', 'google-site-kit' ), array( 'status' => 500 ) );
				}
				$service = $this->get_service( 'adsense' );
				return $service->accounts->getAdBlockingRecoveryTag( self::normalize_account_id( $settings['accountID'] ) );
		}

		return parent::create_data_request( $data );
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
			case 'GET:accounts':
				$accounts = array_filter( $response->getAccounts(), array( self::class, 'is_account_not_closed' ) );
				return Sort::case_insensitive_list_sort(
					array_map( array( self::class, 'filter_account_with_ids' ), $accounts ),
					'displayName'
				);
			case 'GET:adunits':
				return array_map( array( self::class, 'filter_adunit_with_ids' ), $response->getAdUnits() );
			case 'GET:alerts':
				return $response->getAlerts();
			case 'GET:clients':
				return array_map( array( self::class, 'filter_client_with_ids' ), $response->getAdClients() );
			case 'GET:report':
				return $response;
			case 'GET:sites':
				return $response->getSites();
			case 'POST:sync-ad-blocking-recovery-tags':
				$this->ad_blocking_recovery_tag->set(
					array(
						'tag'                   => $response->getTag(),
						'error_protection_code' => $response->getErrorProtectionCode(),
					)
				);

				return new WP_REST_Response(
					array(
						'success' => true,
					)
				);
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Checks for the state of an Account, whether closed or not.
	 *
	 * @since 1.73.0
	 *
	 * @param Google_Model $account Account model.
	 * @return bool Whether the account is not closed.
	 */
	public static function is_account_not_closed( $account ) {
		return 'CLOSED' !== $account->getState();
	}

	/**
	 * Gets the service URL for the current account or signup if none.
	 *
	 * @since 1.25.0
	 *
	 * @return string
	 */
	protected function get_account_url() {
		$profile = $this->authentication->profile();
		$option  = $this->get_settings()->get();
		$query   = array(
			'source'     => 'site-kit',
			'utm_source' => 'site-kit',
			'utm_medium' => 'wordpress_signup',
			'url'        => rawurlencode( $this->context->get_reference_site_url() ),
		);

		if ( ! empty( $option['accountID'] ) ) {
			$url = sprintf( 'https://www.google.com/adsense/new/%s/home', $option['accountID'] );
		} else {
			$url = 'https://www.google.com/adsense/signup';
		}

		if ( $profile->has() ) {
			$query['authuser'] = $profile->get()['email'];
		}

		return add_query_arg( $query, $url );
	}

	/**
	 * Parses the orderby value of the data request into an array of earning orderby format.
	 *
	 * @since 1.15.0
	 *
	 * @param array|null $orderby Data request orderby value.
	 * @return string[] An array of reporting orderby strings.
	 */
	protected function parse_earnings_orderby( $orderby ) {
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

				return ( 'ASCENDING' === $order_def['sortOrder'] ? '+' : '-' ) . $order_def['fieldName'];
			},
			// When just object is passed we need to convert it to an array of objects.
			wp_is_numeric_array( $orderby ) ? $orderby : array( $orderby )
		);

		$results = array_filter( $results );
		$results = array_values( $results );

		return $results;
	}

	/**
	 * Gets an array of dates for the given named date range.
	 *
	 * @param string $date_range Named date range.
	 *                           E.g. 'last-28-days'.
	 *
	 * @return array|WP_Error Array of [startDate, endDate] or WP_Error if invalid named range.
	 */
	private function date_range_to_dates( $date_range ) {
		switch ( $date_range ) {
			case 'today':
				return array(
					gmdate( 'Y-m-d', strtotime( 'today' ) ),
					gmdate( 'Y-m-d', strtotime( 'today' ) ),
				);
			// Intentional fallthrough.
			case 'last-7-days':
			case 'last-14-days':
			case 'last-28-days':
			case 'last-90-days':
				return Date::parse_date_range( $date_range );
		}

		return new WP_Error( 'invalid_date_range', __( 'Invalid date range.', 'google-site-kit' ) );
	}

	/**
	 * Creates a new AdSense earning request for the current account, site and given arguments.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args {
	 *     Optional. Additional arguments.
	 *
	 *     @type array  $dimensions List of request dimensions. Default empty array.
	 *     @type array  $metrics    List of request metrics. Default empty array.
	 *     @type string $start_date Start date in 'Y-m-d' format. Default empty string.
	 *     @type string $end_date   End date in 'Y-m-d' format. Default empty string.
	 *     @type int    $row_limit  Limit of rows to return. Default none (will be skipped).
	 * }
	 * @return RequestInterface|WP_Error AdSense earning request instance.
	 */
	protected function create_adsense_earning_data_request( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions' => array(),
				'metrics'    => array(),
				'start_date' => '',
				'end_date'   => '',
				'limit'      => '',
				'sort'       => array(),
			)
		);

		$option     = $this->get_settings()->get();
		$account_id = $option['accountID'];
		if ( empty( $account_id ) ) {
			return new WP_Error( 'account_id_not_set', __( 'AdSense account ID not set.', 'google-site-kit' ) );
		}

		list( $start_year, $start_month, $start_day ) = explode( '-', $args['start_date'] );
		list( $end_year, $end_month, $end_day )       = explode( '-', $args['end_date'] );

		$opt_params = array(
			// In the AdSense API v2, date parameters require the individual pieces to be specified as integers.
			// See https://developers.google.com/adsense/management/reference/rest/v2/accounts.reports/generate.
			'dateRange'       => 'CUSTOM',
			'startDate.year'  => (int) $start_year,
			'startDate.month' => (int) $start_month,
			'startDate.day'   => (int) $start_day,
			'endDate.year'    => (int) $end_year,
			'endDate.month'   => (int) $end_month,
			'endDate.day'     => (int) $end_day,
			'languageCode'    => $this->context->get_locale( 'site', 'language-code' ),
			// Include default metrics only for backward-compatibility.
			'metrics'         => array( 'ESTIMATED_EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS' ),
		);

		if ( ! empty( $args['dimensions'] ) ) {
			$opt_params['dimensions'] = (array) $args['dimensions'];
		}

		if ( ! empty( $args['metrics'] ) ) {
			$opt_params['metrics'] = (array) $args['metrics'];
		}

		if ( ! empty( $args['sort'] ) ) {
			$opt_params['orderBy'] = (array) $args['sort'];
		}

		if ( ! empty( $args['limit'] ) ) {
			$opt_params['limit'] = (int) $args['limit'];
		}

		// @see https://developers.google.com/adsense/management/reporting/filtering?hl=en#OR
		$site_hostname         = URL::parse( $this->context->get_reference_site_url(), PHP_URL_HOST );
		$opt_params['filters'] = join(
			',',
			array_map(
				function ( $hostname ) {
					return 'DOMAIN_NAME==' . $hostname;
				},
				URL::permute_site_hosts( $site_hostname )
			)
		);

		return $this->get_service( 'adsense' )
			->accounts_reports
			->generate(
				self::normalize_account_id( $account_id ),
				$opt_params
			);
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		$idenfifier_args = array(
			'source' => 'site-kit',
			'url'    => $this->context->get_reference_site_url(),
		);

		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'AdSense', 'Service name', 'google-site-kit' ),
			'description' => __( 'Earn money by placing ads on your website. It’s free and easy.', 'google-site-kit' ),
			'order'       => 2,
			'homepage'    => add_query_arg( $idenfifier_args, 'https://adsense.google.com/start' ),
		);
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
		return array(
			'adsense' => new Google_Service_Adsense( $client ),
		);
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
	 * @since 1.9.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-adsense',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-adsense.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);
	}

	/**
	 * Registers the AdSense tag.
	 *
	 * @since 1.24.0
	 */
	private function register_tag() {
		// TODO: 'amp_story' support can be phased out in the long term.
		if ( is_singular( array( 'amp_story' ) ) ) {
			return;
		}

		$module_settings = $this->get_settings();
		$settings        = $module_settings->get();

		if ( $this->context->is_amp() ) {
			$tag = new AMP_Tag( $settings['clientID'], self::MODULE_SLUG );
			$tag->set_story_ad_slot_id( $settings['webStoriesAdUnit'] );
		} else {
			$tag = new Web_Tag( $settings['clientID'], self::MODULE_SLUG );
		}

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new WP_Query_404_Guard() );
		$tag->use_guard( new Tag_Guard( $module_settings ) );
		$tag->use_guard( new Auto_Ad_Guard( $module_settings ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( $tag->can_register() ) {
			$tag->register();
		}

		if ( ! $this->context->is_amp() ) {
			$ad_blocking_recovery_web_tag = new Ad_Blocking_Recovery_Web_Tag( $this->ad_blocking_recovery_tag, $settings['useAdBlockingRecoveryErrorSnippet'] );

			$ad_blocking_recovery_web_tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
			$ad_blocking_recovery_web_tag->use_guard( new WP_Query_404_Guard() );
			$ad_blocking_recovery_web_tag->use_guard( new Ad_Blocking_Recovery_Tag_Guard( $module_settings ) );
			$ad_blocking_recovery_web_tag->use_guard( new Tag_Environment_Type_Guard() );

			if ( $ad_blocking_recovery_web_tag->can_register() ) {
				$ad_blocking_recovery_web_tag->register();
			}
		}
	}

	/**
	 * Parses account ID, adds it to the model object and returns updated model.
	 *
	 * @since 1.36.0
	 *
	 * @param Google_Model $account Account model.
	 * @param string       $id_key Attribute name that contains account ID.
	 * @return \stdClass Updated model with _id attribute.
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
	 * Parses account and client IDs, adds it to the model object and returns updated model.
	 *
	 * @since 1.36.0
	 *
	 * @param Google_Model $client Client model.
	 * @param string       $id_key Attribute name that contains client ID.
	 * @return \stdClass Updated model with _id and _accountID attributes.
	 */
	public static function filter_client_with_ids( $client, $id_key = 'name' ) {
		$obj = $client->toSimpleObject();

		$matches = array();
		if ( preg_match( '#accounts/([^/]+)/adclients/([^/]+)#', $client[ $id_key ], $matches ) ) {
			$obj->_id        = $matches[2];
			$obj->_accountID = $matches[1]; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		return $obj;
	}

	/**
	 * Parses account, client and ad unit IDs, adds it to the model object and returns updated model.
	 *
	 * @since 1.36.0
	 *
	 * @param Google_Model $adunit Ad unit model.
	 * @param string       $id_key Attribute name that contains ad unit ID.
	 * @return \stdClass Updated model with _id, _clientID and _accountID attributes.
	 */
	public static function filter_adunit_with_ids( $adunit, $id_key = 'name' ) {
		$obj = $adunit->toSimpleObject();

		$matches = array();
		if ( preg_match( '#accounts/([^/]+)/adclients/([^/]+)/adunits/([^/]+)#', $adunit[ $id_key ], $matches ) ) {
			$obj->_id        = $matches[3];
			$obj->_clientID  = $matches[2]; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$obj->_accountID = $matches[1]; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		return $obj;
	}

	/**
	 * Normalizes account ID and returns it.
	 *
	 * @since 1.36.0
	 *
	 * @param string $account_id Account ID.
	 * @return string Updated account ID with "accounts/" prefix.
	 */
	public static function normalize_account_id( $account_id ) {
		return 'accounts/' . $account_id;
	}

	/**
	 * Normalizes ad client ID and returns it.
	 *
	 * @since 1.36.0
	 *
	 * @param string $account_id Account ID.
	 * @param string $client_id  Ad client ID.
	 * @return string Account ID and ad client ID in "accounts/{accountID}/adclients/{clientID}" format.
	 */
	public static function normalize_client_id( $account_id, $client_id ) {
		return 'accounts/' . $account_id . '/adclients/' . $client_id;
	}

	/**
	 * Outputs the Adsense for Platforms meta tags.
	 *
	 * @since 1.43.0
	 */
	private function render_platform_meta_tags() {
		printf( "\n<!-- %s -->\n", esc_html__( 'Google AdSense snippet added by Site Kit', 'google-site-kit' ) );
		echo '<meta name="google-adsense-platform-account" content="ca-host-pub-2644536267352236">';
		echo "\n";
		echo '<meta name="google-adsense-platform-domain" content="sitekit.withgoogle.com">';
		printf( "\n<!-- %s -->\n", esc_html__( 'End Google AdSense snippet added by Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Checks if the current user has access to the current configured service entity.
	 *
	 * @since 1.70.0
	 *
	 * @return boolean|WP_Error
	 */
	public function check_service_entity_access() {
		$data_request = array(
			'start_date' => gmdate( 'Y-m-d' ),
			'end_date'   => gmdate( 'Y-m-d' ),
			'limit'      => 1,
		);

		try {
			$request = $this->create_adsense_earning_data_request( $data_request );

			if ( is_wp_error( $request ) ) {
				return $request;
			}
		} catch ( Exception $e ) {
			if ( $e->getCode() === 403 ) {
				return false;
			}
			return $this->exception_to_error( $e );
		}

		return true;
	}

	/**
	 * Validates the report metrics for a shared request.
	 *
	 * @since 1.83.0
	 * @since 1.98.0 Renamed the method, and moved the check for being a shared request to the caller.
	 *
	 * @param string[] $metrics The metrics to validate.
	 * @throws Invalid_Report_Metrics_Exception Thrown if the metrics are invalid.
	 */
	protected function validate_shared_report_metrics( $metrics ) {
		$valid_metrics = apply_filters(
			'googlesitekit_shareable_adsense_metrics',
			array(
				'ESTIMATED_EARNINGS',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
				'PAGE_VIEWS_RPM',
			)
		);

		$invalid_metrics = array_diff( $metrics, $valid_metrics );

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
				$invalid_metrics[0]
			);

			throw new Invalid_Report_Metrics_Exception( $message );
		}
	}

	/**
	 * Validates the report dimensions for a shared request.
	 *
	 * @since 1.83.0
	 * @since 1.98.0 Renamed the method, and moved the check for being a shared request to the caller.
	 *
	 * @param string[] $dimensions The dimensions to validate.
	 * @throws Invalid_Report_Dimensions_Exception Thrown if the dimensions are invalid.
	 */
	protected function validate_shared_report_dimensions( $dimensions ) {
		$valid_dimensions = apply_filters(
			'googlesitekit_shareable_adsense_dimensions',
			array(
				'DATE',
			)
		);

		$invalid_dimensions = array_diff( $dimensions, $valid_dimensions );

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
				$invalid_dimensions[0]
			);

			throw new Invalid_Report_Dimensions_Exception( $message );
		}
	}

	/**
	 * Gets the Ad Blocking Recovery setup status label.
	 *
	 * @since 1.107.0
	 *
	 * @param string $setup_status The saved raw setting.
	 * @return string The status label based on the raw setting.
	 */
	private function get_ad_blocking_recovery_setup_status_label( $setup_status ) {
		switch ( $setup_status ) {
			case Settings::AD_BLOCKING_RECOVERY_SETUP_STATUS_TAG_PLACED:
				return __( 'Snippet is placed', 'google-site-kit' );
			case Settings::AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED:
				return __( 'Setup complete', 'google-site-kit' );
			default:
				return __( 'Not set up', 'google-site-kit' );
		}
	}
}
