<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Token
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Encrypted_User_Options;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;

/**
 * Class representing the OAuth token for a user.
 *
 * This includes the access token, its creation and expiration data, and the refresh token.
 * This class is compatible with `Google\Site_Kit\Core\Storage\User_Setting`, as it should in the future be adjusted
 * so that the four pieces of data become a single user setting.
 *
 * @since 1.39.0
 * @access private
 * @ignore
 */
final class Token {

	/**
	 * User_Options instance.
	 *
	 * @since 1.39.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Encrypted_User_Options instance.
	 *
	 * @since 1.39.0
	 * @var Encrypted_User_Options
	 */
	private $encrypted_user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.39.0
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->user_options           = $user_options;
		$this->encrypted_user_options = new Encrypted_User_Options( $this->user_options );
	}

	/**
	 * Checks whether or not the setting exists.
	 *
	 * @since 1.39.0
	 *
	 * @return bool True on success, false on failure.
	 */
	public function has() {
		if ( ! $this->get() ) {
			return false;
		}

		return true;
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.39.0
	 *
	 * @return mixed Value set for the option, or default if not set.
	 */
	public function get() {
		$access_token = $this->encrypted_user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN );
		if ( empty( $access_token ) ) {
			return array();
		}

		$token = array(
			'access_token' => $access_token,
			'expires_in'   => (int) $this->user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN ),
			'created'      => (int) $this->user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED ),
		);

		$refresh_token = $this->encrypted_user_options->get( OAuth_Client::OPTION_REFRESH_TOKEN );
		if ( ! empty( $refresh_token ) ) {
			$token['refresh_token'] = $refresh_token;
		}

		return $token;
	}

	/**
	 * Sets the value of the setting with the given value.
	 *
	 * @since 1.39.0
	 *
	 * @param mixed $value Setting value. Must be serializable if non-scalar.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function set( $value ) {
		if ( empty( $value['access_token'] ) ) {
			return false;
		}

		// Use reasonable defaults for these fields.
		if ( empty( $value['expires_in'] ) ) {
			$value['expires_in'] = HOUR_IN_SECONDS;
		}
		if ( empty( $value['created'] ) ) {
			$value['created'] = time();
		}

		$this->encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, $value['access_token'] );
		$this->user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $value['expires_in'] );
		$this->user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $value['created'] );

		if ( ! empty( $value['refresh_token'] ) ) {
			$this->encrypted_user_options->set( OAuth_Client::OPTION_REFRESH_TOKEN, $value['refresh_token'] );
		}

		return true;
	}

	/**
	 * Deletes the setting.
	 *
	 * @since 1.39.0
	 *
	 * @return bool True on success, false on failure.
	 */
	public function delete() {
		$this->user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN );
		$this->user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN );
		$this->user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED );
		$this->user_options->delete( OAuth_Client::OPTION_REFRESH_TOKEN );
		return true;
	}
}
