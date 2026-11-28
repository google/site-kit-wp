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
	 * @param array $page_titles     Optional. The titles of the site's pages, keyed by path. Default empty array.
	 * @return Key_Factors The key factors.
	 */
	private function build( array $visits, array $channels, array $contextual_data = array(), $days_in_period = 28, array $page_titles = array() ) {
		$breakdowns = array_map(
			fn( $channel ) => $this->breakdown( $channel[0], '(not set)', '(not set)', $channel[1], $channel[2] ),
			$channels
		);

		return new Key_Factors(
			array_merge( array( 'channelBreakdowns' => $breakdowns ), $contextual_data ),
			array(
				'current'  => $visits[0],
				'previous' => $visits[1],
			),
			$days_in_period,
			'/',
			fn( $path ) => isset( $page_titles[ $path ] ) ? $page_titles[ $path ] : null
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
	 * Gets a `channelBreakdowns` row.
	 *
	 * @param string $channel   The channel.
	 * @param string $device    The device, or `(not set)`.
	 * @param string $user_type The visitor type, or `(not set)`.
	 * @param int    $current   The visits of the selected period.
	 * @param int    $previous  The visits of the compare period.
	 * @return array The row.
	 */
	private function breakdown( $channel, $device, $user_type, $current, $previous ) {
		return array(
			'channel'  => $channel,
			'device'   => $device,
			'userType' => $user_type,
			'current'  => $current,
			'previous' => $previous,
		);
	}

	/**
	 * Gets a `searchQueries` row.
	 *
	 * @param string $label    The keyword.
	 * @param int    $current  The keyword's clicks in the selected period.
	 * @param int    $previous The keyword's clicks in the compare period.
	 * @return array The row.
	 */
	private function query( $label, $current, $previous ) {
		return array(
			'label'            => $label,
			'current'          => $current,
			'previous'         => $previous,
			'positionCurrent'  => 2.0,
			'positionPrevious' => 2.0,
		);
	}

	/**
	 * Gets the `searchClicks` rows of the site's search clicks.
	 *
	 * @param int $current  The clicks of the selected period.
	 * @param int $previous The clicks of the compare period.
	 * @return array List of the one row.
	 */
	private function clicks( $current, $previous ) {
		return array(
			array(
				'current'  => $current,
				'previous' => $previous,
			),
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
	 * Gets each card of the decomposition by its title, role and share.
	 *
	 * @param Key_Factors $key_factors The key factors.
	 * @return array List of each card as `array( "{entity_kind} {title}", role, share_basis, traffic_impact_pct )`, with a null share basis for a card without one.
	 */
	private function get_card_shares( Key_Factors $key_factors ) {
		return array_map(
			fn( $card ) => array(
				"{$card['entity_kind']} {$card['title']}",
				$card['role'],
				isset( $card['share_basis'] ) ? $card['share_basis'] : null,
				$card['traffic_impact_pct'],
			),
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

	/**
	 * Gets the attributes of each card the panel shows, by their figures.
	 *
	 * @param Key_Factors $key_factors The key factors.
	 * @return array List of each card's attributes, each as `array( kind, label, sharePct, oversized )`.
	 */
	private function get_attributes( Key_Factors $key_factors ) {
		return array_map(
			fn( $card ) => array_map(
				fn( $attribute ) => array( $attribute['kind'], $attribute['label'], $attribute['sharePct'], $attribute['oversized'] ),
				$card['attributes']
			),
			$key_factors->get_cards()
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
		// Referral's card, and Direct offsets part of the rise. Referral's
		// landing page `/post` gained 225: with the site's 220, 145 more than
		// all of Referral gained, so at least 145 of the page's visits, most
		// of them, came from the site, and the page is a row of the site's
		// card, without a share. The example was written before the service
		// listed that row. Its landing page has a query string, which the
		// plugin's report doesn't.
		$key_factors = $this->build(
			array( 1250, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 450, 500 ),
			),
			array(
				'channelPages'   => array( $this->row( 'Referral', 'page', '/post', 400, 175 ) ),
				'channelSources' => array( $this->row( 'Referral', 'source', 'news.example', 520, 300 ) ),
				'searchClicks'   => $this->clicks( 900, 850 ),
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
						'attributes'           => array(
							array(
								'kind'         => 'TARGET_PAGE',
								'role'         => 'CONTEXT',
								'label'        => 'Target page',
								'value'        => array( 'text' => '/post' ),
								'entity_delta' => 225,
							),
						),
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
			'The decomposition should be the one of the service\'s request example: the referring site with its share of Referral and Referral\'s page, and the rest of Referral\'s rise as the residual.'
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
					'attributes'          => array(
						array(
							'kind'      => 'LANDING_PAGE',
							'label'     => '/post',
							'current'   => 400,
							'previous'  => 175,
							'sharePct'  => 0.0,
							'oversized' => false,
						),
					),
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
			'The panel should show the same cards, with the channel the referring site\'s share is of, and the page, which moved further than the site, not marked oversized.'
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
					$this->breakdown( 'Organic Search', 'mobile', 'new', 610, 600 ),
					$this->breakdown( 'Direct', 'desktop', 'returning', 400, 400 ),
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
		// a post published 5 days ago. Direct's card keeps the post's from
		// being the period's only card, which a part without rows doesn't take.
		$key_factors = $this->build(
			array( 1350, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 550, 500 ),
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
		// The homepage carried 80 of the 100 visits Direct gained.
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

	public function test_get_cards__lists_a_homepage_that_changed_with_its_share_of_directs_visits() {
		// The homepage has 80% of Direct's visits, and carried 80% of its rise.
		// Only a device that changed with its share of a channel's visits says
		// nothing, since a device says where the channel's visitors were.
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
			array(
				array(
					array( 'HOMEPAGE', null, 80.0, 80 ),
					array( 'TARGET_PAGE', '/a/', 20.0, 20 ),
				),
			),
			$this->get_card_rows( $key_factors ),
			'Direct should list its homepage, and then its page.'
		);
	}

	public function test_get_cards__does_not_list_a_homepage_that_carried_under_a_tenth_of_directs_change() {
		// Direct lost 2,000 visits: 150 on its homepage, and 1,850 on `/guide`.
		$key_factors = $this->build(
			array( 13000, 15000 ),
			array(
				array( 'Direct', 8000, 10000 ),
				array( 'Referral', 5000, 5000 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Direct', 'page', '/', 4850, 5000 ),
					$this->row( 'Direct', 'page', '/guide', 3150, 5000 ),
				),
			)
		);

		$this->assertSame(
			array( array( array( 'TARGET_PAGE', '/guide', 92.5, -1850 ) ) ),
			$this->get_card_rows( $key_factors ),
			'Direct should list its page, and not its homepage, which carried 7.5% of its drop.'
		);
	}

	/**
	 * @dataProvider data_pages_of_direct_beside_its_homepage
	 *
	 * @param array  $visits  The site's visits.
	 * @param array  $channels The channels.
	 * @param array  $pages   The `channelPages` rows of Direct.
	 * @param array  $rows    The rows of Direct's card.
	 * @param string $message The assertion message.
	 */
	public function test_get_cards__lists_a_page_of_direct_before_its_homepage_when_the_page_carried_more( array $visits, array $channels, array $pages, array $rows, $message ) {
		$key_factors = $this->build( $visits, $channels, array( 'channelPages' => $pages ) );

		$this->assertSame( array( $rows ), $this->get_card_rows( $key_factors ), $message );
	}

	public function data_pages_of_direct_beside_its_homepage() {
		return array(
			// Direct lost 82 visits: 36 on `/ingrid-cerqueira/`, 24 on its
			// homepage, and 22 on `/other/`.
			'a page that carried more'    => array(
				array( 1918, 2000 ),
				array(
					array( 'Direct', 918, 1000 ),
					array( 'Organic Search', 1000, 1000 ),
				),
				array(
					$this->row( 'Direct', 'page', '/', 540, 564 ),
					$this->row( 'Direct', 'page', '/ingrid-cerqueira/', 200, 236 ),
					$this->row( 'Direct', 'page', '/other/', 178, 200 ),
				),
				array(
					array( 'TARGET_PAGE', '/ingrid-cerqueira/', 43.9, -36 ),
					array( 'HOMEPAGE', null, 29.3, -24 ),
				),
				'The page that carried more of the drop should come first.',
			),
			// Direct lost 2,000 visits: 1,000 on its homepage, and 1,000 on
			// `/guide`.
			'a page that carried as much' => array(
				array( 13000, 15000 ),
				array(
					array( 'Direct', 8000, 10000 ),
					array( 'Referral', 5000, 5000 ),
				),
				array(
					$this->row( 'Direct', 'page', '/', 3600, 4600 ),
					$this->row( 'Direct', 'page', '/guide', 4400, 5400 ),
				),
				array(
					array( 'HOMEPAGE', null, 50.0, -1000 ),
					array( 'TARGET_PAGE', '/guide', 50.0, -1000 ),
				),
				'The homepage should keep its place on a tie.',
			),
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
				'searchClicks'  => $this->clicks( 2500, 2000 ),
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

	/**
	 * @dataProvider data_keywords_near_their_floor
	 *
	 * @param array  $visits          The site's visits.
	 * @param array  $search          Organic Search's visits, as `array( current, previous )`. Direct has the site's other visits.
	 * @param array  $contextual_data The search rows.
	 * @param array  $rows            The rows of Organic Search's card.
	 * @param string $message         The assertion message.
	 */
	public function test_get_cards__names_a_keyword_only_when_its_clicks_moved_enough( array $visits, array $search, array $contextual_data, array $rows, $message ) {
		$key_factors = $this->build(
			$visits,
			array(
				array( 'Organic Search', $search[0], $search[1] ),
				array( 'Direct', $visits[0] - $search[0], $visits[1] - $search[1] ),
			),
			$contextual_data
		);

		$this->assertSame( array( $rows ), $this->get_card_rows( $key_factors ), $message );
	}

	public function data_keywords_near_their_floor() {
		return array(
			'0.5% of the site\'s clicks'               => array(
				array( 1400, 1000 ),
				array( 1000, 600 ),
				array(
					'searchQueries' => array( $this->query( 'plant garlic', 200, 100 ) ),
					'searchClicks'  => $this->clicks( 2500, 2000 ),
				),
				array( array( 'SOURCE_TYPE', 'plant garlic', null, 100 ) ),
				'A keyword that gained 100 clicks, 4% of the site\'s 2,500, should be named.',
			),
			'under 0.5% of the site\'s clicks'         => array(
				array( 1508, 2000 ),
				array( 508, 1000 ),
				array(
					'searchQueries' => array( $this->query( 'irland auto n', 3, 20 ) ),
					'searchClicks'  => $this->clicks( 4000, 4300 ),
				),
				array(),
				'A keyword that lost 17 clicks, under 0.5% of the site\'s 4,300, should not be named.',
			),
			'a tenth of Organic Search without clicks' => array(
				array( 1200, 1000 ),
				array( 700, 500 ),
				array( 'searchQueries' => array( $this->query( 'summer recipes', 160, 100 ) ) ),
				array( array( 'SOURCE_TYPE', 'summer recipes', null, 60 ) ),
				'Without the site\'s clicks, a keyword that gained 60 clicks, 30% of the 200 visits Organic Search gained, should be named.',
			),
			'under a tenth of Organic Search without clicks' => array(
				array( 12000, 10000 ),
				array( 7000, 5000 ),
				array( 'searchQueries' => array( $this->query( 'summer recipes', 1150, 1000 ) ) ),
				array(),
				'Without the site\'s clicks, a keyword that gained 150 clicks, 7.5% of the 2,000 visits Organic Search gained, should not be named.',
			),
		);
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
				'searchClicks'  => $this->clicks( 2500, 2000 ),
			)
		);

		$this->assertSame(
			array( array( array( 'SOURCE_TYPE', 'plant garlic', null, 200 ) ) ),
			$this->get_card_rows( $key_factors ),
			'Organic Search should name the largest keyword a card may show.'
		);
	}

	/**
	 * @dataProvider data_brand_keywords
	 *
	 * @param string $brand   The keyword of the site's brand or domain.
	 * @param string $keyword The other keyword.
	 */
	public function test_get_cards__names_a_keyword_of_the_sites_brand_or_domain_like_any_other( $brand, $keyword ) {
		$key_factors = $this->build(
			array( 1400, 1000 ),
			array(
				array( 'Organic Search', 1000, 600 ),
				array( 'Direct', 400, 400 ),
			),
			array(
				'searchQueries' => array(
					$this->query( $brand, 400, 100 ),
					$this->query( $keyword, 300, 100 ),
				),
				'searchClicks'  => $this->clicks( 2500, 2000 ),
			)
		);

		$this->assertSame(
			array( array( array( 'SOURCE_TYPE', $brand, null, 300 ) ) ),
			$this->get_card_rows( $key_factors ),
			"Organic Search should name `$brand`, the keyword whose clicks moved most, as the service does."
		);
	}

	public function data_brand_keywords() {
		return array(
			// The domain of the test site, `home_url()`.
			'the domain'                    => array( 'example.org', 'summer recipes' ),
			'the domain as words'           => array( 'oi ie', 'car stickers' ),
			'the name as words'             => array( 'pico parker', 'parking sensor' ),
			'every word of the name'        => array( 'google merchandise store', 'google bag' ),
			'the product of a site section' => array( 'google search central', 'google core update' ),
		);
	}

	/**
	 * @dataProvider data_keywords_beyond_the_sites_clicks
	 *
	 * @param array  $visits          The site's visits.
	 * @param array  $search          Organic Search's visits, as `array( current, previous )`. Direct has the site's other visits.
	 * @param array  $contextual_data The search rows.
	 * @param string $keyword         The keyword.
	 * @param int    $change          The keyword's change in clicks.
	 * @param float  $share           The keyword's change as a share of the site's clicks.
	 */
	public function test_get_cards__marks_a_keyword_that_moved_further_than_the_sites_clicks_or_against_them( array $visits, array $search, array $contextual_data, $keyword, $change, $share ) {
		$key_factors = $this->build(
			$visits,
			array(
				array( 'Organic Search', $search[0], $search[1] ),
				array( 'Direct', $visits[0] - $search[0], $visits[1] - $search[1] ),
			),
			$contextual_data
		);

		$this->assertSame(
			array(
				array(
					'kind'                       => 'SOURCE_TYPE',
					'role'                       => 'CONTEXT',
					'label'                      => 'Search keyword',
					'value'                      => array( 'text' => $keyword ),
					'entity_delta'               => $change,
					'share_of_search_clicks_pct' => $share,
					'oversized_query'            => true,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'The keyword should be named, and marked as a change the site\'s other keywords moved against.'
		);
		$this->assertSame(
			array( array( array( 'SEARCH_KEYWORD', $keyword, $share, true ) ) ),
			$this->get_attributes( $key_factors ),
			'The panel should mark the keyword as oversized.'
		);
	}

	public function data_keywords_beyond_the_sites_clicks() {
		return array(
			// `holiday guide` gained 250 clicks, while the site gained 100.
			'further than the site\'s clicks' => array(
				array( 1500, 1000 ),
				array( 1000, 500 ),
				array(
					'searchQueries' => array( $this->query( 'holiday guide', 350, 100 ) ),
					'searchClicks'  => $this->clicks( 1100, 1000 ),
				),
				'holiday guide',
				250,
				22.7,
			),
			// `ai overview` lost 4,633 clicks, while the site gained 3,462.
			'against the site\'s clicks'      => array(
				array( 100000, 110382 ),
				array( 50000, 60382 ),
				array(
					'searchQueries' => array( $this->query( 'ai overview', 5367, 10000 ) ),
					'searchClicks'  => $this->clicks( 63462, 60000 ),
				),
				'ai overview',
				-4633,
				7.3,
			),
		);
	}

	public function test_get_cards__lists_a_keyword_without_a_share_when_the_sites_clicks_are_unknown() {
		$key_factors = $this->build(
			array( 1200, 1000 ),
			array(
				array( 'Organic Search', 700, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'searchQueries' => array( $this->query( 'summer recipes', 160, 100 ) ),
			)
		);

		$this->assertSame(
			array(
				array(
					'kind'         => 'SOURCE_TYPE',
					'role'         => 'CONTEXT',
					'label'        => 'Search keyword',
					'value'        => array( 'text' => 'summer recipes' ),
					'entity_delta' => 60,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'The keyword should be context, with its change in clicks and no share of the site\'s clicks.'
		);
		$this->assertSame(
			array(
				'kind'           => 'SEARCH_KEYWORD',
				'label'          => 'summer recipes',
				'current'        => 160,
				'previous'       => 100,
				'sharePct'       => 0.0,
				'oversized'      => false,
				'noSearchClicks' => true,
			),
			$key_factors->get_cards()[0]['attributes'][0],
			'The panel should say the site\'s clicks are unknown, so it shows no share.'
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
		// Direct's card keeps Facebook's from being the period's only card,
		// which a part without rows doesn't take.
		$key_factors = $this->build(
			array( 1350, 1000 ),
			array(
				array( 'Organic Social', 400, 100 ),
				array( 'Direct', 950, 900 ),
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
		$this->assertSame(
			array( array( array( 'SOURCE_TYPE', 'a.example.com', 15.0, 60 ) ) ),
			$this->get_card_rows( $key_factors ),
			'The site should be a row of the card, with over a tenth of its change.'
		);
	}

	/**
	 * @dataProvider data_parts_near_a_tenth_of_their_channel
	 *
	 * @param int   $current The visits of `partner.example` in the selected period, from 100.
	 * @param array $rows    The rows of Referral's card.
	 */
	public function test_get_cards__lists_a_part_of_a_channel_only_when_it_carried_a_tenth_of_its_change( $current, array $rows ) {
		$key_factors = $this->build(
			array( 11000, 10000 ),
			array(
				array( 'Referral', 2000, 1000 ),
				array( 'Direct', 9000, 9000 ),
			),
			array(
				'channelSources' => array( $this->row( 'Referral', 'source', 'partner.example', $current, 100 ) ),
			)
		);

		$this->assertSame( array( $rows ), $this->get_card_rows( $key_factors ), 'The site should be a row of the 1,000 visits Referral gained only with a tenth of them.' );
	}

	public function data_parts_near_a_tenth_of_their_channel() {
		return array(
			'12% of the change' => array( 220, array( array( 'SOURCE_TYPE', 'partner.example', 12.0, 120 ) ) ),
			'9% of the change'  => array( 190, array() ),
		);
	}

	/**
	 * @dataProvider data_two_large_parts
	 *
	 * @param array  $visits   The site's visits.
	 * @param array  $channels The channels.
	 * @param array  $sources  The `channelSources` rows of Organic Social.
	 * @param array  $rows     The rows of Organic Social's card.
	 * @param string $message  The assertion message.
	 */
	public function test_get_cards__lists_a_second_part_beyond_its_cards_change_only_when_both_parts_carried_three_tenths_of_it( array $visits, array $channels, array $sources, array $rows, $message ) {
		$key_factors = $this->build( $visits, $channels, array( 'channelSources' => $sources ) );

		$this->assertSame( array( 'CHANNEL Organic Social' ), $this->get_card_titles( $key_factors ), 'Organic Social should keep its card.' );
		$this->assertSame( array( $rows ), $this->get_card_rows( $key_factors ), $message );
	}

	public function data_two_large_parts() {
		return array(
			// `x.com` gained 31,582 visits and `linkedin.com` 27,746, while
			// Organic Social gained 58,941.
			'both over three tenths'        => array(
				array( 200000, 141059 ),
				array(
					array( 'Organic Social', 108941, 50000 ),
					array( 'Direct', 91059, 91059 ),
				),
				array(
					$this->row( 'Organic Social', 'source', 't.co', 41582, 10000 ),
					$this->row( 'Organic Social', 'source', 'linkedin.com', 37746, 10000 ),
					$this->row( 'Organic Social', 'source', 'facebook.com', 1000, 1387 ),
				),
				array(
					array( 'SOURCE_TYPE', 'x.com', null, 31582 ),
					array( 'SOURCE_TYPE', 'linkedin.com', null, 27746 ),
				),
				'Both sites should be rows, without the shares that would add up past 100%.',
			),
			// `x.com` gained 870 visits and `linkedin.com` 270, while Organic
			// Social gained 1,000.
			'the second under three tenths' => array(
				array( 20000, 19000 ),
				array(
					array( 'Organic Social', 2000, 1000 ),
					array( 'Direct', 18000, 18000 ),
				),
				array(
					$this->row( 'Organic Social', 'source', 't.co', 970, 100 ),
					$this->row( 'Organic Social', 'source', 'linkedin.com', 370, 100 ),
				),
				array( array( 'SOURCE_TYPE', 'x.com', 87.0, 870 ) ),
				'Only `x.com` should be a row, since `linkedin.com` would take the rows past 100%.',
			),
		);
	}

	/**
	 * @dataProvider data_pages_beside_a_part_that_took_its_channels_card
	 *
	 * @param array  $visits          The site's visits.
	 * @param array  $channels        The channels.
	 * @param array  $contextual_data The other rows.
	 * @param string $card_title      The title of the first card, the part's, with its kind.
	 * @param array  $rows            The rows of the part's card.
	 * @param array  $attributes      The attributes of the panel's card for the part.
	 * @param string $message         The assertion message.
	 */
	public function test_get_cards__lists_the_page_of_a_channel_on_the_card_of_its_part_when_most_of_the_page_came_through_it( array $visits, array $channels, array $contextual_data, $card_title, array $rows, array $attributes, $message ) {
		$key_factors = $this->build( $visits, $channels, $contextual_data );

		$this->assertSame( $card_title, $this->get_card_titles( $key_factors )[0], 'The part should take its channel\'s card.' );
		$this->assertSame( $rows, $this->get_card_rows( $key_factors )[0], $message );
		$this->assertSame( $attributes, $this->get_attributes( $key_factors )[0], 'The panel should show the same rows, and not mark the page oversized.' );
	}

	public function data_pages_beside_a_part_that_took_its_channels_card() {
		return array(
			// Facebook gained 6,785 visits and `/how-search-works` 6,543, 3,995
			// more than the 9,333 Organic Social gained, so at least 3,995 of
			// the page's visits, 61%, came from Facebook.
			'most of the page came from the site'       => array(
				array( 19333, 10000 ),
				array(
					array( 'Organic Social', 10333, 1000 ),
					array( 'Direct', 9000, 9000 ),
				),
				array(
					'channelPages'   => array( $this->row( 'Organic Social', 'page', '/how-search-works', 7000, 457 ) ),
					'channelSources' => array( $this->row( 'Organic Social', 'source', 'facebook.com', 7785, 1000 ) ),
				),
				'REFERRING_SITE Facebook',
				array( array( 'TARGET_PAGE', '/how-search-works', null, 6543 ) ),
				array( array( 'LANDING_PAGE', '/how-search-works', 0.0, false ) ),
				'The page should be a row of the site\'s card, with its own change and no share.',
			),
			// The campaign gained 650 visits and `/spring-sale` 800, 450 more
			// than the 1,000 Email gained: 56% of the page's visits.
			'most of the page came from the campaign'   => array(
				array( 11000, 10000 ),
				array(
					array( 'Email', 2000, 1000 ),
					array( 'Direct', 9000, 9000 ),
				),
				array(
					'channelPages'     => array( $this->row( 'Email', 'page', '/spring-sale', 900, 100 ) ),
					'channelCampaigns' => array( $this->row( 'Email', 'campaign', 'Spring Sale', 750, 100 ) ),
				),
				'CAMPAIGN Spring Sale',
				array( array( 'TARGET_PAGE', '/spring-sale', null, 800 ) ),
				array( array( 'LANDING_PAGE', '/spring-sale', 0.0, false ) ),
				'The page should be a row of the campaign\'s card, though it moved further than the campaign.',
			),
			// `partner.example` gained 915 visits and `/guide` 150, only 65
			// more than the 1,000 Referral gained: 43% of the page's visits.
			// Direct's card keeps the site's from being the period's only card,
			// which a part without rows doesn't take.
			'under half of the page came from the site' => array(
				array( 11100, 10000 ),
				array(
					array( 'Referral', 2000, 1000 ),
					array( 'Direct', 9100, 9000 ),
				),
				array(
					'channelPages'   => array( $this->row( 'Referral', 'page', '/guide', 250, 100 ) ),
					'channelSources' => array( $this->row( 'Referral', 'source', 'partner.example', 1015, 100 ) ),
				),
				'REFERRING_SITE partner.example',
				array(),
				array(),
				'The page should not be a row, since most of it could have come through other sites.',
			),
			// `other.example` lost 200 visits while Referral rose, so how much
			// of the page came from `partner.example` can't be told.
			'another site moved against the channel'    => array(
				array( 11100, 10000 ),
				array(
					array( 'Referral', 2000, 1000 ),
					array( 'Direct', 9100, 9000 ),
				),
				array(
					'channelPages'   => array( $this->row( 'Referral', 'page', '/guide', 900, 100 ) ),
					'channelSources' => array(
						$this->row( 'Referral', 'source', 'partner.example', 1000, 100 ),
						$this->row( 'Referral', 'source', 'other.example', 50, 250 ),
					),
				),
				'REFERRING_SITE partner.example',
				array(),
				array(),
				'The page should not be a row, since another site moved against Referral.',
			),
		);
	}

	public function test_get_cards__lists_a_page_of_a_channel_as_context_after_its_referring_site() {
		// Referral gained 1,000 visits: 350 from `partner.com`, and 400 on
		// `/guide`. A page is another cut of the same visits than a site, so
		// it follows the site without a share, which would read as adding up
		// with the site's.
		$key_factors = $this->build(
			array( 11000, 10000 ),
			array(
				array( 'Referral', 2000, 1000 ),
				array( 'Direct', 9000, 9000 ),
			),
			array(
				'channelPages'   => array( $this->row( 'Referral', 'page', '/guide', 500, 100 ) ),
				'channelSources' => array( $this->row( 'Referral', 'source', 'partner.com', 450, 100 ) ),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral' ), $this->get_card_titles( $key_factors ), 'Referral should keep its card.' );
		$this->assertSame(
			array(
				array(
					'kind'                       => 'SOURCE_TYPE',
					'role'                       => 'DECOMPOSITION',
					'label'                      => 'Referring site',
					'value'                      => array( 'text' => 'partner.com' ),
					'share_of_parent_change_pct' => 35.0,
					'entity_delta'               => 350,
				),
				array(
					'kind'         => 'TARGET_PAGE',
					'role'         => 'CONTEXT',
					'label'        => 'Target page',
					'value'        => array( 'text' => '/guide' ),
					'entity_delta' => 400,
				),
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'Referral should list the site with its share, and then the page as context, with its own change.'
		);
		$this->assertSame(
			array(
				array(
					array( 'REFERRING_SITE', 'partner.com', 35.0, false ),
					array( 'LANDING_PAGE', '/guide', 0.0, false ),
				),
			),
			$this->get_attributes( $key_factors ),
			'The panel should show the page without a share.'
		);
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

	/**
	 * @dataProvider data_devices_that_moved_further_than_their_channel
	 *
	 * @param array $visits     The site's visits.
	 * @param array $breakdowns The `channelBreakdowns` rows.
	 * @param array $row        The row of the card.
	 * @param array $attribute  The attribute of the panel's card, as `array( kind, label, current, previous, sharePct, oversized )`.
	 */
	public function test_get_cards__lists_the_visitor_type_and_not_a_device_that_moved_further_than_its_channel( array $visits, array $breakdowns, array $row, array $attribute ) {
		$key_factors = $this->build( $visits, array(), array( 'channelBreakdowns' => $breakdowns ) );

		$this->assertCount( 1, $key_factors->get_decomposition()['key_factors'], 'The channel that moved should be the only card.' );
		$this->assertSame(
			array( $row ),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'The device moved further than its channel, so it should be no row, and the visitor type should be the row.'
		);
		$this->assertSame(
			array( $attribute ),
			array_map(
				fn( $attribute ) => array( $attribute['kind'], $attribute['label'], $attribute['current'], $attribute['previous'], $attribute['sharePct'], $attribute['oversized'] ),
				$key_factors->get_cards()[0]['attributes']
			),
			'The panel should show the visitor type.'
		);
	}

	public function data_devices_that_moved_further_than_their_channel() {
		return array(
			// Direct gained 400 visits on desktop and lost 300 on mobile. Every
			// visitor is new.
			'devices that moved both ways'         => array(
				array( 1600, 1500 ),
				array(
					$this->breakdown( 'Direct', 'desktop', 'new', 900, 500 ),
					$this->breakdown( 'Direct', 'mobile', 'new', 300, 600 ),
					$this->breakdown( 'Organic Search', '(not set)', '(not set)', 400, 400 ),
				),
				array(
					'kind'                       => 'VISITOR_TYPE',
					'role'                       => 'DECOMPOSITION',
					'label'                      => 'Visitor type',
					'value'                      => array( 'text' => 'new' ),
					'share_of_parent_change_pct' => 100.0,
					'entity_delta'               => 100,
				),
				array( 'USER_TYPE', 'new', 1200, 1100, 100.0, false ),
			),
			// Organic Search lost 200 visits on desktop and gained 5 on mobile,
			// so it lost 195.
			'a device that moved a little further' => array(
				array( 705, 900 ),
				array(
					$this->breakdown( 'Organic Search', 'desktop', 'new', 100, 300 ),
					$this->breakdown( 'Organic Search', 'mobile', 'new', 105, 100 ),
					$this->breakdown( 'Direct', '(not set)', '(not set)', 500, 500 ),
				),
				array(
					'kind'                       => 'VISITOR_TYPE',
					'role'                       => 'DECOMPOSITION',
					'label'                      => 'Visitor type',
					'value'                      => array( 'text' => 'new' ),
					'share_of_parent_change_pct' => 100.0,
					'entity_delta'               => -195,
				),
				array( 'USER_TYPE', 'new', 205, 400, 100.0, false ),
			),
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

	/**
	 * @dataProvider data_slices_that_moved_further_than_their_channel_alone
	 *
	 * @param array $visits     The site's visits.
	 * @param array $breakdowns The `channelBreakdowns` rows.
	 * @param array $row        The row of the card.
	 * @param array $attribute  The attribute of the panel's card, as `array( kind, label, sharePct, oversized )`.
	 */
	public function test_get_cards__lists_a_device_or_visitor_type_that_moved_further_than_its_channel_when_the_card_has_no_other_row( array $visits, array $breakdowns, array $row, array $attribute ) {
		$key_factors = $this->build( $visits, array(), array( 'channelBreakdowns' => $breakdowns ) );

		$this->assertSame(
			array( $row ),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'],
			'The slice should be the card\'s only row, as context with its own change and no share.'
		);
		$this->assertSame( array( array( $attribute ) ), $this->get_attributes( $key_factors ), 'The panel should mark it as oversized.' );
	}

	public function data_slices_that_moved_further_than_their_channel_alone() {
		return array(
			// Organic Search lost 200 visits on desktop and gained 5 on mobile,
			// so it lost 195. Its visitor types are unknown.
			'a device'       => array(
				array( 705, 900 ),
				array(
					$this->breakdown( 'Organic Search', 'desktop', '(not set)', 100, 300 ),
					$this->breakdown( 'Organic Search', 'mobile', '(not set)', 105, 100 ),
					$this->breakdown( 'Direct', '(not set)', '(not set)', 500, 500 ),
				),
				array(
					'kind'         => 'READER_DEVICE',
					'role'         => 'CONTEXT',
					'label'        => 'Reader device',
					'value'        => array( 'text' => 'desktop' ),
					'entity_delta' => -200,
				),
				array( 'DEVICE', 'desktop', 0.0, true ),
			),
			// Direct gained 140 new visitors and lost 40 returning ones.
			'a visitor type' => array(
				array( 1100, 1000 ),
				array(
					$this->breakdown( 'Direct', '(not set)', 'new', 440, 300 ),
					$this->breakdown( 'Direct', '(not set)', 'returning', 160, 200 ),
					$this->breakdown( 'Organic Search', '(not set)', '(not set)', 500, 500 ),
				),
				array(
					'kind'         => 'VISITOR_TYPE',
					'role'         => 'CONTEXT',
					'label'        => 'Visitor type',
					'value'        => array( 'text' => 'new' ),
					'entity_delta' => 140,
				),
				array( 'USER_TYPE', 'new', 0.0, true ),
			),
		);
	}

	public function test_get_cards__lists_the_visitor_type_that_carried_most_of_its_channels_change_whatever_its_share_of_the_visits() {
		// New visitors have 90.8% of Referral's visits and carried 95% of its
		// rise. Returning visitors have 54.2% of Organic Social's visits and
		// carried 88.9% of its rise.
		$key_factors = $this->build(
			array( 2180, 1800 ),
			array(),
			array(
				'channelBreakdowns' => array(
					$this->breakdown( 'Referral', '(not set)', 'new', 1090, 900 ),
					$this->breakdown( 'Referral', '(not set)', 'returning', 110, 100 ),
					$this->breakdown( 'Organic Social', '(not set)', 'new', 220, 200 ),
					$this->breakdown( 'Organic Social', '(not set)', 'returning', 260, 100 ),
					$this->breakdown( 'Direct', '(not set)', '(not set)', 500, 500 ),
				),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral', 'CHANNEL Organic Social' ), $this->get_card_titles( $key_factors ), 'Both channels that rose should be cards.' );
		$this->assertSame(
			array(
				array( array( 'USER_TYPE', 'new', 95.0 ) ),
				array( array( 'USER_TYPE', 'returning', 88.9 ) ),
			),
			array_map(
				fn( $card ) => array_map( fn( $attribute ) => array( $attribute['kind'], $attribute['label'], $attribute['sharePct'] ), $card['attributes'] ),
				$key_factors->get_cards()
			),
			'Each channel should list its visitor type that carried most of its rise, unlike a device that changed with its share of the visits.'
		);
	}

	/**
	 * @dataProvider data_devices_by_their_share_of_their_channels_visits
	 *
	 * @param array  $breakdowns The `channelBreakdowns` rows. Organic Search gained 200 visits.
	 * @param array  $rows       The rows of Organic Search's card.
	 * @param string $message    The assertion message.
	 */
	public function test_get_cards__does_not_list_a_device_that_changed_with_its_share_of_its_channels_visits( array $breakdowns, array $rows, $message ) {
		$key_factors = $this->build( array( 1300, 1100 ), array(), array( 'channelBreakdowns' => $breakdowns ) );

		$this->assertSame( array( $rows ), $this->get_card_rows( $key_factors ), $message );
	}

	public function data_devices_by_their_share_of_their_channels_visits() {
		return array(
			'a device with its share of the visits'     => array(
				array(
					$this->breakdown( 'Organic Search', 'mobile', '(not set)', 760, 570 ),
					$this->breakdown( 'Organic Search', 'desktop', '(not set)', 40, 30 ),
					$this->breakdown( 'Direct', '(not set)', '(not set)', 500, 500 ),
				),
				array(),
				'Mobile carried 95% of the rise with 95% of the visits, so it only shows where the visitors already were.',
			),
			'a device with more than its share of them' => array(
				array(
					$this->breakdown( 'Organic Search', 'desktop', '(not set)', 200, 50 ),
					$this->breakdown( 'Organic Search', 'mobile', '(not set)', 600, 550 ),
					$this->breakdown( 'Direct', '(not set)', '(not set)', 500, 500 ),
				),
				array( array( 'READER_DEVICE', 'desktop', 75.0, 150 ) ),
				'Desktop carried 75% of the rise with 25% of the visits, so it should be a row.',
			),
		);
	}

	public function test_get_cards__reads_established_visitors_as_returning_visitors() {
		$key_factors = $this->build(
			array( 1150, 1000 ),
			array(),
			array(
				'channelBreakdowns' => array(
					$this->breakdown( 'Referral', '(not set)', 'established', 350, 200 ),
					$this->breakdown( 'Referral', '(not set)', 'new', 150, 150 ),
					$this->breakdown( 'Organic Search', '(not set)', '(not set)', 650, 650 ),
				),
			)
		);

		$this->assertSame(
			array( array( array( 'VISITOR_TYPE', 'returning', 100.0, 150 ) ) ),
			$this->get_card_rows( $key_factors ),
			'Analytics\' established visitors should be listed as returning visitors.'
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
			$this->breakdown( 'Referral', '(not set)', 'new', 370, 300 ),
			$this->breakdown( 'Referral', '(not set)', 'returning', 330, 300 ),
			$this->breakdown( 'Direct', '(not set)', '(not set)', 400, 400 ),
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

	public function test_get_cards__does_not_list_a_page_beside_two_referring_sites() {
		// Referral gained 100 visits: 30 from `a.example.com`, 20 from
		// `b.example.com` and 50 on `/a/`. A referring site and a page are two
		// cuts of the same visits, and the referring sites come first, though
		// the page carried more. A page may follow a site as context, but the
		// sites take both of the card's rows.
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
			array(
				array(
					array( 'SOURCE_TYPE', 'a.example.com', 30.0, 30 ),
					array( 'SOURCE_TYPE', 'b.example.com', 20.0, 20 ),
				),
			),
			$this->get_card_rows( $key_factors ),
			'Referral should list both sites, each with its share, and not the page beside them.'
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
		// on its homepage and 247 on `/a/`, while `/b/` lost 208: `/a/` would
		// take Direct's rows past 100% of its change. Organic Social gained
		// 500: 412 from x.com and 173 from linkedin.com, while facebook.com
		// lost 85. Each site carried over 30% of the change, so both are
		// listed, without the shares that would add up past 100%.
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
				array(
					array( 'SOURCE_TYPE', 'x.com', null, 412 ),
					array( 'SOURCE_TYPE', 'linkedin.com', null, 173 ),
				),
			),
			$this->get_card_rows( $key_factors ),
			'Direct should list only its homepage, and Organic Social both sites, without shares.'
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
		// Direct's card keeps the campaign's from being the period's only card,
		// which a part without rows doesn't take.
		$key_factors = $this->build(
			array( 1150, 1000 ),
			array(
				array( 'Email', 200, 100 ),
				array( 'Direct', 950, 900 ),
			),
			array(
				'channelCampaigns' => array(
					$this->row( 'Email', 'campaign', 'Newsletter_October_2025', 90, 0 ),
					$this->row( 'Email', 'campaign', '20103244', 10, 0 ),
				),
			)
		);

		$this->assertSame( array( 'CAMPAIGN October 2025 newsletter', 'CHANNEL Direct' ), $this->get_card_titles( $key_factors ), 'The campaign should take Email\'s card, named for readers.' );
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
			array(),
			array(
				'channelBreakdowns' => array(
					$this->breakdown( 'Organic Search', '(not set)', '(not set)', 1100, 1500 ),
					$this->breakdown( 'Organic Social', '(not set)', '(not set)', 400, 300 ),
					$this->breakdown( 'Email', '(not set)', '(not set)', 100, 60 ),
					$this->breakdown( 'Direct', '(not set)', '(not set)', 100, 140 ),
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

	public function test_get_cards__shows_both_sides_of_a_flat_period_whose_channels_moved_against_each_other_without_shares() {
		$key_factors = $this->build(
			array( 1000, 1000 ),
			array(
				array( 'Organic Search', 400, 600 ),
				array( 'Referral', 350, 200 ),
				array( 'Organic Social', 150, 100 ),
				array( 'Direct', 100, 100 ),
			)
		);

		$this->assertSame( 'OFFSETTING', $key_factors->get_decomposition()['shape'], 'A flat period whose channels moved against each other should be `OFFSETTING`.' );
		$this->assertSame(
			array(
				array( 'CHANNEL Organic Search', 'PRIMARY', null, 0.0 ),
				array( 'CHANNEL Referral', 'OFFSET', null, 0.0 ),
				array( 'CHANNEL Organic Social', 'OFFSET', null, 0.0 ),
			),
			$this->get_card_shares( $key_factors ),
			'The channel that moved most should be primary, the largest channel moving against it offsetting, and the free slot should take the next channel of either side. A flat period has no rise or drop for a card\'s change to be a share of, so no card should have a share.'
		);
		$this->assertSame(
			array( array( null, 0.0 ), array( null, 0.0 ), array( null, 0.0 ) ),
			array_map( fn( $card ) => array( $card['shareBasis'], $card['sharePct'] ), $key_factors->get_cards() ),
			'The panel should show no share either.'
		);
		$this->assertFalse( $key_factors->is_steady(), 'An offsetting period should not be steady.' );
	}

	public function test_get_cards__keeps_the_share_of_a_part_that_took_its_channels_card_on_a_flat_period() {
		// The site's visits rose by 0.6%, while Direct lost 14,089 and Organic
		// Search gained 12,646. `news.example` brought Referral 6,500 of the
		// 10,200 visits it gained.
		$key_factors = $this->build(
			array( 1487750, 1478993 ),
			array(
				array( 'Direct', 485911, 500000 ),
				array( 'Organic Search', 912646, 900000 ),
				array( 'Referral', 89193, 78993 ),
			),
			array(
				'channelSources' => array( $this->row( 'Referral', 'source', 'news.example', 7000, 500 ) ),
			)
		);

		$this->assertSame( 'OFFSETTING', $key_factors->get_decomposition()['shape'], 'The period should be `OFFSETTING`.' );
		$this->assertSame(
			array(
				array( 'CHANNEL Direct', 'PRIMARY', null, 0.0 ),
				array( 'CHANNEL Organic Search', 'OFFSET', null, 0.0 ),
				array( 'REFERRING_SITE news.example', 'OFFSET', 'PARENT_CHANNEL', 63.7 ),
			),
			$this->get_card_shares( $key_factors ),
			'The channels should have no share, while the site keeps its share of Referral\'s change.'
		);
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
		// Direct didn't move, so the paid channels, as one group, carried all
		// of the site's movement.
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
				'traffic_impact_pct' => 100.0,
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

	public function test_get_cards__shares_the_movement_of_the_paid_channels_as_one_group() {
		// Cross-network gained 594 visits and Paid Search lost 424, so the site
		// gained 190 through the paid channels. Counted channel by channel,
		// the site gained 666 and lost 434, and the group would have 28.5% of
		// the visits it gained.
		$key_factors = $this->build(
			array( 1184, 952 ),
			array(
				array( 'Cross-network', 700, 106 ),
				array( 'Paid Search', 100, 524 ),
				array( 'Display', 30, 10 ),
				array( 'Direct', 254, 202 ),
				array( 'Organic Search', 100, 110 ),
			)
		);

		$this->assertSame(
			array(
				array( 'CHANNEL_GROUP Paid traffic', 'PRIMARY', 'GROSS_CHANGE', 78.5 ),
				array( 'CHANNEL Direct', 'PRIMARY', 'GROSS_CHANGE', 21.5 ),
			),
			$this->get_card_shares( $key_factors ),
			'The group and Direct should share the 242 visits the site gained.'
		);
		$this->assertSame(
			array(
				array(
					array( 'CHANNEL', 'Cross-network ads', null, 594 ),
					array( 'CHANNEL', 'Paid Search', null, -424 ),
				),
				array(),
			),
			$this->get_card_rows( $key_factors ),
			'The group should list Cross-network, named as the service names it, and Paid Search.'
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
	 * @dataProvider data_parts_that_moved_further_than_their_channels
	 *
	 * @param array $visits          The site's visits.
	 * @param array $channels        The channels.
	 * @param array $contextual_data The other rows.
	 * @param array $card            The fields of the first card.
	 */
	public function test_get_cards__gives_a_part_that_moved_further_than_its_channel_a_share_of_the_sites_movement_and_its_channel( array $visits, array $channels, array $contextual_data, array $card ) {
		$key_factors = $this->build( $visits, $channels, $contextual_data );

		$this->assertSame(
			$card,
			array_intersect_key( $key_factors->get_decomposition()['key_factors'][0], array_flip( array( 'entity_kind', 'title', 'delta', 'traffic_impact_pct', 'share_basis', 'parent_channel', 'parent_channel_delta' ) ) ),
			'The part should take its channel\'s card with its share of the site\'s movement, since a share of its channel\'s change would be above 100%, and still name its channel.'
		);
		$this->assertSame(
			array( $card['traffic_impact_pct'], 'GROSS_CHANGE', $card['parent_channel'], $card['parent_channel_delta'] ),
			array_values( array_intersect_key( $key_factors->get_cards()[0], array_flip( array( 'sharePct', 'shareBasis', 'parentChannel', 'parentChannelChange' ) ) ) ),
			'The panel should show the same share, and the channel.'
		);
	}

	public function data_parts_that_moved_further_than_their_channels() {
		return array(
			// The campaign gained 399 visits, while Cross-network gained 389.
			'a campaign'       => array(
				array( 1331, 849 ),
				array(
					array( 'Cross-network', 489, 100 ),
					array( 'Direct', 842, 749 ),
				),
				array(
					'channelCampaigns' => array( $this->row( 'Cross-network', 'campaign', 'Demand Gen - 2024-08-21 (Becky test)', 499, 100 ) ),
				),
				array(
					'entity_kind'          => 'CAMPAIGN',
					'title'                => 'Demand Gen - 2024-08-21 (Becky test)',
					'delta'                => 399,
					'traffic_impact_pct'   => 82.8,
					'share_basis'          => 'GROSS_CHANGE',
					'parent_channel'       => 'Cross-network ads',
					'parent_channel_delta' => 389,
				),
			),
			// `substack.com` gained 1,050 visits, while Referral gained 1,000.
			'a referring site' => array(
				array( 11000, 10000 ),
				array(
					array( 'Referral', 2000, 1000 ),
					array( 'Direct', 4500, 4000 ),
					array( 'Organic Search', 4500, 5000 ),
				),
				array(
					'channelSources' => array( $this->row( 'Referral', 'source', 'substack.com', 1050, 0 ) ),
				),
				array(
					'entity_kind'          => 'REFERRING_SITE',
					'title'                => 'substack.com',
					'delta'                => 1050,
					'traffic_impact_pct'   => 70.0,
					'share_basis'          => 'GROSS_CHANGE',
					'parent_channel'       => 'Referral',
					'parent_channel_delta' => 1000,
				),
			),
		);
	}

	public function test_get_cards__keeps_the_card_of_a_channel_whose_part_moved_further_than_all_the_site_gained() {
		// `substack.com` gained 1,050 visits, while Referral gained 1,000, all
		// the site gained through any channel. Its share of the site's
		// movement would be above 100% too, and a share of the site's traffic
		// says nothing of it, so it doesn't take Referral's card.
		$key_factors = $this->build(
			array( 10700, 10000 ),
			array(
				array( 'Referral', 2000, 1000 ),
				array( 'Direct', 4000, 4000 ),
				array( 'Organic Search', 4700, 5000 ),
			),
			array(
				'channelSources' => array( $this->row( 'Referral', 'source', 'substack.com', 1050, 0 ) ),
			)
		);

		$this->assertSame( array( 'CHANNEL Referral', 'CHANNEL Organic Search' ), $this->get_card_titles( $key_factors ), 'Referral should keep its card.' );
		$this->assertSame(
			array(
				array( array( 'SOURCE_TYPE', 'substack.com', null, 1050 ) ),
				array(),
			),
			$this->get_card_rows( $key_factors ),
			'The site should be a row of Referral, with its own change and no share.'
		);
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

	/**
	 * Gets the channels of a period on which `/launch-post` gained 600 visits,
	 * 350 through Direct and 250 through Organic Social, of the 1,000 the
	 * site gained.
	 *
	 * @return array The channels.
	 */
	private function get_launch_channels() {
		return array(
			array( 'Direct', 900, 400 ),
			array( 'Organic Social', 600, 300 ),
			array( 'Organic Search', 500, 300 ),
		);
	}

	public function test_get_cards__makes_a_page_that_rose_through_several_channels_the_first_card() {
		// `/launch-post` carried 60% of the visits the site gained, and takes
		// the first card, by its title, with its channels as rows. Its visits
		// are taken out of them: Direct's other pages gained 150, and their
		// card is named so it never reads as all of Direct.
		$key_factors = $this->build(
			array( 2000, 1000 ),
			$this->get_launch_channels(),
			array(
				'channelPages'   => array(
					$this->row( 'Direct', 'page', '/launch-post', 350, 0 ),
					$this->row( 'Organic Social', 'page', '/launch-post', 250, 0 ),
					$this->row( 'Direct', 'page', '/pricing', 250, 100 ),
					$this->row( 'Organic Search', 'page', '/docs', 300, 100 ),
				),
				'channelSources' => array( $this->row( 'Organic Social', 'source', 'x.com', 280, 100 ) ),
			),
			28,
			array( '/launch-post' => 'Our Big Launch Post' )
		);

		$this->assertSame(
			array(
				'opening_sessions' => 1000,
				'closing_sessions' => 2000,
				'residual_delta'   => 50,
				'shape'            => 'CONCENTRATED',
				'key_factors'      => array(
					array(
						'dimension'          => 'PAGES',
						'entity_kind'        => 'CONTENT',
						'title'              => 'Our Big Launch Post',
						'volume'             => 600,
						'delta'              => 600,
						'excess'             => 600.0,
						'outsized'           => true,
						'is_large_share'     => true,
						'direction'          => 'UP',
						'traffic_impact_pct' => 60.0,
						'metric_type'        => 'DELTA',
						'share_basis'        => 'GROSS_CHANGE',
						'role'               => 'PRIMARY',
						'attributes'         => array(
							array(
								'kind'         => 'CHANNEL',
								'role'         => 'DECOMPOSITION',
								'label'        => 'Channel',
								'value'        => array( 'text' => 'Direct' ),
								'share_of_parent_change_pct' => 58.3,
								'entity_delta' => 350,
							),
							array(
								'kind'         => 'CHANNEL',
								'role'         => 'DECOMPOSITION',
								'label'        => 'Channel',
								'value'        => array( 'text' => 'Organic Social' ),
								'share_of_parent_change_pct' => 41.7,
								'entity_delta' => 250,
							),
						),
					),
					array(
						'dimension'          => 'TRAFFIC_CHANNELS',
						'entity_kind'        => 'CHANNEL',
						'title'              => 'Organic Search',
						'volume'             => 500,
						'delta'              => 200,
						'excess'             => -100.0,
						'direction'          => 'UP',
						'traffic_impact_pct' => 20.0,
						'metric_type'        => 'DELTA',
						'share_basis'        => 'GROSS_CHANGE',
						'role'               => 'PRIMARY',
						'attributes'         => array(
							array(
								'kind'         => 'TARGET_PAGE',
								'role'         => 'DECOMPOSITION',
								'label'        => 'Target page',
								'value'        => array( 'text' => '/docs' ),
								'share_of_parent_change_pct' => 100.0,
								'entity_delta' => 200,
							),
						),
					),
					array(
						'dimension'          => 'TRAFFIC_CHANNELS',
						'entity_kind'        => 'CHANNEL',
						'title'              => 'Direct (other pages)',
						'volume'             => 900,
						'delta'              => 150,
						'excess'             => -250.0,
						'direction'          => 'UP',
						'traffic_impact_pct' => 15.0,
						'metric_type'        => 'DELTA',
						'share_basis'        => 'GROSS_CHANGE',
						'role'               => 'PRIMARY',
						'attributes'         => array(
							array(
								'kind'         => 'TARGET_PAGE',
								'role'         => 'DECOMPOSITION',
								'label'        => 'Target page',
								'value'        => array( 'text' => '/pricing' ),
								'share_of_parent_change_pct' => 100.0,
								'entity_delta' => 150,
							),
						),
					),
				),
			),
			$key_factors->get_decomposition(),
			'The page should be the first card, with its share of the 1,000 visits the site gained, and Direct\'s other pages a card of their own. What is left of Organic Social falls in the residual.'
		);
		$this->assertSame(
			array(
				array(
					'kind'       => 'CONTENT',
					'label'      => 'Our Big Launch Post',
					'current'    => 600,
					'previous'   => 0,
					'sharePct'   => 60.0,
					'shareBasis' => 'GROSS_CHANGE',
					'attributes' => array(
						array(
							'kind'      => 'TRAFFIC_CHANNEL',
							'label'     => 'Direct',
							'current'   => 350,
							'previous'  => 0,
							'sharePct'  => 58.3,
							'oversized' => false,
						),
						array(
							'kind'      => 'TRAFFIC_CHANNEL',
							'label'     => 'Organic Social',
							'current'   => 250,
							'previous'  => 0,
							'sharePct'  => 41.7,
							'oversized' => false,
						),
					),
					'url'        => '/launch-post',
				),
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Organic Search',
					'current'    => 500,
					'previous'   => 300,
					'sharePct'   => 20.0,
					'shareBasis' => 'GROSS_CHANGE',
					'attributes' => array(
						array(
							'kind'      => 'LANDING_PAGE',
							'label'     => '/docs',
							'current'   => 300,
							'previous'  => 100,
							'sharePct'  => 100.0,
							'oversized' => false,
						),
					),
				),
				array(
					'kind'       => 'CHANNEL',
					'label'      => 'Direct',
					'current'    => 900,
					'previous'   => 750,
					'sharePct'   => 15.0,
					'shareBasis' => 'GROSS_CHANGE',
					'attributes' => array(
						array(
							'kind'      => 'LANDING_PAGE',
							'label'     => '/pricing',
							'current'   => 250,
							'previous'  => 100,
							'sharePct'  => 100.0,
							'oversized' => false,
						),
					),
					'otherPages' => true,
				),
			),
			$key_factors->get_cards(),
			'The panel should show the page with the visits each channel brought to it, and Direct\'s other pages under Direct\'s own name, marked as its other pages.'
		);
	}

	/**
	 * @dataProvider data_titles_of_a_page_of_several_channels
	 *
	 * @param array  $content     The `content` rows.
	 * @param array  $page_titles The titles of the site's pages, keyed by path.
	 * @param string $title       The title of the page's card.
	 */
	public function test_get_cards__names_a_page_of_several_channels_by_its_title_or_its_path( array $content, array $page_titles, $title ) {
		$key_factors = $this->build(
			array( 2000, 1000 ),
			$this->get_launch_channels(),
			array(
				'channelPages' => array(
					$this->row( 'Direct', 'page', '/launch-post', 350, 0 ),
					$this->row( 'Organic Social', 'page', '/launch-post', 250, 0 ),
				),
				'content'      => $content,
			),
			28,
			$page_titles
		);

		$this->assertSame( "CONTENT $title", $this->get_card_titles( $key_factors )[0], 'The page\'s card should have the title.' );
		$this->assertSame( '/launch-post', $key_factors->get_cards()[0]['url'], 'The panel should link the title to the page.' );
	}

	public function data_titles_of_a_page_of_several_channels() {
		return array(
			'the title of a post of the period' => array(
				array( $this->post( '/launch-post', 'Launch <em>post</em> &amp; more', 600 ) ),
				array(),
				'Launch post & more',
			),
			'its path without a title'          => array( array(), array(), '/launch-post' ),
			'its path for a hidden title'       => array( array(), array( '/launch-post' => 'Hot sex tips' ), '/launch-post' ),
		);
	}

	/**
	 * @dataProvider data_pages_that_stay_rows
	 *
	 * @param array $visits      The site's visits.
	 * @param array $channels    The channels.
	 * @param array $pages       The `channelPages` rows.
	 * @param array $card_titles The titles of the cards.
	 */
	public function test_get_cards__makes_a_page_the_first_card_only_when_several_channels_brought_a_large_share_of_the_movement_to_it( array $visits, array $channels, array $pages, array $card_titles ) {
		$key_factors = $this->build( $visits, $channels, array( 'channelPages' => $pages ) );

		$this->assertSame( $card_titles, $this->get_card_titles( $key_factors ), 'The page should not be a card.' );
	}

	public function data_pages_that_stay_rows() {
		return array(
			'a page of one channel'                   => array(
				array( 2000, 1000 ),
				array(
					array( 'Direct', 1500, 500 ),
					array( 'Organic Search', 500, 500 ),
				),
				array( $this->row( 'Direct', 'page', '/single-channel', 800, 0 ) ),
				array( 'CHANNEL Direct' ),
			),
			// `/launch-post` gained 350 of the 1,000 visits the site gained.
			'a page under 40% of the movement'        => array(
				array( 2000, 1000 ),
				$this->get_launch_channels(),
				array(
					$this->row( 'Direct', 'page', '/launch-post', 200, 0 ),
					$this->row( 'Organic Social', 'page', '/launch-post', 150, 0 ),
				),
				array( 'CHANNEL Direct', 'CHANNEL Organic Social', 'CHANNEL Organic Search' ),
			),
			// Organic Social brought 40 of the 600 visits `/launch-post` gained.
			'a page with under a tenth from a second' => array(
				array( 2000, 1000 ),
				$this->get_launch_channels(),
				array(
					$this->row( 'Direct', 'page', '/launch-post', 560, 0 ),
					$this->row( 'Organic Social', 'page', '/launch-post', 40, 0 ),
				),
				array( 'CHANNEL Direct', 'CHANNEL Organic Social', 'CHANNEL Organic Search' ),
			),
			'a flat period'                           => array(
				array( 1000, 1000 ),
				array(
					array( 'Direct', 600, 300 ),
					array( 'Organic Social', 200, 100 ),
					array( 'Organic Search', 200, 600 ),
				),
				array(
					$this->row( 'Direct', 'page', '/launch-post', 200, 0 ),
					$this->row( 'Organic Social', 'page', '/launch-post', 100, 0 ),
				),
				array( 'CHANNEL Organic Search', 'CHANNEL Direct', 'CHANNEL Organic Social' ),
			),
		);
	}

	public function test_get_cards__lists_the_homepage_and_the_next_page_of_directs_other_pages() {
		// `/viral` gained 250 visits, 200 through Organic Social and 50
		// through Direct. Without it, Direct gained 87: 61 on its homepage and
		// 11 on `/pricing`.
		$key_factors = $this->build(
			array( 1337, 1000 ),
			array(
				array( 'Organic Social', 400, 200 ),
				array( 'Direct', 337, 200 ),
				array( 'Organic Search', 600, 600 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Organic Social', 'page', '/viral', 200, 0 ),
					$this->row( 'Direct', 'page', '/viral', 50, 0 ),
					$this->row( 'Direct', 'page', '/', 161, 100 ),
					$this->row( 'Direct', 'page', '/pricing', 61, 50 ),
				),
			)
		);

		$this->assertSame( array( 'CONTENT /viral', 'CHANNEL Direct (other pages)' ), $this->get_card_titles( $key_factors ), 'The page should take the first card, and Direct\'s other pages the second.' );
		$this->assertSame(
			array(
				array(
					array( 'CHANNEL', 'Organic Social', 80.0, 200 ),
					array( 'CHANNEL', 'Direct', 20.0, 50 ),
				),
				array(
					array( 'HOMEPAGE', null, 70.1, 61 ),
					array( 'TARGET_PAGE', '/pricing', 12.6, 11 ),
				),
			),
			$this->get_card_rows( $key_factors ),
			'Direct\'s other pages should list its homepage and `/pricing`, each with its share of the 87 visits they gained.'
		);
		$this->assertSame(
			array( 'Direct', 337, 250, true ),
			array( $key_factors->get_cards()[1]['label'], $key_factors->get_cards()[1]['current'], $key_factors->get_cards()[1]['previous'], $key_factors->get_cards()[1]['otherPages'] ),
			'The panel should show Direct\'s other pages with the visits Direct had without the page.'
		);
	}

	public function test_get_cards__lists_the_page_of_a_channels_other_pages_that_moved_with_them() {
		// `/launch` gained 600 visits, 350 through Organic Search. Without it,
		// Organic Search lost 150: `/falling-doc` lost 550, while `/other-pos`
		// gained 400. The channel's other pages offset part of the rise, and
		// `/falling-doc` is the page that moved with them.
		$key_factors = $this->build(
			array( 1550, 1000 ),
			array(
				array( 'Organic Search', 700, 500 ),
				array( 'Direct', 850, 500 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Organic Search', 'page', '/other-pos', 500, 100 ),
					$this->row( 'Organic Search', 'page', '/launch', 350, 0 ),
					$this->row( 'Organic Search', 'page', '/falling-doc', 50, 600 ),
					$this->row( 'Direct', 'page', '/launch', 250, 0 ),
				),
			)
		);

		$this->assertSame(
			array(
				array( 'CONTENT /launch', 'PRIMARY', 'GROSS_CHANGE', 85.7 ),
				array( 'CHANNEL Direct (other pages)', 'PRIMARY', 'GROSS_CHANGE', 14.3 ),
				array( 'CHANNEL Organic Search (other pages)', 'OFFSET', 'NET_CHANGE', 27.3 ),
			),
			$this->get_card_shares( $key_factors ),
			'The page should be the first card, Direct\'s other pages the second, and Organic Search\'s other pages should offset part of the rise.'
		);
		$this->assertSame(
			array( array( 'TARGET_PAGE', '/falling-doc', null, -550 ) ),
			$this->get_card_rows( $key_factors )[2],
			'Organic Search\'s other pages should list the page that moved with them, with its own change.'
		);
	}

	public function test_get_cards__keeps_a_channel_whole_when_little_of_a_page_came_through_it() {
		// `/launch` gained 50,000 visits: 28,000 through Direct, 21,560
		// through Organic Search and 440 through Unassigned. The 440 visits
		// are under a tenth of both Unassigned's rise and the page's, so they
		// stay in Unassigned's card.
		$key_factors = $this->build(
			array( 120000, 50000 ),
			array(
				array( 'Direct', 50000, 20000 ),
				array( 'Organic Search', 45290, 20000 ),
				array( 'Unassigned', 24710, 10000 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Direct', 'page', '/launch', 28000, 0 ),
					$this->row( 'Organic Search', 'page', '/launch', 21560, 0 ),
					$this->row( 'Unassigned', 'page', '/launch', 440, 0 ),
				),
			)
		);

		$this->assertSame(
			array(
				array( 'CONTENT /launch', 'PRIMARY', 'GROSS_CHANGE', 71.0 ),
				array( 'CHANNEL Uncategorized traffic', 'PRIMARY', 'GROSS_CHANGE', 20.9 ),
				array( 'CHANNEL Organic Search (other pages)', 'PRIMARY', 'GROSS_CHANGE', 5.3 ),
			),
			$this->get_card_shares( $key_factors ),
			'Unassigned should keep its whole card, while Organic Search\'s card is of its other pages.'
		);
		$this->assertSame(
			array(
				array( '/launch', 50000, 0, false ),
				array( 'Uncategorized traffic', 24710, 10000, false ),
				array( 'Organic Search', 45290, 41560, true ),
			),
			array_map(
				fn( $card ) => array( $card['label'], $card['current'], $card['previous'], ! empty( $card['otherPages'] ) ),
				$key_factors->get_cards()
			),
			'The panel should show Unassigned with all of its visits.'
		);
	}

	public function test_get_cards__lists_the_paid_channels_other_pages_without_their_campaigns() {
		// `/promo` gained 500 visits through the paid channels, which gained
		// 900. Without it, they gained 200 each, and Paid Search's campaign is
		// no longer one of the movements left.
		$key_factors = $this->build(
			array( 1900, 1000 ),
			array(
				array( 'Paid Search', 1000, 500 ),
				array( 'Paid Social', 900, 500 ),
			),
			array(
				'channelPages'     => array(
					$this->row( 'Paid Search', 'page', '/promo', 300, 0 ),
					$this->row( 'Paid Social', 'page', '/promo', 200, 0 ),
				),
				'channelCampaigns' => array( $this->row( 'Paid Search', 'campaign', 'Spring Sale', 450, 50 ) ),
			),
			28,
			array( '/promo' => 'Big Promo' )
		);

		$this->assertSame( array( 'CONTENT Big Promo', 'CHANNEL_GROUP Paid traffic (other pages)' ), $this->get_card_titles( $key_factors ), 'The page should take the first card, and the paid channels\' other pages the second.' );
		$this->assertSame(
			array(
				array(
					'kind'                     => 'CHANNEL',
					'role'                     => 'DECOMPOSITION',
					'label'                    => 'Channel',
					'value'                    => array( 'text' => 'Paid Search' ),
					'entity_delta'             => 200,
					'share_of_group_gross_pct' => 50.0,
				),
				array(
					'kind'                     => 'CHANNEL',
					'role'                     => 'DECOMPOSITION',
					'label'                    => 'Channel',
					'value'                    => array( 'text' => 'Paid Social' ),
					'entity_delta'             => 200,
					'share_of_group_gross_pct' => 50.0,
				),
			),
			$key_factors->get_decomposition()['key_factors'][1]['attributes'],
			'The group should list what is left of each channel, without the campaign.'
		);
		$this->assertSame(
			array(
				'kind'       => 'CHANNEL_GROUP',
				'label'      => 'Paid traffic',
				'current'    => 1900,
				'previous'   => 1500,
				'sharePct'   => 44.4,
				'shareBasis' => 'GROSS_CHANGE',
				'attributes' => array(
					array(
						'kind'      => 'TRAFFIC_CHANNEL',
						'label'     => 'Paid Search',
						'current'   => 1000,
						'previous'  => 800,
						'sharePct'  => 50.0,
						'oversized' => false,
					),
					array(
						'kind'      => 'TRAFFIC_CHANNEL',
						'label'     => 'Paid Social',
						'current'   => 900,
						'previous'  => 700,
						'sharePct'  => 50.0,
						'oversized' => false,
					),
				),
				'otherPages' => true,
			),
			$key_factors->get_cards()[1],
			'The panel should show the group\'s other pages, with the visits each channel had without the page.'
		);
	}

	public function test_get_cards__gives_the_channels_of_a_page_no_share_when_they_move_further_than_it() {
		// `/net-post` gained 100 visits: 70 through Organic Search and 50
		// through Direct, while Referral lost 20.
		$key_factors = $this->build(
			array( 300, 200 ),
			array(
				array( 'Organic Search', 170, 100 ),
				array( 'Direct', 100, 50 ),
				array( 'Referral', 30, 50 ),
			),
			array(
				'channelPages' => array(
					$this->row( 'Organic Search', 'page', '/net-post', 70, 0 ),
					$this->row( 'Direct', 'page', '/net-post', 50, 0 ),
					$this->row( 'Referral', 'page', '/net-post', 0, 20 ),
				),
			),
			28,
			array( '/net-post' => 'Net Post' )
		);

		$this->assertSame( array( 'CONTENT Net Post' ), $this->get_card_titles( $key_factors ), 'The page should be the only card.' );
		$this->assertSame(
			array(
				array(
					array( 'CHANNEL', 'Organic Search', null, 70 ),
					array( 'CHANNEL', 'Direct', null, 50 ),
				),
			),
			$this->get_card_rows( $key_factors ),
			'The two channels add up to more than the page\'s change, so neither should have a share.'
		);
		$this->assertSame(
			array(
				array(
					array( 'TRAFFIC_CHANNEL', 'Organic Search', 0.0, false ),
					array( 'TRAFFIC_CHANNEL', 'Direct', 0.0, false ),
				),
			),
			$this->get_attributes( $key_factors ),
			'The panel should show the channels without shares.'
		);
	}

	public function test_get_cards__says_when_a_channels_other_pages_had_their_change_spread_across_many_pages() {
		// Without `/launch-post`, Direct gained 150 visits across 15 pages,
		// 10 each.
		$key_factors = $this->build(
			array( 2000, 1000 ),
			$this->get_launch_channels(),
			array(
				'channelPages' => array_merge(
					array(
						$this->row( 'Direct', 'page', '/launch-post', 350, 0 ),
						$this->row( 'Organic Social', 'page', '/launch-post', 250, 0 ),
					),
					$this->pages( 'Direct', 15, 10 )
				),
			)
		);

		$cards = $key_factors->get_cards();

		$this->assertSame( array( 'CONTENT /launch-post', 'CHANNEL Organic Search', 'CHANNEL Direct (other pages)' ), $this->get_card_titles( $key_factors ), 'Direct\'s other pages should be the third card.' );
		$this->assertSame( array(), $cards[2]['attributes'], 'No page should be a row.' );
		$this->assertTrue( $cards[2]['spreadAcrossPages'], 'The card should say the change of Direct\'s other pages was spread across many pages.' );
	}

	public function test_get_cards__names_a_channel_as_the_service_does() {
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Unassigned', 600, 300 ),
				array( 'Direct', 700, 700 ),
			),
			array(
				'channelPages' => array( $this->row( 'Unassigned', 'page', '/a/', 400, 100 ) ),
			)
		);

		$this->assertSame( array( 'CHANNEL Uncategorized traffic' ), $this->get_card_titles( $key_factors ), 'Analytics\' `Unassigned` should be named `Uncategorized traffic`.' );
		$this->assertSame( 'Uncategorized traffic', $key_factors->get_cards()[0]['label'], 'The panel should name it the same way.' );
		$this->assertSame(
			array( array( array( 'TARGET_PAGE', '/a/', 100.0, 300 ) ) ),
			$this->get_card_rows( $key_factors ),
			'The channel\'s rows, under its name in Analytics, should still be its rows.'
		);
	}

	/**
	 * @dataProvider data_page_titles
	 *
	 * @param string|null $title The title the page title lookup gets for `/post`, or null without one.
	 * @param array       $value The value of the page's row.
	 */
	public function test_get_cards__gives_a_page_row_the_pages_title_as_plain_text( $title, array $value ) {
		$key_factors = $this->build(
			array( 1300, 1000 ),
			array(
				array( 'Referral', 800, 500 ),
				array( 'Direct', 500, 500 ),
			),
			array(
				'channelPages' => array( $this->row( 'Referral', 'page', '/post', 400, 175 ) ),
			),
			28,
			null === $title ? array() : array( '/post' => $title )
		);

		$this->assertSame(
			array(
				'kind'                       => 'TARGET_PAGE',
				'role'                       => 'DECOMPOSITION',
				'label'                      => 'Target page',
				'value'                      => $value,
				'share_of_parent_change_pct' => 75.0,
				'entity_delta'               => 225,
			),
			$key_factors->get_decomposition()['key_factors'][0]['attributes'][0],
			'The page\'s row should have the title a card may show, as plain text, beside its path.'
		);

		$attribute = $key_factors->get_cards()[0]['attributes'][0];

		$this->assertSame( '/post', $attribute['label'], 'The panel should keep the page\'s path, for the title to link to it.' );
		$this->assertSame(
			isset( $value['title'] ) ? $value['title'] : null,
			isset( $attribute['title'] ) ? $attribute['title'] : null,
			'The panel should show the same title.'
		);
	}

	public function data_page_titles() {
		return array(
			'a title with HTML'           => array(
				"  <b>Plant</b> garlic &amp; onions\n now  ",
				array(
					'text'  => '/post',
					'title' => 'Plant garlic & onions now',
				),
			),
			'a long title'                => array(
				str_repeat( 'Plant garlic ', 10 ),
				array(
					'text'  => '/post',
					'title' => str_repeat( 'Plant garlic ', 7 ) . 'Plant gar',
				),
			),
			'a title a card may not show' => array( 'Hot sex tips', array( 'text' => '/post' ) ),
			'no title'                    => array( null, array( 'text' => '/post' ) ),
		);
	}

	public function test_get_cards__gives_the_homepage_row_no_title() {
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
			),
			28,
			array(
				'/'   => 'Home',
				'/a/' => 'Page A',
			)
		);

		$rows = $key_factors->get_decomposition()['key_factors'][0]['attributes'];

		$this->assertArrayNotHasKey( 'value', $rows[0], 'The homepage row should have no value.' );
		$this->assertSame(
			array(
				'text'  => '/a/',
				'title' => 'Page A',
			),
			$rows[1]['value'],
			'The page\'s row should have its title.'
		);
		$this->assertSame(
			array( null, 'Page A' ),
			array_map( fn( $attribute ) => isset( $attribute['title'] ) ? $attribute['title'] : null, $key_factors->get_cards()[0]['attributes'] ),
			'The panel should show the title of the page, and none for the homepage.'
		);
	}

	/**
	 * @dataProvider data_parts_of_the_only_card_without_rows
	 *
	 * @param array  $visits          The site's visits.
	 * @param array  $channels        The channels.
	 * @param array  $contextual_data The other rows.
	 * @param string $card_title      The title of the only card, with its kind.
	 * @param array  $rows            The rows of the card.
	 */
	public function test_get_cards__keeps_the_only_card_for_the_channel_when_its_part_would_have_no_row( array $visits, array $channels, array $contextual_data, $card_title, array $rows ) {
		$key_factors = $this->build( $visits, $channels, $contextual_data );

		$this->assertSame( array( $card_title ), $this->get_card_titles( $key_factors ), 'The channel should keep the period\'s only card.' );
		$this->assertSame( array( $rows ), $this->get_card_rows( $key_factors ), 'The card should list the part, so the reader sees what is behind the change.' );
		$this->assertArrayNotHasKey( 'parentChannel', $key_factors->get_cards()[0], 'The channel\'s card should name no channel it took the place of.' );
	}

	public function data_parts_of_the_only_card_without_rows() {
		return array(
			// Facebook's sources gained 230 of the 300 visits Organic Social
			// gained.
			'a referring site'                      => array(
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
				),
				'CHANNEL Organic Social',
				array(
					array( 'SOURCE_TYPE', 'Facebook', 76.7, 230 ),
					array( 'SOURCE_TYPE', 'x.com', 23.3, 70 ),
				),
			),
			// A post published 5 days ago carried 250 of the 300 visits
			// Referral gained.
			'a post'                                => array(
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
				),
				'CHANNEL Referral',
				array( array( 'TARGET_PAGE', '/new-post/', 83.3, 250 ) ),
			),
			// The newsletter gained 90 of the 100 visits Email gained.
			'a campaign'                            => array(
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
				),
				'CHANNEL Email',
				array( array( 'SOURCE_TYPE', 'October 2025 newsletter', 90.0, 90 ) ),
			),
			// `partner.example` gained 915 of the 1,000 visits Referral gained,
			// but under half of `/guide` surely came from it, so the page
			// would be no row of its card. On Referral's card, the page follows
			// the site as context.
			'a referring site whose page is no row' => array(
				array( 11000, 10000 ),
				array(
					array( 'Referral', 2000, 1000 ),
					array( 'Direct', 9000, 9000 ),
				),
				array(
					'channelPages'   => array( $this->row( 'Referral', 'page', '/guide', 250, 100 ) ),
					'channelSources' => array( $this->row( 'Referral', 'source', 'partner.example', 1015, 100 ) ),
				),
				'CHANNEL Referral',
				array(
					array( 'SOURCE_TYPE', 'partner.example', 91.5, 915 ),
					array( 'TARGET_PAGE', '/guide', null, 150 ),
				),
			),
			// The site's visits rose 4%, a flat period, and Referral's 45 are
			// its only card: `news.example` gained 40 of them.
			'a referring site on a flat period'     => array(
				array( 1040, 1000 ),
				array(
					array( 'Referral', 145, 100 ),
					array( 'Direct', 895, 900 ),
				),
				array(
					'channelSources' => array(
						$this->row( 'Referral', 'source', 'news.example', 140, 100 ),
						$this->row( 'Referral', 'source', 'other.example', 5, 0 ),
					),
				),
				'CHANNEL Referral',
				array( array( 'SOURCE_TYPE', 'news.example', 88.9, 40 ) ),
			),
		);
	}

	public function test_get_cards__lets_a_part_without_rows_take_its_card_beside_a_page_that_took_the_first_card() {
		// `/launch` brought 600 visits through Direct and Organic Social, and
		// takes the first card. Referral's is then the period's second card, so
		// `news.example`, which gained 80 of Referral's 100 visits, takes it
		// without rows.
		$key_factors = $this->build(
			array( 910, 200 ),
			array(
				array( 'Direct', 405, 50 ),
				array( 'Organic Social', 305, 50 ),
				array( 'Referral', 200, 100 ),
			),
			array(
				'channelPages'   => array(
					$this->row( 'Direct', 'page', '/launch', 350, 0 ),
					$this->row( 'Organic Social', 'page', '/launch', 250, 0 ),
				),
				'channelSources' => array(
					$this->row( 'Referral', 'source', 'news.example', 180, 100 ),
					$this->row( 'Referral', 'source', 'other.example', 120, 100 ),
				),
			)
		);

		$this->assertSame( array( 'CONTENT /launch', 'REFERRING_SITE news.example' ), $this->get_card_titles( $key_factors ), 'The site should take Referral\'s card beside the page\'s.' );
		$this->assertSame( array(), $this->get_card_rows( $key_factors )[1], 'The site\'s card should have no rows.' );
	}
}
