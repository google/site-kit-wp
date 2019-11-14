<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Profile
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit_Dependencies\Google_Service_PeopleService;

/**
 * Class controlling the user's Google profile.
 *
 * @since 0.1.0
 */
final class Profile {

	/**
	 * Option key in options table.
	 */
	const OPTION = 'googlesitekit_profile';

	/**
	 * User_Options instance.
	 *
	 * @since 1.0.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * OAuth_Client OAuth client instance.
	 *
	 * @since 1.0.0
	 * @var OAuth_Client
	 */
	protected $auth_client;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param User_Options $user_options User_Options instance.
	 * @param OAuth_Client $auth_client  OAuth_Client instance.
	 */
	public function __construct( User_Options $user_options, OAuth_Client $auth_client ) {
		$this->user_options = $user_options;
		$this->auth_client  = $auth_client;
	}

	/**
	 * Retrieves user profile data.
	 *
	 * @since 1.0.0
	 *
	 * @return array|bool Value set for the profile, or false if not set.
	 */
	public function get() {
		// Ensure we have fresh profile data.
		$profile_data = $this->user_options->get( self::OPTION );
		$profile_time = isset( $profile_data['timestamp'] ) ? (int) $profile_data['timestamp'] : 0;
		$current_time = current_time( 'timestamp' );

		// If the stored profile data is missing, or older than a week, re-fetch it.
		if ( ! $profile_data || ( $current_time - $profile_time ) > WEEK_IN_SECONDS ) {
			$profile_data = $this->retrieve_google_profile_from_api();
		}

		return $profile_data;
	}

	/**
	 * Saves user profile data.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data User profile data: email and photo.
	 * @return bool True on success, false on failure.
	 */
	public function set( $data ) {
		return $this->user_options->set( self::OPTION, $data );
	}

	/**
	 * Verifies if user has their profile information stored.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if profile is set, false otherwise.
	 */
	public function has() {
		$profile = (array) $this->get();
		if ( ! empty( $profile ) && ! empty( $profile['email'] ) && ! empty( $profile['photo'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Retrieves the user profile data from the People API.
	 *
	 * @return array The user profile data. Falls back to the user's WordPress profile data on failure.
	 */
	private function retrieve_google_profile_from_api() {

		$profile_data = false;

		// Retrieve and store the user's Google profile data.
		try {
			$client         = $this->auth_client->get_client();
			$people_service = new Google_Service_PeopleService( $client );
			$profile        = $people_service->people->get( 'people/me', array( 'personFields' => 'emailAddresses,photos' ) );

			if ( isset( $profile['emailAddresses'][0]['value'], $profile['photos'][0]['url'] ) ) {
				$profile_data = array(
					'email'     => $profile['emailAddresses'][0]['value'],
					'photo'     => $profile['photos'][0]['url'],
					'timestamp' => current_time( 'timestamp' ),
				);

				$this->set( $profile_data );
			}
		} catch ( \Exception $e ) {
			return $profile_data;
		}

		return $profile_data;
	}
}
