<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Owner_IDTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
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

	public function set_up() {
		parent::set_up();

		$this->options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->owner_id = new Owner_ID( $this->options );
		$this->owner_id->register();
	}

	public function test_get() {
		$this->assertEquals( 0, $this->owner_id->get() );
		$this->assertIsInt( $this->owner_id->get() );

		$this->options->set( Owner_ID::OPTION, 1 );
		$this->assertIsInt( $this->owner_id->get() );
		$this->assertEquals( 1, $this->owner_id->get() );

		$this->options->set( Owner_ID::OPTION, 'xxx' );
		$this->assertIsInt( $this->owner_id->get() );
		$this->assertEquals( 0, $this->owner_id->get() );

		// When setting with a string, WP sanitizes it before caching.
		// However, the value will be stored in the DB as a string and so loading
		// from the DB with a cold cache will result in a string return value.
		$this->options->set( Owner_ID::OPTION, '3' );
		wp_cache_flush(); // The option value is cached on set, so we have to flush after.
		$this->assertIsInt( $this->owner_id->get() );
		$this->assertEquals( 3, $this->owner_id->get() );
	}

	public function test_set() {
		$this->assertTrue( $this->owner_id->set( 1 ) );
		$this->assertSame( 1, $this->options->get( Owner_ID::OPTION ) );

		// Setting with a string value is sanitized as an integer.
		$this->assertTrue( $this->owner_id->set( '2' ) );
		$this->assertSame( 2, $this->options->get( Owner_ID::OPTION ) );

		// An invalid value will result in a 0 as a result of sanitization.
		$this->assertTrue( $this->owner_id->set( 'xxx' ) );
		$this->assertSame( 0, $this->options->get( Owner_ID::OPTION ) );
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
