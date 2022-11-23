<?php
/**
 * Site_Specific_QuestionsTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\User_Input\Site_Specific_Questions;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Site_Specific_QuestionsTest extends SettingsTestCase {

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	public function set_up() {
		parent::set_up();

		$user_id       = $this->factory()->user->create();
		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $context, $user_id );
	}

	public function test_get_sanitize_callback() {
		$site_specific_questions = new Site_Specific_Questions( $this->options );
		$site_specific_questions->register();

		$this->assertEmpty( $site_specific_questions->get() );

		// Setting the value to a non-array will result in an empty array.
		$site_specific_questions->set( false );
		$this->assertEquals( array(), $site_specific_questions->get() );

		$site_specific_questions->set( 123 );
		$this->assertEquals( array(), $site_specific_questions->get() );

		// Setting the value to an array but with non-scoped keys will
		// result in an empty array.
		$site_specific_questions->set( array( 'goals' => array() ) );
		$this->assertEquals( array(), $site_specific_questions->get() );

		// Setting the value to an array with scoped keys but a non-array
		// value will result in an empty array.
		$site_specific_questions->set( array( 'purpose' => 'a' ) );
		$this->assertEquals( array(), $site_specific_questions->get() );

		// Setting the value to an associative array with scoped keys and array
		// with valid values as the value works as expected.
		$site_specific_questions->set(
			array(
				'purpose' => array(
					'scope'      => 'site',
					'values'     => array( 'purpose1' ),
					'answeredBy' => 1,
				),
			)
		);
		$this->assertEquals(
			array(
				'purpose' => array(
					'scope'      => 'site',
					'values'     => array( 'purpose1' ),
					'answeredBy' => 1,
				),
			),
			$site_specific_questions->get()
		);
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Site_Specific_Questions::OPTION;
	}
}
