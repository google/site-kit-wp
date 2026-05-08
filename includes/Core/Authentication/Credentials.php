<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Credentials
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class representing the OAuth client ID and secret credentials.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Credentials extends Setting {

	/**
	 * Option key in options table.
	 */
	const OPTION = 'googlesitekit_credentials';

	/**
	 * Retrieves Site Kit credentials.
	 *
	 * @since 1.0.0
	 *
	 * @return array|bool Value set for the credentials, or false if not set.
	 */
	public function get() {
		/**
		 * Site Kit oAuth Secret is a JSON string of the Google Cloud Platform web application used for Site Kit
		 * that will be associated with this account. This is meant to be a temporary way to specify the client secret
		 * until the authentication proxy has been completed. This filter can be specified from a separate theme or plugin.
		 *
		 * To retrieve the JSON secret, use the following instructions:
		 * - Go to the Google Cloud Platform and create a new project or use an existing one
		 * - In the APIs & Services section, enable the APIs that are used within Site Kit
		 * - Under 'credentials' either create new oAuth Client ID credentials or use an existing set of credentials
		 * - Set the authorizes redirect URIs to be the URL to the oAuth callback for Site Kit, eg. https://<domainname>?oauth2callback=1 (this must be public)
		 * - Click the 'Download JSON' button to download the JSON file that can be copied and pasted into the filter
		 */
		$credentials = apply_filters( 'googlesitekit_oauth_secret', '' );

		if ( is_string( $credentials ) && trim( $credentials ) ) {
			$credentials = json_decode( $credentials, true );
		}

		if ( isset( $credentials['web']['client_id'], $credentials['web']['client_secret'] ) ) {
			return $this->parse_defaults(
				array(
					'oauth2_client_id'     => $credentials['web']['client_id'],
					'oauth2_client_secret' => $credentials['web']['client_secret'],
				)
			);
		}

		return $this->parse_defaults(
			$this->options->get( self::OPTION )
		);
	}

	/**
	 * Checks whether Site Kit has been setup with client ID and secret.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if credentials are set, false otherwise.
	 */
	public function has() {
		$credentials = (array) $this->get();
		if ( ! empty( $credentials ) && ! empty( $credentials['oauth2_client_id'] ) && ! empty( $credentials['oauth2_client_secret'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Parses Credentials data and merges with its defaults.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $data Credentials data.
	 * @return array Parsed $data.
	 */
	private function parse_defaults( $data ) {
		$defaults = $this->get_default();

		if ( ! is_array( $data ) ) {
			return $defaults;
		}

		return wp_parse_args( $data, $defaults );
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.2.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'oauth2_client_id'     => '',
			'oauth2_client_secret' => '',
		);
	}

	/**
	 * Determines whether the authentication proxy is used.
	 *
	 * In order to streamline the setup and authentication flow, the plugin uses a proxy mechanism based on an external
	 * service. This can be overridden by providing actual GCP credentials with the {@see 'googlesitekit_oauth_secret'}
	 * filter.
	 *
	 * @since 1.9.0
	 *
	 * @return bool True if proxy authentication is used, false otherwise.
	 */
	public function using_proxy() {
		$creds = $this->get();

		if ( ! $this->has() ) {
			return true;
		}

		return (bool) preg_match( '/\.apps\.sitekit\.withgoogle\.com$/', $creds['oauth2_client_id'] );
	}
}
