<?php
/**
 * UserOptionsTestTrait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Util\Tracking;

trait UserOptionsTestTrait {

	protected function get_user_option_keys() {
		return array(
			OAuth_Client::OPTION_ACCESS_TOKEN,
			OAuth_Client::OPTION_ACCESS_TOKEN_CREATED,
			OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN,
			OAuth_Client::OPTION_AUTH_SCOPES,
			OAuth_Client::OPTION_ERROR_CODE,
			OAuth_Client::OPTION_REDIRECT_URL,
			OAuth_Client::OPTION_REFRESH_TOKEN,
			Profile::OPTION,
			Tracking::OPTION,
			Verification::OPTION,
			Verification_Meta::OPTION,
			Verification_File::OPTION,
		);
	}

	protected function init_user_option_values( $user_id, $is_network_mode ) {
		foreach ( $this->get_user_option_keys() as $option_name ) {
			if ( $is_network_mode ) {
				update_user_meta( $user_id, $option_name, "test-{$option_name}-value" );
			} else {
				update_user_option( $user_id, $option_name, "test-{$option_name}-value" );
			}
		}
	}

	protected function assertUserOptionsDeleted( $user_id, $is_network_mode ) {
		foreach ( $this->get_user_option_keys() as $option_name ) {
			if ( $is_network_mode ) {
				$this->assertFalse( metadata_exists( 'user', $user_id, $option_name ) );
			} else {
				$this->assertFalse( get_user_option( $option_name, $user_id ) );
			}
		}
	}
}
