<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Update_CTATest
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Update_CTA;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Update_CTATest extends TestCase {

	const CTA_URL = 'https://webcontentpublisher.googleapis.com/v1/organizations/organization-1/publications/publication-1/ctas/cta-1';

	/**
	 * Update CTA datapoint.
	 *
	 * @var Update_CTA
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

		$this->module = new Reader_Revenue_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->module->get_settings()->register();
		$this->module->get_client()->withDefer( true );

		$service         = new WebContentPublisher( $this->module->get_client() );
		$this->datapoint = new Update_CTA(
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
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'ctaID'          => 'cta-1',
					'data'           => array(
						'displayName' => 'Weekly newsletter',
						'state'       => 'ACTIVE',
						'type'        => 'NEWSLETTER_SIGNUP',
						'config'      => array(
							'title'        => 'Subscribe to our newsletter',
							'nameRequired' => true,
						),
					),
				)
			)
		);

		$this->assertSame( 'PATCH', $request->getMethod(), 'The request should patch the CTA.' );

		$this->assertSame(
			self::CTA_URL . '?updateMask=displayName%2Cstate%2CnewsletterConfig',
			(string) $request->getUri(),
			'The request should update the CTA on the connected publication, masking every given field.'
		);

		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'displayName'      => 'Weekly newsletter',
					'newsletterConfig' => array(
						'title'        => 'Subscribe to our newsletter',
						'nameRequired' => true,
					),
					'state'            => 'ACTIVE',
					'type'             => 'NEWSLETTER_SIGNUP',
				)
			),
			(string) $request->getBody(),
			'The request body should map the config through the CTA type handler.'
		);
	}

	/**
	 * @dataProvider data_partial_updates
	 *
	 * @param array  $cta_data CTA data to send.
	 * @param string $mask     Expected update mask.
	 * @param array  $body     Expected request body.
	 */
	public function test_create_request__masks_only_given_fields( $cta_data, $mask, $body ) {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'ctaID'          => 'cta-1',
					'data'           => $cta_data,
				)
			)
		);

		$query = array();
		parse_str( (string) $request->getUri()->getQuery(), $query );

		$this->assertSame( $mask, $query['updateMask'], 'The update mask should only name the given fields.' );

		$this->assertJsonStringEqualsJsonString(
			wp_json_encode( $body ),
			(string) $request->getBody(),
			'The request body should only hold the given fields.'
		);
	}

	public function data_partial_updates() {
		return array(
			'display name only'              => array(
				array( 'displayName' => 'Renamed' ),
				'displayName',
				array( 'displayName' => 'Renamed' ),
			),
			'empty display name'             => array(
				array( 'displayName' => '' ),
				'displayName',
				array( 'displayName' => '' ),
			),
			'state only'                     => array(
				array( 'state' => 'DRAFT' ),
				'state',
				array( 'state' => 'DRAFT' ),
			),
			'config only'                    => array(
				array(
					'type'   => 'NEWSLETTER_SIGNUP',
					'config' => array( 'title' => 'Subscribe' ),
				),
				'newsletterConfig',
				array(
					'newsletterConfig' => array( 'title' => 'Subscribe' ),
					'type'             => 'NEWSLETTER_SIGNUP',
				),
			),
			'display name and state'         => array(
				array(
					'displayName' => 'Renamed',
					'state'       => 'ACTIVE',
				),
				'displayName,state',
				array(
					'displayName' => 'Renamed',
					'state'       => 'ACTIVE',
				),
			),
			'unsupported fields are ignored' => array(
				array(
					'state' => 'ACTIVE',
					'name'  => 'organizations/other/publications/other/ctas/other',
				),
				'state',
				array( 'state' => 'ACTIVE' ),
			),
		);
	}

	public function test_create_request__updates_survey_config() {
		$this->enable_feature( 'rrmSurveyCTA' );

		$survey_config = array(
			'customMessage' => 'Help us learn more about you',
			'questions'     => array(
				array(
					'presetQuestion' => array(
						'questionId' => 3,
						'answerIds'  => array( 12, 10 ),
					),
				),
				array(
					'customQuestion' => array(
						'displayText'   => 'Which section do you read most?',
						'answerChoices' => array(
							array( 'displayText' => 'Sport' ),
							array( 'displayText' => 'News' ),
						),
					),
				),
			),
		);

		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'ctaID'          => 'cta-1',
					'data'           => array(
						'displayName' => 'Reader survey',
						'state'       => 'DRAFT',
						'type'        => 'SURVEY',
						'config'      => $survey_config,
					),
				)
			)
		);

		$this->assertSame(
			self::CTA_URL . '?updateMask=displayName%2Cstate%2CsurveyConfig',
			(string) $request->getUri(),
			'The update mask should name the survey configuration field.'
		);

		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'displayName'  => 'Reader survey',
					'state'        => 'DRAFT',
					'surveyConfig' => $survey_config,
					'type'         => 'SURVEY',
				)
			),
			(string) $request->getBody(),
			'The request body should hold the complete survey configuration, with the questions in order.'
		);
	}

	public function test_create_request__rejects_survey_when_feature_flag_disabled() {
		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( 'Invalid parameter: data.type.' );

		$this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'ctaID'          => 'cta-1',
					'data'           => array(
						'type'   => 'SURVEY',
						'config' => array( 'questions' => array() ),
					),
				)
			)
		);
	}

	/**
	 * @dataProvider data_missing_params
	 *
	 * @param string $param Name of the parameter to leave out.
	 */
	public function test_create_request__requires_params( $param ) {
		$data = $this->get_valid_data();
		unset( $data[ $param ] );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( "Request parameter is empty: {$param}." );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function data_missing_params() {
		return array(
			'organizationID' => array( 'organizationID' ),
			'publicationID'  => array( 'publicationID' ),
			'ctaID'          => array( 'ctaID' ),
			'data'           => array( 'data' ),
		);
	}

	/**
	 * @dataProvider data_publication_params
	 *
	 * @param string $invalid Name of the identifier given a non-string value.
	 */
	public function test_create_request__rejects_a_non_string_publication_param( $invalid ) {
		$data = $this->get_valid_data();

		$data[ $invalid ] = array( 'not-a-string' );

		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( "Invalid parameter: {$invalid}." );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function data_publication_params() {
		return array(
			'organizationID' => array( 'organizationID' ),
			'publicationID'  => array( 'publicationID' ),
		);
	}

	/**
	 * @dataProvider data_invalid_params
	 *
	 * @param array  $params Request parameters.
	 * @param string $param  Name of the parameter expected to be reported as invalid.
	 */
	public function test_create_request__rejects_invalid_params( $params, $param ) {
		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( "Invalid parameter: {$param}." );

		$this->datapoint->create_request( $this->get_data_request( $params ) );
	}

	public function data_invalid_params() {
		$params = function ( $cta_data ) {
			return array(
				'organizationID' => 'organization-1',
				'publicationID'  => 'publication-1',
				'ctaID'          => 'cta-1',
				'data'           => $cta_data,
			);
		};

		return array(
			'non-string CTA ID'        => array(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'ctaID'          => array( 'cta-1' ),
					'data'           => array( 'state' => 'ACTIVE' ),
				),
				'ctaID',
			),
			'CTA ID with a path'       => array(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'ctaID'          => '../cta-1',
					'data'           => array( 'state' => 'ACTIVE' ),
				),
				'ctaID',
			),
			'non-array data'           => array( $params( 'not-an-array' ), 'data' ),
			'no supported fields'      => array( $params( array( 'name' => 'cta-2' ) ), 'data' ),
			'type without config'      => array( $params( array( 'type' => 'NEWSLETTER_SIGNUP' ) ), 'data' ),
			'non-string display name'  => array( $params( array( 'displayName' => 123 ) ), 'data.displayName' ),
			'unsupported state'        => array( $params( array( 'state' => 'ENABLED' ) ), 'data.state' ),
			'non-string state'         => array( $params( array( 'state' => 123 ) ), 'data.state' ),
			'config without type'      => array( $params( array( 'config' => array( 'title' => 'Subscribe' ) ) ), 'data.type' ),
			'unsupported type'         => array(
				$params(
					array(
						'type'   => 'SUBSCRIPTION',
						'config' => array( 'title' => 'Subscribe' ),
					)
				),
				'data.type',
			),
			'non-array config'         => array(
				$params(
					array(
						'type'   => 'NEWSLETTER_SIGNUP',
						'config' => 'not-an-array',
					)
				),
				'data.config',
			),
			'unsupported config field' => array(
				$params(
					array(
						'type'   => 'NEWSLETTER_SIGNUP',
						'config' => array( 'unknownSetting' => 'value' ),
					)
				),
				'config',
			),
			'invalid alongside valid'  => array(
				$params(
					array(
						'displayName' => 'Renamed',
						'state'       => 'ENABLED',
					)
				),
				'data.state',
			),
		);
	}

	public function test_parse_response() {
		$response = new Cta();
		$response->setName( 'organizations/saved-organization/publications/saved-publication/ctas/cta-1' );
		$response->setDisplayName( 'Renamed' );

		$cta = $this->datapoint->parse_response( $response, $this->get_data_request( $this->get_valid_data() ) );

		$this->assertSame( $response, $cta, 'The updated CTA resource should be returned unchanged.' );
	}

	private function get_valid_data() {
		return array(
			'organizationID' => 'organization-1',
			'publicationID'  => 'publication-1',
			'ctaID'          => 'cta-1',
			'data'           => array( 'state' => 'ACTIVE' ),
		);
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'POST', 'modules', 'reader-revenue-manager', 'cta', $data );
	}
}
