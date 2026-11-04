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
			'visits'       => array(
				'current'  => 412,
				'previous' => 388,
			),
			'dailyTraffic' => array(
				array(
					'date'   => '2025-08-18',
					'visits' => 132,
				),
				array(
					'date'   => '2025-08-19',
					'visits' => 0,
				),
				array(
					'date'   => '2025-08-20',
					'visits' => 147,
				),
				array(
					'date'   => '2025-08-21',
					'visits' => 96,
				),
			),
			'keyFactors'   => array(
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

	public function test_encode__rounds_shares_and_writes_every_other_number_as_an_integer() {
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
