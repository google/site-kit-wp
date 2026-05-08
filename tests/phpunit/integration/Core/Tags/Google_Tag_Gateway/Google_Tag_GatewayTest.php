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

		$this->context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                  = new Options( $this->context );
		$this->google_tag_gateway = new Google_Tag_Gateway( $this->context );
		$this->settings           = new Google_Tag_Gateway_Settings( $options );
	}

	public function test_register__feature_metrics() {
		remove_all_filters( 'googlesitekit_feature_metrics' );

		$this->assertFalse( has_filter( 'googlesitekit_feature_metrics' ), 'There should be no filter for features metrics initially.' );

		$this->google_tag_gateway->register();

		$this->assertTrue( has_filter( 'googlesitekit_feature_metrics' ), 'The filter for features metrics should be registered.' );
	}

	/**
	 * @dataProvider data_feature_metrics_settings
	 *
	 * @param array $settings               Settings to set.
	 * @param array $expected_feature_metrics Expected feature metrics.
	 * @param string $message                Message for the assertion.
	 */
	public function test_get_feature_metrics( $settings, $expected_feature_metrics, $message ) {
		$this->settings->set( $settings );
		$feature_metrics = $this->google_tag_gateway->get_feature_metrics();
		$this->assertEquals( $expected_feature_metrics, $feature_metrics, $message );
	}

	public function data_feature_metrics_settings() {
		return array(
			'disabled'                                     => array(
				array(),
				array(
					'gtg_enabled' => false,
					'gtg_healthy' => '',
				),
				'When settings are not set, gtg_enabled should be false and gtg_healthy should be an empty string.',
			),
			'disabled but healthy and accessible'          => array(
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => true,
				),
				array(
					'gtg_enabled' => false,
					'gtg_healthy' => '',
				),
				'When GTG is disabled, gtg_enabled should be false and gtg_healthy should be an empty string.',
			),
			'enabled, healthy but not accessible'          => array(
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => false,
				),
				array(
					'gtg_enabled' => true,
					'gtg_healthy' => 'no',
				),
				'When GTG is enabled, healthy but not accessible, gtg_healthy should be "no".',
			),
			'enabled, not healthy and not accessible'      => array(
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => false,
					'isScriptAccessEnabled' => false,
				),
				array(
					'gtg_enabled' => true,
					'gtg_healthy' => 'no',
				),
				'When GTG is enabled, not healthy and not accessible, gtg_healthy should be "no".',
			),
			'enabled but no healthy and accessible values' => array(
				array(
					'isEnabled' => true,
				),
				array(
					'gtg_enabled' => true,
					'gtg_healthy' => 'no',
				),
				'When GTG is enabled but health and accessibility are not set, gtg_healthy should be "no".',
			),
			'enabled, healthy and accessible'              => array(
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => true,
				),
				array(
					'gtg_enabled' => true,
					'gtg_healthy' => 'yes',
				),
				'When GTG is enabled, healthy and accessible, gtg_healthy should be "yes".',
			),
		);
	}
}
