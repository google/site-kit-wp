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
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Ninja_Forms;
use Google\Site_Kit\Tests\TestCase;

class Ninja_FormsTest extends TestCase {

	/**
	 * Ninja_Forms instance.
	 *
	 * @var Ninja_Forms
	 */
	private $ninjaform;

	public function set_up() {
		parent::set_up();
		$this->ninjaform = new Ninja_Forms( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();

		if ( function_exists( 'runkit7_constant_remove' ) ) {
			runkit7_constant_remove( 'NF_PLUGIN_URL' );
		} elseif ( function_exists( 'runkit_constant_remove' ) ) {
			runkit_constant_remove( 'NF_PLUGIN_URL' );
		}
	}

	public function test_is_active() {
		$this->assertFalse( $this->ninjaform->is_active() );
		define( 'NF_PLUGIN_URL', 1 );
		$this->assertTrue( $this->ninjaform->is_active() );
	}

	public function test_get_event_names() {
		$events = $this->ninjaform->get_event_names();
		$this->assertCount( 1, $events );
		$this->assertEquals( 'submit_lead_form', $events[0] );
	}

	public function test_register_script() {
		$handle = 'gsk-cep-' . Ninja_Forms::CONVERSION_EVENT_PROVIDER_SLUG;
		$this->assertFalse( wp_script_is( $handle, 'registered' ) );

		$script = $this->ninjaform->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
	}

}
