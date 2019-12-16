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
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google_Client;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
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
final class Analytics extends Module implements Module_With_Screen, Module_With_Scopes {
	use Module_With_Screen_Trait, Module_With_Scopes_Trait;

	const OPTION = 'googlesitekit_analytics_settings';

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
				if ( ! is_array( $option ) ) {
					$option = array();
				}

				/**
				 * Filters the Google Analytics account ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $account_id Empty by default, will fall back to the option value if not set.
				 */
				$account_id = apply_filters( 'googlesitekit_analytics_account_id', '' );
				if ( ! empty( $account_id ) ) {
					$option['accountID'] = $account_id;
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
					$option['propertyID'] = $property_id;
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
					$option['internalWebPropertyID'] = $internal_web_property_id;
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
					$option['profileID'] = $profile_id;
				}

				// Disable tracking for logged-in users unless enabled via settings.
				if ( ! isset( $option['trackingDisabled'] ) ) {
					$option['trackingDisabled'] = array( 'loggedinUsers' );
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
	 * Checks whether or not tracking snippet should be contextually disabled for this request.
	 *
	 * @since 1.1.0
	 *
	 * @return bool
	 */
	protected function is_tracking_disabled() {
		$exclusions = $this->get_data( 'tracking-disabled' );
		$disabled   = in_array( 'loggedinUsers', $exclusions, true ) && is_user_logged_in();

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
		$info['settings']['anonymizeIP']      = $this->get_data( 'anonymize-ip' );
		$info['settings']['ampClientIDOptIn'] = $this->get_data( 'amp-client-id-opt-in' );
		$info['settings']['trackingDisabled'] = $this->get_data( 'tracking-disabled' );

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
		if ( $this->context->input()->filter( INPUT_GET, 'tagverify', FILTER_VALIDATE_BOOLEAN ) ) {
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

		if ( $this->is_tracking_disabled() ) {
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
			$gtag_opt['useAmpClientId'] = true;
		}

		$anonymize_ip = $this->get_data( 'anonymize-ip' );
		if ( ! is_wp_error( $anonymize_ip ) && $anonymize_ip ) {
			// See https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization.
			$gtag_opt['anonymize_ip'] = true;
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
		if ( $this->context->input()->filter( INPUT_GET, 'tagverify', FILTER_VALIDATE_BOOLEAN ) ) {
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

		if ( $this->is_tracking_disabled() ) {
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

		if ( $this->is_tracking_disabled() ) {
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
			'tracking-disabled'            => '',
			// GET.
			'anonymize-ip'                 => '',
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
	 * @param Data_Request $data Data request object.
	 *
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 */
	protected function create_data_request( Data_Request $data ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'connection':
					return function() {
						$defaults = array(
							'accountID'             => '',
							'propertyID'            => '',
							'profileID'             => '',
							'internalWebPropertyID' => '',
						);

						$options = (array) $this->options->get( self::OPTION );

						// TODO: Remove this at some point (migration of old 'accountId' option).
						if ( isset( $option['accountId'] ) ) {
							if ( ! isset( $option['accountID'] ) ) {
								$option['accountID'] = $option['accountId'];
							}
							unset( $option['accountId'] );
						}

						// TODO: Remove this at some point (migration of old 'propertyId' option).
						if ( isset( $option['propertyId'] ) ) {
							if ( ! isset( $option['propertyID'] ) ) {
								$option['propertyID'] = $option['propertyId'];
							}
							unset( $option['propertyId'] );
						}

						// TODO: Remove this at some point (migration of old 'profileId' option).
						if ( isset( $option['profileId'] ) ) {
							if ( ! isset( $option['profileID'] ) ) {
								$option['profileID'] = $option['profileId'];
							}
							unset( $option['profileId'] );
						}

						// TODO: Remove this at some point (migration of old 'internalWebPropertyId' option).
						if ( isset( $option['internalWebPropertyId'] ) ) {
							if ( ! isset( $option['internalWebPropertyID'] ) ) {
								$option['internalWebPropertyID'] = $option['internalWebPropertyId'];
							}
							unset( $option['internalWebPropertyId'] );
						}

						return array_intersect_key( array_merge( $defaults, $options ), $defaults );
					};
				case 'account-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );

						// TODO: Remove this at some point (migration of old 'accountId' option).
						if ( isset( $option['accountId'] ) ) {
							if ( ! isset( $option['accountID'] ) ) {
								$option['accountID'] = $option['accountId'];
							}
							unset( $option['accountId'] );
						}

						if ( empty( $option['accountID'] ) ) {
							return new WP_Error( 'account_id_not_set', __( 'Analytics account ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['accountID'];
					};
				case 'property-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );

						// TODO: Remove this at some point (migration of old 'propertyId' option).
						if ( isset( $option['propertyId'] ) ) {
							if ( ! isset( $option['propertyID'] ) ) {
								$option['propertyID'] = $option['propertyId'];
							}
							unset( $option['propertyId'] );
						}

						if ( empty( $option['propertyID'] ) ) {
							return new WP_Error( 'property_id_not_set', __( 'Analytics property ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['propertyID'];
					};
				case 'profile-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );

						// TODO: Remove this at some point (migration of old 'profileId' option).
						if ( isset( $option['profileId'] ) ) {
							if ( ! isset( $option['profileID'] ) ) {
								$option['profileID'] = $option['profileId'];
							}
							unset( $option['profileId'] );
						}

						if ( empty( $option['profileID'] ) ) {
							return new WP_Error( 'profile_id_not_set', __( 'Analytics profile ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['profileID'];
					};
				case 'internal-web-property-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );

						// TODO: Remove this at some point (migration of old 'internalWebPropertyId' option).
						if ( isset( $option['internalWebPropertyId'] ) ) {
							if ( ! isset( $option['internalWebPropertyID'] ) ) {
								$option['internalWebPropertyID'] = $option['internalWebPropertyId'];
							}
							unset( $option['internalWebPropertyId'] );
						}

						if ( empty( $option['internalWebPropertyID'] ) ) {
							return new WP_Error( 'internal_web_property_id_not_set', __( 'Analytics internal web property ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['internalWebPropertyID'];
					};
				case 'anonymize-ip':
					return function() {
						$default = true;
						$option  = (array) $this->options->get( self::OPTION );
						return isset( $option['anonymizeIP'] ) ? (bool) $option['anonymizeIP'] : $default;
					};
				case 'use-snippet':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						return ! empty( $option['useSnippet'] );
					};
				case 'amp-client-id-opt-in':
					return function() {
						$option = (array) $this->options->get( self::OPTION );

						// TODO: Remove this at some point (migration of old 'ampClientIdOptIn' option).
						if ( isset( $option['ampClientIdOptIn'] ) ) {
							if ( ! isset( $option['ampClientIDOptIn'] ) ) {
								$option['ampClientIDOptIn'] = $option['ampClientIdOptIn'];
							}
							unset( $option['ampClientIdOptIn'] );
						}

						if ( ! isset( $option['ampClientIDOptIn'] ) ) {
							return true; // Default to true.
						}
						return ! empty( $option['ampClientIDOptIn'] );
					};
				case 'tracking-disabled':
					return function() {
						$option     = $this->options->get( self::OPTION );
						$default    = array( 'loggedinUsers' );
						$exclusions = isset( $option['trackingDisabled'] ) ? $option['trackingDisabled'] : $default;

						return is_array( $exclusions ) ? $exclusions : $default;
					};
				case 'goals':
					$connection = $this->get_data( 'connection' );
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
				case 'accounts-properties-profiles':
					return $this->get_service( 'analytics' )->management_accounts->listManagementAccounts();
				case 'properties-profiles':
					if ( ! isset( $data['accountID'] ) ) {
						return new WP_Error(
							'missing_required_param',
							/* translators: %s: Missing parameter name */
							sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
							array( 'status' => 400 )
						);
					}

					return $this->get_service( 'analytics' )->management_webproperties->listManagementWebproperties( $data['accountID'] );
				case 'profiles':
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
					$date_range = $data['dateRange'] ?: 'last-28-days';

					$dimensions = array_map(
						function ( $name ) {
							$dimension = new Google_Service_AnalyticsReporting_Dimension();
							$dimension->setName( $name );

							return $dimension;
						},
						array_filter( explode( ',', $data['dimensions'] ) )
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
							$date_range,
							$data['compareDateRanges'] ? 2 : 1
						),
					);

					// When using multiple date ranges, it changes the structure of the response,
					// where each date range becomes an item in a list.
					if ( ! empty( $data['multiDateRange'] ) ) {
						$date_ranges[] = $this->parse_date_range( $date_range, 1, 1, true );
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

					$metrics = array_map(
						function ( $metric_def ) {
							$metric_def = array_merge(
								array(
									'alias'      => '',
									'expression' => '',
								),
								(array) $metric_def
							);
							$metric     = new Google_Service_AnalyticsReporting_Metric();
							$metric->setAlias( $metric_def['alias'] );
							$metric->setExpression( $metric_def['expression'] );

							return $metric;
						},
						(array) $data['metrics']
					);
					$request->setMetrics( $metrics );

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
							$order_by  = new Google_Service_AnalyticsReporting_OrderBy();
							$order_by->setFieldName( $order_def['fieldName'] );
							$order_by->setSortOrder( $order_def['sortOrder'] );

							return $order_by;
						},
						(array) $data['orderby']
					);
					$request->setOrderBys( $orderby );

					// Batch reports requests.
					$body = new Google_Service_AnalyticsReporting_GetReportsRequest();
					$body->setReportRequests( array( $request ) );

					return $this->get_analyticsreporting_service()->reports->batchGet( $body );
			}
		} elseif ( 'POST' === $method ) {
			switch ( $datapoint ) {
				case 'connection':
					return function() use ( $data ) {
						$option = (array) $this->options->get( self::OPTION );
						$keys   = array( 'accountID', 'propertyID', 'profileID', 'internalWebPropertyID' );
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
					if ( ! isset( $data['accountID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option              = (array) $this->options->get( self::OPTION );
						$option['accountID'] = $data['accountID'];
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return true;
					};
				case 'property-id':
					if ( ! isset( $data['propertyID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option               = (array) $this->options->get( self::OPTION );
						$option['propertyID'] = $data['propertyID'];
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return true;
					};
				case 'profile-id':
					if ( ! isset( $data['profileID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'profileID' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option              = (array) $this->options->get( self::OPTION );
						$option['profileID'] = $data['profileID'];
						$this->options->set( self::OPTION, $option );
						$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
						return true;
					};
				case 'internal-web-property-id':
					if ( ! isset( $data['internalWebPropertyID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'internalWebPropertyID' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option                          = (array) $this->options->get( self::OPTION );
						$option['internalWebPropertyID'] = $data['internalWebPropertyID'];
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
					if ( ! isset( $data['ampClientIDOptIn'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'ampClientIDOptIn' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option                     = (array) $this->options->get( self::OPTION );
						$option['ampClientIDOptIn'] = (bool) $data['ampClientIDOptIn'];
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'settings':
					if ( ! isset( $data['accountID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['propertyID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['internalWebPropertyID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'internalWebPropertyID' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['profileID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'profileID' ), array( 'status' => 400 ) );
					}
					if ( ! isset( $data['useSnippet'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'useSnippet' ), array( 'status' => 400 ) );
					}

					return function() use ( $data ) {
						$property_id              = null;
						$internal_web_property_id = null;

						if ( '0' === $data['propertyID'] ) {
							$is_new_property = true;
							$client          = $this->get_client();
							$orig_defer      = $client->shouldDefer();
							$client->setDefer( false );
							$property = new Google_Service_Analytics_Webproperty();
							$property->setName( wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST ) );
							try {
								$property = $this->get_service( 'analytics' )->management_webproperties->insert( $data['accountID'], $property );
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
							/* @var Google_Service_Analytics_Webproperty $property Property instance. */
							$property_id              = $property->getId();
							$internal_web_property_id = $property->getInternalWebPropertyId();
						} else {
							$is_new_property          = false;
							$property_id              = $data['propertyID'];
							$internal_web_property_id = $data['internalWebPropertyID'];
						}
						$profile_id = null;
						if ( '0' === $data['profileID'] ) {
							$client     = $this->get_client();
							$orig_defer = $client->shouldDefer();
							$client->setDefer( false );
							$profile = new Google_Service_Analytics_Profile();
							$profile->setName( __( 'All Web Site Data', 'google-site-kit' ) );
							try {
								$profile = $this->get_service( 'analytics' )->management_profiles->insert( $data['accountID'], $property_id, $profile );
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
							$profile_id = $data['profileID'];
						}
						// Set default profile for new property.
						if ( $is_new_property ) {
							$client     = $this->get_client();
							$orig_defer = $client->shouldDefer();
							$client->setDefer( false );
							$property = new Google_Service_Analytics_Webproperty();
							$property->setDefaultProfileId( $profile_id );
							try {
								$property = $this->get_service( 'analytics' )->management_webproperties->patch( $data['accountID'], $property_id, $property );
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
							'accountID'             => $data['accountID'],
							'propertyID'            => $property_id,
							'internalWebPropertyID' => $internal_web_property_id,
							'profileID'             => $profile_id,
							'useSnippet'            => ! empty( $data['useSnippet'] ),
							'anonymizeIP'           => (bool) $data['anonymizeIP'],
							'ampClientIDOptIn'      => ! empty( $data['ampClientIDOptIn'] ),
							'trackingDisabled'      => (array) $data['trackingDisabled'],
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
	 * @param Data_Request $data Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'goals':
					if ( is_array( $response ) ) {
						return $response;
					}
					// TODO: Parse this response to a regular array.
					break;
				case 'accounts-properties-profiles':
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

					if ( ! empty( $data['existingAccountID'] ) && ! empty( $data['existingPropertyID'] ) ) {
						// If there is an existing tag, pass it through to ensure only the existing tag is matched.
						$properties_profiles = $this->get_data(
							'properties-profiles',
							array(
								'accountID'          => $data['existingAccountID'],
								'existingPropertyID' => $data['existingPropertyID'],
							)
						);
					} else {
						// Get the account ID from the saved settings - returns WP_Error if not set.
						$account_id = $this->get_data( 'account-id' );
						// If the saved account ID is in the list of accounts the user has access to, it's a match.
						if ( in_array( $account_id, $account_ids, true ) ) {
							$properties_profiles = $this->get_data( 'properties-profiles', array( 'accountID' => $account_id ) );
						} else {
							// Iterate over each account in reverse so if there is no match,
							// the last $properties_profiles will be from the first account (selected by default).
							foreach ( array_reverse( $accounts ) as $account ) {
								/* @var Google_Service_Analytics_Account $account Analytics account object. */
								$properties_profiles = $this->get_data( 'properties-profiles', array( 'accountID' => $account->getId() ) );

								if ( ! is_wp_error( $properties_profiles ) && isset( $properties_profiles['matchedProperty'] ) ) {
									break;
								}
							}
						}
					}

					if ( is_wp_error( $properties_profiles ) ) {
						return $properties_profiles;
					}

					return array_merge( compact( 'accounts' ), $properties_profiles );
				case 'properties-profiles':
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
						$property_id  = $this->get_data( 'property-id' );
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
				case 'profiles':
					// TODO: Parse this response to a regular array.
					$response = $response->getItems();

					return $response;
				case 'report':
					if ( $this->is_adsense_request( $data ) ) {
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
	 * @return Google_Service_AnalyticsReporting_ReportRequest|WP_Error Analytics site request instance.
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

		$request = new Google_Service_AnalyticsReporting_ReportRequest();
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

		if ( ! empty( $args['page'] ) ) {
			$dimension_filter = new Google_Service_AnalyticsReporting_DimensionFilter();
			$dimension_filter->setDimensionName( 'ga:pagePath' );
			$dimension_filter->setOperator( 'EXACT' );
			$args['page'] = str_replace( trim( $this->context->get_reference_site_url(), '/' ), '', $args['page'] );
			$dimension_filter->setExpressions( array( $args['page'] ) );
			$dimension_filter_clause = new Google_Service_AnalyticsReporting_DimensionFilterClause();
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
			'name'        => _x( 'Analytics', 'Service name', 'google-site-kit' ),
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
	 *
	 * @param Google_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Client $client ) {
		return array(
			'analytics'          => new Google_Service_Analytics( $client ),
			'analyticsreporting' => new Google_Service_AnalyticsReporting( $client ),
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
			$properties = $this->get_data( 'properties-profiles', array( 'accountID' => $account_id ) );

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
					'accountID'  => $account_id,
					'propertyID' => $property_id,
				);
				break;
			}
		}

		return $response;
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
			if ( isset( $metric->expression ) && 0 === strpos( $metric->expression, 'ga:adsense' ) ) {
				return true;
			}
		}

		return false;
	}
}
