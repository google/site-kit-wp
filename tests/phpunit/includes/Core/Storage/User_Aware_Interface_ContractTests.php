<?php
/**
 * User_Aware_Interface_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Core\Storage\User_Aware_Interface;

trait User_Aware_Interface_ContractTests {

	/**
	 * @return array Array with a User_Aware_Interface instance and initial $user_id.
	 */
	abstract protected function create_user_aware_instance();

	public function test_get_user_id() {
		list( $user_aware, $user_id ) = $this->create_user_aware_instance();
		$this->assertEquals( $user_id, $user_aware->get_user_id(), 'User-aware instance should retain its initial user ID.' );
	}

	public function test_switch_user() {
		list( $user_aware, $user_id_a ) = $this->create_user_aware_instance();
		$this->assertEquals( $user_id_a, $user_aware->get_user_id(), 'User-aware instance should start with the original user ID.' );

		$user_id_b                = $this->factory()->user->create();
		$restore_original_user_id = $user_aware->switch_user( $user_id_b );
		$this->assertEquals( $user_id_b, $user_aware->get_user_id(), 'User-aware instance should use the replacement user ID after switching users.' );

		$restore_original_user_id();
		$this->assertEquals( $user_id_a, $user_aware->get_user_id(), 'Restore callback should reinstate the original user ID.' );
	}
}
