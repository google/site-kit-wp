<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Survey_Question_Catalog
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\AnswerChoiceTemplate;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\QuestionTemplate;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\SurveyQuestionCatalog;

/**
 * Class for the survey question catalog retrieval datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Survey_Question_Catalog extends Connected_Publication_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * No language code is sent, so the API uses the publication's own language.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 */
	public function create_request( Data_Request $data_request ) {
		$publication = $this->get_connected_publication();

		$name = sprintf(
			'organizations/%s/publications/%s/surveyQuestionCatalog',
			$publication['organizationID'],
			$publication['publicationID']
		);

		return $this->get_service()->organizations_publications->getSurveyQuestionCatalog( $name );
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param SurveyQuestionCatalog $response Survey question catalog response.
	 * @param Data_Request          $data     Data request object.
	 * @return array {
	 *     Connected publication survey question catalog.
	 *
	 *     @type string $publicationID Publication the catalog belongs to.
	 *     @type array  $questions     Catalog questions, in API order.
	 * }
	 */
	public function parse_response( $response, Data_Request $data ) {
		$publication = $this->get_connected_publication();

		$questions = array_map(
			array( $this, 'parse_question' ),
			array_values(
				array_filter(
					(array) $response->getQuestions(),
					function ( $question ) {
						return $question instanceof QuestionTemplate;
					}
				)
			)
		);

		return array(
			'publicationID' => $publication['publicationID'],
			'questions'     => $questions,
		);
	}

	/**
	 * Parses a catalog question.
	 *
	 * @since n.e.x.t
	 *
	 * @param QuestionTemplate $question Catalog question.
	 * @return array {
	 *     Catalog question.
	 *
	 *     @type int    $id                     Question identifier in the catalog.
	 *     @type string $label                  Question text.
	 *     @type array  $answers                Answers, each with `id` and `label`, in API order.
	 *     @type bool   $hasConfigurableAnswers Whether the publisher chooses which answers to offer.
	 * }
	 */
	private function parse_question( QuestionTemplate $question ) {
		$answers = array_map(
			function ( AnswerChoiceTemplate $answer ) {
				return array(
					'id'    => (int) $answer->getId(),
					'label' => (string) $answer->getDisplayText(),
				);
			},
			array_values(
				array_filter(
					(array) $question->getAnswerChoices(),
					function ( $answer ) {
						return $answer instanceof AnswerChoiceTemplate;
					}
				)
			)
		);

		return array(
			'id'                     => (int) $question->getId(),
			'label'                  => (string) $question->getDisplayText(),
			'answers'                => $answers,
			'hasConfigurableAnswers' => QuestionTemplate::CONFIGURATION_TYPE_CONFIGURABLE_CHOICES === $question->getConfigurationType(),
		);
	}
}
