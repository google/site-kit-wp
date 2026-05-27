<?php
/**
 * Web_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Web_Tag;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class Web_TagTest extends TestCase {

	/**
	 * Web_Tag object.
	 *
	 * @var Web_Tag
	 */
	private $web_tag;

	/**
	 * Example settings object.
	 *
	 * @var array
	 */
	private $siwg_settings = array(
		'clientID'      => 'test-client-id.app.googleusercontent.com',
		'text'          => Settings::TEXT_SIGN_IN_WITH_GOOGLE['value'],
		'theme'         => Settings::THEME_LIGHT['value'],
		'shape'         => 'rectangular',
		'oneTapEnabled' => false,
	);

	/**
	 * Initial SCRIPT_NAME.
	 *
	 * @var string
	 */
	private static $initial_script_name;

	public static function set_up_before_class() {
		parent::set_up_before_class();
		self::$initial_script_name = $_SERVER['SCRIPT_NAME'];
	}

	public function set_up() {
		parent::set_up();

		$this->web_tag = new Web_Tag(
			'test-client-id.app.googleusercontent.com',
			'sign-in-with-google'
		);
		$this->web_tag->set_settings( $this->siwg_settings );
	}

	public function tear_down() {
		parent::tear_down();

		$_SERVER['SCRIPT_NAME'] = self::$initial_script_name;
	}

	public function test_render_on_wp_footer() {
		remove_all_actions( 'wp_footer' );
		$_SERVER['SCRIPT_NAME'] = wp_login_url();

		$this->web_tag->register();

		$output = $this->capture_action( 'wp_footer' );

		// Check that the Sign in with Google script is rendered.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output, 'Footer should include SIWG marker text.' );
		$this->assertStringContainsString( 'google.accounts.id.initialize', $output, 'Footer should include Google accounts initialization.' );
		$this->assertStringContainsString( 'test-client-id.app.googleusercontent.com', $output, 'Footer should include configured client ID.' );

		// Renders the button with the correct clientID and redirect_uri.
		$this->web_tag->set_settings(
			array(
				'clientID' => '1234567890.googleusercontent.com',
				'text'     => Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
				'theme'    => Settings::THEME_LIGHT['value'],
				'shape'    => Settings::SHAPE_RECTANGULAR['value'],
			)
		);

		// Render the button.
		$output = $this->capture_action( 'wp_footer' );

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output, 'Footer should include SIWG marker text for custom settings.' );

		$this->assertStringContainsString( "client_id:'1234567890.googleusercontent.com'", $output, 'Footer should include client_id config.' );
		$this->assertStringContainsString( "fetch('http://example.org/wp-login.php?action=googlesitekit_auth'", $output, 'Footer should include login fetch URL.' );

		$this->assertStringContainsString( sprintf( '"text":"%s"', Settings::TEXT_CONTINUE_WITH_GOOGLE['value'] ), $output, 'Footer should include text config.' );
		$this->assertStringContainsString( sprintf( '"theme":"%s"', Settings::THEME_LIGHT['value'] ), $output, 'Footer should include theme config.' );
		$this->assertStringContainsString( sprintf( '"shape":"%s"', Settings::SHAPE_RECTANGULAR['value'] ), $output, 'Footer should include shape config.' );

		// The Sign in with Google JS should always render, even on the front
		// page.
		$_SERVER['SCRIPT_NAME'] = '/index.php';
		$output                 = $this->capture_action( 'wp_footer' );

		// The button shouldn't be rendered on a non-login page.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output, 'Footer should still include SIWG marker on front page (script-only).' );

		// Enable Sign in with Google One Tap.
		$this->web_tag->set_settings(
			array(
				'clientID'      => '1234567890.googleusercontent.com',
				'text'          => Settings::TEXT_CONTINUE_WITH_GOOGLE['value'],
				'theme'         => Settings::THEME_LIGHT['value'],
				'shape'         => Settings::SHAPE_RECTANGULAR['value'],
				'oneTapEnabled' => true,
			)
		);

		// Now the button should be rendered on a non-login page.
		$output = $this->capture_action( 'wp_footer' );

		// Check the rendered button contains the expected data.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output, 'Footer should include SIWG marker when One Tap enabled on all pages.' );
	}

	public function test_render_on_login_footer() {
		remove_all_actions( 'login_footer' );

		$this->web_tag->register();

		$output = $this->capture_action( 'login_footer' );

		// Check that the Sign in with Google script is rendered.
		$this->assertStringContainsString( 'Sign in with Google button added by Site Kit', $output, 'Login footer should include SIWG marker text.' );
		$this->assertStringContainsString( 'google.accounts.id.initialize', $output, 'Login footer should include Google accounts initialization.' );
		$this->assertStringContainsString( 'test-client-id.app.googleusercontent.com', $output, 'Login footer should include configured client ID.' );
	}

	public function test_register() {
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'login_footer' );

		$this->web_tag->register();

		// Verify that the hooks are registered.
		$this->assertTrue( has_action( 'wp_footer' ), 'wp_footer action should be registered.' );
		$this->assertTrue( has_action( 'login_footer' ), 'login_footer action should be registered.' );
	}

	public function test_render_on_wp_footer_during_preview_renders_button_and_skips_callbacks() {
		global $wp_query;

		remove_all_actions( 'wp_footer' );

		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$this->web_tag->set_settings(
			array(
				'clientID'      => 'test-client-id.app.googleusercontent.com',
				'text'          => Settings::TEXT_SIGN_IN_WITH_GOOGLE['value'],
				'theme'         => Settings::THEME_LIGHT['value'],
				'shape'         => Settings::SHAPE_RECTANGULAR['value'],
				'oneTapEnabled' => true,
			)
		);
		$this->web_tag->register();

		$previous_preview     = $wp_query->is_preview;
		$wp_query->is_preview = true;

		$output = $this->capture_action( 'wp_footer' );

		$wp_query->is_preview = $previous_preview;

		// Button render loop fires on preview even when the admin is logged in.
		$this->assertStringContainsString( 'googlesitekit-sign-in-with-google__frontend-output-button', $output, 'Render loop should fire on preview pages even when the user is logged in.' );
		$this->assertStringContainsString( 'google.accounts.id.renderButton', $output, 'Render loop should call renderButton on preview pages.' );
		// handleCredentialResponse body is wrapped, so no credential POST lands in the output.
		$this->assertStringNotContainsString( "fetch('http://example.org/wp-login.php?action=googlesitekit_auth'", $output, 'Credential POST should not be rendered on preview pages.' );
		// One Tap prompt is suppressed on preview pages.
		$this->assertStringNotContainsString( 'google.accounts.id.prompt()', $output, 'One Tap should not be invoked on preview pages.' );
	}

	public function test_render_on_wp_footer_during_preview_for_logged_out_visitor_skips_one_tap() {
		global $wp_query;

		remove_all_actions( 'wp_footer' );

		// A logged-out visitor would otherwise see One Tap when oneTapEnabled is true.
		// The `! is_preview()` clause on $should_show_one_tap_prompt is what suppresses it here.
		wp_set_current_user( 0 );

		$this->web_tag->set_settings(
			array(
				'clientID'      => 'test-client-id.app.googleusercontent.com',
				'text'          => Settings::TEXT_SIGN_IN_WITH_GOOGLE['value'],
				'theme'         => Settings::THEME_LIGHT['value'],
				'shape'         => Settings::SHAPE_RECTANGULAR['value'],
				'oneTapEnabled' => true,
			)
		);
		$this->web_tag->register();

		$previous_preview     = $wp_query->is_preview;
		$wp_query->is_preview = true;

		$output = $this->capture_action( 'wp_footer' );

		$wp_query->is_preview = $previous_preview;

		$this->assertStringNotContainsString( 'google.accounts.id.prompt()', $output, 'One Tap should not be invoked on preview pages, even when the visitor is logged out.' );
	}

	public function test_register__hooks_admin_footer_only_for_connect_existing_profile_flow() {
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'login_footer' );
		remove_all_actions( 'admin_footer' );

		$this->web_tag->set_is_connect_existing_profile( true );
		$this->web_tag->register();

		$this->assertTrue( has_action( 'admin_footer' ), 'admin_footer should be hooked when is_connect_existing_profile is true.' );
		$this->assertFalse( has_action( 'wp_footer' ), 'wp_footer should not be hooked when is_connect_existing_profile is true.' );
		$this->assertFalse( has_action( 'login_footer' ), 'login_footer should not be hooked when is_connect_existing_profile is true.' );
	}

	public function test_render_tag__emits_connect_markers_only_when_flag_on() {
		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		// With the flag on, the rendered script tags the request as the connect-existing-profile
		// flow and includes the matching nonce.
		$this->web_tag->set_is_connect_existing_profile( true );
		$output = $this->capture_render_tag_output();
		$this->assertStringContainsString( "response.integration='connect_existing_profile'", $output, 'Rendered script should set the connect_existing_profile integration when the flag is on.' );
		$this->assertStringContainsString( 'response.connect_nonce=', $output, 'Rendered script should include the connect nonce assignment when the flag is on.' );
		$this->assertStringContainsString( wp_create_nonce( Authenticator::CONNECT_NONCE_ACTION ), $output, 'Rendered nonce should match wp_create_nonce for CONNECT_NONCE_ACTION.' );

		// Toggling the flag off on the same instance guards against a vacuous pass if the marker
		// strings ever change. The positive phase above fails first when that happens, signalling
		// that the negative assertions below need updating too.
		$this->web_tag->set_is_connect_existing_profile( false );
		$output = $this->capture_render_tag_output();
		$this->assertStringNotContainsString( "response.integration='connect_existing_profile'", $output, 'Rendered script should not include the connect integration when the flag is off.' );
		$this->assertStringNotContainsString( 'response.connect_nonce=', $output, 'Rendered script should not include the connect nonce when the flag is off.' );
	}

	public function test_render_tag__forces_button_render_loop_on_connect_flow_even_when_logged_in() {
		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		$this->web_tag->set_is_connect_existing_profile( true );

		$output = $this->capture_render_tag_output();

		// Logged-in users normally skip the button render loop. The connect flow flips that gate
		// so the placeholder div on the profile page can still be wired up.
		$this->assertStringContainsString( 'google.accounts.id.renderButton', $output, 'Connect flow should force the button render loop even when the user is logged in.' );
		$this->assertStringContainsString( 'googlesitekit-sign-in-with-google__frontend-output-button', $output, 'Render loop should target the SiwG placeholder class.' );
	}

	private function capture_render_tag_output() {
		ob_start();
		$this->web_tag->render_tag();
		return ob_get_clean();
	}
}
