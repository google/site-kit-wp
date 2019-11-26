<?php
/**
 * Site_VerificationTest
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Site_Verification;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Site_VerificationTest extends TestCase {
	use Module_With_Scopes_ContractTests;

	public function test_magic_methods() {
		$site_verification = new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( 'site-verification', $site_verification->slug );
		$this->assertTrue( $site_verification->force_active );
		$this->assertTrue( $site_verification->internal );
		$this->assertEquals( 'https://www.google.com/webmasters/verification/home', $site_verification->homepage );
	}

	public function test_register() {
		$site_verification = new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'admin_init' );
		remove_all_actions( 'init' );

		$this->assertEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );

		$site_verification->register();

		// Test registers scopes.
		$this->assertEquals(
			$site_verification->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
		$this->assertTrue( has_action( 'admin_init' ) );
		$this->assertTrue( has_action( 'init' ) );
	}

	/**
	 * @dataProvider data_register_head_verification_tags
	 */
	public function test_register_head_verification_tags( $saved_tag, $expected_output ) {
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'login_head' );
		$site_verification = new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$site_verification->register();

		set_transient( 'googlesitekit_verification_meta_tags', array( $saved_tag ) );

		$this->assertContains(
			$expected_output,
			$this->capture_action( 'wp_head' )
		);

		$this->assertContains(
			$expected_output,
			$this->capture_action( 'login_head' )
		);
	}

	public function data_register_head_verification_tags() {
		return array(
			array( // Full meta tag stored.
				'<meta name="google-site-verification" content="test-verification-content">',
				'<meta name="google-site-verification" content="test-verification-content">',
			),
			array(
				// Only verification token stored.
				'test-verification-content-2',
				'<meta name="google-site-verification" content="test-verification-content-2">',
			),
		);
	}

	public function test_receive_verification_token() {
		remove_all_actions( 'admin_action_googlesitekit_proxy_setup' );
		remove_all_actions( 'googlesitekit_proxy_setup_return_params' );
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context, $user_id );
		wp_set_current_user( $user_id );
		$site_verification = new Site_Verification( $context );
		$site_verification->register();

		$this->assertTrue( has_action( 'admin_action_googlesitekit_proxy_setup' ) );

		$_GET['googlesitekit_verification_token']      = 'testtoken';
		$_GET['googlesitekit_verification_token_type'] = 'FILE';
		$_GET['googlesitekit_verification_nonce']      = wp_create_nonce( 'googlesitekit_verification' );

		$this->assertEquals( array(), apply_filters( 'googlesitekit_proxy_setup_return_params', array() ) );

		do_action( 'admin_action_googlesitekit_proxy_setup' );

		$this->assertEquals( 'testtoken', $user_options->get( Verification_File::OPTION ) );

		$this->assertEqualSetsWithIndex(
			array(
				'verification_method' => 'FILE',
				'verification_nonce'  => wp_create_nonce( 'googlesitekit_verification' ),
				'verify'              => 'true',
			),
			apply_filters( 'googlesitekit_proxy_setup_return_params', array() )
		);
	}

	public function test_get_module_scopes() {
		$site_verification = new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/siteverification',
			),
			$site_verification->get_scopes()
		);
	}

	public function test_file_verification() {
		$context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$site_verification = new Site_Verification( $context );
		$user_id           = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user_options      = new User_Options( $context, $user_id );
		remove_all_actions( 'init' );
		$site_verification->register();
		add_filter( 'googlesitekit_exit_handler', '__return_null' );

		// Ensure no verification file response if the user does not have one.
		$this->go_to( '/google1234.html' );
		$this->assertNotContains( 'google-site-verification', $this->capture_action( 'init' ) );

		// Set correct verification for user
		$user_options->set( Verification_File::OPTION, '1234' );
		$this->assertEquals( 'google-site-verification: google1234.html', $this->capture_action( 'init' ) );

		// Ensure that the verification isn't served if there is no match
		$user_options->set( Verification_File::OPTION, '9999' );
		$this->assertEquals( '', $this->capture_action( 'init' ) );

		// Ensure that the verification isn't served if there is a match, but the user does not have the permission.
		$user_options->set( Verification_File::OPTION, '1234' );
		$this->assertTrue( user_can( $user_id, Permissions::SETUP ) );
		( new \WP_User( $user_id ) )->remove_role( 'administrator' );
		$this->assertFalse( user_can( $user_id, Permissions::SETUP ) );
		$this->assertEquals( '', $this->capture_action( 'init' ) );
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_get_datapoints() {
		$tagmanager = new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'verified-sites',
				'verification',
				'verification-token',
			),
			$tagmanager->get_datapoints()
		);
	}
}
