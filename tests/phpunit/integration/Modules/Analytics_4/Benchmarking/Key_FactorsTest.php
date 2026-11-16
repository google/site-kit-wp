<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Key_FactorsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Key_Factors;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Key_FactorsTest extends TestCase {

	/**
	 * Gets a `channelBreakdowns` row.
	 *
	 * @param string $channel   The channel.
	 * @param int    $previous  The visits of the compare period.
	 * @param int    $current   The visits of the selected period.
	 * @param string $device    Optional. The device. Default `desktop`.
	 * @param string $user_type Optional. The visitor type. Default `returning`.
	 * @return array The row.
	 */
	private function get_breakdown( $channel, $previous, $current, $device = 'desktop', $user_type = 'returning' ) {
		return array(
			'channel'  => $channel,
			'device'   => $device,
			'userType' => $user_type,
			'current'  => $current,
			'previous' => $previous,
		);
	}

	/**
	 * Gets a row of a breakdown with one more field than the channel, such as
	 * a `channelPages` row.
	 *
	 * @param string $channel  The channel.
	 * @param string $field    The field, such as `page`.
	 * @param string $value    The value of the field.
	 * @param int    $previous The visits of the compare period.
	 * @param int    $current  The visits of the selected period.
	 * @return array The row.
	 */
	private function get_channel_row( $channel, $field, $value, $previous, $current ) {
		return array(
			'channel'  => $channel,
			$field     => $value,
			'current'  => $current,
			'previous' => $previous,
		);
	}

	/**
	 * Gets a row with a label, such as a `searchQueries` row.
	 *
	 * @param string $label    The label.
	 * @param int    $previous The visits, or clicks, of the compare period.
	 * @param int    $current  The visits, or clicks, of the selected period.
	 * @return array The row.
	 */
	private function get_row( $label, $previous, $current ) {
		return array(
			'label'    => $label,
			'current'  => $current,
			'previous' => $previous,
		);
	}

	/**
	 * Gets the kind and the label of each driver.
	 *
	 * @param array $drivers The drivers.
	 * @return array List of `KIND label` strings.
	 */
	private function get_driver_names( array $drivers ) {
		return array_map(
			fn( $driver ) => "{$driver['kind']} {$driver['label']}",
			$drivers
		);
	}

	public function test_select_drivers__keeps_the_3_channels_that_explain_most_of_the_site_change() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 400, 600 ),
					$this->get_breakdown( 'Direct', 300, 380 ),
					$this->get_breakdown( 'Referral', 100, 160 ),
					$this->get_breakdown( 'Email', 100, 110 ),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'kind'     => 'CHANNEL',
					'label'    => 'Organic Search',
					'current'  => 600,
					'previous' => 400,
					'sharePct' => 57.1,
				),
				array(
					'kind'     => 'CHANNEL',
					'label'    => 'Direct',
					'current'  => 380,
					'previous' => 300,
					'sharePct' => 22.9,
				),
				array(
					'kind'     => 'CHANNEL',
					'label'    => 'Referral',
					'current'  => 160,
					'previous' => 100,
					'sharePct' => 17.1,
				),
			),
			$key_factors->select_drivers(),
			'The 3 highest scoring channels should be the drivers, each with its share of the 350 visits the channels gained, and `Email` should be left out.'
		);
	}

	public function test_select_drivers__adds_up_a_channel_across_its_devices_and_visitor_types() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 100, 150, 'mobile', 'new' ),
					$this->get_breakdown( 'Organic Search', 100, 150, 'desktop', 'returning' ),
					$this->get_breakdown( 'Direct', 500, 500 ),
				),
			)
		);

		$drivers = $key_factors->select_drivers();

		$this->assertSame( array( 'CHANNEL Organic Search' ), $this->get_driver_names( $drivers ), 'Only `Organic Search` should be a driver, since `Direct` did not change.' );
		$this->assertSame( array( 200, 300 ), array( $drivers[0]['previous'], $drivers[0]['current'] ), 'The `Organic Search` driver should add up the visits of its two rows.' );
	}

	public function test_select_drivers__returns_no_drivers_without_rows() {
		$this->assertSame( array(), ( new Key_Factors( array() ) )->select_drivers(), 'There should be no drivers without rows.' );
	}

	public function test_select_drivers__does_not_name_a_placeholder_value() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 400, 600 ),
					$this->get_breakdown( 'Direct', 300, 300 ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Organic Search', 'page', '(not set)', 100, 300 ),
					$this->get_channel_row( 'Organic Search', 'page', '/raised-beds/', 300, 300 ),
				),
				'channelCampaigns'  => array(
					$this->get_channel_row( 'Organic Search', 'campaign', '(organic)', 400, 600 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Organic Search' ), $this->get_driver_names( $key_factors->select_drivers() ), 'The `(not set)` page and the `(organic)` campaign should not be drivers, and should leave `Organic Search` a driver.' );
	}

	public function test_select_drivers__names_a_landing_page_with_10_visits_and_15_percent_of_the_site_change_in_place_of_its_channel() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 400, 600 ),
					$this->get_breakdown( 'Direct', 300, 380 ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Organic Search', 'page', '/plant-garlic/', 50, 150 ),
					$this->get_channel_row( 'Organic Search', 'page', '/a/', 70, 90 ),
					$this->get_channel_row( 'Organic Search', 'page', '/b/', 70, 90 ),
					$this->get_channel_row( 'Organic Search', 'page', '/c/', 70, 90 ),
					$this->get_channel_row( 'Organic Search', 'page', '/d/', 70, 90 ),
					$this->get_channel_row( 'Organic Search', 'page', '/e/', 70, 90 ),
				),
			)
		);

		$drivers = $key_factors->select_drivers();

		$this->assertSame( array( 'CONTENT /plant-garlic/', 'CHANNEL Direct' ), $this->get_driver_names( $drivers ), 'The `/plant-garlic/` page, with 35.7% of the change, should be a driver in place of `Organic Search`, and the pages that gained 20 visits each should not be drivers.' );
		$this->assertSame( 35.7, $drivers[0]['sharePct'], 'The page should have 100 of the 280 visits the channels gained.' );
	}

	public function test_select_drivers__keeps_the_channel_when_its_landing_page_has_under_15_percent_of_the_site_change() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 400, 600 ),
					$this->get_breakdown( 'Direct', 300, 380 ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Organic Search', 'page', '/plant-garlic/', 100, 140 ),
					$this->get_channel_row( 'Organic Search', 'page', '/raised-beds/', 300, 460 ),
				),
			)
		);

		$this->assertNotContains( 'CONTENT /plant-garlic/', $this->get_driver_names( $key_factors->select_drivers() ), 'The `/plant-garlic/` page, with 14.3% of the change, should not be a driver.' );
	}

	public function test_select_drivers__keeps_the_channel_when_its_landing_page_changed_by_under_10_visits() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 40, 48 ),
					$this->get_breakdown( 'Direct', 50, 50 ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Organic Search', 'page', '/plant-garlic/', 2, 10 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Organic Search' ), $this->get_driver_names( $key_factors->select_drivers() ), 'The `/plant-garlic/` page, which gained 8 visits, should not be a driver, even with all of the change.' );
	}

	public function test_select_drivers__keeps_the_channel_of_a_landing_page_that_moved_against_it() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Direct', 1900, 5300 ),
					$this->get_breakdown( 'Organic Search', 320, 130 ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Direct', 'page', '/', 630, 320 ),
				),
			)
		);

		$drivers = $key_factors->select_drivers();

		$this->assertSame( array( 'CHANNEL Direct', 'CONTENT /', 'CHANNEL Organic Search' ), $this->get_driver_names( $drivers ), 'The `/` page fell while `Direct` grew, so `Direct` should stay a driver next to it.' );
		$this->assertSame( 100.0, $drivers[1]['sharePct'], 'The `/` page lost more visits than the 190 the channels lost, so its share should be cut at 100%.' );
	}

	public function test_select_drivers__names_a_search_keyword_in_place_of_organic_search() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 400, 600 ),
					$this->get_breakdown( 'Direct', 300, 380 ),
				),
				'searchQueries'     => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 120,
						'previous'         => 20,
						'positionCurrent'  => 2.1,
						'positionPrevious' => 8.4,
					),
				),
			)
		);

		$this->assertSame( array( 'SEARCH_KEYWORD plant garlic', 'CHANNEL Direct' ), $this->get_driver_names( $key_factors->select_drivers() ), 'The `plant garlic` search keyword should be a driver in place of `Organic Search`.' );
	}

	public function test_select_drivers__counts_the_sources_of_facebook_as_one_referring_site() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Social', 100, 190 ),
					$this->get_breakdown( 'Direct', 500, 700 ),
				),
				'channelSources'    => array(
					$this->get_channel_row( 'Organic Social', 'source', 'm.facebook.com', 30, 60 ),
					$this->get_channel_row( 'Organic Social', 'source', 'facebook.com', 40, 70 ),
					$this->get_channel_row( 'Organic Social', 'source', 'l.facebook.com', 20, 50 ),
					$this->get_channel_row( 'Organic Social', 'source', 'x.com', 10, 10 ),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'kind'     => 'CHANNEL',
					'label'    => 'Direct',
					'current'  => 700,
					'previous' => 500,
					'sharePct' => 69.0,
				),
				array(
					'kind'     => 'REFERRING_SITE',
					'label'    => 'Facebook',
					'current'  => 180,
					'previous' => 90,
					'sharePct' => 31.0,
					'sources'  => array( 'facebook.com', 'l.facebook.com', 'm.facebook.com' ),
				),
			),
			$key_factors->select_drivers(),
			'The three Facebook sources, each with 10.3% of the change, should be one referring site with 31%, in place of `Organic Social`, listing the sources it counts.'
		);
	}

	public function test_select_drivers__counts_only_the_visits_of_a_referring_site_through_referral_and_organic_social() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Social', 20, 80 ),
					$this->get_breakdown( 'Paid Social', 300, 100 ),
					$this->get_breakdown( 'Direct', 400, 700 ),
				),
				'channelSources'    => array(
					$this->get_channel_row( 'Organic Social', 'source', 'facebook.com', 20, 80 ),
					$this->get_channel_row( 'Paid Social', 'source', 'facebook.com', 300, 100 ),
				),
			)
		);

		$drivers = array_values(
			array_filter(
				$key_factors->select_drivers(),
				fn( $driver ) => 'REFERRING_SITE' === $driver['kind']
			)
		);

		$this->assertSame( array( 80, 20 ), array( $drivers[0]['current'], $drivers[0]['previous'] ), 'The `Facebook` referring site should count its `Organic Social` visits, and not its `Paid Social` visits.' );
	}

	public function test_select_drivers__gives_a_channel_that_fell_its_share_of_the_visits_the_channels_lost() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 400, 600 ),
					$this->get_breakdown( 'Direct', 300, 240 ),
					$this->get_breakdown( 'Referral', 100, 80 ),
				),
			)
		);

		$this->assertSame(
			array(
				'Organic Search' => 100.0,
				'Direct'         => 75.0,
				'Referral'       => 25.0,
			),
			array_column( $key_factors->select_drivers(), 'sharePct', 'label' ),
			'A channel that gained should have its share of the 200 visits gained, and a channel that fell its share of the 80 visits lost.'
		);
	}

	public function test_select_drivers__orders_two_drivers_with_the_same_score_by_label() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Email', 100, 150 ),
					$this->get_breakdown( 'Affiliates', 100, 150 ),
					$this->get_breakdown( 'Direct', 800, 800 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Affiliates', 'CHANNEL Email' ), $this->get_driver_names( $key_factors->select_drivers() ), 'Two channels with the same score should be ordered by label.' );
	}

	public function test_get_driver_reports__names_the_reports_each_kind_of_driver_needs() {
		$this->assertSame( array( 'audience', 'sources' ), Key_Factors::get_driver_reports( array( 'kind' => 'CONTENT' ) ), 'A landing page should need the `audience` and `sources` reports.' );
		$this->assertSame( array( 'audience', 'pages' ), Key_Factors::get_driver_reports( array( 'kind' => 'CAMPAIGN' ) ), 'A campaign should need the `audience` and `pages` reports.' );
		$this->assertSame( array( 'audience', 'pages' ), Key_Factors::get_driver_reports( array( 'kind' => 'REFERRING_SITE' ) ), 'A referring site should need the `audience` and `pages` reports.' );
		$this->assertSame( array(), Key_Factors::get_driver_reports( array( 'kind' => 'CHANNEL' ) ), 'A channel should need no report.' );
		$this->assertSame( array(), Key_Factors::get_driver_reports( array( 'kind' => 'SEARCH_KEYWORD' ) ), 'A search keyword should need no report.' );
	}

	public function test_get_driver_filters__keeps_only_the_visits_of_a_driver() {
		$this->assertSame(
			array( 'landingPage' => array( '/plant-garlic/' ) ),
			Key_Factors::get_driver_filters(
				array(
					'kind'  => 'CONTENT',
					'label' => '/plant-garlic/',
				)
			),
			'A landing page should be filtered on its path.'
		);
		$this->assertSame(
			array( 'sessionCampaignName' => array( 'spring-sale' ) ),
			Key_Factors::get_driver_filters(
				array(
					'kind'  => 'CAMPAIGN',
					'label' => 'spring-sale',
				)
			),
			'A campaign should be filtered on its name.'
		);
		$this->assertSame(
			array(
				'sessionSource'                 => array( 'facebook.com', 'm.facebook.com' ),
				'sessionDefaultChannelGrouping' => array( 'Referral', 'Organic Social' ),
			),
			Key_Factors::get_driver_filters(
				array(
					'kind'    => 'REFERRING_SITE',
					'label'   => 'Facebook',
					'sources' => array( 'facebook.com', 'm.facebook.com' ),
				)
			),
			'A referring site should be filtered on its sources, through `Referral` and `Organic Social`.'
		);
		$this->assertSame(
			array(),
			Key_Factors::get_driver_filters(
				array(
					'kind'  => 'CHANNEL',
					'label' => 'Direct',
				)
			),
			'A channel should have no filter.'
		);
	}

	public function test_build__gives_a_channel_card_the_2_attribute_kinds_whose_values_moved_most() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 200, 260, 'mobile', 'returning' ),
					$this->get_breakdown( 'Organic Search', 200, 340, 'desktop', 'returning' ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Organic Search', 'page', '/plant-garlic/', 50, 80 ),
				),
				'searchQueries'     => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 110,
						'previous'         => 10,
						'positionCurrent'  => 2.1,
						'positionPrevious' => 8.4,
					),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Organic Search',
					'current'    => 600,
					'previous'   => 400,
					'sharePct'   => 100.0,
					'attributes' => array(
						array(
							'kind'     => 'DEVICE',
							'label'    => 'desktop',
							'current'  => 340,
							'previous' => 200,
							'sharePct' => 70.0,
						),
						array(
							'kind'     => 'SEARCH_KEYWORD',
							'label'    => 'plant garlic',
							'current'  => 110,
							'previous' => 10,
							'sharePct' => 50.0,
						),
					),
				),
			),
			$key_factors->build(
				array(
					array(
						'kind'     => 'CHANNEL',
						'label'    => 'Organic Search',
						'current'  => 600,
						'previous' => 400,
						'sharePct' => 100.0,
					),
				)
			),
			'The card should show `desktop` and `plant garlic`, which moved more than `/plant-garlic/`, and not `returning`, which grew 50% like the card.'
		);
	}

	public function test_build__orders_two_attribute_kinds_whose_values_moved_as_much_by_the_order_of_the_kinds() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 200, 350, 'mobile', 'new' ),
					$this->get_breakdown( 'Organic Search', 200, 250, 'desktop', 'returning' ),
				),
			)
		);

		$cards = $key_factors->build(
			array(
				array(
					'kind'     => 'CHANNEL',
					'label'    => 'Organic Search',
					'current'  => 600,
					'previous' => 400,
					'sharePct' => 100.0,
				),
			)
		);

		$this->assertSame(
			array( 'USER_TYPE new', 'DEVICE mobile' ),
			array_map( fn( $attribute ) => "{$attribute['kind']} {$attribute['label']}", $cards[0]['attributes'] ),
			'`new` and `mobile` both gained 150 visits, so the visitor type should come first, as `Organic Search` lists it before the device.'
		);
	}

	public function test_build__does_not_show_a_value_that_moved_against_its_card_or_a_placeholder() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Direct', 300, 380 ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Direct', 'page', '/old/', 100, 20 ),
					$this->get_channel_row( 'Direct', 'page', '(not set)', 0, 100 ),
					$this->get_channel_row( 'Direct', 'page', '/new/', 0, 10 ),
				),
			)
		);

		$cards = $key_factors->build(
			array(
				array(
					'kind'     => 'CHANNEL',
					'label'    => 'Direct',
					'current'  => 380,
					'previous' => 300,
					'sharePct' => 100.0,
				),
			)
		);

		$this->assertSame( array( '/new/' ), array_column( $cards[0]['attributes'], 'label' ), 'The card should show `/new/`, and neither `/old/`, which fell, nor `(not set)`.' );
	}

	public function test_build__gives_a_landing_page_card_its_channel_and_its_visitor_type_from_its_audience_report() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Organic Search', 400, 600 ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Organic Search', 'page', '/plant-garlic/', 30, 120 ),
					$this->get_channel_row( 'Direct', 'page', '/plant-garlic/', 20, 30 ),
				),
			)
		);

		$cards = $key_factors->build(
			array(
				array(
					'kind'     => 'CONTENT',
					'label'    => '/plant-garlic/',
					'current'  => 150,
					'previous' => 50,
					'sharePct' => 50.0,
				),
			),
			array(
				array(
					'audience' => array(
						array(
							'device'   => 'mobile',
							'userType' => 'new',
							'current'  => 110,
							'previous' => 30,
						),
						array(
							'device'   => 'desktop',
							'userType' => 'returning',
							'current'  => 40,
							'previous' => 20,
						),
					),
				),
			)
		);

		$this->assertSame(
			array( 'TRAFFIC_CHANNEL Organic Search', 'USER_TYPE new' ),
			array_map( fn( $attribute ) => "{$attribute['kind']} {$attribute['label']}", $cards[0]['attributes'] ),
			'The card should show `Organic Search`, which brought 90 more visits, and `new`, which the page lists before `mobile` with the same 80 visits.'
		);
	}

	public function test_build__gives_a_landing_page_card_the_referring_sites_of_its_sources_report_through_referral_and_organic_social() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Referral', 100, 400 ),
				),
			)
		);

		$cards = $key_factors->build(
			array(
				array(
					'kind'     => 'CONTENT',
					'label'    => '/plant-garlic/',
					'current'  => 300,
					'previous' => 50,
					'sharePct' => 83.3,
				),
			),
			array(
				array(
					'sources' => array(
						$this->get_channel_row( 'Paid Social', 'source', 'facebook.com', 0, 200 ),
						$this->get_channel_row( 'Referral', 'source', 'news.example.com', 10, 60 ),
					),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'kind'     => 'REFERRING_SITE',
					'label'    => 'news.example.com',
					'current'  => 60,
					'previous' => 10,
					'sharePct' => 16.7,
				),
			),
			$cards[0]['attributes'],
			'The card should show `news.example.com`, and not `facebook.com`, whose visits came through `Paid Social`.'
		);
	}

	public function test_build__gives_a_search_keyword_card_its_pages_and_devices() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns'  => array(
					$this->get_breakdown( 'Organic Search', 400, 600 ),
				),
				'searchQueryPages'   => array(
					array(
						'query'    => 'plant garlic',
						'page'     => '/plant-garlic/',
						'current'  => 100,
						'previous' => 15,
					),
					array(
						'query'    => 'plant garlic',
						'page'     => '/garlic/',
						'current'  => 20,
						'previous' => 5,
					),
					array(
						'query'    => 'raised beds',
						'page'     => '/raised-beds/',
						'current'  => 500,
						'previous' => 0,
					),
				),
				'searchQueryDevices' => array(
					array(
						'query'    => 'plant garlic',
						'device'   => 'mobile',
						'current'  => 90,
						'previous' => 10,
					),
					array(
						'query'    => 'plant garlic',
						'device'   => 'desktop',
						'current'  => 30,
						'previous' => 10,
					),
				),
			)
		);

		$cards = $key_factors->build(
			array(
				array(
					'kind'     => 'SEARCH_KEYWORD',
					'label'    => 'plant garlic',
					'current'  => 120,
					'previous' => 20,
					'sharePct' => 50.0,
				),
			)
		);

		$this->assertSame(
			array( 'LANDING_PAGE /plant-garlic/', 'DEVICE mobile' ),
			array_map( fn( $attribute ) => "{$attribute['kind']} {$attribute['label']}", $cards[0]['attributes'] ),
			'The card should show the page and the device of its own clicks, and not the page of `raised beds`.'
		);
	}

	public function test_build__gives_a_paid_channel_card_its_campaign_and_its_sources_as_a_platform() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Paid Social', 100, 300 ),
				),
				'channelSources'    => array(
					$this->get_channel_row( 'Paid Social', 'source', 'instagram.com', 50, 150 ),
					$this->get_channel_row( 'Paid Social', 'source', 'facebook.com', 50, 150 ),
				),
				'channelCampaigns'  => array(
					$this->get_channel_row( 'Paid Social', 'campaign', 'spring-sale', 0, 150 ),
				),
			)
		);

		$cards = $key_factors->build(
			array(
				array(
					'kind'     => 'CHANNEL',
					'label'    => 'Paid Social',
					'current'  => 300,
					'previous' => 100,
					'sharePct' => 100.0,
				),
			)
		);

		$this->assertSame(
			array( 'CAMPAIGN spring-sale', 'PLATFORM Facebook' ),
			array_map( fn( $attribute ) => "{$attribute['kind']} {$attribute['label']}", $cards[0]['attributes'] ),
			'The card should show its campaign, and `Facebook` as its platform, which comes before `instagram.com` with the same 100 visits.'
		);
	}

	public function test_build__gives_an_unassigned_card_only_its_landing_page() {
		$key_factors = new Key_Factors(
			array(
				'channelBreakdowns' => array(
					$this->get_breakdown( 'Unassigned', 5, 50, 'mobile', 'new' ),
					$this->get_breakdown( 'Unassigned', 5, 10, 'desktop', 'new' ),
				),
				'channelPages'      => array(
					$this->get_channel_row( 'Unassigned', 'page', '/plant-garlic/', 10, 60 ),
				),
			)
		);

		$cards = $key_factors->build(
			array(
				array(
					'kind'     => 'CHANNEL',
					'label'    => 'Unassigned',
					'current'  => 60,
					'previous' => 10,
					'sharePct' => 100.0,
				),
			)
		);

		$this->assertSame( array( 'LANDING_PAGE' ), array_column( $cards[0]['attributes'], 'kind' ), 'An `Unassigned` card should show its landing page alone, even with a device that moved more.' );
	}

	public function test_sum_by__adds_up_the_rows_with_the_same_value() {
		$this->assertSame(
			array(
				$this->get_row( 'Organic Search', 300, 500 ),
				$this->get_row( 'Direct', 50, 40 ),
			),
			Key_Factors::sum_by(
				array(
					$this->get_breakdown( 'Organic Search', 100, 200, 'mobile' ),
					$this->get_breakdown( 'Direct', 50, 40 ),
					$this->get_breakdown( 'Organic Search', 200, 300, 'desktop' ),
				),
				'channel'
			),
			'The two `Organic Search` rows should be added up, in the order the channels first appear.'
		);
	}
}
