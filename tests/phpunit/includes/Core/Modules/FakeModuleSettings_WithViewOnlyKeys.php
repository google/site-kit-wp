<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\FakeModuleSettings_WithViewOnlyKeys
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Trait;

class FakeModuleSettings_WithViewOnlyKeys extends Module_Settings implements Setting_With_ViewOnly_Keys_Interface {

	const OPTION = 'fake_module_settings_with_view_only';

	public function get_view_only_keys() {
		return array(
			'viewOnlyKey',
		);
	}

	protected function get_default() {
		return array(
			'defaultKey'  => 'default-value',
			'viewOnlyKey' => 'default-value',
		);
	}
}
