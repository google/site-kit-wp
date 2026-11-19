<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Benchmarking_Insight_ReaderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Modules\Analytics_4\Datapoints\Benchmarking_Insight_Reader;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Benchmarking_Insight_ReaderTest extends TestCase {

	public function test_read__answers_with_the_fields_of_the_insight() {
		$this->assertSame(
			array(
				'scenario'      => 'BELOW_EXPECTED',
				'teaser'        => 'Your site is quieter than usual.',
				'analysis'      => 'Your site had fewer visits than usual, mostly from Organic Search.',
				'driver'        => 'Organic Search brought fewer visits.',
				'interactionID' => '01M4ZDVWTA3J4SBF8QX8NVXT93',
				'modelVersion'  => 'model-1',
			),
			( new Benchmarking_Insight_Reader() )->read(
				array(
					'scenario'       => 'BELOW_EXPECTED',
					'teaser'         => 'Your site is quieter than usual.',
					'analysis'       => 'Your site had fewer visits than usual, mostly from Organic Search.',
					'driver'         => 'Organic Search brought fewer visits.',
					'interaction_id' => '01M4ZDVWTA3J4SBF8QX8NVXT93',
					'model_version'  => 'model-1',
					'unknown_field'  => 'Not part of the insight.',
				)
			),
			'The insight should have each field the service generated, under the name the browser reads, and no other.'
		);
	}

	public function test_read__answers_null_for_a_field_that_is_empty_missing_or_not_a_string() {
		$this->assertSame(
			array(
				'scenario'      => 'WITHIN_EXPECTED',
				'teaser'        => null,
				'analysis'      => 'Your site had as many visits as usual.',
				'driver'        => null,
				'interactionID' => null,
				'modelVersion'  => null,
			),
			( new Benchmarking_Insight_Reader() )->read(
				array(
					'scenario'       => 'WITHIN_EXPECTED',
					'teaser'         => '',
					'analysis'       => 'Your site had as many visits as usual.',
					'interaction_id' => 1234,
					'model_version'  => array( 'model-1' ),
				)
			),
			'A field the service left empty, left out or did not write as a string should be null.'
		);
	}

	public function test_read__answers_with_an_insight_that_has_only_a_driver() {
		$insight = ( new Benchmarking_Insight_Reader() )->read( array( 'driver' => 'Organic Search brought fewer visits.' ) );

		$this->assertSame( 'Organic Search brought fewer visits.', $insight['driver'], 'An insight with a driver but no analysis should be read.' );
	}

	/**
	 * @dataProvider data_responses_without_an_analysis_or_a_driver
	 *
	 * @param array $response The service's answer.
	 */
	public function test_read__answers_an_error_for_an_insight_without_an_analysis_or_a_driver( array $response ) {
		$error = ( new Benchmarking_Insight_Reader() )->read( $response );

		$this->assertWPError( $error, 'An insight with neither an analysis nor a driver should be an error.' );
		$this->assertSame( 'invalid_benchmarking_insight_response', $error->get_error_code(), 'The error should say the benchmarking insight could not be read.' );
		$this->assertSame( array( 'status' => 500 ), $error->get_error_data(), 'The error should have status 500.' );
	}

	public function data_responses_without_an_analysis_or_a_driver() {
		return array(
			'only a scenario'              => array( array( 'scenario' => 'WITHIN_EXPECTED' ) ),
			'an empty analysis and driver' => array(
				array(
					'analysis' => '',
					'driver'   => '',
				),
			),
			'an analysis that is not text' => array( array( 'analysis' => array( 'Your site had fewer visits.' ) ) ),
			'an empty response'            => array( array() ),
		);
	}

	public function test_get_failed_operation_error__names_the_benchmarking_insight() {
		$this->assertSame(
			'benchmarking_insight_failed',
			( new Benchmarking_Insight_Reader() )->get_failed_operation_error( array( 'code' => 13 ) )->get_error_code(),
			'The error for a failed operation should name the benchmarking insight, which the browser checks for.'
		);
	}
}
