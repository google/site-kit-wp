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
	 * User_Specific_Answers instance.
	 *
	 * @var User_Specific_Answers
	 */
	private $user_specific_answers;

	public function set_up() {
		parent::set_up();
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$meta_key     = $user_options->get_meta_key( User_Specific_Answers::OPTION );

		unregister_meta_key( 'user', $meta_key );
		// Needed to unregister the instance registered during plugin bootstrap.
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );

		$this->user_specific_answers = new User_Specific_Answers( $user_options );
		$this->user_specific_answers->register();
	}

	public function data_answers() {
		return array(
			'empty by default'                            => array(
				null,
				array(),
			),
			'non-array - bool'                            => array(
				false,
				array(),
			),
			'non-array - int'                             => array(
				123,
				array(),
			),
			'array with non-scoped keys'                  => array(
				array( 'purpose' => array() ),
				array(),
			),
			'array with scoped keys but non-array values' => array(
				array( 'goals' => 'a' ),
				array(),
			),
			'array with scoped keys and valid values'     => array(
				array(
					'goals' => array(
						'scope'  => 'user',
						'values' => array( 'goal1', 'goal2' ),
					),
				),
				array(
					'goals' => array(
						'scope'  => 'user',
						'values' => array( 'goal1', 'goal2' ),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_answers
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		if ( null === $input ) {
			$this->assertEmpty( $this->user_specific_answers->get() );
		} else {
			$this->user_specific_answers->set( $input );
			$this->assertEquals( $expected, $this->user_specific_answers->get() );
		}
	}
}
