<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Screen_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Search_Console\Settings;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Google\Site_Kit_Dependencies\Google_Service_Webmasters;
use Google\Site_Kit_Dependencies\Google_Service_Webmasters_SitesListResponse;
use Google\Site_Kit_Dependencies\Google_Service_Webmasters_WmxSite;
use Google\Site_Kit_Dependencies\Google_Service_Webmasters_SearchAnalyticsQueryRequest;
use Google\Site_Kit_Dependencies\Google_Service_Webmasters_ApiDimensionFilter;
use Google\Site_Kit_Dependencies\Google_Service_Webmasters_ApiDimensionFilterGroup;
use Google\Site_Kit_Dependencies\Psr\Http\Message\ResponseInterface;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the Search Console module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Search_Console extends Module implements Module_With_Screen, Module_With_Scopes, Module_With_Settings {
	use Module_With_Screen_Trait, Module_With_Scopes_Trait, Module_With_Settings_Trait;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		$this->register_screen_hook();

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

		add_filter(
			'googlesitekit_show_admin_bar_menu',
			function( $display, $current_url ) {
				if ( ! $this->get_property_id() ) {
					return false;
				}

				if ( ! $this->has_data_for_url( $current_url ) ) {
					return false;
				}

				return $display;
			},
			10,
			2
		);
	}

	/**
	 * Gets the property ID and ensures it is a valid URL.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Property ID URL if set, or empty string.
	 */
	protected function get_property_id() {
		$option = $this->get_settings()->get();

		return $option['propertyID'];
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
			'https://www.googleapis.com/auth/webmasters',
		);
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
			// GET.
			'sites'           => 'webmasters',
			'matched-sites'   => 'webmasters',
			'searchanalytics' => 'webmasters',

			// POST.
			'site'            => 'webmasters',
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
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:matched-sites':
				return $this->get_webmasters_service()->sites->listSites();
			case 'GET:searchanalytics':
				list ( $start_date, $end_date ) = $this->parse_date_range(
					$data['dateRange'] ?: 'last-28-days',
					$data['compareDateRanges'] ? 2 : 1,
					3
				);

				$data_request = array(
					'page'       => $data['url'],
					'start_date' => $start_date,
					'end_date'   => $end_date,
					'dimensions' => array_filter( explode( ',', $data['dimensions'] ) ),
				);

				if ( isset( $data['limit'] ) ) {
					$data_request['row_limit'] = $data['limit'];
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

				$site_url = $data['siteURL'];
				if ( 0 !== strpos( $site_url, 'sc-domain:' ) ) {
					$site_url = trailingslashit( $site_url );
				}

				return function () use ( $site_url ) {
					$restore_defer = $this->with_client_defer( false );

					try {
						// If the site does not exist in the account, an exception will be thrown.
						$site = $this->get_webmasters_service()->sites->get( $site_url );
					} catch ( Google_Service_Exception $exception ) {
						// If we got here, the site does not exist in the account, so we will add it.
						/* @var ResponseInterface $response Response object. */
						$response = $this->get_webmasters_service()->sites->add( $site_url );

						if ( 204 !== $response->getStatusCode() ) {
							return new WP_Error(
								'failed_to_add_site_to_search_console',
								__( 'Error adding the site to Search Console.', 'google-site-kit' ),
								array( 'status' => 500 )
							);
						}

						// Fetch the site again now that it exists.
						$site = $this->get_webmasters_service()->sites->get( $site_url );
					}

					$restore_defer();
					$this->get_settings()->merge( array( 'propertyID' => $site_url ) );

					return array(
						'siteURL'         => $site->getSiteUrl(),
						'permissionLevel' => $site->getPermissionLevel(),
					);
				};
			case 'GET:sites':
				return $this->get_webmasters_service()->sites->listSites();
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
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:matched-sites':
				/* @var Google_Service_Webmasters_SitesListResponse $response Response object. */
				$sites = $this->map_sites( (array) $response->getSiteEntry() );

				$current_url                  = trailingslashit( $this->context->get_reference_site_url() );
				$sufficient_permission_levels = array(
					'siteRestrictedUser' => true,
					'siteOwner'          => true,
					'siteFullUser'       => true,
				);

				return array_values(
					array_filter(
						$sites,
						function ( array $site ) use ( $current_url, $sufficient_permission_levels ) {
							$site_url = trailingslashit( $site['siteURL'] );
							if ( 0 === strpos( $site_url, 'sc-domain:' ) ) {
								$url_match = str_replace( array( 'http://', 'https://' ), 'sc-domain:', $current_url ) === $site_url;
							} else {
								$url_match = $current_url === $site_url;
							}
							return $url_match && isset( $sufficient_permission_levels[ $site['permissionLevel'] ] );
						}
					)
				);
			case 'GET:searchanalytics':
				return $response->getRows();
			case 'GET:sites':
				/* @var Google_Service_Webmasters_SitesListResponse $response Response object. */
				return $this->map_sites( (array) $response->getSiteEntry() );
		}

		return $response;
	}

	/**
	 * Map Site model objects to primitives used for API responses.
	 *
	 * @param array $sites Site objects.
	 *
	 * @return array
	 */
	private function map_sites( $sites ) {
		return array_map(
			function ( Google_Service_Webmasters_WmxSite $site ) {
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
	 *     @type int    $row_limit  Limit of rows to return. Default 500.
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
				'row_limit'  => 500,
			)
		);

		$request = new Google_Service_Webmasters_SearchAnalyticsQueryRequest();
		if ( ! empty( $args['dimensions'] ) ) {
			$request->setDimensions( (array) $args['dimensions'] );
		}
		if ( ! empty( $args['start_date'] ) ) {
			$request->setStartDate( $args['start_date'] );
		}
		if ( ! empty( $args['end_date'] ) ) {
			$request->setEndDate( $args['end_date'] );
		}
		if ( ! empty( $args['page'] ) ) {
			$filter = new Google_Service_Webmasters_ApiDimensionFilter();
			$filter->setDimension( 'page' );
			$filter->setExpression( esc_url_raw( $args['page'] ) );
			$filters = new Google_Service_Webmasters_ApiDimensionFilterGroup();
			$filters->setFilters( array( $filter ) );
			$request->setDimensionFilterGroups( array( $filters ) );
		}
		if ( ! empty( $args['row_limit'] ) ) {
			$request->setRowLimit( $args['row_limit'] );
		}

		return $this->get_webmasters_service()
			->searchanalytics
			->query( $this->get_property_id(), $request );
	}

	/**
	 * Checks whether Search Console data exists for the given post.
	 *
	 * The result of this query is stored in a transient.
	 *
	 * @since 1.0.0
	 *
	 * @param string $current_url The current url.
	 * @return bool True if Search Console data exists, false otherwise.
	 */
	protected function has_data_for_url( $current_url ) {
		if ( ! $current_url ) {
			return false;
		}

		$transient_key = 'googlesitekit_sc_data_' . md5( $current_url );
		$has_data      = get_transient( $transient_key );
		if ( false === $has_data ) {

			// Check search console for data.
			$datasets = array(
				array(
					'identifier' => $this->slug,
					'key'        => 'sc-site-analytics',
					'datapoint'  => 'searchanalytics',
					'data'       => array(
						'url'               => $current_url,
						'dateRange'         => 'last-90-days',
						'dimensions'        => 'date',
						'compareDateRanges' => true,
					),
				),
			);

			$responses = $this->get_batch_data(
				array_map(
					function( $dataset ) {
						return (object) $dataset;
					},
					$datasets
				)
			);

			$has_data = false;

			// Go thru results, any impressions means the URL has data.
			foreach ( $responses['sc-site-analytics'] as $key => $response ) {
				if ( is_wp_error( $response ) || empty( $response ) || ! isset( $response ) ) {
					continue;
				}

				if ( $response->impressions > 0 ) {
					$has_data = true;
					break;
				}
			}

			// Cache "data found" status for one day, "no data" status for one hour.
			set_transient( $transient_key, (int) $has_data, $has_data ? DAY_IN_SECONDS : HOUR_IN_SECONDS );
		}

		return (bool) $has_data;
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
			'slug'         => 'search-console',
			'name'         => _x( 'Search Console', 'Service name', 'google-site-kit' ),
			'description'  => __( 'Google Search Console and helps you understand how Google views your site and optimize its performance in search results.', 'google-site-kit' ),
			'cta'          => __( 'Connect your site to Google Search Console.', 'google-site-kit' ),
			'order'        => 1,
			'homepage'     => __( 'https://search.google.com/search-console', 'google-site-kit' ),
			'learn_more'   => __( 'https://search.google.com/search-console/about', 'google-site-kit' ),
			'force_active' => true,
		);
	}

	/**
	 * Get the configured Webmasters service instance.
	 *
	 * @return Google_Service_Webmasters The Search Console API service.
	 */
	private function get_webmasters_service() {
		return $this->get_service( 'webmasters' );
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
			'webmasters' => new Google_Service_Webmasters( $client ),
		);
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
}
