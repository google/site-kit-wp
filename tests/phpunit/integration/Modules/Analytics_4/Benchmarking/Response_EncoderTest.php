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
			'visits'            => array(
				'current'  => 412,
				'previous' => 388,
			),
			'dailyTraffic'      => array(
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
			// `2025-08-18` has no expected range, so a period of these four
			// days has no band. The first such period with one starts on
			// `2025-08-19`, the first day with an expected range.
			'availability'      => array(
				'range_too_short'               => false,
				'band_available'                => false,
				'band_available_from'           => '2025-08-22',
				'key_factors_available'         => true,
				'key_factors_available_from'    => '2025-07-30',
				'insight_request_allowed'       => true,
				'performance_insight_available' => false,
				'last_year_available'           => false,
				'range_too_long'                => false,
			),
			'bandReferenceDays' => null,
			'keyFactors'        => array(
				array(
					'kind'       => 'REFERRING_SITE',
					'label'      => 'Facebook',
					'current'    => 96,
					'previous'   => 31,
					'sharePct'   => 21.4,
					'shareBasis' => 'GROSS_CHANGE',
					'attributes' => array(
						array(
							'kind'      => 'LANDING_PAGE',
							'label'     => '/how-to-plant-garlic/',
							'current'   => 58,
							'previous'  => 12,
							'sharePct'  => 15.1,
							'oversized' => false,
						),
						// Mobile gained 71 visits, more than Facebook's 65,
						// so it has no share.
						array(
							'kind'      => 'DEVICE',
							'label'     => 'mobile',
							'current'   => 71,
							'previous'  => 0,
							'sharePct'  => 0.0,
							'oversized' => true,
						),
					),
				),
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Organic Search',
					'current'    => 210,
					'previous'   => 222,
					'sharePct'   => 40.3,
					'shareBasis' => 'NET_CHANGE',
					'attributes' => array(),
				),
				// The post carried 49 of the 389 visits `Organic Social` gained.
				array(
					'kind'                => 'CONTENT',
					'label'               => '/how-to-plant-garlic/',
					'url'                 => '/how-to-plant-garlic/',
					'current'             => 64,
					'previous'            => 15,
					'sharePct'            => 12.6,
					'shareBasis'          => 'PARENT_CHANNEL',
					'parentChannel'       => 'Organic Social',
					'parentChannelChange' => 389,
					'attributes'          => array(
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
			'contentMarkers'    => array(
				array(
					'date'  => '2025-08-20',
					'posts' => array(
						array(
							'title' => 'How to plant garlic',
							'url'   => '/how-to-plant-garlic/',
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

	public function test_encode__writes_the_path_of_a_post_card_after_its_share() {
		$encoded = $this->encode_as_sent(
			array(
				'keyFactors' => array(
					array(
						'kind'       => 'CONTENT',
						'label'      => 'How to plant garlic',
						'url'        => '/how-to-plant-garlic/',
						'current'    => 64,
						'previous'   => 0,
						'sharePct'   => 86.7,
						'attributes' => array(),
					),
					array(
						'kind'       => 'CHANNEL',
						'label'      => 'Direct',
						'current'    => 500,
						'previous'   => 480,
						'sharePct'   => 12.5,
						'attributes' => array(),
					),
				),
			)
		);

		$this->assertSame(
			array(
				array( 1, 0, 64, 0, 86.7, 1 ),
				array( 0, 2, 500, 480, 12.5 ),
			),
			$encoded[ Wire_Format::MEMBER_KEY_FACTORS ],
			'A post\'s card should carry its path as a sixth position, through the string table, and another card should keep five.'
		);
		$this->assertSame( array( 'How to plant garlic', '/how-to-plant-garlic/', 'Direct' ), $encoded[ Wire_Format::MEMBER_STRINGS ], 'The path should be in the string table.' );
	}

	public function test_encode__writes_the_basis_of_a_cards_share_after_its_path_and_null_for_a_card_without_a_path() {
		$encoded = $this->encode_as_sent(
			array(
				'keyFactors' => array_map(
					fn( $share_basis ) => array(
						'kind'       => 'CHANNEL',
						'label'      => 'Direct',
						'current'    => 500,
						'previous'   => 480,
						'sharePct'   => 12.5,
						'shareBasis' => $share_basis,
						'attributes' => array(),
					),
					array( 'GROSS_CHANGE', 'NET_CHANGE', 'SITE_TRAFFIC', 'VOLUME', 'PARENT_CHANNEL' )
				),
			)
		);

		$this->assertSame(
			array(
				array( 0, 0, 500, 480, 12.5, null, 0 ),
				array( 0, 0, 500, 480, 12.5, null, 1 ),
				array( 0, 0, 500, 480, 12.5, null, 2 ),
				array( 0, 0, 500, 480, 12.5, null, 3 ),
				array( 0, 0, 500, 480, 12.5, null, 4 ),
			),
			$encoded[ Wire_Format::MEMBER_KEY_FACTORS ],
			'Each basis should travel as its position, `GROSS_CHANGE` 0, `NET_CHANGE` 1, `SITE_TRAFFIC` 2, `VOLUME` 3 and `PARENT_CHANNEL` 4, after a null in place of the path a channel\'s card has none of.'
		);
	}

	public function test_encode__writes_the_channel_a_card_on_parent_channel_took_the_place_of_after_its_basis() {
		$encoded = $this->encode_as_sent(
			array(
				'keyFactors' => array(
					array(
						'kind'                => 'REFERRING_SITE',
						'label'               => 'news.example',
						'current'             => 220,
						'previous'            => 0,
						'sharePct'            => 73.3,
						'shareBasis'          => 'PARENT_CHANNEL',
						'parentChannel'       => 'Referral',
						'parentChannelChange' => 300,
						'attributes'          => array(),
					),
				),
			)
		);

		$this->assertSame(
			array( array( 3, 0, 220, 0, 73.3, null, 4, 1, 300 ) ),
			$encoded[ Wire_Format::MEMBER_KEY_FACTORS ],
			'The channel should travel through the string table, followed by its change.'
		);
		$this->assertSame( array( 'news.example', 'Referral' ), $encoded[ Wire_Format::MEMBER_STRINGS ], 'The channel should be in the string table.' );
	}

	public function test_encode__leaves_out_the_channel_of_a_card_on_another_basis_and_a_basis_the_format_does_not_list() {
		$encoded = $this->encode_as_sent(
			array(
				'keyFactors' => array(
					array(
						'kind'                => 'CHANNEL',
						'label'               => 'Referral',
						'current'             => 800,
						'previous'            => 500,
						'sharePct'            => 100.0,
						'shareBasis'          => 'GROSS_CHANGE',
						'parentChannel'       => 'Direct',
						'parentChannelChange' => 40,
						'attributes'          => array(),
					),
					array(
						'kind'       => 'CHANNEL',
						'label'      => 'Email',
						'current'    => 80,
						'previous'   => 50,
						'sharePct'   => 10.0,
						'shareBasis' => 'CLICKS',
						'attributes' => array(),
					),
				),
			)
		);

		$this->assertSame(
			array(
				array( 0, 0, 800, 500, 100, null, 0 ),
				array( 0, 1, 80, 50, 10 ),
			),
			$encoded[ Wire_Format::MEMBER_KEY_FACTORS ],
			'A channel should travel only with a share of its change, and a basis the format does not list should be left out with the null before it.'
		);
		$this->assertSame( array( 'Referral', 'Email' ), $encoded[ Wire_Format::MEMBER_STRINGS ], 'A channel left out should add nothing to the string table.' );
	}

	public function test_encode__marks_a_card_whose_change_was_spread_across_many_pages_after_its_parent_channel_and_leaves_the_mark_out_otherwise() {
		$encoded = $this->encode_as_sent(
			array(
				'keyFactors' => array(
					array(
						'kind'              => 'CHANNEL',
						'label'             => 'Organic Search',
						'current'           => 1169,
						'previous'          => 1000,
						'sharePct'          => 100.0,
						'shareBasis'        => 'GROSS_CHANGE',
						'spreadAcrossPages' => true,
						'attributes'        => array(),
					),
					array(
						'kind'              => 'CHANNEL',
						'label'             => 'Direct',
						'current'           => 500,
						'previous'          => 480,
						'sharePct'          => 12.5,
						'shareBasis'        => 'GROSS_CHANGE',
						'spreadAcrossPages' => false,
						'attributes'        => array(),
					),
				),
			)
		);

		$this->assertSame(
			array(
				array( 0, 0, 1169, 1000, 100, null, 0, null, null, true ),
				array( 0, 1, 500, 480, 12.5, null, 0 ),
			),
			$encoded[ Wire_Format::MEMBER_KEY_FACTORS ],
			'Only the card whose change was spread across many pages should carry `true`, after nulls in place of the parent channel it has none of.'
		);
	}

	public function test_encode__marks_an_oversized_attribute_after_its_share_and_leaves_the_mark_out_otherwise() {
		$encoded = $this->encode_as_sent(
			array(
				'keyFactors' => array(
					array(
						'kind'       => 'CHANNEL',
						'label'      => 'Direct',
						'current'    => 3280,
						'previous'   => 2000,
						'sharePct'   => 64.5,
						'shareBasis' => 'GROSS_CHANGE',
						'attributes' => array(
							array(
								'kind'      => 'DEVICE',
								'label'     => 'desktop',
								'current'   => 2643,
								'previous'  => 1000,
								'sharePct'  => 0.0,
								'oversized' => true,
							),
							array(
								'kind'      => 'DEVICE',
								'label'     => 'mobile',
								'current'   => 638,
								'previous'  => 1000,
								'sharePct'  => 0.0,
								'oversized' => false,
							),
						),
					),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					array( 6, 1, 2643, 1000, 0, true ),
					array( 6, 2, 638, 1000, 0 ),
				),
			),
			$encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ],
			'Only the attribute that moved further than its card should carry `true` after its share.'
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
							array( 'TRAFFIC_CHANNEL', 'LANDING_PAGE', 'SEARCH_KEYWORD', 'REFERRING_SITE', 'PLATFORM', 'CAMPAIGN', 'DEVICE', 'USER_TYPE', 'ASSISTANT' )
						),
					),
					array( 'CHANNEL', 'CONTENT', 'SEARCH_KEYWORD', 'REFERRING_SITE', 'CAMPAIGN', 'CHANNEL_GROUP' )
				),
			)
		);

		$this->assertSame(
			array( 0, 1, 2, 3, 4, 5 ),
			array_column( $encoded[ Wire_Format::MEMBER_KEY_FACTORS ], 0 ),
			'Each driver kind should travel as its position: `CHANNEL` 0, `CONTENT` 1, `SEARCH_KEYWORD` 2, `REFERRING_SITE` 3, `CAMPAIGN` 4 and `CHANNEL_GROUP` 5.'
		);
		$this->assertSame(
			array( 0, 1, 2, 3, 4, 5, 6, 7, 8 ),
			array_column( $encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ][0], 0 ),
			'Each attribute kind should travel as its position: `TRAFFIC_CHANNEL` 0, `LANDING_PAGE` 1, `SEARCH_KEYWORD` 2, `REFERRING_SITE` 3, `PLATFORM` 4, `CAMPAIGN` 5, `DEVICE` 6, `USER_TYPE` 7 and `ASSISTANT` 8.'
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

	public function test_encode__writes_the_availability_as_its_fields_in_the_order_of_the_wire_format() {
		$response                 = $this->get_fixture_response();
		$response['availability'] = array(
			'range_too_short'               => true,
			'band_available'                => false,
			'band_available_from'           => '2025-08-25',
			'key_factors_available'         => false,
			'key_factors_available_from'    => '2025-08-29',
			'insight_request_allowed'       => false,
			'performance_insight_available' => false,
			'last_year_available'           => true,
			'range_too_long'                => true,
		);

		$availability = $this->encode_as_sent( $response )[ Wire_Format::MEMBER_AVAILABILITY ];

		$this->assertSame(
			array( true, false, 7, false, 11, false, false, true, true ),
			$availability,
			'The availability should be encoded as its flags, and its days as their offsets from `2025-08-18`.'
		);
		$this->assertTrue( $availability[ Wire_Format::AVAILABILITY_RANGE_TOO_SHORT ], '`range_too_short` should be encoded at its position.' );
		$this->assertSame( 7, $availability[ Wire_Format::AVAILABILITY_BAND_AVAILABLE_FROM ], '`band_available_from` should be encoded at its position.' );
		$this->assertSame( 11, $availability[ Wire_Format::AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM ], '`key_factors_available_from` should be encoded at its position.' );
		$this->assertTrue( $availability[ Wire_Format::AVAILABILITY_LAST_YEAR_AVAILABLE ], '`last_year_available` should be encoded at its position.' );
		$this->assertTrue( $availability[ Wire_Format::AVAILABILITY_RANGE_TOO_LONG ], '`range_too_long` should be encoded at its position.' );
	}

	/**
	 * @dataProvider data_availability_days
	 *
	 * @param string $date       A day of the availability, as `YYYY-MM-DD`.
	 * @param int    $day_offset The number of days from the first plotted day, `2025-08-18`, to that day.
	 */
	public function test_encode__writes_each_day_of_the_availability_as_its_offset_from_the_first_plotted_day( $date, $day_offset ) {
		$response = $this->get_fixture_response();

		$response['availability']['band_available_from']        = $date;
		$response['availability']['key_factors_available_from'] = $date;

		$availability = $this->encoder->encode( $response )[ Wire_Format::MEMBER_AVAILABILITY ];

		$this->assertSame( $day_offset, $availability[ Wire_Format::AVAILABILITY_BAND_AVAILABLE_FROM ], "A `band_available_from` of `$date` should be encoded as $day_offset days from `2025-08-18`." );
		$this->assertSame( $day_offset, $availability[ Wire_Format::AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM ], "A `key_factors_available_from` of `$date` should be encoded as $day_offset days from `2025-08-18`." );
	}

	public function data_availability_days() {
		return array(
			'18 days before the first plotted day' => array( '2025-07-31', -18 ),
			'on the first plotted day'             => array( '2025-08-18', 0 ),
			'5 days after the first plotted day'   => array( '2025-08-23', 5 ),
		);
	}

	public function test_encode__writes_null_as_a_day_of_the_availability_when_there_is_none() {
		$response = $this->get_fixture_response();

		$response['availability']['band_available_from']        = null;
		$response['availability']['key_factors_available_from'] = null;

		$availability = $this->encoder->encode( $response )[ Wire_Format::MEMBER_AVAILABILITY ];

		$this->assertNull( $availability[ Wire_Format::AVAILABILITY_BAND_AVAILABLE_FROM ], 'A `band_available_from` of null should be encoded as null.' );
		$this->assertNull( $availability[ Wire_Format::AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM ], 'A `key_factors_available_from` of null should be encoded as null.' );
	}

	public function test_encode__writes_every_part_as_unavailable_when_the_response_has_no_availability() {
		$response = $this->get_fixture_response();

		unset( $response['availability'] );

		$this->assertSame(
			array( false, false, null, false, null, false, false, false, false ),
			$this->encoder->encode( $response )[ Wire_Format::MEMBER_AVAILABILITY ],
			'A response with no `availability` should encode every flag as false and every day as null.'
		);
	}

	public function test_encode__writes_an_empty_expected_range_and_no_availability_day_for_an_empty_daily_series() {
		$response = $this->get_fixture_response();

		$encoded = $this->encode_as_sent(
			array(
				'dailyTraffic' => array(),
				'availability' => $response['availability'],
			)
		);

		$this->assertCount( 12, $encoded, 'The encoded response should have twelve members.' );
		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_DAILY_EXPECTED_RANGES ], 'An empty `dailyTraffic` should give an empty list of expected ranges.' );
		$this->assertSame(
			array( false, false, null, true, null, true, false, false, false ),
			$encoded[ Wire_Format::MEMBER_AVAILABILITY ],
			'With no first plotted day to count from, the days of the availability should be encoded as null, and its flags as they are.'
		);
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

	public function test_encode__writes_twelve_members_for_a_response_without_an_insight_payload() {
		$response                  = $this->get_fixture_response();
		$response['insightLocale'] = 'de_DE';

		$encoded = $this->encode_as_sent( $response );

		$this->assertCount( 12, $encoded, 'A response without `insightPayload` should keep its twelve members, even with a locale.' );
		$this->assertArrayNotHasKey( Wire_Format::MEMBER_INSIGHT_LOCALE, $encoded, 'A response without `insightPayload` should have no insight locale member.' );
		$this->assertArrayNotHasKey( Wire_Format::MEMBER_INSIGHT_PAYLOAD, $encoded, 'A response without `insightPayload` should have no insight payload member.' );
	}

	public function test_encode__writes_the_insight_locale_and_the_insight_payload_as_members_12_and_13() {
		$response                   = $this->get_fixture_response();
		$response['insightLocale']  = 'de_DE_formal';
		$response['insightPayload'] = 'eyJsb2NhbGUiOiJkZV9ERV9mb3JtYWwifQ.c2lnbmF0dXJl';

		$encoded = $this->encode_as_sent( $response );

		$this->assertCount( 14, $encoded, 'A response with `insightPayload` should have fourteen members.' );
		// The browser reads the members by their positions, so the positions
		// are named here rather than read from `Wire_Format`.
		$this->assertSame( range( 0, 13 ), array_keys( $encoded ), 'The response should stay a list, so it is sent as a JSON array.' );
		$this->assertSame( 'de_DE_formal', $encoded[12], 'The locale of the insight should be at position 12.' );
		$this->assertSame( 'eyJsb2NhbGUiOiJkZV9ERV9mb3JtYWwifQ.c2lnbmF0dXJl', $encoded[13], 'The payload should be at position 13.' );
		$this->assertSame( 'de_DE_formal', $encoded[ Wire_Format::MEMBER_INSIGHT_LOCALE ], 'Member 12 should be the locale of the insight, as it is.' );
		$this->assertSame( 'eyJsb2NhbGUiOiJkZV9ERV9mb3JtYWwifQ.c2lnbmF0dXJl', $encoded[ Wire_Format::MEMBER_INSIGHT_PAYLOAD ], 'Member 13 should be the payload, as it is.' );
		$this->assertSame(
			$this->encode_as_sent( $this->get_fixture_response() ),
			array_slice( $encoded, 0, 12 ),
			'The first twelve members should be the same as those of the response without the insight members.'
		);
		$this->assertNotContains( 'de_DE_formal', $encoded[ Wire_Format::MEMBER_STRINGS ], 'The locale should not be added to the string table.' );
	}

	public function test_encode__writes_null_as_the_insight_payload_when_there_is_no_insight_to_request() {
		$response                   = $this->get_fixture_response();
		$response['insightLocale']  = 'de_DE';
		$response['insightPayload'] = null;

		$encoded = $this->encode_as_sent( $response );

		$this->assertCount( 14, $encoded, 'A response with a null `insightPayload` should still have fourteen members.' );
		$this->assertSame( 'de_DE', $encoded[ Wire_Format::MEMBER_INSIGHT_LOCALE ], 'Member 12 should be the locale of the insight.' );
		$this->assertNull( $encoded[ Wire_Format::MEMBER_INSIGHT_PAYLOAD ], 'Member 13 should be null when there is no insight to request.' );
	}

	public function test_encode__writes_null_as_the_insight_locale_when_the_response_has_none() {
		$response                   = $this->get_fixture_response();
		$response['insightPayload'] = 'eyJsb2NhbGUiOiJkZV9ERSJ9.c2lnbmF0dXJl';

		$encoded = $this->encode_as_sent( $response );

		$this->assertNull( $encoded[ Wire_Format::MEMBER_INSIGHT_LOCALE ], 'Member 12 should be null for a response without `insightLocale`.' );
		$this->assertSame( 'eyJsb2NhbGUiOiJkZV9ERSJ9.c2lnbmF0dXJl', $encoded[ Wire_Format::MEMBER_INSIGHT_PAYLOAD ], 'Member 13 should be the payload.' );
	}

	public function test_encode__writes_each_content_marker_as_its_day_offset_followed_by_its_posts() {
		$response                   = $this->get_fixture_response();
		$response['contentMarkers'] = array(
			array(
				'date'  => '2025-08-18',
				'posts' => array(
					array(
						'title' => 'Mulching in autumn',
						'url'   => '/mulching-in-autumn/',
					),
				),
			),
			array(
				'date'  => '2025-08-21',
				'posts' => array(
					array(
						'title' => 'How to plant garlic',
						'url'   => '/how-to-plant-garlic/',
					),
					array(
						'title' => 'Storing garlic',
						'url'   => '/storing-garlic/',
					),
				),
			),
		);

		$encoded = $this->encode_as_sent( $response );
		$strings = $encoded[ Wire_Format::MEMBER_STRINGS ];

		$this->assertSame(
			array(
				array( 0, array( 'Mulching in autumn', '/mulching-in-autumn/' ) ),
				array( 3, array( 'How to plant garlic', '/how-to-plant-garlic/' ), array( 'Storing garlic', '/storing-garlic/' ) ),
			),
			array_map(
				fn( $marker ) => array_merge(
					array( $marker[0] ),
					array_map(
						fn( $post ) => array( $strings[ $post[0] ], $strings[ $post[1] ] ),
						array_slice( $marker, 1 )
					)
				),
				$encoded[ Wire_Format::MEMBER_CONTENT_MARKERS ]
			),
			'Each marker should be its day as an offset from `2025-08-18`, then each of its posts in order, with its title and its path from the string table.'
		);
		$this->assertSame(
			array( 1, 1 ),
			array( $encoded[ Wire_Format::MEMBER_KEY_FACTORS ][2][1], $encoded[ Wire_Format::MEMBER_CONTENT_MARKERS ][1][1][1] ),
			'The `CONTENT` card and the post with the same path should carry the same string index, which the cards kept before the markers added their strings.'
		);
	}

	public function test_encode__leaves_out_a_content_marker_without_posts_or_without_a_day_to_count_from() {
		$response                   = $this->get_fixture_response();
		$response['contentMarkers'] = array(
			array(
				'date'  => '2025-08-19',
				'posts' => array(),
			),
			array(
				'posts' => array(
					array(
						'title' => 'Undated',
						'url'   => '/undated/',
					),
				),
			),
		);

		$encoded = $this->encode_as_sent( $response );

		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_CONTENT_MARKERS ], 'A marker with no posts, and a marker with no date, should be left out.' );
		$this->assertNotContains( 'Undated', $encoded[ Wire_Format::MEMBER_STRINGS ], 'The post of a marker that is left out should not be added to the string table.' );
	}

	public function test_encode__writes_no_content_markers_without_a_first_plotted_day() {
		$encoded = $this->encode_as_sent(
			array(
				'dailyTraffic'   => array(),
				'contentMarkers' => array(
					array(
						'date'  => '2025-08-20',
						'posts' => array(
							array(
								'title' => 'How to plant garlic',
								'url'   => '/how-to-plant-garlic/',
							),
						),
					),
				),
			)
		);

		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_CONTENT_MARKERS ], 'With no first plotted day to count from, no marker should be written.' );
	}

	public function test_encode__writes_an_empty_content_markers_member_for_a_response_without_them() {
		$response = $this->get_fixture_response();
		unset( $response['contentMarkers'] );

		$encoded = $this->encode_as_sent( $response );

		$this->assertCount( 12, $encoded, 'A response without `contentMarkers` should still have twelve members.' );
		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_CONTENT_MARKERS ], 'Member 9 should be an empty list.' );
	}

	public function test_encode__writes_whether_traffic_was_steady_as_member_10() {
		$response                  = $this->get_fixture_response();
		$response['steadyTraffic'] = true;

		$encoded = $this->encode_as_sent( $response );

		// The browser reads the members by their positions, so the position is
		// named here rather than read from `Wire_Format`.
		$this->assertTrue( $encoded[10], 'Member 10 should be true for a steady period.' );
		$this->assertSame( 10, Wire_Format::MEMBER_STEADY_TRAFFIC, 'The steady traffic member should be member 10.' );

		$response['steadyTraffic'] = false;

		$this->assertFalse( $this->encode_as_sent( $response )[10], 'Member 10 should be false for a period that is not steady.' );

		unset( $response['steadyTraffic'] );

		$this->assertFalse( $this->encode_as_sent( $response )[10], 'Member 10 should be false for a response without `steadyTraffic`.' );
	}

	public function test_encode__writes_the_days_the_band_is_fitted_on_as_member_11() {
		$response                      = $this->get_fixture_response();
		$response['bandReferenceDays'] = 364;

		$encoded = $this->encode_as_sent( $response );

		// The browser reads the members by their positions, so the position is
		// named here rather than read from `Wire_Format`.
		$this->assertSame( 364, $encoded[11], 'Member 11 should be the number of days the band is fitted on.' );
		$this->assertSame( 11, Wire_Format::MEMBER_BAND_REFERENCE_DAYS, 'The band reference days member should be member 11.' );

		$response['bandReferenceDays'] = null;

		$this->assertNull( $this->encode_as_sent( $response )[11], 'Member 11 should be null for a period without a band.' );

		unset( $response['bandReferenceDays'] );

		$this->assertNull( $this->encode_as_sent( $response )[11], 'Member 11 should be null for a response without `bandReferenceDays`.' );
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
