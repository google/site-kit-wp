<?php
/**
 * Class Google\Site_Kit\Core\Util\User_Input_Settings
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Transients;

/**
 * Class managing requests to user input settings endpoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Input_Settings {

	/**
	 * Authentication object.
	 *
	 * @since n.e.x.t
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Transients object.
	 *
	 * @since n.e.x.t
	 * @var Transients
	 */
	private $transients;

	/**
	 * User_Transients object.
	 *
	 * @since n.e.x.t
	 * @var User_Transients
	 */
	private $user_transients;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context         $context         Plugin context.
	 * @param Authentication  $authentication  Optional. Authentication instance. Default a new instance.
	 * @param Transients      $transients      Optional. Transient API instance. Default a new instance.
	 * @param User_Transients $user_transients Optional. User Transients API instance. Default a new instance.
	 */
	public function __construct(
		Context $context,
		Authentication $authentication = null,
		Transients $transients = null,
		User_Transients $user_transients = null
	) {
		$this->transients      = $transients ?: new Transients( $context );
		$this->user_transients = $user_transients ?: new User_Transients( $context );
		$this->authentication  = $authentication ?: new Authentication( $context, null, null, $this->transients );
	}

	/**
	 * Determines whether the site is connected to proxy or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return boolean TRUE if connected, otherwise FALSE.
	 */
	private function is_connected_to_proxy() {
		if ( ! $this->authentication->is_authenticated() ) {
			return false;
		}

		$credentials = $this->authentication->credentials();
		if ( $credentials ) {
			if ( ! $credentials->using_proxy() || ! $credentials->has() ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Sends POST request to the proxy's settings endpoint to sync user input settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings User settings.
	 * @return array User input settings.
	 */
	private function sync_with_proxy( $settings ) {
		$user_input_settings_url  = $this->authentication->get_google_proxy()->url( Google_Proxy::USER_INPUT_SETTINGS_URI );
		$user_input_settings_args = array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $this->authentication->get_oauth_client()->get_access_token(),
			),
		);

		if ( ! empty( $settings ) ) {
			$user_input_settings_args['headers']['Content-Type'] = 'application/json';
			$user_input_settings_args['body']                    = wp_json_encode( $settings );
		}

		$response = wp_remote_post( $user_input_settings_url, $user_input_settings_args );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || 299 < $code ) {
			return new \WP_Error(
				'user_input_settings_request',
				__( 'User input settings request failed.', 'google-site-kit' ),
				array( 'status' => $code )
			);
		}

		$body     = wp_remote_retrieve_body( $response );
		$settings = json_decode( $body, true );
		if ( is_array( $settings ) ) {
			$site_settings = array();
			$user_settings = array();

			foreach ( $settings as $setting_key => $setting_data ) {
				if ( isset( $setting_data['scope'] ) ) {
					if ( 'site' === $setting_data['scope'] ) {
						$site_settings[ $setting_key ] = ! empty( $setting_data['value'] )
							? $setting_data['value']
							: array();
					} elseif ( 'user' === $setting_data['scope'] ) {
						$user_settings[ $setting_key ] = ! empty( $setting_data['value'] )
							? $setting_data['value']
							: array();
					}
				}
			}

			$this->transients->set( 'user_input_settings', $site_settings, WEEK_IN_SECONDS );
			$this->user_transients->set( 'user_input_settings', $user_settings, WEEK_IN_SECONDS );
		}

		return $settings;
	}

	/**
	 * Gets user input settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array User input settings.
	 */
	public function get_settings() {
		if ( ! $this->is_connected_to_proxy() ) {
			return new \WP_Error( 'not_connected', __( 'Not Connected', 'google-site-kit' ), array( 'status' => 400 ) );
		}

		$data = array(
			'site' => $this->transients->get( 'user_input_settings' ),
			'user' => $this->user_transients->get( 'user_input_settings' ),
		);

		if ( ! is_array( $data['site'] ) || ! is_array( $data['user'] ) ) {
			return $this->sync_with_proxy( null );
		}

		$settings = array();

		foreach ( $data as $scope => $values ) {
			foreach ( $values as $key => $value ) {
				$settigns[ $key ] = array(
					'value' => $value,
					'scope' => $scope,
				);
			}
		}

		return $settings;
	}

	/**
	 * Sets user input settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings User settings.
	 * @return array User input settings.
	 */
	public function set_settings( $settings ) {
		return $this->is_connected_to_proxy()
			? $this->sync_with_proxy( $settings )
			: new \WP_Error( 'not_connected', __( 'Not Connected', 'google-site-kit' ), array( 'status' => 400 ) );
	}

}
