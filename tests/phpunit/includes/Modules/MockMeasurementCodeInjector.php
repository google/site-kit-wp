<?php
/**
 * Class Google\Site_Kit\Tests\Modules\MockMeasurementCodeInjector
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use \Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Code_Injector;

class MockMeasurementCodeInjector extends Measurement_Code_Injector {
	/**
	 * Prints out the injected JavaScript Code
	 */
	public function inject_event_tracking() {
		echo self::$inject_script;
	}
}
