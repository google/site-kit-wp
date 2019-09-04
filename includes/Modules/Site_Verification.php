<?php
/**
 * Class Google\Site_Kit\Modules\Site_Verification
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
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
 * Class representing the Site Verification module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Site_Verification extends Module implements Module_With_Scopes {
	use Module_With_Scopes_Trait;

	/**
	 * Temporary storage for very specific data for 'verification' datapoint.
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
	 * Returns the mapping between available datapoints and their services.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of $datapoint => $service_identifier pairs.
	 */
	protected function get_datapoint_services() {
		return array(
			// GET.
			'verification'       => 'siteverification',
			'verification-token' => 'siteverification',
			'verified-sites'     => 'siteverification',

			// POST.
			'verification'       => '',
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
				case 'verified-sites':
					return $this->get_siteverification_service()->webResource->listWebResource();
				case 'verification':
					// This is far from optimal and hacky, but works for now.
					if ( ! empty( $data['siteURL'] ) ) {
						$this->_siteverification_list_data = $data;
					}

					return $this->get_siteverification_service()->webResource->listWebResource();
				case 'verification-token':
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

					return $this->get_siteverification_service()->webResource->getToken( $request );
			}
		} elseif ( 'POST' === $method ) {
			switch ( $datapoint ) {
				case 'verification':
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
							return $site;
						} else {
							$token = $this->get_data( 'verification-token', $data );

							if ( is_wp_error( $token ) ) {
								return $token;
							}

							$this->authentication->verification_tag()->set( $token['token'] );

							$client     = $this->get_client();
							$orig_defer = $client->shouldDefer();
							$client->setDefer( false );
							$errors = new WP_Error();

							foreach ( $this->permute_site_url( $data['siteURL'] ) as $url ) {
								$site = new \Google_Service_SiteVerification_SiteVerificationWebResourceResourceSite();
								$site->setType( 'SITE' );
								$site->setIdentifier( $url );
								$resource = new \Google_Service_SiteVerification_SiteVerificationWebResourceResource();
								$resource->setSite( $site );

								try {
									$sites[] = $this->get_siteverification_service()->webResource->insert( 'META', $resource ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
								} catch ( Google_Service_Exception $e ) {
									$messages = wp_list_pluck( $e->getErrors(), 'message' );
									$message  = array_shift( $messages );

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

						$verification = $this->get_siteverification_service()->webResource->get( $data['siteURL'] );

						return array(
							'identifier' => $data['siteURL'],
							'type'       => $verification->getSite()->getType(),
							'verified'   => true,
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
				case 'verification':
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
				case 'verification-token':
					if ( is_array( $response ) ) {
						return $response;
					}

					return array(
						'method' => $response->getMethod(),
						'token'  => $response->getToken(),
					);
			}
		}

		return $response;
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
			'name'         => __( 'Site Verification', 'google-site-kit' ),
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
	 * @return Google_Service|\Google_Service_SiteVerification
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
	 *
	 * @param Google_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Client $client ) {
		return array(
			'siteverification' => new \Google_Service_SiteVerification( $client ),
		);
	}
}
