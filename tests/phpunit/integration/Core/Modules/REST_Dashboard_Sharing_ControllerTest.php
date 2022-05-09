<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\REST_Dashboard_Sharing_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Modules\REST_Dashboard_Sharing_Controller;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Dashboard_Sharing_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * Controller instance.
	 *
	 * @var REST_Dashboard_Sharing_Controller
	 */
	private $controller;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Modules instance.
	 *
	 * @var Modules
	 */
	private $modules;

	public function set_up() {
		parent::set_up();

		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $this->context );

		$this->modules = new Modules( $this->context, null, $this->user_options );
		$this->modules->register();

		$this->controller = new REST_Dashboard_Sharing_Controller( $this->modules );

		remove_all_filters( 'googlesitekit_rest_routes' );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
	}

	public function test_get_rest_routes__success() {
		$this->enable_feature( 'dashboardSharing' );
		$module_sharing_settings = $this->modules->get_module_sharing_settings();

		$admin_1 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_1->ID );
		$initial_sharing_settings = array(
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			'analytics'          => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',   // To test that non-owners cannot merge settings for this module.
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);
		$module_sharing_settings->set( $initial_sharing_settings );
		wp_set_current_user( $this->user );

		$admin_2 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_2->ID );

		// Setup the site and admin_2 user to make a successful REST request.
		$this->grant_manage_options_permission();

		$this->controller->register();

		$updated_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => array( 'editor', 'subscriber' ), // Changed settings should not take effect.
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ), // Changed settings should take effect and ownerID updated as well.
				'management'  => 'all_admins',
			),
		);

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/sharing-settings' );
		$request->set_body_params(
			array(
				'data' => $updated_sharing_settings,
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$expected_sharing_settings = array(
			// Nothing should have changed.
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			// Nothing should have changed since admin_2 is not the owner of Analytics.
			'analytics'          => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			// sharedRoles should be updated.
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
		);
		$expected_response = array(
			$expected_sharing_settings,
			'newOwnerIDs' => array(
				// ownerID should be updated as settings have changed.
				'pagespeed-insights' => $admin_2->ID,
			),
		);

		$this->assertEquals( $expected_response, $response->get_data() );
	}

	private function grant_manage_options_permission() {
		// Setup SiteKit.
		$this->fake_proxy_site_connection();
		// Override any existing filter to make sure the setup is marked as complete all the time.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		// Verify and authenticate the current user.
		$authentication = new Authentication( $this->context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);

		// Re-register Permissions after enabling the dashboardSharing feature to include dashboard sharing capabilities.
		$permissions = new Permissions( $this->context, $authentication, $this->modules, $this->user_options, new Dismissed_Items( $this->user_options ) );
		$permissions->register();
	}

}
