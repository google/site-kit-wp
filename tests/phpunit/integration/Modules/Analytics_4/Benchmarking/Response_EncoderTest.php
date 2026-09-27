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
			'visitors'       => array(
				'current'  => 412,
				'previous' => 388,
			),
			'dailyTraffic'   => array(
				array(
					'date'     => '2025-08-18',
					'visitors' => 132,
				),
				array(
					'date'     => '2025-08-19',
					'visitors' => 0,
				),
				array(
					'date'     => '2025-08-20',
					'visitors' => 147,
				),
				array(
					'date'     => '2025-08-21',
					'visitors' => 96,
				),
			),
			'dimensions'     => array( 'CONTENT', 'SEARCH_QUERIES', 'REFERRERS', 'CHANNELS' ),
			'contextualData' => array(
				'content'       => array(
					array(
						'url'              => '/how-to-plant-garlic/',
						'title'            => 'How to plant garlic',
						'visitors'         => 96,
						'publishedDaysAgo' => 14,
					),
					array(
						'url'              => '/mulching-in-autumn/',
						'title'            => null,
						'visitors'         => 0,
						'publishedDaysAgo' => 3,
					),
				),
				'searchQueries' => array(
					array(
						'label'            => 'how to plant garlic',
						'current'          => 74,
						'previous'         => 31,
						'positionCurrent'  => 8.4,
						'positionPrevious' => 14.2,
					),
					array(
						'label'            => 'mulching',
						'current'          => 12,
						'previous'         => 0,
						'positionCurrent'  => 3.5,
						'positionPrevious' => null,
					),
				),
				'referrers'     => array(
					array(
						'label'    => 'garden.example.com',
						'current'  => 58,
						'previous' => 44,
					),
					array(
						'label'    => '/how-to-plant-garlic/',
						'current'  => 21,
						'previous' => 19,
					),
				),
				'channels'      => array(
					array(
						'label'    => 'Organic Search',
						'current'  => 210,
						'previous' => 168,
					),
					array(
						'label'    => 'Direct',
						'current'  => 132,
						'previous' => 120,
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

	public function test_encode__keys_the_dimension_rows_by_index_for_one_dimension() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic'   => array(
					array(
						'date'     => '2025-08-18',
						'visitors' => 1,
					),
				),
				'dimensions'     => array( 'CHANNELS' ),
				'contextualData' => array(
					'channels' => array(
						array(
							'label'    => 'Organic Search',
							'current'  => 1,
							'previous' => 1,
						),
					),
				),
			)
		);

		$sent = json_decode( wp_json_encode( $encoded ) );

		$this->assertIsObject(
			$sent[ Wire_Format::MEMBER_DIMENSION_ROWS ],
			'The dimension rows should travel keyed by index, not as a list, whatever dimensions the response carries.'
		);
	}

	public function test_encode__reads_every_dimension_from_its_contextual_data_key() {
		$value_row = array(
			'label'    => 'a label',
			'current'  => 1,
			'previous' => 2,
		);

		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic'   => array(
					array(
						'date'     => '2025-08-18',
						'visitors' => 1,
					),
				),
				'dimensions'     => array_keys( Wire_Format::DIMENSION_INDEXES ),
				'contextualData' => array(
					'channels'      => array( $value_row ),
					'devices'       => array( $value_row ),
					'visitorMix'    => array( $value_row ),
					'referrers'     => array( $value_row ),
					'categories'    => array( $value_row ),
					'searchQueries' => array(
						$value_row + array(
							'positionCurrent'  => 3.5,
							'positionPrevious' => 4.5,
						),
					),
					'content'       => array(
						array(
							'url'              => '/a-post/',
							'title'            => 'A post',
							'visitors'         => 1,
							'publishedDaysAgo' => 2,
						),
					),
				),
			)
		);

		$rows = (array) $encoded[ Wire_Format::MEMBER_DIMENSION_ROWS ];

		$this->assertSame(
			array_values( Wire_Format::DIMENSION_INDEXES ),
			$encoded[ Wire_Format::MEMBER_DIMENSION_ORDER ],
			'Every dimension should travel as its own index, in the order it was given.'
		);

		foreach ( Wire_Format::DIMENSION_INDEXES as $code => $index ) {
			$this->assertCount(
				1,
				$rows[ $index ],
				sprintf( 'The %s row should be read from that dimension\'s own contextualData key.', $code )
			);
		}
	}

	public function test_encode__writes_a_shared_string_once() {
		$encoded = $this->encoder->encode( $this->get_fixture_response() );
		$strings = $encoded[ Wire_Format::MEMBER_STRINGS ];
		$rows    = (array) $encoded[ Wire_Format::MEMBER_DIMENSION_ROWS ];

		$content_url_index    = $rows[ Wire_Format::DIMENSION_INDEXES['CONTENT'] ][0][0];
		$referrer_label_index = $rows[ Wire_Format::DIMENSION_INDEXES['REFERRERS'] ][1][0];

		$this->assertSame( $content_url_index, $referrer_label_index, 'Both rows should carry the same string index.' );
		$this->assertSame(
			array( '/how-to-plant-garlic/' ),
			array_values( array_filter( $strings, fn( $value ) => '/how-to-plant-garlic/' === $value ) ),
			'The shared string should be in the table once.'
		);
	}

	public function test_encode__keeps_a_null_label_null_and_a_zero_count_zero() {
		$response = array(
			'dailyTraffic'   => array(
				array(
					'date'     => '2025-08-18',
					'visitors' => 0,
				),
			),
			'dimensions'     => array( 'CHANNELS' ),
			'contextualData' => array(
				'channels' => array(
					array(
						'label'    => null,
						'current'  => 0,
						'previous' => 4,
					),
				),
			),
		);

		$encoded = $this->encoder->encode( $response );
		$row     = ( (array) $encoded[ Wire_Format::MEMBER_DIMENSION_ROWS ] )[ Wire_Format::DIMENSION_INDEXES['CHANNELS'] ][0];

		$this->assertSame( array( null, 0, 4 ), $row, 'A null label should stay null, and a zero count should stay zero.' );
		$this->assertSame( array(), $encoded[ Wire_Format::MEMBER_STRINGS ], 'A null label should add nothing to the string table.' );
		$this->assertSame( array( 0 ), $encoded[ Wire_Format::MEMBER_DAILY_VISITORS ], 'A day with no visitors should stay zero.' );
	}

	public function test_encode__writes_null_for_a_daily_row_that_carries_no_count() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic'   => array(
					array( 'date' => '2025-08-18' ),
					array(
						'date'     => '2025-08-19',
						'visitors' => 7,
					),
				),
				'dimensions'     => array(),
				'contextualData' => array(),
			)
		);

		$this->assertSame(
			array( null, 7 ),
			$encoded[ Wire_Format::MEMBER_DAILY_VISITORS ],
			'A day the report gave no count for should encode as null, without raising a PHP warning.'
		);
	}

	public function test_encode__writes_no_first_date_for_a_daily_row_that_carries_none() {
		$encoded = $this->encoder->encode(
			array(
				'dailyTraffic'   => array( array( 'visitors' => 7 ) ),
				'dimensions'     => array(),
				'contextualData' => array(),
			)
		);

		$this->assertNull(
			$encoded[ Wire_Format::MEMBER_FIRST_DATE ],
			'A first row with no date should encode as null, without raising a PHP warning.'
		);
	}

	public function test_encode__rounds_positions_and_writes_every_other_number_as_an_integer() {
		$response = array(
			'dailyTraffic'   => array(
				array(
					'date'     => '2025-08-18',
					'visitors' => 132.6,
				),
			),
			'visitors'       => array(
				'current'  => 412.4,
				'previous' => 388.5,
			),
			'dimensions'     => array( 'SEARCH_QUERIES' ),
			'contextualData' => array(
				'searchQueries' => array(
					array(
						'label'            => 'how to plant garlic',
						'current'          => 74.7,
						'previous'         => 31.2,
						'positionCurrent'  => 8.44,
						'positionPrevious' => 14.25,
					),
				),
			),
		);

		$encoded = $this->encoder->encode( $response );
		$row     = ( (array) $encoded[ Wire_Format::MEMBER_DIMENSION_ROWS ] )[ Wire_Format::DIMENSION_INDEXES['SEARCH_QUERIES'] ][0];

		$this->assertSame( 8.4, $row[3], 'An average position should be rounded to one decimal place.' );
		$this->assertSame( 14.3, $row[4], 'An average position should be rounded to one decimal place.' );
		$this->assertSame( array( 0, 74, 31 ), array_slice( $row, 0, 3 ), 'Every other number in a row should be an integer.' );
		$this->assertSame( array( 132 ), $encoded[ Wire_Format::MEMBER_DAILY_VISITORS ], 'A daily count should be an integer.' );
		$this->assertSame( array( 412, 388 ), $encoded[ Wire_Format::MEMBER_VISITOR_TOTALS ], 'The period totals should be integers.' );
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
			'The first plotted day should be the first row of the daily series.'
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
