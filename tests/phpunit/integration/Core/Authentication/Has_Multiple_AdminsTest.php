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

		remove_all_actions( 'deleted_user' );
		remove_all_actions( 'add_user_role' );
		remove_all_actions( 'remove_user_role' );
	}

	public function test_register() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );
		$has_multiple_admins->register();

		$this->assertTrue( has_action( 'deleted_user' ), 'deleted_user action should be registered' );
		$this->assertTrue( has_action( 'add_user_role' ), 'add_user_role action should be registered' );
		$this->assertTrue( has_action( 'remove_user_role' ), 'remove_user_role action should be registered' );
	}

	public function test_get__on_add_user() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );

		// Verify we have only one admin user to start with.
		$this->assertCount( 1, get_users( array( 'role' => 'administrator' ) ), 'There should be one admin user to begin with' );

		// Should return FALSE since we don't have multiple admins yet.
		$this->assertFalse( $has_multiple_admins->get(), 'Should return false when there is only one admin' );

		// Create a second admin, the first one (with ID=1) we already have.
		$this->factory()->user->create( array( 'role' => 'administrator' ) );

		// Check that we have multiple admins now.
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when there are multiple admin users' );
	}

	public function test_get__on_delete_user() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );
		$has_multiple_admins->register();

		// Verify we have only one admin user to start with.
		$this->assertCount( 1, get_users( array( 'role' => 'administrator' ) ), 'There should be one admin user to begin with' );

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

	public function test_get__on_set_role() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );
		$has_multiple_admins->register();

		// Verify we have only one admin user to start with.
		$this->assertCount( 1, get_users( array( 'role' => 'administrator' ) ), 'There should be one admin user to begin with' );

		// Create a second admin user and one non-admin user.
		$admin_id_2   = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$non_admin_id = $this->factory()->user->create( array( 'role' => 'editor' ) );

		// Now we have multiple admins.
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when there are multiple admin users' );
		$this->assertEquals( 2, $this->transients->get( Has_Multiple_Admins::OPTION ), 'Transient should be updated to two admins' );

		// Change a non-admin user to another non-admin role, should not affect the transient.
		$user = new WP_User( $non_admin_id );
		$user->set_role( 'author' );
		$this->assertTrue( $has_multiple_admins->get(), 'Should still return true when a non-admin user role is changed' );
		$this->assertEquals( 2, $this->transients->get( Has_Multiple_Admins::OPTION ), 'Transient should still be two admins' );

		// Change one of the admin users to a non-admin role, should clear the transient and reflect the change.
		$user = new WP_User( $admin_id_2 );
		$user->set_role( 'editor' );
		$this->assertFalse( $has_multiple_admins->get(), 'Should return false when there is only one admin user left' );
		$this->assertEquals( 1, $this->transients->get( Has_Multiple_Admins::OPTION ), 'Transient should be updated to one admin' );
	}

	public function test_get__on_add_remove_user_role() {
		$has_multiple_admins = new Has_Multiple_Admins( $this->transients );
		$has_multiple_admins->register();

		// Verify we have only one admin user to start with.
		$this->assertCount( 1, get_users( array( 'role' => 'administrator' ) ), 'There should be one admin user to begin with' );

		// Create a second admin user and one non-admin user.
		$admin_id_2   = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$non_admin_id = $this->factory()->user->create( array( 'role' => 'editor' ) );

		// Now we have multiple admins.
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when there are multiple admin users' );
		$this->assertEquals( 2, $this->transients->get( Has_Multiple_Admins::OPTION ), 'Transient should be updated to two admins' );

		// Remove 'administrator' role from one of the admin users, should clear the transient and reflect the change.
		$user = new WP_User( $admin_id_2 );
		$user->remove_role( 'administrator' );
		$this->assertFalse( $has_multiple_admins->get(), 'Should return false when there is only one admin user left' );
		$this->assertEquals( 1, $this->transients->get( Has_Multiple_Admins::OPTION ), 'Transient should be updated to one admin' );

		// Add 'administrator' role back to the same user, should clear the transient and reflect the change.
		$user->add_role( 'administrator' );
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when there are multiple admin users again' );
		$this->assertEquals( 2, $this->transients->get( Has_Multiple_Admins::OPTION ), 'Transient should be updated to two admins again' );

		// Change a non-admin user role to 'administrator', should clear the transient and reflect the change.
		$user = new WP_User( $non_admin_id );
		$user->add_role( 'administrator' );
		$this->assertTrue( $has_multiple_admins->get(), 'Should return true when there are multiple admin users' );
		$this->assertEquals( 3, $this->transients->get( Has_Multiple_Admins::OPTION ), 'Transient should be updated to three admins' );
	}
}
