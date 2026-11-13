<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_CTAsTest
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_CTAs;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\ListCtasResponse;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_CTAsTest extends TestCase {

	/**
	 * Get CTAs datapoint.
	 *
	 * @var Get_CTAs
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
				'organizationID' => 'saved-organization',
				'publicationID'  => 'saved-publication',
			)
		);
		$this->module->get_client()->withDefer( true );

		$service         = new WebContentPublisher( $this->module->get_client() );
		$this->datapoint = new Get_CTAs(
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
			'https://webcontentpublisher.googleapis.com/v1/organizations/saved-organization/publications/saved-publication/ctas',
			(string) $request->getUri(),
			'The request should list the CTAs of the connected publication.'
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
			'https://webcontentpublisher.googleapis.com/v1/organizations/saved-organization/publications/saved-publication/ctas',
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
		$cta = $this->create_cta( '9d2418415-ab3a', Cta::STATE_ACTIVE );

		$response = new ListCtasResponse();
		$response->setCtas( array( $cta ) );

		$parsed = $this->datapoint->parse_response( $response, $this->get_data_request( array() ) );

		$this->assertSame(
			'saved-publication',
			$parsed['publicationID'],
			'The response should name the publication the CTAs belong to.'
		);

		$ctas = $parsed['ctas'];

		$this->assertCount( 1, $ctas, 'The response should contain the publication CTAs.' );
		$this->assertSame(
			'organizations/organization-1/publications/publication-1/ctas/9d2418415-ab3a',
			$ctas[0]->getName(),
			'The CTA resource should be returned unchanged.'
		);
		$this->assertSame(
			array(
				'9d2418415-ab3a' => array(
					'type'        => 'newsletter-signup',
					'state'       => 'ACTIVE',
					'displayName' => 'Newsletter 9d2418415-ab3a',
				),
			),
			$this->module->get_settings()->get()['configuredCTAs'],
			'The CTA response should be synchronized with module settings using CTA IDs and express-setup slugs.'
		);
	}

	public function test_parse_response__excludes_deleted_ctas() {
		$response = new ListCtasResponse();
		$response->setCtas(
			array(
				$this->create_cta( 'active-cta', Cta::STATE_ACTIVE ),
				$this->create_cta( 'deleted-cta', Cta::STATE_STATE_UNSPECIFIED ),
				$this->create_cta( 'draft-cta', Cta::STATE_DRAFT ),
			)
		);

		$ctas = $this->datapoint->parse_response( $response, $this->get_data_request( array() ) )['ctas'];

		$this->assertSame(
			array(
				'organizations/organization-1/publications/publication-1/ctas/active-cta',
				'organizations/organization-1/publications/publication-1/ctas/draft-cta',
			),
			array_map(
				function ( Cta $cta ) {
					return $cta->getName();
				},
				$ctas
			),
			'The response should contain only the active and draft CTAs.'
		);
		$this->assertSame(
			array( 'active-cta', 'draft-cta' ),
			array_keys( $this->module->get_settings()->get()['configuredCTAs'] ),
			'The configured CTAs should contain only the active and draft CTAs.'
		);
	}

	public function test_parse_response__names_the_publication_when_there_are_no_ctas() {
		$parsed = $this->datapoint->parse_response( new ListCtasResponse(), $this->get_data_request( array() ) );

		$this->assertSame(
			array(
				'publicationID' => 'saved-publication',
				'ctas'          => array(),
			),
			$parsed,
			'An empty list should still name the publication it is for.'
		);
	}

	private function create_cta( $cta_id, $state ) {
		$cta = new Cta();
		$cta->setName( "organizations/organization-1/publications/publication-1/ctas/{$cta_id}" );
		$cta->setType( Cta::TYPE_NEWSLETTER_SIGNUP );
		$cta->setState( $state );
		$cta->setDisplayName( "Newsletter {$cta_id}" );

		return $cta;
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'ctas', $data );
	}
}
