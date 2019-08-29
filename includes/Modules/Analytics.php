<?php
/**
 * Class Google\Site_Kit\Modules\Analytics
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Screen_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Util\AMP_Trait;
use Google_Client;
use Google_Service;
use Google_Service_Exception;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use WP_Error;
use Exception;

/**
 * Class representing the Analytics module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Analytics extends Module implements Module_With_Screen, Module_With_Scopes {
	use Module_With_Screen_Trait, Module_With_Scopes_Trait, AMP_Trait;

	const OPTION = 'googlesitekit_analytics_settings';

	/**
	 * Temporary storage for existing analytics tag found.
	 *
	 * @since 1.0.0
	 * @var string|null
	 */
	private $_existing_tag_account = false;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		$this->register_screen_hook();

		add_filter(
			'option_' . self::OPTION,
			function( $option ) {
				$option = (array) $option;

				/**
				 * Filters the Google Analytics account ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $account_id Empty by default, will fall back to the option value if not set.
				 */
				$account_id = apply_filters( 'googlesitekit_analytics_account_id', '' );
				if ( ! empty( $account_id ) ) {
					$option['accountId'] = $account_id;
				}

				/**
				 * Filters the Google Analytics property ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $property_id Empty by default, will fall back to the option value if not set.
				 */
				$property_id = apply_filters( 'googlesitekit_analytics_property_id', '' );
				if ( ! empty( $property_id ) ) {
					$option['propertyId'] = $property_id;
				}

				/**
				 * Filters the Google Analytics internal web property ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $internal_web_property_id Empty by default, will fall back to the option value if not set.
				 */
				$internal_web_property_id = apply_filters( 'googlesitekit_analytics_internal_web_property_id', '' );
				if ( ! empty( $internal_web_property_id ) ) {
					$option['internalWebPropertyId'] = $internal_web_property_id;
				}

				/**
				 * Filters the Google Analytics profile / view ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $profile_id Empty by default, will fall back to the option value if not set.
				 */
				$profile_id = apply_filters( 'googlesitekit_analytics_view_id', '' );
				if ( ! empty( $profile_id ) ) {
					$option['profileId'] = $profile_id;
				}

				return $option;
			}
		);

		// This filter only exists to be unhooked by the AdSense module if active.
		add_filter( 'option_googlesitekit_analytics_adsense_linked', '__return_false' );

		add_action( // For non-AMP.
			'wp_enqueue_scripts',
			function() {
				$this->enqueue_gtag_js();
			}
		);

		$print_amp_gtag = function() {
			$this->print_amp_gtag();
		};
		add_action( 'wp_footer', $print_amp_gtag ); // For AMP Native and Transitional.
		add_action( 'amp_post_template_footer', $print_amp_gtag ); // For AMP Reader.

		$print_amp_client_id_optin = function() {
			$this->print_amp_client_id_optin();
		};
		add_action( 'wp_head', $print_amp_client_id_optin ); // For AMP Native and Transitional.
		add_action( 'amp_post_template_head', $print_amp_client_id_optin ); // For AMP Reader.

		add_filter( // Load amp-analytics component for AMP Reader.
			'amp_post_template_data',
			function( $data ) {
				return $this->amp_data_load_analytics_component( $data );
			}
		);
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
			'https://www.googleapis.com/auth/analytics',
			'https://www.googleapis.com/auth/analytics.readonly',
			'https://www.googleapis.com/auth/analytics.manage.users',
			'https://www.googleapis.com/auth/analytics.edit',
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
			__( 'Top acquisition sources', 'google-site-kit' ),
		);

		$info['settings']                     = $this->get_data( 'connection' );
		$info['settings']['useSnippet']       = $this->get_data( 'use-snippet' );
		$info['settings']['ampClientIdOptIn'] = $this->get_data( 'amp-client-id-opt-in' );

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
		$connection = $this->get_data( 'connection' );
		if ( is_wp_error( $connection ) ) {
			return false;
		}

		foreach ( (array) $connection as $value ) {
			if ( empty( $value ) ) {
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
		$this->options->delete( self::OPTION );
		$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
	}

	/**
	 * Outputs gtag snippet.
	 *
	 * @since 1.0.0
	 */
	protected function enqueue_gtag_js() {
		// Bail early if we are checking for the tag presence from the back end.
		$tag_verify = ! empty( $_GET['tagverify'] ) ? true : false; // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
		if ( $tag_verify ) {
			return;
		}

		// On AMP, do not print the script tag.
		if ( $this->is_amp() ) {
			return;
		}

		$use_snippet = $this->get_data( 'use-snippet' );
		if ( is_wp_error( $use_snippet ) || ! $use_snippet ) {
			return;
		}

		$tracking_id = $this->get_data( 'property-id' );
		if ( is_wp_error( $tracking_id ) ) {
			return;
		}

		wp_enqueue_script( // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			'google_gtagjs',
			'https://www.googletagmanager.com/gtag/js?id=' . esc_attr( $tracking_id ),
			false,
			null,
			false
		);
		wp_script_add_data( 'google_gtagjs', 'script_execution', 'async' );

		wp_add_inline_script(
			'google_gtagjs',
			'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag(\'js\', new Date());'
		);

		$gtag_opt = array();

		$amp_client_id_optin = $this->get_data( 'amp-client-id-opt-in' );
		if ( ! is_wp_error( $amp_client_id_optin ) && $amp_client_id_optin ) {
			$gtag_opt = array( 'useAmpClientId' => true );
		}

		/**
		 * Filters the gtag configuration options for the Analytics snippet.
		 *
		 * You can use the {@see 'googlesitekit_amp_gtag_opt'} filter to do the same for gtag in AMP.
		 *
		 * @since 1.0.0
		 *
		 * @see https://developers.google.com/gtagjs/devguide/configure
		 *
		 * @param array $gtag_opt gtag config options.
		 */
		$gtag_opt = apply_filters( 'googlesitekit_gtag_opt', $gtag_opt );

		if ( empty( $gtag_opt ) ) {
			wp_add_inline_script(
				'google_gtagjs',
				'gtag(\'config\', \'' . esc_attr( $tracking_id ) . '\');'
			);
		} else {
			wp_add_inline_script(
				'google_gtagjs',
				'gtag(\'config\', \'' . esc_attr( $tracking_id ) . '\', ' . wp_json_encode( $gtag_opt ) . ' );'
			);
		}
	}

	/**
	 * Outputs gtag <amp-analytics> tag.
	 *
	 * @since 1.0.0
	 */
	protected function print_amp_gtag() {
		// Bail early if we are checking for the tag presence from the back end.
		$tag_verify = ! empty( $_GET['tagverify'] ) ? true : false; // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
		if ( $tag_verify ) {
			return;
		}

		if ( ! $this->is_amp() ) {
			return;
		}

		$use_snippet = $this->get_data( 'use-snippet' );
		if ( is_wp_error( $use_snippet ) || ! $use_snippet ) {
			return;
		}

		$tracking_id = $this->get_data( 'property-id' );
		if ( is_wp_error( $tracking_id ) ) {
			return;
		}

		$gtag_amp_opt = array(
			'vars' => array(
				'gtag_id' => $tracking_id,
				'config'  => array(
					$tracking_id => array(
						'groups' => 'default',
					),
				),
			),
		);

		/**
		 * Filters the gtag configuration options for the amp-analytics tag.
		 *
		 * You can use the {@see 'googlesitekit_gtag_opt'} filter to do the same for gtag in non-AMP.
		 *
		 * @since 1.0.0
		 *
		 * @see https://developers.google.com/gtagjs/devguide/amp
		 *
		 * @param array $gtag_amp_opt gtag config options for AMP.
		 */
		$gtag_amp_opt_filtered = apply_filters( 'googlesitekit_amp_gtag_opt', $gtag_amp_opt );

		// Ensure gtag_id is set to the correct value.
		if ( ! is_array( $gtag_amp_opt_filtered ) ) {
			$gtag_amp_opt_filtered = $gtag_amp_opt;
		}

		if ( ! isset( $gtag_amp_opt_filtered['vars'] ) || ! is_array( $gtag_amp_opt_filtered['vars'] ) ) {
			$gtag_amp_opt_filtered['vars'] = $gtag_amp_opt['vars'];
		}

		$gtag_amp_opt_filtered['vars']['gtag_id'] = $tracking_id;
		?>
		<amp-analytics type="gtag" data-credentials="include">
			<script type="application/json">
				<?php echo wp_json_encode( $gtag_amp_opt_filtered ); ?>
			</script>
		</amp-analytics>
		<?php
	}

	/**
	 * Adds an additional meta tag for AMP content if opted in.
	 *
	 * @since 1.0.0
	 */
	protected function print_amp_client_id_optin() {
		if ( ! $this->is_amp() ) {
			return;
		}

		$use_snippet = $this->get_data( 'use-snippet' );
		if ( is_wp_error( $use_snippet ) || ! $use_snippet ) {
			return;
		}

		$amp_client_id_optin = $this->get_data( 'amp-client-id-opt-in' );
		if ( is_wp_error( $amp_client_id_optin ) || ! $amp_client_id_optin ) {
			return;
		}

		echo '<meta name="amp-google-client-id-api" content="googleanalytics">';
	}

	/**
	 * Loads AMP analytics script if opted in.
	 *
	 * This only affects AMP Reader mode, the others are automatically covered.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data AMP template data.
	 * @return array Filtered $data.
	 */
	protected function amp_data_load_analytics_component( $data ) {
		if ( isset( $data['amp_component_scripts']['amp-analytics'] ) ) {
			return $data;
		}

		$use_snippet = $this->get_data( 'use-snippet' );
		if ( is_wp_error( $use_snippet ) || ! $use_snippet ) {
			return $data;
		}

		$tracking_id = $this->get_data( 'property-id' );
		if ( is_wp_error( $tracking_id ) ) {
			return $data;
		}

		$data['amp_component_scripts']['amp-analytics'] = 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js';
		return $data;
	}

	/**
	 * Returns the mapping between available datapoints and their services.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of $datapoint => $service_identifier pairs.
	 */
	protected function get_datapoint_services() {
		return array(
			// GET / POST.
			'connection'               => '',
			'account-id'               => '',
			'property-id'              => '',
			'profile-id'               => '',
			'internal-web-property-id' => '',
			'use-snippet'              => '',
			'amp-client-id-opt-in'     => '',
			// GET.
			'goals'                    => 'analytics',
			'get-accounts'             => 'analytics',
			'get-properties'           => 'analytics',
			'get-profiles'             => 'analytics',
			'tag-permission'           => '',
			'adsense'                  => 'analyticsreporting',
			'site-analytics'           => 'analyticsreporting',
			'top-pages'                => 'analyticsreporting',
			'overview'                 => 'analyticsreporting',
			'traffic-sources'          => 'analyticsreporting',
			// POST.
			'save'                     => '',
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param string $method    Request method. Either 'GET' or 'POST'.
	 * @param string $datapoint Datapoint to get request object for.
	 * @param array  $data      Optional. Contextual data to provide or set. Default empty array.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 */
	protected function create_data_request( $method, $datapoint, array $data = array() ) {
		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'connection':
					return function() {
						$defaults = array(
							'accountId'             => '',
							'propertyId'            => '',
							'profileId'             => '',
							'internalWebPropertyId' => '',
						);
						return array_intersect_key( array_merge( $defaults, (array) $this->options->get( self::OPTION ) ), $defaults );
					};
				case 'account-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						if ( empty( $option['accountId'] ) ) {
							return new WP_Error( 'account_id_not_set', __( 'Analytics account ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['accountId'];
					};
				case 'property-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						if ( empty( $option['propertyId'] ) ) {
							return new WP_Error( 'property_id_not_set', __( 'Analytics property ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['propertyId'];
					};
				case 'profile-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						if ( empty( $option['profileId'] ) ) {
							return new WP_Error( 'profile_id_not_set', __( 'Analytics profile ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['profileId'];
					};
				case 'internal-web-property-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						if ( empty( $option['internalWebPropertyId'] ) ) {
							return new WP_Error( 'internal_web_property_id_not_set', __( 'Analytics internal web property ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['internalWebPropertyId'];
					};
				case 'use-snippet':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						return ! empty( $option['useSnippet'] );
					};
				case 'amp-client-id-opt-in':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						if ( ! isset( $option['ampClientIdOptIn'] ) ) {
							return true; // Default to true.
						}
						return ! empty( $option['ampClientIdOptIn'] );
					};
				case 'goals':
					$connection = $this->get_data( 'connection' );
					if (
						empty( $connection['accountId'] ) ||
						empty( $connection['internalWebPropertyId'] ) ||
						empty( $connection['profileId'] )
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
					return $service->management_goals->listManagementGoals( $connection['accountId'], $connection['propertyId'], $connection['profileId'] );
				case 'get-accounts':
					if ( ! empty( $data['existingAccountId'] ) && ! empty( $data['existingPropertyId'] ) ) {
						$this->_existing_tag_account = array(
							'accountId'  => $data['existingAccountId'],
							'propertyId' => $data['existingPropertyId'],
						);
					}
					$service = $this->get_service( 'analytics' );
					return $service->management_accounts->listManagementAccounts();
				case 'get-properties':
					if ( ! isset( $data['accountId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountId' ), array( 'status' => 400 ) );
					}
					$service = $this->get_service( 'analytics' );
					return $service->management_webproperties->listManagementWebproperties( $data['accountId'] );
				case 'get-profiles':
					if ( ! isset( $data['accountId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountId' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['propertyId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyId' ), array( 'status' => 400 ) );
					}
					$service = $this->get_service( 'analytics' );
					return $service->management_profiles->listManagementProfiles( $data['accountId'], $data['propertyId'] );
				case 'tag-permission':
					return function() use ( $data ) {
						if ( ! isset( $data['tag'] ) ) {
							return new WP_Error(
								'missing_required_param',
								/* translators: %s: Missing parameter name */
								sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'tag' ),
								array( 'status' => 400 )
							);
						}
						$accounts               = $this->get_data( 'get-accounts' );
						$has_access_to_property = $this->has_access_to_property( $data['tag'], $accounts['accounts'] );

						if ( empty( $has_access_to_property ) ) {
							return new WP_Error(
								'google_analytics_existing_tag_permission',
								sprintf(
									/* translators: %s: Property id of the existing tag */
									__( 'We\'ve detected there\'s already an existing Analytics tag on your site (ID %s), but your account doesn\'t seem to have access to this Analytics property. You can either remove the existing tag and connect to a different account, or request access to this property from your team.', 'google-site-kit' ),
									$data['tag']
								),
								array( 'status' => 403 )
							);
						}

						return $has_access_to_property;
					};
				case 'adsense':
					// Date range.
					$date_range = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range = $this->parse_date_range( $date_range );
					// Dimensions.
					$title_dimension = new \Google_Service_AnalyticsReporting_Dimension();
					$title_dimension->setName( 'ga:pageTitle' );
					$path_dimension = new \Google_Service_AnalyticsReporting_Dimension();
					$path_dimension->setName( 'ga:pagePath' );
					$request = $this->create_analytics_site_data_request(
						array(
							'dimensions' => array( $title_dimension, $path_dimension ),
							'start_date' => $date_range[0],
							'end_date'   => $date_range[1],
							'page'       => ! empty( $data['pageUrl'] ) ? $data['pageUrl'] : ( ! empty( $data['permaLink'] ) ? $data['permaLink'] : '' ),
							'row_limit'  => isset( $data['limit'] ) ? $data['limit'] : 10,
						)
					);
					if ( is_wp_error( $request ) ) {
						return $request;
					}
					// Metrics.
					$adsense_revenue = new \Google_Service_AnalyticsReporting_Metric();
					$adsense_revenue->setExpression( 'ga:adsenseRevenue' );
					$adsense_revenue->setAlias( 'Earnings' );
					$adsense_ecpm = new \Google_Service_AnalyticsReporting_Metric();
					$adsense_ecpm->setExpression( 'ga:adsenseECPM' );
					$adsense_ecpm->setAlias( 'Page RPM' );
					$impressions = new \Google_Service_AnalyticsReporting_Metric();
					$impressions->setExpression( 'ga:adsensePageImpressions' );
					$impressions->setAlias( 'Impressions' );
					$request->setMetrics( array( $adsense_revenue, $adsense_ecpm, $impressions ) );
					// Order by.
					$orderby = new \Google_Service_AnalyticsReporting_OrderBy();
					$orderby->setFieldName( 'ga:adsenseRevenue' );
					$orderby->setSortOrder( 'DESCENDING' );
					$request->setOrderBys( $orderby );
					// Reports batch requests.
					$body = new \Google_Service_AnalyticsReporting_GetReportsRequest();
					$body->setReportRequests( array( $request ) );
					$service = $this->get_service( 'analyticsreporting' );
					return $service->reports->batchGet( $body );
				case 'site-analytics':
					// Date range.
					$date_range = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range = $this->parse_date_range( $date_range, 2 );
					// Dimensions.
					$date_dimension = new \Google_Service_AnalyticsReporting_Dimension();
					$date_dimension->setName( 'ga:date' );
					$request = $this->create_analytics_site_data_request(
						array(
							'dimensions' => array( $date_dimension ),
							'start_date' => $date_range[0],
							'end_date'   => $date_range[1],
							'page'       => ! empty( $data['permaLink'] ) ? $data['permaLink'] : '',
							'row_limit'  => isset( $data['limit'] ) ? $data['limit'] : 180,
						)
					);
					if ( is_wp_error( $request ) ) {
						return $request;
					}
					// Metrics.
					$users = new \Google_Service_AnalyticsReporting_Metric();
					$users->setExpression( 'ga:users' );
					$users->setAlias( 'Users' );
					$sessions = new \Google_Service_AnalyticsReporting_Metric();
					$sessions->setExpression( 'ga:sessions' );
					$sessions->setAlias( 'Sessions' );
					$bounce_rate = new \Google_Service_AnalyticsReporting_Metric();
					$bounce_rate->setExpression( 'ga:bounceRate' );
					$bounce_rate->setAlias( 'Bounce Rate' );
					$session_duration = new \Google_Service_AnalyticsReporting_Metric();
					$session_duration->setExpression( 'ga:avgSessionDuration' );
					$session_duration->setAlias( 'Average Session Duration' );
					$goals_completed = new \Google_Service_AnalyticsReporting_Metric();
					$goals_completed->setExpression( 'ga:goalCompletionsAll' );
					$goals_completed->setAlias( 'Goal Completions' );
					$request->setMetrics( array( $sessions, $users, $bounce_rate, $session_duration, $goals_completed ) );
					// Reports batch requests.
					$body = new \Google_Service_AnalyticsReporting_GetReportsRequest();
					$body->setReportRequests( array( $request ) );
					$service = $this->get_service( 'analyticsreporting' );
					return $service->reports->batchGet( $body );
				case 'top-pages':
					// Date range.
					$date_range = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range = $this->parse_date_range( $date_range );
					// Dimensions.
					$title_dimension = new \Google_Service_AnalyticsReporting_Dimension();
					$title_dimension->setName( 'ga:pageTitle' );
					$path_dimension = new \Google_Service_AnalyticsReporting_Dimension();
					$path_dimension->setName( 'ga:pagePath' );
					$request = $this->create_analytics_site_data_request(
						array(
							'dimensions' => array( $path_dimension, $title_dimension ),
							'start_date' => $date_range[0],
							'end_date'   => $date_range[1],
							'page'       => ! empty( $data['permaLink'] ) ? $data['permaLink'] : '',
							'row_limit'  => isset( $data['limit'] ) ? $data['limit'] : 10,
						)
					);
					if ( is_wp_error( $request ) ) {
						return $request;
					}
					// Metrics.
					$pageviews = new \Google_Service_AnalyticsReporting_Metric();
					$pageviews->setExpression( 'ga:pageviews' );
					$pageviews->setAlias( 'Pageviews' );
					$unique_pageviews = new \Google_Service_AnalyticsReporting_Metric();
					$unique_pageviews->setExpression( 'ga:uniquePageviews' );
					$unique_pageviews->setAlias( 'Unique Pageviews' );
					$bounce_rate = new \Google_Service_AnalyticsReporting_Metric();
					$bounce_rate->setExpression( 'ga:bounceRate' );
					$bounce_rate->setAlias( 'Bounce rate' );
					$metrics = array( $pageviews, $unique_pageviews, $bounce_rate );
					if ( $this->options->get( 'googlesitekit_analytics_adsense_linked' ) ) {
						$adsense_revenue = new \Google_Service_AnalyticsReporting_Metric();
						$adsense_revenue->setExpression( 'ga:adsenseRevenue' );
						$adsense_revenue->setAlias( 'AdSense Revenue' );
						array_push( $metrics, $adsense_revenue );
						$adsense_ecpm = new \Google_Service_AnalyticsReporting_Metric();
						$adsense_ecpm->setExpression( 'ga:adsenseECPM' );
						$adsense_ecpm->setAlias( 'AdSense ECPM' );
						array_push( $metrics, $adsense_ecpm );
					}
					$request->setMetrics( $metrics );
					// Order by.
					$orderby = new \Google_Service_AnalyticsReporting_OrderBy();
					$orderby->setFieldName( 'ga:pageviews' );
					$orderby->setSortOrder( 'DESCENDING' );
					$request->setOrderBys( $orderby );
					// Reports batch requests.
					$body = new \Google_Service_AnalyticsReporting_GetReportsRequest();
					$body->setReportRequests( array( $request ) );
					$service = $this->get_service( 'analyticsreporting' );
					return $service->reports->batchGet( $body );
				case 'overview':
					$request = $this->create_analytics_site_data_request(
						array(
							'page'      => ! empty( $data['permaLink'] ) ? $data['permaLink'] : '',
							'row_limit' => isset( $data['limit'] ) ? $data['limit'] : 10,
						)
					);
					if ( is_wp_error( $request ) ) {
						return $request;
					}
					// Date range (custom here because of two ranges).
					$date_range      = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range2     = $this->parse_date_range( $date_range, 1, 1, true );
					$date_range      = $this->parse_date_range( $date_range );
					$date_range2[1]  = $date_range[0];
					$date_range_inst = new \Google_Service_AnalyticsReporting_DateRange();
					$date_range_inst->setStartDate( $date_range[0] );
					$date_range_inst->setEndDate( $date_range[1] );
					$date_range2_inst = new \Google_Service_AnalyticsReporting_DateRange();
					$date_range2_inst->setStartDate( $date_range2[0] );
					$date_range2_inst->setEndDate( $date_range2[1] );
					$request->setDateRanges( array( $date_range_inst, $date_range2_inst ) );
					// Metrics.
					$users = new \Google_Service_AnalyticsReporting_Metric();
					$users->setExpression( 'ga:users' );
					$users->setAlias( 'Users' );
					$sessions = new \Google_Service_AnalyticsReporting_Metric();
					$sessions->setExpression( 'ga:sessions' );
					$sessions->setAlias( 'Sessions' );
					$bounce_rate = new \Google_Service_AnalyticsReporting_Metric();
					$bounce_rate->setExpression( 'ga:bounceRate' );
					$bounce_rate->setAlias( 'Bounce Rate' );
					$session_duration = new \Google_Service_AnalyticsReporting_Metric();
					$session_duration->setExpression( 'ga:avgSessionDuration' );
					$session_duration->setAlias( 'Average Session Duration' );
					$goals_completed = new \Google_Service_AnalyticsReporting_Metric();
					$goals_completed->setExpression( 'ga:goalCompletionsAll' );
					$goals_completed->setAlias( 'Goal Completions' );
					$pageviews = new \Google_Service_AnalyticsReporting_Metric();
					$pageviews->setExpression( 'ga:pageviews' );
					$pageviews->setAlias( 'Pageviews' );
					$request->setMetrics( array( $users, $sessions, $bounce_rate, $session_duration, $goals_completed, $pageviews ) );
					// Reports batch requests.
					$body = new \Google_Service_AnalyticsReporting_GetReportsRequest();
					$body->setReportRequests( array( $request ) );
					$service = $this->get_service( 'analyticsreporting' );
					return $service->reports->batchGet( $body );
				case 'traffic-sources':
					// Date range.
					$date_range = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range = $this->parse_date_range( $date_range );
					// Dimensions.
					$medium_dimension = new \Google_Service_AnalyticsReporting_Dimension();
					$medium_dimension->setName( 'ga:medium' );
					$request = $this->create_analytics_site_data_request(
						array(
							'dimensions' => array( $medium_dimension ),
							'start_date' => $date_range[0],
							'end_date'   => $date_range[1],
							'page'       => ! empty( $data['permaLink'] ) ? $data['permaLink'] : '',
							'row_limit'  => isset( $data['limit'] ) ? $data['limit'] : 10,
						)
					);
					if ( is_wp_error( $request ) ) {
						return $request;
					}
					// Metrics.
					$sessions = new \Google_Service_AnalyticsReporting_Metric();
					$sessions->setExpression( 'ga:sessions' );
					$sessions->setAlias( 'Sessions' );
					$users = new \Google_Service_AnalyticsReporting_Metric();
					$users->setExpression( 'ga:users' );
					$users->setAlias( 'Users' );
					$new_users = new \Google_Service_AnalyticsReporting_Metric();
					$new_users->setExpression( 'ga:newUsers' );
					$new_users->setAlias( 'New Users' );
					$request->setMetrics( array( $sessions, $users, $new_users ) );
					// Order by.
					$orderby = new \Google_Service_AnalyticsReporting_OrderBy();
					$orderby->setFieldName( 'ga:sessions' );
					$orderby->setSortOrder( 'DESCENDING' );
					$request->setOrderBys( $orderby );
					// Reports batch requests.
					$body = new \Google_Service_AnalyticsReporting_GetReportsRequest();
					$body->setReportRequests( array( $request ) );
					$service = $this->get_service( 'analyticsreporting' );
					return $service->reports->batchGet( $body );
			}
		} elseif ( 'POST' === $method ) {
			switch ( $datapoint ) {
				case 'connection':
					return function() use ( $data ) {
						$option = (array) $this->options->get( self::OPTION );
						$keys   = array( 'accountId', 'propertyId', 'profileId', 'internalWebPropertyId' );
						foreach ( $keys as $key ) {
							if ( isset( $data[ $key ] ) ) {
								$option[ $key ] = $data[ $key ];
							}
						}
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return true;
					};
				case 'account-id':
					if ( ! isset( $data['accountId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountId' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option              = (array) $this->options->get( self::OPTION );
						$option['accountId'] = $data['accountId'];
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return true;
					};
				case 'property-id':
					if ( ! isset( $data['propertyId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyId' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option               = (array) $this->options->get( self::OPTION );
						$option['propertyId'] = $data['propertyId'];
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return true;
					};
				case 'profile-id':
					if ( ! isset( $data['profileId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'profileId' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option              = (array) $this->options->get( self::OPTION );
						$option['profileId'] = $data['profileId'];
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return true;
					};
				case 'internal-web-property-id':
					if ( ! isset( $data['internalWebPropertyId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'internalWebPropertyId' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option                          = (array) $this->options->get( self::OPTION );
						$option['internalWebPropertyId'] = $data['internalWebPropertyId'];
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return true;
					};
				case 'use-snippet':
					if ( ! isset( $data['useSnippet'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'useSnippet' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option               = (array) $this->options->get( self::OPTION );
						$option['useSnippet'] = (bool) $data['useSnippet'];
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'amp-client-id-opt-in':
					if ( ! isset( $data['ampClientIdOptIn'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'ampClientIdOptIn' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option                     = (array) $this->options->get( self::OPTION );
						$option['ampClientIdOptIn'] = (bool) $data['ampClientIdOptIn'];
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'save':
					if ( ! isset( $data['accountId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountId' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['propertyId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyId' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['internalWebPropertyId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'internalWebPropertyId' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['profileId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'profileId' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['useSnippet'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'useSnippet' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$property_id              = null;
						$internal_web_property_id = null;
						$property_name            = '';
						if ( '0' === $data['propertyId'] ) {
							$is_new_property = true;
							$client          = $this->get_client();
							$orig_defer      = $client->shouldDefer();
							$client->setDefer( false );
							$property = new \Google_Service_Analytics_Webproperty();
							$property->setName( wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST ) );
							try {
								$property = $this->get_service( 'analytics' )->management_webproperties->insert( $data['accountId'], $property );
							} catch ( Google_Service_Exception $e ) {
								$client->setDefer( $orig_defer );
								$message = $e->getErrors();
								if ( isset( $message[0] ) && isset( $message[0]['message'] ) ) {
									$message = $message[0]['message'];
								}
								return new WP_Error( $e->getCode(), $message );
							} catch ( Exception $e ) {
								$client->setDefer( $orig_defer );
								return new WP_Error( $e->getCode(), $e->getMessage() );
							}
							$client->setDefer( $orig_defer );
							$property_id              = $property->id;
							$internal_web_property_id = $property->internalWebPropertyId; // phpcs:ignore WordPress.NamingConventions.ValidVariableName
						} else {
							$is_new_property          = false;
							$property_id              = $data['propertyId'];
							$internal_web_property_id = $data['internalWebPropertyId'];
						}
						$profile_id = null;
						if ( '0' === $data['profileId'] ) {
							$client     = $this->get_client();
							$orig_defer = $client->shouldDefer();
							$client->setDefer( false );
							$profile = new \Google_Service_Analytics_Profile();
							$profile->setName( __( 'All Web Site Data', 'google-site-kit' ) );
							try {
								$profile = $this->get_service( 'analytics' )->management_profiles->insert( $data['accountId'], $property_id, $profile );
							} catch ( Google_Service_Exception $e ) {
								$client->setDefer( $orig_defer );
								$message = $e->getErrors();
								if ( isset( $message[0] ) && isset( $message[0]['message'] ) ) {
									$message = $message[0]['message'];
								}
								return new WP_Error( $e->getCode(), $message );
							} catch ( Exception $e ) {
								$client->setDefer( $orig_defer );
								return new WP_Error( $e->getCode(), $e->getMessage() );
							}
							$client->setDefer( $orig_defer );
							$profile_id = $profile->id;
						} else {
							$profile_id = $data['profileId'];
						}
						// Set default profile for new property.
						if ( $is_new_property ) {
							$client     = $this->get_client();
							$orig_defer = $client->shouldDefer();
							$client->setDefer( false );
							$property = new \Google_Service_Analytics_Webproperty();
							$property->setDefaultProfileId( $profile_id );
							try {
								$property = $this->get_service( 'analytics' )->management_webproperties->patch( $data['accountId'], $property_id, $property );
							} catch ( Google_Service_Exception $e ) {
								$client->setDefer( $orig_defer );
								$message = $e->getErrors();
								if ( isset( $message[0] ) && isset( $message[0]['message'] ) ) {
									$message = $message[0]['message'];
								}
								return new WP_Error( $e->getCode(), $message );
							} catch ( Exception $e ) {
								$client->setDefer( $orig_defer );
								return new WP_Error( $e->getCode(), $e->getMessage() );
							}
							$client->setDefer( $orig_defer );
						}
						$option = array(
							'accountId'             => $data['accountId'],
							'propertyId'            => $property_id,
							'internalWebPropertyId' => $internal_web_property_id,
							'profileId'             => $profile_id,
							'useSnippet'            => ! empty( $data['useSnippet'] ),
							'ampClientIdOptIn'      => ! empty( $data['ampClientIdOptIn'] ),
						);
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return $option;
					};
			}
		}

		return new WP_Error( 'invalid_datapoint', __( 'Invalid datapoint.', 'google-site-kit' ) );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param string $method    Request method. Either 'GET' or 'POST'.
	 * @param string $datapoint Datapoint to resolve response for.
	 * @param mixed  $response  Response object or array.
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( $method, $datapoint, $response ) {
		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'goals':
					if ( is_array( $response ) ) {
						return $response;
					}
					// TODO: Parse this response to a regular array.
					break;
				case 'get-accounts':
					$response = array(
						// TODO: Parse this response to a regular array.
						'accounts'   => $response->getItems(),
						'properties' => array(),
						'profiles'   => array(),
					);

					$found_account_id = false;
					$matched_property = false;
					$existing_tag     = $this->_existing_tag_account;

					$this->_existing_tag_account = null; // Set back to null.

					if ( empty( $existing_tag ) ) {
						$account_id = $this->get_data( 'account-id' );
						if ( ! is_wp_error( $account_id ) ) {
							foreach ( $response['accounts'] as $account ) {
								if ( $account->getId() === $account_id ) {
									$found_account_id = $account->getId();
									break;
								}
							}
						} else {
							$current_url = untrailingslashit( $this->context->get_reference_site_url() );
							$urls        = $this->permute_site_url( $current_url );
							foreach ( $response['accounts'] as $account ) {
								$properties = $this->get_data( 'get-properties', array( 'accountId' => $account->getId() ) );
								if ( is_wp_error( $properties ) ) {
									continue;
								}
								$url_matches = array_filter(
									$properties['properties'],
									function( $property ) use ( $urls ) {
										return in_array( untrailingslashit( $property->getWebsiteUrl() ), $urls, true );
									}
								);
								if ( ! empty( $url_matches ) ) {
									$found_account_id = $account->getId();
									$matched_property = $url_matches;
									break;
								}
							}
						}
					} else {
						$found_account_id = $existing_tag['accountId'];
					}

					if ( empty( $found_account_id ) ) {
						return $response;
					}

					$properties = $this->get_data( 'get-properties', array( 'accountId' => $found_account_id ) );
					if ( is_wp_error( $properties ) ) {
						return $response;
					}

					$result = array_merge( $response, $properties );

					// Get matched property from exiting tag property id.
					if ( ! empty( $existing_tag ) ) {
						$matched_property = array_filter(
							$properties['properties'],
							function( $property ) use ( $existing_tag ) {
								return $property->getId() === $existing_tag['propertyId'];
							}
						);
					}

					if ( ! empty( $matched_property ) ) {
						$result = array_merge( $result, array( 'matchedProperty' => array_shift( $matched_property ) ) );
					}

					return $result;
				case 'get-properties':
					$response = array(
						// TODO: Parse this response to a regular array.
						'properties' => $response->getItems(),
						'profiles'   => array(),
					);
					if ( 0 === count( $response['properties'] ) ) {
						return new WP_Error( 'google_analytics_properties_empty', __( 'No Google Analytics properties found. Please go to Google Anlytics to set one up.', 'google-site-kit' ), array( 'status' => 500 ) );
					}
					$found_account_id  = false;
					$found_property_id = false;
					$property_id       = $this->get_data( 'property-id' );
					if ( ! is_wp_error( $property_id ) ) {
						foreach ( $response['properties'] as $property ) {
							if ( $property->getId() === $property_id ) {
								$found_account_id  = $property->getAccountId();
								$found_property_id = $property->getId();
								break;
							}
						}
					}
					if ( empty( $found_account_id ) || empty( $found_property_id ) ) {
						$found_account_id  = $response['properties'][0]->getAccountId();
						$found_property_id = $response['properties'][0]->getId();
					}
					$profiles = $this->get_data(
						'get-profiles',
						array(
							'accountId'  => $found_account_id,
							'propertyId' => $found_property_id,
						)
					);
					if ( is_wp_error( $profiles ) ) {
						return $profiles;
					}
					$response['profiles'] = $profiles;
					return $response;
				case 'get-profiles':
					// TODO: Parse this response to a regular array.
					$response = $response->getItems();
					if ( 0 === count( $response ) ) {
						return new WP_Error( 'google_analytics_profiles_empty', __( 'No Google Analytics profiles found. Please go to Google Anlytics to set one up.', 'google-site-kit' ), array( 'status' => 500 ) );
					}
					return $response;
				case 'adsense':
					if ( isset( $response->error ) ) {
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
					} else {
						$this->options->set( 'googlesitekit_analytics_adsense_linked', '1' );
					}
					// TODO: Parse this response to a regular array.
					return $response->getReports();
				case 'site-analytics':
				case 'top-pages':
				case 'overview':
				case 'traffic-sources':
					// TODO: Parse this response to a regular array.
					return $response->getReports();
			}
		}

		return $response;
	}

	/**
	 * Creates a new Analytics site request for the current site and given arguments.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args {
	 *     Optional. Additional arguments.
	 *
	 *     @type array  $dimensions List of request dimensions. Default empty array.
	 *     @type string $start_date Start date in 'Y-m-d' format. Default empty string.
	 *     @type string $end_date   End date in 'Y-m-d' format. Default empty string.
	 *     @type string $page       Specific page URL to filter by. Default empty string.
	 *     @type int    $row_limit  Limit of rows to return. Default 100.
	 * }
	 * @return RequestInterface|WP_Error Analytics site request instance.
	 */
	protected function create_analytics_site_data_request( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions' => array(),
				'start_date' => '',
				'end_date'   => '',
				'page'       => '',
				'row_limit'  => 100,
			)
		);

		$profile_id = $this->get_data( 'profile-id' );
		if ( is_wp_error( $profile_id ) ) {
			return $profile_id;
		}

		$request = new \Google_Service_AnalyticsReporting_ReportRequest();
		$request->setViewId( $profile_id );

		if ( ! empty( $args['dimensions'] ) ) {
			$request->setDimensions( (array) $args['dimensions'] );
		}

		if ( ! empty( $args['start_date'] ) && ! empty( $args['end_date'] ) ) {
			$date_range = new \Google_Service_AnalyticsReporting_DateRange();
			$date_range->setStartDate( $args['start_date'] );
			$date_range->setEndDate( $args['end_date'] );
			$request->setDateRanges( array( $date_range ) );
		}

		if ( ! empty( $args['page'] ) ) {
			$dimension_filter = new \Google_Service_AnalyticsReporting_DimensionFilter();
			$dimension_filter->setDimensionName( 'ga:pagePath' );
			$dimension_filter->setOperator( 'EXACT' );
			$args['page'] = str_replace( trim( $this->context->get_reference_site_url(), '/' ), '', $args['page'] );
			$dimension_filter->setExpressions( array( $args['page'] ) );
			$dimension_filter_clause = new \Google_Service_AnalyticsReporting_DimensionFilterClause();
			$dimension_filter_clause->setFilters( array( $dimension_filter ) );
			$request->setDimensionFilterClauses( array( $dimension_filter_clause ) );
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
			'name'        => __( 'Analytics', 'google-site-kit' ),
			'description' => __( 'Get a deeper understanding of your customers. Google Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ),
			'cta'         => __( 'Get to know your customers.', 'google-site-kit' ),
			'order'       => 3,
			'homepage'    => __( 'https://analytics.google.com/analytics/web', 'google-site-kit' ),
			'learn_more'  => __( 'https://marketingplatform.google.com/about/analytics/', 'google-site-kit' ),
			'group'       => __( 'Marketing Platform', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.0.0
	 *
	 * @param Google_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Client $client ) {
		return array(
			'analytics'          => new \Google_Service_Analytics( $client ),
			'analyticsreporting' => new \Google_Service_AnalyticsReporting( $client ),
		);
	}

	/**
	 * Verifies that user has access to the property found in the existing tag.
	 *
	 * @since 1.0.0
	 *
	 * @param string $property_id   Property found in the existing tag.
	 * @param array  $accounts      List of accounts to loop through properties.
	 * @return mixed False if user has no access to the existing property or array with account id and property found.
	 */
	protected function has_access_to_property( $property_id, $accounts ) {

		if ( empty( $property_id ) || empty( $accounts ) ) {
			return false;
		}

		$response = false;

		foreach ( $accounts as $account ) {
			$account_id = $account->getId();
			$properties = $this->get_data( 'get-properties', array( 'accountId' => $account_id ) );

			if ( is_wp_error( $properties ) ) {
				continue;
			}
			$existing_property_match = array_filter(
				$properties['properties'],
				function( $property ) use ( $property_id ) {
					return $property->getId() === $property_id;
				}
			);

			if ( ! empty( $existing_property_match ) ) {
				$response = array(
					'accountId'  => $account_id,
					'propertyId' => $property_id,
				);
				break;
			}
		}

		return $response;
	}
}
