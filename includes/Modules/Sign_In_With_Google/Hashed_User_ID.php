<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class representing the hashed Google user ID.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
final class Hashed_User_ID extends User_Setting {

	/**
	 * User option key.
	 */
	const OPTION = 'googlesitekitpersistent_siwg_google_user_hid';
}
