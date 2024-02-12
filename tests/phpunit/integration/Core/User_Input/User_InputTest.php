<?php
/**
 * Class Google\Site_Kit\Tests\Core\User_Input\User_InputTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User_Input\User_Input;
use Google\Site_Kit\Core\User_Input\Site_Specific_Answers;
use Google\Site_Kit\Core\User_Input\User_Specific_Answers;
use Google\Site_Kit\Tests\TestCase;

class User_InputTest extends TestCase {

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * User_Input instance.
	 *
	 * @var User_Input
	 */
	private $user_input;

	/**
	 * User ID.
	 *
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$this->user_options = new User_Options( $this->context, $this->user_id );
		$this->user_input   = new User_Input( $this->context, null, $this->user_options );
		$this->user_input->register();
	}

	public function test_are_settings_empty() {
		$data = array(
			'setting1' => array( 'values' => null ),
		);
		$this->assertTrue( $this->user_input->are_settings_empty( $data ) );

		$data = array(
			'setting1' => array( 'values' => null ),
			'setting2' => array( 'values' => array( '1', '2', '3' ) ),
		);
		$this->assertTrue( $this->user_input->are_settings_empty( $data ) );

		$data = array(
			'setting1' => array( 'values' => array( 'a', 'b', 'c' ) ),
			'setting2' => array( 'values' => array( '1', '2', '3' ) ),
		);
		$this->assertFalse( $this->user_input->are_settings_empty( $data ) );
	}

	public function test_get_answers() {
		$this->user_input->register();
		// If settings are not set, it returns empty default values.
		$this->assertEquals(
			array(
				'purpose'       => array(
					'scope'  => 'site',
					'values' => array(),
				),
				'postFrequency' => array(
					'scope'  => 'user',
					'values' => array(),
				),
				'goals'         => array(
					'scope'  => 'user',
					'values' => array(),
				),
			),
			$this->user_input->get_answers()
		);

		// If settings are partially set, it returns empty default values for unanswered questions.
		update_user_option(
			$this->user_id,
			User_Specific_Answers::OPTION,
			array(
				'postFrequency' => array(
					'values' => array( 'daily' ),
					'scope'  => 'user',
				),
				'goals'         => array(
					'values' => array( 'goal1', 'goal2' ),
					'scope'  => 'user',
				),
			)
		);
		$this->assertEquals(
			array(
				'purpose'       => array(
					'values' => array(),
					'scope'  => 'site',
				),
				'postFrequency' => array(
					'values' => array( 'daily' ),
					'scope'  => 'user',
				),
				'goals'         => array(
					'values' => array( 'goal1', 'goal2' ),
					'scope'  => 'user',
				),
			),
			$this->user_input->get_answers()
		);

		// If all settings are set, it returns all set settings as expected.
		update_option(
			Site_Specific_Answers::OPTION,
			array(
				'purpose' => array(
					'values'     => array( 'purpose1' ),
					'scope'      => 'site',
					'answeredBy' => $this->user_id,
				),
			)
		);
		update_user_option(
			$this->user_id,
			User_Specific_Answers::OPTION,
			array(
				'postFrequency' => array(
					'values' => array( 'daily' ),
					'scope'  => 'user',
				),
				'goals'         => array(
					'values' => array( 'goal1', 'goal2' ),
					'scope'  => 'user',
				),
			)
		);
		$this->assertEquals(
			array(
				'purpose'       => array(
					'scope'      => 'site',
					'values'     => array( 'purpose1' ),
					'answeredBy' => $this->user_id,
				),
				'postFrequency' => array(
					'scope'  => 'user',
					'values' => array( 'daily' ),
				),
				'goals'         => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
			),
			$this->user_input->get_answers()
		);
	}

	public function test_set_answers() {
		$this->user_input->register();
		$response = $this->user_input->set_answers(
			array(
				'purpose'       => array( 'purpose1' ),
				'postFrequency' => array( 'daily' ),
				'goals'         => array( 'goal1', 'goal2' ),
			)
		);

		$this->assertEquals(
			array(
				'purpose'       => array(
					'scope'      => 'site',
					'values'     => array( 'purpose1' ),
					'answeredBy' => $this->user_id,
				),
				'postFrequency' => array(
					'scope'  => 'user',
					'values' => array( 'daily' ),
				),
				'goals'         => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
			),
			$response
		);
	}

	public function test_set_answers__preserves_purpose_answer_user_attribution() {
		$second_admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$this->user_input->set_answers(
			array(
				'purpose'       => array( 'publish_blog' ),
				'postFrequency' => array( 'daily' ),
				'goals'         => array( 'growing_audience', 'finding_new_topics' ),
			)
		);

		$existing_answers = $this->user_input->get_answers();

		$this->assertEquals( $existing_answers['purpose']['answeredBy'], $this->user_id );

		$this->user_options->switch_user( $second_admin_id );

		$answers = array(
			'purpose'       => array( 'publish_blog' ),
			'postFrequency' => array( 'weekly' ),
			'goals'         => array( 'improving_performance' ),
		);
		$this->user_input->set_answers( $answers );

		$existing_answers = $this->user_input->get_answers();
		// Since the "purpose" answer didn't change, it should still be attributed to admin 1.
		$this->assertEquals( $existing_answers['purpose']['answeredBy'], $this->user_id );
	}

	public function test_set_answers__assigns_correct_user_attribution_on_purpose_answer_change() {
		$second_admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$admin_1_answers = array(
			'purpose'       => array( 'publish_blog' ),
			'postFrequency' => array( 'daily' ),
			'goals'         => array( 'growing_audience', 'finding_new_topics' ),
		);
		$this->user_input->set_answers( $admin_1_answers );

		$existing_answers = $this->user_input->get_answers();

		$this->assertEquals( $existing_answers['purpose']['answeredBy'], $this->user_id );

		$this->user_options->switch_user( $second_admin_id );

		$admin_2_answers = array(
			'purpose'       => array( 'other' ),
			'postFrequency' => array( 'weekly' ),
			'goals'         => array( 'improving_performance' ),
		);
		$this->user_input->set_answers( $admin_2_answers );

		$existing_answers = $this->user_input->get_answers();
		// Since the "purpose" answer changed, it should be attributed to admin 2.
		$this->assertEquals( $existing_answers['purpose']['answeredBy'], $second_admin_id );
		// User specific answers should be properly added for admin 2.
		$this->assertEquals( $existing_answers['postFrequency']['values'], $admin_2_answers['postFrequency'] );
		$this->assertEquals( $existing_answers['goals']['values'], $admin_2_answers['goals'] );

		$this->user_options->switch_user( $this->user_id );
		$admin_1_answers = $this->user_input->get_answers();
		// Original answers done by admin 1 should remain unchanged.
		$this->assertNotEquals( $admin_1_answers['postFrequency']['values'], $admin_2_answers['postFrequency'] );
		$this->assertNotEquals( $admin_1_answers['goals']['values'], $admin_2_answers['goals'] );
	}

	public function test_set_answers__keep_original_attribution_when_no_answers_change() {
		$second_admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$answers = array(
			'purpose'       => array( 'publish_blog' ),
			'postFrequency' => array( 'weekly' ),
			'goals'         => array( 'improving_performance' ),
		);
		$this->user_input->set_answers( $answers );

		$this->user_options->switch_user( $second_admin_id );

		$this->user_input->set_answers( $answers );

		$existing_answers = $this->user_input->get_answers();
		// Since no answer changed, the "purpose" answer should still be attributed to admin 1.
		$this->assertEquals( $existing_answers['purpose']['answeredBy'], $this->user_id );
	}
}
