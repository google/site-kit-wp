<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class Tag_GuardTest extends TestCase {

	/**
	 * Settings object.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Tag_Guard object.
	 *
	 * @var Tag_Guard
	 */
	private $guard;

	public function set_up() {
		parent::set_up();

		update_option(
			Settings::OPTION,
			array(
				'publicationID' => '12345',
			)
		);

		$this->settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->guard    = new Tag_Guard( $this->settings );
	}

	public function test_can_activate() {
		$this->assertTrue( $this->guard->can_activate() );
	}

	public function test_cant_activate_when_usesnippet_is_falsy() {
		$this->settings->merge( array( 'publicationID' => '' ) );

		$this->assertFalse( $this->guard->can_activate(), 'Should return FALSE when publicationID is not set.' );
	}
}
