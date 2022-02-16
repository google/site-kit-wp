<?php

namespace Google\Site_Kit\Core\CLI\Traits;

use WP_CLI;
use WP_CLI\Fetchers\User as UserFetcher;
use WP_User;

trait User_Lookup {

	/**
	 * @param $identifier
	 *
	 * @return false|WP_User
	 */
	protected function get_user( $identifier ) {
		return ( new UserFetcher() )->get( $identifier );
	}

	/**
	 * Gets a user object or fails.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $identifier Username, ID, or email.
	 *
	 * @return WP_User
	 * @throws WP_CLI\ExitException
	 */
	protected function get_user_or_fail( $identifier ) {
		return ( new UserFetcher() )->get_check( $identifier );
	}
}
