<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Update_PublicationTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Update_Publication;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Update_PublicationTest extends TestCase {

	/**
	 * Update publication datapoint.
	 *
	 * @var Update_Publication
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
		$this->module->get_settings()->merge(
			array(
				'organizationID' => 'organization-setting',
				'publicationID'  => 'publication-setting',
			)
		);
		$this->module->get_client()->withDefer( true );

		$service         = new Webcontentpublisher( $this->module->get_client() );
		$this->datapoint = new Update_Publication(
			array(
				'service'  => function () use ( $service ) {
					return $service;
				},
				'settings' => $this->module->get_settings(),
			)
		);
	}

	public function test_create_request__terms_acceptance() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'data'           => array(
						'rrmProduct' => array(
							'tosAcceptance' => array(
								'userAccepted' => true,
							),
						),
					),
				)
			)
		);

		$this->assertSame( 'PATCH', $request->getMethod(), 'The request should use PATCH.' );
		$this->assertSame(
			'/v1/organizations/organization-1/publications/publication-1',
			$request->getUri()->getPath(),
			'The request should target the selected publication.'
		);

		parse_str( $request->getUri()->getQuery(), $query );
		$this->assertSame( 'rrmProduct.tosAcceptance.userAccepted', $query['updateMask'], 'The request should update the ToS acceptance.' );
		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'rrmProduct' => array(
						'tosAcceptance' => array(
							'userAccepted' => true,
						),
					),
				)
			),
			(string) $request->getBody(),
			'The request should include the ToS acceptance fields.'
		);
	}

	public function test_create_request__falls_back_to_settings() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'data' => array(
						'publicationTosUrl' => 'https://example.com/terms',
					),
				)
			)
		);

		$this->assertSame(
			'/v1/organizations/organization-setting/publications/publication-setting',
			$request->getUri()->getPath(),
			'The request should fall back to the configured IDs.'
		);
	}

	public function test_create_request__publication_policies() {
		$request = $this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'data'           => array(
						'publicationTosUrl'           => 'https://example.com/terms',
						'publicationPrivacyPolicyUrl' => 'https://example.com/privacy',
					),
				)
			)
		);

		parse_str( $request->getUri()->getQuery(), $query );
		$this->assertSame(
			'publicationTosUrl,publicationPrivacyPolicyUrl',
			$query['updateMask'],
			'The request should update both publication policy URLs.'
		);
		$this->assertJsonStringEqualsJsonString(
			wp_json_encode(
				array(
					'publicationPrivacyPolicyUrl' => 'https://example.com/privacy',
					'publicationTosUrl'           => 'https://example.com/terms',
				)
			),
			(string) $request->getBody(),
			'The request should include both publication policy URLs.'
		);
	}

	/**
	 * @dataProvider data_missing_required_settings
	 *
	 * @param string $setting The missing setting.
	 */
	public function test_create_request__requires_fallback_settings( $setting ) {
		$this->module->get_settings()->merge( array( $setting => '' ) );

		try {
			$this->datapoint->create_request(
				$this->get_data_request(
					array(
						'data' => array(
							'publicationTosUrl' => 'https://example.com/terms',
						),
					)
				)
			);
			$this->fail( 'Expected Missing_Required_Setting_Exception to be thrown.' );
		} catch ( Missing_Required_Setting_Exception $exception ) {
			$this->assertSame( "Required setting is missing: {$setting}.", $exception->getMessage(), 'The exception should identify the missing setting.' );

			$error = $exception->to_wp_error();
			$this->assertSame( 'missing_required_setting', $error->get_error_code(), 'The exception should use the missing setting error code.' );
			$this->assertSame( array( 'status' => 500 ), $error->get_error_data(), 'The exception should return an HTTP 500 error.' );
		}
	}

	public function data_missing_required_settings() {
		return array(
			'organizationID' => array( 'organizationID' ),
			'publicationID'  => array( 'publicationID' ),
		);
	}

	public function test_create_request__requires_update_fields() {
		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: data.' );

		$this->datapoint->create_request(
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
				)
			)
		);
	}

	public function test_parse_response() {
		$response = new Publication();
		$response->setPublicationId( 'publication-1' );
		$response->setPublicationTosUrl( 'https://example.com/terms' );

		$publication = $this->datapoint->parse_response(
			$response,
			$this->get_data_request(
				array(
					'organizationID' => 'organization-1',
					'publicationID'  => 'publication-1',
					'data'           => array(
						'publicationTosUrl' => 'https://example.com/terms',
					),
				)
			)
		);

		$this->assertSame( 'publication-1', $publication['publicationId'], 'The response should contain the updated publication.' );
		$this->assertSame( 'https://example.com/terms', $publication['publicationTosUrl'], 'New API fields should be preserved.' );
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'POST', 'modules', 'reader-revenue-manager', 'publication', $data );
	}
}
