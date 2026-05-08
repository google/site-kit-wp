<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Exception;
use Google\Site_Kit_Dependencies\Google_Client;
use WP_Error;

/**
 * Reads Google user profile data.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
class Profile_Reader implements Profile_Reader_Interface {

	/**
	 * Settings instance.
	 *
	 * @since 1.141.0
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.141.0
	 *
	 * @param Settings $settings Settings instance.
	 */
	public function __construct( Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Gets the user profile data using the provided ID token.
	 *
	 * @since 1.141.0
	 *
	 * @param string $id_token ID token.
	 * @return array|WP_Error User profile data or WP_Error on failure.
	 */
	public function get_profile_data( $id_token ) {
		try {
			$settings      = $this->settings->get();
			$google_client = new Google_Client( array( 'client_id' => $settings['clientID'] ) );

			$payload = $google_client->verifyIdToken( $id_token );
			if ( empty( $payload['sub'] ) || empty( $payload['email'] ) || empty( $payload['email_verified'] ) ) {
				return new WP_Error( 'googlesitekit_siwg_bad_payload' );
			}

			return $payload;
		} catch ( Exception $e ) {
			return new WP_Error( 'googlesitekit_siwg_failed_to_get_payload', $e->getMessage() );
		}
	}
}
