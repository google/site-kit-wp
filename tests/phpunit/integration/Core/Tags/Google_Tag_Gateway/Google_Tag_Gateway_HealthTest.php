<?php
/**
 * Google_Tag_Gateway_HealthTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Google_Tag_Gateway
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Health;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Google_Tag_Gateway_HealthTest extends SettingsTestCase {

	/**
	 * Google Tag Gateway Health instance.
	 *
	 * @var Google_Tag_Gateway_Health
	 */
	private $health;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options       = new Options( $this->context );
		$this->health  = new Google_Tag_Gateway_Health( $options );
		$this->health->register();
	}

	protected function get_option_name() {
		return Google_Tag_Gateway_Health::OPTION;
	}

	public function test_get_default() {
		$default_health = get_option( $this->get_option_name() );
		$this->assertEqualSetsWithIndex(
			array(
				'isUpstreamHealthy' => null,
				'isMpathHealthy'    => null,
			),
			$default_health
		);
	}

	public function data_health_monitoring_data() {
		return array(
			'all properties false'                         => array(
				array(
					'isUpstreamHealthy' => false,
					'isMpathHealthy'    => false,
				),
				array(
					'isUpstreamHealthy' => false,
					'isMpathHealthy'    => false,
				),
			),
			'empty health data'                            => array(
				array(),
				array(
					'isUpstreamHealthy' => null,
					'isMpathHealthy'    => null,
				),
			),
			'all properties true'                          => array(
				array(
					'isUpstreamHealthy' => true,
					'isMpathHealthy'    => true,
				),
				array(
					'isUpstreamHealthy' => true,
					'isMpathHealthy'    => true,
				),
			),
			'only isUpstreamHealthy false'                 => array(
				array(
					'isUpstreamHealthy' => false,
				),
				array(
					'isUpstreamHealthy' => false,
					'isMpathHealthy'    => null,
				),
			),
			'only isUpstreamHealthy true'                  => array(
				array(
					'isUpstreamHealthy' => true,
				),
				array(
					'isUpstreamHealthy' => true,
					'isMpathHealthy'    => null,
				),
			),
			'only isMpathHealthy false'                    => array(
				array(
					'isMpathHealthy' => false,
				),
				array(
					'isUpstreamHealthy' => null,
					'isMpathHealthy'    => false,
				),
			),
			'only isMpathHealthy true'                     => array(
				array(
					'isMpathHealthy' => true,
				),
				array(
					'isUpstreamHealthy' => null,
					'isMpathHealthy'    => true,
				),
			),
			'isUpstreamHealthy false, isMpathHealthy true' => array(
				array(
					'isUpstreamHealthy' => false,
					'isMpathHealthy'    => true,
				),
				array(
					'isUpstreamHealthy' => false,
					'isMpathHealthy'    => true,
				),
			),
			'isUpstreamHealthy true, isMpathHealthy false' => array(
				array(
					'isUpstreamHealthy' => true,
					'isMpathHealthy'    => false,
				),
				array(
					'isUpstreamHealthy' => true,
					'isMpathHealthy'    => false,
				),
			),
		);
	}

	/**
	 * @dataProvider data_health_monitoring_data
	 */
	public function test_get_sanitize_and_set( $input, $expected ) {
		$this->health->set( $input );
		$this->assertEqualSetsWithIndex( $expected, $this->health->get() );
	}

	public function test_merge() {
		// Set initial health data.
		$this->health->set(
			array(
				'isUpstreamHealthy' => true,
				'isMpathHealthy'    => true,
			)
		);

		// Merge partial update.
		$this->health->merge( array( 'isUpstreamHealthy' => false ) );

		$expected = array(
			'isUpstreamHealthy' => false,
			'isMpathHealthy'    => true,
		);

		$this->assertEqualSetsWithIndex( $expected, $this->health->get() );
	}

	public function test_merge_filters_null_values() {
		// Set initial health data.
		$this->health->set(
			array(
				'isUpstreamHealthy' => true,
				'isMpathHealthy'    => false,
			)
		);

		// Try to merge with null values (should be filtered out).
		$this->health->merge(
			array(
				'isUpstreamHealthy' => null,
				'isMpathHealthy'    => true,
			)
		);

		// isUpstreamHealthy should remain unchanged (null was filtered).
		$expected = array(
			'isUpstreamHealthy' => true,
			'isMpathHealthy'    => true,
		);

		$this->assertEqualSetsWithIndex( $expected, $this->health->get() );
	}

	public function test_is_healthy_returns_true_when_both_true() {
		$this->health->set(
			array(
				'isUpstreamHealthy' => true,
				'isMpathHealthy'    => true,
			)
		);

		$this->assertTrue( $this->health->is_healthy(), 'GTG should be healthy when both upstream and mpath are healthy.' );
	}

	public function test_is_healthy_returns_false_when_upstream_false() {
		$this->health->set(
			array(
				'isUpstreamHealthy' => false,
				'isMpathHealthy'    => true,
			)
		);

		$this->assertFalse( $this->health->is_healthy(), 'GTG should not be healthy when upstream is unhealthy.' );
	}

	public function test_is_healthy_returns_false_when_mpath_false() {
		$this->health->set(
			array(
				'isUpstreamHealthy' => true,
				'isMpathHealthy'    => false,
			)
		);

		$this->assertFalse( $this->health->is_healthy(), 'GTG should not be healthy when mpath is unhealthy.' );
	}

	public function test_is_healthy_returns_false_when_both_false() {
		$this->health->set(
			array(
				'isUpstreamHealthy' => false,
				'isMpathHealthy'    => false,
			)
		);

		$this->assertFalse( $this->health->is_healthy(), 'GTG should not be healthy when both upstream and mpath are unhealthy.' );
	}

	public function test_is_healthy_returns_false_when_upstream_null() {
		$this->health->set(
			array(
				'isUpstreamHealthy' => null,
				'isMpathHealthy'    => true,
			)
		);

		$this->assertFalse( $this->health->is_healthy(), 'GTG should not be healthy when upstream status is null.' );
	}

	public function test_is_healthy_returns_false_when_mpath_null() {
		$this->health->set(
			array(
				'isUpstreamHealthy' => true,
				'isMpathHealthy'    => null,
			)
		);

		$this->assertFalse( $this->health->is_healthy(), 'GTG should not be healthy when mpath status is null.' );
	}

	public function test_is_healthy_returns_false_when_both_null() {
		$this->health->set(
			array(
				'isUpstreamHealthy' => null,
				'isMpathHealthy'    => null,
			)
		);

		$this->assertFalse( $this->health->is_healthy(), 'GTG should not be healthy when both upstream and mpath statuses are null.' );
	}
}
