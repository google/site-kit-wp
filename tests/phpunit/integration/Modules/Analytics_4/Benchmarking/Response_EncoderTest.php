<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Response_EncoderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Encoder;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Wire_Format;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Response_EncoderTest extends TestCase {

	/**
	 * Response encoder instance.
	 *
	 * @var Response_Encoder
	 */
	private $encoder;

	public function set_up() {
		parent::set_up();

		$this->encoder = new Response_Encoder();
	}

	/**
	 * Returns the assembled response the checked-in fixture holds encoded.
	 *
	 * @return array The assembled response.
	 */
	private function get_fixture_response() {
		return array(
			'visits'           => array(
				'current'  => 412,
				'previous' => 388,
			),
			'dailyTraffic'     => array(
				array(
					'date'        => '2025-08-18',
					'visits'      => 132,
					'expectedMin' => null,
					'expectedMax' => null,
				),
				array(
					'date'        => '2025-08-19',
					'visits'      => 0,
					'expectedMin' => 118.4,
					'expectedMax' => 183.1,
				),
				array(
					'date'        => '2025-08-20',
					'visits'      => 147,
					'expectedMin' => 124.3,
					'expectedMax' => 191.5,
				),
				array(
					'date'        => '2025-08-21',
					'visits'      => 96,
					'expectedMin' => 117.9,
					'expectedMax' => 182.6,
				),
			),
			// 26 days before the first plotted day, so `2025-08-18` is the 27th day
			// with recorded traffic, which has no expected range, and `2025-08-19`
			// is the 28th, which has one.
			'firstTrafficDate' => '2025-07-23',
			'keyFactors'       => array(
				array(
					'kind'       => 'REFERRING_SITE',
					'label'      => 'Facebook',
					'current'    => 96,
					'previous'   => 31,
					'sharePct'   => 21.4,
					'attributes' => array(
						array(
							'kind'     => 'LANDING_PAGE',
							'label'    => '/how-to-plant-garlic/',
							'current'  => 58,
							'previous' => 12,
							'sharePct' => 15.1,
						),
						array(
							'kind'     => 'DEVICE',
							'label'    => 'mobile',
							'current'  => 71,
							'previous' => 20,
							'sharePct' => 16.8,
						),
					),
				),
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Organic Search',
					'current'    => 210,
					'previous'   => 222,
					'sharePct'   => 40.3,
					'attributes' => array(),
				),
				array(
					'kind'       => 'CONTENT',
					'label'      => '/how-to-plant-garlic/',
					'current'    => 64,
					'previous'   => 15,
					'sharePct'   => 12.6,
					'attributes' => array(
						array(
							'kind'     => 'TRAFFIC_CHANNEL',
							'label'    => 'Organic Social',
							'current'  => 61,
							'previous' => 13,
							'sharePct' => 15.9,
						),
					),
				),
			),
		);
	}

	/**
	 * Returns the encoded response as the browser receives it, so a member that
	 * serializes differently from the array it was built as is compared as sent.
	 *
	 * @param array $response Assembled response.
	 * @return array The encoded response, round-tripped through JSON.
	 */
	private function encode_as_sent( array $response ) {
		return json_decode( wp_json_encode( $this->encoder->encode( $response ) ), true );
	}

	public function test_encode__matches_the_checked_in_fixture() {
		$fixture = json_decode(
			file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json' ),
			true
		);

		$this->assertSame(
			$fixture,
			$this->encode_as_sent( $this->get_fixture_response() ),
			'The encoded response should match the fixture the JavaScript decoder reads.'
		);
	}

	public function test_encode__writes_a_label_shared_by_a_card_and_an_attribute_once() {
		$encoded = $this->encoder->encode( $this->get_fixture_response() );

		$this->assertSame(
			$encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ][0][0][1],
			$encoded[ Wire_Format::MEMBER_KEY_FACTORS ][2][1],
			'The `LANDING_PAGE` attribute of the first card and the `CONTENT` card should carry the same string index.'
		);
		$this->assertSame(
			array( '/how-to-plant-garlic/' ),
			array_values( array_filter( $encoded[ Wire_Format::MEMBER_STRINGS ], fn( $value ) => '/how-to-plant-garlic/' === $value ) ),
			'The shared label should be in the table once.'
		);
	}

	public function test_encode__skips_a_card_or_an_attribute_without_a_kind_the_format_lists() {
		$encoded = $this->encode_as_sent(
			array(
				'keyFactors' => array(
					array(
						'kind'       => 'NEWSLETTER',
						'label'      => 'Spring sale',
						'current'    => 40,
						'previous'   => 10,
						'sharePct'   => 30.5,
						'attributes' => array(
							array(
								'kind'     => 'DEVICE',
								'label'    => 'mobile',
								'current'  => 30,
								'previous' => 5,
								'sharePct' => 25.1,
							),
						),
					),
					array(
						'label'    => 'Email',
						'current'  => 12,
						'previous' => 4,
						'sharePct' => 6.2,
					),
					array(
						'kind'       => 'CHANNEL',
						'label'      => 'Organic Search',
						'current'    => 210,
						'previous'   => 222,
						'sharePct'   => 40.3,
						'attributes' => array(
							array(
								'kind'     => 'BROWSER',
								'label'    => 'Chrome',
								'current'  => 150,
								'previous' => 160,
								'sharePct' => 20.2,
							),
							array(
								'label'    => 'desktop',
								'current'  => 90,
								'previous' => 100,
								'sharePct' => 9.4,
							),
							array(
								'kind'     => 'LANDING_PAGE',
								'label'    => '/how-to-plant-garlic/',
								'current'  => 58,
								'previous' => 12,
								'sharePct' => 15.1,
							),
						),
					),
				),
			)
		);

		$this->assertSame(
			array( array( 0, 0, 210, 222, 40.3 ) ),
			$encoded[ Wire_Format::MEMBER_KEY_FACTORS ],
			'Only the `CHANNEL` card should be encoded, since the format lists no `NEWSLETTER` kind and the `Email` card has no kind.'
		);
		$this->assertSame(
			array( array( array( 1, 1, 58, 12, 15.1 ) ) ),
			$encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ],
			"The `NEWSLETTER` card's attributes should be skipped with it, and the `CHANNEL` card should keep only its `LANDING_PAGE` attribute, since the format lists no `BROWSER` kind and the `desktop` attribute has no kind."
		);
		$this->assertSame(
			array( 'Organic Search', '/how-to-plant-garlic/' ),
			$encoded[ Wire_Format::MEMBER_STRINGS ],
			'A skipped card or attribute should add nothing to the string table.'
		);
	}

	public function test_encode__writes_each_kind_as_its_position() {
		$encoded = $this->encoder->encode(
			array(
				'keyFactors' => array_map(
					fn( $kind ) => array(
						'kind'       => $kind,
						'label'      => $kind,
						'current'    => 2,
						'previous'   => 1,
						'sharePct'   => 10.5,
						'attributes' => array_map(
							fn( $attribute_kind ) => array(
								'kind'     => $attribute_kind,
								'label'    => $attribute_kind,
								'current'  => 2,
								'previous' => 1,
								'sharePct' => 5.5,
							),
							array( 'TRAFFIC_CHANNEL', 'LANDING_PAGE', 'SEARCH_KEYWORD', 'REFERRING_SITE', 'PLATFORM', 'CAMPAIGN', 'DEVICE', 'USER_TYPE' )
						),
					),
					array( 'CHANNEL', 'CONTENT', 'SEARCH_KEYWORD', 'REFERRING_SITE', 'CAMPAIGN' )
				),
			)
		);

		$this->assertSame(
			array( 0, 1, 2, 3, 4 ),
			array_column( $encoded[ Wire_Format::MEMBER_KEY_FACTORS ], 0 ),
			'Each driver kind should travel as its position: `CHANNEL` 0, `CONTENT` 1, `SEARCH_KEYWORD` 2, `REFERRING_SITE` 3 and `CAMPAIGN` 4.'
		);
		$this->assertSame(
			array( 0, 1, 2, 3, 4, 5, 6, 7 ),
			array_column( $encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ][0], 0 ),
			'Each attribute kind should travel as its position: `TRAFFIC_CHANNEL` 0, `LANDING_PAGE` 1, `SEARCH_KEYWORD` 2, `REFERRING_SITE` 3, `PLATFORM` 4, `CAMPAIGN` 5, `DEVICE` 6 and `USER_TYPE` 7.'
		);
	}

	public function test_encode__keeps_a_null_label_null_and_a_zero_count_zero() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic' => array(
					array(
						'date'   => '2025-08-18',
						'visits' => 0,
					),
				),
				'keyFactors'   => array(
					array(
						'kind'     => 'CHANNEL',
						'label'    => null,
						'current'  => 0,
						'previous' => 4,
						'sharePct' => 12.5,
					),
				),
			)
		);

		$this->assertSame( array( array( 0, null, 0, 4, 12.5 ) ), $encoded[ Wire_Format::MEMBER_KEY_FACTORS ], 'A null label should stay null, and a zero count should stay zero.' );
		$this->assertSame( array( array() ), $encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ], 'A card without attributes should have an empty list of attributes.' );
		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_STRINGS ], 'A null label should add nothing to the string table.' );
		$this->assertSame( array( 0 ), $encoded[ Wire_Format::MEMBER_DAILY_VISITS ], 'A day with no visits should stay zero.' );
	}

	public function test_encode__writes_empty_key_factor_members_for_a_response_without_key_factors() {
		$encoded = $this->encode_as_sent(
			array(
				'dailyTraffic' => array(
					array(
						'date'   => '2025-08-18',
						'visits' => 7,
					),
				),
			)
		);

		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_KEY_FACTORS ], 'A response without `keyFactors` should travel with an empty list of cards.' );
		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ], 'A response without `keyFactors` should travel with an empty list of attributes.' );
	}

	public function test_encode__writes_null_for_a_daily_row_that_carries_no_count() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic' => array(
					array( 'date' => '2025-08-18' ),
					array(
						'date'   => '2025-08-19',
						'visits' => 7,
					),
				),
			)
		);

		$this->assertSame(
			array( null, 7 ),
			$encoded[ Wire_Format::MEMBER_DAILY_VISITS ],
			'A day the report gave no count for should encode as null, without raising a PHP warning.'
		);
	}

	public function test_encode__writes_no_first_date_for_a_daily_row_that_carries_none() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic' => array( array( 'visits' => 7 ) ),
			)
		);

		$this->assertNull(
			$encoded[ Wire_Format::MEMBER_FIRST_DATE ],
			'A first row with no date should encode as null, without raising a PHP warning.'
		);
	}

	public function test_encode__rounds_shares_and_writes_every_count_as_an_integer() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic' => array(
					array(
						'date'   => '2025-08-18',
						'visits' => 132.6,
					),
				),
				'visits'       => array(
					'current'  => 412.4,
					'previous' => 388.5,
				),
				'keyFactors'   => array(
					array(
						'kind'       => 'REFERRING_SITE',
						'label'      => 'Facebook',
						'current'    => 96.7,
						'previous'   => 31.2,
						'sharePct'   => 21.44,
						'attributes' => array(
							array(
								'kind'     => 'DEVICE',
								'label'    => 'mobile',
								'current'  => 71.5,
								'previous' => 20.9,
								'sharePct' => 16.85,
							),
						),
					),
				),
			)
		);

		$this->assertSame( array( array( 3, 0, 96, 31, 21.4 ) ), $encoded[ Wire_Format::MEMBER_KEY_FACTORS ], "A card's share should be rounded to one decimal place, and its counts should be integers." );
		$this->assertSame( array( array( array( 6, 1, 71, 20, 16.9 ) ) ), $encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ], "An attribute's share should be rounded to one decimal place, and its counts should be integers." );
		$this->assertSame( array( 132 ), $encoded[ Wire_Format::MEMBER_DAILY_VISITS ], 'A daily count should be an integer.' );
		$this->assertSame( array( 412, 388 ), $encoded[ Wire_Format::MEMBER_VISIT_TOTALS ], 'The period totals should be integers.' );
	}

	public function test_encode__writes_the_expected_range_of_each_day_in_the_order_of_the_daily_counts() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic' => array(
					array(
						'date'        => '2025-08-18',
						'visits'      => 132,
						'expectedMin' => 118.4,
						'expectedMax' => 183.1,
					),
					array(
						'date'        => '2025-08-19',
						'visits'      => 0,
						'expectedMin' => null,
						'expectedMax' => null,
					),
					array(
						'date'   => '2025-08-20',
						'visits' => 147,
					),
					array(
						'date'        => '2025-08-21',
						'visits'      => 96,
						'expectedMin' => 117.9,
						'expectedMax' => 182.6,
					),
				),
			)
		);

		$this->assertSame(
			array(
				array( 118.4, 183.1 ),
				null,
				null,
				array( 117.9, 182.6 ),
			),
			$encoded[ Wire_Format::MEMBER_DAILY_EXPECTED_RANGES ],
			'Each day should have its bounds at its own position, and a day whose bounds are null, or a day with no bounds, should have null.'
		);
	}

	public function test_encode__rounds_the_bounds_of_the_expected_range_to_one_decimal() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic' => array(
					array(
						'date'        => '2025-08-18',
						'visits'      => 132,
						'expectedMin' => 118.44,
						'expectedMax' => 183.16,
					),
				),
			)
		);

		$this->assertSame(
			array( array( 118.4, 183.2 ) ),
			$encoded[ Wire_Format::MEMBER_DAILY_EXPECTED_RANGES ],
			'The bounds `118.44` and `183.16` should be encoded as `118.4` and `183.2`.'
		);
	}

	/**
	 * @dataProvider data_first_traffic_dates
	 *
	 * @param string $first_traffic_date The first day with recorded traffic, as `YYYY-MM-DD`.
	 * @param int    $day_offset         The number of days from the first plotted day, `2025-08-18`, to that day.
	 */
	public function test_encode__writes_the_first_traffic_day_as_its_offset_from_the_first_plotted_day( $first_traffic_date, $day_offset ) {
		$response                     = $this->get_fixture_response();
		$response['firstTrafficDate'] = $first_traffic_date;

		$encoded = $this->encoder->encode( $response );

		$this->assertSame(
			$day_offset,
			$encoded[ Wire_Format::MEMBER_FIRST_TRAFFIC_DAY_OFFSET ],
			"A `firstTrafficDate` of `$first_traffic_date` should be encoded as $day_offset days from `2025-08-18`."
		);
	}

	public function data_first_traffic_dates() {
		return array(
			'18 days before the first plotted day' => array( '2025-07-31', -18 ),
			'on the first plotted day'             => array( '2025-08-18', 0 ),
			'5 days after the first plotted day'   => array( '2025-08-23', 5 ),
		);
	}

	public function test_encode__writes_null_as_the_first_traffic_day_when_there_is_none() {
		$response                     = $this->get_fixture_response();
		$response['firstTrafficDate'] = null;

		$this->assertNull(
			$this->encoder->encode( $response )[ Wire_Format::MEMBER_FIRST_TRAFFIC_DAY_OFFSET ],
			'A `firstTrafficDate` of null should be encoded as null.'
		);

		unset( $response['firstTrafficDate'] );

		$this->assertNull(
			$this->encoder->encode( $response )[ Wire_Format::MEMBER_FIRST_TRAFFIC_DAY_OFFSET ],
			'A response with no `firstTrafficDate` should encode it as null.'
		);
	}

	public function test_encode__writes_an_empty_expected_range_and_no_first_traffic_day_for_an_empty_daily_series() {
		$encoded = $this->encode_as_sent(
			array(
				'dailyTraffic'     => array(),
				'firstTrafficDate' => '2025-07-23',
			)
		);

		$this->assertCount( 9, $encoded, 'The encoded response should have nine members.' );
		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_DAILY_EXPECTED_RANGES ], 'An empty `dailyTraffic` should give an empty list of expected ranges.' );
		$this->assertNull( $encoded[ Wire_Format::MEMBER_FIRST_TRAFFIC_DAY_OFFSET ], 'With no first plotted day to count from, the first traffic day should be encoded as null.' );
	}

	public function test_encode__writes_no_date_but_the_first() {
		$encoded = $this->encode_as_sent( $this->get_fixture_response() );

		$dates = array_filter(
			$this->flatten( $encoded ),
			fn( $value ) => is_string( $value ) && 1 === preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value )
		);

		$this->assertSame(
			array( '2025-08-18' ),
			array_values( $dates ),
			'The encoded response should carry the first plotted day and no other date.'
		);
		$this->assertSame(
			'2025-08-18',
			$encoded[ Wire_Format::MEMBER_FIRST_DATE ],
			'The first plotted day should be the date of the first row of `dailyTraffic`.'
		);
	}

	public function test_encode__writes_nine_members_for_a_response_without_an_insight_payload() {
		$response                  = $this->get_fixture_response();
		$response['insightLocale'] = 'de_DE';

		$encoded = $this->encode_as_sent( $response );

		$this->assertCount( 9, $encoded, 'A response without `insightPayload` should keep its nine members, even with a locale.' );
		$this->assertArrayNotHasKey( Wire_Format::MEMBER_INSIGHT_LOCALE, $encoded, 'A response without `insightPayload` should have no insight locale member.' );
		$this->assertArrayNotHasKey( Wire_Format::MEMBER_INSIGHT_PAYLOAD, $encoded, 'A response without `insightPayload` should have no insight payload member.' );
	}

	public function test_encode__writes_the_insight_locale_and_the_insight_payload_as_members_9_and_10() {
		$response                   = $this->get_fixture_response();
		$response['insightLocale']  = 'de_DE_formal';
		$response['insightPayload'] = 'eyJsb2NhbGUiOiJkZV9ERV9mb3JtYWwifQ.c2lnbmF0dXJl';

		$encoded = $this->encode_as_sent( $response );

		$this->assertCount( 11, $encoded, 'A response with `insightPayload` should have eleven members.' );
		// The browser reads the members by their positions, so the positions
		// are named here rather than read from `Wire_Format`.
		$this->assertSame( range( 0, 10 ), array_keys( $encoded ), 'The response should stay a list, so it is sent as a JSON array.' );
		$this->assertSame( 'de_DE_formal', $encoded[9], 'The locale of the insight should be at position 9.' );
		$this->assertSame( 'eyJsb2NhbGUiOiJkZV9ERV9mb3JtYWwifQ.c2lnbmF0dXJl', $encoded[10], 'The payload should be at position 10.' );
		$this->assertSame( 'de_DE_formal', $encoded[ Wire_Format::MEMBER_INSIGHT_LOCALE ], 'Member 9 should be the locale of the insight, as it is.' );
		$this->assertSame( 'eyJsb2NhbGUiOiJkZV9ERV9mb3JtYWwifQ.c2lnbmF0dXJl', $encoded[ Wire_Format::MEMBER_INSIGHT_PAYLOAD ], 'Member 10 should be the payload, as it is.' );
		$this->assertSame(
			$this->encode_as_sent( $this->get_fixture_response() ),
			array_slice( $encoded, 0, 9 ),
			'The first nine members should be the same as those of the response without the insight members.'
		);
		$this->assertNotContains( 'de_DE_formal', $encoded[ Wire_Format::MEMBER_STRINGS ], 'The locale should not be added to the string table.' );
	}

	public function test_encode__writes_null_as_the_insight_payload_when_there_is_no_insight_to_request() {
		$response                   = $this->get_fixture_response();
		$response['insightLocale']  = 'de_DE';
		$response['insightPayload'] = null;

		$encoded = $this->encode_as_sent( $response );

		$this->assertCount( 11, $encoded, 'A response with a null `insightPayload` should still have eleven members.' );
		$this->assertSame( 'de_DE', $encoded[ Wire_Format::MEMBER_INSIGHT_LOCALE ], 'Member 9 should be the locale of the insight.' );
		$this->assertNull( $encoded[ Wire_Format::MEMBER_INSIGHT_PAYLOAD ], 'Member 10 should be null when there is no insight to request.' );
	}

	public function test_encode__writes_null_as_the_insight_locale_when_the_response_has_none() {
		$response                   = $this->get_fixture_response();
		$response['insightPayload'] = 'eyJsb2NhbGUiOiJkZV9ERSJ9.c2lnbmF0dXJl';

		$encoded = $this->encode_as_sent( $response );

		$this->assertNull( $encoded[ Wire_Format::MEMBER_INSIGHT_LOCALE ], 'Member 9 should be null for a response without `insightLocale`.' );
		$this->assertSame( 'eyJsb2NhbGUiOiJkZV9ERSJ9.c2lnbmF0dXJl', $encoded[ Wire_Format::MEMBER_INSIGHT_PAYLOAD ], 'Member 10 should be the payload.' );
	}

	/**
	 * @dataProvider data_unusable_insight_strings
	 *
	 * @param mixed $value A value that is not a non-empty string.
	 */
	public function test_encode__writes_null_for_an_insight_member_that_is_not_a_non_empty_string( $value ) {
		$response                   = $this->get_fixture_response();
		$response['insightLocale']  = $value;
		$response['insightPayload'] = $value;

		$encoded = $this->encoder->encode( $response );

		$this->assertNull( $encoded[ Wire_Format::MEMBER_INSIGHT_LOCALE ], 'An insight locale that is not a non-empty string should be encoded as null.' );
		$this->assertNull( $encoded[ Wire_Format::MEMBER_INSIGHT_PAYLOAD ], 'An insight payload that is not a non-empty string should be encoded as null.' );
	}

	public function data_unusable_insight_strings() {
		return array(
			'an empty string' => array( '' ),
			'a number'        => array( 123 ),
			'a list'          => array( array( 'payload' ) ),
			'false'           => array( false ),
		);
	}

	/**
	 * Flattens a nested array into its scalar values.
	 *
	 * @param array $value Array to flatten.
	 * @return array The array's scalar values.
	 */
	private function flatten( array $value ) {
		$flat = array();

		array_walk_recursive(
			$value,
			function ( $item ) use ( &$flat ) {
				$flat[] = $item;
			}
		);

		return $flat;
	}
}
