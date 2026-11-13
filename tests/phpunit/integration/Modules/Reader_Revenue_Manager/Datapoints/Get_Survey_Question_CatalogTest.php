<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_Survey_Question_CatalogTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Survey_Question_Catalog;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\AnswerChoiceTemplate;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\QuestionTemplate;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\SurveyQuestionCatalog;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_Survey_Question_CatalogTest extends TestCase {

	/**
	 * Get survey question catalog datapoint.
	 *
	 * @var Get_Survey_Question_Catalog
	 */
	private $datapoint;

	/**
	 * Reader Revenue Manager module.
	 *
	 * @var Reader_Revenue_Manager
	 */
	private $module;

	public function set_up() {
		parent::set_up();

		$this->enable_feature( 'rrmExpressSetup' );
		$this->enable_feature( 'rrmSurveyCTA' );

		$this->module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->module->get_settings()->register();
		$this->module->get_settings()->merge(
			array(
				'organizationID' => 'saved-organization',
				'publicationID'  => 'saved-publication',
			)
		);
		$this->module->get_client()->withDefer( true );

		$service         = new WebContentPublisher( $this->module->get_client() );
		$this->datapoint = new Get_Survey_Question_Catalog(
			array(
				'service'  => function () use ( $service ) {
					return $service;
				},
				'settings' => $this->module->get_settings(),
			)
		);
	}

	public function test_create_request() {
		$request = $this->datapoint->create_request( $this->get_data_request( array() ) );

		$this->assertSame(
			'https://webcontentpublisher.googleapis.com/v1/organizations/saved-organization/publications/saved-publication/surveyQuestionCatalog',
			(string) $request->getUri(),
			'The request should get the survey question catalog of the connected publication, without a language code.'
		);
	}

	public function test_create_request__ignores_request_identifiers() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
				)
			)
		);

		$this->assertSame(
			'https://webcontentpublisher.googleapis.com/v1/organizations/saved-organization/publications/saved-publication/surveyQuestionCatalog',
			(string) $request->getUri(),
			'Identifiers sent with the request should not be used.'
		);
	}

	/**
	 * @dataProvider data_missing_settings
	 *
	 * @param array  $settings Settings to save before the request.
	 * @param string $missing  Name of the setting expected to be reported as missing.
	 */
	public function test_create_request__requires_the_connected_publication( $settings, $missing ) {
		$this->module->get_settings()->merge( $settings );

		$this->expectException( Missing_Required_Setting_Exception::class );
		$this->expectExceptionMessage( "Required setting is missing: {$missing}." );

		$this->datapoint->create_request( $this->get_data_request( array() ) );
	}

	public function data_missing_settings() {
		return array(
			'nothing connected'  => array(
				array(
					'organizationID' => '',
					'publicationID'  => '',
				),
				'organizationID',
			),
			'no publication ID'  => array( array( 'publicationID' => '' ), 'publicationID' ),
			'no organization ID' => array( array( 'organizationID' => '' ), 'organizationID' ),
		);
	}

	public function test_parse_response() {
		$response = new SurveyQuestionCatalog();
		$response->setName( 'organizations/saved-organization/publications/saved-publication/surveyQuestionCatalog' );
		$response->setQuestions(
			array(
				$this->create_question(
					3,
					'Which topics interest you?',
					QuestionTemplate::CONFIGURATION_TYPE_CONFIGURABLE_CHOICES,
					array(
						12 => 'Sports',
						4  => 'Technology',
					)
				),
				$this->create_question(
					1,
					'What is your age range?',
					QuestionTemplate::CONFIGURATION_TYPE_FIXED_CHOICES,
					array(
						2 => '18-24',
						1 => '25-34',
					)
				),
				$this->create_question(
					7,
					'What is your employment status?',
					QuestionTemplate::CONFIGURATION_TYPE_QUESTION_CONFIGURATION_TYPE_UNSPECIFIED,
					array( 5 => 'Employed' )
				),
			)
		);

		$this->assertSame(
			array(
				'publicationID' => 'saved-publication',
				'questions'     => array(
					array(
						'id'                     => 3,
						'label'                  => 'Which topics interest you?',
						'answers'                => array(
							array(
								'id'    => 12,
								'label' => 'Sports',
							),
							array(
								'id'    => 4,
								'label' => 'Technology',
							),
						),
						'hasConfigurableAnswers' => true,
					),
					array(
						'id'                     => 1,
						'label'                  => 'What is your age range?',
						'answers'                => array(
							array(
								'id'    => 2,
								'label' => '18-24',
							),
							array(
								'id'    => 1,
								'label' => '25-34',
							),
						),
						'hasConfigurableAnswers' => false,
					),
					array(
						'id'                     => 7,
						'label'                  => 'What is your employment status?',
						'answers'                => array(
							array(
								'id'    => 5,
								'label' => 'Employed',
							),
						),
						'hasConfigurableAnswers' => false,
					),
				),
			),
			$this->datapoint->parse_response( $response, $this->get_data_request( array() ) ),
			'The response should keep the API order and integer IDs of questions and answers, and return only the catalog fields Site Kit uses.'
		);
	}

	public function test_parse_response__names_the_publication_when_there_are_no_questions() {
		$this->assertSame(
			array(
				'publicationID' => 'saved-publication',
				'questions'     => array(),
			),
			$this->datapoint->parse_response( new SurveyQuestionCatalog(), $this->get_data_request( array() ) ),
			'An empty catalog should still name the publication it is for.'
		);
	}

	private function create_question( $id, $display_text, $configuration_type, array $answers ) {
		$answer_choices = array();

		foreach ( $answers as $answer_id => $answer_text ) {
			$answer = new AnswerChoiceTemplate();
			$answer->setId( $answer_id );
			$answer->setDisplayText( $answer_text );
			$answer->setCategory( 'INTEREST__AUTOMOTIVE' );
			$answer->setCategoryLabel( 'Automotive' );

			$answer_choices[] = $answer;
		}

		$question = new QuestionTemplate();
		$question->setId( $id );
		$question->setDisplayText( $display_text );
		$question->setConfigurationType( $configuration_type );
		$question->setCategory( QuestionTemplate::CATEGORY_INTEREST );
		$question->setCategoryLabel( 'Interest' );
		$question->setAnswerChoices( $answer_choices );

		return $question;
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'survey-question-catalog', $data );
	}
}
