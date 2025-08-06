<?php
/**
 * Class Google\Site_Kit\Tests\Core\Authentication\VerificationTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 * */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * VerificationTest
 *
 * @group Authentication
 */
class VerificationTest extends TestCase {

	/**
	 * User ID
	 *
	 * @var int User ID.
	 */
	private static $user_id;

	/**
	 * User Options object
	 *
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Set up test class.
	 *
	 * @param \WP_UnitTest_Factory $factory The fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$user_id = $factory->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'user_verification_test',
				'user_email' => 'user_verification_test@example.com',
			)
		);
	}

	/**
	 * Set Up Test.
	 */
	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$user_id );
		$this->user_options = new User_Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * Test get() method.
	 */
	public function test_get() {
		$verification = new Verification( $this->user_options );

		$this->assertEquals( false, $verification->get(), 'Verification should be false by default.' );

		$verification->set( true );
		$this->assertEquals( true, $verification->get(), 'Verification should return the set value.' );
	}

	/**
	 * Test set() method.
	 */
	public function test_set() {
		$verification = new Verification( $this->user_options );

		$return_data = $verification->set( true );
		$this->assertTrue( $return_data, 'Setting verification to true should return true.' );
		$this->assertEquals( true, $verification->get(), 'Verification should be set to true.' );

		$return_data = $verification->set( false );
		$this->assertTrue( $return_data, 'Setting verification to false should return true.' );
		$this->assertEquals( false, $verification->get(), 'Verification should be set to false.' );
	}

	/**
	 * Test has() method.
	 */
	public function test_has() {
		$verification = new Verification( $this->user_options );

		$verification->set( true );
		$this->assertEquals( true, $verification->has(), 'Verification should exist when set to true.' );
	}
}
