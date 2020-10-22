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
use WP_Error;

/**
 * Class managing requests to user input settings endpoint.
 *
 * @since 1.19.0
 * @access private
 * @ignore
 */
class User_Input_Settings {

	const TRANSIENT_NAME = 'googlesitekit_user_input_settings';

	/**
	 * Authentication instance.
	 *
	 * @since 1.19.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Transients instance.
	 *
	 * @since 1.19.0
	 * @var Transients
	 */
	private $transients;

	/**
	 * User_Transients instance.
	 *
	 * @since 1.19.0
	 * @var User_Transients
	 */
	private $user_transients;

	/**
	 * Constructor.
	 *
	 * @since 1.19.0
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
	 * @since 1.19.0
	 *
	 * @return boolean TRUE if connected, otherwise FALSE.
	 */
	protected function is_connected_to_proxy() {
		return (bool) $this->authentication->is_authenticated()
			&& $this->authentication->credentials()->has()
			&& $this->authentication->credentials()->using_proxy();
	}

	/**
	 * Sends POST request to the proxy's settings endpoint to sync user input settings.
	 *
	 * @since 1.19.0
	 *
	 * @param array $settings User settings.
	 * @return array|WP_Error User input settings.
	 */
	private function sync_with_proxy( $settings = null ) {
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
			return new WP_Error(
				'user_input_settings_request',
				__( 'User input settings request failed.', 'google-site-kit' ),
				array( 'status' => $code )
			);
		}

		$body     = wp_remote_retrieve_body( $response );
		$settings = json_decode( $body, true );

		if ( is_array( $settings ) ) {
			$this->cache_settings( $settings );
		}

		return $settings;
	}

	/**
	 * Caches user input settings received from the proxy server.
	 *
	 * @since 1.19.0
	 *
	 * @param array $settings Array with user input settings.
	 */
	private function cache_settings( array $settings ) {
		$site_settings = array();
		$user_settings = array();

		foreach ( $settings as $setting_key => $setting_data ) {
			if ( ! isset( $setting_data['scope'] ) || ! isset( $setting_data['values'] ) ) {
				continue;
			}

			$values = is_array( $setting_data['values'] ) ? $setting_data['values'] : array();
			if ( 'site' === $setting_data['scope'] ) {
				$site_settings[ $setting_key ] = $values;
			} elseif ( 'user' === $setting_data['scope'] ) {
				$user_settings[ $setting_key ] = $values;
			}
		}

		$this->transients->set( self::TRANSIENT_NAME, $site_settings, WEEK_IN_SECONDS );
		$this->user_transients->set( self::TRANSIENT_NAME, $user_settings, WEEK_IN_SECONDS );
	}

	/**
	 * Gets user input settings.
	 *
	 * @since 1.19.0
	 *
	 * @return array|WP_Error User input settings.
	 */
	public function get_settings() {
		if ( ! $this->is_connected_to_proxy() ) {
			return new WP_Error(
				'not_connected',
				__( 'Not Connected', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		$data = array(
			'site' => $this->transients->get( self::TRANSIENT_NAME ),
			'user' => $this->user_transients->get( self::TRANSIENT_NAME ),
		);

		if ( ! is_array( $data['site'] ) || ! is_array( $data['user'] ) ) {
			return $this->sync_with_proxy();
		}

		$settings = array();

		foreach ( $data as $scope => $values ) {
			foreach ( $values as $key => $value ) {
				$settings[ $key ] = array(
					'values' => $value,
					'scope'  => $scope,
				);
			}
		}

		return $settings;
	}

	/**
	 * Sets user input settings.
	 *
	 * @since 1.19.0
	 *
	 * @param array $settings User settings.
	 * @return array|WP_Error User input settings.
	 */
	public function set_settings( $settings ) {
		return $this->is_connected_to_proxy()
			? $this->sync_with_proxy( $settings )
			: new WP_Error(
				'not_connected',
				__( 'Not Connected', 'google-site-kit' ),
				array( 'status' => 400 )
			);
	}

}
