<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\Survey_CTA_Type_Handler
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA;

use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\CustomAnswerChoice;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\CustomQuestion;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\PresetQuestion;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\SurveyConfig;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\SurveyQuestion;

/**
 * Configures survey CTA models.
 *
 * Only the shape of the configuration is validated here. Limits that depend
 * on the CTA state or the question catalog, such as the number of questions
 * and answers, are left to the API.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Survey_CTA_Type_Handler implements CTA_Type_Handler_Interface {

	/**
	 * Gets the CTA type handled by this instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return string CTA type.
	 */
	public function get_type() {
		return Cta::TYPE_SURVEY;
	}

	/**
	 * Validates and applies survey configuration to a CTA model.
	 *
	 * @since n.e.x.t
	 *
	 * @param Cta   $cta    CTA model.
	 * @param array $config Survey configuration.
	 * @throws Invalid_Param_Exception Thrown if the configuration contains unsupported fields or invalid values.
	 */
	public function configure_cta( Cta $cta, array $config ) {
		$this->validate_fields( $config, 'config', array( 'customMessage', 'questions' ) );

		$survey_config = new SurveyConfig();

		if ( array_key_exists( 'customMessage', $config ) ) {
			$this->validate_string( $config['customMessage'], 'config.customMessage' );

			$survey_config->setCustomMessage( $config['customMessage'] );
		}

		if ( ! isset( $config['questions'] ) || ! is_array( $config['questions'] ) || ! BC_Functions::array_is_list( $config['questions'] ) ) {
			throw new Invalid_Param_Exception( 'config.questions' );
		}

		$questions = array();

		foreach ( $config['questions'] as $index => $question ) {
			$questions[] = $this->build_question( $question, "config.questions[{$index}]" );
		}

		$survey_config->setQuestions( $questions );

		$cta->setType( $this->get_type() );
		$cta->setSurveyConfig( $survey_config );
	}

	/**
	 * Validates a survey question and builds its model.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed  $question Survey question.
	 * @param string $path     Path of the question in the configuration, for the error.
	 * @return SurveyQuestion Survey question model.
	 * @throws Invalid_Param_Exception Thrown if the question is invalid.
	 */
	private function build_question( $question, $path ) {
		$this->validate_fields( $question, $path, array( 'presetQuestion', 'customQuestion' ) );

		// A question is exactly one of a preset question or a custom question.
		if ( 1 !== count( $question ) ) {
			throw new Invalid_Param_Exception( $path ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
		}

		$survey_question = new SurveyQuestion();

		if ( array_key_exists( 'presetQuestion', $question ) ) {
			$survey_question->setPresetQuestion(
				$this->build_preset_question( $question['presetQuestion'], "{$path}.presetQuestion" )
			);
		} else {
			$survey_question->setCustomQuestion(
				$this->build_custom_question( $question['customQuestion'], "{$path}.customQuestion" )
			);
		}

		return $survey_question;
	}

	/**
	 * Validates a preset question and builds its model.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed  $question Preset question.
	 * @param string $path     Path of the question in the configuration, for the error.
	 * @return PresetQuestion Preset question model.
	 * @throws Invalid_Param_Exception Thrown if the question is invalid.
	 */
	private function build_preset_question( $question, $path ) {
		$this->validate_fields( $question, $path, array( 'questionId', 'answerIds' ) );

		if ( ! isset( $question['questionId'] ) || ! is_int( $question['questionId'] ) ) {
			throw new Invalid_Param_Exception( "{$path}.questionId" ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
		}

		$preset_question = new PresetQuestion();
		$preset_question->setQuestionId( $question['questionId'] );

		if ( array_key_exists( 'answerIds', $question ) ) {
			$answer_ids = $question['answerIds'];

			if ( ! is_array( $answer_ids ) || ! BC_Functions::array_is_list( $answer_ids ) || array_filter( $answer_ids, 'is_int' ) !== $answer_ids ) {
				throw new Invalid_Param_Exception( "{$path}.answerIds" ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
			}

			$preset_question->setAnswerIds( $answer_ids );
		}

		return $preset_question;
	}

	/**
	 * Validates a custom question and builds its model.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed  $question Custom question.
	 * @param string $path     Path of the question in the configuration, for the error.
	 * @return CustomQuestion Custom question model.
	 * @throws Invalid_Param_Exception Thrown if the question is invalid.
	 */
	private function build_custom_question( $question, $path ) {
		$this->validate_fields( $question, $path, array( 'displayText', 'categoryLabel', 'answerChoices' ) );

		$custom_question = new CustomQuestion();

		if ( array_key_exists( 'displayText', $question ) ) {
			$this->validate_string( $question['displayText'], "{$path}.displayText" );

			$custom_question->setDisplayText( $question['displayText'] );
		}

		if ( array_key_exists( 'categoryLabel', $question ) ) {
			$this->validate_string( $question['categoryLabel'], "{$path}.categoryLabel" );

			$custom_question->setCategoryLabel( $question['categoryLabel'] );
		}

		if ( ! isset( $question['answerChoices'] ) || ! is_array( $question['answerChoices'] ) || ! BC_Functions::array_is_list( $question['answerChoices'] ) ) {
			throw new Invalid_Param_Exception( "{$path}.answerChoices" ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
		}

		$answer_choices = array();

		foreach ( $question['answerChoices'] as $index => $answer_choice ) {
			$answer_choice_path = "{$path}.answerChoices[{$index}]";

			$this->validate_fields( $answer_choice, $answer_choice_path, array( 'displayText' ) );

			if ( ! isset( $answer_choice['displayText'] ) ) {
				throw new Invalid_Param_Exception( "{$answer_choice_path}.displayText" ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
			}

			$this->validate_string( $answer_choice['displayText'], "{$answer_choice_path}.displayText" );

			$custom_answer_choice = new CustomAnswerChoice();
			$custom_answer_choice->setDisplayText( $answer_choice['displayText'] );

			$answer_choices[] = $custom_answer_choice;
		}

		$custom_question->setAnswerChoices( $answer_choices );

		return $custom_question;
	}

	/**
	 * Validates that a value is an array with only supported fields.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed    $value            Value to validate.
	 * @param string   $path             Path of the value in the configuration, for the error.
	 * @param string[] $supported_fields Fields the array may contain.
	 * @throws Invalid_Param_Exception Thrown if the value is not an array, or contains unsupported fields.
	 */
	private function validate_fields( $value, $path, array $supported_fields ) {
		if ( ! is_array( $value ) || ! empty( array_diff( array_keys( $value ), $supported_fields ) ) ) {
			throw new Invalid_Param_Exception( $path ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
		}
	}

	/**
	 * Validates that a value is a string.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed  $value Value to validate.
	 * @param string $path  Path of the value in the configuration, for the error.
	 * @throws Invalid_Param_Exception Thrown if the value is not a string.
	 */
	private function validate_string( $value, $path ) {
		if ( ! is_string( $value ) ) {
			throw new Invalid_Param_Exception( $path ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
		}
	}
}
