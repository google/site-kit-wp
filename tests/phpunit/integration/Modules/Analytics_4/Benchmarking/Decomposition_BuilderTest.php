<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Decomposition_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Decomposition_Builder;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Decomposition_BuilderTest extends TestCase {

	/**
	 * Builds the decomposition of the given cards.
	 *
	 * @param array      $visits        The site's visits, as `array( current, previous )`.
	 * @param array      $channels      The channels' visits, each as `array( label, current, previous )`.
	 * @param array      $key_factors   The key factor cards, as `card()` builds them.
	 * @param array|null $search_clicks Optional. The site's search clicks, as `array( current, previous )`. Default null.
	 * @return array|null The decomposition.
	 */
	private function build( array $visits, array $channels, array $key_factors, $search_clicks = null ) {
		$builder = new Decomposition_Builder(
			array(
				'current'  => $visits[0],
				'previous' => $visits[1],
			),
			array_map(
				fn( $channel ) => array(
					'label'    => $channel[0],
					'current'  => $channel[1],
					'previous' => $channel[2],
				),
				$channels
			),
			null === $search_clicks ? null : array(
				'current'  => $search_clicks[0],
				'previous' => $search_clicks[1],
			)
		);

		return $builder->build( $key_factors );
	}

	/**
	 * Gets a key factor card, as `Key_Factors::build()` returns it.
	 *
	 * @param string $kind       The card's kind, such as `CHANNEL`.
	 * @param string $label      The card's label.
	 * @param int    $current    The card's visits in the selected period.
	 * @param int    $previous   The card's visits in the compare period.
	 * @param array  $attributes Optional. The card's attributes, as `attribute()` builds them. Default empty array.
	 * @return array The card.
	 */
	private function card( $kind, $label, $current, $previous, array $attributes = array() ) {
		return array(
			'kind'       => $kind,
			'label'      => $label,
			'current'    => $current,
			'previous'   => $previous,
			'sharePct'   => 0.0,
			'attributes' => $attributes,
		);
	}

	/**
	 * Gets an attribute of a key factor card, as `Key_Factors::build()`
	 * returns it.
	 *
	 * @param string $kind     The attribute's kind, such as `LANDING_PAGE`.
	 * @param string $label    The attribute's label.
	 * @param int    $current  The attribute's visits, or clicks, in the selected period.
	 * @param int    $previous The attribute's visits, or clicks, in the compare period.
	 * @return array The attribute.
	 */
	private function attribute( $kind, $label, $current, $previous ) {
		return array(
			'kind'     => $kind,
			'label'    => $label,
			'current'  => $current,
			'previous' => $previous,
			'sharePct' => 0.0,
		);
	}

	public function test_build__returns_the_decomposition_of_the_services_wire_format_example() {
		// The example of service §5.10 "Wire format": visits from 1000 to
		// 1300, with Referral from 500 to 800 and Direct unchanged at 500, and
		// Referral's landing page `/post` from 175 to 400.
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
			$this->build(
				array( 1300, 1000 ),
				array(
					array( 'Referral', 800, 500 ),
					array( 'Direct', 500, 500 ),
				),
				array(
					$this->card(
						'CHANNEL',
						'Referral',
						800,
						500,
						array( $this->attribute( 'LANDING_PAGE', '/post', 400, 175 ) )
					),
				)
			),
			'The decomposition should be the one of the service\'s wire format example.'
		);
	}

	public function test_build__returns_null_without_channels() {
		$this->assertNull(
			$this->build( array( 1300, 1000 ), array(), array( $this->card( 'CHANNEL', 'Referral', 800, 500 ) ) ),
			'Without channels, the cards\' changes add up to nothing, so there should be no decomposition.'
		);
	}

	public function test_build__returns_a_decomposition_without_cards_when_the_panel_shows_none() {
		$this->assertSame(
			array(
				'opening_sessions' => 1000,
				'closing_sessions' => 1300,
				'residual_delta'   => 300,
				'shape'            => 'CONCENTRATED',
				'key_factors'      => array(),
			),
			$this->build( array( 1300, 1000 ), array( array( 'Referral', 1300, 1000 ) ), array() ),
			'Without cards, the decomposition should carry the whole change as its residual.'
		);
	}

	public function test_build__adds_the_cards_up_from_the_site_totals_when_the_channels_count_fewer_previous_visits() {
		$decomposition = $this->build(
			array( 1100, 1000 ),
			array( array( 'Referral', 450, 400 ) ),
			array( $this->card( 'CHANNEL', 'Referral', 450, 400 ) )
		);

		$this->assertSame(
			array( 1000, 1100, 50 ),
			array( $decomposition['opening_sessions'], $decomposition['closing_sessions'], $decomposition['residual_delta'] ),
			'With channels that count 400 of the 1000 previous visits, the cards should add up from the site\'s totals, and the visits no channel counts should be part of the residual.'
		);
	}

	public function test_build__counts_the_changes_of_the_cards_it_sends_in_the_residual() {
		$decomposition = $this->build(
			array( 1200, 1000 ),
			array(
				array( 'Organic Search', 700, 600 ),
				array( 'Referral', 500, 400 ),
			),
			array(
				$this->card( 'SEARCH_KEYWORD', 'plant garlic', 300, 100 ),
				$this->card( 'CHANNEL', 'Organic Search', 700, 600 ),
			)
		);

		$this->assertSame( 200 - 100, $decomposition['residual_delta'], 'The residual should be the site\'s change less the changes of the cards sent, without the clicks of a search keyword card.' );
	}

	/**
	 * @dataProvider data_cards
	 *
	 * @param array $key_factor  The key factor card.
	 * @param array $card_fields The expected `dimension`, `entity_kind` and `title`, or null when the card is left out.
	 */
	public function test_build__sends_each_card_the_wire_format_has_a_kind_for( array $key_factor, $card_fields ) {
		$cards = $this->build(
			array( 1300, 1000 ),
			array( array( 'Referral', 1300, 1000 ) ),
			array( $key_factor )
		)['key_factors'];

		if ( null === $card_fields ) {
			$this->assertSame( array(), $cards, "A `{$key_factor['kind']}` card for `{$key_factor['label']}` should be left out." );
			return;
		}

		$this->assertSame(
			$card_fields,
			array_intersect_key( $cards[0], array_flip( array( 'dimension', 'entity_kind', 'title' ) ) ),
			"A `{$key_factor['kind']}` card should be sent as a `{$card_fields['entity_kind']}` card."
		);
	}

	public function data_cards() {
		$card = fn( $kind, $label ) => array(
			'kind'       => $kind,
			'label'      => $label,
			'current'    => 300,
			'previous'   => 100,
			'sharePct'   => 0.0,
			'attributes' => array(),
		);

		return array(
			'a channel'        => array(
				$card( 'CHANNEL', 'Referral' ),
				array(
					'dimension'   => 'TRAFFIC_CHANNELS',
					'entity_kind' => 'CHANNEL',
					'title'       => 'Referral',
				),
			),
			'a landing page'   => array(
				$card( 'CONTENT', '/plant-garlic/' ),
				array(
					'dimension'   => 'PAGES',
					'entity_kind' => 'CONTENT',
					'title'       => '/plant-garlic/',
				),
			),
			'a referring site' => array(
				$card( 'REFERRING_SITE', 'news.example' ),
				array(
					'dimension'   => 'SOURCES',
					'entity_kind' => 'REFERRING_SITE',
					'title'       => 'news.example',
				),
			),
			'a campaign'       => array(
				$card( 'CAMPAIGN', 'spring-sale' ),
				array(
					'dimension'   => 'CAMPAIGNS',
					'entity_kind' => 'CAMPAIGN',
					'title'       => 'spring-sale',
				),
			),
			'a search keyword' => array( $card( 'SEARCH_KEYWORD', 'plant garlic' ), null ),
			'the home page'    => array( $card( 'CONTENT', '/' ), null ),
		);
	}

	public function test_build__marks_the_card_moving_against_a_drop_as_offsetting_with_its_share_of_the_net_change() {
		$this->assertSame(
			array(
				'opening_sessions' => 1000,
				'closing_sessions' => 800,
				'residual_delta'   => 0,
				'shape'            => 'CONCENTRATED',
				'key_factors'      => array(
					array(
						'dimension'          => 'TRAFFIC_CHANNELS',
						'entity_kind'        => 'CHANNEL',
						'title'              => 'Organic Search',
						'volume'             => 350,
						'delta'              => -250,
						'excess'             => -130.0,
						'outsized'           => true,
						'is_large_share'     => true,
						'direction'          => 'DOWN',
						'traffic_impact_pct' => 100.0,
						'metric_type'        => 'DELTA',
						'share_basis'        => 'GROSS_CHANGE',
						'role'               => 'PRIMARY',
						'attributes'         => array(),
					),
					array(
						'dimension'          => 'TRAFFIC_CHANNELS',
						'entity_kind'        => 'CHANNEL',
						'title'              => 'Referral',
						'volume'             => 450,
						'delta'              => 50,
						'excess'             => 130.0,
						'outsized'           => true,
						'direction'          => 'UP',
						'traffic_impact_pct' => 25.0,
						'metric_type'        => 'DELTA',
						'share_basis'        => 'NET_CHANGE',
						'role'               => 'OFFSET',
						'attributes'         => array(),
					),
				),
			),
			$this->build(
				array( 800, 1000 ),
				array(
					array( 'Organic Search', 350, 600 ),
					array( 'Referral', 450, 400 ),
				),
				array(
					$this->card( 'CHANNEL', 'Organic Search', 350, 600 ),
					$this->card( 'CHANNEL', 'Referral', 450, 400 ),
				)
			),
			'On a 20% drop, Organic Search should be primary with all of the falling traffic, and Referral should offset 25% of the drop, without carrying a large share of the movement.'
		);
	}

	public function test_build__gives_an_offsetting_card_no_share_when_it_offset_all_of_the_change() {
		$card = $this->build(
			array( 900, 1000 ),
			array(
				array( 'Organic Search', 300, 500 ),
				array( 'Referral', 600, 500 ),
			),
			array( $this->card( 'CHANNEL', 'Referral', 600, 500 ) )
		)['key_factors'][0];

		$this->assertSame(
			array( 'OFFSET', 'NET_CHANGE', 0.0 ),
			array( $card['role'], $card['share_basis'], $card['traffic_impact_pct'] ),
			'A card that offset 100% of the drop should carry no share, so it never reads as all of the change.'
		);
	}

	public function test_build__measures_a_card_against_the_site_traffic_when_it_moved_more_than_the_movement_in_its_direction() {
		$card = $this->build(
			array( 1050, 1000 ),
			array(
				array( 'Organic Search', 650, 600 ),
				array( 'Direct', 400, 400 ),
			),
			array( $this->card( 'CONTENT', '/plant-garlic/', 200, 100 ) )
		)['key_factors'][0];

		$this->assertSame(
			array( 'SITE_TRAFFIC', 9.5 ),
			array( $card['share_basis'], $card['traffic_impact_pct'] ),
			'A page that rose by 100 visits while the channels rose by 50 should carry its change as a share of the site\'s 1050 visits.'
		);
	}

	public function test_build__measures_a_card_against_the_site_traffic_when_the_movement_in_the_site_direction_is_under_a_quarter_of_its_change() {
		$card = $this->build(
			array( 1400, 1000 ),
			array( array( 'Referral', 150, 100 ) ),
			array( $this->card( 'CHANNEL', 'Referral', 150, 100 ) )
		)['key_factors'][0];

		$this->assertSame(
			array( 'SITE_TRAFFIC', 3.6 ),
			array( $card['share_basis'], $card['traffic_impact_pct'] ),
			'Channels that rose by 50 visits of the site\'s 400 are too little movement to share, so the card should carry its change as a share of the site\'s 1400 visits.'
		);
	}

	/**
	 * @dataProvider data_shapes
	 *
	 * @param array  $visits      The site's visits, as `array( current, previous )`.
	 * @param array  $channels    The channels' visits, each as `array( label, current, previous )`.
	 * @param array  $card_labels The labels of the channels with a card.
	 * @param string $shape       The expected shape.
	 */
	public function test_build__gives_the_shape_of_the_change( array $visits, array $channels, array $card_labels, $shape ) {
		$key_factors = array();

		foreach ( $channels as $channel ) {
			if ( in_array( $channel[0], $card_labels, true ) ) {
				$key_factors[] = $this->card( 'CHANNEL', $channel[0], $channel[1], $channel[2] );
			}
		}

		$this->assertSame( $shape, $this->build( $visits, $channels, $key_factors )['shape'], "The change should be `$shape`." );
	}

	public function data_shapes() {
		$rising_channels = array(
			array( 'Organic Search', 380, 300 ),
			array( 'Referral', 370, 300 ),
			array( 'Direct', 450, 400 ),
		);

		return array(
			'a rise half carried by one channel' => array(
				array( 1300, 1000 ),
				array(
					array( 'Referral', 800, 500 ),
					array( 'Direct', 500, 500 ),
				),
				array( 'Referral' ),
				'CONCENTRATED',
			),
			'a rise spread over channels, with two primary cards' => array(
				array( 1200, 1000 ),
				$rising_channels,
				array( 'Organic Search', 'Referral' ),
				'DIFFUSE',
			),
			'a rise spread over channels, with one primary card' => array(
				array( 1200, 1000 ),
				$rising_channels,
				array( 'Organic Search' ),
				'CONCENTRATED',
			),
			'a steady period with channels moving against each other' => array(
				array( 1010, 1000 ),
				array(
					array( 'Organic Search', 600, 500 ),
					array( 'Referral', 410, 500 ),
				),
				array( 'Organic Search', 'Referral' ),
				'OFFSETTING',
			),
			'a steady period with nothing moving materially' => array(
				array( 1004, 1000 ),
				array(
					array( 'Organic Search', 503, 500 ),
					array( 'Referral', 501, 500 ),
				),
				array( 'Organic Search' ),
				'STEADY',
			),
		);
	}

	/**
	 * @dataProvider data_steady_periods
	 *
	 * @param array $channels The channels' visits, each as `array( label, current, previous )`.
	 * @param array $roles    The expected role of each channel's card, keyed by channel.
	 */
	public function test_build__makes_the_channel_that_moved_most_in_a_steady_period_primary( array $channels, array $roles ) {
		$visits = array(
			array_sum( array_column( $channels, 1 ) ),
			array_sum( array_column( $channels, 2 ) ),
		);

		$cards = $this->build(
			$visits,
			$channels,
			array_map( fn( $channel ) => $this->card( 'CHANNEL', $channel[0], $channel[1], $channel[2] ), $channels )
		)['key_factors'];

		$this->assertSame( $roles, array_combine( array_column( $cards, 'title' ), array_column( $cards, 'role' ) ), 'The cards moving in the direction of the channel that moved most should be primary, and the others offsetting.' );
	}

	public function data_steady_periods() {
		return array(
			'the channel that fell most'       => array(
				array(
					array( 'Organic Search', 380, 500 ),
					array( 'Referral', 500, 400 ),
					array( 'Direct', 120, 100 ),
				),
				array(
					'Organic Search' => 'PRIMARY',
					'Referral'       => 'OFFSET',
					'Direct'         => 'OFFSET',
				),
			),
			'a tie, with more falling traffic' => array(
				array(
					array( 'Organic Search', 400, 500 ),
					array( 'Referral', 400, 300 ),
					array( 'Direct', 190, 200 ),
				),
				array(
					'Organic Search' => 'PRIMARY',
					'Referral'       => 'OFFSET',
					'Direct'         => 'PRIMARY',
				),
			),
			'a tie, with as much rising as falling traffic' => array(
				array(
					array( 'Organic Search', 400, 500 ),
					array( 'Referral', 500, 400 ),
				),
				array(
					'Organic Search' => 'OFFSET',
					'Referral'       => 'PRIMARY',
				),
			),
		);
	}

	/**
	 * @dataProvider data_rows
	 *
	 * @param string $attribute_kind The attribute's kind.
	 * @param string $row_kind       The expected row kind.
	 * @param string $row_label      The expected row label.
	 */
	public function test_build__sends_each_attribute_as_the_row_of_its_kind( $attribute_kind, $row_kind, $row_label ) {
		$row = $this->build(
			array( 1300, 1000 ),
			array( array( 'Referral', 1300, 1000 ) ),
			array(
				$this->card(
					'CHANNEL',
					'Referral',
					1300,
					1000,
					array( $this->attribute( $attribute_kind, 'value', 150, 100 ) )
				),
			)
		)['key_factors'][0]['attributes'][0];

		$this->assertSame(
			array( $row_kind, $row_label, array( 'text' => 'value' ) ),
			array( $row['kind'], $row['label'], $row['value'] ),
			"A `$attribute_kind` attribute should be a `$row_kind` row labelled `$row_label`."
		);
	}

	public function data_rows() {
		return array(
			'a landing page'   => array( 'LANDING_PAGE', 'TARGET_PAGE', 'Target page' ),
			'a search keyword' => array( 'SEARCH_KEYWORD', 'SOURCE_TYPE', 'Search keyword' ),
			'a referring site' => array( 'REFERRING_SITE', 'SOURCE_TYPE', 'Referring site' ),
			'a platform'       => array( 'PLATFORM', 'SOURCE_TYPE', 'Referring site' ),
			'a campaign'       => array( 'CAMPAIGN', 'SOURCE_TYPE', 'Campaign' ),
			'a device'         => array( 'DEVICE', 'READER_DEVICE', 'Reader device' ),
			'a visitor type'   => array( 'USER_TYPE', 'VISITOR_TYPE', 'Visitor type' ),
		);
	}

	public function test_build__sends_each_row_with_its_share_of_the_card_change() {
		$attributes = $this->build(
			array( 1300, 1000 ),
			array( array( 'Organic Search', 1300, 1000 ) ),
			array(
				$this->card(
					'CHANNEL',
					'Organic Search',
					1300,
					1000,
					array(
						$this->attribute( 'LANDING_PAGE', '/', 400, 300 ),
						$this->attribute( 'DEVICE', 'mobile', 700, 650 ),
						$this->attribute( 'LANDING_PAGE', '/plant-garlic/', 600, 200 ),
						$this->attribute( 'USER_TYPE', 'new', 500, 520 ),
						$this->attribute( 'TRAFFIC_CHANNEL', 'Referral', 500, 400 ),
						$this->attribute( 'REFERRING_SITE', 'news.example', 80, 80 ),
					)
				),
			)
		)['key_factors'][0]['attributes'];

		$this->assertSame(
			array(
				array(
					'kind'                       => 'HOMEPAGE',
					'role'                       => 'DECOMPOSITION',
					'label'                      => 'Homepage',
					'share_of_parent_change_pct' => 33.3,
					'entity_delta'               => 100,
				),
				array(
					'kind'                       => 'READER_DEVICE',
					'role'                       => 'CONTEXT',
					'label'                      => 'Reader device',
					'value'                      => array( 'text' => 'mobile' ),
					'share_of_parent_change_pct' => 16.7,
					'entity_delta'               => 50,
				),
				array(
					'kind'         => 'TARGET_PAGE',
					'role'         => 'CONTEXT',
					'label'        => 'Target page',
					'value'        => array( 'text' => '/plant-garlic/' ),
					'entity_delta' => 400,
				),
				array(
					'kind'         => 'VISITOR_TYPE',
					'role'         => 'CONTEXT',
					'label'        => 'Visitor type',
					'value'        => array( 'text' => 'new' ),
					'entity_delta' => -20,
				),
			),
			$attributes,
			'The home page should be a `Homepage` row without a value, a row from 25% of the card\'s change a part of it, a row larger than the card or moving against it context without a share, and a channel row or a row without a change left out.'
		);
	}

	public function test_build__sends_a_search_keyword_row_as_context_with_its_share_of_the_site_search_clicks() {
		$key_factors = array(
			$this->card(
				'CHANNEL',
				'Organic Search',
				1300,
				1000,
				array( $this->attribute( 'SEARCH_KEYWORD', 'plant garlic', 90, 50 ) )
			),
		);

		$this->assertSame(
			array(
				'kind'                       => 'SOURCE_TYPE',
				'role'                       => 'CONTEXT',
				'label'                      => 'Search keyword',
				'value'                      => array( 'text' => 'plant garlic' ),
				'entity_delta'               => 40,
				'share_of_search_clicks_pct' => 4.0,
			),
			$this->build( array( 1300, 1000 ), array( array( 'Organic Search', 1300, 1000 ) ), $key_factors, array( 1000, 800 ) )['key_factors'][0]['attributes'][0],
			'A search keyword row should be context, with its change in clicks as a share of the larger of the site\'s search clicks.'
		);
		$this->assertArrayNotHasKey(
			'share_of_search_clicks_pct',
			$this->build( array( 1300, 1000 ), array( array( 'Organic Search', 1300, 1000 ) ), $key_factors )['key_factors'][0]['attributes'][0],
			'Without the site\'s search clicks, a search keyword row should have no share.'
		);
	}

	public function test_build__leaves_out_the_excess_outsized_and_large_share_fields_of_a_card_without_them() {
		$card = $this->build(
			array( 1100, 1000 ),
			array_map(
				fn( $channel ) => array( $channel, 220, 200 ),
				array( 'Organic Search', 'Referral', 'Direct', 'Email', 'Organic Social' )
			),
			array( $this->card( 'CHANNEL', 'Organic Search', 220, 200 ) )
		)['key_factors'][0];

		$this->assertSame(
			array( 'dimension', 'entity_kind', 'title', 'volume', 'delta', 'direction', 'traffic_impact_pct', 'metric_type', 'share_basis', 'role', 'attributes' ),
			array_keys( $card ),
			'A channel that rose at the site\'s own rate, with a fifth of the movement, should have no `excess`, `outsized` or `is_large_share`, which the service reads as `0` or false.'
		);
	}
}
