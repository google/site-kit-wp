<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\User_Connection_Settings
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for Sign_In_With_Google user connection settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Connection_Settings extends User_Setting {
	/**
	 * Option name for persistent user ID.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	const OPTION = 'googlesitekitpersistent_sign_in_with_google_user_id';

	/**
	 * Option name for redirect URL.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	const OPTION_REDIRECT_URL = 'googlesitekit_sign_in_with_google_redirect_url';
}
