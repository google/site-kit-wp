<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Owner_IDTest
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Owner_ID;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * Owner_IDTest
 *
 * @group Authentication
 */
class Owner_IDTest extends SettingsTestCase {

	/**
	 * Owner_ID object.
	 *
	 * @var Owner_ID
	 */
	private $owner_id;

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	public function setUp() {
		parent::setUp();

		$this->options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->owner_id = new Owner_ID( $this->options );
		$this->owner_id->register();
	}

	public function test_get() {
		$this->assertEquals( 0, $this->owner_id->get() );

		$this->options->set( Owner_ID::OPTION, 1 );
		$this->assertEquals( 1, $this->owner_id->get() );

		$this->options->set( Owner_ID::OPTION, 'xxx' );
		$this->assertTrue( is_int( $this->owner_id->get() ) );
		$this->assertEquals( 0, $this->owner_id->get() );
	}

	public function test_set() {
		$this->assertTrue( $this->owner_id->set( 1 ) );
		$this->assertTrue( is_int( $this->options->get( Owner_ID::OPTION ) ) );
		$this->assertEquals( 1, $this->options->get( Owner_ID::OPTION ) );

		$this->assertTrue( $this->owner_id->set( 'xxx' ) );
		$this->assertTrue( is_int( $this->options->get( Owner_ID::OPTION ) ) );
		$this->assertEquals( 0, $this->options->get( Owner_ID::OPTION ) );
	}

	public function test_has() {
		$this->assertFalse( $this->owner_id->has() );

		$this->owner_id->set( 1 );
		$this->assertTrue( $this->owner_id->has() );

		$this->owner_id->set( 'xxx' );
		$this->assertTrue( $this->owner_id->has() );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Owner_ID::OPTION;
	}

}
