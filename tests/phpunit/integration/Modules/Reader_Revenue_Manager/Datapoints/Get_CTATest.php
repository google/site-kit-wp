<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_CTATest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_CTA;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\NewsletterConfig;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\SurveyConfig;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_CTATest extends TestCase {

	/**
	 * Get CTA datapoint.
	 *
	 * @var Get_CTA
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$this->enable_feature( 'rrmExpressSetup' );

		$module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->get_client()->withDefer( true );

		$service         = new WebContentPublisher( $module->get_client() );
		$this->datapoint = new Get_CTA(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);
	}

	public function test_create_request() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-2',
					'publicationID'  => 'publication-2',
					'ctaID'          => 'cta-1',
				)
			)
		);

		$this->assertSame( 'GET', $request->getMethod(), 'The request should use the GET method.' );
		$this->assertSame(
			'https://webcontentpublisher.googleapis.com/v1/organizations/organization-2/publications/publication-2/ctas/cta-1',
			(string) $request->getUri(),
			'The request should get the CTA from the publication named in the request.'
		);
	}

	/**
	 * @dataProvider data_params
	 *
	 * @param string $missing Name of the identifier left out of the request.
	 */
	public function test_create_request__requires_the_params( $missing ) {
		$data = $this->get_params();

		unset( $data[ $missing ] );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( "Request parameter is empty: {$missing}." );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	/**
	 * @dataProvider data_params
	 *
	 * @param string $invalid Name of the identifier given a non-string value.
	 */
	public function test_create_request__rejects_a_non_string_param( $invalid ) {
		$data = $this->get_params();

		$data[ $invalid ] = array( 'not-a-string' );

		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( "Invalid parameter: {$invalid}." );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function data_params() {
		return array(
			'organizationID' => array( 'organizationID' ),
			'publicationID'  => array( 'publicationID' ),
			'ctaID'          => array( 'ctaID' ),
		);
	}

	public function test_parse_response__returns_a_newsletter_signup_cta() {
		$newsletter_config = array(
			'title'         => 'Sign up for our newsletter',
			'customMessage' => 'Get the latest news',
			'nameRequired'  => true,
			'optInRequired' => false,
		);

		$cta = new Cta();
		$cta->setName( 'organizations/organization-1/publications/publication-1/ctas/newsletter-cta' );
		$cta->setType( Cta::TYPE_NEWSLETTER_SIGNUP );
		$cta->setState( Cta::STATE_ACTIVE );
		$cta->setDisplayName( 'Newsletter' );
		$cta->setNewsletterConfig( new NewsletterConfig( $newsletter_config ) );

		$this->assertEquals(
			array(
				'name'             => 'organizations/organization-1/publications/publication-1/ctas/newsletter-cta',
				'type'             => Cta::TYPE_NEWSLETTER_SIGNUP,
				'state'            => Cta::STATE_ACTIVE,
				'displayName'      => 'Newsletter',
				'newsletterConfig' => $newsletter_config,
			),
			$this->to_array( $this->datapoint->parse_response( $cta, $this->get_data_request( $this->get_params() ) ) ),
			'The newsletter sign-up CTA should be returned with its fields and configuration.'
		);
	}

	public function test_parse_response__returns_a_survey_cta() {
		$survey_config = array(
			'customMessage' => 'Help us learn more about you',
			'questions'     => array(
				array(
					'customQuestion' => array(
						'id'            => 'custom-question-1',
						'displayText'   => 'Which section do you read most?',
						'answerChoices' => array(
							array( 'displayText' => 'News' ),
							array( 'displayText' => 'Sport' ),
						),
					),
				),
				array( 'presetQuestion' => array( 'questionId' => 3 ) ),
			),
		);

		$cta = new Cta();
		$cta->setName( 'organizations/organization-1/publications/publication-1/ctas/survey-cta' );
		$cta->setType( Cta::TYPE_SURVEY );
		$cta->setState( Cta::STATE_DRAFT );
		$cta->setDisplayName( 'Reader survey' );
		$cta->setSurveyConfig( new SurveyConfig( $survey_config ) );

		$this->assertEquals(
			array(
				'name'         => 'organizations/organization-1/publications/publication-1/ctas/survey-cta',
				'type'         => Cta::TYPE_SURVEY,
				'state'        => Cta::STATE_DRAFT,
				'displayName'  => 'Reader survey',
				'surveyConfig' => $survey_config,
			),
			$this->to_array( $this->datapoint->parse_response( $cta, $this->get_data_request( $this->get_params() ) ) ),
			'The survey CTA should be returned with its fields and its questions in order.'
		);
	}

	private function get_params() {
		return array(
			'organizationID' => 'organization-1',
			'publicationID'  => 'publication-1',
			'ctaID'          => 'cta-1',
		);
	}

	private function to_array( $cta ) {
		return json_decode( wp_json_encode( $cta->toSimpleObject() ), true );
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'cta', $data );
	}
}
