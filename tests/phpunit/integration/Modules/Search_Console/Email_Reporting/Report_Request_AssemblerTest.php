<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting\Report_Request_AssemblerTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console\Email_Reporting;

use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Options;
use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Request_Assembler;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Email_Reporting
 */
class Report_Request_AssemblerTest extends TestCase {

	public function test_map_responses_returns_wp_error_unchanged() {
		$assembler = new Report_Request_Assembler( new Report_Options( $this->get_date_range_payload() ) );

		list( , $request_map ) = $assembler->build_requests();

		$error  = new WP_Error(
			'missing_required_scopes',
			'Request had insufficient authentication scopes.',
			array( 'status' => 403 )
		);
		$result = $assembler->map_responses( $error, $request_map );

		$this->assertSame( $error, $result, 'A whole-batch WP_Error should be returned unchanged.' );
	}

	public function test_map_responses_maps_batch_response_to_section_payloads() {
		$assembler = new Report_Request_Assembler( new Report_Options( $this->get_date_range_payload() ) );

		list( , $request_map ) = $assembler->build_requests();

		$responses = array();
		foreach ( array_keys( $request_map ) as $identifier ) {
			$responses[ $identifier ] = array(
				array(
					'clicks'      => 1,
					'impressions' => 2,
					'ctr'         => 0.5,
					'position'    => 3,
					'keys'        => array( '/' ),
				),
			);
		}

		$payload = $assembler->map_responses( $responses, $request_map );

		$this->assertIsArray( $payload, 'Successful batch responses should map to a section payload array.' );
		$this->assertArrayHasKey( 'total_impressions', $payload, 'Payload should include total impressions section.' );
		$this->assertArrayHasKey( 'total_clicks', $payload, 'Payload should include total clicks section.' );
		$this->assertArrayHasKey( 'top_ctr_keywords', $payload, 'Payload should include top CTR keywords section.' );
		$this->assertArrayHasKey( 'top_pages_by_clicks', $payload, 'Payload should include top pages section.' );
		$this->assertSame( $responses['total_impressions'], $payload['total_impressions'], 'Single-context responses should map directly to their section key.' );
		$this->assertSame( $responses['top_ctr_keywords_current'], $payload['top_ctr_keywords']['current'], 'Current-period responses should nest under the current context.' );
		$this->assertSame( $responses['top_ctr_keywords_compare'], $payload['top_ctr_keywords']['compare'], 'Compare-period responses should nest under the compare context.' );
	}

	private function get_date_range_payload() {
		return array(
			'startDate'        => '2024-01-01',
			'endDate'          => '2024-01-07',
			'compareStartDate' => '2023-12-25',
			'compareEndDate'   => '2023-12-31',
		);
	}
}
