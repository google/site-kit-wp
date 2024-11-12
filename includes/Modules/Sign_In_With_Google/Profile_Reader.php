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

/**
 * Reads Google user profile data.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Profile_Reader implements Profile_Reader_Interface {

	/**
	 * Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Settings $settings Settings instance.
	 */
	public function __construct( Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Gets the user profile data using the provided ID token.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id_token ID token.
	 * @return array|WP_Error User profile data or WP_Error on failure.
	 */
	public function get_profile_data( $id_token ) {
		try {
			$settings      = $this->settings->get();
			$google_client = new Google_Client( array( 'client_id' => $settings['clientID'] ) );

			$payload = $google_client->verifyIdToken( $id_token );
			if ( empty( $payload['sub'] ) || empty( $payload['email'] ) ) {
				return new WP_Error( 'googlesitekit_siwg_bad_payload' );
			}

			return $payload;
		} catch ( \Exception $e ) {
			return new WP_Error( 'googlesitekit_siwg_failed_to_get_payload', $e->getMessage() );
		}
	}

}
