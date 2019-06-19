<?php
/**
 * Class Google\Site_Kit\Tests\Core\Authentication\First_AdminTest
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\First_Admin;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * First_AdminTest
 *
 * @group Authentication
 */
class First_AdminTest extends TestCase {

	/**
	 * First_Admin object.
	 *
	 * @var First_Admin
	 */
	private $first_admin;

	/**
	 * Set Up Test.
	 */
	public function setUp() {
		parent::setUp();

		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->first_admin = new First_Admin( $options );
	}

	/**
	 * Test get() method.
	 */
	public function test_get() {
		$this->assertFalse( $this->first_admin->get() );

		$this->first_admin->set( 1 );
		$this->assertEquals( 1, $this->first_admin->get() );
	}

	/**
	 * Test set() method.
	 */
	public function test_set() {
		$this->assertTrue( $this->first_admin->set( 1 ) );
		$this->assertEquals( 1, $this->first_admin->get() );
	}

	/**
	 * Test has() method.
	 */
	public function test_has() {
		$this->assertFalse( $this->first_admin->has() );

		$this->first_admin->set( 1 );
		$this->assertTrue( $this->first_admin->has() );
	}
}
