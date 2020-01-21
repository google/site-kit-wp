<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\FakeModuleSettings
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_Settings;

class FakeModuleSettings extends Module_Settings {
	const OPTION = 'fake_module_settings';

	protected function get_default() {
		return array(
			'defaultKey' => 'default-value',
		);
	}
}
