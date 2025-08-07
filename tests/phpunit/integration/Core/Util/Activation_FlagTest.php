<?php
/**
 * Activation_FlagTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Activation_Flag;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Activation_FlagTest extends TestCase {

	/**
	 * @var Options
	 */
	protected $options;

	public function test_register() {
		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$activation_flag = new Activation_Flag( $context );
		$this->options   = new Options( $context );
		remove_all_filters( 'googlesitekit_admin_data' );
		remove_all_actions( 'googlesitekit_activation' );

		$activation_flag->register();

		$this->assertAdminDataExtended();
		$this->assertActivationActions( $context->is_network_mode() );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_register() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		// Fake network admin context for assets enqueue
		set_current_screen( 'test-network' );
		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$activation_flag = new Activation_Flag( $context );
		$this->options   = new Options( $context );
		$this->assertTrue( $context->is_network_mode(), 'Context should be in network mode when filter is enabled.' );
		remove_all_filters( 'googlesitekit_admin_data' );
		remove_all_actions( 'googlesitekit_activation' );

		$activation_flag->register();

		$this->assertAdminDataExtended();
		$this->assertActivationActions( $context->is_network_mode() );
	}

	protected function assertAdminDataExtended() {
		$data = apply_filters( 'googlesitekit_admin_data', array() );
		$this->assertArrayHasKey( 'newSitePosts', $data, 'Admin data should contain newSitePosts key.' );
	}

	protected function assertActivationActions( $network_wide ) {
		$this->assertFalse( $this->options->get( Activation_Flag::OPTION_SHOW_ACTIVATION_NOTICE ), 'Activation notice should not be shown initially.' );
		$this->assertFalse( $this->options->get( Activation_Flag::OPTION_NEW_SITE_POSTS ), 'New site posts should not be set initially.' );
		$this->assertCount(
			0,
			get_posts(
				array(
					'post_type'   => 'post',
					'post_status' => 'publish',
				)
			),
			'Should have no published posts initially.'
		);
		$this->factory()->post->create( array( 'post_status' => 'publish' ) ); // first post

		do_action( 'googlesitekit_activation', $network_wide );

		$this->assertNotEmpty( $this->options->get( Activation_Flag::OPTION_SHOW_ACTIVATION_NOTICE ), 'Activation notice should be set after activation action.' );
	}
}
