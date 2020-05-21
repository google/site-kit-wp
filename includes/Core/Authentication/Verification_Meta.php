<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Verification_Meta
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class representing the site verification meta tag for a user.
 *
 * @since 1.1.0
 * @access private
 * @ignore
 */
final class Verification_Meta extends User_Setting {

	/**
	 * User option key.
	 */
	const OPTION = 'googlesitekit_site_verification_meta';
}
