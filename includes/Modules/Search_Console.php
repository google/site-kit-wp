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
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Screen_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google_Client;
use Google_Service;
use Google_Service_Exception;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use WP_Error;
use Exception;

/**
 * Class representing the Search Console module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Search_Console extends Module implements Module_With_Screen, Module_With_Scopes {
	use Module_With_Screen_Trait, Module_With_Scopes_Trait;

	const PROPERTY_OPTION = 'googlesitekit_search_console_property';

	/**
	 * Temporary storage for very specific data for 'siteverification-list' datapoint.
	 *
	 * Bad to have, but works for now.
	 *
	 * @since 1.0.0
	 * @var array|null
	 */
	private $_siteverification_list_data = null;

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

				$sc_property = $this->options->get( self::PROPERTY_OPTION );
				return ! empty( $sc_property );
			}
		);

		// Filter the reference site URL to use Search Console property if available.
		add_filter(
			'googlesitekit_site_url',
			function( $url ) {
				$sc_property = $this->options->get( self::PROPERTY_OPTION );
				if ( ! empty( $sc_property ) ) {
					return $sc_property;
				}
				return $url;
			},
			-9999
		);

		// Provide Search Console property information to JavaScript.
		add_filter(
			'googlesitekit_setup_data',
			function ( $data ) {
				$sc_property = $this->options->get( self::PROPERTY_OPTION );

				$data['hasSearchConsoleProperty'] = ! empty( $sc_property );

				return $data;
			},
			11
		);

		add_filter(
			'googlesitekit_show_admin_bar_menu',
			function( $display, $post_id ) {
				$sc_property = $this->options->get( self::PROPERTY_OPTION );
				if ( empty( $sc_property ) ) {
					return false;
				}

				if ( ! $this->has_data_for_post( $post_id ) ) {
					return false;
				}

				return $display;
			},
			10,
			2
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
			'https://www.googleapis.com/auth/webmasters',
			'https://www.googleapis.com/auth/siteverification',
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
			'sites'                               => 'webmasters',
			'verified-sites'                      => 'siteverification',
			'matched-sites'                       => 'webmasters',
			'siteverification-list'               => 'siteverification',
			'siteverification-token'              => 'siteverification',
			'is-site-exist'                       => 'webmasters',
			'sc-site-analytics'                   => 'webmasters',
			'page-analytics'                      => 'webmasters',
			'search-keywords'                     => 'webmasters',
			'search-keywords-sort-by-impressions' => 'webmasters',
			'index-status'                        => 'webmasters',

			// POST.
			'siteverification'                    => '',
			'save-property'                       => '',
			'insert'                              => '',
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
				case 'sites':
					$service = $this->get_service( 'webmasters' );
					return $service->sites->listSites();
				case 'verified-sites':
					$service = $this->get_service( 'siteverification' );
					return $service->webResource->listWebResource(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
				case 'matched-sites':
					$service = $this->get_service( 'webmasters' );
					return $service->sites->listSites();
				case 'siteverification-list':
					// This is far from optimal and hacky, but works for now.
					if ( ! empty( $data['siteURL'] ) ) {
						$this->_siteverification_list_data = $data;
					}
					$service = $this->get_service( 'siteverification' );
					return $service->webResource->listWebResource(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
				case 'siteverification-token':
					$existing_token = $this->authentication->verification_tag()->get();
					if ( ! empty( $existing_token ) ) {
						return function() use ( $existing_token ) {
							return array(
								'method' => 'META',
								'token'  => $existing_token,
							);
						};
					}
					$current_url = ! empty( $data['siteURL'] ) ? $data['siteURL'] : $this->context->get_reference_site_url();
					$site        = new \Google_Service_SiteVerification_SiteVerificationWebResourceGettokenRequestSite();
					$site->setIdentifier( $current_url );
					$site->setType( 'SITE' );
					$request = new \Google_Service_SiteVerification_SiteVerificationWebResourceGettokenRequest();
					$request->setSite( $site );
					$request->setVerificationMethod( 'META' );
					$service = $this->get_service( 'siteverification' );
					return $service->webResource->getToken( $request ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
				case 'is-site-exist':
					$service = $this->get_service( 'webmasters' );
					return $service->sites->listSites();
				case 'sc-site-analytics':
					$page       = ! empty( $data['permaLink'] ) ? $data['permaLink'] : '';
					$date_range = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range = $this->parse_date_range( $date_range, 2, 3 );
					return $this->create_search_analytics_data_request(
						array(
							'dimensions' => array( 'date' ),
							'start_date' => $date_range[0],
							'end_date'   => $date_range[1],
							'page'       => $page,
						)
					);
				case 'page-analytics':
					$page       = ! empty( $data['permaLink'] ) ? $data['permaLink'] : '';
					$date_range = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range = $this->parse_date_range( $date_range, 2, 3 );
					return $this->create_search_analytics_data_request(
						array(
							'dimensions' => array( 'date' ),
							'start_date' => $date_range[0],
							'end_date'   => $date_range[1],
							'page'       => $page,
						)
					);
				case 'search-keywords':
					$page       = ! empty( $data['permaLink'] ) ? $data['permaLink'] : '';
					$date_range = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range = $this->parse_date_range( $date_range, 1, 3 );
					return $this->create_search_analytics_data_request(
						array(
							'dimensions' => array( 'query' ),
							'start_date' => $date_range[0],
							'end_date'   => $date_range[1],
							'page'       => $page,
							'row_limit'  => 10,
						)
					);
				case 'search-keywords-sort-by-impressions':
					$page       = ! empty( $data['permaLink'] ) ? $data['permaLink'] : '';
					$date_range = ! empty( $data['date_range'] ) ? $data['date_range'] : 'last-28-days';
					$date_range = $this->parse_date_range( $date_range, 1, 3 );
					return $this->create_search_analytics_data_request(
						array(
							'dimensions' => array( 'query' ),
							'start_date' => $date_range[0],
							'end_date'   => $date_range[1],
							'page'       => $page,
							'row_limit'  => 100,
						)
					);
				case 'index-status':
					return $this->create_search_analytics_data_request(
						array(
							'start_date' => date( 'Y-m-d', strtotime( '365daysAgo' ) ),
							'end_date'   => date( 'Y-m-d', strtotime( 'yesterday' ) ),
						)
					);
			}
		} elseif ( 'POST' === $method ) {
			switch ( $datapoint ) {
				case 'siteverification':
					if ( ! isset( $data['siteURL'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'siteURL' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$current_user = wp_get_current_user();
						if ( ! $current_user || ! $current_user->exists() ) {
							return new WP_Error( 'unknown_user', __( 'Unknown user.', 'google-site-kit' ) );
						}
						$site = $this->get_data( 'siteverification-list', $data );
						if ( is_wp_error( $site ) ) {
							return $site;
						}
						$sites = array();
						if ( isset( $site['verified'] ) && ! $site['verified'] ) {
							$token = $this->get_data( 'siteverification-token', $data );
							if ( is_wp_error( $token ) ) {
								return $token;
							}
							$this->authentication->verification_tag()->set( $token['token'] );
							$client     = $this->get_client();
							$orig_defer = $client->shouldDefer();
							$client->setDefer( false );
							$urls   = $this->permute_site_url( $data['siteURL'] );
							$errors = new WP_Error();
							foreach ( $urls as $url ) {
								$site = new \Google_Service_SiteVerification_SiteVerificationWebResourceResourceSite();
								$site->setType( 'SITE' );
								$site->setIdentifier( $url );
								$resource = new \Google_Service_SiteVerification_SiteVerificationWebResourceResource();
								$resource->setSite( $site );
								try {
									$sites[] = $this->get_service( 'siteverification' )->webResource->insert( 'META', $resource ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
								} catch ( Google_Service_Exception $e ) {
									$message = $e->getErrors();
									if ( isset( $message[0] ) && isset( $message[0]['message'] ) ) {
										$message = $message[0]['message'];
									}
									$errors->add( $e->getCode(), $message, array( 'url' => $url ) );
								} catch ( Exception $e ) {
									$errors->add( $e->getCode(), $e->getMessage(), array( 'url' => $url ) );
								}
							}
							$client->setDefer( $orig_defer );
							if ( empty( $sites ) ) {
								return $errors;
							}
						}
						$this->authentication->verification()->set( true );
						return array(
							'updated'    => true,
							'sites'      => $sites,
							'identifier' => $data['siteURL'],
						);
					};
				case 'save-property':
					if ( ! isset( $data['siteURL'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'siteURL' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$current_user = wp_get_current_user();
						if ( ! $current_user || ! $current_user->exists() ) {
							return new WP_Error( 'unknown_user', __( 'Unknown user.', 'google-site-kit' ) );
						}
						$this->authentication->verification()->set( true );
						$response = $this->options->set( self::PROPERTY_OPTION, $data['siteURL'] );
						return array(
							'updated' => $response,
							'status'  => true,
						);
					};
				case 'insert':
					if ( ! isset( $data['siteURL'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'siteURL' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$client     = $this->get_client();
						$orig_defer = $client->shouldDefer();
						$client->setDefer( false );
						$service = $this->get_service( 'webmasters' );
						$site    = $service->sites->add( trailingslashit( $data['siteURL'] ) );
						$client->setDefer( $orig_defer );
						if ( 204 !== $site->getStatusCode() ) {
							return new WP_Error( 'failed_to_add_site_to_search_console', __( 'Error adding the site to Search Console.', 'google-site-kit' ), array( 'status' => 500 ) );
						}
						$this->options->set( self::PROPERTY_OPTION, $data['siteURL'] );
						return array(
							'sites' => array( $data['siteURL'] ),
						);
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
				case 'sites':
					$sites = $response->getSiteEntry();
					$data  = array();
					foreach ( $sites as $site ) {
						$data[] = array(
							'permissionLevel' => $site->getPermissionLevel(),
							'siteUrl'         => $site->getSiteUrl(),
						);
					}
					return $data;
				case 'verified-sites':
					$items = $response->getItems();
					$data  = array();
					foreach ( $items as $item ) {
						$site                   = $item->getSite();
						$data[ $item->getId() ] = array(
							'identifier' => $site->getIdentifier(),
							'type'       => $site->getType(),
						);
					}
					return $data;
				case 'matched-sites':
					$sites = $response->getSiteEntry();
					$urls  = array();
					foreach ( $sites as $site ) {
						$url = $site->getSiteUrl();
						if ( 'sc-set' === substr( $url, 0, 6 ) ) {
							continue;
						}
						$urls[] = $url;
					}
					$current_url = trailingslashit( $this->context->get_reference_site_url() );
					$url_matches = array();
					foreach ( $urls as $url ) {
						$host = wp_parse_url( $url, PHP_URL_HOST );
						if ( empty( $host ) || false === strpos( $current_url, (string) $host ) ) {
							continue;
						}
						$url_matches[] = $url;
					}
					if ( empty( $url_matches ) ) {
						$url_matches[] = $current_url;
					}
					return array(
						'exact_match'      => in_array( $current_url, $url_matches, true ) ? $current_url : '',
						'property_matches' => $url_matches,
					);
				case 'siteverification-list':
					if ( is_array( $this->_siteverification_list_data ) && isset( $this->_siteverification_list_data['siteURL'] ) ) {
						$current_url                       = trailingslashit( $this->_siteverification_list_data['siteURL'] );
						$this->_siteverification_list_data = null;
					} else {
						$current_url = trailingslashit( $this->context->get_reference_site_url() );
					}
					$items = $response->getItems();
					foreach ( $items as $item ) {
						$site = $item->getSite();
						$url  = trailingslashit( $site->getIdentifier() );
						if ( 'SITE' === $site->getType() && $current_url === $url ) {
							return array(
								'identifier' => $site->getIdentifier(),
								'type'       => $site->getType(),
								'verified'   => true,
							);
						}
						if ( 'INET_DOMAIN' === $site->getType() ) {
							$host = str_replace( array( 'http://', 'https://' ), '', $site->getIdentifier() );
							if ( ! empty( $host ) && false !== strpos( trailingslashit( $current_url ), trailingslashit( $host ) ) ) {
								$response = array(
									'identifier' => $site->getIdentifier(),
									'type'       => $site->getType(),
									'verified'   => true,
								);

								return $response;
							}
						}
					}
					return array(
						'identifier' => $current_url,
						'type'       => 'SITE',
						'verified'   => false,
					);
				case 'siteverification-token':
					if ( is_array( $response ) ) {
						return $response;
					}
					return array(
						'method' => $response->getMethod(),
						'token'  => $response->getToken(),
					);
				case 'is-site-exist':
					$current_url = $this->context->get_reference_site_url();
					$sites       = $response->getSiteEntry();
					foreach ( $sites as $site ) {
						if ( trailingslashit( $current_url ) !== trailingslashit( $site->getSiteUrl() ) ) {
							continue;
						}
						if ( in_array( $site->getPermissionLevel(), array( 'siteRestrictedUser', 'siteOwner', 'siteFullUser' ), true ) ) {
							return array(
								'siteURL'  => $site->getSiteUrl(),
								'verified' => true,
							);
						}
					}
					return array(
						'siteURL'  => $this->context->get_reference_site_url(),
						'verified' => false,
					);
				case 'sc-site-analytics':
				case 'page-analytics':
				case 'search-keywords':
				case 'index-status':
				case 'search-keywords-sort-by-impressions':
					$response_data = $response->getRows();
					usort(
						$response_data,
						function ( \Google_Service_Webmasters_ApiDataRow $a, \Google_Service_Webmasters_ApiDataRow $b ) {
							if ( $a->getImpressions() === $b->getImpressions() ) {
								return 0;
							}

							return ( $a->getImpressions() < $b->getImpressions() ) ? 1 : -1;
						}
					);
					return array_slice( $response_data, 0, 10 );
			}
		}

		return $response;
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

		$request = new \Google_Service_Webmasters_SearchAnalyticsQueryRequest();
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
			$filter = new \Google_Service_Webmasters_ApiDimensionFilter();
			$filter->setDimension( 'page' );
			$filter->setExpression( esc_url_raw( $args['page'] ) );
			$filters = new \Google_Service_Webmasters_ApiDimensionFilterGroup();
			$filters->setFilters( array( $filter ) );
			$request->setDimensionFilterGroups( array( $filters ) );
		}
		if ( ! empty( $args['row_limit'] ) ) {
			$request->setRowLimit( $args['row_limit'] );
		}

		$service = $this->get_service( 'webmasters' );
		return $service->searchanalytics->query( $this->context->get_reference_site_url(), $request );
	}

	/**
	 * Checks whether Search Console data exists for the given post.
	 *
	 * The result of this query is stored in a transient which is refreshed every 2 hours.
	 *
	 * @since 1.0.0
	 *
	 * @param int $post_id Post ID.
	 * @return bool True if Search Console data exists, false otherwise.
	 */
	protected function has_data_for_post( $post_id ) {
		if ( ! $post_id ) {
			return false;
		}

		$transient_key = 'googlesitekit_sc_has_data_for_post_' . $post_id;
		$has_data      = get_transient( $transient_key );
		if ( false === $has_data ) {
			$post_url = esc_url_raw( $this->context->get_reference_permalink( $post_id ) );

			if ( false === $post_url ) {
				return false;
			}

			$datasets = array(
				array(
					'identifier' => $this->slug,
					'key'        => 'sc-site-analytics',
					'datapoint'  => 'sc-site-analytics',
					'data'       => array(
						'permaLink'  => $post_url,
						'date_range' => 'last-7-days',
					),
				),
				array(
					'identifier' => $this->slug,
					'key'        => 'page-analytics',
					'datapoint'  => 'page-analytics',
					'data'       => array(
						'permaLink'  => $post_url,
						'date_range' => 'last-7-days',
					),
				),
				array(
					'identifier' => $this->slug,
					'key'        => 'search-keywords',
					'datapoint'  => 'search-keywords',
					'data'       => array(
						'permaLink'  => $post_url,
						'date_range' => 'last-7-days',
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
			foreach ( $responses as $key => $response ) {
				if ( is_wp_error( $response ) || ! is_array( $response ) || empty( $response ) || ! isset( $response[0] ) ) {
					continue;
				}

				if ( $response[0]->clicks > 0 || $response[0]->impressions > 0 ) {
					$has_data = true;
					break;
				}
			}

			set_transient( $transient_key, (int) $has_data, 2 * HOUR_IN_SECONDS );
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
			'name'         => __( 'Search Console', 'google-site-kit' ),
			'description'  => __( 'Google Search Console and helps you understand how Google views your site and optimize its performance in search results.', 'google-site-kit' ),
			'cta'          => __( 'Connect your site to Google Search Console.', 'google-site-kit' ),
			'order'        => 1,
			'homepage'     => __( 'https://search.google.com/search-console', 'google-site-kit' ),
			'learn_more'   => __( 'https://www.google.com/webmasters/tools/home', 'google-site-kit' ),
			'force_active' => true,
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
			'webmasters'       => new \Google_Service_Webmasters( $client ),
			'siteverification' => new \Google_Service_SiteVerification( $client ),
		);
	}
}
