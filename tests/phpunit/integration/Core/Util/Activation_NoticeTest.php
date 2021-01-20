<?php
/**
 * Activation_NoticeTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Util\Activation_Flag;
use Google\Site_Kit\Core\Util\Activation_Notice;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Activation_NoticeTest extends TestCase {

	/**
	 * @var Activation_Flag
	 */
	protected $activation_flag;

	/**
	 * @var Assets
	 */
	protected $assets;

	public function test_register() {
		$context               = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->activation_flag = new Activation_Flag( $context );
		$activation_notice     = new Activation_Notice( $context, $this->activation_flag );
		$this->assets          = new Assets( $context );
		remove_all_filters( 'googlesitekit_admin_notices' );
		remove_all_actions( 'admin_enqueue_scripts' );

		$activation_notice->register();

		$this->assertAdminActivationNoticeRegistered();
		$this->assertAssetsEnqueued();
	}

	protected function assertAdminActivationNoticeRegistered() {
		$admin_notices = apply_filters( 'googlesitekit_admin_notices', array() );
		$this->assertCount( 1, $admin_notices );

		$notice = array_pop( $admin_notices );
		$this->assertInstanceOf( 'Google\Site_Kit\Core\Admin\Notice', $notice );
		$this->assertEquals( 'activated', $notice->get_slug() );
	}

	protected function assertAssetsEnqueued() {
		// Due to a static variable in Assets->enqueue_asset, assets will only be registered once, with no way to reset it.
		// This test works without this call when run in isolation, but fails when run with the full suite.
		$register_assets = new \ReflectionMethod( $this->assets, 'register_assets' );
		$register_assets->setAccessible( true );
		$register_assets->invoke( $this->assets );
		// Reset enqueued styles.
		wp_styles()->queue = array();

		// googlesitekit-fonts is only enqueued in AMP context, only need to check admin css.
		$this->assertFalse( wp_style_is( 'googlesitekit-admin-css', 'enqueued' ) );

		// Set activation flag so that assets are enqueued.
		$this->activation_flag->set_activation_flag( is_network_admin() );

		do_action( 'admin_enqueue_scripts', 'plugins.php' );

		$this->assertTrue( wp_style_is( 'googlesitekit-admin-css', 'enqueued' ) );
	}
}
