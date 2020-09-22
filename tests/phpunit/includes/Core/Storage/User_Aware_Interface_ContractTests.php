<?php
/**
 * User_Aware_Interface_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Core\Storage\User_Aware_Interface;

trait User_Aware_Interface_ContractTests {

	/**
	 * @return User_Aware_Interface
	 */
	abstract protected function create_user_aware_instance( $user_id );

	public function test_get_user_id() {
		$user_id    = $this->factory()->user->create();
		$user_aware = $this->create_user_aware_instance( $user_id );
		$this->assertEquals( $user_id, $user_aware->get_user_id() );
	}

	public function test_switch_user() {
		$user_id_a = $this->factory()->user->create();
		$user_id_b = $this->factory()->user->create();
		update_user_option( $user_id_a, 'test-key', 'test-value-a' );
		update_user_option( $user_id_b, 'test-key', 'test-value-b' );

		$user_aware = $this->create_user_aware_instance( $user_id_a );
		$this->assertEquals( $user_id_a, $user_aware->get_user_id() );

		$restore_original_user_id = $user_aware->switch_user( $user_id_b );
		$this->assertEquals( $user_id_b, $user_aware->get_user_id() );

		$restore_original_user_id();
		$this->assertEquals( $user_id_a, $user_aware->get_user_id() );
	}

}
