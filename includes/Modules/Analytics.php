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
use Google_Client;
use Google_Service_Exception;
use Psr\Http\Message\RequestInterface;
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
	use Module_With_Screen_Trait, Module_With_Scopes_Trait;

	const OPTION = 'googlesitekit_analytics_settings';

	/**
	 * Temporary storage for existing analytics tag found.
	 *
	 * @since 1.0.0
	 * @var string|null
	 */
	private $_existing_tag_account = false;

	/**
	 * Temporary storage for adsense request.
	 *
	 * @var bool
	 */
	private $_is_adsense_request = false;

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
			// This hook is only available in AMP plugin version >=1.3, so if it
			// has already completed, do nothing.
			if ( ! doing_action( 'amp_print_analytics' ) && did_action( 'amp_print_analytics' ) ) {
				return;
			}

			$this->print_amp_gtag();
		};
		// Which actions are run depends on the version of the AMP Plugin
		// (https://amp-wp.org/) available. Version >=1.3 exposes a
		// new, `amp_print_analytics` action.
		// For all AMP modes, AMP plugin version >=1.3.
		add_action( 'amp_print_analytics', $print_amp_gtag );
		// For AMP Standard and Transitional, AMP plugin version <1.3.
		add_action( 'wp_footer', $print_amp_gtag, 20 );
		// For AMP Reader, AMP plugin version <1.3.
		add_action( 'amp_post_template_footer', $print_amp_gtag, 20 );

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

		$info['adsenseLinked'] = (bool) $this->options->get( 'googlesitekit_analytics_adsense_linked' );

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
		if ( $this->context->is_amp() ) {
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

		if ( ! $this->context->is_amp() ) {
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
		if ( ! $this->context->is_amp() ) {
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
			'connection'                   => '',
			'account-id'                   => '',
			'property-id'                  => '',
			'profile-id'                   => '',
			'internal-web-property-id'     => '',
			'use-snippet'                  => '',
			'amp-client-id-opt-in'         => '',
			// GET.
			'goals'                        => 'analytics',
			'accounts-properties-profiles' => 'analytics',
			'properties-profiles'          => 'analytics',
			'profiles'                     => 'analytics',
			'tag-permission'               => '',
			'report'                       => 'analyticsreporting',
			// POST.
			'settings'                     => '',
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
				case 'accounts-properties-profiles':
					if ( ! empty( $data['existingAccountId'] ) && ! empty( $data['existingPropertyId'] ) ) {
						$this->_existing_tag_account = array(
							'accountId'  => $data['existingAccountId'],
							'propertyId' => $data['existingPropertyId'],
						);
					}
					$service = $this->get_service( 'analytics' );
					return $service->management_accounts->listManagementAccounts();
				case 'properties-profiles':
					if ( ! isset( $data['accountId'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountId' ), array( 'status' => 400 ) );
					}
					$service = $this->get_service( 'analytics' );
					return $service->management_webproperties->listManagementWebproperties( $data['accountId'] );
				case 'profiles':
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
						$accounts               = $this->get_data( 'accounts-properties-profiles' );
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
				case 'report':
					$data = array_merge(
						array(
							'dateRange'         => 'last-28-days',
							'url'               => '',
							// List of strings (comma-separated) of dimension names.
							'dimensions'        => '',
							// List of objects with expression and optional alias properties.
							'metrics'           => array(),
							// List of objects with fieldName and sortOrder properties.
							'orderby'           => array(),
							// Whether or not to double the requested range for comparison.
							'compareDateRanges' => false,
							// Whether or not to include an additional previous range from the given dateRange.
							'multiDateRange'    => false,
						),
						$data
					);

					$dimensions = array_map(
						function ( $name ) {
							$dimension = new \Google_Service_AnalyticsReporting_Dimension();
							$dimension->setName( $name );

							return $dimension;
						},
						explode( ',', $data['dimensions'] )
					);

					$request_args         = compact( 'dimensions' );
					$request_args['page'] = $data['url'];

					if ( ! empty( $data['limit'] ) ) {
						$request_args['row_limit'] = $data['limit'];
					}

					$request = $this->create_analytics_site_data_request( $request_args );

					if ( is_wp_error( $request ) ) {
						return $request;
					}

					$date_ranges = array(
						$this->parse_date_range(
							$data['dateRange'],
							$data['compareDateRanges'] ? 2 : 1
						),
					);

					// When using multiple date ranges, it changes the structure of the response,
					// where each date range becomes an item in a list.
					if ( ! empty( $data['multiDateRange'] ) ) {
						$date_ranges[] = $this->parse_date_range( $data['dateRange'], 1, 1, true );
					}

					$date_ranges = array_map(
						function ( $date_range ) {
							list ( $start_date, $end_date ) = $date_range;
							$date_range                     = new \Google_Service_AnalyticsReporting_DateRange();
							$date_range->setStartDate( $start_date );
							$date_range->setEndDate( $end_date );

							return $date_range;
						},
						$date_ranges
					);
					$request->setDateRanges( $date_ranges );

					$metrics = array_map(
						function ( $metric_def ) {
							$metric_def = array_merge(
								array(
									'alias'      => '',
									'expression' => '',
								),
								(array) $metric_def
							);
							$metric     = new \Google_Service_AnalyticsReporting_Metric();
							$metric->setAlias( $metric_def['alias'] );
							$metric->setExpression( $metric_def['expression'] );

							return $metric;
						},
						(array) $data['metrics']
					);
					$request->setMetrics( $metrics );
					// TODO: refactor this when $data is available in parse_data_response.
					$this->detect_adsense_request_from_metrics( $metrics );

					// Order by.
					$orderby = array_map(
						function ( $order_def ) {
							$order_def = array_merge(
								array(
									'fieldName' => '',
									'sortOrder' => '',
								),
								(array) $order_def
							);
							$order_by  = new \Google_Service_AnalyticsReporting_OrderBy();
							$order_by->setFieldName( $order_def['fieldName'] );
							$order_by->setSortOrder( $order_def['sortOrder'] );

							return $order_by;
						},
						(array) $data['orderby']
					);
					$request->setOrderBys( $orderby );

					// Batch reports requests.
					$body = new \Google_Service_AnalyticsReporting_GetReportsRequest();
					$body->setReportRequests( array( $request ) );

					return $this->get_analyticsreporting_service()->reports->batchGet( $body );
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
				case 'settings':
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
				case 'accounts-properties-profiles':
					/* @var \Google_Service_Analytics_Accounts $response listManagementAccounts response. */
					$accounts    = $response->getItems();
					$account_ids = array_map(
						function ( \Google_Service_Analytics_Account $account ) {
							return $account->getId();
						},
						(array) $accounts
					);
					$response    = array(
						'accounts'   => $accounts,
						'properties' => array(),
						'profiles'   => array(),
					);

					$existing_tag     = $this->_existing_tag_account;
					$found_account_id = ! empty( $existing_tag['accountId'] ) ? $existing_tag['accountId'] : false;
					unset( $this->_existing_tag_account );

					if ( ! $found_account_id ) {
						// Get the account ID from the saved settings - returns WP_Error if not set.
						$account_id = $this->get_data( 'account-id' );
						// If the saved account ID is in the list of accounts the user has access to, it's a match.
						if ( in_array( $account_id, $account_ids, true ) ) {
							$found_account_id = $account_id;
						} else {
							foreach ( $accounts as $account ) {
								$properties_profiles = $this->get_data( 'properties-profiles', array( 'accountId' => $account->getId() ) );

								if ( ! is_wp_error( $properties_profiles ) && isset( $properties_profiles['matchedProperty'] ) ) {
									return array_merge( $response, $properties_profiles );
								}
							}
						}
					}

					if ( ! $found_account_id ) {
						return $response;
					}

					$properties_profiles = $this->get_data( 'properties-profiles', array( 'accountId' => (int) $found_account_id ) );

					if ( is_wp_error( $properties_profiles ) ) {
						return $response;
					}

					return array_merge( $response, $properties_profiles );
				case 'properties-profiles':
					/* @var \Google_Service_Analytics_Webproperties $response listManagementWebproperties response. */
					$properties = (array) $response->getItems();
					$response   = array(
						'properties' => $properties,
						'profiles'   => array(),
					);

					if ( 0 === count( $properties ) ) {
						return new WP_Error(
							'google_analytics_properties_empty',
							__( 'No Google Analytics properties found. Please go to Google Analytics to set one up.', 'google-site-kit' ),
							array( 'status' => 500 )
						);
					}

					$property_id    = $this->get_data( 'property-id' );
					$found_property = new \Google_Service_Analytics_Webproperty();
					$current_url    = untrailingslashit( $this->context->get_reference_site_url() );
					$current_urls   = $this->permute_site_url( $current_url );

					// If there's no match for the saved account ID, try to find a match using the properties of each account.
					foreach ( $properties as $property ) {
						/* @var \Google_Service_Analytics_Webproperty $property Property instance. */
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
					}

					$profiles = $this->get_data(
						'profiles',
						array(
							'accountId'  => $found_property->getAccountId(),
							'propertyId' => $found_property->getId(),
						)
					);

					if ( is_wp_error( $profiles ) ) {
						return $profiles;
					}

					$response['profiles'] = $profiles;

					return $response;
				case 'profiles':
					// TODO: Parse this response to a regular array.
					$response = $response->getItems();
					if ( 0 === count( $response ) ) {
						return new WP_Error( 'google_analytics_profiles_empty', __( 'No Google Analytics profiles found. Please go to Google Anlytics to set one up.', 'google-site-kit' ), array( 'status' => 500 ) );
					}
					return $response;
				case 'report':
					if ( $this->_is_adsense_request ) {
						if ( isset( $response->error ) ) {
							$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						} else {
							$this->options->set( 'googlesitekit_analytics_adsense_linked', '1' );
						}
					}

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
	 * @return \Google_Service_AnalyticsReporting_ReportRequest|WP_Error Analytics site request instance.
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
	 * Gets the configured Analytics Reporting service object instance.
	 *
	 * @return \Google_Service_AnalyticsReporting The Analytics Reporting API service.
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
			$properties = $this->get_data( 'properties-profiles', array( 'accountId' => $account_id ) );

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

	/**
	 * Determines whether the given metrics are for an adsense request and sets the temporary state if found.
	 *
	 * @param \Google_Service_AnalyticsReporting_Metric[] $metrics Array of metrics objects.
	 */
	private function detect_adsense_request_from_metrics( array $metrics ) {
		foreach ( $metrics as $metric ) {
			if ( 0 === strpos( $metric->getExpression(), 'ga:adsense' ) ) {
				$this->_is_adsense_request = true;
			}
		}
	}
}
