<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Key_Factors
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * Builds the key factor cards of the benchmarking response, and the
 * `decomposition` the insight request carries them as, by the card algorithm
 * of service §5.10.
 *
 * The service writes the insight's driver text about the cards it receives,
 * and never recomputes or re-selects them. So the plugin owns the algorithm,
 * and builds the cards the panel shows and the cards it sends in one pass,
 * from the same figures, so the text never names a driver the panel doesn't
 * show.
 *
 * Every visit has exactly one channel, so the cards are rooted in the
 * channels: a card names a channel, the paid channels as one group, or a part
 * of a channel, a landing page, a referring site or a campaign, that carried
 * at least half of its channel's change with no sibling reaching a quarter of
 * it. Such a part takes its channel's card, so the same visits are never on
 * two cards. Search keywords, devices and visitor types are never cards, only
 * rows of a channel's card.
 *
 * A period that rose or dropped shows what caused the shift, with at most one
 * card moving against it. A flat period whose channels moved against each
 * other shows both sides. A flat period on which nothing moved materially is
 * steady, and shows the channels with the most visits instead.
 *
 * The plugin's reports differ from the service's in a few ways:
 * - A channel's sources are its own, from the channel and source report, so a
 *   source's figure is its change in that channel, where the service reads
 *   the site's sources and routes each to a channel by its name.
 * - A page takes its channel's card only when it is a post published in the
 *   period, as in the service, so a site whose property has no post date
 *   dimension has no page cards.
 * - The plugin has no click ID parameters, since it reports landing pages
 *   without their query strings, and no screen for sensitive names, which the
 *   service applies to the cards it receives.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Key_Factors {

	/**
	 * The most cards there are.
	 *
	 * @since n.e.x.t
	 */
	const MAX_CARDS = 3;

	/**
	 * The most rows a card has.
	 *
	 * @since n.e.x.t
	 */
	const MAX_ROWS = 2;

	/**
	 * The most rows, one per member channel, the paid group's card has.
	 *
	 * @since n.e.x.t
	 */
	const MAX_GROUP_ROWS = 3;

	/**
	 * The change in visits, in percent of the previous period, beyond which the
	 * period is a rise or a drop rather than flat.
	 *
	 * @since n.e.x.t
	 */
	const NOTABLE_CHANGE_PERCENT = 5.0;

	/**
	 * The excess change, in percent of the larger period total, that a channel
	 * of a flat period needs for its channels to offset each other. Below it,
	 * nothing moved materially, and the period is steady.
	 *
	 * @since n.e.x.t
	 */
	const OFFSETTING_EXCESS_PERCENT = 1.0;

	/**
	 * The share of the movement in the period's direction that the largest
	 * card moving that way needs for the change to be concentrated in it.
	 *
	 * @since n.e.x.t
	 */
	const CONCENTRATED_SHARE = 0.5;

	/**
	 * The change, in visits over 28 days, a card or a row needs. It scales with
	 * the length of the period, as `round( 10 × d / 28 )`, at least 1.
	 *
	 * @since n.e.x.t
	 */
	const MINIMUM_DELTA_PER_28_DAYS = 10;

	/**
	 * The share of the larger period total a card's change needs.
	 *
	 * @since n.e.x.t
	 */
	const MINIMUM_TRAFFIC_SHARE = 0.005;

	/**
	 * The share of the site's gross movement a card's change needs.
	 *
	 * @since n.e.x.t
	 */
	const MINIMUM_GROSS_SHARE = 0.05;

	/**
	 * The share of its channel's change a part needs to take its channel's
	 * card.
	 *
	 * @since n.e.x.t
	 */
	const ELEVATION_SHARE = 0.5;

	/**
	 * The share of its channel's change from which a sibling keeps a part from
	 * taking its channel's card, and from which a part is a row of the card.
	 *
	 * @since n.e.x.t
	 */
	const SIBLING_SHARE = 0.25;

	/**
	 * How much more than its channel's change a part may carry, in proportion,
	 * before the channel counts as the net of parts that moved both ways. Two
	 * reports of the same visits can disagree by this much.
	 *
	 * @since n.e.x.t
	 */
	const NET_SLACK = 1.10;

	/**
	 * The share of its card's change a row needs.
	 *
	 * @since n.e.x.t
	 */
	const ROW_SHARE = 0.10;

	/**
	 * The share of the site's change in search clicks a search keyword needs
	 * to be a row.
	 *
	 * @since n.e.x.t
	 */
	const KEYWORD_SHARE = 0.25;

	/**
	 * The share of `Direct`'s change the homepage needs to be a row.
	 *
	 * @since n.e.x.t
	 */
	const HOMEPAGE_SHARE = 0.40;

	/**
	 * How many percentage points the homepage's share of `Direct`'s change must
	 * be above its share of `Direct`'s visits to be a row. A homepage that
	 * changed as much as `Direct` only shows where its visitors already land.
	 *
	 * @since n.e.x.t
	 */
	const HOMEPAGE_MARGIN_PERCENT = 10;

	/**
	 * How many percentage points a device's or a visitor type's share of its
	 * channel's change must differ from its share of the channel's visits to be
	 * a row. A 95% mobile site sees about 95% of any change on mobile, and a
	 * site whose visitors are 98% new sees about 98% of any change in new
	 * visitors.
	 *
	 * The service's §5.9 applies it to devices only. The plugin applies it to
	 * visitor types as well, for the same reason.
	 *
	 * @since n.e.x.t
	 */
	const BREAKDOWN_MARGIN_PERCENT = 10;

	/**
	 * The share of the paid channels' gross movement a paid channel needs to
	 * count towards the paid group, and to be one of its rows.
	 *
	 * @since n.e.x.t
	 */
	const PAID_MEMBER_SHARE = 0.10;

	/**
	 * The share of the site's gross movement a card needs for its change to be
	 * described as large.
	 *
	 * @since n.e.x.t
	 */
	const LARGE_SHARE = 0.25;

	/**
	 * The share of a card's change, in percent, from which a row is a part of
	 * it rather than context.
	 *
	 * @since n.e.x.t
	 */
	const DECOMPOSITION_ROW_SHARE_PERCENT = 25;

	/**
	 * The share of the site's net change, in percent, from which an offsetting
	 * card's share is left out, since it would read as all of the change.
	 *
	 * @since n.e.x.t
	 */
	const NET_CHANGE_SHARE_LIMIT_PERCENT = 99.5;

	/**
	 * The share of the site's net change, in proportion, below which the pool of
	 * movement in the site's own direction is too small to be a card's share.
	 *
	 * @since n.e.x.t
	 */
	const MINIMUM_POOL_SHARE = 0.25;

	/**
	 * The excess change, in percent of the larger period total, a card needs to
	 * be outsized.
	 *
	 * @since n.e.x.t
	 */
	const OUTSIZED_EXCESS_PERCENT = 1.0;

	/**
	 * The share of its own change a card's excess change needs to be outsized.
	 *
	 * @since n.e.x.t
	 */
	const OUTSIZED_EXCESS_SHARE = 0.5;

	/**
	 * How far apart two shares or excess changes may be and still tie.
	 *
	 * @since n.e.x.t
	 */
	const TIE_TOLERANCE = 0.0001;

	/**
	 * The paid channels of the default channel grouping, in lower case. `paid
	 * traffic` is a plain total of them, which some reports carry.
	 *
	 * @since n.e.x.t
	 */
	const PAID_CHANNELS = array( 'paid search', 'cross-network', 'paid social', 'paid other', 'paid shopping', 'paid video', 'display', 'paid audio', 'paid traffic' );

	/**
	 * The plain total of the paid channels, in lower case.
	 *
	 * @since n.e.x.t
	 */
	const PAID_TOTAL_CHANNEL = 'paid traffic';

	/**
	 * The title of the card of the paid channels as one group, which the
	 * service reads in English.
	 *
	 * @since n.e.x.t
	 */
	const PAID_GROUP_TITLE = 'Paid traffic';

	/**
	 * The channels, in lower case, whose campaigns are parts of them, besides
	 * the paid channels.
	 *
	 * @since n.e.x.t
	 */
	const CAMPAIGN_CHANNELS = array( 'email', 'organic social', 'paid social' );

	/**
	 * The channels, in lower case, whose sources are platforms rather than
	 * referring sites, besides the paid channels.
	 *
	 * @since n.e.x.t
	 */
	const PLATFORM_CHANNELS = array( 'organic video' );

	/**
	 * The `Direct` channel, in lower case.
	 *
	 * @since n.e.x.t
	 */
	const DIRECT_CHANNEL = 'direct';

	/**
	 * The `Organic Search` channel, in lower case, whose search keywords are
	 * rows of its card.
	 *
	 * @since n.e.x.t
	 */
	const SEARCH_CHANNEL = 'organic search';

	/**
	 * The `AI Assistant` channel, in lower case, whose sources are assistants.
	 *
	 * @since n.e.x.t
	 */
	const ASSISTANT_CHANNEL = 'ai assistant';

	/**
	 * The service's `dimension` and `entity_kind` of each card kind.
	 *
	 * @since n.e.x.t
	 */
	const CARD_KINDS = array(
		'CHANNEL'        => array( 'TRAFFIC_CHANNELS', 'CHANNEL' ),
		'CHANNEL_GROUP'  => array( 'TRAFFIC_CHANNELS', 'CHANNEL_GROUP' ),
		'CONTENT'        => array( 'PAGES', 'CONTENT' ),
		'REFERRING_SITE' => array( 'SOURCES', 'REFERRING_SITE' ),
		'CAMPAIGN'       => array( 'CAMPAIGNS', 'CAMPAIGN' ),
	);

	/**
	 * The response's attribute kind, and the cut of the card's visits, of each
	 * row kind measured in visits. Rows of two cuts overlap by an unknown
	 * amount, so a card's rows come from one cut.
	 *
	 * @since n.e.x.t
	 */
	const ROW_CUTS = array(
		'HOMEPAGE'      => 'page',
		'TARGET_PAGE'   => 'page',
		'SOURCE_TYPE'   => 'part',
		'VISITOR_TYPE'  => 'visitor_type',
		'READER_DEVICE' => 'device',
	);

	/**
	 * The rows, keyed by contextual data key.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $contextual_data;

	/**
	 * The site's visits in the selected period and in the period before it, as
	 * `current` and `previous`.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $visits;

	/**
	 * The path of the site's homepage, which a homepage row names.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $home_path;

	/**
	 * The number of days in the selected period.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $days_in_period;

	/**
	 * The smallest change a card or a row needs, scaled to the period's length.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $minimum_delta;

	/**
	 * The reduction of each channel, keyed by the channel's key, once built.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $reductions = array();

	/**
	 * Page_Classifier instance, which tells which landing pages a card may
	 * name.
	 *
	 * @since n.e.x.t
	 * @var Page_Classifier
	 */
	private $page_classifier;

	/**
	 * The channels, most visits first, then by title. Each has `title`, `key`,
	 * the title in lower case, `current`, `previous`, `delta` and `excess`.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $channels = array();

	/**
	 * The visits of the previous period that the cards' changes add up from.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $opening = 0;

	/**
	 * The visits of the selected period that the cards' changes add up to.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $closing = 0;

	/**
	 * The rate the site's visits changed at, from `$opening` to `$closing`.
	 *
	 * @since n.e.x.t
	 * @var float
	 */
	private $site_rate = 0.0;

	/**
	 * The larger of `$opening` and `$closing`, or `1` when neither is positive,
	 * which the excess changes are measured against.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $denominator = 1;

	/**
	 * The sum of every channel's rise in visits.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $gain = 0;

	/**
	 * The sum of every channel's fall in visits, as a positive number.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $loss = 0;

	/**
	 * The site's change in search clicks, or `0` without them.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $search_clicks_delta = 0;

	/**
	 * The larger of the site's search clicks in the two periods, or `0`
	 * without them.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $search_clicks_total = 0;

	/**
	 * The cards and the shape, once built.
	 *
	 * @since n.e.x.t
	 * @var array|null
	 */
	private $result;

	/**
	 * Constructor.
	 *
	 * The channels are the sums of the `channelBreakdowns` rows. Their changes
	 * add up from their visits in the previous period to their visits in the
	 * selected period, since every visit has one channel. When the channels
	 * count fewer visits in the previous period than the site, as when a report
	 * cut some of them off, the site's totals are used, and the visits no
	 * channel counts are part of the residual.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $contextual_data The rows, keyed by contextual data key, as `Contextual_Data_Validator::validate()` returns them.
	 * @param array  $visits          The site's visits in the selected period and in the period before it, as `current` and `previous`.
	 * @param int    $days_in_period  The number of days in the selected period, which the smallest change of a card scales with.
	 * @param string $home_path       Optional. The path of the site's homepage, such as `/blog/` for a site that lives under a folder. Default `/`.
	 */
	public function __construct( array $contextual_data, array $visits, $days_in_period, $home_path = '/' ) {
		$this->contextual_data = $contextual_data;
		$this->home_path       = $home_path;
		$this->visits          = array(
			'current'  => max( 0, (int) $visits['current'] ),
			'previous' => max( 0, (int) $visits['previous'] ),
		);
		$this->days_in_period  = (int) $days_in_period;
		$this->minimum_delta   = max( 1, (int) round( self::MINIMUM_DELTA_PER_28_DAYS * $days_in_period / 28 ) );
		$this->page_classifier = new Page_Classifier(
			Page_Classifier::has_front_page( $this->get_rows( 'channelPages' ), $home_path ),
			$home_path
		);

		$this->set_up_channels();
		$this->set_up_search_clicks();
	}

	/**
	 * Gets the key factor cards the panel shows.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of cards, in the order to show them. Each has `kind`, `CHANNEL`, `CHANNEL_GROUP`, `CONTENT`, `REFERRING_SITE` or `CAMPAIGN`, `label`, `current`, `previous`, `sharePct`, the card's share as the decomposition carries it, of the site's visits on a steady period, `shareBasis`, what that share is of, as the decomposition's `share_basis`, and `attributes`, its rows. A card that took its channel's place, whose basis is `PARENT_CHANNEL`, also has `parentChannel`, the channel's title, and `parentChannelChange`, the channel's change. Each attribute has `kind`, `label`, `current`, `previous`, `sharePct`, the row's share as the decomposition carries it, or `0` without one, and `oversized`, whether the row moved further than its card the same way, so it has no share and is more than the card's change. A search keyword's attribute counts clicks.
	 */
	public function get_cards() {
		return array_column( $this->get_result()['cards'], 'key_factor' );
	}

	/**
	 * Tells whether the period is steady: the site's visits changed by no more
	 * than `NOTABLE_CHANGE_PERCENT`, and no channel's excess change reached
	 * `OFFSETTING_EXCESS_PERCENT`, so no channel changed notably.
	 *
	 * A steady period's cards are the channels with the most visits, each with
	 * its share of the site's visits.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True when the period is steady, false otherwise, which includes a period without channels.
	 */
	public function is_steady() {
		return 'STEADY' === $this->get_result()['shape'];
	}

	/**
	 * Gets the `decomposition` the insight request carries the cards as, in
	 * the wire format of service §5.10.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|null The decomposition, with `opening_sessions`, `closing_sessions`, `residual_delta`, `shape` and `key_factors`, the cards in the panel's order. Null without channels, since the cards' changes then add up to nothing.
	 */
	public function get_decomposition() {
		$result = $this->get_result();

		if ( null === $result['shape'] ) {
			return null;
		}

		$cards = array_column( $result['cards'], 'wire' );

		return array(
			'opening_sessions' => $this->opening,
			'closing_sessions' => $this->closing,
			'residual_delta'   => $this->closing - $this->opening - array_sum( array_column( $cards, 'delta' ) ),
			'shape'            => $result['shape'],
			'key_factors'      => $cards,
		);
	}

	/**
	 * Adds up the visits of the rows with the same value of a field.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $rows  The rows, each with the field, `current` and `previous`.
	 * @param string $field The field to add the rows up by, such as `channel`.
	 * @return array List of sums, one per value, in the order the values first appear. Each has the value as `label`, `current` and `previous`.
	 */
	public static function sum_by( array $rows, $field ) {
		$sums = array();

		foreach ( $rows as $row ) {
			$label = (string) $row[ $field ];

			if ( ! isset( $sums[ $label ] ) ) {
				$sums[ $label ] = array(
					'label'    => $label,
					'current'  => 0,
					'previous' => 0,
				);
			}

			$sums[ $label ]['current']  += (int) $row['current'];
			$sums[ $label ]['previous'] += (int) $row['previous'];
		}

		return array_values( $sums );
	}

	/**
	 * Sets up the channels and the figures of the period they add up to.
	 *
	 * A plain total of the paid channels is left out when the paid channels
	 * themselves are there, so their visits count once.
	 *
	 * @since n.e.x.t
	 */
	private function set_up_channels() {
		$channels = array_map(
			fn( $row ) => array(
				'title'    => $row['label'],
				'key'      => self::get_key( $row['label'] ),
				'current'  => $row['current'],
				'previous' => $row['previous'],
				'delta'    => $row['current'] - $row['previous'],
			),
			self::sum_by( $this->get_rows( 'channelBreakdowns' ), 'channel' )
		);

		$has_paid_channels = ! empty(
			array_filter(
				$channels,
				fn( $channel ) => self::is_paid_channel( $channel['key'] ) && self::PAID_TOTAL_CHANNEL !== $channel['key']
			)
		);

		if ( $has_paid_channels ) {
			$channels = array_filter( $channels, fn( $channel ) => self::PAID_TOTAL_CHANNEL !== $channel['key'] );
		}

		// `usort()` isn't stable on PHP 7.4, so the title orders channels with
		// the same visits, to come back in the same order on every run.
		usort(
			$channels,
			fn( $first, $second ) => ( $second['current'] <=> $first['current'] ) ?: strcmp( $first['title'], $second['title'] )
		);

		$channel_current  = array_sum( array_column( $channels, 'current' ) );
		$channel_previous = array_sum( array_column( $channels, 'previous' ) );

		if ( $channel_previous >= $this->visits['previous'] || ( 0 === $this->visits['current'] && 0 === $this->visits['previous'] ) ) {
			$this->opening = $channel_previous;
			$this->closing = $channel_current;
		} else {
			$this->opening = $this->visits['previous'];
			$this->closing = $this->visits['current'];
		}

		$this->site_rate   = $this->opening > 0 ? ( $this->closing - $this->opening ) / $this->opening : 0.0;
		$this->denominator = max( $this->opening, $this->closing, 0 ) ?: 1;

		foreach ( $channels as $channel ) {
			$channel['excess'] = $this->get_excess( $channel['delta'], $channel['previous'] );
			$this->channels[]  = $channel;

			if ( $channel['delta'] > 0 ) {
				$this->gain += $channel['delta'];
			} else {
				$this->loss -= $channel['delta'];
			}
		}
	}

	/**
	 * Sets up the site's change in search clicks, and the larger of its clicks
	 * in the two periods.
	 *
	 * @since n.e.x.t
	 */
	private function set_up_search_clicks() {
		$rows = $this->get_rows( 'searchClicks' );

		if ( empty( $rows ) ) {
			return;
		}

		$this->search_clicks_delta = (int) $rows[0]['current'] - (int) $rows[0]['previous'];
		$this->search_clicks_total = max( (int) $rows[0]['current'], (int) $rows[0]['previous'] );
	}

	/**
	 * Builds the cards and the shape once.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The result, with `shape`, null without channels, and `cards`, each with `key_factor`, the panel's card, and `wire`, the decomposition's card.
	 */
	private function get_result() {
		if ( null !== $this->result ) {
			return $this->result;
		}

		if ( empty( $this->channels ) ) {
			$this->result = array(
				'shape' => null,
				'cards' => array(),
			);

			return $this->result;
		}

		$period_direction = $this->get_period_direction();

		if ( 'STABLE' === $period_direction && ! $this->has_offsetting_channel() ) {
			$this->result = array(
				'shape' => 'STEADY',
				'cards' => $this->build_steady_cards(),
			);

			return $this->result;
		}

		$nodes             = $this->get_card_nodes();
		$primary_direction = $this->get_primary_direction( $period_direction, $nodes );
		$cards             = $this->build_moving_cards( $nodes, $primary_direction, $period_direction );

		// On a flat period, a part of the channel that moved most can be
		// smaller than the channel that moved against it. The other side is
		// then the larger story, unless its own cards have the same problem.
		if ( 'STABLE' === $period_direction && $this->has_larger_offset( $cards ) ) {
			$opposite_direction = 'UP' === $primary_direction ? 'DOWN' : 'UP';
			$flipped_cards      = $this->build_moving_cards( $nodes, $opposite_direction, $period_direction );

			if ( ! $this->has_larger_offset( $flipped_cards ) ) {
				$primary_direction = $opposite_direction;
				$cards             = $flipped_cards;
			}
		}

		$shape = 'STABLE' === $period_direction ? 'OFFSETTING' : $this->get_moving_shape( $nodes, $primary_direction );
		$cards = $this->sort_cards( $cards );

		// The service names at least two primary cards for a diffuse change,
		// so a diffuse change with fewer reads as a concentrated one.
		if ( 'DIFFUSE' === $shape && count( wp_list_filter( array_column( $cards, 'wire' ), array( 'role' => 'PRIMARY' ) ) ) < 2 ) {
			$shape = 'CONCENTRATED';
		}

		$this->result = array(
			'shape' => $shape,
			'cards' => $cards,
		);

		return $this->result;
	}

	/**
	 * Gets the direction of the site's visits: `UP` or `DOWN` when they changed
	 * by more than `NOTABLE_CHANGE_PERCENT`, `STABLE` otherwise.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The direction.
	 */
	private function get_period_direction() {
		if ( 0 === $this->visits['previous'] ) {
			return $this->visits['current'] > 0 ? 'UP' : 'STABLE';
		}

		$change_percent = self::round1( ( $this->visits['current'] - $this->visits['previous'] ) / $this->visits['previous'] * 100 );

		if ( $change_percent > self::NOTABLE_CHANGE_PERCENT ) {
			return 'UP';
		}

		return $change_percent < -self::NOTABLE_CHANGE_PERCENT ? 'DOWN' : 'STABLE';
	}

	/**
	 * Checks whether a channel's excess change reaches
	 * `OFFSETTING_EXCESS_PERCENT`, so on a flat period channels moved against
	 * each other.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True when a channel's excess change reaches it, false otherwise.
	 */
	private function has_offsetting_channel() {
		foreach ( $this->channels as $channel ) {
			if ( abs( $channel['excess'] ) / $this->denominator * 100 >= self::OFFSETTING_EXCESS_PERCENT ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Gets the nodes a card can be built for: the channels, with the paid
	 * channels as one group when at least two of them moved materially.
	 *
	 * A channel named by a placeholder, such as `(not set)`, names nothing the
	 * reader would recognise, so it is no node, though its visits count in the
	 * period's figures.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of nodes, in the channels' order, with the paid group after the channels. Each has `title`, `key`, `current`, `previous`, `delta`, `excess`, `rank_size`, the size it is ranked by, and either `channel` or, for the paid group, `members`.
	 */
	private function get_card_nodes() {
		$paid_channels = array_values(
			array_filter(
				$this->channels,
				fn( $channel ) => self::is_paid_channel( $channel['key'] ) && ! Insight_Request_Builder::is_placeholder( $channel['title'] )
			)
		);
		$paid_group    = $this->get_paid_group( $paid_channels );
		$nodes         = array();

		foreach ( $this->channels as $channel ) {
			if ( Insight_Request_Builder::is_placeholder( $channel['title'] ) || ( null !== $paid_group && self::is_paid_channel( $channel['key'] ) ) ) {
				continue;
			}

			$nodes[] = array(
				'title'     => $channel['title'],
				'key'       => $channel['key'],
				'current'   => $channel['current'],
				'previous'  => $channel['previous'],
				'delta'     => $channel['delta'],
				'excess'    => $channel['excess'],
				'rank_size' => abs( $channel['delta'] ),
				'channel'   => $channel,
			);
		}

		if ( null !== $paid_group ) {
			$nodes[] = $paid_group;
		}

		return $nodes;
	}

	/**
	 * Gets the node of the paid channels as one group, when at least two of
	 * them moved by `minimum_delta` and by `PAID_MEMBER_SHARE` of the paid
	 * channels' gross movement, and their net change is not `0`.
	 *
	 * The group is ranked by the paid channels' gross movement, so channels
	 * that swapped visits rank by how much moved, not by the little that is
	 * left of it.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $paid_channels The paid channels.
	 * @return array|null The node, or null when the paid channels stay channels.
	 */
	private function get_paid_group( array $paid_channels ) {
		$gross = array_sum( array_map( fn( $channel ) => abs( $channel['delta'] ), $paid_channels ) );
		$delta = array_sum( array_column( $paid_channels, 'delta' ) );

		$members = array_filter(
			$paid_channels,
			fn( $channel ) => $this->is_paid_member( $channel, $gross )
		);

		if ( count( $members ) < 2 || 0 === $delta ) {
			return null;
		}

		$previous = array_sum( array_column( $paid_channels, 'previous' ) );

		return array(
			'title'     => self::PAID_GROUP_TITLE,
			'key'       => self::get_key( self::PAID_GROUP_TITLE ),
			'current'   => array_sum( array_column( $paid_channels, 'current' ) ),
			'previous'  => $previous,
			'delta'     => $delta,
			'excess'    => $this->get_excess( $delta, $previous ),
			'rank_size' => $gross,
			'members'   => $paid_channels,
			'gross'     => $gross,
		);
	}

	/**
	 * Checks whether a paid channel moved enough to count towards the paid
	 * group, and to be one of its rows.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The paid channel.
	 * @param int   $gross   The paid channels' gross movement.
	 * @return bool True when it did.
	 */
	private function is_paid_member( array $channel, $gross ) {
		return abs( $channel['delta'] ) >= $this->minimum_delta && abs( $channel['delta'] ) >= self::PAID_MEMBER_SHARE * $gross;
	}

	/**
	 * Gets the direction a card must move in to be a primary card rather than
	 * an offsetting one.
	 *
	 * It is the period's own direction when the period rose or dropped. On a
	 * flat period, it is the direction of the node that moved most, so that
	 * node is primary. Nodes that moved as much in both directions take the
	 * direction with more movement over every channel, and a rise when that is
	 * a tie too.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $period_direction The period's direction.
	 * @param array  $nodes            The nodes a card can be built for.
	 * @return string `UP` or `DOWN`.
	 */
	private function get_primary_direction( $period_direction, array $nodes ) {
		if ( 'STABLE' !== $period_direction ) {
			return $period_direction;
		}

		$largest_change = empty( $nodes ) ? 0 : max( array_map( fn( $node ) => abs( $node['delta'] ), $nodes ) );
		$has_rise       = false;
		$has_fall       = false;

		foreach ( $nodes as $node ) {
			if ( 0 !== $node['delta'] && abs( $node['delta'] ) === $largest_change ) {
				$has_rise = $has_rise || $node['delta'] > 0;
				$has_fall = $has_fall || $node['delta'] < 0;
			}
		}

		if ( $has_rise !== $has_fall ) {
			return $has_rise ? 'UP' : 'DOWN';
		}

		return $this->loss > $this->gain ? 'DOWN' : 'UP';
	}

	/**
	 * Gets the shape of a period that rose or dropped: `CONCENTRATED` when the
	 * node that moved most in the period's direction carries at least
	 * `CONCENTRATED_SHARE` of the movement of the nodes moving that way, and
	 * `DIFFUSE` otherwise.
	 *
	 * The paid group counts once, as its net change.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $nodes             The nodes a card can be built for.
	 * @param string $primary_direction The direction of a primary card.
	 * @return string The shape.
	 */
	private function get_moving_shape( array $nodes, $primary_direction ) {
		$pool           = 0;
		$largest_change = 0;

		foreach ( $nodes as $node ) {
			if ( 0 !== $node['delta'] && ! self::is_counter_move( $node['delta'], $primary_direction ) ) {
				$pool          += abs( $node['delta'] );
				$largest_change = max( $largest_change, abs( $node['delta'] ) );
			}
		}

		return $pool > 0 && $largest_change >= self::CONCENTRATED_SHARE * $pool ? 'CONCENTRATED' : 'DIFFUSE';
	}

	/**
	 * Builds the cards of a period on which something moved: picks the nodes,
	 * and builds one card for each.
	 *
	 * A part of a channel that takes the channel's card is remembered, so a
	 * part that carried the change of two channels takes the card of the
	 * first only.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $nodes             The nodes a card can be built for.
	 * @param string $primary_direction The direction of a primary card.
	 * @param string $period_direction  The period's direction.
	 * @return array List of cards, in the order the nodes were picked in.
	 */
	private function build_moving_cards( array $nodes, $primary_direction, $period_direction ) {
		$elevated_keys = array();
		$cards         = array();

		foreach ( $this->select_nodes( $nodes, $primary_direction, $period_direction ) as $node ) {
			$cards[] = isset( $node['members'] )
				? $this->build_group_card( $node, $primary_direction, $period_direction )
				: $this->build_channel_card( $node, $primary_direction, $period_direction, $elevated_keys );
		}

		return $cards;
	}

	/**
	 * Picks the nodes to build cards for, at most `MAX_CARDS`.
	 *
	 * A node is eligible when it moved by `minimum_delta`, by
	 * `MINIMUM_TRAFFIC_SHARE` of the larger period total and by
	 * `MINIMUM_GROSS_SHARE` of the site's gross movement. The eligible nodes
	 * are ranked by how much they moved, then by their excess change, then by
	 * title. A period that rose or dropped takes at most one node moving
	 * against it, and always one moving with it. A flat period shows both
	 * sides: up to two nodes from the side it leaned towards and one from the
	 * other, with any slot left filled by the next nodes of either side.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $nodes             The nodes a card can be built for.
	 * @param string $primary_direction The direction of a primary card.
	 * @param string $period_direction  The period's direction.
	 * @return array List of nodes, those moving the primary direction first, then in rank order.
	 */
	private function select_nodes( array $nodes, $primary_direction, $period_direction ) {
		$minimum = max(
			$this->minimum_delta,
			self::MINIMUM_TRAFFIC_SHARE * $this->denominator,
			self::MINIMUM_GROSS_SHARE * ( $this->gain + $this->loss )
		);

		$ranking = array_values( array_filter( $nodes, fn( $node ) => $node['rank_size'] >= $minimum ) );

		usort(
			$ranking,
			function ( $first, $second ) {
				if ( $first['rank_size'] !== $second['rank_size'] ) {
					return $second['rank_size'] <=> $first['rank_size'];
				}

				$excess_difference = abs( $second['excess'] ) - abs( $first['excess'] );

				if ( abs( $excess_difference ) > self::TIE_TOLERANCE ) {
					return $excess_difference > 0 ? 1 : -1;
				}

				return strcmp( $first['title'], $second['title'] );
			}
		);

		$is_counter = fn( $node ) => self::is_counter_move( $node['delta'], $primary_direction );
		$selected   = array();

		if ( 'STABLE' === $period_direction ) {
			$counts = array(
				'primary' => 0,
				'counter' => 0,
			);

			foreach ( $ranking as $index => $node ) {
				$side = $is_counter( $node ) ? 'counter' : 'primary';

				if ( $counts[ $side ] < ( 'counter' === $side ? 1 : 2 ) && count( $selected ) < self::MAX_CARDS ) {
					$selected[ $index ] = $node;
					++$counts[ $side ];
				}
			}

			foreach ( $ranking as $index => $node ) {
				if ( ! isset( $selected[ $index ] ) && count( $selected ) < self::MAX_CARDS ) {
					$selected[ $index ] = $node;
				}
			}

			ksort( $selected );
		} else {
			$has_counter = false;

			foreach ( $ranking as $node ) {
				if ( count( $selected ) >= self::MAX_CARDS ) {
					break;
				}

				if ( $is_counter( $node ) ) {
					if ( $has_counter ) {
						continue;
					}

					$has_counter = true;
				}

				$selected[] = $node;
			}

			$selected = $this->add_primary_node( array_values( $selected ), $nodes, $primary_direction );
		}

		$primary = array_filter( $selected, fn( $node ) => ! $is_counter( $node ) );
		$counter = array_filter( $selected, $is_counter );

		return array_values( array_merge( $primary, $counter ) );
	}

	/**
	 * Makes sure a period that rose or dropped has a node moving with it: when
	 * none was picked, adds the node that moved most that way, in place of the
	 * last node picked when there are `MAX_CARDS`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $selected          The nodes picked.
	 * @param array  $nodes             Every node a card can be built for, in the channels' order.
	 * @param string $primary_direction The direction of a primary card, the period's own.
	 * @return array The nodes picked.
	 */
	private function add_primary_node( array $selected, array $nodes, $primary_direction ) {
		foreach ( $selected as $node ) {
			if ( ! self::is_counter_move( $node['delta'], $primary_direction ) ) {
				return $selected;
			}
		}

		$largest = null;

		foreach ( $nodes as $node ) {
			if ( 0 !== $node['delta'] && ! self::is_counter_move( $node['delta'], $primary_direction ) && ( null === $largest || abs( $node['delta'] ) > abs( $largest['delta'] ) ) ) {
				$largest = $node;
			}
		}

		if ( null === $largest ) {
			return $selected;
		}

		if ( count( $selected ) >= self::MAX_CARDS ) {
			array_pop( $selected );
		}

		$selected[] = $largest;

		return $selected;
	}

	/**
	 * Builds the card of a channel.
	 *
	 * A part of the channel takes the card when it carried at least
	 * `ELEVATION_SHARE` of the channel's change, no other part from the same
	 * breakdown carried `SIBLING_SHARE` of it, it didn't take another card's
	 * place already, and it isn't an AI assistant. The channel is then named
	 * by that part, with its share of the channel's change. A channel that is
	 * the net of parts that moved both ways keeps its card, since no part is
	 * a share of it.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $node              The channel's node.
	 * @param string $primary_direction The direction of a primary card.
	 * @param string $period_direction  The period's direction.
	 * @param array  $elevated_keys     The keys of the parts that took a card, keyed by key. A part that takes this card is added.
	 * @return array The card, with `key_factor` and `wire`.
	 */
	private function build_channel_card( array $node, $primary_direction, $period_direction, array &$elevated_keys ) {
		$delta    = $node['delta'];
		$role     = self::is_counter_move( $delta, $primary_direction ) ? 'OFFSET' : 'PRIMARY';
		$children = $this->get_children( $node['channel'] );
		$split    = $this->split_children( $children, $delta );

		if ( $this->can_elevate( $split, $children, $delta, $elevated_keys ) ) {
			$child = $split['top_same'];

			$elevated_keys[ $child['key'] ] = true;

			// A part that carried a little more than its channel, within the
			// disagreement of two reports, is no share of the channel, so it
			// takes the share of a card of its own.
			$share = $split['ratio'] > 1
				? $this->get_card_share( $child['delta'], $role, $period_direction )
				: array(
					'share_basis'          => 'PARENT_CHANNEL',
					'traffic_impact_pct'   => self::round1( $split['ratio'] * 100 ),
					'parent_channel'       => $node['title'],
					'parent_channel_delta' => $delta,
				);

			// A post's card carries its path, which its title links to.
			$url = 'CONTENT' === $child['kind'] ? $child['text'] : null;

			return $this->build_card( $child['kind'], $child['title'], $child['current'], $child['previous'], $role, $share, array(), $url );
		}

		return $this->build_card(
			'CHANNEL',
			$node['title'],
			$node['current'],
			$node['previous'],
			$role,
			$this->get_card_share( $delta, $role, $period_direction ),
			$this->get_channel_rows( $node['channel'], $children, $split, $elevated_keys )
		);
	}

	/**
	 * Builds the card of the paid channels as one group.
	 *
	 * Its rows are the paid channels that moved materially, each with its
	 * share of the paid channels' gross movement rather than of the group's
	 * net change, and with the campaign that carried most of its change.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $node              The group's node.
	 * @param string $primary_direction The direction of a primary card.
	 * @param string $period_direction  The period's direction.
	 * @return array The card, with `key_factor` and `wire`.
	 */
	private function build_group_card( array $node, $primary_direction, $period_direction ) {
		$role    = self::is_counter_move( $node['delta'], $primary_direction ) ? 'OFFSET' : 'PRIMARY';
		$members = array_values( array_filter( $node['members'], fn( $member ) => $this->is_paid_member( $member, $node['gross'] ) ) );

		usort(
			$members,
			fn( $first, $second ) => ( abs( $second['delta'] ) <=> abs( $first['delta'] ) ) ?: strcmp( $first['title'], $second['title'] )
		);

		$rows = array();

		foreach ( array_slice( $members, 0, self::MAX_GROUP_ROWS ) as $member ) {
			$share_percent = self::round1( abs( $member['delta'] ) / $node['gross'] * 100 );
			$wire          = array(
				'kind'                     => 'CHANNEL',
				'role'                     => 'DECOMPOSITION',
				'label'                    => 'Channel',
				'value'                    => array( 'text' => $member['title'] ),
				'entity_delta'             => $member['delta'],
				'share_of_group_gross_pct' => $share_percent,
			);

			$campaign = $this->get_member_campaign( $member );

			if ( null !== $campaign ) {
				$wire['campaign']       = $campaign['title'];
				$wire['campaign_delta'] = $campaign['delta'];
			}

			$rows[] = array(
				'wire'      => $wire,
				'attribute' => self::get_attribute( 'TRAFFIC_CHANNEL', $member['title'], $member['current'], $member['previous'], $share_percent ),
			);
		}

		return $this->build_card(
			'CHANNEL_GROUP',
			$node['title'],
			$node['current'],
			$node['previous'],
			$role,
			$this->get_card_share( $node['delta'], $role, $period_direction ),
			$rows
		);
	}

	/**
	 * Gets the campaign of a paid channel's row in the paid group's card: its
	 * campaign that moved most with it, when that campaign carried from
	 * `SIBLING_SHARE` to all of its change, and at least `minimum_delta`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $member The paid channel.
	 * @return array|null The campaign, with `title` and `delta`, or null.
	 */
	private function get_member_campaign( array $member ) {
		foreach ( $this->get_campaign_children( $member, array() ) as $campaign ) {
			if ( $campaign['delta'] * $member['delta'] <= 0 ) {
				continue;
			}

			$share = abs( $campaign['delta'] ) / abs( $member['delta'] );

			if ( $share >= self::SIBLING_SHARE && $share <= 1 && abs( $campaign['delta'] ) >= $this->minimum_delta ) {
				return array(
					'title' => $campaign['title'],
					'delta' => $campaign['delta'],
				);
			}

			return null;
		}

		return null;
	}

	/**
	 * Builds the cards of a steady period: the `MAX_CARDS` channels with the
	 * largest share of the site's visits, each with its own change.
	 *
	 * Its rows are the channel's own landing page, device and visitor type
	 * that moved with it, measured against its own change, and never its
	 * parts from other breakdowns.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of cards, with `key_factor` and `wire`.
	 */
	private function build_steady_cards() {
		$channels = array_values(
			array_filter(
				$this->channels,
				fn( $channel ) => $channel['current'] > 0 && ! Insight_Request_Builder::is_placeholder( $channel['title'] )
			)
		);

		usort(
			$channels,
			function ( $first, $second ) {
				$share_difference = $this->get_volume_share( $second ) - $this->get_volume_share( $first );

				if ( abs( $share_difference ) > self::TIE_TOLERANCE ) {
					return $share_difference > 0 ? 1 : -1;
				}

				return ( $second['current'] <=> $first['current'] ) ?: strcmp( $first['title'], $second['title'] );
			}
		);

		$no_children = array(
			'top_same'          => null,
			'top_opposite'      => null,
			'counted_opposite'  => false,
			'ratio'             => 0,
			'is_net'            => false,
			'without_part_rows' => true,
		);

		$cards = array();

		foreach ( array_slice( $channels, 0, self::MAX_CARDS ) as $channel ) {
			$share_percent = self::round1( $this->get_volume_share( $channel ) );
			$rows          = $this->get_channel_rows( $channel, array(), $no_children, array() );

			list( $dimension, $entity_kind ) = self::CARD_KINDS['CHANNEL'];

			$wire = array(
				'dimension'   => $dimension,
				'entity_kind' => $entity_kind,
				'title'       => $channel['title'],
				'volume'      => $channel['current'],
				'delta'       => $channel['delta'],
			);

			if ( 0.0 !== self::round1( $channel['excess'] ) ) {
				$wire['excess'] = self::round1( $channel['excess'] );
			}

			// A share of the site's visits describes no movement, so its
			// direction is `STABLE` whichever way the channel moved.
			$wire['direction']          = 'STABLE';
			$wire['traffic_impact_pct'] = $share_percent;
			$wire['metric_type']        = 'VOLUME_SHARE';
			$wire['share_basis']        = 'VOLUME';
			$wire['role']               = 'PRIMARY';
			$wire['attributes']         = array_column( $rows, 'wire' );

			$cards[] = array(
				'wire'       => $wire,
				'key_factor' => array(
					'kind'       => 'CHANNEL',
					'label'      => $channel['title'],
					'current'    => $channel['current'],
					'previous'   => $channel['previous'],
					'sharePct'   => $share_percent,
					'shareBasis' => 'VOLUME',
					'attributes' => array_column( $rows, 'attribute' ),
				),
			);
		}

		return $cards;
	}

	/**
	 * Gets a channel's share of the site's visits in the selected period.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The channel.
	 * @return float The share, in percent.
	 */
	private function get_volume_share( array $channel ) {
		return $this->closing > 0 ? $channel['current'] / $this->closing * 100 : 0.0;
	}

	/**
	 * Gets the parts of a channel, each read from one breakdown of its visits,
	 * its slicing: its landing page, its sources and its campaigns. The search
	 * keywords of `Organic Search` are parts too, but count clicks, so they are
	 * of no slicing and never take the channel's card.
	 *
	 * The landing page part of a channel that rose is the post published in the
	 * period at the address of its landing page, as `get_reduction()` finds it,
	 * with the post's visits as its change, as the service reads it. A channel
	 * has no other landing page part, so a page takes a channel's card only
	 * when it is a new post.
	 *
	 * A part that didn't move is left out, and so is a campaign named as one
	 * of the channel's other parts already. Parts with the same key are added
	 * up.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The channel.
	 * @return array List of parts, most moved first, then by key. Each has `key`, `slicing`, `kind`, the card kind it takes, `row_kind`, `row_label`, `attribute_kind`, `title`, the name its card shows, `text`, the name its row shows, `current`, `previous` and `delta`.
	 */
	private function get_children( array $channel ) {
		$children = array();
		$page     = $channel['delta'] > 0 ? $this->get_reduction( $channel )['page'] : null;
		$post     = null === $page ? null : $this->get_recent_post( $page['title'] );

		if ( null !== $post ) {
			$path = Page_Classifier::get_path( $post['url'] );

			self::add_child(
				$children,
				array(
					'key'            => 'content:' . Page_Classifier::get_page_key( $path ),
					'slicing'        => 'page',
					'kind'           => 'CONTENT',
					'row_kind'       => 'TARGET_PAGE',
					'row_label'      => 'Target page',
					'attribute_kind' => 'LANDING_PAGE',
					'title'          => '' !== trim( $post['title'] ) ? trim( $post['title'] ) : $path,
					'text'           => $path,
				),
				array(
					'current'  => $post['current'],
					'previous' => 0,
				)
			);
		}

		if ( self::SEARCH_CHANNEL === $channel['key'] ) {
			foreach ( $this->get_rows( 'searchQueries' ) as $row ) {
				$query = trim( (string) $row['label'] );

				if ( '' === $query ) {
					continue;
				}

				self::add_child(
					$children,
					array(
						'key'            => 'query:' . self::get_key( $query ),
						'slicing'        => null,
						'kind'           => 'SEARCH_KEYWORD',
						'row_kind'       => 'SOURCE_TYPE',
						'row_label'      => 'Search keyword',
						'attribute_kind' => 'SEARCH_KEYWORD',
						'title'          => $query,
						'text'           => $query,
					),
					$row
				);
			}
		}

		foreach ( $this->get_channel_rows_of( 'channelSources', $channel ) as $row ) {
			$source = Source_Classifier::classify_source( $row['source'] );

			if ( null === $source ) {
				continue;
			}

			self::add_child( $children, $this->get_source_child( $channel, $source ), $row );
		}

		$children = array_values( array_filter( $children, fn( $child ) => 0 !== $child['delta'] ) );
		$children = array_merge( $children, $this->get_campaign_children( $channel, $children ) );

		usort(
			$children,
			fn( $first, $second ) => ( abs( $second['delta'] ) <=> abs( $first['delta'] ) ) ?: strcmp( $first['key'], $second['key'] )
		);

		return $children;
	}

	/**
	 * Gets the part a source is of a channel.
	 *
	 * The source of `AI Assistant` is the assistant, which never takes the
	 * channel's card. A source shaped like a campaign name is a campaign. The
	 * source of a paid channel or of `Organic Video` is a platform, and any
	 * other source is a referring site, though the service reads both as a
	 * referring site.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The channel.
	 * @param array $source  The source, as `Source_Classifier::classify_source()` returns it.
	 * @return array The part, without its visits.
	 */
	private function get_source_child( array $channel, array $source ) {
		$child = array(
			'key'            => 'source:' . self::get_key( $source['title'] ),
			'slicing'        => 'source',
			'kind'           => $source['kind'],
			'row_kind'       => 'SOURCE_TYPE',
			'row_label'      => 'Referring site',
			'attribute_kind' => 'REFERRING_SITE',
			'title'          => $source['title'],
			'text'           => $source['title'],
		);

		if ( self::ASSISTANT_CHANNEL === $channel['key'] ) {
			$child['row_label']      = 'Assistant';
			$child['attribute_kind'] = 'ASSISTANT';
			$child['is_assistant']   = true;
		} elseif ( Source_Classifier::CAMPAIGN === $source['kind'] ) {
			$child['row_label']      = 'Campaign';
			$child['attribute_kind'] = 'CAMPAIGN';
		} elseif ( self::is_paid_channel( $channel['key'] ) || in_array( $channel['key'], self::PLATFORM_CHANNELS, true ) ) {
			$child['attribute_kind'] = 'PLATFORM';
		}

		return $child;
	}

	/**
	 * Gets the campaigns of a channel that are parts of it, for the channels
	 * whose campaigns are: `Email`, `Organic Social` and the paid channels.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel  The channel.
	 * @param array $children The channel's other parts, whose titles a campaign may not repeat.
	 * @return array List of the campaigns that moved, most moved first, then by key.
	 */
	private function get_campaign_children( array $channel, array $children ) {
		if ( ! in_array( $channel['key'], self::CAMPAIGN_CHANNELS, true ) && ! self::is_paid_channel( $channel['key'] ) ) {
			return array();
		}

		$titles    = array_map( fn( $child ) => self::get_key( $child['title'] ), $children );
		$campaigns = array();

		foreach ( $this->get_channel_rows_of( 'channelCampaigns', $channel ) as $row ) {
			$title = Source_Classifier::get_campaign_title( $row['campaign'] );

			if ( '' === $title || in_array( self::get_key( $title ), $titles, true ) ) {
				continue;
			}

			self::add_child(
				$campaigns,
				array(
					'key'            => 'campaign:' . self::get_key( $row['campaign'] ),
					'slicing'        => 'campaign',
					'kind'           => 'CAMPAIGN',
					'row_kind'       => 'SOURCE_TYPE',
					'row_label'      => 'Campaign',
					'attribute_kind' => 'CAMPAIGN',
					'title'          => $title,
					'text'           => $title,
				),
				$row
			);
		}

		$campaigns = array_values( array_filter( $campaigns, fn( $campaign ) => 0 !== $campaign['delta'] ) );

		usort(
			$campaigns,
			fn( $first, $second ) => ( abs( $second['delta'] ) <=> abs( $first['delta'] ) ) ?: strcmp( $first['key'], $second['key'] )
		);

		return $campaigns;
	}

	/**
	 * Adds a row's visits to a part, adding the part when it has none yet.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $children The parts, keyed by key.
	 * @param array $child    The part, without its visits.
	 * @param array $row      The row, with `current` and `previous`.
	 */
	private static function add_child( array &$children, array $child, array $row ) {
		if ( ! isset( $children[ $child['key'] ] ) ) {
			$children[ $child['key'] ] = array_merge(
				$child,
				array(
					'current'  => 0,
					'previous' => 0,
					'delta'    => 0,
				)
			);
		}

		$children[ $child['key'] ]['current']  += (int) $row['current'];
		$children[ $child['key'] ]['previous'] += (int) $row['previous'];
		$children[ $child['key'] ]['delta']     = $children[ $child['key'] ]['current'] - $children[ $child['key'] ]['previous'];
	}

	/**
	 * Splits the parts of a channel counted in visits into the largest moving
	 * with the channel and the largest moving against it, and tells whether
	 * the channel is the net of parts that moved both ways.
	 *
	 * A part moving against the channel counts as the other side of a net only
	 * when it moved by `minimum_delta` and by `ROW_SHARE` of the channel's
	 * change. The channel is a net when its largest part moving with it moved
	 * more than the channel, and either such a part moved against it, or the
	 * largest part moved more than `NET_SLACK` times the channel.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $children The channel's parts, most moved first.
	 * @param int   $delta    The channel's change.
	 * @return array The split, with `top_same` and `top_opposite`, each a part or null, `counted_opposite`, whether `top_opposite` counts, `ratio`, the share of the channel's change `top_same` carried, which is at most `NET_SLACK` unless the channel is a net, `is_net`, and `without_part_rows`, false.
	 */
	private function split_children( array $children, $delta ) {
		$top_same     = null;
		$top_opposite = null;

		foreach ( $children as $child ) {
			if ( null === $child['slicing'] ) {
				continue;
			}

			if ( null === $top_same && $child['delta'] * $delta > 0 ) {
				$top_same = $child;
			} elseif ( null === $top_opposite && $child['delta'] * $delta < 0 ) {
				$top_opposite = $child;
			}
		}

		$ratio            = null !== $top_same && 0 !== $delta ? abs( $top_same['delta'] ) / abs( $delta ) : 0;
		$counted_opposite = null !== $top_opposite && $this->is_above_row_floors( $top_opposite['delta'], $delta );
		$is_net           = $ratio > 1 && ( $counted_opposite || $ratio > self::NET_SLACK );

		return array(
			'top_same'          => $top_same,
			'top_opposite'      => $top_opposite,
			'counted_opposite'  => $counted_opposite,
			'ratio'             => $ratio,
			'is_net'            => $is_net,
			'without_part_rows' => false,
		);
	}

	/**
	 * Checks whether the largest part of a channel moving with it takes the
	 * channel's card.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $split         The split of the channel's parts, as `split_children()` returns it.
	 * @param array $children      The channel's parts.
	 * @param int   $delta         The channel's change.
	 * @param array $elevated_keys The keys of the parts that took a card, keyed by key.
	 * @return bool True when it does.
	 */
	private function can_elevate( array $split, array $children, $delta, array $elevated_keys ) {
		$child = $split['top_same'];

		if ( null === $child || $split['is_net'] || ! empty( $child['is_assistant'] ) || $split['ratio'] < self::ELEVATION_SHARE || isset( $elevated_keys[ $child['key'] ] ) ) {
			return false;
		}

		foreach ( $children as $sibling ) {
			if ( $sibling['key'] !== $child['key'] && $sibling['slicing'] === $child['slicing'] && $sibling['delta'] * $delta > 0 && abs( $sibling['delta'] ) >= self::SIBLING_SHARE * abs( $delta ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Gets the rows of a channel's card, at most `MAX_ROWS`.
	 *
	 * The candidates, in priority order:
	 * - The channel's parts. A net channel lists its two sides, each with its
	 *   own change and no share. Any other channel but `Direct` lists the
	 *   search keyword behind its change in search clicks, for
	 *   `Organic Search`, and up to two parts from one breakdown that each
	 *   carried `SIBLING_SHARE` of its change.
	 * - Its slots: the homepage, the landing page and the visitor type for
	 *   `Direct`, and the landing page for any other channel.
	 * - Its fillers: the device for `Direct`, and the device and the visitor
	 *   type for any other channel.
	 * A slot or a filler is left out when a row of its kind is listed already.
	 * A device or a visitor type whose channel is the net of two of them that
	 * moved both ways lists both, as `get_slot_rows()` explains. The candidates
	 * are then kept by `keep_consistent_rows()`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel       The channel.
	 * @param array $children      The channel's parts.
	 * @param array $split         The split of the channel's parts, as `split_children()` returns it, with `without_part_rows` true to list no part.
	 * @param array $elevated_keys The keys of the parts that took a card, keyed by key, which no row lists.
	 * @return array List of rows, each with `wire` and `attribute`.
	 */
	private function get_channel_rows( array $channel, array $children, array $split, array $elevated_keys ) {
		$delta      = $channel['delta'];
		$candidates = array();

		if ( $split['without_part_rows'] ) {
			// A steady card lists only its slots and fillers.
			$candidates = array();
		} elseif ( $split['is_net'] ) {
			if ( abs( $split['top_same']['delta'] ) >= $this->minimum_delta ) {
				$candidates[] = $this->build_child_row( $split['top_same'], $delta );
			}

			if ( $split['counted_opposite'] ) {
				$candidates[] = $this->build_child_row( $split['top_opposite'], $delta );
			}
		} elseif ( self::DIRECT_CHANNEL !== $channel['key'] ) {
			$keyword_row = $this->get_keyword_row( $children, $delta );

			if ( null !== $keyword_row ) {
				$candidates[] = $keyword_row;
			}

			foreach ( $this->get_part_children( $children, $delta, $elevated_keys ) as $child ) {
				$candidates[] = $this->build_child_row( $child, $delta );
			}
		}

		$listed_kinds = array_map( fn( $row ) => $row['wire']['kind'], $candidates );
		$slot_kinds   = self::DIRECT_CHANNEL === $channel['key']
			? array( 'HOMEPAGE', 'TARGET_PAGE', 'VISITOR_TYPE', 'READER_DEVICE' )
			: array( 'TARGET_PAGE', 'READER_DEVICE', 'VISITOR_TYPE' );

		if ( 0 !== $delta ) {
			$reduction = $this->get_reduction( $channel );

			foreach ( $slot_kinds as $kind ) {
				if ( in_array( $kind, $listed_kinds, true ) ) {
					continue;
				}

				$rows = $this->get_slot_rows( $kind, $reduction, $delta );

				if ( ! empty( $rows ) ) {
					array_push( $candidates, ...$rows );
					$listed_kinds[] = $kind;
				}
			}
		}

		return $this->keep_consistent_rows( $candidates, $delta );
	}

	/**
	 * Gets the search keyword row of `Organic Search`'s card: the keyword whose
	 * clicks moved most the way the site's search clicks moved, when the
	 * site's search clicks moved with the channel.
	 *
	 * Its clicks are the nearest measure of the visits it brought, so it is
	 * named only when it carried from `KEYWORD_SHARE` of the site's change in
	 * search clicks to `NET_SLACK` times that change, by `minimum_delta`, and
	 * by `ROW_SHARE` of the channel's change in visits. A smaller keyword is
	 * never named in its place.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $children The channel's parts, most moved first.
	 * @param int   $delta    The channel's change.
	 * @return array|null The row, or null.
	 */
	private function get_keyword_row( array $children, $delta ) {
		if ( 0 === $this->search_clicks_delta || $this->search_clicks_delta * $delta <= 0 ) {
			return null;
		}

		foreach ( $children as $child ) {
			if ( 'SEARCH_KEYWORD' !== $child['kind'] || $child['delta'] * $this->search_clicks_delta <= 0 ) {
				continue;
			}

			$clicks = abs( $child['delta'] );

			if ( $clicks < self::KEYWORD_SHARE * abs( $this->search_clicks_delta ) || $clicks > self::NET_SLACK * abs( $this->search_clicks_delta ) || ! $this->is_above_row_floors( $child['delta'], $delta ) ) {
				return null;
			}

			// The keyword's change in clicks against all of the site's search
			// clicks, not the site's net change in them.
			$share_percent = $this->search_clicks_total > 0 ? min( 100.0, self::round1( $clicks / $this->search_clicks_total * 100 ) ) : 0.0;
			$wire          = array(
				'kind'         => 'SOURCE_TYPE',
				'role'         => 'CONTEXT',
				'label'        => 'Search keyword',
				'value'        => array( 'text' => $child['title'] ),
				'entity_delta' => $child['delta'],
			);

			if ( $share_percent > 0 ) {
				$wire['share_of_search_clicks_pct'] = $share_percent;
			}

			return array(
				'cut'       => null,
				'delta'     => $child['delta'],
				'share'     => $share_percent,
				'wire'      => $wire,
				'attribute' => self::get_attribute( 'SEARCH_KEYWORD', $child['title'], $child['current'], $child['previous'], $share_percent ),
			);
		}

		return null;
	}

	/**
	 * Gets the parts listed as rows of a channel that is not a net: up to
	 * `MAX_ROWS` parts other than landing pages that moved with it, each by
	 * `SIBLING_SHARE` of its change and by `minimum_delta`, all from the
	 * breakdown of the largest of them.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $children      The channel's parts, most moved first.
	 * @param int   $delta         The channel's change.
	 * @param array $elevated_keys The keys of the parts that took a card, keyed by key.
	 * @return array List of parts, most moved first.
	 */
	private function get_part_children( array $children, $delta, array $elevated_keys ) {
		$parts   = array();
		$slicing = null;

		foreach ( $children as $child ) {
			if ( null === $child['slicing'] || 'page' === $child['slicing'] || isset( $elevated_keys[ $child['key'] ] ) ) {
				continue;
			}

			if ( $child['delta'] * $delta <= 0 || abs( $child['delta'] ) < self::SIBLING_SHARE * abs( $delta ) || abs( $child['delta'] ) < $this->minimum_delta ) {
				continue;
			}

			$slicing = $slicing ?? $child['slicing'];

			if ( $slicing === $child['slicing'] && count( $parts ) < self::MAX_ROWS ) {
				$parts[] = $child;
			}
		}

		return $parts;
	}

	/**
	 * Builds the row of a part of a channel. A landing page's row names it by
	 * its address, rather than by its title.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $child      The part.
	 * @param int   $card_delta The card's change.
	 * @return array The row.
	 */
	private function build_child_row( array $child, $card_delta ) {
		return $this->build_row( $child['row_kind'], $child['row_label'], $child['text'], $child['attribute_kind'], $child, $card_delta );
	}

	/**
	 * Gets the rows of a slot or a filler of a channel's card.
	 *
	 * A page row needs a change moving with the channel, by `minimum_delta`
	 * and by `ROW_SHARE` of the channel's change. The homepage of `Direct`
	 * needs `HOMEPAGE_SHARE` of its change, and a share of it
	 * `HOMEPAGE_MARGIN_PERCENT` points above its share of `Direct`'s visits.
	 *
	 * A device or a visitor type gives the rows `get_breakdown_split()` finds:
	 * the one that carried the channel's change, or the two sides of a net,
	 * each with its own change and no share. One that moved a little further
	 * than its channel, within `NET_SLACK`, carried all of its change.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $kind      The row kind, such as `TARGET_PAGE`.
	 * @param array  $reduction The channel's reduction, as `get_reduction()` returns it.
	 * @param int    $delta     The channel's change.
	 * @return array List of rows: none, one, or the two sides of a net.
	 */
	private function get_slot_rows( $kind, array $reduction, $delta ) {
		switch ( $kind ) {
			case 'HOMEPAGE':
				$homepage = $reduction['homepage'];

				if ( null === $homepage || $homepage['delta'] * $delta <= 0 || abs( $homepage['delta'] ) < $this->minimum_delta ) {
					return array();
				}

				$share = abs( $homepage['delta'] ) / abs( $delta );

				if ( $share < self::HOMEPAGE_SHARE || $share * 100 < $homepage['share_pct'] + self::HOMEPAGE_MARGIN_PERCENT ) {
					return array();
				}

				return array( $this->build_row( 'HOMEPAGE', 'Homepage', null, 'LANDING_PAGE', $homepage, $delta ) );
			case 'TARGET_PAGE':
				$page = $reduction['page'];

				if ( null === $page || $page['delta'] * $delta <= 0 || ! $this->is_above_row_floors( $page['delta'], $delta ) ) {
					return array();
				}

				return array( $this->build_row( 'TARGET_PAGE', 'Target page', $page['title'], 'LANDING_PAGE', $page, $delta ) );
			default:
				$split = 'VISITOR_TYPE' === $kind ? $reduction['visitor_type'] : $reduction['device'];

				if ( null === $split ) {
					return array();
				}

				list( $label, $attribute_kind ) = 'VISITOR_TYPE' === $kind
					? array( 'Visitor type', 'USER_TYPE' )
					: array( 'Reader device', 'DEVICE' );

				return array_map(
					// The two sides of a net keep their own changes. A single
					// row carried all of the change at most.
					fn( $value ) => $this->build_row( $kind, $label, $value['title'], $attribute_kind, $value, $delta, ! $split['is_net'] ),
					$split['values']
				);
		}
	}

	/**
	 * Builds a row measured in visits.
	 *
	 * A row moving with its card, and no larger than it, has its share of the
	 * card's change, and is a part of it from
	 * `DECOMPOSITION_ROW_SHARE_PERCENT`. Any other row is context with its own
	 * change and no share: the side of a net that moved against the card, or
	 * a row that moved further than the card because the card's other parts
	 * moved the other way, which never reads as more than all of its change.
	 *
	 * A capped row that moved further than the card, which only a device or a
	 * visitor type within `NET_SLACK` is, carried all of its change instead:
	 * what the card's other values moved the other way is too small to count.
	 *
	 * The panel's attribute marks a row that moved further than the card, the
	 * same way, and isn't capped as `oversized`, so the panel can say it is
	 * more than the card's net change rather than show a bare larger number.
	 *
	 * @since n.e.x.t
	 *
	 * @param string      $kind           The row kind, such as `TARGET_PAGE`.
	 * @param string      $label          The row label, such as `Target page`.
	 * @param string|null $text           The row's name, or null for the homepage, which names no page.
	 * @param string      $attribute_kind The kind of the card's attribute, such as `LANDING_PAGE`.
	 * @param array       $value          The value, with `current`, `previous` and `delta`.
	 * @param int         $card_delta     The card's change.
	 * @param bool        $capped         Optional. Whether the row's share is all of the card's change when it moved further than the card. Default false.
	 * @return array The row, with `cut`, `delta`, `share`, `wire` and `attribute`.
	 */
	private function build_row( $kind, $label, $text, $attribute_kind, array $value, $card_delta, $capped = false ) {
		$delta         = $value['delta'];
		$measured      = $capped ? min( abs( $delta ), abs( $card_delta ) ) : abs( $delta );
		$oversized     = $delta * $card_delta > 0 && $measured > abs( $card_delta );
		$share_percent = 0.0;
		$wire          = array(
			'kind'  => $kind,
			'role'  => 'CONTEXT',
			'label' => $label,
		);

		if ( null !== $text ) {
			$wire['value'] = array( 'text' => $text );
		}

		if ( $delta * $card_delta > 0 && ! $oversized ) {
			$share_percent = self::round1( $measured / abs( $card_delta ) * 100 );

			if ( $share_percent >= self::DECOMPOSITION_ROW_SHARE_PERCENT ) {
				$wire['role'] = 'DECOMPOSITION';
			}

			if ( $share_percent > 0 ) {
				$wire['share_of_parent_change_pct'] = $share_percent;
			}
		}

		$wire['entity_delta'] = $delta;

		return array(
			'cut'       => self::ROW_CUTS[ $kind ],
			'delta'     => $delta,
			'share'     => $share_percent,
			'wire'      => $wire,
			// The homepage row names no page, so the panel names the site's
			// own homepage.
			'attribute' => self::get_attribute( $attribute_kind, null === $text ? $this->home_path : $text, $value['current'], $value['previous'], $share_percent, $oversized ),
		);
	}

	/**
	 * Keeps the rows of a card that agree with each other, and the first
	 * `MAX_ROWS` of them.
	 *
	 * The candidates are walked in order. A search keyword row counts clicks,
	 * no part of the card's visits, so it is always kept. When the first two
	 * rows in visits are the two sides of a net, they are kept together, as
	 * the card's only rows in visits. Otherwise every row in visits comes from
	 * the same cut of the card's visits as the first, since rows of two cuts
	 * overlap, and a row is kept only while the rows kept add up to no more
	 * than the card's change. So a card's shares never add up past 100%.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $candidates The candidate rows, in priority order.
	 * @param int   $card_delta The card's change.
	 * @return array List of rows, at most `MAX_ROWS`.
	 */
	private function keep_consistent_rows( array $candidates, $card_delta ) {
		$visit_rows = array_filter( $candidates, fn( $row ) => null !== $row['cut'] );
		$indexes    = array_keys( $visit_rows );
		$kept       = array();

		if ( count( $indexes ) >= 2 && $this->is_net_pair( $visit_rows[ $indexes[0] ], $visit_rows[ $indexes[1] ] ) ) {
			$kept = array( $indexes[0], $indexes[1] );
		} else {
			$total = 0;

			foreach ( $visit_rows as $index => $row ) {
				if ( ! empty( $kept ) && ( $row['cut'] !== $visit_rows[ $kept[0] ]['cut'] || $total + abs( $row['delta'] ) > abs( $card_delta ) ) ) {
					continue;
				}

				$kept[] = $index;
				$total += abs( $row['delta'] );
			}
		}

		$rows = array();

		foreach ( $candidates as $index => $row ) {
			if ( null === $row['cut'] || in_array( $index, $kept, true ) ) {
				$rows[] = $row;
			}
		}

		return array_slice( $rows, 0, self::MAX_ROWS );
	}

	/**
	 * Checks whether two rows are the two sides of a net: neither has a share,
	 * and they moved in opposite directions.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $first  The first row.
	 * @param array $second The second row.
	 * @return bool True when they are.
	 */
	private function is_net_pair( array $first, array $second ) {
		return 0.0 === $first['share'] && 0.0 === $second['share'] && $first['delta'] * $second['delta'] < 0;
	}

	/**
	 * Gets the values of a channel's slots and fillers: the landing page, the
	 * device and the visitor type that carried its change, and for `Direct`,
	 * its homepage.
	 *
	 * The page is the one that moved most with the channel, whose change is
	 * from `ROW_SHARE` to `NET_SLACK` times the channel's. Only the largest is
	 * tried: a smaller page never takes its place. The device and the visitor
	 * type are found by `get_breakdown_split()`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The channel.
	 * @return array The values, keyed by `page` and `homepage`, each with `title`, `current`, `previous` and `delta`, or null, and by `device` and `visitor_type`, each a split as `get_breakdown_split()` returns it, or null. The homepage also has `share_pct`, its share of `Direct`'s visits.
	 */
	private function get_reduction( array $channel ) {
		if ( isset( $this->reductions[ $channel['key'] ] ) ) {
			return $this->reductions[ $channel['key'] ];
		}

		$pages          = array();
		$homepage_pages = array();

		foreach ( $this->get_channel_rows_of( 'channelPages', $channel ) as $row ) {
			$path = Page_Classifier::get_path( $row['page'] );

			if ( Page_Classifier::is_root( $row['page'] ) || Page_Classifier::HOMEPAGE === $this->page_classifier->classify( $path ) ) {
				$homepage_pages[] = $row;
			}

			if ( '' !== $path && $this->page_classifier->is_displayable( $path ) ) {
				self::add_child(
					$pages,
					array(
						'key'   => Page_Classifier::get_page_key( $path ),
						'title' => $path,
					),
					$row
				);
			}
		}

		$breakdowns    = $this->get_channel_rows_of( 'channelBreakdowns', $channel );
		$devices       = array();
		$visitor_types = array();

		foreach ( $breakdowns as $row ) {
			if ( ! Insight_Request_Builder::is_placeholder( $row['device'] ) ) {
				self::add_child( $devices, self::get_value_key( $row['device'] ), $row );
			}

			// Analytics reports a visitor who returned after a while as
			// `established`, which the service reads as `returning`.
			$visitor_type = 'established' === self::get_key( $row['userType'] ) ? 'returning' : $row['userType'];

			if ( ! Insight_Request_Builder::is_placeholder( $visitor_type ) ) {
				self::add_child( $visitor_types, self::get_value_key( $visitor_type ), $row );
			}
		}

		$this->reductions[ $channel['key'] ] = array(
			'page'         => $this->get_reduced_value( $pages, $channel['delta'] ),
			'homepage'     => self::DIRECT_CHANNEL === $channel['key'] ? $this->get_homepage_value( $homepage_pages, $channel ) : null,
			'device'       => $this->get_breakdown_split( $devices, $channel['delta'] ),
			'visitor_type' => $this->get_breakdown_split( $visitor_types, $channel['delta'] ),
		);

		return $this->reductions[ $channel['key'] ];
	}

	/**
	 * Gets the post published in the period at a landing page's address,
	 * among the posts the insight request lists as recent content: the
	 * `Insight_Request_Builder::MAX_RECENT_CONTENT` with the most visits in the
	 * period, other than the homepage.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $path The landing page's path.
	 * @return array|null The post, as a `content` row with `url`, `title` and `current`, its visits in the period, or null.
	 */
	private function get_recent_post( $path ) {
		$posts = array_filter(
			$this->get_rows( 'content' ),
			fn( $row ) => (int) $row['current'] > 0
				&& (int) $row['publishedDaysAgo'] < $this->days_in_period
				&& ! Insight_Request_Builder::is_home_page( $row['url'] )
		);

		usort(
			$posts,
			fn( $first, $second ) => ( (int) $second['current'] <=> (int) $first['current'] ) ?: strcmp( $first['url'], $second['url'] )
		);

		$page_key = Page_Classifier::get_page_key( $path );

		foreach ( array_slice( $posts, 0, Insight_Request_Builder::MAX_RECENT_CONTENT ) as $post ) {
			if ( Page_Classifier::get_page_key( $post['url'] ) === $page_key && $this->page_classifier->is_displayable( $post['url'] ) ) {
				return $post;
			}
		}

		return null;
	}

	/**
	 * Gets the value that moved most with a channel, when its change is from
	 * `ROW_SHARE` to `NET_SLACK` times the channel's.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $values The values, each with `key`, `title`, `current`, `previous` and `delta`.
	 * @param int   $delta  The channel's change.
	 * @return array|null The value, or null.
	 */
	private function get_reduced_value( array $values, $delta ) {
		$largest = self::get_largest_moving( $values, $delta );

		if ( null === $largest ) {
			return null;
		}

		$share = abs( $largest['delta'] ) / abs( $delta );

		return $share >= self::ROW_SHARE && $share <= self::NET_SLACK ? $largest : null;
	}

	/**
	 * Gets the rows a channel's devices or visitor types give its card.
	 *
	 * They follow the rules of a channel's parts (§5.10 step 8b), where the
	 * service drops any device or visitor type that moved further than its
	 * channel, which leaves a card without the rows that explain it:
	 * - The channel is the net of two values that moved both ways when the
	 *   value that moved most with it moved further than it, and either the
	 *   value that moved most against it clears the row floors, or the first
	 *   moved more than `NET_SLACK` times the channel. Both sides are rows,
	 *   the first when it clears `minimum_delta` and the second when it
	 *   counts, each with its own change. `Direct` +1,280 lists desktop +1,643
	 *   and mobile −362.
	 * - Otherwise, the value that moved most with the channel is the row when
	 *   it clears the row floors. One that moved a little further than the
	 *   channel, within `NET_SLACK`, carried all of its change: what moved
	 *   the other way is too small to count. A row whose share of the change
	 *   is within `BREAKDOWN_MARGIN_PERCENT` points of its share of the
	 *   channel's visits only shows where the channel's visitors already were,
	 *   so it is left out. Only the largest is tried: a smaller value never
	 *   takes its place.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $values The channel's devices or visitor types, each with `key`, `title`, `current`, `previous` and `delta`.
	 * @param int   $delta  The channel's change.
	 * @return array|null The split, with `is_net`, whether the channel is a net, and `values`, the values that are rows, or null when none is.
	 */
	private function get_breakdown_split( array $values, $delta ) {
		$same = 0 !== $delta ? self::get_largest_moving( $values, $delta ) : null;

		if ( null === $same ) {
			return null;
		}

		$opposite = self::get_largest_moving( $values, -$delta );
		$ratio    = abs( $same['delta'] ) / abs( $delta );
		$counted  = null !== $opposite && $this->is_above_row_floors( $opposite['delta'], $delta );

		if ( $ratio > 1 && ( $counted || $ratio > self::NET_SLACK ) ) {
			$sides = array();

			if ( abs( $same['delta'] ) >= $this->minimum_delta ) {
				$sides[] = $same;
			}

			if ( $counted ) {
				$sides[] = $opposite;
			}

			return empty( $sides ) ? null : array(
				'is_net' => true,
				'values' => $sides,
			);
		}

		if ( ! $this->is_above_row_floors( $same['delta'], $delta ) ) {
			return null;
		}

		$visits       = array_sum( array_column( $values, 'current' ) );
		$change_share = min( 1, $ratio ) * 100;
		$visits_share = $visits > 0 ? $same['current'] / $visits * 100 : 0;

		if ( abs( $change_share - $visits_share ) <= self::BREAKDOWN_MARGIN_PERCENT ) {
			return null;
		}

		return array(
			'is_net' => false,
			'values' => array( $same ),
		);
	}

	/**
	 * Gets the value that moved most in a direction, the first by title on a
	 * tie.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $values    The values, each with `title` and `delta`.
	 * @param int   $direction A change in the direction, whose sign alone counts.
	 * @return array|null The value, or null when none moved that way.
	 */
	private static function get_largest_moving( array $values, $direction ) {
		$largest = null;

		foreach ( $values as $value ) {
			if ( $value['delta'] * $direction <= 0 ) {
				continue;
			}

			if ( null === $largest || abs( $value['delta'] ) > abs( $largest['delta'] ) || ( abs( $value['delta'] ) === abs( $largest['delta'] ) && strcmp( $value['title'], $largest['title'] ) < 0 ) ) {
				$largest = $value;
			}
		}

		return $largest;
	}

	/**
	 * Gets the homepage of `Direct`: the change of its landing pages that are
	 * the homepage, and their share of its visits.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $homepage_rows The rows of `Direct`'s landing pages that are the homepage.
	 * @param array $channel       `Direct`.
	 * @return array|null The homepage, with `current`, `previous`, `delta` and `share_pct`, or null when `Direct` has no homepage row.
	 */
	private function get_homepage_value( array $homepage_rows, array $channel ) {
		if ( empty( $homepage_rows ) ) {
			return null;
		}

		$current  = array_sum( array_map( fn( $row ) => (int) $row['current'], $homepage_rows ) );
		$previous = array_sum( array_map( fn( $row ) => (int) $row['previous'], $homepage_rows ) );
		$listed   = array_sum( array_map( fn( $row ) => (int) $row['current'], $this->get_channel_rows_of( 'channelPages', $channel ) ) );
		$visits   = max( $channel['current'], $listed );

		return array(
			'current'   => $current,
			'previous'  => $previous,
			'delta'     => $current - $previous,
			'share_pct' => $current !== $previous && $visits > 0 ? self::round1( $current / $visits * 100 ) : 0.0,
		);
	}

	/**
	 * Builds a card that moved.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $kind     The card kind, such as `CHANNEL`.
	 * @param string $title    The card's title.
	 * @param int    $current  The visits of the selected period.
	 * @param int    $previous The visits of the previous period.
	 * @param string $role     The card's role, `PRIMARY` or `OFFSET`.
	 * @param array  $share    The card's share, with `share_basis` and `traffic_impact_pct`, and `parent_channel` and `parent_channel_delta` on `PARENT_CHANNEL`.
	 * @param array  $rows     The card's rows, each with `wire` and `attribute`.
	 * @param string $url      Optional. The path of a post's card, which the panel links its title to. Default null.
	 * @return array The card, with `key_factor` and `wire`. The `key_factor` has the share's basis as `shareBasis`, and on `PARENT_CHANNEL` the channel's title and change as `parentChannel` and `parentChannelChange`. A post's `key_factor` also has its path as `url`.
	 */
	private function build_card( $kind, $title, $current, $previous, $role, array $share, array $rows, $url = null ) {
		list( $dimension, $entity_kind ) = self::CARD_KINDS[ $kind ];

		$delta  = $current - $previous;
		$excess = $this->get_excess( $delta, $previous );
		$gross  = $this->gain + $this->loss;
		$wire   = array(
			'dimension'   => $dimension,
			'entity_kind' => $entity_kind,
			'title'       => $title,
			'volume'      => $current,
			'delta'       => $delta,
		);

		// The service reads a missing `excess`, `outsized` or `is_large_share`
		// as `0` or false.
		if ( 0.0 !== self::round1( $excess ) ) {
			$wire['excess'] = self::round1( $excess );
		}

		if ( $this->is_outsized( $delta, $excess ) ) {
			$wire['outsized'] = true;
		}

		if ( $gross > 0 && abs( $delta ) >= self::LARGE_SHARE * $gross ) {
			$wire['is_large_share'] = true;
		}

		$wire['direction']          = self::get_direction( $delta );
		$wire['traffic_impact_pct'] = $share['traffic_impact_pct'];
		$wire['metric_type']        = 'DELTA';
		$wire['share_basis']        = $share['share_basis'];

		if ( isset( $share['parent_channel'] ) ) {
			$wire['parent_channel']       = $share['parent_channel'];
			$wire['parent_channel_delta'] = $share['parent_channel_delta'];
		}

		$wire['role']       = $role;
		$wire['attributes'] = array_column( $rows, 'wire' );

		$key_factor = array(
			'kind'       => $kind,
			'label'      => $title,
			'current'    => $current,
			'previous'   => $previous,
			'sharePct'   => $share['traffic_impact_pct'],
			'shareBasis' => $share['share_basis'],
		);

		// A card that took its channel's place names the channel its share is
		// of, so the panel can say where the card's change came from.
		if ( isset( $share['parent_channel'] ) ) {
			$key_factor['parentChannel']       = $share['parent_channel'];
			$key_factor['parentChannelChange'] = $share['parent_channel_delta'];
		}

		$key_factor['attributes'] = array_column( $rows, 'attribute' );

		if ( null !== $url ) {
			$key_factor['url'] = $url;
		}

		return array(
			'wire'       => $wire,
			'key_factor' => $key_factor,
		);
	}

	/**
	 * Gets the share of a card that moved.
	 *
	 * An offsetting card's share is how much of the site's net change it
	 * offset, `0` on a flat period, and `0` when it would reach
	 * `NET_CHANGE_SHARE_LIMIT_PERCENT`, so it never reads as all of the change.
	 * A primary card's share is of the movement in its own direction, or of
	 * the site's traffic when that movement can't hold it. The movement in the
	 * site's own direction doesn't count when it is under
	 * `MINIMUM_POOL_SHARE` of the site's net change, which happens when the
	 * channels count fewer visits than the site.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $delta            The card's change.
	 * @param string $role             The card's role.
	 * @param string $period_direction The period's direction.
	 * @return array The share, with `share_basis`, `NET_CHANGE`, `GROSS_CHANGE` or `SITE_TRAFFIC`, and `traffic_impact_pct`.
	 */
	private function get_card_share( $delta, $role, $period_direction ) {
		$total_delta = $this->closing - $this->opening;

		if ( 'OFFSET' === $role ) {
			$share_percent = 'STABLE' === $period_direction || 0 === $total_delta ? 0.0 : self::round1( abs( $delta ) / abs( $total_delta ) * 100 );

			return array(
				'share_basis'        => 'NET_CHANGE',
				'traffic_impact_pct' => $share_percent < self::NET_CHANGE_SHARE_LIMIT_PERCENT ? $share_percent : 0.0,
			);
		}

		$gain = $this->gain;
		$loss = $this->loss;

		if ( $total_delta > 0 && $gain < self::MINIMUM_POOL_SHARE * $total_delta ) {
			$gain = 0;
		} elseif ( $total_delta < 0 && $loss < self::MINIMUM_POOL_SHARE * abs( $total_delta ) ) {
			$loss = 0;
		}

		$pool = 0;

		if ( $delta > 0 ) {
			$pool = $gain;
		} elseif ( $delta < 0 ) {
			$pool = $loss;
		}

		if ( $pool > 0 && self::round1( abs( $delta ) / $pool * 100 ) <= 100 ) {
			return array(
				'share_basis'        => 'GROSS_CHANGE',
				'traffic_impact_pct' => self::round1( abs( $delta ) / $pool * 100 ),
			);
		}

		return array(
			'share_basis'        => 'SITE_TRAFFIC',
			'traffic_impact_pct' => self::round1( $delta / $this->denominator * 100 ),
		);
	}

	/**
	 * Checks whether an offsetting card shows a larger change than the first
	 * primary card, so the side the period leaned towards reads as the smaller
	 * story.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $cards The cards, in the order their nodes were picked in.
	 * @return bool True when one does.
	 */
	private function has_larger_offset( array $cards ) {
		$first_primary  = 0;
		$largest_offset = null;

		foreach ( $cards as $card ) {
			$change = abs( $card['wire']['delta'] );

			if ( 'PRIMARY' === $card['wire']['role'] ) {
				$first_primary = $first_primary ?: $change;
			} else {
				$largest_offset = max( (int) $largest_offset, $change );
			}
		}

		return null !== $largest_offset && $largest_offset > $first_primary;
	}

	/**
	 * Sorts the cards for display: the primary cards first, then by the change
	 * each card shows, largest first.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $cards The cards, in the order their nodes were picked in.
	 * @return array The sorted cards.
	 */
	private function sort_cards( array $cards ) {
		$positions = array_keys( $cards );

		// `usort()` isn't stable on PHP 7.4, so the position orders cards that
		// tie, to keep the order they were picked in.
		$indexed = array_map( null, $positions, $cards );

		usort(
			$indexed,
			fn( $first, $second ) => ( ( 'OFFSET' === $first[1]['wire']['role'] ) <=> ( 'OFFSET' === $second[1]['wire']['role'] ) )
				?: ( abs( $second[1]['wire']['delta'] ) <=> abs( $first[1]['wire']['delta'] ) )
				?: ( $first[0] <=> $second[0] )
		);

		return array_column( $indexed, 1 );
	}

	/**
	 * Checks whether a value's change clears the floors of a row: it moved by
	 * `minimum_delta` and by `ROW_SHARE` of its card's change.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $delta      The value's change.
	 * @param int $card_delta The card's change.
	 * @return bool True when it does.
	 */
	private function is_above_row_floors( $delta, $card_delta ) {
		return abs( $delta ) >= $this->minimum_delta && abs( $delta ) >= self::ROW_SHARE * abs( $card_delta );
	}

	/**
	 * Gets a change beyond the one the site's own rate gives.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $delta    The change.
	 * @param int $previous The visits of the previous period.
	 * @return float The excess change.
	 */
	private function get_excess( $delta, $previous ) {
		return $delta - $previous * $this->site_rate;
	}

	/**
	 * Checks whether a card's change is far beyond the site's own rate.
	 *
	 * @since n.e.x.t
	 *
	 * @param int   $delta  The card's change.
	 * @param float $excess The card's excess change.
	 * @return bool True when the card moved the same way as its excess, by at least `OUTSIZED_EXCESS_PERCENT` of the larger period total and `OUTSIZED_EXCESS_SHARE` of its own change.
	 */
	private function is_outsized( $delta, $excess ) {
		return 0 !== $delta
			&& $delta * $excess > 0
			&& abs( $excess ) / $this->denominator * 100 >= self::OUTSIZED_EXCESS_PERCENT
			&& abs( $excess ) >= self::OUTSIZED_EXCESS_SHARE * abs( $delta );
	}

	/**
	 * Gets the rows of a contextual data key.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $contextual_data_key The key, such as `channelPages`.
	 * @return array List of rows.
	 */
	private function get_rows( $contextual_data_key ) {
		return isset( $this->contextual_data[ $contextual_data_key ] ) && is_array( $this->contextual_data[ $contextual_data_key ] )
			? array_values( $this->contextual_data[ $contextual_data_key ] )
			: array();
	}

	/**
	 * Gets the rows of a breakdown of one channel, matching the channel by
	 * name in any case.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $contextual_data_key The key of the breakdown, such as `channelPages`.
	 * @param array  $channel             The channel.
	 * @return array List of rows.
	 */
	private function get_channel_rows_of( $contextual_data_key, array $channel ) {
		return array_values(
			array_filter(
				$this->get_rows( $contextual_data_key ),
				fn( $row ) => self::get_key( $row['channel'] ) === $channel['key']
			)
		);
	}

	/**
	 * Gets the key and the title of a device or a visitor type.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $value The device or the visitor type.
	 * @return array The value, with `key` and `title`.
	 */
	private static function get_value_key( $value ) {
		return array(
			'key'   => self::get_key( $value ),
			'title' => trim( (string) $value ),
		);
	}

	/**
	 * Gets an attribute of a card the panel shows.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $kind      The attribute kind, such as `LANDING_PAGE`.
	 * @param string $label     The attribute's name.
	 * @param int    $current   The visits, or clicks, of the selected period.
	 * @param int    $previous  The visits, or clicks, of the previous period.
	 * @param float  $share_pct The row's share, or `0`.
	 * @param bool   $oversized Optional. Whether the row moved further than its card the same way, so it has no share. Default false.
	 * @return array The attribute.
	 */
	private static function get_attribute( $kind, $label, $current, $previous, $share_pct, $oversized = false ) {
		return array(
			'kind'      => $kind,
			'label'     => $label,
			'current'   => (int) $current,
			'previous'  => (int) $previous,
			'sharePct'  => $share_pct,
			'oversized' => $oversized,
		);
	}

	/**
	 * Gets the key a channel, a source or a campaign is matched by: its name in
	 * lower case, trimmed.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The name.
	 * @return string The key.
	 */
	private static function get_key( $name ) {
		return strtolower( trim( (string) $name ) );
	}

	/**
	 * Checks whether a channel is a paid channel.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $key The channel's key.
	 * @return bool True when it is.
	 */
	private static function is_paid_channel( $key ) {
		return in_array( $key, self::PAID_CHANNELS, true );
	}

	/**
	 * Checks whether a change moves against the primary direction.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $delta             The change.
	 * @param string $primary_direction The direction of a primary card.
	 * @return bool True when it moves against it.
	 */
	private static function is_counter_move( $delta, $primary_direction ) {
		return 'UP' === $primary_direction ? $delta < 0 : $delta > 0;
	}

	/**
	 * Gets the direction of a change.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $delta The change.
	 * @return string `UP`, `DOWN`, or `STABLE` for no change.
	 */
	private static function get_direction( $delta ) {
		if ( 0 === $delta ) {
			return 'STABLE';
		}

		return $delta > 0 ? 'UP' : 'DOWN';
	}

	/**
	 * Rounds a number to one decimal place, half away from zero, without a
	 * negative zero, as the service rounds.
	 *
	 * @since n.e.x.t
	 *
	 * @param float $value The number.
	 * @return float The rounded number.
	 */
	private static function round1( $value ) {
		$rounded = round( $value, 1 );

		// `-0.0` equals `0.0`, so this returns a positive zero for both.
		return 0.0 === $rounded ? 0.0 : $rounded;
	}
}
