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

	public function test_sharing_settings__requires_authenticated_admin() {
		$admin = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin->ID );
		$this->controller->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/sharing-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'search-console' => array(
						'sharedRoles' => array( 'editor', 'subscriber' ),
						'management'  => 'all_admins',
					),
					'analytics-4'    => array(
						'sharedRoles' => array( 'editor' ),
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		// This admin hasn't authenticated with the Site Kit proxy service yet,
		// so they aren't allowed to modify Dashboard Sharing settings.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	public function test_sharing_settings__create_new_settings() {
		$admin_1 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_1->ID );
		// Setup the site and admin_1 user to make a successful REST request.
		$this->grant_manage_options_permission();
		update_option( 'googlesitekit_search-console_settings', array( 'ownerID' => $admin_1->ID ) );

		$this->controller->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/sharing-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'search-console' => array(
						'sharedRoles' => array( 'editor', 'contributor' ),
					),
					'analytics-4'    => array(
						'sharedRoles' => array( 'editor' ),
						'management'  => 'owner',
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$expected_response = array(
			'settings'    => array(
				// admin_1 is the owner and can add/edit search-console settings but
				// NOT analytics settings.
				'search-console'     => array(
					'sharedRoles' => array( 'editor', 'contributor' ),
					'management'  => 'owner',
				),
				// Default settings always saved for shared ownership modules.
				'pagespeed-insights' => array(
					'sharedRoles' => array(),
					'management'  => 'all_admins',
				),
			),
			'newOwnerIDs' => (object) array(
				// ownerID should be updated as settings have "changed" (added).
				'pagespeed-insights' => $admin_1->ID,
			),
		);
		$this->assertEquals( $expected_response, $response->get_data() );
	}

	public function test_sharing_settings__modify_shared_roles_settings() {
		$module_sharing_settings = $this->modules->get_module_sharing_settings();
		$module_sharing_settings->set(
			array(
				'search-console' => array(
					'sharedRoles' => array( 'contributor' ),
					'management'  => 'owner',
				),
				'adsense'        => array(
					'sharedRoles' => array(),
					'management'  => 'owner',
				),
				'analytics-4'    => array(
					'sharedRoles' => array( 'contributor', 'subscriber' ),
					'management'  => 'all_admins',
				),
			)
		);

		// Test sharedRoles can be modified if the user is the owner or management setting is set to all_admins.
		$admin_1 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_1->ID );
		$this->grant_manage_options_permission();
		update_option( 'googlesitekit_search-console_settings', array( 'ownerID' => $admin_1->ID ) );

		$this->controller->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/sharing-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'search-console' => array(
						'sharedRoles' => array(),
					),
					'adsense'        => array(
						'sharedRoles' => array( 'author' ),
					),
					'analytics-4'    => array(
						'sharedRoles' => array( 'editor' ),
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$expected_response = array(
			'settings'    => array(
				'search-console'     => array(
					'sharedRoles' => array(),
					'management'  => 'owner',
				),
				'adsense'            => array(
					'sharedRoles' => array(),
					'management'  => 'owner',
				),
				'analytics-4'        => array(
					'sharedRoles' => array( 'editor' ),
					'management'  => 'all_admins',
				),
				'pagespeed-insights' => array(
					'sharedRoles' => array(),
					'management'  => 'all_admins',
				),
			),
			'newOwnerIDs' => (object) array(),
		);
		$this->assertEquals( $expected_response, $response->get_data() );
	}

	public function test_sharing_settings__modify_management_settings() {
		$module_sharing_settings = $this->modules->get_module_sharing_settings();
		$module_sharing_settings->set(
			array(
				'search-console' => array(
					'sharedRoles' => array( 'contributor' ),
					'management'  => 'owner',
				),
				'adsense'        => array(
					'sharedRoles' => array(),
					'management'  => 'owner',
				),
				'analytics-4'    => array(
					'sharedRoles' => array( 'contributor', 'editor' ),
					'management'  => 'all_admins',
				),
			)
		);

		// Test management setting can only be modified if the user is the module owner.
		$admin_1 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_1->ID );
		$this->grant_manage_options_permission();
		update_option( 'googlesitekit_search-console_settings', array( 'ownerID' => $admin_1->ID ) );

		$this->controller->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/sharing-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'search-console' => array(
						'management' => 'all_admins',
					),
					'adsense'        => array(
						'management' => 'all_admins',
					),
					'analytics-4'    => array(
						'management' => 'owner',
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$expected_response = array(
			'settings'    => array(
				'search-console'     => array(
					'sharedRoles' => array( 'contributor' ),
					'management'  => 'all_admins',
				),
				'adsense'            => array(
					'sharedRoles' => array(),
					'management'  => 'owner',
				),
				'analytics-4'        => array(
					'sharedRoles' => array( 'contributor', 'editor' ),
					'management'  => 'all_admins',
				),
				'pagespeed-insights' => array(
					'sharedRoles' => array(),
					'management'  => 'all_admins',
				),
			),
			'newOwnerIDs' => (object) array(),
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
	}

}
