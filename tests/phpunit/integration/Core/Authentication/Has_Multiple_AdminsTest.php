<?php
/**
 * Has_Multiple_AdminsTest
 *
 * @package   Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 * */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Has_Multiple_Admins;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Tests\TestCase;
use WP_User;

/**
 * @group Authentication
 */
class Has_Multiple_AdminsTest extends TestCase {

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var Transients
	 */
	protected $transients;

	public function set_up() {
		parent::set_up();
		$this->context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->transients = new Transients( $this->context );
	}

	public function test_get() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );

		// Should return FALSE since we don't have multiple admins yet.
		$this->assertFalse( $has_multiple_admins->get(), 'Should return false when there are no admin users' );

		// Create a second admin, the first one (with ID=1) we already have.
		$this->factory()->user->create( array( 'role' => 'administrator' ) );

		// Delete the transient and check that we have multiple admins now.
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when there are multiple admin users' );
	}

	public function test_register__user_register_hook() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );
		$has_multiple_admins->register();

		// Initially, there is only one admin (ID=1).
		$this->assertFalse( $has_multiple_admins->get(), 'Should return false when there is only one admin user' );

		// Create a new user with non-admin role, should not affect the transient.
		$this->factory()->user->create( array( 'role' => 'editor' ) );
		$this->assertFalse( $has_multiple_admins->get(), 'Should still return false when a non-admin user is created' );

		// Create a new admin user, should clear the transient and reflect the change.
		$this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when a second admin user is created' );
	}

	public function test_register__deleted_user_hook() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );
		$has_multiple_admins->register();

		// Create a second admin user and one non-admin user.
		$admin_id_2   = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$non_admin_id = $this->factory()->user->create( array( 'role' => 'editor' ) );

		// Now we have multiple admins.
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when there are multiple admin users' );

		// Delete a non-admin user, should not affect the transient.
		wp_delete_user( $non_admin_id );
		$this->assertTrue( $has_multiple_admins->get(), 'Should still return true when a non-admin user is deleted' );

		// Delete one of the admin users, should clear the transient and reflect the change.
		wp_delete_user( $admin_id_2 );
		$this->assertFalse( $has_multiple_admins->get(), 'Should return false when there is only one admin user left' );
	}

	public function test_register__set_user_role_hook() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );
		$has_multiple_admins->register();

		// Create a second admin user and one non-admin user.
		$admin_id_2   = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$non_admin_id = $this->factory()->user->create( array( 'role' => 'editor' ) );

		// Now we have multiple admins.
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when there are multiple admin users' );

		// Change a non-admin user to another non-admin role, should not affect the transient.
		$user = new WP_User( $non_admin_id );
		$user->set_role( 'author' );
		$this->assertTrue( $has_multiple_admins->get(), 'Should still return true when a non-admin user role is changed' );

		// Change one of the admin users to a non-admin role, should clear the transient and reflect the change.
		$user = new WP_User( $admin_id_2 );
		$user->set_role( 'editor' );
		$this->assertFalse( $has_multiple_admins->get(), 'Should return false when there is only one admin user left' );
	}
}
