<?php
/**
 * Key_MetricsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Key_Metrics\Key_Metrics
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Key_Metrics\Key_Metrics;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
use Google\Site_Kit\Tests\TestCase;

class Key_MetricsTest extends TestCase {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Key_Metrics instance.
	 *
	 * @var Key_Metrics
	 */
	private $key_metrics;

	public function set_up() {
		parent::set_up();

		$this->context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->key_metrics = new Key_Metrics( $this->context );
	}

	public function test_register__feature_metrics() {
		remove_all_filters( 'googlesitekit_feature_metrics' );

		$this->assertFalse( has_filter( 'googlesitekit_feature_metrics' ), 'There should be no filter for features metrics initially.' );

		$this->key_metrics->register();

		$this->assertTrue( has_filter( 'googlesitekit_feature_metrics' ), 'The filter for features metrics should be registered.' );
	}

	public function test_get_feature_metrics__not_setup() {
		$feature_metrics = $this->key_metrics->get_feature_metrics();
		$this->assertEquals( array( 'km_setup' => false ), $feature_metrics, 'Before setting any settings, feature metrics should indicate km_setup is false.' );
	}

	public function test_get_feature_metrics__setup() {
		// Simulate the setup being completed.
		update_option( Key_Metrics_Setup_Completed_By::OPTION, true );
		$feature_metrics = $this->key_metrics->get_feature_metrics();
		$this->assertEquals( array( 'km_setup' => true ), $feature_metrics, 'After setting the setup to true, feature metrics should indicate km_setup is true.' );
	}
}
