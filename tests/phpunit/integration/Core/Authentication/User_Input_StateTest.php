<?php
/**
 * User_Input_StateTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\User_Input_State;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * @group Authentication
 * @group Ryan
 */
class User_Input_StateTest extends TestCase {

	/**
	 * User Input State instance
	 *
	 * @var User_Input_State
	 */
	protected $user_input_state;

	/**
	 * Set Up Test.
	 */
	public function setUp() {
		$user_id                = $this->factory()->user->create();
		$context                = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options     = new User_Options( $context, $user_id );
		$this->user_input_state = new User_Input_State( $this->user_options );
	}

	public function tearDown() {
		unset( $this->user_input_state );
	}

	/**
	 * Test allowed set values
	 *
	 * @dataProvider data_allowed_set_values
	 *
	 * @param string $value             Passed to set the option
	 * @param bool   $expected_from_set Expected results form the set() method
	 * @param string $expected_from_get Expected result from related get() methods
	 *
	 * @return void
	 */
	public function test_allowed_set_values( $value, $expected_from_set, $expected_from_get ) {
		$this->assertSame( $this->user_input_state->set( $value ), $expected_from_set );
		$this->assertEquals( $expected_from_get, $this->user_input_state->get() );
		$this->assertEquals( $expected_from_get, $this->user_options->get( User_Input_State::OPTION ) );
	}

	/**
	 * DataProvider
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $value
	 *         @type bool   $expected_from_set
	 *         @type string $expected_from_get
	 *     }
	 * }
	 */
	public function data_allowed_set_values() {
		return array(
			array( 'completed', true, 'completed' ),
			array( 'required', true, 'required' ),
			array( 'missing', true, 'missing' ),
			array( '', true, '' ),
			array( 'invalid-value', false, '' ),
		);
	}
}
