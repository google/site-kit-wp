<?php
/**
 * Google_Tag_GatewayTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Google_Tag_Gateway
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Tests\TestCase;

class Google_Tag_GatewayTest extends TestCase {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Google_Tag_Gateway_Settings instance.
	 *
	 * @var Google_Tag_Gateway_Settings
	 */
	private $settings;

	/**
	 * Google_Tag_Gateway instance.
	 *
	 * @var Google_Tag_Gateway
	 */
	private $google_tag_gateway;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                  = new Options( $this->context );
		$this->google_tag_gateway = new Google_Tag_Gateway( $this->context );
		$this->settings           = new Google_Tag_Gateway_Settings( $options );
	}

	public function test_register__feature_metrics() {
		remove_all_filters( 'googlesitekit_feature_metrics' );

		$this->assertFalse( has_filter( 'googlesitekit_feature_metrics' ), 'There should be no filter for features metrics initially.' );

		$this->google_tag_gateway->register();
		$this->settings->set(
			array(
				'isEnabled'    => true,
				'isGTGHealthy' => true,
			)
		);
		$this->assertTrue( has_filter( 'googlesitekit_feature_metrics' ), 'The filter for features metrics should be registered.' );

		$expected_feature_metrics = array(
			'gtg_enabled' => true,
			'gtg_healthy' => true,
		);
		$feature_metrics          = apply_filters( 'googlesitekit_feature_metrics', array() );
		$this->assertEquals( $expected_feature_metrics, $feature_metrics, 'Feature metrics should reflect a true state when corresponding settings are true.' );

		$this->settings->set(
			array(
				'isEnabled'    => false,
				'isGTGHealthy' => false,
			)
		);
		$expected_feature_metrics = array(
			'gtg_enabled' => false,
			'gtg_healthy' => 'no',
		);
		$feature_metrics          = apply_filters( 'googlesitekit_feature_metrics', array() );
		$this->assertEquals( $expected_feature_metrics, $feature_metrics, 'Feature metrics should reflect a false state when corresponding settings are false.' );
	}
}
