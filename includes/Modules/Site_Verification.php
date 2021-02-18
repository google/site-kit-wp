<?php
/**
 * Class Google\Site_Kit\Modules\Site_Verification
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Util\Exit_Handler;
use Google\Site_Kit\Core\Util\Google_URL_Matcher_Trait;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Google\Site_Kit_Dependencies\Google_Service_SiteVerification;
use Google\Site_Kit_Dependencies\Google_Service_SiteVerification_SiteVerificationWebResourceGettokenRequest;
use Google\Site_Kit_Dependencies\Google_Service_SiteVerification_SiteVerificationWebResourceGettokenRequestSite;
use Google\Site_Kit_Dependencies\Google_Service_SiteVerification_SiteVerificationWebResourceResource;
use Google\Site_Kit_Dependencies\Google_Service_SiteVerification_SiteVerificationWebResourceResourceSite;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;
use Exception;

/**
 * Class representing the Site Verification module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Site_Verification extends Module implements Module_With_Scopes {
	use Module_With_Scopes_Trait, Google_URL_Matcher_Trait;

	/**
	 * Meta site verification type.
	 */
	const VERIFICATION_TYPE_META = 'META';

	/**
	 * File site verification type.
	 */
	const VERIFICATION_TYPE_FILE = 'FILE';

	/**
	 * Verification meta tag cache key.
	 */
	const TRANSIENT_VERIFICATION_META_TAGS = 'googlesitekit_verification_meta_tags';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		add_action(
			'admin_action_' . Google_Proxy::ACTION_SETUP,
			function() {
				$this->handle_verification_token();
			},
			0
		);

		$print_site_verification_meta = function() {
			$this->print_site_verification_meta();
		};

		add_action( 'wp_head', $print_site_verification_meta );
		add_action( 'login_head', $print_site_verification_meta );

		add_action(
			'googlesitekit_authorize_user',
			function() {
				$this->user_options->set( Verification::OPTION, 'verified' );
			}
		);

		add_action(
			'init',
			function () {
				$request_uri    = $this->context->input()->filter( INPUT_SERVER, 'REQUEST_URI' );
				$request_method = $this->context->input()->filter( INPUT_SERVER, 'REQUEST_METHOD' );

				if (
					( $request_uri && $request_method )
					&& 'GET' === strtoupper( $request_method )
					&& preg_match( '/^\/google(?P<token>[a-z0-9]+)\.html$/', $request_uri, $matches )
				) {
					$this->serve_verification_file( $matches['token'] );
				}
			}
		);

		$clear_verification_meta_cache = function ( $meta_id, $object_id, $meta_key ) {
			if ( $this->user_options->get_meta_key( Verification_Meta::OPTION ) === $meta_key ) {
				( new Transients( $this->context ) )->delete( self::TRANSIENT_VERIFICATION_META_TAGS );
			}
		};
		add_action( 'added_user_meta', $clear_verification_meta_cache, 10, 3 );
		add_action( 'updated_user_meta', $clear_verification_meta_cache, 10, 3 );
		add_action( 'deleted_user_meta', $clear_verification_meta_cache, 10, 3 );
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
			'https://www.googleapis.com/auth/siteverification',
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
			'GET:verification'       => array( 'service' => 'siteverification' ),
			'POST:verification'      => array( 'service' => 'siteverification' ),
			'GET:verification-token' => array( 'service' => 'siteverification' ),
			'GET:verified-sites'     => array( 'service' => 'siteverification' ),
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
			case 'GET:verification':
				return $this->get_siteverification_service()->webResource->listWebResource();
			case 'POST:verification':
				if ( ! isset( $data['siteURL'] ) ) {
					/* translators: %s: Missing parameter name */
					return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'siteURL' ), array( 'status' => 400 ) );
				}

				return function() use ( $data ) {
					$current_user = wp_get_current_user();

					if ( ! $current_user || ! $current_user->exists() ) {
						return new WP_Error( 'unknown_user', __( 'Unknown user.', 'google-site-kit' ) );
					}

					$site = $this->get_data( 'verification', $data );

					if ( is_wp_error( $site ) ) {
						return $site;
					}

					$sites = array();

					if ( ! empty( $site['verified'] ) ) {
						$this->authentication->verification()->set( true );

						return $site;
					} else {
						$token = $this->get_data( 'verification-token', $data );

						if ( is_wp_error( $token ) ) {
							return $token;
						}

						$this->authentication->verification_meta()->set( $token['token'] );

						$restore_defer = $this->with_client_defer( false );
						$errors        = new WP_Error();

						foreach ( $this->permute_site_url( $data['siteURL'] ) as $url ) {
							$site = new Google_Service_SiteVerification_SiteVerificationWebResourceResourceSite();
							$site->setType( 'SITE' );
							$site->setIdentifier( $url );
							$resource = new Google_Service_SiteVerification_SiteVerificationWebResourceResource();
							$resource->setSite( $site );

							try {
								$sites[] = $this->get_siteverification_service()->webResource->insert( 'META', $resource );
							} catch ( Google_Service_Exception $e ) {
								$messages = wp_list_pluck( $e->getErrors(), 'message' );
								$message  = array_shift( $messages );

								$errors->add( $e->getCode(), $message, array( 'url' => $url ) );
							} catch ( Exception $e ) {
								$errors->add( $e->getCode(), $e->getMessage(), array( 'url' => $url ) );
							}
						}

						$restore_defer();

						if ( empty( $sites ) ) {
							return $errors;
						}
					}

					$this->authentication->verification()->set( true );

					try {
						$verification = $this->get_siteverification_service()->webResource->get( $data['siteURL'] );
					} catch ( Google_Service_Exception $e ) {
						$verification = array_shift( $sites );
					}

					return array(
						'identifier' => $verification->getSite()->getIdentifier(),
						'type'       => $verification->getSite()->getType(),
						'verified'   => true,
					);
				};
			case 'GET:verification-token':
				$existing_token = $this->authentication->verification_meta()->get();

				if ( ! empty( $existing_token ) ) {
					return function() use ( $existing_token ) {
						return array(
							'method' => 'META',
							'token'  => $existing_token,
						);
					};
				}

				$current_url = ! empty( $data['siteURL'] ) ? $data['siteURL'] : $this->context->get_reference_site_url();
				$site        = new Google_Service_SiteVerification_SiteVerificationWebResourceGettokenRequestSite();
				$site->setIdentifier( $current_url );
				$site->setType( 'SITE' );
				$request = new Google_Service_SiteVerification_SiteVerificationWebResourceGettokenRequest();
				$request->setSite( $site );
				$request->setVerificationMethod( 'META' );

				return $this->get_siteverification_service()->webResource->getToken( $request );
			case 'GET:verified-sites':
				return $this->get_siteverification_service()->webResource->listWebResource();
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
			case 'GET:verification':
				if ( $data['siteURL'] ) {
					$current_url = $data['siteURL'];
				} else {
					$current_url = $this->context->get_reference_site_url();
				}

				$items = $response->getItems();
				foreach ( $items as $item ) {
					$site = $item->getSite();

					$match = false;
					if ( 'INET_DOMAIN' === $site->getType() ) {
						$match = $this->is_domain_match( $site->getIdentifier(), $current_url );
					} elseif ( 'SITE' === $site->getType() ) {
						$match = $this->is_url_match( $site->getIdentifier(), $current_url );
					}

					if ( $match ) {
						return array(
							'identifier' => $site->getIdentifier(),
							'type'       => $site->getType(),
							'verified'   => true,
						);
					}
				}

				return array(
					'identifier' => $current_url,
					'type'       => 'SITE',
					'verified'   => false,
				);
			case 'GET:verification-token':
				if ( is_array( $response ) ) {
					return $response;
				}

				return array(
					'method' => $response->getMethod(),
					'token'  => $response->getToken(),
				);
			case 'GET:verified-sites':
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
		}

		return parent::parse_data_response( $data, $response );
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
			'slug'         => 'site-verification',
			'name'         => _x( 'Site Verification', 'Service name', 'google-site-kit' ),
			'description'  => __( 'Google Site Verification allows you to manage ownership of your site.', 'google-site-kit' ),
			'cta'          => __( 'Verify ownership with Google Site Verification.', 'google-site-kit' ),
			'order'        => 0,
			'homepage'     => __( 'https://www.google.com/webmasters/verification/home', 'google-site-kit' ),
			'learn_more'   => __( 'https://developers.google.com/site-verification/', 'google-site-kit' ),
			'force_active' => true,
			'internal'     => true,
		);
	}

	/**
	 * Get the configured siteverification service instance.
	 *
	 * @return Google_Service_SiteVerification The Site Verification API service.
	 */
	private function get_siteverification_service() {
		return $this->get_service( 'siteverification' );
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
			'siteverification' => new Google_Service_SiteVerification( $client ),
		);
	}

	/**
	 * Handles receiving a verification token for a user by the authentication proxy.
	 *
	 * @since 1.1.0
	 * @since 1.1.2 Runs on `admin_action_googlesitekit_proxy_setup` and no longer redirects directly.
	 */
	private function handle_verification_token() {
		$verification_token = $this->context->input()->filter( INPUT_GET, 'googlesitekit_verification_token', FILTER_SANITIZE_STRING );
		$verification_type  = $this->context->input()->filter( INPUT_GET, 'googlesitekit_verification_token_type', FILTER_SANITIZE_STRING );
		$verification_type  = $verification_type ?: self::VERIFICATION_TYPE_META;

		if ( empty( $verification_token ) ) {
			return;
		}

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You don\'t have permissions to set up Site Kit.', 'google-site-kit' ), 403 );
		}

		switch ( $verification_type ) {
			case self::VERIFICATION_TYPE_FILE:
				$this->authentication->verification_file()->set( $verification_token );
				break;
			case self::VERIFICATION_TYPE_META:
				$this->authentication->verification_meta()->set( $verification_token );
		}

		add_filter(
			'googlesitekit_proxy_setup_url_params',
			function ( $params ) use ( $verification_type ) {
				return array_merge(
					$params,
					array(
						'verify'              => 'true',
						'verification_method' => $verification_type,
					)
				);
			}
		);
	}

	/**
	 * Prints site verification meta in wp_head().
	 *
	 * @since 1.1.0
	 */
	private function print_site_verification_meta() {
		// Get verification meta tags for all users.
		$verification_tags = $this->get_all_verification_tags();
		$allowed_html      = array(
			'meta' => array(
				'name'    => array(),
				'content' => array(),
			),
		);

		foreach ( $verification_tags as $verification_tag ) {
			$verification_tag = html_entity_decode( $verification_tag );

			if ( 0 !== strpos( $verification_tag, '<meta ' ) ) {
				$verification_tag = '<meta name="google-site-verification" content="' . esc_attr( $verification_tag ) . '">';
			}

			echo wp_kses( $verification_tag, $allowed_html );
		}
	}

	/**
	 * Gets all available verification tags for all users.
	 *
	 * This is a special method needed for printing all meta tags in the frontend.
	 *
	 * @since 1.4.0
	 *
	 * @return array List of verification meta tags.
	 */
	private function get_all_verification_tags() {
		global $wpdb;

		$transients = new Transients( $this->context );
		$meta_tags  = $transients->get( self::TRANSIENT_VERIFICATION_META_TAGS );

		if ( ! is_array( $meta_tags ) ) {
			$meta_key = $this->user_options->get_meta_key( Verification_Meta::OPTION );
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$meta_tags = $wpdb->get_col(
				$wpdb->prepare( "SELECT DISTINCT meta_value FROM {$wpdb->usermeta} WHERE meta_key = %s", $meta_key )
			);
			$transients->set( self::TRANSIENT_VERIFICATION_META_TAGS, $meta_tags );
		}

		return array_filter( $meta_tags );
	}

	/**
	 * Serves the verification file response.
	 *
	 * @param string $verification_token Token portion of verification.
	 *
	 * @since 1.1.0
	 */
	private function serve_verification_file( $verification_token ) {
		$user_ids = ( new \WP_User_Query(
			array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key'   => $this->user_options->get_meta_key( Verification_File::OPTION ),
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'meta_value' => $verification_token,
				'fields'     => 'id',
				'number'     => 1,
			)
		) )->get_results();

		$user_id = array_shift( $user_ids ) ?: 0;

		if ( $user_id && user_can( $user_id, Permissions::SETUP ) ) {
			printf( 'google-site-verification: google%s.html', esc_html( $verification_token ) );
			( new Exit_Handler() )->invoke();
		}

		// If the user does not have the necessary permissions then let the request pass through.
	}
}
