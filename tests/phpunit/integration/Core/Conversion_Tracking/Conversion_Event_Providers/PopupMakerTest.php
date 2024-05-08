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
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\PopupMaker;
use Google\Site_Kit\Tests\TestCase;

class PopupMakerTest extends TestCase {

	/**
	 * PopupMaker instance.
	 *
	 * @var PopupMaker
	 */
	private $popupmaker;

	public function set_up() {
		parent::set_up();
		$this->popupmaker = new PopupMaker( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_is_active() {
		$this->assertFalse( $this->popupmaker->is_active() );
		define( 'OMAPI_FILE', 1 );
		$this->assertTrue( $this->popupmaker->is_active() );
	}

	public function test_get_event_names() {
		$events = $this->popupmaker->get_event_names();
		$this->assertCount( 1, $events );
		$this->assertEquals( 'submit_lead_form', $events[0] );
	}

	public function test_register_script() {
		$script = $this->popupmaker->register_script();
		$this->assertInstanceOf( Script::class, $script );
		$this->assertTrue( wp_script_is( 'gsk-cep-' . PopupMaker::CONVERSION_EVENT_PROVIDER_SLUG, 'registered' ) );
	}

}
