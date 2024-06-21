<?php
/**
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads;
use Google\Site_Kit\Tests\TestCase;

class Easy_Digital_DownloadsTest extends TestCase {

	/**
	 * Easy_Digital_Downloads instance.
	 *
	 * @var Easy_Digital_Downloads
	 */
	private $contactform;

	public function set_up() {
		parent::set_up();
		$this->contactform = new Easy_Digital_Downloads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();

		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'EDD_VERSION' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'EDD_VERSION' );
		}
	}

	public function test_is_active() {
		$this->assertFalse( $this->contactform->is_active() );
		define( 'EDD_VERSION', 1 );
		$this->assertTrue( $this->contactform->is_active() );
	}

	public function test_get_event_names() {
		$events = $this->contactform->get_event_names();
		$this->assertCount( 1, $events );
		$this->assertEquals( 'add_to_cart', $events[0] );
	}

	public function test_register_script() {
		$handle = 'gsk-cep-' . Easy_Digital_Downloads::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ) );

		$script = $this->contactform->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
	}

}
