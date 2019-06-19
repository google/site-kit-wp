<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\API_Key_Client
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Clients;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Authentication\API_Key;
use Google_Client;

/**
 * Class for connecting to Google APIs via API key.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class API_Key_Client {

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance
	 *
	 * @since 1.0.0
	 * @var Options
	 */
	private $options;

	/**
	 * API Key instance.
	 *
	 * @since 1.0.0
	 * @var API_Key
	 */
	private $api_key;

	/**
	 * Google Client object.
	 *
	 * @since 1.0.0
	 * @var Google_Client
	 */
	private $google_client;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 * @param API_Key $api_key Optional. API key instance. Default is a new instance from $options.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		API_Key $api_key = null
	) {
		$this->context = $context;

		if ( ! $options ) {
			$options = new Options( $this->context );
		}
		$this->options = $options;

		if ( ! $api_key ) {
			$api_key = new API_Key( $this->options );
		}
		$this->api_key = $api_key;
	}

	/**
	 * Gets the Google client object.
	 *
	 * @since 1.0.0
	 *
	 * @return Google_Client Google client object.
	 */
	public function get_client() {
		if ( $this->google_client instanceof Google_Client ) {
			return $this->google_client;
		}

		$this->google_client = new Google_Client();

		$api_key = $this->get_api_key();
		if ( ! empty( $api_key ) ) {
			$this->google_client->setDeveloperKey( $api_key );
		}

		return $this->google_client;
	}

	/**
	 * Gets the API key.
	 *
	 * @since 1.0.0
	 *
	 * @return string|bool API key if it exists, false otherwise.
	 */
	public function get_api_key() {
		/**
		 * Filters the API key that Site Kit should use.
		 *
		 * @since 1.0.0
		 *
		 * @param string $api_key API key, empty by default as it will use the corresponding option.
		 */
		$api_key = trim( apply_filters( 'googlesitekit_api_key', '' ) );

		if ( ! empty( $api_key ) ) {
			return $api_key;
		}

		if ( ! $this->api_key->has() ) {
			return false;
		}

		return $this->api_key->get();
	}

	/**
	 * Sets the API key.
	 *
	 * @since 1.0.0
	 *
	 * @param string $api_key New API key.
	 * @return bool True on success, false on failure.
	 */
	public function set_api_key( $api_key ) {
		// Bail early if nothing change.
		if ( $this->get_api_key() === $api_key ) {
			return true;
		}

		$this->get_client()->setDeveloperKey( $api_key );

		return $this->api_key->set( $api_key );
	}
}
