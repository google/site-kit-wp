<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Initial_Version
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class representing the initial Site Kit version the user started with.
 *
 * @since 1.25.0
 * @access private
 * @ignore
 */
final class Initial_Version extends User_Setting {

	/**
	 * User option key.
	 */
	const OPTION = 'googlesitekitpersistent_initial_version';
}
