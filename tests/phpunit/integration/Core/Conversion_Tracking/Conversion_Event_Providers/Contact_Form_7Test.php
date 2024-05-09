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
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Contact_Form_7;
use Google\Site_Kit\Tests\TestCase;

class Contact_Form_7Test extends TestCase {

	/**
	 * Contact_Form_7 instance.
	 *
	 * @var Contact_Form_7
	 */
	private $contactform;

	public function set_up() {
		parent::set_up();
		$this->contactform = new Contact_Form_7( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();

		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'WPCF7_VERSION' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'WPCF7_VERSION' );
		}
	}

	public function test_is_active() {
		$this->assertFalse( $this->contactform->is_active() );
		define( 'WPCF7_VERSION', 1 );
		$this->assertTrue( $this->contactform->is_active() );
	}

	public function test_get_event_names() {
		$events = $this->contactform->get_event_names();
		$this->assertCount( 1, $events );
		$this->assertEquals( 'contact', $events[0] );
	}

	public function test_register_script() {
		$handle = 'gsk-cep-' . Contact_Form_7::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ) );

		$script = $this->contactform->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
	}

}
