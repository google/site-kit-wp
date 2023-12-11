<?php
/**
 * Module_With_Data_Available_State_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Data_Available_State;
use Google\Site_Kit\Tests\TestCase_Context_Trait;

trait Module_With_Data_Available_State_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module|Module_With_Data_Available_State
	 */
	abstract protected function get_module_with_data_available_state();

	/**
	 * @group Module_With_Data_Available_State
	 */
	public function test_is_data_available() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_data_available_state();

		// Should return `false` because the transient is not set.
		$testcase->assertFalse( $module->is_data_available() );

		// Set the transient.
		set_transient( $this->get_data_available_transient_name( $module ), true );

		// Should return `true` because the transient is set.
		$testcase->assertTrue( $module->is_data_available() );

		// Reset the transient.
		delete_transient( $this->get_data_available_transient_name( $module ) );

		// Should return `false` because the transient is not set.
		$testcase->assertFalse( $module->is_data_available() );
	}

	/**
	 * @group Module_With_Data_Available_State
	 */
	public function test_set_data_available() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_data_available_state();

		// Should return `false` because the transient is not set.
		$testcase->assertFalse( get_transient( $this->get_data_available_transient_name( $module ) ) );

		// Set the transient.
		$module->set_data_available();

		// Should return `true` because the transient is set.
		$testcase->assertTrue( get_transient( $this->get_data_available_transient_name( $module ) ) );
	}

	/**
	 * @group Module_With_Data_Available_State
	 */
	public function test_reset_data_available() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_data_available_state();

		// Set the transient.
		set_transient( $this->get_data_available_transient_name( $module ), true );

		// Should return `true` because the transient is set.
		$testcase->assertTrue( get_transient( $this->get_data_available_transient_name( $module ) ) );

		// Reset the transient.
		$module->reset_data_available();

		// Should return `false` because the transient is not set.
		$testcase->assertFalse( get_transient( $this->get_data_available_transient_name( $module ) ) );
	}

	protected function get_data_available_transient_name( $module ) {
		return 'googlesitekit_' . $module->slug . '_data_available';
	}
}
