<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Create_CTATest
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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Create_CTA;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Create_CTATest extends TestCase {

	/**
	 * Create CTA datapoint.
	 *
	 * @var Create_CTA
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

		$service         = new Webcontentpublisher( $this->module->get_client() );
		$this->datapoint = new Create_CTA(
			array(
				'service'  => function () use ( $service ) {
					return $service;
				},
				'settings' => $this->module->get_settings(),
			)
		);
	}

	public function test_create_request() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'data'           => array(
						'type'        => 'NEWSLETTER_SIGNUP',
						'displayName' => 'Newsletter sign-up',
						'config'      => array(
							'title'         => 'Subscribe to our newsletter',
							'customMessage' => 'Join our mailing list.',
						),
					),
				)
			)
		);

		$this->assertSame(
			'https://webcontentpublisher.googleapis.com/v1/organizations/organization-1/publications/publication-1/ctas',
			(string) $request->getUri(),
			'The request should use the create CTA endpoint for the publication.'
		);

		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'displayName'      => 'Newsletter sign-up',
					'newsletterConfig' => array(
						'title'         => 'Subscribe to our newsletter',
						'customMessage' => 'Join our mailing list.',
					),
					'type'             => 'NEWSLETTER_SIGNUP',
				)
			),
			(string) $request->getBody(),
			'The request body should map the config through the CTA type handler.'
		);
	}

	public function test_create_request__falls_back_to_saved_settings() {
		$this->module->get_settings()->merge(
			array(
				'organizationID' => 'saved-organization',
				'publicationID'  => 'saved-publication',
			)
		);

		$data = $this->get_valid_data();
		unset( $data['organizationID'], $data['publicationID'] );

		$request = $this->datapoint->create_request( $this->get_data_request( $data ) );

		$this->assertSame(
			'https://webcontentpublisher.googleapis.com/v1/organizations/saved-organization/publications/saved-publication/ctas',
			(string) $request->getUri(),
			'The request should fall back to the saved organization and publication IDs.'
		);
	}

	public function test_create_request__omits_display_name_when_absent() {
		$request = $this->datapoint->create_request( $this->get_data_request( $this->get_valid_data() ) );

		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'newsletterConfig' => array( 'title' => 'Subscribe' ),
					'type'             => 'NEWSLETTER_SIGNUP',
				)
			),
			(string) $request->getBody(),
			'The request body should omit the display name when it is not provided.'
		);
	}

	public function test_create_request__requires_data() {
		$data = $this->get_valid_data();
		unset( $data['data'] );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: data.' );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	/**
	 * @dataProvider data_missing_settings
	 *
	 * @param array  $settings Settings to save before the request.
	 * @param string $missing  Name of the setting expected to be reported as missing.
	 */
	public function test_create_request__requires_settings( $settings, $missing ) {
		$this->module->get_settings()->merge( $settings );

		$data = $this->get_valid_data();
		unset( $data['organizationID'], $data['publicationID'] );

		$this->expectException( Missing_Required_Setting_Exception::class );
		$this->expectExceptionMessage( "Required setting is missing: {$missing}." );

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function data_missing_settings() {
		return array(
			'no settings saved'    => array( array(), 'organizationID' ),
			'only organization ID' => array( array( 'organizationID' => 'organization-1' ), 'publicationID' ),
		);
	}

	/**
	 * @dataProvider data_invalid_cta_data
	 *
	 * @param mixed  $cta_data Invalid CTA data.
	 * @param string $param    Name of the parameter expected to be reported as invalid.
	 */
	public function test_create_request__rejects_invalid_data( $cta_data, $param ) {
		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( "Invalid parameter: {$param}." );

		$data         = $this->get_valid_data();
		$data['data'] = $cta_data;

		$this->datapoint->create_request( $this->get_data_request( $data ) );
	}

	public function data_invalid_cta_data() {
		return array(
			'non-array data'           => array( 'not-an-array', 'data' ),
			'unsupported type'         => array(
				array(
					'type'   => 'SUBSCRIPTION',
					'config' => array( 'title' => 'Subscribe' ),
				),
				'data.type',
			),
			'missing type'             => array(
				array( 'config' => array( 'title' => 'Subscribe' ) ),
				'data.type',
			),
			'missing config'           => array(
				array( 'type' => 'NEWSLETTER_SIGNUP' ),
				'data.config',
			),
			'non-array config'         => array(
				array(
					'type'   => 'NEWSLETTER_SIGNUP',
					'config' => 'not-an-array',
				),
				'data.config',
			),
			'non-string display name'  => array(
				array(
					'type'        => 'NEWSLETTER_SIGNUP',
					'config'      => array( 'title' => 'Subscribe' ),
					'displayName' => 123,
				),
				'data.displayName',
			),
			'unsupported config field' => array(
				array(
					'type'   => 'NEWSLETTER_SIGNUP',
					'config' => array( 'unknownSetting' => 'value' ),
				),
				'config',
			),
		);
	}

	public function test_parse_response() {
		$response = new Cta();
		$response->setName( 'organizations/organization-1/publications/publication-1/ctas/1' );

		$cta = $this->datapoint->parse_response( $response, $this->get_data_request( $this->get_valid_data() ) );

		$this->assertSame(
			'organizations/organization-1/publications/publication-1/ctas/1',
			$cta->getName(),
			'The created CTA resource should be returned unchanged.'
		);
	}

	private function get_valid_data() {
		return array(
			'organizationID' => 'organization-1',
			'publicationID'  => 'publication-1',
			'data'           => array(
				'type'   => 'NEWSLETTER_SIGNUP',
				'config' => array( 'title' => 'Subscribe' ),
			),
		);
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'POST', 'modules', 'reader-revenue-manager', 'create-cta', $data );
	}
}
