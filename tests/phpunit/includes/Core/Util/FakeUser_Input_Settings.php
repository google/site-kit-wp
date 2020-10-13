<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\FakeUser_Input_Settings
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\User_Input_Settings;

class FakeUser_Input_Settings extends User_Input_Settings {

	protected function is_connected_to_proxy() {
		return true;
	}

}
