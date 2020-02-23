<?php
/**
 * ActivationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Activation;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class ActivationTest extends TestCase {

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var Assets
	 */
	protected $assets;

	public function test_register() {
		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$activation    = new Activation( $context );
		$this->options = new Options( $context );
		$this->assets  = new Assets( $context );
		remove_all_filters( 'googlesitekit_admin_notices' );
		remove_all_filters( 'googlesitekit_admin_data' );
		remove_all_actions( 'googlesitekit_activation' );
		remove_all_actions( 'admin_enqueue_scripts' );

		$activation->register();

		$this->assertAdminActivationNoticeRegistered();
		$this->assertAdminDataExtended();
		$this->assertActivationActions( $context->is_network_mode() );
		$this->assertAssetsEnqueued();
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_register() {
		$this->network_activate_site_kit();
		// Fake network admin context for assets enqueue
		set_current_screen( 'test-network' );
		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$activation    = new Activation( $context );
		$this->options = new Options( $context );
		$this->assets  = new Assets( $context );
		$this->assertTrue( $context->is_network_mode() );
		remove_all_filters( 'googlesitekit_admin_notices' );
		remove_all_filters( 'googlesitekit_admin_data' );
		remove_all_actions( 'googlesitekit_activation' );
		remove_all_actions( 'admin_enqueue_scripts' );

		$activation->register();

		$this->assertAdminActivationNoticeRegistered();
		$this->assertAdminDataExtended();
		$this->assertActivationActions( $context->is_network_mode() );
		$this->assertAssetsEnqueued();
	}

	protected function assertAdminActivationNoticeRegistered() {
		$admin_notices = apply_filters( 'googlesitekit_admin_notices', array() );
		$this->assertCount( 1, $admin_notices );

		$notice = array_pop( $admin_notices );
		$this->assertInstanceOf( 'Google\Site_Kit\Core\Admin\Notice', $notice );
		$this->assertEquals( 'activated', $notice->get_slug() );
	}

	protected function assertAdminDataExtended() {
		$data = apply_filters( 'googlesitekit_admin_data', array() );
		$this->assertArrayHasKey( 'newSitePosts', $data );
	}

	protected function assertActivationActions( $network_wide ) {
		$this->assertFalse( $this->options->get( Activation::OPTION_SHOW_ACTIVATION_NOTICE ) );
		$this->assertFalse( $this->options->get( Activation::OPTION_NEW_SITE_POSTS ) );
		$this->assertCount(
			0,
			get_posts(
				array(
					'post_type'   => 'post',
					'post_status' => 'publish',
				)
			)
		);
		$this->factory()->post->create( array( 'post_status' => 'publish' ) ); // first post

		do_action( 'googlesitekit_activation', $network_wide );

		$this->assertNotEmpty( $this->options->get( Activation::OPTION_SHOW_ACTIVATION_NOTICE ) );
		$this->assertEquals( 1, $this->options->get( Activation::OPTION_NEW_SITE_POSTS ) );
	}

	protected function assertAssetsEnqueued() {
		// Due to a static variable in Assets->enqueue_asset, assets will only be registered once, with no way to reset it.
		// This test works without this call when run in isolation, but fails when run with the full suite.
		$register_assets = new \ReflectionMethod( $this->assets, 'register_assets' );
		$register_assets->setAccessible( true );
		$register_assets->invoke( $this->assets );
		// Reset enqueued styles.
		wp_styles()->queue = array();
		$this->assertNotEmpty( $this->options->get( Activation::OPTION_SHOW_ACTIVATION_NOTICE ) );
		// googlesitekit-fonts is only enqueued in AMP context, only need to check admin css.
		$this->assertFalse( wp_style_is( 'googlesitekit-admin-css', 'enqueued' ) );

		do_action( 'admin_enqueue_scripts', 'plugins.php' );

		$this->assertTrue( wp_style_is( 'googlesitekit-admin-css', 'enqueued' ) );
	}

	protected function network_activate_site_kit() {
		add_filter(
			'pre_site_option_active_sitewide_plugins',
			function () {
				return array( GOOGLESITEKIT_PLUGIN_BASENAME => true );
			}
		);
	}
}
