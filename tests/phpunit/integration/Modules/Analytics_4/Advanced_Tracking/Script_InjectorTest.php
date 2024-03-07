<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Advanced_Tracking\Script_InjectorTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Advanced_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\Script_Injector;
use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\Event;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics
 */
class Script_InjectorTest extends TestCase {

	public function test_inject_event_script() {
		// Use mock context to return development script path, just so that a JS file containing the expected
		// placeholder string is found, regardless of whether JS build process has run.
		$context = $this->getMockBuilder( Context::class )
			->setConstructorArgs( array( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) )
			->setMethods( array( 'path' ) )
			->getMock();
		$context
			->expects( $this->once() )
			->method( 'path' )
			->willReturn( dirname( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . '/assets/js/analytics-advanced-tracking.js' );

		$script_injector = new Script_Injector( $context );

		ob_start();
		$script_injector->inject_event_script(
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
		$output = ob_get_clean();

		$expected_json = '[{"action":"test_event_without_metadata","selector":".some-button","on":"click","metadata":null},{"action":"test_event_with_metadata","selector":".a-very-specific-button","on":"click","metadata":{"event_category":"test_event_category"}},{"action":"test_event_onload","on":"DOMContentLoaded","metadata":null,"selector":""}]';
		$this->assertMatchesRegularExpression( '/<script( [^>]*)?>.+<\/script>/ms', trim( $output ) );
		$this->assertStringContainsString( $expected_json, $output );
	}

	public function test_inject_event_script_no_events() {
		$script_injector = new Script_Injector( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		ob_start();
		$script_injector->inject_event_script( array() );
		$output = ob_get_clean();
		$this->assertEmpty( $output );
	}
}
