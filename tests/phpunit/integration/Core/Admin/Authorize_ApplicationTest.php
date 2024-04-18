<?php
/**
 * Class Google\Site_Kit\Tests\Core\Admin\Authorize_ApplicationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Core\Admin\Authorize_Application;
use Google\Site_Kit\Context;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 */
class Authorize_ApplicationTest extends TestCase {

	public function test_register() {
		global $current_screen;
		remove_all_actions( 'admin_enqueue_scripts' );

		// Set the current screen to authorize-application.
		$current_screen = convert_to_screen( 'authorize-application' );

		// Set the success URL with the `google.com` domain.
		$this->set_global_get_params( 'https://example.google.com/settings/authorization/wordpress' );
        
		// Verify that the expected assets aren't enqueued yet.
		$this->assertFalse( wp_style_is( 'googlesitekit-authorize-application', 'enqueued' ) );
        
		$authorize_application = new Authorize_Application( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$authorize_application->register();

		do_action( 'admin_enqueue_scripts' );

		// Check that the expected assets are enqueued.
		$this->assertTrue( wp_style_is( 'googlesitekit-authorize-application', 'enqueued' ) );
	}

	public function test_register_with_incorrect_success_url() {
		global $current_screen;
		remove_all_actions( 'admin_enqueue_scripts' );

		// Set the current screen to authorize-application.
		$current_screen = convert_to_screen( 'authorize-application' );

		// Set the success URL to an incorrect value with a different domain.
		$this->set_global_get_params( 'https://example.com/settings/authorization/wordpress' );

		// Verify that the expected assets aren't enqueued yet.
		$this->assertFalse( wp_style_is( 'googlesitekit-authorize-application', 'enqueued' ) );
        
		$authorize_application = new Authorize_Application( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$authorize_application->register();

		do_action( 'admin_enqueue_scripts' );

		// Check that the assets aren't enqueued due to incorrect success URL.
		$this->assertFalse( wp_style_is( 'googlesitekit-authorize-application', 'enqueued' ) );
	}

	public function test_register_with_incorrect_screen() {
		global $current_screen;
		remove_all_actions( 'admin_enqueue_scripts' );

		// Set the current screen to dashboard.
		$current_screen = convert_to_screen( 'dashboard' );

        // Set the success URL with the `google.com` domain.
		$this->set_global_get_params( 'https://example.google.com/settings/authorization/wordpress' );

        // Verify that the expected assets aren't enqueued yet.
		$this->assertFalse( wp_style_is( 'googlesitekit-authorize-application', 'enqueued' ) );

		$authorize_application = new Authorize_Application( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$authorize_application->register();

		do_action( 'admin_enqueue_scripts' );

		// Check that expected assets aren't enqueued due to incorrect screen.
		$this->assertFalse( wp_style_is( 'googlesitekit-authorize-application', 'enqueued' ) );
	}

	public function set_global_get_params( $success_url ) {
		// Set $_GET parameters
		$_GET['app_name']    = 'GoogleServiceIntegration';
		$_GET['app_id']      = wp_generate_uuid4();
		$_GET['success_url'] = $success_url;
		$_GET['sitekit']     = 'true';
	}

	public function unset_global_get_params() {
		// Unset $_GET parameters
		unset( $_GET['app_name'] );
		unset( $_GET['app_id'] );
		unset( $_GET['success_url'] );
		unset( $_GET['sitekit'] );
	}

    public function tear_down() {
		parent::tear_down();
		$this->unset_global_get_params();
		wp_dequeue_style( 'googlesitekit-authorize-application' );
	}
}
