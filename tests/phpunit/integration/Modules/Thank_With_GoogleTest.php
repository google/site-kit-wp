<?php
/**
 * Thank_With_GoogleTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Build_Mode;
use Google\Site_Kit\Modules\Thank_With_Google;
use Google\Site_Kit\Modules\Thank_With_Google\Settings;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

/**
 * @group Modules
 */
class Thank_With_GoogleTest extends TestCase {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Thank_With_Google instance.
	 *
	 * @var Thank_With_Google
	 */
	private $thank_with_google;

	public function set_up() {
		parent::set_up();

		$this->context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options           = new Options( $this->context );
		$this->thank_with_google = new Thank_With_Google( $this->context, $this->options );

		$this->options->set(
			Settings::OPTION,
			array(
				'publicationID' => '12345',
				'colorTheme'    => 'blue',
				'ctaPlacement'  => 'static_auto',
				'ctaPostTypes'  => array( 'post' ),
			)
		);
	}

	public function test_register__before_module_is_connected() {
		remove_all_actions( 'googlesitekit_auth_scopes' );
		remove_all_actions( 'googlesitekit_pre_save_settings_' . Thank_With_Google::MODULE_SLUG );
		remove_all_actions( 'googlesitekit_save_settings_' . Thank_With_Google::MODULE_SLUG );

		$this->thank_with_google->register();

		$this->assertTrue( has_filter( 'googlesitekit_auth_scopes' ) );
		$this->assertTrue( has_action( 'googlesitekit_pre_save_settings_' . Thank_With_Google::MODULE_SLUG ) );
		$this->assertTrue( has_action( 'googlesitekit_save_settings_' . Thank_With_Google::MODULE_SLUG ) );
	}

	public function test_register__after_module_is_connected() {
		$this->options->set(
			Settings::OPTION,
			array(
				'publicationID' => '12345',
				'colorTheme'    => 'blue',
				'ctaPlacement'  => 'static_auto',
				'ctaPostTypes'  => array( 'post' ),
			)
		);
		$this->assertTrue( $this->thank_with_google->is_connected() );

		remove_all_actions( 'googlesitekit_auth_scopes' );
		remove_all_actions( 'googlesitekit_pre_save_settings_' . Thank_With_Google::MODULE_SLUG );
		remove_all_actions( 'googlesitekit_save_settings_' . Thank_With_Google::MODULE_SLUG );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->thank_with_google->register();

		$this->assertTrue( has_filter( 'googlesitekit_auth_scopes' ) );
		$this->assertTrue( has_action( 'googlesitekit_pre_save_settings_' . Thank_With_Google::MODULE_SLUG ) );
		$this->assertTrue( has_action( 'googlesitekit_save_settings_' . Thank_With_Google::MODULE_SLUG ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_data_settings_endpoint__transient_timer_success() {
		$this->enable_feature( 'twgModule' );
		// Set the build mode to development so TwG is added to the registry of active modules.
		// Enabling the feature flag alone is not enough.
		Build_Mode::set_mode( Build_Mode::MODE_DEVELOPMENT );

		$this->setup_modules_to_test_rest_endpoint();
		$this->thank_with_google->register();

		$this->options->delete( Settings::OPTION );
		$this->assertFalse( $this->thank_with_google->is_connected() );
		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/' . Thank_With_Google::MODULE_SLUG . '/data/settings' );

		$request->set_body_params(
			array(
				'slug' => Thank_With_Google::MODULE_SLUG,
				'data' => array(
					'publicationID' => '12345',
					'colorTheme'    => 'blue',
					'ctaPlacement'  => 'static_auto',
					'ctaPostTypes'  => array( 'post' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$transients = new Transients( $this->context );
		$this->assertIsNumeric( $transients->get( Thank_With_Google::TRANSIENT_SETUP_TIMER ) );

		// Reset the build mode.
		Build_Mode::set_mode( Build_Mode::MODE_PRODUCTION );
	}

	private function setup_modules_to_test_rest_endpoint() {
		$user         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options = new User_Options( $this->context, $user->ID );
		$modules      = new Modules( $this->context, $this->options, $user_options );
		wp_set_current_user( $user->ID );

		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
		remove_all_filters( 'googlesitekit_rest_routes' );

		$modules->register();
		return $modules;
	}

	public function test_web_tag_hooks_are_added_when_tag_is_registered() {
		remove_all_actions( 'template_redirect' );

		$this->thank_with_google->register();

		remove_all_actions( 'wp_enqueue_scripts' );
		remove_all_filters( 'the_content' );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_enqueue_scripts' ) );
		$this->assertTrue( has_filter( 'the_content' ) );
	}

	public function test_web_tag_hooks_are_not_added_when_tag_is_blocked() {
		remove_all_actions( 'template_redirect' );

		$this->thank_with_google->register();

		remove_all_actions( 'wp_enqueue_scripts' );
		remove_all_filters( 'the_content' );

		add_filter( 'googlesitekit_' . Thank_With_Google::MODULE_SLUG . '_tag_blocked', '__return_true' );

		do_action( 'template_redirect' );

		$this->assertFalse( has_action( 'wp_enqueue_scripts' ) );
		$this->assertFalse( has_filter( 'the_content' ) );
	}

	public function test_web_tag_snippet_is_not_enqueued_for_non_singular_pages() {
		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_enqueue_scripts' );

		$this->thank_with_google->register();

		// Hook `wp_print_footer_scripts` on placeholder action for capturing.
		add_action( '__test_print_scripts', 'wp_print_footer_scripts' );

		do_action( 'template_redirect' );
		do_action( 'wp_enqueue_scripts' );

		$output = $this->capture_action( '__test_print_scripts' );

		$this->assertEmpty( $output );
	}

	public function test_web_tag_is_enqueued_for_singular_pages() {
		$post_ID = $this->factory()->post->create();
		$this->go_to( get_permalink( $post_ID ) );

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_enqueue_scripts' );

		$this->thank_with_google->register();

		// Hook `wp_print_footer_scripts` on placeholder action for capturing.
		add_action( '__test_print_scripts', 'wp_print_footer_scripts' );

		do_action( 'template_redirect' );
		do_action( 'wp_enqueue_scripts' );

		$output = $this->capture_action( '__test_print_scripts' );

		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringContainsString( '"style":"inline"', $output );
		$this->assertStringContainsString( '"isPartOfProductId":"12345:default",', $output );
	}

	public function test_is_connected() {
		$this->options->delete( Settings::OPTION );

		$this->assertFalse( $this->thank_with_google->is_connected() );

		$this->options->set(
			Settings::OPTION,
			array(
				'publicationID' => '12345',
				'colorTheme'    => 'blue',
				'ctaPlacement'  => 'static_auto',
				'ctaPostTypes'  => array( 'post' ),
			)
		);

		$this->assertTrue( $this->thank_with_google->is_connected() );
	}

	public function test_on_deactivation() {
		$this->assertOptionExists( Settings::OPTION );

		$this->thank_with_google->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_service_classes_exist() {
		$this->assertTrue(
			class_exists( 'Google\Site_Kit_Dependencies\Google_Service_SubscribewithGoogle' )
		);
	}
}
