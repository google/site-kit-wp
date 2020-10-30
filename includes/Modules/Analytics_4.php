<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
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
use Google\Site_Kit\Core\Modules\Module_With_Blockable_Tags_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Debug_Data;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit_Dependencies\Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsData;
use Google\Site_Kit_Dependencies\Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaProperty;
use Google\Site_Kit_Dependencies\Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaWebDataStream;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsData_BatchRunReportsRequest;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsData_RunReportRequest;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsData_Entity;
use Google\Site_Kit_Dependencies\Google_Service_AnalyticsData_Metric;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;
use Exception;

/**
 * Class representing the Analytics 4 module.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Analytics_4 extends Module
	implements Module_With_Screen, Module_With_Scopes, Module_With_Settings, Module_With_Assets, Module_With_Debug_Fields, Module_With_Owner {
	use Module_With_Assets_Trait;
	use Module_With_Blockable_Tags_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Screen_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->register_scopes_hook();

		$this->register_screen_hook();

		if ( ! $this->use_double_tagging() ) {
			/**
			 * This filter only exists to be unhooked by the AdSense module if active.
			 *
			 * @see \Google\Site_Kit\Modules\Analytics_4\Settings::register
			 */
			add_filter( 'googlesitekit_analytics_adsense_linked', '__return_false' );

			$print_tracking_opt_out = function () {
				if ( $this->is_tracking_disabled() ) {
					$this->print_tracking_opt_out();
				}
			};
			// For non-AMP and AMP.
			add_action( 'wp_head', $print_tracking_opt_out, 0 );
			// For Web Stories plugin.
			add_action( 'web_stories_story_head', $print_tracking_opt_out, 0 );
		}

		// Analytics tag placement logic.
		add_action(
			'template_redirect',
			function() {
				// Bail early if we are checking for the tag presence from the back end.
				if ( $this->context->input()->filter( INPUT_GET, 'tagverify', FILTER_VALIDATE_BOOLEAN ) ) {
					return;
				}

				if ( $this->is_tag_blocked() ) {
					return;
				}

				$option = $this->get_settings()->get();

				$use_snippet = ! empty( $option['useSnippet'] );
				if ( ! $use_snippet ) {
					return;
				}

				$property_id = $option['propertyID'];
				if ( ! $property_id ) {
					return;
				}

				// At this point, we know the tag should be rendered, so let's take care of it
				// for AMP and non-AMP.
				if ( $this->context->is_amp() ) {
					if ( $this->use_double_tagging() ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
						// TODO: Filter legacy Analytics amp-analytics.
					} else {
						$print_amp_gtag = function() use ( $property_id ) {
							$this->print_amp_gtag( $property_id );
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
						// For Web Stories plugin.
						add_action( 'web_stories_print_analytics', $print_amp_gtag );

						add_filter( // Load amp-analytics component for AMP Reader.
							'amp_post_template_data',
							function( $data ) {
								return $this->amp_data_load_analytics_component( $data );
							}
						);
					}

					/**
					 * Fires when the Analytics tag for AMP has been initialized.
					 *
					 * This means that the tag will be rendered in the current request.
					 * Site Kit uses `gtag.js` for its Analytics snippet.
					 *
					 * @since n.e.x.t
					 *
					 * @param string $property_id Analytics property ID used in the tag.
					 */
					do_action( 'googlesitekit_analytics_4_init_tag_amp', $property_id );
				} else {
					if ( $this->use_double_tagging() ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
						// TODO: Filter legacy Analytics gtag.
					} else {
						add_action( // For non-AMP.
							'wp_enqueue_scripts',
							function() use ( $property_id ) {
								$this->enqueue_gtag_js( $property_id );
							}
						);
					}

					/**
					 * Fires when the Analytics tag has been initialized.
					 *
					 * This means that the tag will be rendered in the current request.
					 * Site Kit uses `gtag.js` for its Analytics snippet.
					 *
					 * @since n.e.x.t
					 *
					 * @param string $property_id Analytics property ID used in the tag.
					 */
					do_action( 'googlesitekit_analytics_4_init_tag', $property_id );
				}
			}
		);
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$option = $this->get_settings()->get();
		if ( ! $option['accountID'] || ! $option['propertyID'] ) {
			return;
		}
		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since n.e.x.t
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since n.e.x.t
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
	 * Outputs gtag snippet.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $property_id Analytics property ID to use in the snippet.
	 */
	protected function enqueue_gtag_js( $property_id ) {
		// TODO: Use correct snippet for GA4.
		$gtag_src = "https://www.googletagmanager.com/gtag/js?id=$property_id";

		wp_enqueue_script( // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			'google_gtagjs',
			$gtag_src,
			false,
			null,
			false
		);
		wp_script_add_data( 'google_gtagjs', 'script_execution', 'async' );

		wp_add_inline_script(
			'google_gtagjs',
			'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}'
		);

		$gtag_opt = array();

		$option       = $this->get_settings()->get();
		$anonymize_ip = (bool) $option['anonymizeIP'];
		if ( $anonymize_ip ) {
			// See https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization.
			$gtag_opt['anonymize_ip'] = true;
		}

		/**
		 * Filters the gtag configuration options for the Analytics snippet.
		 *
		 * You can use the {@see 'googlesitekit_amp_gtag_opt'} filter to do the same for gtag in AMP.
		 *
		 * @since n.e.x.t
		 *
		 * @see https://developers.google.com/gtagjs/devguide/configure
		 *
		 * @param array $gtag_opt gtag config options.
		 */
		$gtag_opt = apply_filters( 'googlesitekit_gtag_opt', $gtag_opt );

		if ( ! empty( $gtag_opt['linker'] ) ) {
			wp_add_inline_script(
				'google_gtagjs',
				'gtag(\'set\', \'linker\', ' . wp_json_encode( $gtag_opt['linker'] ) . ' );'
			);
		}
		unset( $gtag_opt['linker'] );

		wp_add_inline_script(
			'google_gtagjs',
			'gtag(\'js\', new Date());'
		);

		// Site Kit developer ID.
		wp_add_inline_script(
			'google_gtagjs',
			'gtag(\'set\', \'developer_id.dZTNiMT\', true);'
		);

		if ( empty( $gtag_opt ) ) {
			wp_add_inline_script(
				'google_gtagjs',
				'gtag(\'config\', \'' . esc_attr( $property_id ) . '\');'
			);
		} else {
			wp_add_inline_script(
				'google_gtagjs',
				'gtag(\'config\', \'' . esc_attr( $property_id ) . '\', ' . wp_json_encode( $gtag_opt ) . ' );'
			);
		}

		$block_on_consent_attrs = $this->get_tag_block_on_consent_attribute();

		if ( $block_on_consent_attrs ) {
			$apply_block_on_consent_attrs = function ( $tag, $handle ) use ( $block_on_consent_attrs, $gtag_src ) {
				if ( 'google_gtagjs' !== $handle ) {
					return $tag;
				}

				return str_replace(
					array(
						"<script src='$gtag_src'", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
						"<script src=\"$gtag_src\"", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
						"<script type='text/javascript' src='$gtag_src'", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
						"<script type=\"text/javascript\" src=\"$gtag_src\"", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					),
					array( // `type` attribute intentionally excluded in replacements.
						"<script{$block_on_consent_attrs} src='$gtag_src'", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
						"<script{$block_on_consent_attrs} src=\"$gtag_src\"", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
						"<script{$block_on_consent_attrs} src='$gtag_src'", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
						"<script{$block_on_consent_attrs} src=\"$gtag_src\"", // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					),
					$tag
				);
			};
			add_filter( 'script_loader_tag', $apply_block_on_consent_attrs, 10, 2 );
		}
	}

	/**
	 * Outputs gtag <amp-analytics> tag.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $property_id Analytics property ID to use in the snippet.
	 */
	protected function print_amp_gtag( $property_id ) {
		// TODO: Is GA4 supported by AMP yet?
	}

	/**
	 * Loads AMP analytics script if opted in.
	 *
	 * This only affects AMP Reader mode, the others are automatically covered.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $data AMP template data.
	 * @return array Filtered $data.
	 */
	protected function amp_data_load_analytics_component( $data ) {
		if ( isset( $data['amp_component_scripts']['amp-analytics'] ) ) {
			return $data;
		}

		$data['amp_component_scripts']['amp-analytics'] = 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js';
		return $data;
	}

	/**
	 * Checks whether or not tracking snippet should be contextually disabled for this request.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool
	 */
	protected function is_tracking_disabled() {
		$option     = $this->get_settings()->get();
		$exclusions = $option['trackingDisabled'];
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
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:accounts'           => array( 'service' => 'analyticsadmin' ),
			'GET:properties'         => array( 'service' => 'analyticsadmin' ),
			'GET:datastreams'        => array( 'service' => 'analyticsadmin' ),
			'GET:report'             => array( 'service' => 'analyticsdata' ),
			'POST:create-property'   => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( 'https://www.googleapis.com/auth/analytics.edit' ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics property on your behalf.', 'google-site-kit' ),
			),
			'POST:create-datastream' => array(
				'service'                => 'analyticsadmin',
				'scopes'                 => array( 'https://www.googleapis.com/auth/analytics.edit' ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics view on your behalf.', 'google-site-kit' ),
			),
			'GET:tag-permission'     => array( 'service' => '' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since n.e.x.t
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
			case 'GET:datastreams':
				if ( ! isset( $data['propertyID'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
						array( 'status' => 400 )
					);
				}
				return $this->get_service( 'analyticsadmin' )->properties_webDataStreams->listPropertiesWebDataStreams( 'properties/' . $data['propertyID'] );
			case 'GET:report':
				$option      = $this->get_settings()->get();
				$property_id = $option['propertyID'];
				if ( ! $property_id ) {
					return new WP_Error( 'property_id_not_set', __( 'Analytics property ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
				}
				if ( empty( $data['metrics'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'metrics' ),
						array( 'status' => 400 )
					);
				}
				$request = new Google_Service_AnalyticsData_RunReportRequest();
				$entity  = new Google_Service_AnalyticsData_Entity();
				$entity->setPropertyId( $property_id );
				$request->setEntity( $entity );
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
									$metric->setExpression( $metric_def );
								} elseif ( is_array( $metric_def ) && ! empty( $metric_def['expression'] ) ) {
									$metric->setExpression( $metric_def['expression'] );
									$metric->setName( ! empty( $metric_def['name'] ) ? $metric_def['name'] : $metric_def['expression'] );
								} else {
									return null;
								}

								return $metric;
							},
							array_filter( $metrics )
						)
					);

					$request->setMetrics( $metrics );
				}
				// TODO: Handle optional dimensions, orderbys, etc.

				$requests = new Google_Service_AnalyticsData_BatchRunReportsRequest();
				$requests->setRequests( array( $request ) );
				return $this->get_service( 'analyticsdata' )->v1alpha->batchRunReports( 'properties/' . $data['propertyID'] );
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
				$property->setDisplayName( get_bloginfo( 'name' ) );
				return $this->get_service( 'analyticsadmin' )->properties->create( $property );
			case 'POST:create-datastream':
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

		throw new Invalid_Datapoint_Exception();
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since n.e.x.t
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
			case 'GET:datastreams':
				return $response->getWebDataStreams();
			case 'GET:report':
				// If AdSense metric successfully requested, set adsenseLinked to true.
				if ( $this->is_adsense_request( $data ) ) {
					$this->get_settings()->merge( array( 'adsenseLinked' => true ) );
				}
				return $response->getReports();
		}

		return $response;
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since n.e.x.t
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
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since n.e.x.t
	 *
	 * @param Google_Site_Kit_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Site_Kit_Client $client ) {
		return array(
			'analyticsadmin' => new Google_Service_GoogleAnalyticsAdmin( $client ),
			'analyticsdata'  => new Google_Service_AnalyticsData( $client ),
		);
	}

	/**
	 * Verifies that user has access to the property found in the existing tag.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $property_id Property found in the existing tag.
	 * @return array A string representing the accountID and a boolean representing if the user has access to the property.
	 */
	protected function has_access_to_property( $property_id ) {
		// TODO.
		return array(
			'permission' => false,
		);
	}

	/**
	 * Transforms an exception into a WP_Error object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Exception $e         Exception object.
	 * @param string    $datapoint Datapoint originally requested.
	 * @return WP_Error WordPress error object.
	 */
	protected function exception_to_error( Exception $e, $datapoint ) {
		if ( 'report' === $datapoint && $e instanceof Google_Service_Exception ) {
			$errors = $e->getErrors();
			// If error is because of AdSense metric being requested, set adsenseLinked to false.
			if ( isset( $errors[0]['message'] ) && $this->is_adsense_metric( substr( $errors[0]['message'], strlen( 'Restricted metric(s): ' ) ) ) ) {
				$this->get_settings()->merge( array( 'adsenseLinked' => false ) );
			}
		}

		return parent::exception_to_error( $e, $datapoint );
	}

	/**
	 * Determines whether the given request is for an AdSense request.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Data request object.
	 * @return bool True if the request is an AdSense request, false otherwise.
	 */
	private function is_adsense_request( $data ) {
		// TODO.
		return false;
	}

	/**
	 * Checks whether double tagging should be used, i.e. whether the legacy Analytics module is also active.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if double tagging for Analytics 4 and legacy Analytics should be used.
	 */
	private function use_double_tagging() {
		// TODO: Check if legacy Analytics module is active.
		return true;
	}

	/**
	 * Outputs the user tracking opt-out script.
	 *
	 * This script opts out of all Google Analytics tracking, for all measurement IDs, regardless of implementation.
	 * E.g. via Tag Manager, etc.
	 *
	 * @since n.e.x.t
	 * @link https://developers.google.com/analytics/devguides/collection/analyticsjs/user-opt-out
	 */
	private function print_tracking_opt_out() {
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
	 * @since n.e.x.t
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since n.e.x.t
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
						'googlesitekit-widgets',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-datastore-forms',
					),
				)
			),
		);
	}
}
