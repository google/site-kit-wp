<?php
/**
 * Feature_MetricsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tracking
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tracking;

use Google\Site_Kit\Core\Tracking\Feature_Metrics;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group tracking
 */
class Feature_MetricsTest extends TestCase {

	public function test_register() {
		remove_all_filters( 'googlesitekit_features_request_data' );

		$feature_metrics = new Feature_Metrics();

		$this->assertFalse( has_filter( 'googlesitekit_features_request_data' ), 'There should be no filter for features request data initially.' );

		$feature_metrics->register();

		$this->assertTrue( has_filter( 'googlesitekit_features_request_data' ), 'The filter for features request data should be registered.' );
	}
}
