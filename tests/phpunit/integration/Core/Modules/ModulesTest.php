<?php
/**
 * ModulesTest
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class ModulesTest extends TestCase {

	public function test_get_available_modules() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$available = array_map( function ( $instance ) {
			return get_class( $instance );
		}, $modules->get_available_modules() );

		$this->assertEqualSets(
			array(
				'adsense'            => 'Google\\Site_Kit\\Modules\\AdSense',
				'analytics'          => 'Google\\Site_Kit\\Modules\\Analytics',
				'optimize'           => 'Google\\Site_Kit\\Modules\\Optimize',
				'pagespeed-insights' => 'Google\\Site_Kit\\Modules\\PageSpeed_Insights',
				'search-console'     => 'Google\\Site_Kit\\Modules\\Search_Console',
				'site-verification'  => 'Google\\Site_Kit\\Modules\\Site_Verification',
				'tagmanager'         => 'Google\\Site_Kit\\Modules\\TagManager',
			),
			$available
		);
	}

	public function test_get_active_modules() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$active = array_map( function ( $instance ) {
			return get_class( $instance );
		}, $modules->get_active_modules() );

		$this->assertEqualSets(
			array(
				'search-console'    => 'Google\\Site_Kit\\Modules\\Search_Console',
				'site-verification' => 'Google\\Site_Kit\\Modules\\Site_Verification',
			),
			$active
		);
	}

	public function test_register() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module->set_force_active( true );

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		$this->assertFalse( $fake_module->is_registered() );
		$modules->register();
		$this->assertTrue( $fake_module->is_registered() );
	}

	public function test_get_module() {
		$modules   = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$available = $modules->get_available_modules();

		$search_console_module = $modules->get_module( 'search-console' );

		$this->assertEquals( $available['search-console'], $search_console_module );
	}

	public function test_get_module_exception() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module_slug = 'non-existent-module';

		$this->assertArrayNotHasKey( $module_slug, $modules->get_available_modules() );

		try {
			$modules->get_module( $module_slug );
		} catch ( \Exception $exception ) {
			// We expect an exception to be thrown, let's make sure it's the right one.
			$this->assertContains( $module_slug, $exception->getMessage() );

			return;
		}

		$this->fail( 'Failed to catch exception thrown for non-existent module in get_module.' );
	}

	public function test_get_module_dependencies() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertArrayHasKey( 'optimize', $modules->get_available_modules() );
		$dependencies = $modules->get_module_dependencies( 'optimize' );

		$this->assertContains( 'analytics', $dependencies );
	}

	public function test_get_module_dependencies_exception() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module_slug = 'non-existent-module';

		$this->assertArrayNotHasKey( $module_slug, $modules->get_available_modules() );

		try {
			$modules->get_module_dependencies( $module_slug );
		} catch ( \Exception $exception ) {
			// We expect an exception to be thrown, let's make sure it's the right one.
			$this->assertContains( $module_slug, $exception->getMessage() );

			return;
		}

		$this->fail( 'Failed to catch exception thrown for non-existent module in get_module_dependencies.' );
	}

	public function test_get_module_dependants() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertArrayHasKey( 'analytics', $modules->get_available_modules() );
		$dependants = $modules->get_module_dependants( 'analytics' );

		$this->assertContains( 'optimize', $dependants );
	}

	public function test_get_module_dependants_exception() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module_slug = 'non-existent-module';

		$this->assertArrayNotHasKey( $module_slug, $modules->get_available_modules() );

		try {
			$modules->get_module_dependants( $module_slug );
		} catch ( \Exception $exception ) {
			// We expect an exception to be thrown, let's make sure it's the right one.
			$this->assertContains( $module_slug, $exception->getMessage() );

			return;
		}

		$this->fail( 'Failed to catch exception thrown for non-existent module in get_module_dependants.' );
	}

	public function test_is_module_active() {
		$modules     = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		delete_option( 'googlesitekit-active-modules' );

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		// Modules can be active by presence in active modules option
		$this->assertFalse( $modules->is_module_active( 'fake-module' ) );
		update_option( 'googlesitekit-active-modules', array( 'fake-module' ) );
		$this->assertTrue( $modules->is_module_active( 'fake-module' ) );

		delete_option( 'googlesitekit-active-modules' );

		// Some modules are always active
		$this->assertFalse( $modules->is_module_active( 'fake-module' ) );
		$fake_module->set_force_active( true );
		$this->assertTrue( $modules->is_module_active( 'fake-module' ) );
	}

	public function test_is_module_connected() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$valid_module_slug = 'search-console';
		$this->assertArrayHasKey( $valid_module_slug, $modules->get_available_modules() );
		$this->assertTrue( $modules->is_module_connected( $valid_module_slug ) );

		$non_existent_module_slug = 'non-existent-module';
		$this->assertArrayNotHasKey( $non_existent_module_slug, $modules->get_available_modules() );
		$this->assertFalse( $modules->is_module_connected( $non_existent_module_slug ) );
	}

	public function test_activate_module() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Attempting to activate a non-existent module returns false
		$this->assertArrayNotHasKey( 'fake-module', $modules->get_available_modules() );
		$this->assertFalse( $modules->activate_module( 'fake-module' ) );

		$activation_invocations = 0;
		$fake_module            = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module->set_on_activation_callback( function () use ( &$activation_invocations ) {
			$activation_invocations++;
		} );

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );

		$this->assertNotContains( 'fake-module', get_option( 'googlesitekit-active-modules', array() ) );
		$this->assertEquals( 0, $activation_invocations );
		$this->assertTrue( $modules->activate_module( 'fake-module' ) );
		$this->assertEquals( 1, $activation_invocations );
		$this->assertContains( 'fake-module', get_option( 'googlesitekit-active-modules', array() ) );

		// Subsequent calls to activate an active module do not call the on_activation method
		$this->assertTrue( $modules->activate_module( 'fake-module' ) );
		$this->assertEquals( 1, $activation_invocations );
	}

	public function test_deactivate_module() {
		$modules = new Modules( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Attempting to deactivate a non-existent module returns false
		$this->assertArrayNotHasKey( 'fake-module', $modules->get_available_modules() );
		$this->assertFalse( $modules->deactivate_module( 'fake-module' ) );

		$deactivation_invocations = 0;
		$fake_module              = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$fake_module->set_on_deactivation_callback( function () use ( &$deactivation_invocations ) {
			$deactivation_invocations++;
		} );

		$this->force_set_property( $modules, 'modules', array( 'fake-module' => $fake_module ) );
		update_option( 'googlesitekit-active-modules', array( 'fake-module' ) );

		$this->assertContains( 'fake-module', get_option( 'googlesitekit-active-modules', array() ) );

		// Force-active modules cannot be deactivated
		$fake_module->set_force_active( true );
		$this->assertFalse( $modules->deactivate_module( 'fake-module' ) );
		$this->assertEquals( 0, $deactivation_invocations );
		$this->assertContains( 'fake-module', get_option( 'googlesitekit-active-modules', array() ) );

		$fake_module->set_force_active( false );
		$this->assertTrue( $modules->deactivate_module( 'fake-module' ) );
		$this->assertEquals( 1, $deactivation_invocations );
		$this->assertNotContains( 'fake-module', get_option( 'googlesitekit-active-modules', array() ) );

		// Subsequent calls to deactivate an inactive module do not call the on_deactivation method
		$this->assertTrue( $modules->deactivate_module( 'fake-module' ) );
		$this->assertEquals( 1, $deactivation_invocations );
	}
}
