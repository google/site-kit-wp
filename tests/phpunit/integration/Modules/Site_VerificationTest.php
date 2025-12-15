<?php
/**
 * Site_VerificationTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Site_Verification;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Site_VerificationTest extends TestCase {
	use Module_With_Scopes_ContractTests;

	public function test_magic_methods() {
		$site_verification = new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( 'site-verification', $site_verification->slug, 'Site verification module slug should be correct.' );
		$this->assertTrue( $site_verification->force_active, 'Site verification module should be force active.' );
		$this->assertTrue( $site_verification->internal, 'Site verification module should be internal.' );
		$this->assertEquals( 'https://www.google.com/webmasters/verification/home', $site_verification->homepage, 'Site verification module homepage should be correct.' );
	}

	public function test_register() {
		$site_verification = new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_verify_site_ownership' );
		remove_all_actions( 'init' );

		$this->assertEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ), 'Site verification scopes should be empty initially.' );

		$site_verification->register();

		// Test registers scopes.
		$this->assertEquals(
			$site_verification->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() ),
			'Site verification scopes should be registered.'
		);
		$this->assertTrue( has_action( 'googlesitekit_verify_site_ownership' ), 'Site ownership verification action should be registered.' );
		$this->assertTrue( has_action( 'init' ), 'Init action should be registered.' );
	}

	public function test_meta_tag_cache() {
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'added_user_meta' );
		remove_all_actions( 'updated_user_meta' );
		remove_all_actions( 'deleted_user_meta' );
		$user_id           = $this->factory()->user->create();
		$context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options      = new User_Options( $context );
		$transients        = new Transients( $context );
		$site_verification = new Site_Verification( $context );
		$site_verification->register();

		$meta_key          = $user_options->get_meta_key( Verification_Meta::OPTION );
		$verification_meta = uniqid( 'test-verification-' );

		add_user_meta( $user_id, $meta_key, $verification_meta );

		$this->assertFalse( $transients->get( Site_Verification::TRANSIENT_VERIFICATION_META_TAGS ), 'Verification meta tags transient should not exist initially.' );
		$this->assertStringContainsString( $verification_meta, $this->capture_action( 'wp_head' ), 'Verification meta should be rendered in wp_head.' );
		$this->assertContains( $verification_meta, $transients->get( Site_Verification::TRANSIENT_VERIFICATION_META_TAGS ), 'Verification meta should be cached in transient.' );

		$updated_verification_meta = $verification_meta . '-updated';
		update_user_meta( $user_id, $meta_key, $updated_verification_meta );

		$this->assertFalse( $transients->get( Site_Verification::TRANSIENT_VERIFICATION_META_TAGS ), 'Verification meta tags transient should be cleared on update.' );
		$this->assertStringContainsString( $updated_verification_meta, $this->capture_action( 'wp_head' ), 'Updated verification meta should be rendered in wp_head.' );
		$this->assertContains( $updated_verification_meta, $transients->get( Site_Verification::TRANSIENT_VERIFICATION_META_TAGS ), 'Updated verification meta should be cached in transient.' );

		delete_user_meta( $user_id, $meta_key );

		$this->assertFalse( $transients->get( Site_Verification::TRANSIENT_VERIFICATION_META_TAGS ), 'Verification meta tags transient should be cleared on deletion.' );
	}

	/**
	 * @dataProvider data_register_head_verification_tags
	 */
	public function test_register_head_verification_tags( $saved_tag, $expected_output ) {
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'login_head' );
		$context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$site_verification = new Site_Verification( $context );
		$site_verification->register();

		( new Transients( $context ) )->set( Site_Verification::TRANSIENT_VERIFICATION_META_TAGS, array( $saved_tag ) );

		$this->assertStringContainsString(
			$expected_output,
			$this->capture_action( 'wp_head' ),
			'Verification tag should be rendered in wp_head.'
		);

		$this->assertStringContainsString(
			$expected_output,
			$this->capture_action( 'login_head' ),
			'Verification tag should be rendered in login_head.'
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
		remove_all_actions( 'googlesitekit_verify_site_ownership' );
		remove_all_actions( 'googlesitekit_proxy_setup_url_params' );
		$user_id      = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		wp_set_current_user( $user_id );
		$site_verification = new Site_Verification( $context );
		$site_verification->register();

		$this->assertEquals( array(), apply_filters( 'googlesitekit_proxy_setup_url_params', array(), '', '' ), 'Proxy setup URL params should be empty initially.' );

		do_action( 'googlesitekit_verify_site_ownership', 'testtoken', 'FILE' );

		$this->assertEquals( 'testtoken', $user_options->get( Verification_File::OPTION ), 'Verification file option should be set with token.' );
	}

	public function test_get_module_scopes() {
		$site_verification = new Site_Verification( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/siteverification',
			),
			$site_verification->get_scopes(),
			'Site verification module should have correct scopes.'
		);
	}

	public function test_file_verification() {
		$context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$site_verification = new Site_Verification( $context );
		$user_id           = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user_options      = new User_Options( $context, $user_id );
		remove_all_actions( 'init' );
		$site_verification->register();
		add_filter( 'googlesitekit_exit_handler', '__return_null' );

		// Ensure no verification file response if the user does not have one.
		$this->go_to( '/google1234.html' );
		$this->assertStringNotContainsString( 'google-site-verification', $this->capture_action( 'init' ), 'No verification response should be served without verification file.' );

		// Set correct verification for user
		$user_options->set( Verification_File::OPTION, '1234' );
		$this->assertEquals( 'google-site-verification: google1234.html', $this->capture_action( 'init' ), 'Verification response should be served for matching file.' );

		// Ensure that the verification isn't served if there is no match
		$user_options->set( Verification_File::OPTION, '9999' );
		$this->assertEquals( '', $this->capture_action( 'init' ), 'No verification response should be served for non-matching file.' );

		// Ensure that the verification isn't served if there is a match, but the user does not have the permission.
		$user_options->set( Verification_File::OPTION, '1234' );
		$this->assertTrue( user_can( $user_id, Permissions::SETUP ), 'User should have setup permission initially.' );
		( new \WP_User( $user_id ) )->remove_role( 'administrator' );
		$this->assertFalse( user_can( $user_id, Permissions::SETUP ), 'User should not have setup permission after role removal.' );
		$this->assertEquals( '', $this->capture_action( 'init' ), 'No verification response should be served without setup permission.' );
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
			$tagmanager->get_datapoints(),
			'Site verification module should have correct datapoints.'
		);
	}
}
