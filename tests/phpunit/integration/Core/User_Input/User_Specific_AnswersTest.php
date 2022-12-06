<?php
/**
 * User_Specific_AnswersTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User_Input\User_Specific_Answers;
use Google\Site_Kit\Tests\TestCase;

class User_Specific_AnswersTest extends TestCase {

	/**
	 * @var User_Options
	 */
	protected $user_options;

	public function set_up() {
		parent::set_up();
		$user_id            = $this->factory()->user->create();
		$context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $context, $user_id );
		$meta_key           = $this->user_options->get_meta_key( User_Specific_Answers::OPTION );
		unregister_meta_key( 'user', $meta_key );
		// Needed to unregister the instance registered during plugin bootstrap.
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );
	}

	public function test_get_sanitize_callback() {
		$user_specific_answers = new User_Specific_Answers( $this->user_options );
		$user_specific_answers->register();

		$this->assertEmpty( $user_specific_answers->get() );

		// Setting the value to a non-array will result in an empty array.
		$user_specific_answers->set( false );
		$this->assertEquals( array(), $user_specific_answers->get() );

		$user_specific_answers->set( 123 );
		$this->assertEquals( array(), $user_specific_answers->get() );

		// Setting the value to an array but with non-scoped keys will
		// result in an empty array.
		$user_specific_answers->set( array( 'purpose' => array() ) );
		$this->assertEquals( array(), $user_specific_answers->get() );

		// Setting the value to an array with scoped keys but a non-array
		// value will result in an empty array.
		$user_specific_answers->set( array( 'goals' => 'a' ) );
		$this->assertEquals( array(), $user_specific_answers->get() );

		// Setting the value to an associative array with scoped keys and array
		// with valid values as the value works as expected.
		$user_specific_answers->set(
			array(
				'goals' => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
			)
		);
		$this->assertEquals(
			array(
				'goals' => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
			),
			$user_specific_answers->get()
		);
	}
}
