<?php
/**
 * Site_Specific_AnswersTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\User_Input\Site_Specific_Answers;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Site_Specific_AnswersTest extends SettingsTestCase {

	/**
	 * Site_Specific_Answers instance.
	 *
	 * @var Site_Specific_Answers
	 */
	private $site_specific_answers;

	public function set_up() {
		parent::set_up();

		$user_id                     = $this->factory()->user->create();
		$context                     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                     = new Options( $context, $user_id );
		$this->site_specific_answers = new Site_Specific_Answers( $options );
		$this->site_specific_answers->register();
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
				array( 'goals' => array() ),
				array(),
			),
			'array with scoped keys but non-array values' => array(
				array( 'purpose' => 'a' ),
				array(),
			),
			'array with scoped keys and valid values'     => array(
				array(
					'purpose' => array(
						'scope'      => 'site',
						'values'     => array( 'purpose1' ),
						'answeredBy' => 1,
					),
				),
				array(
					'purpose' => array(
						'scope'      => 'site',
						'values'     => array( 'purpose1' ),
						'answeredBy' => 1,
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
			$this->assertEmpty( $this->site_specific_answers->get() );
		} else {
			$this->site_specific_answers->set( $input );
			$this->assertEquals( $expected, $this->site_specific_answers->get() );
		}
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Site_Specific_Answers::OPTION;
	}
}
