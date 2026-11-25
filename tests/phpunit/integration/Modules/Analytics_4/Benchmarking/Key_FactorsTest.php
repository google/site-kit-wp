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
	 * Builds the key factors of a period.
	 *
	 * Each channel's `channelBreakdowns` row has no device and no visitor
	 * type, so a card has neither as a row unless a test gives its own rows.
	 *
	 * @param array $visits          The site's visits, as `array( current, previous )`.
	 * @param array $channels        The channels, each as `array( title, current, previous )`.
	 * @param array $contextual_data Optional. The other rows, keyed by contextual data key. Default empty array.
	 * @param int   $days_in_period  Optional. The number of days in the period. Default 28.
	 * @return Key_Factors The key factors.
	 */
	private function build( array $visits, array $channels, array $contextual_data = array(), $days_in_period = 28 ) {
		$breakdowns = array_map(
			fn( $channel ) => array(
				'channel'  => $channel[0],
				'device'   => '(not set)',
				'userType' => '(not set)',
				'current'  => $channel[1],
				'previous' => $channel[2],
			),
			$channels
		);

		return new Key_Factors(
			array_merge( array( 'channelBreakdowns' => $breakdowns ), $contextual_data ),
			array(
				'current'  => $visits[0],
				'previous' => $visits[1],
			),
			$days_in_period
		);
	}

	/**
	 * Gets a row of a breakdown of a channel, such as a `channelPages` row.
	 *
	 * @param string $channel  The channel.
	 * @param string $field    The field, such as `page`.
	 * @param string $value    The value of the field.
	 * @param int    $current  The visits of the selected period.
	 * @param int    $previous The visits of the compare period.
	 * @return array The row.
	 */
	private function row( $channel, $field, $value, $current, $previous ) {
		return array(
			'channel'  => $channel,
			$field     => $value,
			'current'  => $current,
			'previous' => $previous,
		);
	}

	/**
	 * Gets a `content` row of a post published in the period.
	 *
	 * @param string $url     The post's path.
	 * @param string $title   The post's title.
	 * @param int    $current The post's visits in the period.
	 * @return array The row.
	 */
	private function post( $url, $title, $current ) {
		return array(
			'url'              => $url,
			'title'            => $title,
			'publishedDaysAgo' => 5,
			'current'          => $current,
			'previous'         => 0,
		);
	}

	/**
	 * Gets the title of each card of the decomposition, with its kind.
	 *
	 * @param Key_Factors $key_factors The key factors.
	 * @return array List of `{entity_kind} {title}`.
	 */
	private function get_card_titles( Key_Factors $key_factors ) {
		return array_map(
			fn( $card ) => "{$card['entity_kind']} {$card['title']}",
			$key_factors->get_decomposition()['key_factors']
		);
	}

	/**
	 * Gets the rows of each card of the decomposition, by their figures.
	 *
	 * @param Key_Factors $key_factors The key factors.
	 * @return array List of each card's rows, each as `array( kind, text, share, change )`, with a null text for the homepage and a null share for a row without one.
	 */
	private function get_card_rows( Key_Factors $key_factors ) {
		return array_map(
			fn( $card ) => array_map(
				fn( $row ) => array(
					$row['kind'],
					isset( $row['value'] ) ? $row['value']['text'] : null,
					isset( $row['share_of_parent_change_pct'] ) ? $row['share_of_parent_change_pct'] : null,
					$row['entity_delta'],
				),
				$card['attributes']
			),
			$key_factors->get_decomposition()['key_factors']
		);
	}

	public function test_get_decomposition__returns_the_services_wire_format_example() {
		// The example of service §5.10 "Wire format": visits from 1000 to
		// 1300, with Referral from 500 to 800 and Direct unchanged at 500, and
		// Referral's landing page `/post` from 175 to 400.
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelPages' => array( $this->row( 'Referral', 'page', '/post', 400, 175 ) ),
			)
		);

		$this->assertSame(
			array(
				'opening_sessions' => 1000,
				'closing_sessions' => 1300,
				'residual_delta'   => 0,
				'shape'            => 'CONCENTRATED',
				'key_factors'      => array(
					array(
						'dimension'          => 'TRAFFIC_CHANNELS',
						'entity_kind'        => 'CHANNEL',
						'title'              => 'Referral',
						'volume'             => 800,
						'delta'              => 300,
						'excess'             => 150.0,
						'outsized'           => true,
						'is_large_share'     => true,
						'direction'          => 'UP',
						'traffic_impact_pct' => 100.0,
						'metric_type'        => 'DELTA',
						'share_basis'        => 'GROSS_CHANGE',
						'role'               => 'PRIMARY',
						'attributes'         => array(
							array(
								'kind'         => 'TARGET_PAGE',
								'role'         => 'DECOMPOSITION',
								'label'        => 'Target page',
								'value'        => array( 'text' => '/post' ),
								'share_of_parent_change_pct' => 75.0,
								'entity_delta' => 225,
							),
						),
					),
				),
			),
			$key_factors->get_decomposition(),
			'The decomposition should be the one of the service\'s wire format example.'
		);
		$this->assertSame(
			array(
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Referral',
					'current'    => 800,
					'previous'   => 500,
					'sharePct'   => 100.0,
					'shareBasis' => 'GROSS_CHANGE',
					'attributes' => array(
						array(
							'kind'      => 'LANDING_PAGE',
							'label'     => '/post',
							'current'   => 400,
							'previous'  => 175,
							'sharePct'  => 75.0,
							'oversized' => false,
						),
					),
				),
			),
			$key_factors->get_cards(),
			'The panel should show the same card, with the page\'s own visits.'
		);
		$this->assertFalse( $key_factors->is_steady(), 'A period that rose should not be steady.' );
	}

	public function test_get_decomposition__returns_the_services_request_example() {
		// The example of service §4.4: visits from 1000 to 1250, with Referral
		// from 500 to 800 and Direct from 500 to 450. `news.example` brought
		// Referral 220 more visits, with no other source, so it takes
		// Referral's card, and Direct offsets part of the rise. The example's
		// landing page has a query string, which the plugin's report doesn't.
		$key_factors = $this->build(
			array( 1250, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 450, 500 ),
			),
			array(
				'channelPages'   => array( $this->row( 'Referral', 'page', '/post', 400, 175 ) ),
				'channelSources' => array( $this->row( 'Referral', 'source', 'news.example', 520, 300 ) ),
				'searchClicks'   => array(
					array(
						'current'  => 900,
						'previous' => 850,
					),
				),
			)
		);

		$this->assertSame(
			array(
				'opening_sessions' => 1000,
				'closing_sessions' => 1250,
				'residual_delta'   => 80,
				'shape'            => 'CONCENTRATED',
				'key_factors'      => array(
					array(
						'dimension'            => 'SOURCES',
						'entity_kind'          => 'REFERRING_SITE',
						'title'                => 'news.example',
						'volume'               => 520,
						'delta'                => 220,
						'excess'               => 145.0,
						'outsized'             => true,
						'is_large_share'       => true,
						'direction'            => 'UP',
						'traffic_impact_pct'   => 73.3,
						'metric_type'          => 'DELTA',
						'share_basis'          => 'PARENT_CHANNEL',
						'parent_channel'       => 'Referral',
						'parent_channel_delta' => 300,
						'role'                 => 'PRIMARY',
						// The service's example leaves out an empty list.
						'attributes'           => array(),
					),
					array(
						'dimension'          => 'TRAFFIC_CHANNELS',
						'entity_kind'        => 'CHANNEL',
						'title'              => 'Direct',
						'volume'             => 450,
						'delta'              => -50,
						'excess'             => -175.0,
						'outsized'           => true,
						'direction'          => 'DOWN',
						'traffic_impact_pct' => 20.0,
						'metric_type'        => 'DELTA',
						'share_basis'        => 'NET_CHANGE',
						'role'               => 'OFFSET',
						'attributes'         => array(),
					),
				),
			),
			$key_factors->get_decomposition(),
			'The decomposition should be the one of the service\'s request example: the referring site with its share of Referral, and the rest of Referral\'s rise as the residual.'
		);
		$this->assertSame(
			array(
				array(
					'kind'                => 'REFERRING_SITE',
					'label'               => 'news.example',
					'current'             => 520,
					'previous'            => 300,
					'sharePct'            => 73.3,
					'shareBasis'          => 'PARENT_CHANNEL',
					'parentChannel'       => 'Referral',
					'parentChannelChange' => 300,
					'attributes'          => array(),
				),
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Direct',
					'current'    => 450,
					'previous'   => 500,
					'sharePct'   => 20.0,
					'shareBasis' => 'NET_CHANGE',
					'attributes' => array(),
				),
			),
			$key_factors->get_cards(),
			'The panel should show the same cards, with the channel the referring site\'s share is of.'
		);
	}

	public function test_get_decomposition__returns_null_without_channels() {
		$key_factors = $this->build( array( 1300, 1000 ), array() );

		$this->assertNull( $key_factors->get_decomposition(), 'Without channels, the cards\' changes add up to nothing, so there should be no decomposition.' );
		$this->assertSame( array(), $key_factors->get_cards(), 'Without channels, there should be no cards.' );
		$this->assertFalse( $key_factors->is_steady(), 'A period without channels should not be steady.' );
	}

	public function test_get_cards__returns_the_channels_with_the_largest_share_of_the_visits_of_a_steady_period() {
		// The site's visits went from 700 to 701, and no channel moved by 1%
		// of them beyond the site's own rate.
		$key_factors = $this->build(
			array( 701, 700 ),
			array(
				array( 'Organic Search', 302, 300 ),
				array( 'Direct', 199, 200 ),
				array( 'Referral', 121, 120 ),
				array( 'Email', 79, 80 ),
			)
		);

		$this->assertTrue( $key_factors->is_steady(), 'A period on which no channel changed notably should be steady.' );
		$this->assertSame(
			array(
				array( 'Organic Search', 43.1 ),
				array( 'Direct', 28.4 ),
				array( 'Referral', 17.3 ),
			),
			array_map( fn( $card ) => array( $card['label'], $card['sharePct'] ), $key_factors->get_cards() ),
			'The cards should be the three channels with the most visits, each with its share of the site\'s 701 visits.'
		);

		$decomposition = $key_factors->get_decomposition();

		$this->assertSame( 'STEADY', $decomposition['shape'], 'The shape of a steady period should be `STEADY`.' );
		$this->assertSame(
			array(
				'dimension'          => 'TRAFFIC_CHANNELS',
				'entity_kind'        => 'CHANNEL',
				'title'              => 'Direct',
				'volume'             => 199,
				'delta'              => -1,
				'excess'             => -1.3,
				'direction'          => 'STABLE',
				'traffic_impact_pct' => 28.4,
				'metric_type'        => 'VOLUME_SHARE',
				'share_basis'        => 'VOLUME',
				'role'               => 'PRIMARY',
				'attributes'         => array(),
			),
			$decomposition['key_factors'][1],
			'A steady card should carry its own change, and its share of the site\'s visits, whichever way it moved.'
		);
		$this->assertSame( -1, $decomposition['residual_delta'], 'The residual should be the change of `Email`, which has no card.' );
	}

	public function test_get_cards__keeps_a_flat_period_steady_when_only_a_placeholder_channel_moved_beyond_the_site() {
		// The site's visits stayed at 1,000. `(not set)` gained 12 visits, 1.2%
		// of them, but no card can name it. The other channels each lost less
		// than 1%.
		$key_factors = $this->build(
			array( 1000, 1000 ),
			array(
				array( 'Organic Search', 396, 400 ),
				array( 'Direct', 297, 300 ),
				array( 'Referral', 197, 200 ),
				array( 'Email', 78, 80 ),
				array( '(not set)', 32, 20 ),
			)
		);

		$this->assertTrue( $key_factors->is_steady(), 'A placeholder channel has no card, so its change alone should not make the period offsetting.' );
		$this->assertSame( 'STEADY', $key_factors->get_decomposition()['shape'], 'The shape should be `STEADY`.' );
		$this->assertSame(
			array( 'Organic Search', 'Direct', 'Referral' ),
			array_column( $key_factors->get_cards(), 'label' ),
			'The cards should be the three channels with the most visits.'
		);
	}

	public function test_get_cards__gives_a_steady_card_only_the_landing_page_device_and_visitor_type_that_moved_with_it() {
		$key_factors = $this->build(
			array( 1010, 1000 ),
			array(),
			array(
				'channelBreakdowns' => array(
					array(
						'channel'  => 'Organic Search',
						'device'   => 'mobile',
						'userType' => 'new',
						'current'  => 610,
						'previous' => 600,
					),
					array(
						'channel'  => 'Direct',
						'device'   => 'desktop',
						'userType' => 'returning',
						'current'  => 400,
						'previous' => 400,
					),
				),
				'channelPages'      => array( $this->row( 'Organic Search', 'page', '/plant-garlic/', 110, 100 ) ),
				'channelSources'    => array( $this->row( 'Organic Search', 'source', 'example.com', 610, 600 ) ),
			)
		);

		$this->assertTrue( $key_factors->is_steady(), 'The period should be steady.' );
		$this->assertSame(
			array(
				array( 'LANDING_PAGE', '/plant-garlic/' ),
			),
			array_map( fn( $attribute ) => array( $attribute['kind'], $attribute['label'] ), $key_factors->get_cards()[0]['attributes'] ),
			'`Organic Search` should list its page, and no source, since a steady card lists no part of another breakdown. Its visitor type falls in another cut than the page.'
		);
		$this->assertSame( array(), $key_factors->get_cards()[1]['attributes'], '`Direct` did not change, so it should have no rows.' );
	}

	public function test_get_cards__makes_a_post_published_in_the_period_that_carried_most_of_its_channels_rise_the_card() {
		// `/new-post/` carried 250 of the 300 visits Referral gained, and it is
		// a post published 5 days ago.
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Referral', 'page', '/new-post/', 250, 0 ),
					$this->row( 'Referral', 'page', '/old-post/', 50, 0 ),
				),
				'content'      => array( $this->post( '/new-post/', 'A new post', 260 ) ),
			)
		);

		$this->assertSame(
			array(
				'dimension'            => 'PAGES',
				'entity_kind'          => 'CONTENT',
				'title'                => 'A new post',
				'volume'               => 260,
				'delta'                => 260,
				'excess'               => 260.0,
				'outsized'             => true,
				'is_large_share'       => true,
				'direction'            => 'UP',
				'traffic_impact_pct'   => 86.7,
				'metric_type'          => 'DELTA',
				'share_basis'          => 'PARENT_CHANNEL',
				'parent_channel'       => 'Referral',
				'parent_channel_delta' => 300,
				'role'                 => 'PRIMARY',
				'attributes'           => array(),
			),
			$key_factors->get_decomposition()['key_factors'][0],
			'The post should take Referral\'s card, with its visits in the period as its change, and its share of Referral\'s change.'
		);
		$this->assertSame(
			array(
				'kind'                => 'CONTENT',
				'label'               => 'A new post',
				'current'             => 260,
				'previous'            => 0,
				'sharePct'            => 86.7,
				'shareBasis'          => 'PARENT_CHANNEL',
				'parentChannel'       => 'Referral',
				'parentChannelChange' => 300,
				'attributes'          => array(),
				'url'                 => '/new-post/',
			),
			$key_factors->get_cards()[0],
			'The panel should show the post\'s card, with its share of Referral\'s change, and the post\'s path for its title to link to.'
		);
		$this->assertSame( 300 - 260, $key_factors->get_decomposition()['residual_delta'], 'What Referral moved beyond the post should fall in the residual.' );
	}

	/**
	 * @dataProvider data_posts_published_before_the_period
	 *
	 * @param int $published_days_ago The days from the post's publication to the last day of the 28-day period.
	 */
	public function test_get_cards__keeps_the_channel_card_when_its_landing_page_is_no_post_published_in_the_period( $published_days_ago ) {
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelPages' => array( $this->row( 'Referral', 'page', '/old-post/', 290, 40 ) ),
				'content'      => array(
					array(
						'url'              => '/old-post/',
						'title'            => 'An old post',
						'publishedDaysAgo' => $published_days_ago,
						'current'          => 300,
						'previous'         => 50,
					),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'A page that is no new post should not take its channel\'s card.' );
		$this->assertSame( '/old-post/', $key_factors->get_cards()[0]['attributes'][0]['label'], 'The page should be a row of the channel\'s card.' );
	}

	public function data_posts_published_before_the_period() {
		return array(
			// The first day of a 28-day period is 27 days before its last.
			'the day before the period' => array( 28 ),
			'months before'             => array( 90 ),
		);
	}

	/**
	 * @dataProvider data_hidden_landing_pages
	 *
	 * @param string $page The landing page's path.
	 */
	public function test_get_cards__never_names_the_homepage_or_a_page_a_reader_would_not_recognise( $page ) {
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Referral', 'page', '/about/', 10, 5 ),
					$this->row( 'Referral', 'page', $page, 400, 125 ),
				),
				'content'      => array( $this->post( $page, 'A page', 400 ) ),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'The page should not take Referral\'s card.' );
		$this->assertSame( array(), $key_factors->get_cards()[0]['attributes'], 'The page should not be a row, and `/about/` should not take its place.' );
	}

	public function data_hidden_landing_pages() {
		return array(
			'the root'                 => array( '/' ),
			'another homepage address' => array( '/index.php' ),
			'a feed'                   => array( '/blog/feed/' ),
			'a later page of a list'   => array( '/blog/page/2/' ),
			'the sample post'          => array( '/hello-world/' ),
			'a login page'             => array( '/wp-login.php' ),
		);
	}

	public function test_get_cards__lists_the_homepage_of_direct_without_its_address() {
		// The homepage carried 80 of the 100 visits Direct gained, well above
		// its 63.3% share of Direct's visits.
		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(
				array( 'Direct', 600, 500 ),
				array( 'Organic Search', 500, 500 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Direct', 'page', '/', 380, 300 ),
					$this->row( 'Direct', 'page', '/a/', 220, 200 ),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'kind'                       => 'HOMEPAGE',
					'role'                       => 'DECOMPOSITION',
					'label'                      => 'Homepage',
					'share_of_parent_change_pct' => 80.0,
					'entity_delta'               => 80,
				),
				array(
					'kind'                       => 'TARGET_PAGE',
					'role'                       => 'CONTEXT',
					'label'                      => 'Target page',
					'value'                      => array( 'text' => '/a/' ),
					'share_of_parent_change_pct' => 20.0,
					'entity_delta'               => 20,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'Direct should list its homepage, without an address, and then its page.'
		);
		$this->assertSame(
			array( '/', '/a/' ),
			array_column( $key_factors->get_cards()[0]['attributes'], 'label' ),
			'The panel should name the homepage by the site\'s home path.'
		);
	}

	public function test_get_cards__does_not_list_a_homepage_that_changed_no_more_than_its_share_of_direct() {
		// The homepage has 80% of Direct's visits, and carried 80% of its rise.
		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(
				array( 'Direct', 600, 500 ),
				array( 'Organic Search', 500, 500 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Direct', 'page', '/', 480, 400 ),
					$this->row( 'Direct', 'page', '/a/', 120, 100 ),
				),
			)
		);

		$this->assertSame(
			array( 'TARGET_PAGE' ),
			array_column( $key_factors->get_decomposition()['key_factors'][0]['attributes'], 'kind' ),
			'Direct should list its page, but not its homepage, which only shows where its visitors already land.'
		);
	}

	public function test_get_cards__never_makes_a_search_keyword_a_card_but_lists_it_on_organic_search_in_clicks() {
		$key_factors = $this->build(
			array( 1400, 1000 ),
			array(
				array( 'Organic Search', 1000, 600 ),
				array( 'Direct', 400, 400 ),
			),
			array(
				'searchQueries' => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 100,
						'positionCurrent'  => 2.0,
						'positionPrevious' => 6.0,
					),
					array(
						'label'            => 'raised beds',
						'current'          => 90,
						'previous'         => 80,
						'positionCurrent'  => 4.0,
						'positionPrevious' => 4.0,
					),
				),
				'searchClicks'  => array(
					array(
						'current'  => 2500,
						'previous' => 2000,
					),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Organic Search' ), $this->get_card_titles( $key_factors ), 'The only card should be `Organic Search`, not a search keyword.' );
		$this->assertSame(
			array(
				array(
					'kind'                       => 'SOURCE_TYPE',
					'role'                       => 'CONTEXT',
					'label'                      => 'Search keyword',
					'value'                      => array( 'text' => 'plant garlic' ),
					'entity_delta'               => 200,
					'share_of_search_clicks_pct' => 8.0,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'The keyword should be context, with its change in clicks as a share of all of the site\'s 2,500 search clicks.'
		);
		$this->assertSame(
			array(
				'kind'      => 'SEARCH_KEYWORD',
				'label'     => 'plant garlic',
				'current'   => 300,
				'previous'  => 100,
				'sharePct'  => 8.0,
				'oversized' => false,
			),
			$key_factors->get_cards()[0]['attributes'][0],
			'The panel should show the keyword\'s clicks.'
		);
	}

	public function test_get_cards__does_not_name_a_keyword_that_carried_under_a_quarter_of_the_change_in_search_clicks() {
		$key_factors = $this->build(
			array( 1400, 1000 ),
			array(
				array( 'Organic Search', 1000, 600 ),
				array( 'Direct', 400, 400 ),
			),
			array(
				'searchQueries' => array(
					array(
						'label'            => 'plant garlic',
						'current'          => 200,
						'previous'         => 100,
						'positionCurrent'  => 2.0,
						'positionPrevious' => 6.0,
					),
				),
				'searchClicks'  => array(
					array(
						'current'  => 2500,
						'previous' => 2000,
					),
				),
			)
		);

		$this->assertSame( array(), $key_factors->get_cards()[0]['attributes'], 'A keyword that gained 100 of the 500 clicks the site gained should not be named.' );
	}

	public function test_get_cards__names_the_next_keyword_when_the_largest_is_hidden() {
		// `xxx videos` gained the most clicks, but no card may name it, so
		// `plant garlic` is the keyword behind the rise.
		$key_factors = $this->build(
			array( 1400, 1000 ),
			array(
				array( 'Organic Search', 1000, 600 ),
				array( 'Direct', 400, 400 ),
			),
			array(
				'searchQueries' => array(
					array(
						'label'            => 'xxx videos',
						'current'          => 350,
						'previous'         => 100,
						'positionCurrent'  => 2.0,
						'positionPrevious' => 6.0,
					),
					array(
						'label'            => 'plant garlic',
						'current'          => 300,
						'previous'         => 100,
						'positionCurrent'  => 2.0,
						'positionPrevious' => 6.0,
					),
				),
				'searchClicks'  => array(
					array(
						'current'  => 2500,
						'previous' => 2000,
					),
				),
			)
		);

		$this->assertSame(
			array( array( array( 'SOURCE_TYPE', 'plant garlic', null, 200 ) ) ),
			$this->get_card_rows( $key_factors ),
			'Organic Search should name the largest keyword a card may show.'
		);
	}

	public function test_get_cards__never_makes_a_hidden_source_the_card_or_a_row() {
		// `pornhub.com` brought 230 of the 300 visits Referral gained, but no
		// card may name it, so `a.example.com` is Referral's largest part.
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'Referral', 'source', 'pornhub.com', 330, 100 ),
					$this->row( 'Referral', 'source', 'a.example.com', 180, 100 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Referral should keep its card.' );
		$this->assertSame(
			array( array( array( 'SOURCE_TYPE', 'a.example.com', 26.7, 80 ) ) ),
			$this->get_card_rows( $key_factors ),
			'Referral should list the site a card may show.'
		);
	}

	public function test_get_cards__never_makes_a_post_with_a_hidden_title_the_card() {
		// `/new-post/` carried 250 of the 300 visits Referral gained, but no
		// card may show its title. Its address is no title, so it is a row.
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelPages' => array( $this->row( 'Referral', 'page', '/new-post/', 250, 0 ) ),
				'content'      => array( $this->post( '/new-post/', 'Hot sex tips', 260 ) ),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Referral should keep its card.' );
		$this->assertSame(
			array( array( array( 'TARGET_PAGE', '/new-post/', 83.3, 250 ) ) ),
			$this->get_card_rows( $key_factors ),
			'Referral should list the page by its address.'
		);
	}

	public function test_get_cards__makes_a_referring_site_that_carried_most_of_its_channels_change_the_card() {
		// Facebook's sources gained 230 of the 300 visits Organic Social
		// gained, and `x.com`, under a quarter of it, so Facebook is named.
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Organic Social', 400, 100 ),
				array( 'Direct', 900, 900 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'Organic Social', 'source', 'facebook.com', 150, 50 ),
					$this->row( 'Organic Social', 'source', 'm.facebook.com', 120, 20 ),
					$this->row( 'Organic Social', 'source', 'l.facebook.com', 40, 10 ),
					$this->row( 'Organic Social', 'source', 't.co', 50, 10 ),
					$this->row( 'Organic Social', 'source', 'x.com', 40, 10 ),
				),
			)
		);

		$card = $key_factors->get_decomposition()['key_factors'][0];

		$this->assertSame(
			array(
				'entity_kind'          => 'REFERRING_SITE',
				'title'                => 'Facebook',
				'volume'               => 310,
				'delta'                => 230,
				'traffic_impact_pct'   => 76.7,
				'share_basis'          => 'PARENT_CHANNEL',
				'parent_channel'       => 'Organic Social',
				'parent_channel_delta' => 300,
			),
			array_intersect_key( $card, array_flip( array( 'entity_kind', 'title', 'volume', 'delta', 'traffic_impact_pct', 'share_basis', 'parent_channel', 'parent_channel_delta' ) ) ),
			'Facebook should take the card of Organic Social, with its share of the channel\'s change.'
		);
		$this->assertSame(
			array(
				'kind'                => 'REFERRING_SITE',
				'sharePct'            => 76.7,
				'shareBasis'          => 'PARENT_CHANNEL',
				'parentChannel'       => 'Organic Social',
				'parentChannelChange' => 300,
			),
			array_intersect_key( $key_factors->get_cards()[0], array_flip( array( 'kind', 'sharePct', 'shareBasis', 'parentChannel', 'parentChannelChange' ) ) ),
			'The panel should show Facebook\'s card as a referring site, with the channel its share is of, so it can name the channel.'
		);
	}

	public function test_get_cards__lists_two_referring_sites_of_one_channel_when_neither_carried_most_of_its_change() {
		// `x.com`, with `t.co`, gained 90 of the 320 visits Organic Social
		// gained, over a quarter of them, so Facebook doesn't take the card.
		$key_factors = $this->build(
			array( 1320, 1000 ),
			array(
				array( 'Organic Social', 420, 100 ),
				array( 'Direct', 900, 900 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'Organic Social', 'source', 'facebook.com', 280, 50 ),
					$this->row( 'Organic Social', 'source', 't.co', 70, 10 ),
					$this->row( 'Organic Social', 'source', 'x.com', 70, 40 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Organic Social' ), $this->get_card_titles( $key_factors ), 'Organic Social should keep its card.' );
		$this->assertSame(
			array(
				array( 'Referring site', 'Facebook', 71.9, 230 ),
				array( 'Referring site', 'x.com', 28.1, 90 ),
			),
			array_map(
				fn( $row ) => array( $row['label'], $row['value']['text'], $row['share_of_parent_change_pct'], $row['entity_delta'] ),
				$key_factors->get_decomposition()['key_factors'][0]['attributes']
			),
			'Both sites should be rows, named as the service names them, each with its share of the channel\'s change.'
		);
	}

	public function test_get_cards__keeps_the_card_of_a_channel_whose_largest_part_carried_little_of_its_change() {
		// `a.example.com` carried 60 of the 400 visits Referral gained.
		$key_factors = $this->build(
			array( 1400, 1000 ),
			array(
				array( 'Referral', 600, 200 ),
				array( 'Direct', 800, 800 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'Referral', 'source', 'a.example.com', 100, 40 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'A site with 15% of the channel\'s change should not take the card of the channel with the rest.' );
		$this->assertSame( array(), $key_factors->get_cards()[0]['attributes'], 'The site should not be a row either, under a quarter of the change.' );
	}

	/**
	 * Gets `channelPages` rows of pages that each moved by the same number of
	 * visits.
	 *
	 * @param string $channel The channel.
	 * @param int    $count   The number of pages.
	 * @param int    $delta   The change of each page.
	 * @return array List of rows, of the pages `/post-1/` and on.
	 */
	private function pages( $channel, $count, $delta ) {
		return array_map(
			fn( $number ) => $this->row( $channel, 'page', "/post-$number/", 20 + $delta, 20 ),
			range( 1, $count )
		);
	}

	public function test_get_cards__says_when_a_channel_card_without_rows_had_its_change_spread_across_many_pages() {
		// Referral gained 300 visits across 30 pages, 10 each, under the 30 a
		// page needs to be a row. oi.ie's Organic Search rose 169 across 233
		// pages, none by more than 5.
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array( 'channelPages' => $this->pages( 'Referral', 30, 10 ) )
		);

		$cards = $key_factors->get_cards();

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Referral should be the card.' );
		$this->assertSame( array(), $cards[0]['attributes'], 'No page should be a row.' );
		$this->assertTrue( $cards[0]['spreadAcrossPages'], 'The card should say its change was spread across many pages.' );
		$this->assertArrayNotHasKey( 'spread_across_pages', $key_factors->get_decomposition()['key_factors'][0], 'The service\'s decomposition should not carry it.' );
	}

	/**
	 * @dataProvider data_changes_not_spread_across_many_pages
	 *
	 * @param array  $pages           The `channelPages` rows of Referral, which gained 300 visits.
	 * @param array  $contextual_data The other rows.
	 * @param string $message         The assertion message.
	 */
	public function test_get_cards__does_not_say_a_channels_change_was_spread_across_many_pages( array $pages, array $contextual_data, $message ) {
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array_merge( array( 'channelPages' => $pages ), $contextual_data )
		);

		$cards = $key_factors->get_cards();

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Referral should be the card.' );
		$this->assertArrayNotHasKey( 'spreadAcrossPages', $cards[0], $message );
	}

	public function data_changes_not_spread_across_many_pages() {
		return array(
			'the homepage carried most of it'          => array(
				array_merge(
					array( $this->row( 'Referral', 'page', '/', 170, 20 ) ),
					$this->pages( 'Referral', 15, 10 )
				),
				array(),
				'The homepage, which is never a row of Referral, carried half of the change.',
			),
			'the homepage carried it at two addresses' => array(
				array_merge(
					array(
						$this->row( 'Referral', 'page', '/', 40, 20 ),
						$this->row( 'Referral', 'page', '/index.php', 40, 20 ),
					),
					$this->pages( 'Referral', 26, 10 )
				),
				array(),
				'The homepage\'s two addresses are one page, which carried 40 of the 300 visits.',
			),
			'a hidden page carried most of it'         => array(
				array_merge(
					array( $this->row( 'Referral', 'page', '/wp-login.php', 170, 20 ) ),
					$this->pages( 'Referral', 15, 10 )
				),
				array(),
				'A page no card names still carried half of the change.',
			),
			'the pages add up to less than the change' => array(
				$this->pages( 'Referral', 20, 10 ),
				array(),
				'Pages the report left out could have carried the other 100 visits.',
			),
			'the card has a row'                       => array(
				$this->pages( 'Referral', 30, 10 ),
				array(
					'channelSources' => array(
						$this->row( 'Referral', 'source', 'a.example.com', 140, 40 ),
					),
				),
				'A card with a row, a referring site with a third of the change, should not say it.',
			),
		);
	}

	public function test_get_cards__lists_both_sides_of_a_channel_that_is_the_net_of_parts_that_moved_both_ways() {
		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(
				array( 'Referral', 300, 200 ),
				array( 'Direct', 800, 800 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'Referral', 'source', 'a.example.com', 250, 50 ),
					$this->row( 'Referral', 'source', 'b.example.com', 50, 150 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Neither site is a share of Referral, so Referral should keep its card.' );
		$this->assertSame(
			array(
				array(
					'kind'         => 'SOURCE_TYPE',
					'role'         => 'CONTEXT',
					'label'        => 'Referring site',
					'value'        => array( 'text' => 'a.example.com' ),
					'entity_delta' => 200,
				),
				array(
					'kind'         => 'SOURCE_TYPE',
					'role'         => 'CONTEXT',
					'label'        => 'Referring site',
					'value'        => array( 'text' => 'b.example.com' ),
					'entity_delta' => -100,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'Both sides should be rows with their own changes and no share.'
		);
		$this->assertSame(
			array(
				array( 'a.example.com', 0.0, true ),
				array( 'b.example.com', 0.0, false ),
			),
			array_map(
				fn( $attribute ) => array( $attribute['label'], $attribute['sharePct'], $attribute['oversized'] ),
				$key_factors->get_cards()[0]['attributes']
			),
			'The panel should mark the side that moved further than Referral, the same way, as oversized, and not the side that moved against it.'
		);
	}

	public function test_get_cards__lists_both_devices_of_a_channel_that_is_the_net_of_devices_that_moved_both_ways() {
		// Direct gained 400 visits on desktop and lost 300 on mobile. Every
		// visitor is new, so its visitor type explains nothing.
		$key_factors = $this->build(
			array( 1600, 1500 ),
			array(),
			array(
				'channelBreakdowns' => array(
					array(
						'channel'  => 'Direct',
						'device'   => 'desktop',
						'userType' => 'new',
						'current'  => 900,
						'previous' => 500,
					),
					array(
						'channel'  => 'Direct',
						'device'   => 'mobile',
						'userType' => 'new',
						'current'  => 300,
						'previous' => 600,
					),
					array(
						'channel'  => 'Organic Search',
						'device'   => '(not set)',
						'userType' => '(not set)',
						'current'  => 400,
						'previous' => 400,
					),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Direct' ), $this->get_card_titles( $key_factors ), 'Direct should be the only card.' );
		$this->assertSame(
			array(
				array(
					'kind'         => 'READER_DEVICE',
					'role'         => 'CONTEXT',
					'label'        => 'Reader device',
					'value'        => array( 'text' => 'desktop' ),
					'entity_delta' => 400,
				),
				array(
					'kind'         => 'READER_DEVICE',
					'role'         => 'CONTEXT',
					'label'        => 'Reader device',
					'value'        => array( 'text' => 'mobile' ),
					'entity_delta' => -300,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'Both devices should be rows with their own changes and no share, though desktop moved further than Direct.'
		);
		$this->assertSame(
			array(
				array( 'DEVICE', 'desktop', 900, 500, 0.0, true ),
				array( 'DEVICE', 'mobile', 300, 600, 0.0, false ),
			),
			array_map(
				fn( $attribute ) => array( $attribute['kind'], $attribute['label'], $attribute['current'], $attribute['previous'], $attribute['sharePct'], $attribute['oversized'] ),
				$key_factors->get_cards()[0]['attributes']
			),
			'The panel should show both devices, and mark desktop, which moved further than Direct, as oversized.'
		);
	}

	public function test_get_cards__lists_a_page_that_moved_further_than_its_channel_with_its_own_change_and_marks_it_oversized() {
		// `/post` gained 108 visits, more than the 100 Referral gained, since
		// `/old-post/` lost 8.
		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(
				array( 'Referral', 600, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Referral', 'page', '/post', 208, 100 ),
					$this->row( 'Referral', 'page', '/old-post/', 392, 400 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Referral should keep its card, since a page takes a card only as a new post.' );
		$this->assertSame(
			array(
				array(
					'kind'         => 'TARGET_PAGE',
					'role'         => 'CONTEXT',
					'label'        => 'Target page',
					'value'        => array( 'text' => '/post' ),
					'entity_delta' => 108,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'The page should be context with its own change and no share, never a share above 100%.'
		);
		$this->assertSame(
			array(
				'kind'      => 'LANDING_PAGE',
				'label'     => '/post',
				'current'   => 208,
				'previous'  => 100,
				'sharePct'  => 0.0,
				'oversized' => true,
			),
			$key_factors->get_cards()[0]['attributes'][0],
			'The panel should mark the page as oversized, so it can say the page is more than the channel\'s net change.'
		);
	}

	public function test_get_cards__lists_a_homepage_that_moved_further_than_direct_as_its_only_page_row() {
		// Direct gained 57 visits: 61 on its homepage and 20 on `/a/`, while
		// `/b/` lost 24. On oi.ie on 2025-08-01 (service §5.10 step 8c), Direct
		// gained 57 with 61 on its homepage. The homepage is more than Direct's
		// net change, so it fills the card on its own: `/a/` beside it would
		// take the card's rows past its change.
		$key_factors = $this->build(
			array( 1057, 1000 ),
			array(
				array( 'Direct', 457, 400 ),
				array( 'Organic Search', 600, 600 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Direct', 'page', '/', 161, 100 ),
					$this->row( 'Direct', 'page', '/a/', 70, 50 ),
					$this->row( 'Direct', 'page', '/b/', 226, 250 ),
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'kind'         => 'HOMEPAGE',
					'role'         => 'CONTEXT',
					'label'        => 'Homepage',
					'entity_delta' => 61,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'The homepage should be context with its own change and no share, and the only row.'
		);
		$this->assertSame(
			array(
				array(
					'kind'      => 'LANDING_PAGE',
					'label'     => '/',
					'current'   => 161,
					'previous'  => 100,
					'sharePct'  => 0.0,
					'oversized' => true,
				),
			),
			$key_factors->get_cards()[0]['attributes'],
			'The panel should mark the homepage as oversized.'
		);
	}

	public function test_get_cards__lists_a_device_that_moved_a_little_further_than_its_channel_as_all_of_its_change() {
		// Organic Search lost 200 visits on desktop and gained 5 on mobile, too
		// few to count, so desktop carried all of its drop of 195.
		$key_factors = $this->build(
			array( 705, 900 ),
			array(),
			array(
				'channelBreakdowns' => array(
					array(
						'channel'  => 'Organic Search',
						'device'   => 'desktop',
						'userType' => 'new',
						'current'  => 100,
						'previous' => 300,
					),
					array(
						'channel'  => 'Organic Search',
						'device'   => 'mobile',
						'userType' => 'new',
						'current'  => 105,
						'previous' => 100,
					),
					array(
						'channel'  => 'Direct',
						'device'   => '(not set)',
						'userType' => '(not set)',
						'current'  => 500,
						'previous' => 500,
					),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Organic Search' ), $this->get_card_titles( $key_factors ), 'Organic Search should be the only card.' );
		$this->assertSame(
			array(
				array(
					'kind'                       => 'READER_DEVICE',
					'role'                       => 'DECOMPOSITION',
					'label'                      => 'Reader device',
					'value'                      => array( 'text' => 'desktop' ),
					'share_of_parent_change_pct' => 100.0,
					'entity_delta'               => -200,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'Desktop should carry all of the change, with its own figure.'
		);
		$this->assertSame(
			array( 100.0, false ),
			array( $key_factors->get_cards()[0]['attributes'][0]['sharePct'], $key_factors->get_cards()[0]['attributes'][0]['oversized'] ),
			'The panel should show desktop as all of the change, not as more than it.'
		);
	}

	public function test_get_cards__does_not_list_a_visitor_type_that_changed_no_more_than_its_share_of_its_channel() {
		// New visitors have 90.8% of Referral's visits and carried 95% of its
		// rise. Returning visitors have 54.2% of Organic Social's visits and
		// carried 88.9% of its rise.
		$key_factors = $this->build(
			array( 2180, 1800 ),
			array(),
			array(
				'channelBreakdowns' => array(
					array(
						'channel'  => 'Referral',
						'device'   => '(not set)',
						'userType' => 'new',
						'current'  => 1090,
						'previous' => 900,
					),
					array(
						'channel'  => 'Referral',
						'device'   => '(not set)',
						'userType' => 'returning',
						'current'  => 110,
						'previous' => 100,
					),
					array(
						'channel'  => 'Organic Social',
						'device'   => '(not set)',
						'userType' => 'new',
						'current'  => 220,
						'previous' => 200,
					),
					array(
						'channel'  => 'Organic Social',
						'device'   => '(not set)',
						'userType' => 'returning',
						'current'  => 260,
						'previous' => 100,
					),
					array(
						'channel'  => 'Direct',
						'device'   => '(not set)',
						'userType' => '(not set)',
						'current'  => 500,
						'previous' => 500,
					),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral', 'CHANNEL Organic Social' ), $this->get_card_titles( $key_factors ), 'Both channels that rose should be cards.' );
		$this->assertSame(
			array(
				array(),
				array( array( 'USER_TYPE', 'returning', 88.9 ) ),
			),
			array_map(
				fn( $card ) => array_map( fn( $attribute ) => array( $attribute['kind'], $attribute['label'], $attribute['sharePct'] ), $card['attributes'] ),
				$key_factors->get_cards()
			),
			'Referral should not list its new visitors, who only show where its visitors already were. Organic Social should list its returning visitors.'
		);
	}

	public function test_get_cards__lists_only_rows_of_the_cut_of_its_first_row_though_a_later_one_is_larger() {
		// Referral gained 100 visits: 19 on `/a/`, and 70 from new visitors,
		// who have 52.9% of its visits. Together they add up to no more than
		// Referral's change, but a page and a visitor type are two cuts of the
		// same visits, which overlap by an unknown amount, and the page comes
		// first. On oi.ie on 2026-04-03 (service §5.10 step 8c.4), a page at
		// 18.7% is kept, and new visitors at 99.2% are left out.
		$breakdowns = array(
			array(
				'channel'  => 'Referral',
				'device'   => '(not set)',
				'userType' => 'new',
				'current'  => 370,
				'previous' => 300,
			),
			array(
				'channel'  => 'Referral',
				'device'   => '(not set)',
				'userType' => 'returning',
				'current'  => 330,
				'previous' => 300,
			),
			array(
				'channel'  => 'Direct',
				'device'   => '(not set)',
				'userType' => '(not set)',
				'current'  => 400,
				'previous' => 400,
			),
		);

		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(),
			array(
				'channelBreakdowns' => $breakdowns,
				'channelPages'      => array( $this->row( 'Referral', 'page', '/a/', 119, 100 ) ),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Referral should be the only card.' );
		$this->assertSame(
			array( array( array( 'TARGET_PAGE', '/a/', 19.0, 19 ) ) ),
			$this->get_card_rows( $key_factors ),
			'Referral should list its page, and not its new visitors beside it.'
		);

		$this->assertSame(
			array( array( array( 'VISITOR_TYPE', 'new', 70.0, 70 ) ) ),
			$this->get_card_rows( $this->build( array( 1100, 1000 ), array(), array( 'channelBreakdowns' => $breakdowns ) ) ),
			'Without the page, Referral should list its new visitors.'
		);
	}

	public function test_get_cards__does_not_list_a_page_beside_a_referring_site() {
		// Referral gained 100 visits: 30 from `a.example.com`, 20 from
		// `b.example.com` and 50 on `/a/`. A referring site and a page are two
		// cuts of the same visits, and the referring site comes first, though
		// the page carried more.
		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(
				array( 'Referral', 600, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'Referral', 'source', 'a.example.com', 80, 50 ),
					$this->row( 'Referral', 'source', 'b.example.com', 70, 50 ),
				),
				'channelPages'   => array( $this->row( 'Referral', 'page', '/a/', 150, 100 ) ),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Neither site carried most of the change, so Referral should keep its card.' );
		$this->assertSame(
			array( array( array( 'SOURCE_TYPE', 'a.example.com', 30.0, 30 ) ) ),
			$this->get_card_rows( $key_factors ),
			'Referral should list the site that carried a quarter of its change, and not the page beside it.'
		);
	}

	public function test_get_cards__keeps_the_two_sides_of_a_net_together_though_they_are_of_two_cuts() {
		// Referral gained 100 visits: 105 on a post published in the period,
		// while `b.example.com` lost 20. Neither side has a share, so neither
		// is counted twice beside the other.
		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(
				array( 'Referral', 600, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelPages'   => array( $this->row( 'Referral', 'page', '/new-post/', 105, 0 ) ),
				'channelSources' => array( $this->row( 'Referral', 'source', 'b.example.com', 30, 50 ) ),
				'content'        => array( $this->post( '/new-post/', 'New post', 105 ) ),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'The post is no share of Referral, so Referral should keep its card.' );
		$this->assertSame(
			array(
				array(
					array( 'TARGET_PAGE', '/new-post/', null, 105 ),
					array( 'SOURCE_TYPE', 'b.example.com', null, -20 ),
				),
			),
			$this->get_card_rows( $key_factors ),
			'Referral should list the post and the site as the two sides of a net, each with its own change.'
		);
	}

	public function test_get_cards__lists_no_more_rows_than_add_up_to_the_change_of_their_card() {
		// The cases of service §5.10 step 8c.4. Direct gained 500 visits: 461
		// on its homepage and 247 on `/a/`, while `/b/` lost 208. Organic
		// Social gained 500: 412 from x.com and 173 from linkedin.com, while
		// facebook.com lost 85. Each card's second row would take its rows
		// past 100% of its change.
		$key_factors = $this->build(
			array( 3000, 2000 ),
			array(
				array( 'Direct', 1500, 1000 ),
				array( 'Organic Social', 1500, 1000 ),
			),
			array(
				'channelPages'   => array(
					$this->row( 'Direct', 'page', '/', 861, 400 ),
					$this->row( 'Direct', 'page', '/a/', 347, 100 ),
					$this->row( 'Direct', 'page', '/b/', 292, 500 ),
				),
				'channelSources' => array(
					$this->row( 'Organic Social', 'source', 'x.com', 512, 100 ),
					$this->row( 'Organic Social', 'source', 'linkedin.com', 273, 100 ),
					$this->row( 'Organic Social', 'source', 'facebook.com', 715, 800 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Direct', 'CHANNEL Organic Social' ), $this->get_card_titles( $key_factors ), 'Both channels should keep their cards.' );
		$this->assertSame(
			array(
				array( array( 'HOMEPAGE', null, 92.2, 461 ) ),
				array( array( 'SOURCE_TYPE', 'x.com', 82.4, 412 ) ),
			),
			$this->get_card_rows( $key_factors ),
			'Direct should list only its homepage, and Organic Social only x.com.'
		);
	}

	public function test_get_cards__lists_the_assistant_of_ai_assistant_without_making_it_the_card() {
		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(
				array( 'AI Assistant', 110, 10 ),
				array( 'Direct', 990, 990 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'AI Assistant', 'source', 'chat.openai.com', 85, 5 ),
					$this->row( 'AI Assistant', 'source', 'perplexity', 25, 5 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL AI Assistant' ), $this->get_card_titles( $key_factors ), 'An assistant should never take the channel\'s card.' );
		$this->assertSame(
			array(
				'kind'                       => 'SOURCE_TYPE',
				'role'                       => 'DECOMPOSITION',
				'label'                      => 'Assistant',
				'value'                      => array( 'text' => 'chatgpt.com' ),
				'share_of_parent_change_pct' => 80.0,
				'entity_delta'               => 80,
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'][0],
			'ChatGPT should be the `Assistant` row, named as the service names it.'
		);
		$this->assertSame( 'ASSISTANT', $key_factors->get_cards()[0]['attributes'][0]['kind'], 'The panel should show the row as an assistant.' );
	}

	public function test_get_cards__makes_a_campaign_that_carried_most_of_its_channels_change_the_card() {
		$key_factors = $this->build(
			array( 1100, 1000 ),
			array(
				array( 'Email', 200, 100 ),
				array( 'Direct', 900, 900 ),
			),
			array(
				'channelCampaigns' => array(
					$this->row( 'Email', 'campaign', 'Newsletter_October_2025', 90, 0 ),
					$this->row( 'Email', 'campaign', '20103244', 10, 0 ),
				),
			)
		);

		$this->assertSame( array( 'CAMPAIGN the October 2025 newsletter' ), $this->get_card_titles( $key_factors ), 'The campaign should take Email\'s card, named for readers.' );
		$this->assertSame( 'CAMPAIGN', $key_factors->get_cards()[0]['kind'], 'The panel should show a campaign card.' );
	}

	public function test_get_cards__leaves_out_search_engines_and_hosts_no_reader_would_recognise_as_sources() {
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 600, 300 ),
				array( 'Direct', 700, 700 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'Referral', 'source', 'google.co.uk', 200, 0 ),
					$this->row( 'Referral', 'source', 'staging.example.com', 200, 100 ),
					$this->row( 'Referral', 'source', '(not set)', 200, 100 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'No source should take Referral\'s card.' );
		$this->assertSame( array(), $key_factors->get_cards()[0]['attributes'], 'No source should be a row.' );
	}

	public function test_get_cards__shows_one_card_moving_against_a_period_that_dropped_as_offsetting() {
		// The site dropped by 300 visits, Organic Search by 400, and Organic
		// Social and Email rose against it.
		$key_factors = $this->build(
			array( 1700, 2000 ),
			array(
				array( 'Organic Search', 1100, 1500 ),
				array( 'Organic Social', 400, 300 ),
				array( 'Direct', 140, 140 ),
				array( 'Email', 60, 60 ),
			),
			array(
				'channelBreakdowns' => array(
					array(
						'channel'  => 'Organic Search',
						'device'   => '(not set)',
						'userType' => '(not set)',
						'current'  => 1100,
						'previous' => 1500,
					),
					array(
						'channel'  => 'Organic Social',
						'device'   => '(not set)',
						'userType' => '(not set)',
						'current'  => 400,
						'previous' => 300,
					),
					array(
						'channel'  => 'Email',
						'device'   => '(not set)',
						'userType' => '(not set)',
						'current'  => 100,
						'previous' => 60,
					),
					array(
						'channel'  => 'Direct',
						'device'   => '(not set)',
						'userType' => '(not set)',
						'current'  => 100,
						'previous' => 140,
					),
				),
			)
		);

		$this->assertSame(
			array( 'CHANNEL Organic Search', 'CHANNEL Direct', 'CHANNEL Organic Social' ),
			$this->get_card_titles( $key_factors ),
			'The cards should be the channels that dropped, then the largest one that rose, but not Email, a second channel moving against the drop.'
		);

		$offset = $key_factors->get_decomposition()['key_factors'][2];

		$this->assertSame(
			array( 'OFFSET', 'NET_CHANGE', 33.3 ),
			array( $offset['role'], $offset['share_basis'], $offset['traffic_impact_pct'] ),
			'Organic Social should offset a third of the 300 visits the site lost.'
		);
	}

	public function test_get_cards__shows_both_sides_of_a_flat_period_whose_channels_moved_against_each_other() {
		$key_factors = $this->build(
			array( 1000, 1000 ),
			array(
				array( 'Organic Search', 400, 600 ),
				array( 'Referral', 350, 200 ),
				array( 'Organic Social', 150, 100 ),
				array( 'Direct', 100, 100 ),
			)
		);

		$decomposition = $key_factors->get_decomposition();

		$this->assertSame( 'OFFSETTING', $decomposition['shape'], 'A flat period whose channels moved against each other should be `OFFSETTING`.' );
		$this->assertSame(
			array(
				array( 'Organic Search', 'PRIMARY' ),
				array( 'Referral', 'OFFSET' ),
			),
			array_map( fn( $card ) => array( $card['title'], $card['role'] ), array_slice( $decomposition['key_factors'], 0, 2 ) ),
			'The channel that moved most should be primary, and the largest channel moving against it offsetting.'
		);
		$this->assertCount( 3, $decomposition['key_factors'], 'The free slot should take the next channel of either side.' );
		$this->assertFalse( $key_factors->is_steady(), 'An offsetting period should not be steady.' );
	}

	public function test_get_cards__makes_the_other_side_of_a_flat_period_primary_when_a_part_of_the_largest_channel_shows_less() {
		// Referral gained 1,000 visits and Direct lost 800, but `substack.com`
		// takes Referral's card with 550, which reads as the smaller story.
		$key_factors = $this->build(
			array( 5200, 5000 ),
			array(
				array( 'Referral', 2000, 1000 ),
				array( 'Direct', 1200, 2000 ),
				array( 'Organic Search', 2000, 2000 ),
			),
			array(
				'channelSources' => array(
					$this->row( 'Referral', 'source', 'substack.com', 550, 0 ),
					$this->row( 'Referral', 'source', 'b.example.com', 300, 100 ),
				),
			)
		);

		$this->assertSame(
			array(
				array( 'Direct', 'PRIMARY' ),
				array( 'substack.com', 'OFFSET' ),
			),
			array_map( fn( $card ) => array( $card['title'], $card['role'] ), $key_factors->get_decomposition()['key_factors'] ),
			'Direct should be primary, and `substack.com` should offset it.'
		);
	}

	/**
	 * @dataProvider data_period_lengths
	 *
	 * @param int   $days_in_period The number of days in the period.
	 * @param array $card_titles    The titles of the cards.
	 */
	public function test_get_cards__scales_the_smallest_change_of_a_card_with_the_length_of_the_period( $days_in_period, array $card_titles ) {
		// Referral gained 5 visits, which is enough in 7 days, whose smallest
		// change is 3 visits, but not in 28, whose smallest change is 10.
		$key_factors = $this->build(
			array( 500, 400 ),
			array(
				array( 'Organic Search', 395, 300 ),
				array( 'Referral', 105, 100 ),
			),
			array(),
			$days_in_period
		);

		$this->assertSame( $card_titles, $this->get_card_titles( $key_factors ), 'The cards should take the channels that moved enough for the period\'s length.' );
	}

	public function data_period_lengths() {
		return array(
			'7 days'  => array( 7, array( 'CHANNEL Organic Search', 'CHANNEL Referral' ) ),
			'28 days' => array( 28, array( 'CHANNEL Organic Search' ) ),
		);
	}

	public function test_get_cards__groups_the_paid_channels_when_two_of_them_moved_materially() {
		$key_factors = $this->build(
			array( 955, 850 ),
			array(
				array( 'Direct', 500, 500 ),
				array( 'Paid Search', 300, 100 ),
				array( 'Paid Social', 100, 200 ),
				array( 'Display', 55, 50 ),
			),
			array(
				'channelCampaigns' => array(
					$this->row( 'Paid Search', 'campaign', 'Spring sale', 180, 30 ),
				),
			)
		);

		$this->assertSame(
			array(
				'dimension'          => 'TRAFFIC_CHANNELS',
				'entity_kind'        => 'CHANNEL_GROUP',
				'title'              => 'Paid traffic',
				'volume'             => 455,
				'delta'              => 105,
				'excess'             => 61.8,
				'outsized'           => true,
				'is_large_share'     => true,
				'direction'          => 'UP',
				'traffic_impact_pct' => 51.2,
				'metric_type'        => 'DELTA',
				'share_basis'        => 'GROSS_CHANGE',
				'role'               => 'PRIMARY',
				'attributes'         => array(
					array(
						'kind'                     => 'CHANNEL',
						'role'                     => 'DECOMPOSITION',
						'label'                    => 'Channel',
						'value'                    => array( 'text' => 'Paid Search' ),
						'entity_delta'             => 200,
						'share_of_group_gross_pct' => 65.6,
						'campaign'                 => 'Spring sale',
						'campaign_delta'           => 150,
					),
					array(
						'kind'                     => 'CHANNEL',
						'role'                     => 'DECOMPOSITION',
						'label'                    => 'Channel',
						'value'                    => array( 'text' => 'Paid Social' ),
						'entity_delta'             => -100,
						'share_of_group_gross_pct' => 32.8,
					),
				),
			),
			$key_factors->get_decomposition()['key_factors'][0],
			'The paid channels should be one card, with the two that moved materially as rows, each with its share of the paid channels\' 305 visits of movement.'
		);
		$this->assertSame(
			array( 'CHANNEL_GROUP', array( 'TRAFFIC_CHANNEL', 'TRAFFIC_CHANNEL' ) ),
			array( $key_factors->get_cards()[0]['kind'], array_column( $key_factors->get_cards()[0]['attributes'], 'kind' ) ),
			'The panel should show the group with its channels.'
		);
	}

	public function test_get_cards__keeps_the_paid_channels_apart_when_only_one_of_them_moved_materially() {
		$key_factors = $this->build(
			array( 1205, 1000 ),
			array(
				array( 'Direct', 600, 500 ),
				array( 'Paid Search', 500, 400 ),
				array( 'Display', 105, 100 ),
			)
		);

		// Both gained 100 visits, and Paid Search moved further beyond the
		// site's own rate, so it ranks first.
		$this->assertSame( array( 'CHANNEL Paid Search', 'CHANNEL Direct' ), $this->get_card_titles( $key_factors ), 'Paid Search should be a channel card of its own.' );
	}

	/**
	 * @dataProvider data_spread_rises
	 *
	 * @param array  $channels The channels, each as `array( title, current, previous )`.
	 * @param string $shape    The shape.
	 */
	public function test_get_decomposition__gives_a_rise_spread_over_its_channels_the_shape_of_its_cards( array $channels, $shape ) {
		$visits = array(
			array_sum( array_column( $channels, 1 ) ),
			array_sum( array_column( $channels, 2 ) ),
		);

		$this->assertSame( $shape, $this->build( $visits, $channels )->get_decomposition()['shape'], 'The rise should have the shape of its cards.' );
	}

	public function data_spread_rises() {
		$small_channels = array_map(
			fn( $title ) => array( $title, 69, 60 ),
			array( 'Email', 'Referral', 'Direct', 'Organic Social', 'Organic Video', 'Affiliates', 'Audio', 'SMS', 'Mobile Push Notifications', 'Unassigned' )
		);

		return array(
			'three channels with cards'                 => array(
				array(
					array( 'Organic Search', 440, 400 ),
					array( 'Referral', 340, 300 ),
					array( 'Direct', 340, 300 ),
				),
				'DIFFUSE',
			),
			// Organic Search carried 40 of the 130 visits gained, but no other
			// channel gained enough for a card, and the service names at least
			// two primary cards for a diffuse rise.
			'one channel with a card of many that rose' => array(
				array_merge( array( array( 'Organic Search', 440, 400 ) ), $small_channels ),
				'CONCENTRATED',
			),
		);
	}

	public function test_get_decomposition__adds_the_cards_up_from_the_site_totals_when_the_channels_count_fewer_previous_visits() {
		$decomposition = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 400, 400 ),
			)
		)->get_decomposition();

		$this->assertSame(
			array( 1000, 1300, 0 ),
			array( $decomposition['opening_sessions'], $decomposition['closing_sessions'], $decomposition['residual_delta'] ),
			'The cards should add up from the site\'s totals, since the channels count fewer visits in the previous period than the site.'
		);
	}

	public function test_get_decomposition__leaves_out_the_excess_outsized_and_large_share_fields_of_a_card_without_them() {
		// Every channel rose at the site's own rate, 20%.
		$card = $this->build(
			array( 1200, 1000 ),
			array(
				array( 'Organic Search', 600, 500 ),
				array( 'Direct', 360, 300 ),
				array( 'Referral', 240, 200 ),
			)
		)->get_decomposition()['key_factors'][2];

		$this->assertSame( 'Referral', $card['title'], 'The third card should be Referral.' );
		$this->assertArrayNotHasKey( 'excess', $card, 'A card that changed at the site\'s rate should have no excess change.' );
		$this->assertArrayNotHasKey( 'outsized', $card, 'A card that changed at the site\'s rate should not be outsized.' );
		$this->assertArrayNotHasKey( 'is_large_share', $card, 'A card with under a quarter of the site\'s movement should not be a large share.' );
	}
}
