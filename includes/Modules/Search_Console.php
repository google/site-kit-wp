<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console
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
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Screen_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Google_URL_Matcher_Trait;
use Google\Site_Kit\Core\Util\Google_URL_Normalizer;
use Google\Site_Kit\Modules\Search_Console\Settings;
use Google\Site_Kit_Dependencies\Google\Service\Exception as Google_Service_Exception;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole as Google_Service_SearchConsole;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SitesListResponse as Google_Service_SearchConsole_SitesListResponse;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\WmxSite as Google_Service_SearchConsole_WmxSite;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryRequest as Google_Service_SearchConsole_SearchAnalyticsQueryRequest;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDimensionFilter as Google_Service_SearchConsole_ApiDimensionFilter;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDimensionFilterGroup as Google_Service_SearchConsole_ApiDimensionFilterGroup;
use Google\Site_Kit_Dependencies\Psr\Http\Message\ResponseInterface;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;
use Exception;

/**
 * Class representing the Search Console module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Search_Console extends Module
	implements Module_With_Screen, Module_With_Scopes, Module_With_Settings, Module_With_Assets, Module_With_Debug_Fields, Module_With_Owner, Module_With_Service_Entity {
	use Module_With_Screen_Trait, Module_With_Scopes_Trait, Module_With_Settings_Trait, Google_URL_Matcher_Trait, Module_With_Assets_Trait, Module_With_Owner_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'search-console';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		if ( ! Feature_Flags::enabled( 'unifiedDashboard' ) ) {
			$this->register_screen_hook();
		}

		// Detect and store Search Console property when receiving token for the first time.
		add_action(
			'googlesitekit_authorize_user',
			function( array $token_response ) {
				if ( ! current_user_can( Permissions::SETUP ) ) {
					return;
				}

				// If the response includes the Search Console property, set that.
				if ( ! empty( $token_response['search_console_property'] ) ) {
					$this->get_settings()->merge(
						array( 'propertyID' => $token_response['search_console_property'] )
					);
					return;
				}

				// Otherwise try to detect if there isn't one set already.
				$property_id = $this->get_property_id() ?: $this->detect_property_id();
				if ( ! $property_id ) {
					return;
				}

				$this->get_settings()->merge(
					array( 'propertyID' => $property_id )
				);
			}
		);

		// Ensure that a Search Console property must be set at all times.
		add_filter(
			'googlesitekit_setup_complete',
			function( $complete ) {
				if ( ! $complete ) {
					return $complete;
				}

				return (bool) $this->get_property_id();
			}
		);

		// Provide Search Console property information to JavaScript.
		add_filter(
			'googlesitekit_setup_data',
			function ( $data ) {
				$data['hasSearchConsoleProperty'] = (bool) $this->get_property_id();

				return $data;
			},
			11
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
			'https://www.googleapis.com/auth/webmasters', // The scope for the Search Console remains the legacy webmasters scope.
		);
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		return array(
			'search_console_property' => array(
				'label' => __( 'Search Console property', 'google-site-kit' ),
				'value' => $this->get_property_id(),
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
			'GET:matched-sites'   => array( 'service' => 'searchconsole' ),
			'GET:searchanalytics' => array(
				'service'   => 'searchconsole',
				'shareable' => Feature_Flags::enabled( 'dashboardSharing' ),
			),
			'POST:site'           => array( 'service' => 'searchconsole' ),
			'GET:sites'           => array( 'service' => 'searchconsole' ),
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
			case 'GET:matched-sites':
				return $this->get_searchconsole_service()->sites->listSites();
			case 'GET:searchanalytics':
				$start_date = $data['startDate'];
				$end_date   = $data['endDate'];
				if ( ! strtotime( $start_date ) || ! strtotime( $end_date ) ) {
					list ( $start_date, $end_date ) = $this->parse_date_range(
						$data['dateRange'] ?: 'last-28-days',
						$data['compareDateRanges'] ? 2 : 1,
						1 // Offset.
					);
				}

				$data_request = array(
					'start_date' => $start_date,
					'end_date'   => $end_date,
				);

				if ( ! empty( $data['url'] ) ) {
					$data_request['page'] = ( new Google_URL_Normalizer() )->normalize_url( $data['url'] );
				}

				if ( isset( $data['limit'] ) ) {
					$data_request['row_limit'] = $data['limit'];
				}

				$dimensions = $this->parse_string_list( $data['dimensions'] );
				if ( is_array( $dimensions ) && ! empty( $dimensions ) ) {
					$data_request['dimensions'] = $dimensions;
				}

				return $this->create_search_analytics_data_request( $data_request );
			case 'POST:site':
				if ( empty( $data['siteURL'] ) ) {
					return new WP_Error(
						'missing_required_param',
						/* translators: %s: Missing parameter name */
						sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'siteURL' ),
						array( 'status' => 400 )
					);
				}

				$url_normalizer = new Google_URL_Normalizer();

				$site_url = $data['siteURL'];
				if ( 0 === strpos( $site_url, 'sc-domain:' ) ) { // Domain property.
					$site_url = 'sc-domain:' . $url_normalizer->normalize_url( str_replace( 'sc-domain:', '', $site_url, 1 ) );
				} else { // URL property.
					$site_url = $url_normalizer->normalize_url( trailingslashit( $site_url ) );
				}

				return function () use ( $site_url ) {
					$restore_defer = $this->with_client_defer( false );

					try {
						// If the site does not exist in the account, an exception will be thrown.
						$site = $this->get_searchconsole_service()->sites->get( $site_url );
					} catch ( Google_Service_Exception $exception ) {
						// If we got here, the site does not exist in the account, so we will add it.
						/* @var ResponseInterface $response Response object. */
						$response = $this->get_searchconsole_service()->sites->add( $site_url );

						if ( 204 !== $response->getStatusCode() ) {
							return new WP_Error(
								'failed_to_add_site_to_search_console',
								__( 'Error adding the site to Search Console.', 'google-site-kit' ),
								array( 'status' => 500 )
							);
						}

						// Fetch the site again now that it exists.
						$site = $this->get_searchconsole_service()->sites->get( $site_url );
					}

					$restore_defer();
					$this->get_settings()->merge( array( 'propertyID' => $site_url ) );

					return array(
						'siteURL'         => $site->getSiteUrl(),
						'permissionLevel' => $site->getPermissionLevel(),
					);
				};
			case 'GET:sites':
				return $this->get_searchconsole_service()->sites->listSites();
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
			case 'GET:matched-sites':
				/* @var Google_Service_SearchConsole_SitesListResponse $response Response object. */
				$entries = $this->map_sites( (array) $response->getSiteEntry() );
				$strict  = filter_var( $data['strict'], FILTER_VALIDATE_BOOLEAN );

				$current_url = $this->context->get_reference_site_url();
				if ( ! $strict ) {
					$current_url = untrailingslashit( $current_url );
					$current_url = $this->strip_url_scheme( $current_url );
					$current_url = $this->strip_domain_www( $current_url );
				}

				$sufficient_permission_levels = array(
					'siteRestrictedUser',
					'siteOwner',
					'siteFullUser',
				);

				return array_values(
					array_filter(
						$entries,
						function ( array $entry ) use ( $current_url, $sufficient_permission_levels, $strict ) {
							if ( 0 === strpos( $entry['siteURL'], 'sc-domain:' ) ) {
								$match = $this->is_domain_match( substr( $entry['siteURL'], strlen( 'sc-domain:' ) ), $current_url );
							} else {
								$site_url = untrailingslashit( $entry['siteURL'] );
								if ( ! $strict ) {
									$site_url = $this->strip_url_scheme( $site_url );
									$site_url = $this->strip_domain_www( $site_url );
								}

								$match = $this->is_url_match( $site_url, $current_url );
							}
							return $match && in_array( $entry['permissionLevel'], $sufficient_permission_levels, true );
						}
					)
				);
			case 'GET:searchanalytics':
				return $response->getRows();
			case 'GET:sites':
				/* @var Google_Service_SearchConsole_SitesListResponse $response Response object. */
				return $this->map_sites( (array) $response->getSiteEntry() );
		}

		return parent::parse_data_response( $data, $response );
	}

	/**
	 * Map Site model objects to associative arrays used for API responses.
	 *
	 * @param array $sites Site objects.
	 *
	 * @return array
	 */
	private function map_sites( $sites ) {
		return array_map(
			function ( Google_Service_SearchConsole_WmxSite $site ) {
				return array(
					'siteURL'         => $site->getSiteUrl(),
					'permissionLevel' => $site->getPermissionLevel(),
				);
			},
			$sites
		);
	}

	/**
	 * Creates a new Search Console analytics request for the current site and given arguments.
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
	 *     @type int    $row_limit  Limit of rows to return. Default 1000.
	 * }
	 * @return RequestInterface Search Console analytics request instance.
	 */
	protected function create_search_analytics_data_request( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions' => array(),
				'start_date' => '',
				'end_date'   => '',
				'page'       => '',
				'row_limit'  => 1000,
			)
		);

		$property_id = $this->get_property_id();

		$request = new Google_Service_SearchConsole_SearchAnalyticsQueryRequest();
		if ( ! empty( $args['dimensions'] ) ) {
			$request->setDimensions( (array) $args['dimensions'] );
		}
		if ( ! empty( $args['start_date'] ) ) {
			$request->setStartDate( $args['start_date'] );
		}
		if ( ! empty( $args['end_date'] ) ) {
			$request->setEndDate( $args['end_date'] );
		}

		$request->setDataState( 'all' );

		$filters = array();

		// If domain property, limit data to URLs that are part of the current site.
		if ( 0 === strpos( $property_id, 'sc-domain:' ) ) {
			$scope_site_filter = new Google_Service_SearchConsole_ApiDimensionFilter();
			$scope_site_filter->setDimension( 'page' );
			$scope_site_filter->setOperator( 'contains' );
			$scope_site_filter->setExpression( esc_url_raw( $this->context->get_reference_site_url() ) );
			$filters[] = $scope_site_filter;
		}

		// If specific URL requested, limit data to that URL.
		if ( ! empty( $args['page'] ) ) {
			$single_url_filter = new Google_Service_SearchConsole_ApiDimensionFilter();
			$single_url_filter->setDimension( 'page' );
			$single_url_filter->setOperator( 'equals' );
			$single_url_filter->setExpression( rawurldecode( esc_url_raw( $args['page'] ) ) );
			$filters[] = $single_url_filter;
		}

		// If there are relevant filters, add them to the request.
		if ( ! empty( $filters ) ) {
			$filter_group = new Google_Service_SearchConsole_ApiDimensionFilterGroup();
			$filter_group->setGroupType( 'and' );
			$filter_group->setFilters( $filters );
			$request->setDimensionFilterGroups( array( $filter_group ) );
		}

		if ( ! empty( $args['row_limit'] ) ) {
			$request->setRowLimit( $args['row_limit'] );
		}

		return $this->get_searchconsole_service()
			->searchanalytics
			->query( $property_id, $request );
	}

	/**
	 * Gets the property ID.
	 *
	 * @since 1.3.0
	 *
	 * @return string Property ID URL if set, or empty string.
	 */
	protected function get_property_id() {
		$option = $this->get_settings()->get();

		return $option['propertyID'];
	}

	/**
	 * Detects the property ID to use for this site.
	 *
	 * This method runs a Search Console API request. The determined ID should therefore be stored and accessed through
	 * {@see Search_Console::get_property_id()} instead.
	 *
	 * @since 1.3.0
	 *
	 * @return string Property ID, or empty string if none found.
	 */
	protected function detect_property_id() {
		$properties = $this->get_data( 'matched-sites', array( 'strict' => 'yes' ) );
		if ( is_wp_error( $properties ) || ! $properties ) {
			return '';
		}

		// If there are multiple, prefer URL property over domain property.
		if ( count( $properties ) > 1 ) {
			$url_properties = array_filter(
				$properties,
				function( $property ) {
					return 0 !== strpos( $property['siteURL'], 'sc-domain:' );
				}
			);
			if ( count( $url_properties ) > 0 ) {
				$properties = $url_properties;
			}
		}

		$property = array_shift( $properties );
		return $property['siteURL'];
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
			'slug'        => 'search-console',
			'name'        => _x( 'Search Console', 'Service name', 'google-site-kit' ),
			'description' => __( 'Google Search Console and helps you understand how Google views your site and optimize its performance in search results.', 'google-site-kit' ),
			'order'       => 1,
			'homepage'    => __( 'https://search.google.com/search-console', 'google-site-kit' ),
		);
	}

	/**
	 * Get the configured SearchConsole service instance.
	 *
	 * @since 1.25.0
	 *
	 * @return Google_Service_SearchConsole The Search Console API service.
	 */
	private function get_searchconsole_service() {
		return $this->get_service( 'searchconsole' );
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
			'searchconsole' => new Google_Service_SearchConsole( $client ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.3.0
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
				'googlesitekit-modules-search-console',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-search-console.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
					),
				)
			),
		);
	}

	/**
	 * Returns TRUE to indicate that this module should be always active.
	 *
	 * @since 1.49.0
	 *
	 * @return bool Returns `true` indicating that this module should be activated all the time.
	 */
	public static function is_force_active() {
		return true;
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
			'row_limit'  => 1,
		);

		try {
			$this->create_search_analytics_data_request( $data_request );
		} catch ( Exception $e ) {
			if ( $e->getCode() === 403 ) {
				return false;
			}
			return $this->exception_to_error( $e );
		}

		return true;
	}

}
