<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA\Survey_CTA_Type_HandlerTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA;

use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\Survey_CTA_Type_Handler;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Survey_CTA_Type_HandlerTest extends TestCase {

	/**
	 * Survey CTA type handler.
	 *
	 * @var Survey_CTA_Type_Handler
	 */
	private $handler;

	public function set_up() {
		parent::set_up();

		$this->handler = new Survey_CTA_Type_Handler();
	}

	public function test_configure_cta__applies_preset_questions() {
		$config = array(
			'customMessage' => 'Help us learn more about you',
			'questions'     => array(
				array(
					'presetQuestion' => array(
						'questionId' => 3,
						'answerIds'  => array( 12, 10, 11 ),
					),
				),
				array( 'presetQuestion' => array( 'questionId' => 1 ) ),
			),
		);

		$cta = new Cta();

		$this->handler->configure_cta( $cta, $config );

		$this->assertSame( 'SURVEY', $cta->getType(), 'The CTA type should be set to survey.' );
		$this->assertEquals(
			$config,
			$this->get_survey_config( $cta ),
			'Preset questions should be applied with their answer IDs in order, omitting answer IDs that are not provided.'
		);
	}

	public function test_configure_cta__applies_custom_questions() {
		$config = array(
			'questions' => array(
				array(
					'customQuestion' => array(
						'displayText'   => 'How often do you read our articles?',
						'categoryLabel' => 'Reading frequency',
						'answerChoices' => array(
							array( 'displayText' => 'Weekly' ),
							array( 'displayText' => 'Daily' ),
							array( 'displayText' => 'Monthly' ),
						),
					),
				),
				array(
					'customQuestion' => array(
						'answerChoices' => array(
							array( 'displayText' => 'Yes' ),
							array( 'displayText' => 'No' ),
						),
					),
				),
			),
		);

		$cta = new Cta();

		$this->handler->configure_cta( $cta, $config );

		$this->assertEquals(
			$config,
			$this->get_survey_config( $cta ),
			'Custom questions should be applied with their answer choices in order, omitting optional fields that are not provided.'
		);
	}

	public function test_configure_cta__preserves_the_order_of_mixed_questions() {
		$config = array(
			'questions' => array(
				array(
					'customQuestion' => array(
						'displayText'   => 'Which section do you read most?',
						'answerChoices' => array(
							array( 'displayText' => 'News' ),
							array( 'displayText' => 'Sport' ),
						),
					),
				),
				array( 'presetQuestion' => array( 'questionId' => 2 ) ),
				array(
					'customQuestion' => array(
						'displayText'   => 'Would you recommend us?',
						'answerChoices' => array(
							array( 'displayText' => 'Yes' ),
							array( 'displayText' => 'No' ),
						),
					),
				),
			),
		);

		$cta = new Cta();

		$this->handler->configure_cta( $cta, $config );

		$this->assertEquals(
			$config,
			$this->get_survey_config( $cta ),
			'Preset and custom questions should keep the order they were given in.'
		);
	}

	public function test_configure_cta__allows_empty_questions_for_drafts() {
		$cta = new Cta();

		$this->handler->configure_cta( $cta, array( 'questions' => array() ) );

		$this->assertSame(
			array( 'questions' => array() ),
			$this->get_survey_config( $cta ),
			'An empty question list should be applied, with the custom message left unset.'
		);
	}

	/**
	 * @dataProvider data_invalid_config
	 *
	 * @param array  $config Invalid survey configuration.
	 * @param string $param  Name of the parameter expected to be reported as invalid.
	 */
	public function test_configure_cta__rejects_invalid_config( $config, $param ) {
		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( "Invalid parameter: {$param}." );

		$this->handler->configure_cta( new Cta(), $config );
	}

	public function data_invalid_config() {
		$preset_question = array( 'presetQuestion' => array( 'questionId' => 1 ) );
		$custom_question = array(
			'customQuestion' => array(
				'displayText'   => 'Would you recommend us?',
				'answerChoices' => array( array( 'displayText' => 'Yes' ) ),
			),
		);

		$with_question = function ( array $question ) {
			return array( 'questions' => array( $question ) );
		};

		$with_custom_question = function ( array $fields ) use ( $with_question ) {
			return $with_question( array( 'customQuestion' => $fields ) );
		};

		return array(
			'unsupported config field'               => array(
				array(
					'questions'      => array(),
					'unknownSetting' => 'value',
				),
				'config',
			),
			'response-only report URL'               => array(
				array(
					'questions' => array(),
					'reportUrl' => 'https://lookerstudio.google.com/reporting/1',
				),
				'config',
			),
			'non-string custom message'              => array(
				array(
					'customMessage' => 123,
					'questions'     => array(),
				),
				'config.customMessage',
			),
			'missing questions'                      => array(
				array( 'customMessage' => 'Help us learn more about you' ),
				'config.questions',
			),
			'non-array questions'                    => array(
				array( 'questions' => 'not-an-array' ),
				'config.questions',
			),
			'keyed questions'                        => array(
				array( 'questions' => array( 'first' => $preset_question ) ),
				'config.questions',
			),
			'non-array question'                     => array(
				array( 'questions' => array( 'not-an-array' ) ),
				'config.questions[0]',
			),
			'question without a variant'             => array(
				array( 'questions' => array( $preset_question, array() ) ),
				'config.questions[1]',
			),
			'question with both variants'            => array(
				$with_question( array_merge( $preset_question, $custom_question ) ),
				'config.questions[0]',
			),
			'unsupported question field'             => array(
				$with_question( array_merge( $preset_question, array( 'id' => 'question-1' ) ) ),
				'config.questions[0]',
			),
			'non-array preset question'              => array(
				$with_question( array( 'presetQuestion' => 1 ) ),
				'config.questions[0].presetQuestion',
			),
			'unsupported preset question field'      => array(
				$with_question(
					array(
						'presetQuestion' => array(
							'questionId'  => 1,
							'displayText' => 'How old are you?',
						),
					)
				),
				'config.questions[0].presetQuestion',
			),
			'missing preset question ID'             => array(
				$with_question( array( 'presetQuestion' => array( 'answerIds' => array( 1, 2 ) ) ) ),
				'config.questions[0].presetQuestion.questionId',
			),
			'non-integer preset question ID'         => array(
				$with_question( array( 'presetQuestion' => array( 'questionId' => '1' ) ) ),
				'config.questions[0].presetQuestion.questionId',
			),
			'non-array preset answer IDs'            => array(
				$with_question(
					array(
						'presetQuestion' => array(
							'questionId' => 1,
							'answerIds'  => 2,
						),
					)
				),
				'config.questions[0].presetQuestion.answerIds',
			),
			'non-integer preset answer ID'           => array(
				$with_question(
					array(
						'presetQuestion' => array(
							'questionId' => 1,
							'answerIds'  => array( 1, '2' ),
						),
					)
				),
				'config.questions[0].presetQuestion.answerIds',
			),
			'response-only custom question ID'       => array(
				$with_custom_question(
					array(
						'id'            => 'custom-question-1',
						'answerChoices' => array( array( 'displayText' => 'Yes' ) ),
					)
				),
				'config.questions[0].customQuestion',
			),
			'non-string custom question text'        => array(
				$with_custom_question(
					array(
						'displayText'   => 123,
						'answerChoices' => array( array( 'displayText' => 'Yes' ) ),
					)
				),
				'config.questions[0].customQuestion.displayText',
			),
			'non-string custom question category'    => array(
				$with_custom_question(
					array(
						'categoryLabel' => 123,
						'answerChoices' => array( array( 'displayText' => 'Yes' ) ),
					)
				),
				'config.questions[0].customQuestion.categoryLabel',
			),
			'missing custom answer choices'          => array(
				$with_custom_question( array( 'displayText' => 'Would you recommend us?' ) ),
				'config.questions[0].customQuestion.answerChoices',
			),
			'non-array custom answer choices'        => array(
				$with_custom_question( array( 'answerChoices' => 'Yes' ) ),
				'config.questions[0].customQuestion.answerChoices',
			),
			'non-array custom answer choice'         => array(
				$with_custom_question( array( 'answerChoices' => array( 'Yes' ) ) ),
				'config.questions[0].customQuestion.answerChoices[0]',
			),
			'unsupported custom answer choice field' => array(
				$with_custom_question(
					array(
						'answerChoices' => array(
							array(
								'displayText' => 'Yes',
								'id'          => 1,
							),
						),
					)
				),
				'config.questions[0].customQuestion.answerChoices[0]',
			),
			'missing custom answer choice text'      => array(
				$with_custom_question(
					array( 'answerChoices' => array( array( 'displayText' => 'Yes' ), array() ) )
				),
				'config.questions[0].customQuestion.answerChoices[1].displayText',
			),
			'non-string custom answer choice text'   => array(
				$with_custom_question( array( 'answerChoices' => array( array( 'displayText' => 123 ) ) ) ),
				'config.questions[0].customQuestion.answerChoices[0].displayText',
			),
		);
	}

	/**
	 * Gets the survey configuration of a CTA model as the API request would serialize it.
	 *
	 * @param Cta $cta CTA model.
	 * @return array Survey configuration.
	 */
	private function get_survey_config( Cta $cta ) {
		return json_decode( wp_json_encode( $cta->getSurveyConfig()->toSimpleObject() ), true );
	}
}
