<?php
/**
 * Class Google\Site_Kit\Core\Util\User_Input_Settings
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\User_Input_State;
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
	 * Determines whether the current user input settings have empty values or not.
	 *
	 * @since 1.21.0
	 *
	 * @param array $settings The settings to check.
	 * @return boolean|null TRUE if at least one of the settings has empty values, otherwise FALSE. If a request to the proxy server fails, it will return NULL.
	 */
	public function are_settings_empty( $settings = array() ) {
		if ( empty( $settings ) ) {
			$settings = $this->get_settings();
			if ( is_wp_error( $settings ) ) {
				// NULL is like an undefined here and means that we can't say exactly
				// whether the settings are empty or not because we can't pull data from
				// the proxy server. It's quite unlikely that we can get an error here,
				// but we need to be prepared in case it suddenly happens.
				return null;
			}
		}

		$empty_settings = array_filter(
			$settings,
			function( $setting ) {
				return empty( $setting['values'] );
			}
		);

		return 0 < count( $empty_settings );
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
		$creds        = $this->authentication->credentials();
		$access_token = (string) $this->authentication->get_oauth_client()->get_access_token();
		$response     = $this->authentication->get_google_proxy()->sync_user_input_settings( $creds, $access_token, $settings );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( is_array( $response ) ) {
			$this->cache_settings( $response );
		}

		return $response;
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

			if ( 'site' === $setting_data['scope'] ) {
				$site_settings[ $setting_key ] = $setting_data;
			} elseif ( 'user' === $setting_data['scope'] ) {
				$user_settings[ $setting_key ] = $setting_data;
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

		$user_id  = get_current_user_id();
		$settings = array_merge( $data['site'], $data['user'] );

		foreach ( $settings as &$setting ) {
			if ( ! isset( $setting['answeredBy'] ) ) {
				continue;
			}

			$answered_by = intval( $setting['answeredBy'] );
			unset( $setting['answeredBy'] );

			if ( ! $answered_by || $answered_by === $user_id ) {
				continue;
			}

			$setting['author'] = array(
				'photo' => get_avatar_url( $answered_by ),
				'name'  => get_the_author_meta( 'user_email', $answered_by ),
			);
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
		if ( ! $this->is_connected_to_proxy() ) {
			return new WP_Error(
				'not_connected',
				__( 'Not Connected', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		$response = $this->sync_with_proxy( $settings );
		if ( ! is_wp_error( $response ) ) {
			$is_empty = $this->are_settings_empty( $response );
			if ( ! is_null( $is_empty ) ) {
				$this->authentication->get_user_input_state()->set( $is_empty ? User_Input_State::VALUE_MISSING : User_Input_State::VALUE_COMPLETED );
			}
		}

		return $response;
	}

}
