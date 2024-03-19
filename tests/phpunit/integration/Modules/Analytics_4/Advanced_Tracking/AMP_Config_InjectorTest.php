<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Advanced_Tracking\AMP_Config_InjectorTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Advanced_Tracking;

use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\AMP_Config_Injector;
use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\Event;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics
 */
class AMP_Config_InjectorTest extends TestCase {

	public function test_inject_event_configurations() {
		$amp_config_injector = new AMP_Config_Injector();

		$input        = array( 'someKey' => 'someValue' );
		$gtag_amp_opt = $amp_config_injector->inject_event_configurations(
			$input,
			array(
				new Event(
					array(
						'action'   => 'test_event_without_metadata',
						'selector' => '.some-button',
						'on'       => 'click',
					)
				),
				new Event(
					array(
						'action'   => 'test_event_with_metadata',
						'selector' => '.a-very-specific-button',
						'on'       => 'click',
						'metadata' => array( 'event_category' => 'test_event_category' ),
					)
				),
				new Event(
					array(
						'action' => 'test_event_onload',
						'on'     => 'DOMContentLoaded',
					)
				),
			)
		);

		$this->assertEqualSets(
			array(
				array(
					'on'       => 'click',
					'selector' => '.some-button',
					'vars'     => array(
						'event_name' => 'test_event_without_metadata',
					),
				),
				array(
					'on'       => 'click',
					'selector' => '.a-very-specific-button',
					'vars'     => array(
						'event_name'     => 'test_event_with_metadata',
						'event_category' => 'test_event_category',
					),
				),
				array(
					'on'   => 'visible',
					'vars' => array(
						'event_name' => 'test_event_onload',
					),
				),
			),
			$gtag_amp_opt['triggers']
		);
	}

	public function test_inject_event_configurations_no_events() {
		$amp_config_injector = new AMP_Config_Injector();
		$input               = array( 'someKey' => 'someValue' );
		$this->assertEquals( $input, $amp_config_injector->inject_event_configurations( $input, array() ) );
	}
}
