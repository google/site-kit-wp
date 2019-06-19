<?php
/**
 * Class Google\Site_Kit\Core\Authentication\API_Key
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Encrypted_Options;

/**
 * Class controlling the Site Kit API Key.
 *
 * @since 0.1.0
 */
final class API_Key {

	const OPTION = 'googlesitekit_api_key';

	/**
	 * Encrypted_Options object.
	 *
	 * @since 1.0.0
	 * @var Encrypted_Options
	 */
	private $encrypted_options;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Options $options Options instance.
	 */
	public function __construct( Options $options ) {
		$this->encrypted_options = new Encrypted_Options( $options );
	}

	/**
	 * Checks whether an API key is set.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if the apikey is not empty.
	 */
	public function has() {
		$apikey = $this->get();
		return ! empty( $apikey );
	}

	/**
	 * Retrieves the API key.
	 *
	 * @since 1.0.0
	 *
	 * @return string|bool API key, or false if not set.
	 */
	public function get() {
		return $this->encrypted_options->get( self::OPTION );
	}

	/**
	 * Saves the API key.
	 *
	 * @since 1.0.0
	 *
	 * @param string $key API key.
	 * @return bool True on success, false on failure.
	 */
	public function set( $key ) {
		return $this->encrypted_options->set( self::OPTION, $key );
	}
}
