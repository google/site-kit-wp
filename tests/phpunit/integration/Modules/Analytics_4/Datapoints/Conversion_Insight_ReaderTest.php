<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Conversion_Insight_ReaderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Modules\Analytics_4\Datapoints\Conversion_Insight_Reader;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Conversion_Insight_ReaderTest extends TestCase {

	public function test_read__answers_with_the_first_insight_and_the_interaction_id_and_scenario_of_the_answer() {
		$this->assertSame(
			array(
				'interactionID'            => '01M4B0KB2E2VWF72GMV1X4BE08',
				'scenario'                 => 'DECLINE_VOL_DOWN_CR_FLAT',
				'code'                     => 'DECLINE_VOL_DOWN',
				'text'                     => 'Purchases are down 20% over the past 28 days.',
				'actionableRecommendation' => 'Fewer visits to your site led to fewer purchases.',
			),
			( new Conversion_Insight_Reader() )->read(
				array(
					'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
					'scenario'       => 'DECLINE_VOL_DOWN_CR_FLAT',
					'model_version'  => 'model-1',
					'insights'       => array(
						array(
							'event_name'                => 'purchase',
							'code'                      => 'DECLINE_VOL_DOWN',
							'text'                      => 'Purchases are down 20% over the past 28 days.',
							'actionable_recommendation' => 'Fewer visits to your site led to fewer purchases.',
						),
						array(
							'event_name' => 'generate_lead',
							'code'       => 'GROWTH',
							'text'       => 'Leads are up 10% over the past 28 days.',
						),
					),
				)
			),
			'The insight should be the first entry of `insights`, with the top-level `interaction_id` and `scenario` of the answer, unchanged.'
		);
	}

	public function test_read__answers_null_for_a_field_of_the_insight_that_is_not_a_string() {
		$this->assertSame(
			array(
				'interactionID'            => null,
				'scenario'                 => null,
				'code'                     => null,
				'text'                     => 'Purchases are down 20% over the past 28 days.',
				'actionableRecommendation' => null,
			),
			( new Conversion_Insight_Reader() )->read(
				array(
					'interaction_id' => 1234,
					'scenario'       => array( 'DECLINE_VOL_DOWN_CR_FLAT' ),
					'insights'       => array(
						array(
							'code'                      => 404,
							'text'                      => 'Purchases are down 20% over the past 28 days.',
							'actionable_recommendation' => 20,
						),
					),
				)
			),
			'An `interaction_id`, a `scenario`, a `code` or an `actionable_recommendation` that is not a string should be null.'
		);
	}

	/**
	 * @dataProvider data_responses_without_an_insight
	 *
	 * @param array $response The service's answer.
	 */
	public function test_read__answers_null_when_the_service_wrote_no_insight( array $response ) {
		$this->assertNull( ( new Conversion_Insight_Reader() )->read( $response ), 'An answer without an insight should be read as no insight.' );
	}

	public function data_responses_without_an_insight() {
		return array(
			'an entry with the code NO_INSIGHT'   => array(
				array(
					'scenario' => 'NO_INSIGHT',
					'insights' => array(
						array(
							'event_name' => 'purchase',
							'code'       => 'NO_INSIGHT',
						),
					),
				),
			),
			'no entry'                            => array(
				array(
					'scenario' => 'NO_INSIGHT',
					'insights' => array(),
				),
			),
			'no insights'                         => array( array( 'scenario' => 'NO_INSIGHT' ) ),
			'a first entry that is not an object' => array(
				array(
					'scenario' => 'NO_INSIGHT',
					'insights' => array( 'NO_INSIGHT' ),
				),
			),
		);
	}

	/**
	 * @dataProvider data_entries_without_a_text
	 *
	 * @param array $entry The entry of `insights`.
	 */
	public function test_read__answers_an_error_for_an_insight_without_a_text( array $entry ) {
		$error = ( new Conversion_Insight_Reader() )->read(
			array(
				'interaction_id' => '01M4B0KB2E2VWF72GMV1X4BE08',
				'scenario'       => 'DECLINE_VOL_DOWN_CR_FLAT',
				'insights'       => array( $entry ),
			)
		);

		$this->assertWPError( $error, 'An insight without a text should be an error rather than an empty insight.' );
		$this->assertSame( 'invalid_conversion_insight_response', $error->get_error_code(), 'The error should say the Site Goals insight could not be read.' );
		$this->assertSame( array( 'status' => 500 ), $error->get_error_data(), 'The error should have status 500.' );
	}

	public function data_entries_without_a_text() {
		return array(
			'no text'               => array( array( 'code' => 'DECLINE_VOL_DOWN' ) ),
			'an empty text'         => array(
				array(
					'code' => 'DECLINE_VOL_DOWN',
					'text' => '',
				),
			),
			'a text that is a list' => array(
				array(
					'code' => 'DECLINE_VOL_DOWN',
					'text' => array( 'Purchases are down 20% over the past 28 days.' ),
				),
			),
		);
	}

	public function test_get_failed_operation_error__names_the_site_goals_insight() {
		$this->assertSame(
			'conversion_insight_failed',
			( new Conversion_Insight_Reader() )->get_failed_operation_error( array( 'code' => 13 ) )->get_error_code(),
			'The error for a failed operation should name the Site Goals insight, which the browser checks for.'
		);
	}
}
