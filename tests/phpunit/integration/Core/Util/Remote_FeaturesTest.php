<?php
/**
 * Remote_FeaturesTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Remote_Features;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Remote_FeaturesTest extends TestCase {

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * @var Options
	 */
	private $options;

	/**
	 * @var Remote_Features
	 */
	private $remote_features;

	public function set_up() {
		parent::set_up();

		$this->context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options         = new Options( $this->context );
		$this->authentication  = new Authentication( $this->context, $this->options );
		$this->remote_features = new Remote_Features( $this->authentication, $this->context, $this->options );
	}

	public function test_register__setup_remote_features_cron() {
		remove_all_actions( 'googlesitekit_cron_update_remote_features' );
		wp_clear_scheduled_hook( 'googlesitekit_cron_update_remote_features' );

		$this->assertFalse( has_action( 'googlesitekit_cron_update_remote_features' ) );
		$this->assertFalse(
			wp_next_scheduled( 'googlesitekit_cron_update_remote_features' )
		);

		$current_time = time();

		$this->remote_features->register();

		$this->assertTrue( has_action( 'googlesitekit_cron_update_remote_features' ) );
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( 'googlesitekit_cron_update_remote_features' )
		);
	}
}
