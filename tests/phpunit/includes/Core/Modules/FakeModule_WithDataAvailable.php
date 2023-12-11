<?php
/**
 * FakeModule_WithDataAvailable
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_With_Data_Available_State;

class FakeModule_WithDataAvailable extends FakeModule
implements Module_With_Data_Available_State {
	protected $_data_available; // phpcs:ignore PSR2.Classes.PropertyDeclaration.Underscore

	public function is_data_available() {
		return ! empty( $this->_data_available );
	}

	public function set_data_available() {
		$this->_data_available = true;

		return true;
	}

	public function reset_data_available() {
		unset( $this->_data_available );

		return true;
	}
}
