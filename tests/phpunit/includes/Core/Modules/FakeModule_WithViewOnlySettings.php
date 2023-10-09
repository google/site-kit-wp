<?php
/**
 * FakeModule
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

class FakeModule_WithViewOnlySettings extends FakeModule {

	/**
	 * Sets up the module's settings instance which implements view-only keys.
	 *
	 * @return FakeModuleSettings_WithViewOnlyKeys
	 */
	protected function setup_settings() {
		return new FakeModuleSettings_WithViewOnlyKeys( $this->options );
	}

}
