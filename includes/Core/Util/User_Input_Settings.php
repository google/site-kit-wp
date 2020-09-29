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

use Google\Site_Kit\Core\Authentication\Authentication;
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
	 * @param Authentication  $authentication  Authentication instance.
	 * @param Transients      $transients      Transient API instance.
	 * @param User_Transients $user_transients User Transients API instance.
	 */
	public function __construct(
		Authentication $authentication,
		Transients $transients,
		User_Transients $user_transients
	) {
		$this->authentication  = $authentication;
		$this->transients      = $transients;
		$this->user_transients = $user_transients;
	}

	/**
	 * Determines whether the site is connected to proxy or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return boolean TRUE if connected, otherwise FALSE.
	 */
	private function is_connected_to_proxy() {
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
		$response = wp_remote_post();
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

			$this->trasients->set( 'user_input_settings', $site_settings, WEEK_IN_SECONDS );
			$this->user_transients->set( 'user_input_settings', $user_settings, WEEK_IN_SECONDS );
		}

		return $settigns;
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
			return new \WP_Error();
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
			? $this->sync_with_proxy( $settigns )
			: new \WP_Error();
	}

}
