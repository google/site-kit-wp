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
 * two cards, unless its card would be the period's only one and have no
 * rows: the channel then keeps its card and lists the part. Search keywords,
 * devices and visitor types are never cards, only rows of a channel's card.
 *
 * A period that rose or dropped shows what caused the shift, with at most one
 * card moving against it. A page that brought much of the shift through
 * several channels takes the first card, and the channels it came through
 * keep cards for their other pages. A flat period whose channels moved against
 * each other shows both sides, each with its own change, since a flat site
 * has no change for a share to be of. A flat period on which nothing moved
 * materially is steady, and shows the channels with the most visits instead.
 *
 * Channels are named as the service names them, `Cross-network ads` for
 * Analytics' `Cross-network` and `Uncategorized traffic` for `Unassigned`,
 * and rows are matched to a channel by its name in Analytics. Devices and
 * visitor types follow the service's rules: the one that moved most with its
 * channel is a row when it is no larger than the channel's change.
 *
 * The plugin's reports differ from the service's in a few ways:
 * - A channel's sources are its own, from the channel and source report, so a
 *   source's figure is its change in that channel, where the service reads
 *   the site's sources and routes each to a channel by its name.
 * - A page takes its channel's card only when it is a post published in the
 *   period, as in the service, so a site whose property has no post date
 *   dimension has no page cards.
 * - The plugin has no click ID parameters, since it reports landing pages
 *   without their query strings.
 * - A landing page's addresses that differ only in case or in a trailing
 *   slash are one page, where the service tells them apart.
 *
 * The plugin also keeps a few rules of its own:
 * - A channel named by a placeholder, such as `(not set)`, names nothing the
 *   reader would recognise, so it gets no card, and its change alone doesn't
 *   make a flat period offsetting. Its visits still count in the period's
 *   figures and in the movement shares are of.
 * - A channel's card without rows says when its change was spread across many
 *   pages.
 *
 * As in the service, a search keyword, source, campaign or page title that
 * `Content_Screen` hides is no part of a channel, so no card or row names it,
 * and the next part can take its place. A search keyword that is the site's
 * own name or domain is named like any other.
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
	 * taking its channel's card, and which a paid channel's campaign needs to
	 * be named on its row.
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
	 * The share of its card's change a row needs, and the share of its
	 * channel's change the channel's landing page, device or visitor type
	 * needs to be one of its rows at all.
	 *
	 * @since n.e.x.t
	 */
	const ROW_SHARE = 0.10;

	/**
	 * The share of its card's change from which a row is a part of the card
	 * rather than context.
	 *
	 * @since n.e.x.t
	 */
	const DECOMPOSITION_ROW_SHARE = 0.25;

	/**
	 * The share of its channel's change each of two parts from the same
	 * breakdown needs for both to be rows when together they carried more
	 * than the channel's change. Neither then has a share, so the card's
	 * shares never add up past 100%.
	 *
	 * @since n.e.x.t
	 */
	const SECOND_PART_SHARE = 0.30;

	/**
	 * The share of the site's search clicks a search keyword's change needs to
	 * be a row.
	 *
	 * @since n.e.x.t
	 */
	const KEYWORD_SEARCH_CLICKS_SHARE = 0.005;

	/**
	 * How many percentage points a device's share of its channel's change must
	 * differ from its share of the channel's visits to be a row. A 95% mobile
	 * site sees about 95% of any change on mobile.
	 *
	 * @since n.e.x.t
	 */
	const DEVICE_MARGIN_PERCENT = 10;

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
	 * The share of a landing page's change that a referring site or a campaign
	 * that took its channel's card must surely share with it, for the page to
	 * be a row of the card.
	 *
	 * @since n.e.x.t
	 */
	const PAGE_OVERLAP_SHARE = 0.5;

	/**
	 * The change, in visits over 28 days, a page that brought visits through
	 * several channels needs to take the first card. It scales with the length
	 * of the period, as `round( 20 × d / 28 )`, at least 1.
	 *
	 * @since n.e.x.t
	 */
	const CROSS_CHANNEL_PAGE_DELTA_PER_28_DAYS = 20;

	/**
	 * The share of the movement in the period's direction a page that brought
	 * visits through several channels needs to take the first card.
	 *
	 * @since n.e.x.t
	 */
	const CROSS_CHANNEL_PAGE_POOL_SHARE = 0.40;

	/**
	 * The share of a page's change each of at least two channels needs for the
	 * page to have brought visits through several channels, and to be one of
	 * the page's rows.
	 *
	 * @since n.e.x.t
	 */
	const CROSS_CHANNEL_PAGE_CHANNEL_SHARE = 0.10;

	/**
	 * The share of its channel's change, or of the page's change, a page's
	 * visits through a channel need to be taken out of the channel when the
	 * page takes the first card.
	 *
	 * @since n.e.x.t
	 */
	const CROSS_CHANNEL_SUBTRACTION_SHARE = 0.10;

	/**
	 * The most pages that brought visits through several channels are looked
	 * for among, those that moved most.
	 *
	 * @since n.e.x.t
	 */
	const MAX_CROSS_CHANNEL_PAGES = 10;

	/**
	 * The most characters a page's title keeps.
	 *
	 * @since n.e.x.t
	 */
	const MAX_TITLE_LENGTH = 100;

	/**
	 * What the service's title of a channel's card for its other pages ends
	 * with, after a page that brought visits through several channels took
	 * the first card.
	 *
	 * @since n.e.x.t
	 */
	const OTHER_PAGES_SUFFIX = ' (other pages)';

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
	 * The title the service gives a channel, keyed by the channel's name, or
	 * another name of it, in lower case. Any other channel keeps its name.
	 *
	 * @since n.e.x.t
	 */
	const CHANNEL_TITLES = array(
		'organic search'        => 'Organic Search',
		'search engine traffic' => 'Organic Search',
		'paid search'           => 'Paid Search',
		'organic social'        => 'Organic Social',
		'social media posts'    => 'Organic Social',
		'paid social'           => 'Paid Social',
		'cross-network'         => 'Cross-network ads',
		'cross-network ads'     => 'Cross-network ads',
		'multi-platform ads'    => 'Cross-network ads',
		'unassigned'            => 'Uncategorized traffic',
		'uncategorized traffic' => 'Uncategorized traffic',
		'paid other'            => 'Paid Other',
		'paid shopping'         => 'Paid Shopping',
		'organic shopping'      => 'Organic Shopping',
		'free product listings' => 'Organic Shopping',
		'organic video'         => 'Organic Video',
		'video search results'  => 'Organic Video',
		'paid video'            => 'Paid Video',
		'paid advertising'      => 'Paid Traffic',
		'paid campaigns'        => 'Paid Traffic',
		'paid traffic'          => 'Paid Traffic',
	);

	/**
	 * The name in Analytics, in lower case, of each channel known by another
	 * name, keyed by that name in lower case.
	 *
	 * @since n.e.x.t
	 */
	const CHANNEL_ALIASES = array(
		'search engine traffic' => 'organic search',
		'search ads'            => 'paid search',
		'social media posts'    => 'organic social',
		'social media ads'      => 'paid social',
		'cross-network ads'     => 'cross-network',
		'multi-platform ads'    => 'cross-network',
		'uncategorized traffic' => 'unassigned',
		'other paid ads'        => 'paid other',
		'paid product ads'      => 'paid shopping',
		'free product listings' => 'organic shopping',
		'video search results'  => 'organic video',
		'video ads'             => 'paid video',
		'paid advertising'      => 'paid traffic',
		'paid campaigns'        => 'paid traffic',
	);

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
	 * The cut of the card's visits of each row kind measured in visits. Rows
	 * of two cuts overlap by an unknown amount, so a card's rows come from one
	 * cut.
	 *
	 * @since n.e.x.t
	 */
	const ROW_CUTS = array(
		'HOMEPAGE'      => 'page',
		'TARGET_PAGE'   => 'page',
		'SOURCE_TYPE'   => 'part',
		'CHANNEL'       => 'part',
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
	 * The function that gets the title of the page at a path, or null without
	 * one.
	 *
	 * @since n.e.x.t
	 * @var callable|null
	 */
	private $page_title_lookup;

	/**
	 * The screened titles of the pages looked up, keyed by path, each a title
	 * or null.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $page_titles = array();

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
	 * The reduction of each channel, keyed by the channel's name, once built.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $reductions = array();

	/**
	 * The posts the insight request lists as recent content, once found.
	 *
	 * @since n.e.x.t
	 * @var array|null
	 */
	private $recent_posts;

	/**
	 * The screened titles of the recent posts, keyed by page key, once found.
	 *
	 * @since n.e.x.t
	 * @var array|null
	 */
	private $recent_post_titles;

	/**
	 * The pages that moved most across every channel, once found.
	 *
	 * @since n.e.x.t
	 * @var array|null
	 */
	private $cross_channel_pages;

	/**
	 * Page_Classifier instance, which tells which landing pages a card may
	 * name.
	 *
	 * @since n.e.x.t
	 * @var Page_Classifier
	 */
	private $page_classifier;

	/**
	 * The channels as the reports count them, most visits first, then by
	 * title. Each has `title`, the service's title of it, `key`, the key it
	 * is matched by under any of its names, `name`, its name in Analytics in
	 * lower case, `current`, `previous`, `delta`, `reported_delta`, the same
	 * change, `excess`, and `other_pages`, null.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $channels = array();

	/**
	 * The nodes a card can be built for: the channels, with the paid channels
	 * as one group when at least two of them moved materially, and without
	 * the channels named by a placeholder.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $nodes = array();

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
	 * The movement the site gained: the sum of the rises of the channels, with
	 * the paid group counted once, as its net change.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $gain = 0;

	/**
	 * The movement the site lost, as a positive number: the sum of the falls of
	 * the channels, with the paid group counted once, as its net change.
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
	 * @param array         $contextual_data   The rows, keyed by contextual data key, as `Contextual_Data_Validator::validate()` returns them.
	 * @param array         $visits            The site's visits in the selected period and in the period before it, as `current` and `previous`.
	 * @param int           $days_in_period    The number of days in the selected period, which the smallest change of a card scales with.
	 * @param string        $home_path         Optional. The path of the site's homepage, such as `/blog/` for a site that lives under a folder. Default `/`.
	 * @param callable|null $page_title_lookup Optional. A function that gets the title of the page at a path, such as `/plant-garlic/`, or null when it has none. Default null, for no titles.
	 */
	public function __construct( array $contextual_data, array $visits, $days_in_period, $home_path = '/', $page_title_lookup = null ) {
		$this->contextual_data   = $contextual_data;
		$this->home_path         = $home_path;
		$this->page_title_lookup = is_callable( $page_title_lookup ) ? $page_title_lookup : null;
		$this->visits            = array(
			'current'  => max( 0, (int) $visits['current'] ),
			'previous' => max( 0, (int) $visits['previous'] ),
		);
		$this->days_in_period    = (int) $days_in_period;
		$this->minimum_delta     = self::scale_count( self::MINIMUM_DELTA_PER_28_DAYS, $days_in_period );
		$this->page_classifier   = new Page_Classifier(
			Page_Classifier::has_front_page( $this->get_rows( 'channelPages' ), $home_path ),
			$home_path
		);

		$this->set_up_channels();
		$this->set_up_nodes( $this->channels );
		$this->set_up_search_clicks();
	}

	/**
	 * Gets the key factor cards the panel shows.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of cards, in the order to show them. Each has `kind`, `CHANNEL`, `CHANNEL_GROUP`, `CONTENT`, `REFERRING_SITE` or `CAMPAIGN`, `label`, the service's title of the card, `current`, `previous`, which `current` is the card's change above, `sharePct`, the card's share as the decomposition carries it, of the site's visits on a steady period, `shareBasis`, what that share is of, as the decomposition's `share_basis`, or null for a card of a flat period, which has none, and `attributes`, its rows. A part that took its channel's card also has `parentChannel`, the channel's title, and `parentChannelChange`, the channel's change. A post's card, and the card of a page that brought visits through several channels, also has `url`, the page's path. A channel's card without attributes has `spreadAcrossPages`, true, when its change was spread across many pages. A channel's or the paid group's card for its other pages, after such a page took the first card, has `otherPages`, true. Each attribute has `kind`, `label`, `current`, `previous`, `sharePct`, the row's share as the decomposition carries it, or `0` without one, and `oversized`, whether the row moved further than its card the same way, so it has no share and is more than the card's change. A search keyword's attribute counts clicks, and its `oversized` tells whether it moved against or further than the site's search clicks, and it has `noSearchClicks`, true, when the site's search clicks are unknown. A landing page's attribute has `title`, the page's title, when it is known.
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
				'title'          => self::get_channel_title( $row['label'] ),
				'key'            => self::get_channel_key( $row['label'] ),
				'name'           => self::get_key( $row['label'] ),
				'current'        => $row['current'],
				'previous'       => $row['previous'],
				'delta'          => $row['current'] - $row['previous'],
				'reported_delta' => $row['current'] - $row['previous'],
				'other_pages'    => null,
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
		}
	}

	/**
	 * Sets up the nodes a card can be built for, and the movement the site
	 * gained and lost.
	 *
	 * The movement is summed over the channels with the paid channels as one
	 * group, when they are, so a swap between paid channels counts once, as
	 * the group's net change. A channel named by a placeholder, such as
	 * `(not set)`, counts towards it, though no card names it. When a page
	 * that brought visits through several channels took the first card, its
	 * change counts as one more node of the channels it was taken out of.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channels   The channels, with the page's visits taken out of those it was.
	 * @param int   $page_delta Optional. The change of the page that took the first card. Default 0, for none.
	 */
	private function set_up_nodes( array $channels, $page_delta = 0 ) {
		$paid_group = $this->get_paid_group(
			array_values( array_filter( $channels, fn( $channel ) => self::is_paid_channel( $channel['key'] ) ) )
		);
		$partition  = array();

		foreach ( $channels as $channel ) {
			if ( null !== $paid_group && self::is_paid_channel( $channel['key'] ) ) {
				continue;
			}

			$partition[] = array(
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
			$partition[] = $paid_group;
		}

		$this->gain = max( 0, $page_delta );
		$this->loss = max( 0, -$page_delta );

		foreach ( $partition as $node ) {
			if ( $node['delta'] > 0 ) {
				$this->gain += $node['delta'];
			} else {
				$this->loss -= $node['delta'];
			}
		}

		// A channel named by a placeholder names nothing the reader would
		// recognise, so it is no node, though its visits count in the
		// period's figures and in its movement.
		$this->nodes = array_values(
			array_filter( $partition, fn( $node ) => ! Insight_Request_Builder::is_placeholder( $node['title'] ) )
		);
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

		$primary_direction = $this->get_primary_direction( $period_direction );
		$page              = 'STABLE' === $period_direction ? null : $this->select_cross_channel_page( $primary_direction );

		if ( null !== $page ) {
			// The page's visits are taken out of the channels they came
			// through first, so the page and the channels' other pages share
			// the movement their shares are of.
			$this->subtract_cross_channel_page( $page );

			$shape = $this->get_moving_shape( $primary_direction, abs( $page['delta'] ) );
			$cards = array_merge(
				array( $this->build_cross_channel_page_card( $page, $period_direction ) ),
				$this->build_moving_cards( $primary_direction, $period_direction, self::MAX_CARDS - 1 )
			);
		} else {
			$shape = 'STABLE' === $period_direction ? 'OFFSETTING' : $this->get_moving_shape( $primary_direction );
			$cards = $this->build_moving_cards( $primary_direction, $period_direction );

			// On a flat period, a part of the channel that moved most can be
			// smaller than the channel that moved against it. The other side is
			// then the larger story, unless its own cards have the same problem.
			if ( 'STABLE' === $period_direction && $this->has_larger_offset( $cards ) ) {
				$flipped_cards = $this->build_moving_cards( 'UP' === $primary_direction ? 'DOWN' : 'UP', $period_direction );

				if ( ! $this->has_larger_offset( $flipped_cards ) ) {
					$cards = $flipped_cards;
				}
			}
		}

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

		$change_percent = self::round_half_away( ( $this->visits['current'] - $this->visits['previous'] ) / $this->visits['previous'] * 1000 ) / 10;

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
	 * A channel named by a placeholder, such as `(not set)`, is left out, as it
	 * is from the cards: an `OFFSETTING` period's cards could not show its
	 * change, while a steady period's cards still show the channels with the
	 * most visits. Service §5.10 counts every channel here.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True when a channel's excess change reaches it, false otherwise.
	 */
	private function has_offsetting_channel() {
		foreach ( $this->channels as $channel ) {
			if ( Insight_Request_Builder::is_placeholder( $channel['title'] ) ) {
				continue;
			}

			if ( abs( $channel['excess'] ) / $this->denominator * 100 >= self::OFFSETTING_EXCESS_PERCENT ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Gets the node of the paid channels as one group, when at least two of
	 * them moved by `minimum_delta` and by `PAID_MEMBER_SHARE` of the paid
	 * channels' gross movement, and their net change is not `0`.
	 *
	 * The group is ranked by the paid channels' gross movement, so channels
	 * that swapped visits rank by how much moved, not by the little that is
	 * left of it. Its change is the sum of theirs, which is what is left of
	 * them when a page that brought visits through several channels was taken
	 * out of them.
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
			'title'       => self::PAID_GROUP_TITLE,
			'key'         => self::get_key( self::PAID_GROUP_TITLE ),
			'current'     => array_sum( array_column( $paid_channels, 'current' ) ),
			'previous'    => $previous,
			'delta'       => $delta,
			'excess'      => $this->get_excess( $delta, $previous ),
			'rank_size'   => $gross,
			'members'     => $paid_channels,
			'gross'       => $gross,
			'other_pages' => ! empty( array_filter( array_column( $paid_channels, 'other_pages' ) ) ),
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
	 * direction the site moved more in, and a rise when that is a tie too.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $period_direction The period's direction.
	 * @return string `UP` or `DOWN`.
	 */
	private function get_primary_direction( $period_direction ) {
		if ( 'STABLE' !== $period_direction ) {
			return $period_direction;
		}

		$largest_change = empty( $this->nodes ) ? 0 : max( array_map( fn( $node ) => abs( $node['delta'] ), $this->nodes ) );
		$has_rise       = false;
		$has_fall       = false;

		foreach ( $this->nodes as $node ) {
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
	 * `CONCENTRATED_SHARE` of the movement the site gained or lost that way,
	 * and `DIFFUSE` otherwise.
	 *
	 * The paid group counts once, as its net change. A page that took the
	 * first card counts as one more node.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $primary_direction The direction of a primary card.
	 * @param int    $page_change       Optional. The size of the change of the page that took the first card. Default 0, for none.
	 * @return string The shape.
	 */
	private function get_moving_shape( $primary_direction, $page_change = 0 ) {
		$largest_change = $page_change;

		foreach ( $this->nodes as $node ) {
			if ( ! self::is_counter_move( $node['delta'], $primary_direction ) ) {
				$largest_change = max( $largest_change, abs( $node['delta'] ) );
			}
		}

		$pool = 'UP' === $primary_direction ? $this->gain : $this->loss;

		return $pool > 0 && $largest_change >= self::CONCENTRATED_SHARE * $pool ? 'CONCENTRATED' : 'DIFFUSE';
	}

	/**
	 * Picks the page that brought visits through several channels to take the
	 * first card of a period that rose or dropped.
	 *
	 * Among the pages that moved most, the first that moved the period's way
	 * by the scaled `CROSS_CHANNEL_PAGE_DELTA_PER_28_DAYS` and by
	 * `CROSS_CHANNEL_PAGE_POOL_SHARE` of the movement the site gained or lost
	 * that way, through at least two channels that each carried
	 * `CROSS_CHANNEL_PAGE_CHANNEL_SHARE` of its change.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $primary_direction The direction of a primary card, the period's own.
	 * @return array|null The page, as `get_cross_channel_pages()` returns it, or null.
	 */
	private function select_cross_channel_page( $primary_direction ) {
		$sign = 'UP' === $primary_direction ? 1 : -1;
		$pool = 'UP' === $primary_direction ? $this->gain : $this->loss;

		if ( $pool <= 0 ) {
			return null;
		}

		$minimum = self::scale_count( self::CROSS_CHANNEL_PAGE_DELTA_PER_28_DAYS, $this->days_in_period );

		foreach ( $this->get_cross_channel_pages() as $page ) {
			$change = abs( $page['delta'] );

			if ( $page['delta'] * $sign > 0 && $change >= $minimum && $change >= self::CROSS_CHANNEL_PAGE_POOL_SHARE * $pool && count( self::get_page_channels( $page ) ) >= 2 ) {
				return $page;
			}
		}

		return null;
	}

	/**
	 * Gets the channels a page brought visits through, each of which carried
	 * `CROSS_CHANNEL_PAGE_CHANNEL_SHARE` of the page's change the same way.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $page The page, as `get_cross_channel_pages()` returns it.
	 * @return array List of the channels, most moved first.
	 */
	private static function get_page_channels( array $page ) {
		return array_values(
			array_filter(
				$page['channels'],
				fn( $channel ) => $channel['delta'] * $page['delta'] > 0
					&& abs( $channel['delta'] ) >= self::CROSS_CHANNEL_PAGE_CHANNEL_SHARE * abs( $page['delta'] )
			)
		);
	}

	/**
	 * Takes the visits of the page that took the first card out of the
	 * channels they came through, and sets up the nodes again.
	 *
	 * A channel's visits to the page are taken out of it only when they are
	 * `CROSS_CHANNEL_SUBTRACTION_SHARE` of its change or of the page's. Its
	 * card then shows its other pages.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $page The page, as `get_cross_channel_pages()` returns it.
	 */
	private function subtract_cross_channel_page( array $page ) {
		$changes = array_column( $page['channels'], 'delta', 'key' );

		$channels = array_map(
			function ( $channel ) use ( $changes, $page ) {
				$change = isset( $changes[ $channel['key'] ] ) ? $changes[ $channel['key'] ] : 0;

				if ( 0 === $change || ( abs( $change ) < self::CROSS_CHANNEL_SUBTRACTION_SHARE * abs( $channel['delta'] ) && abs( $change ) < self::CROSS_CHANNEL_SUBTRACTION_SHARE * abs( $page['delta'] ) ) ) {
					return $channel;
				}

				$channel['delta']      -= $change;
				$channel['excess']      = $this->get_excess( $channel['delta'], $channel['previous'] );
				$channel['other_pages'] = $page;

				return $channel;
			},
			$this->channels
		);

		$this->set_up_nodes( $channels, $page['delta'] );
	}

	/**
	 * Builds the first card, of the page that brought visits through several
	 * channels.
	 *
	 * Its rows are the first two channels that each carried
	 * `CROSS_CHANNEL_PAGE_CHANNEL_SHARE` of its change, each with its share of
	 * the page's change. When the two carried more than the page's change,
	 * since a third channel moved the other way, neither has a share.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $page             The page, as `get_cross_channel_pages()` returns it.
	 * @param string $period_direction The period's direction.
	 * @return array The card, with `key_factor` and `wire`.
	 */
	private function build_cross_channel_page_card( array $page, $period_direction ) {
		$rows = array_map(
			fn( $channel ) => $this->build_row( 'CHANNEL', 'Channel', $channel['title'], 'TRAFFIC_CHANNEL', $channel, $page['delta'] ),
			array_slice( self::get_page_channels( $page ), 0, self::MAX_ROWS )
		);

		if ( 2 === count( $rows ) && abs( $rows[0]['delta'] ) + abs( $rows[1]['delta'] ) > abs( $page['delta'] ) ) {
			$rows = array_map( fn( $row ) => self::clear_row_share( $row ), $rows );
		}

		return $this->build_card(
			'CONTENT',
			$page['title'],
			$page,
			'PRIMARY',
			$this->get_card_share( $page['delta'], 'PRIMARY', $period_direction ),
			$rows,
			array( 'url' => $page['path'] )
		);
	}

	/**
	 * Builds the cards of a period on which something moved: picks the nodes,
	 * builds one card for each, and sorts them for display.
	 *
	 * A part of a channel that takes the channel's card is remembered, so a
	 * part that carried the change of two channels takes the card of the
	 * first only. The one node picked for up to `MAX_CARDS` cards is the
	 * period's only card. With fewer, a page that brought visits through
	 * several channels took the first card.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $primary_direction The direction of a primary card.
	 * @param string $period_direction  The period's direction.
	 * @param int    $limit             Optional. The most cards to build. Default `MAX_CARDS`.
	 * @return array List of cards, as `sort_cards()` sorts them.
	 */
	private function build_moving_cards( $primary_direction, $period_direction, $limit = self::MAX_CARDS ) {
		$elevated_keys = array();
		$cards         = array();
		$nodes         = $this->select_nodes( $primary_direction, $period_direction, $limit );
		$is_lone_card  = self::MAX_CARDS === $limit && 1 === count( $nodes );

		foreach ( $nodes as $node ) {
			$cards[] = isset( $node['members'] )
				? $this->build_group_card( $node, $primary_direction, $period_direction )
				: $this->build_channel_card( $node, $primary_direction, $period_direction, $elevated_keys, $is_lone_card );
		}

		return $this->sort_cards( $cards );
	}

	/**
	 * Picks the nodes to build cards for, at most `$limit`.
	 *
	 * A node is eligible when it moved by `minimum_delta`, by
	 * `MINIMUM_TRAFFIC_SHARE` of the larger period total and by
	 * `MINIMUM_GROSS_SHARE` of the site's gross movement. The eligible nodes
	 * are ranked by how much they moved, then by their excess change, then by
	 * title. A period that rose or dropped takes at most one node moving
	 * against it, and always one moving with it, unless a page took the first
	 * card. A flat period shows both sides: up to all but one node from the
	 * side it leaned towards and one from the other, with any slot left filled
	 * by the next nodes of either side.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $primary_direction The direction of a primary card.
	 * @param string $period_direction  The period's direction.
	 * @param int    $limit             The most nodes to pick.
	 * @return array List of nodes, those moving the primary direction first, then in rank order.
	 */
	private function select_nodes( $primary_direction, $period_direction, $limit ) {
		$minimum = max(
			$this->minimum_delta,
			self::MINIMUM_TRAFFIC_SHARE * $this->denominator,
			self::MINIMUM_GROSS_SHARE * ( $this->gain + $this->loss )
		);

		$ranking = array_values( array_filter( $this->nodes, fn( $node ) => $node['rank_size'] >= $minimum ) );

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

				if ( $counts[ $side ] < ( 'counter' === $side ? 1 : $limit - 1 ) && count( $selected ) < $limit ) {
					$selected[ $index ] = $node;
					++$counts[ $side ];
				}
			}

			foreach ( $ranking as $index => $node ) {
				if ( ! isset( $selected[ $index ] ) && count( $selected ) < $limit ) {
					$selected[ $index ] = $node;
				}
			}

			ksort( $selected );
		} else {
			$has_counter = false;

			foreach ( $ranking as $node ) {
				if ( count( $selected ) >= $limit ) {
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

			// A page that took the first card already moves the period's way.
			if ( $limit >= self::MAX_CARDS ) {
				$selected = $this->add_primary_node( array_values( $selected ), $primary_direction );
			}
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
	 * @param string $primary_direction The direction of a primary card, the period's own.
	 * @return array The nodes picked.
	 */
	private function add_primary_node( array $selected, $primary_direction ) {
		foreach ( $selected as $node ) {
			if ( ! self::is_counter_move( $node['delta'], $primary_direction ) ) {
				return $selected;
			}
		}

		$largest = null;

		foreach ( $this->nodes as $node ) {
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
	 * A part that carried a little more than its channel, within `NET_SLACK`,
	 * takes the share a card of its own would have, and still names its
	 * channel. When that share would be of the site's traffic, as when the
	 * part moved further than every channel that moved its way, the channel
	 * keeps its card, and the part is a row larger than it.
	 *
	 * A part's card has no rows but the channel's landing page, when it
	 * qualifies. So the period's only card never names a part without that
	 * row: the channel keeps its card, with its rows, the part among them, as
	 * the service decides it.
	 *
	 * The card of a channel whose visits to the page that took the first card
	 * were taken out of it shows its other pages, as `build_residual_card()`
	 * builds it.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $node              The channel's node.
	 * @param string $primary_direction The direction of a primary card.
	 * @param string $period_direction  The period's direction.
	 * @param array  $elevated_keys     The keys of the parts that took a card, keyed by key. A part that takes this card is added.
	 * @param bool   $is_lone_card      Optional. Whether the card is the period's only card. Default false.
	 * @return array The card, with `key_factor` and `wire`.
	 */
	private function build_channel_card( array $node, $primary_direction, $period_direction, array &$elevated_keys, $is_lone_card = false ) {
		$delta = $node['delta'];
		$role  = self::is_counter_move( $delta, $primary_direction ) ? 'OFFSET' : 'PRIMARY';

		if ( null !== $node['channel']['other_pages'] ) {
			return $this->build_residual_card( $node, $role, $period_direction );
		}

		$children = $this->get_children( $node['channel'] );
		$split    = $this->split_children( $children, $delta );

		if ( $this->can_elevate( $split, $children, $delta, $elevated_keys ) ) {
			$child = $split['top_same'];
			$share = $split['ratio'] > 1
				? $this->get_card_share( $child['delta'], $role, $period_direction )
				: array(
					'share_basis'        => 'PARENT_CHANNEL',
					'traffic_impact_pct' => self::round1( $split['ratio'] * 100 ),
				);

			if ( 'SITE_TRAFFIC' !== $share['share_basis'] ) {
				$page_row = $this->get_elevated_page_row( $node['channel'], $child, $split );

				// The period's only card stays the channel's when the part's
				// card would have no row.
				if ( ! $is_lone_card || null !== $page_row ) {
					$elevated_keys[ $child['key'] ] = true;

					// A part that took its channel's place names the channel,
					// so the panel can say where its change came from.
					$share['parent_channel']       = $node['title'];
					$share['parent_channel_delta'] = $delta;

					return $this->build_card(
						$child['kind'],
						$child['title'],
						$child,
						$role,
						$share,
						null === $page_row ? array() : array( $page_row ),
						// A post's card carries its path, which its title links
						// to.
						array( 'url' => 'CONTENT' === $child['kind'] ? $child['text'] : null )
					);
				}
			}
		}

		$rows = $this->get_channel_rows( $node['channel'], $children, $split, $elevated_keys );

		return $this->build_card(
			'CHANNEL',
			$node['title'],
			$node,
			$role,
			$this->get_card_share( $delta, $role, $period_direction ),
			$rows,
			// A card without rows says when its change was spread across many
			// pages, so it doesn't show its title and its change alone.
			array( 'spread' => empty( $rows ) && $this->is_spread_across_pages( $node['channel'] ) )
		);
	}

	/**
	 * Builds the card of a channel whose visits to the page that took the
	 * first card were taken out of it, for its other pages.
	 *
	 * Its change is what is left of the channel's. No part takes its place,
	 * and its rows are its other pages only, since its sources, campaigns,
	 * devices and visitor types can't be split by page: for `Direct` its
	 * homepage, and its landing page, measured against what is left of its
	 * change. The landing page is the one that moved most with the channel,
	 * or, when that is the page that took the first card or moved against
	 * what is left, the page of those that moved most across every channel
	 * that moved most with what is left.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $node             The channel's node.
	 * @param string $role             The card's role.
	 * @param string $period_direction The period's direction.
	 * @return array The card, with `key_factor` and `wire`.
	 */
	private function build_residual_card( array $node, $role, $period_direction ) {
		$channel = $node['channel'];
		$delta   = $node['delta'];
		$page    = $channel['other_pages'];
		$rows    = array();

		if ( 0 !== $delta ) {
			$reduction = $this->get_reduction( $channel );

			if ( self::DIRECT_CHANNEL === $channel['key'] ) {
				$homepage_row = $this->get_slot_row( 'HOMEPAGE', $reduction, $delta );

				if ( null !== $homepage_row ) {
					$rows[] = $homepage_row;
				}
			}

			$target = $reduction['page'];

			if ( null === $target || $target['key'] === $page['key'] || $target['delta'] * $delta <= 0 ) {
				$target = $this->get_best_residual_page( $channel['key'], $page['key'], $delta );
			}

			$page_row = $this->get_page_row( $target, $delta );

			if ( null !== $page_row ) {
				$rows[] = $page_row;
			}

			$rows = $this->keep_consistent_rows( self::order_direct_pages( $channel, $rows ), $delta );
		}

		return $this->build_card(
			'CHANNEL',
			$node['title'],
			$node,
			$role,
			$this->get_card_share( $delta, $role, $period_direction ),
			$rows,
			array(
				'other_pages' => true,
				'spread'      => empty( $rows ) && $this->is_spread_across_pages( $channel ),
			)
		);
	}

	/**
	 * Gets the landing page of a channel's card for its other pages, among the
	 * pages that moved most across every channel: the page other than the one
	 * that took the first card through which the channel moved most with what
	 * is left of its change, the first by path on a tie.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $channel_key The channel's key.
	 * @param string $page_key    The key of the page that took the first card.
	 * @param int    $delta       What is left of the channel's change.
	 * @return array|null The page, with `key`, `title`, its path, and the channel's `current`, `previous` and `delta` on it, or null.
	 */
	private function get_best_residual_page( $channel_key, $page_key, $delta ) {
		$best = null;

		foreach ( $this->get_cross_channel_pages() as $page ) {
			if ( $page['key'] === $page_key ) {
				continue;
			}

			foreach ( $page['channels'] as $channel ) {
				if ( $channel['key'] !== $channel_key || $channel['delta'] * $delta <= 0 ) {
					continue;
				}

				if ( null === $best || abs( $channel['delta'] ) > abs( $best['delta'] ) || ( abs( $channel['delta'] ) === abs( $best['delta'] ) && strcmp( $page['path'], $best['title'] ) < 0 ) ) {
					$best = array(
						'key'      => $page['key'],
						'title'    => $page['path'],
						'current'  => $channel['current'],
						'previous' => $channel['previous'],
						'delta'    => $channel['delta'],
					);
				}
			}
		}

		return $best;
	}

	/**
	 * Builds the card of the paid channels as one group.
	 *
	 * Its rows are the paid channels that moved materially, each with its
	 * share of the paid channels' gross movement rather than of the group's
	 * net change, and with the campaign that carried most of its change. A
	 * channel whose visits to the page that took the first card were taken
	 * out of it has no campaign, since a campaign's visits can't be split by
	 * page, and the card shows the paid channels' other pages.
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

			$campaign = null === $member['other_pages'] ? $this->get_member_campaign( $member ) : null;

			if ( null !== $campaign ) {
				$wire['campaign']       = $campaign['title'];
				$wire['campaign_delta'] = $campaign['delta'];
			}

			$rows[] = array(
				'wire'      => $wire,
				'attribute' => self::get_attribute( 'TRAFFIC_CHANNEL', $member['title'], $member['current'], $member['current'] - $member['delta'], $share_percent ),
			);
		}

		return $this->build_card(
			'CHANNEL_GROUP',
			self::PAID_GROUP_TITLE,
			$node,
			$role,
			$this->get_card_share( $node['delta'], $role, $period_direction ),
			$rows,
			array( 'other_pages' => $node['other_pages'] )
		);
	}

	/**
	 * Gets the campaign of a paid channel's row in the paid group's card: the
	 * campaign that moved most with it of those that carried from
	 * `SIBLING_SHARE` to all of its change, and at least `minimum_delta`. A
	 * campaign that moved further than its channel is passed over, since the
	 * group's card has no room to say what moved the other way.
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
	 * of no slicing and never take the channel's card. A keyword that is the
	 * site's own name or domain is a part like any other, as in the service.
	 *
	 * The landing page part of a channel that rose is the post published in the
	 * period at the address of its landing page, as `get_reduction()` finds it,
	 * with the post's visits as its change, as the service reads it. A channel
	 * has no other landing page part, so a page takes a channel's card only
	 * when it is a new post.
	 *
	 * A source, keyword or campaign row that didn't move is left out, and the
	 * rows of a part with the same key are added up, so a part's visits are
	 * those of its rows that moved, as the service counts them. A part that
	 * didn't move is left out, and so is a campaign named as one of the
	 * channel's other parts already.
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
					'title'          => '' !== $post['title'] ? $post['title'] : $path,
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

				if ( '' === $query || self::is_unchanged( $row ) || Content_Screen::is_hidden( $query ) ) {
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
			$source = self::is_unchanged( $row ) ? null : Source_Classifier::classify_source( $row['source'] );

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
			$title = self::is_unchanged( $row ) ? '' : Source_Classifier::get_campaign_title( $row['campaign'] );

			if ( '' === $title || in_array( self::get_key( $title ), $titles, true ) ) {
				continue;
			}

			self::add_child(
				$campaigns,
				array(
					'key'            => 'campaign:' . self::get_key( $title ),
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
	 * Gets the row of a referring site's or a campaign's card that took its
	 * channel's place: the channel's landing page, when the part surely
	 * brought at least `PAGE_OVERLAP_SHARE` of the page's change.
	 *
	 * The part and the page are two cuts of the channel's visits, so they
	 * surely share as much as they carried together beyond the channel's
	 * change. That holds only when no part moved against the channel
	 * materially, and neither the part nor the page moved further than the
	 * channel. The page must move with the channel, by `minimum_delta`. Its
	 * row has its own change and no share, since it is no part of the card's
	 * change.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The channel.
	 * @param array $child   The part that took the channel's card.
	 * @param array $split   The split of the channel's parts, as `split_children()` returns it.
	 * @return array|null The row, or null.
	 */
	private function get_elevated_page_row( array $channel, array $child, array $split ) {
		if ( ! in_array( $child['kind'], array( 'REFERRING_SITE', 'CAMPAIGN' ), true ) || $split['counted_opposite'] || 0 === $channel['delta'] ) {
			return null;
		}

		$page = $this->get_reduction( $channel )['page'];

		if ( null === $page ) {
			return null;
		}

		$channel_change = abs( $channel['delta'] );
		$child_change   = abs( $child['delta'] );
		$page_change    = abs( $page['delta'] );

		if ( $child_change > $channel_change || $page_change > $channel_change || $page['delta'] * $channel['delta'] <= 0 || $page_change < $this->minimum_delta ) {
			return null;
		}

		if ( max( 0, $child_change + $page_change - $channel_change ) < self::PAGE_OVERLAP_SHARE * $page_change ) {
			return null;
		}

		return $this->build_row( 'TARGET_PAGE', 'Target page', $page['title'], 'LANDING_PAGE', $page, $channel['delta'], true );
	}

	/**
	 * Gets the rows of a channel's card, at most `MAX_ROWS`.
	 *
	 * The candidates, in priority order:
	 * - The channel's parts. A net channel lists its two sides, each with its
	 *   own change and no share. Any other channel but `Direct` lists the
	 *   search keyword behind its change in search clicks, for
	 *   `Organic Search`, and up to two parts from one breakdown that each
	 *   carried `ROW_SHARE` of its change.
	 * - Its slots: the homepage, the landing page and the visitor type for
	 *   `Direct`, and the landing page for any other channel.
	 * - Its fillers: the device for `Direct`, and the device and the visitor
	 *   type for any other channel.
	 * A slot or a filler is left out when a row of its kind is listed already.
	 * On `Direct`, a landing page that moved further than the homepage comes
	 * before it. The candidates are then kept by `keep_consistent_rows()`.
	 *
	 * A card left without rows lists the visitor type or the device that moved
	 * further than it, the same way, when one did, as its only row.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel       The channel.
	 * @param array $children      The channel's parts.
	 * @param array $split         The split of the channel's parts, as `split_children()` returns it, with `without_part_rows` true to list no part.
	 * @param array $elevated_keys The keys of the parts that took a card, keyed by key, which no row lists.
	 * @return array List of rows, each with `cut`, `delta`, `share`, `wire` and `attribute`.
	 */
	private function get_channel_rows( array $channel, array $children, array $split, array $elevated_keys ) {
		$delta      = $channel['delta'];
		$is_direct  = self::DIRECT_CHANNEL === $channel['key'];
		$candidates = array();

		if ( $split['without_part_rows'] ) {
			// A steady card lists only its slots and fillers.
			$candidates = array();
		} elseif ( $split['is_net'] && ! isset( $elevated_keys[ $split['top_same']['key'] ] ) ) {
			// The two sides of a net are listed together, never the smaller
			// side alone.
			if ( abs( $split['top_same']['delta'] ) >= $this->minimum_delta ) {
				$candidates[] = $this->build_child_row( $split['top_same'], $delta );

				if ( $split['counted_opposite'] ) {
					$candidates[] = $this->build_child_row( $split['top_opposite'], $delta );
				}
			}
		} elseif ( ! $is_direct ) {
			$keyword_row = $this->get_keyword_row( $children, $delta );

			if ( null !== $keyword_row ) {
				$candidates[] = $keyword_row;
			}

			foreach ( $this->get_part_children( $children, $delta, $elevated_keys ) as $child ) {
				$candidates[] = $this->build_child_row( $child, $delta );
			}
		}

		$listed_kinds = array_map( fn( $row ) => $row['wire']['kind'], $candidates );
		$reduction    = $this->get_reduction( $channel );
		$slot_kinds   = $is_direct
			? array( 'HOMEPAGE', 'TARGET_PAGE', 'VISITOR_TYPE', 'READER_DEVICE' )
			: array( 'TARGET_PAGE', 'READER_DEVICE', 'VISITOR_TYPE' );

		if ( 0 !== $delta ) {
			foreach ( $slot_kinds as $kind ) {
				if ( in_array( $kind, $listed_kinds, true ) ) {
					continue;
				}

				$row = $this->get_slot_row( $kind, $reduction, $delta );

				if ( null !== $row ) {
					$candidates[]   = $row;
					$listed_kinds[] = $kind;
				}
			}
		}

		$rows = $this->keep_consistent_rows( self::order_direct_pages( $channel, $candidates ), $delta );

		return empty( $rows ) && 0 !== $delta ? $this->get_fallback_rows( $slot_kinds, $reduction, $delta ) : $rows;
	}

	/**
	 * Puts `Direct`'s landing page before its homepage when the page moved
	 * further, the homepage first on a tie.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The channel.
	 * @param array $rows    The candidate rows, in priority order.
	 * @return array The rows.
	 */
	private static function order_direct_pages( array $channel, array $rows ) {
		if ( self::DIRECT_CHANNEL === $channel['key'] && count( $rows ) >= 2 && 'HOMEPAGE' === $rows[0]['wire']['kind'] && 'TARGET_PAGE' === $rows[1]['wire']['kind'] && abs( $rows[1]['delta'] ) > abs( $rows[0]['delta'] ) ) {
			return array_merge( array( $rows[1], $rows[0] ), array_slice( $rows, 2 ) );
		}

		return $rows;
	}

	/**
	 * Gets the only row of a channel's card that has no other: the first of its
	 * visitor type and device, in priority order, that moved with the card,
	 * further than it, and clears the row floors. It has its own change and no
	 * share, since what the card's other values moved the other way left the
	 * card smaller than it.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $slot_kinds The kinds of the card's slots and fillers, in priority order.
	 * @param array $reduction  The channel's reduction, as `get_reduction()` returns it.
	 * @param int   $delta      The card's change.
	 * @return array List of the row, or an empty list.
	 */
	private function get_fallback_rows( array $slot_kinds, array $reduction, $delta ) {
		foreach ( $slot_kinds as $kind ) {
			if ( 'VISITOR_TYPE' !== $kind && 'READER_DEVICE' !== $kind ) {
				continue;
			}

			$value = 'VISITOR_TYPE' === $kind ? $reduction['visitor_type'] : $reduction['device'];

			if ( null !== $value && $value['delta'] * $delta > 0 && abs( $value['delta'] ) > abs( $delta ) && $this->is_above_row_floors( $value['delta'], $delta ) ) {
				list( $label, $attribute_kind ) = self::get_breakdown_labels( $kind );

				return array( $this->build_row( $kind, $label, $value['title'], $attribute_kind, $value, $delta ) );
			}
		}

		return array();
	}

	/**
	 * Gets the search keyword row of `Organic Search`'s card: the keyword whose
	 * clicks moved most the way the channel moved.
	 *
	 * Only that keyword is tried: a smaller keyword is never named in its
	 * place. It needs `minimum_delta` clicks, and a change of at least
	 * `KEYWORD_SEARCH_CLICKS_SHARE` of the site's search clicks, or without
	 * them, of `ROW_SHARE` of the channel's change in visits.
	 *
	 * It is context with its change in clicks against all of the site's
	 * search clicks, not their net change. A keyword that moved against the
	 * site's search clicks, further than them, or while they didn't move, is
	 * marked `oversized_query`, since other queries moved the other way.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $children The channel's parts, most moved first.
	 * @param int   $delta    The channel's change.
	 * @return array|null The row, or null.
	 */
	private function get_keyword_row( array $children, $delta ) {
		if ( 0 === $delta ) {
			return null;
		}

		foreach ( $children as $child ) {
			if ( 'SEARCH_KEYWORD' !== $child['kind'] || $child['delta'] * $delta <= 0 ) {
				continue;
			}

			$clicks          = abs( $child['delta'] );
			$has_site_clicks = $this->search_clicks_total > 0;

			if ( $clicks < $this->minimum_delta ) {
				return null;
			}

			if ( $has_site_clicks ? $clicks < self::KEYWORD_SEARCH_CLICKS_SHARE * $this->search_clicks_total : $clicks < self::ROW_SHARE * abs( $delta ) ) {
				return null;
			}

			$share_percent = $has_site_clicks ? min( 100.0, self::round1( $clicks / $this->search_clicks_total * 100 ) ) : 0.0;
			$is_oversized  = $has_site_clicks && ( 0 === $this->search_clicks_delta || $child['delta'] * $this->search_clicks_delta < 0 || $clicks > abs( $this->search_clicks_delta ) );
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

			if ( $is_oversized ) {
				$wire['oversized_query'] = true;
			}

			return array(
				'cut'       => null,
				'delta'     => $child['delta'],
				'share'     => $share_percent,
				'wire'      => $wire,
				// Without the site's search clicks, the row has no share to
				// say.
				'attribute' => self::get_attribute(
					'SEARCH_KEYWORD',
					$child['title'],
					$child['current'],
					$child['previous'],
					$share_percent,
					$is_oversized,
					$has_site_clicks ? array() : array( 'noSearchClicks' => true )
				),
			);
		}

		return null;
	}

	/**
	 * Gets the parts listed as rows of a channel that is not a net: up to
	 * `MAX_ROWS` parts other than landing pages that moved with it, each by
	 * `ROW_SHARE` of its change and by `minimum_delta`, all from the
	 * breakdown of the largest of them. A part that moved further than the
	 * channel is listed with its own change and no share.
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

			if ( $child['delta'] * $delta <= 0 || ! $this->is_above_row_floors( $child['delta'], $delta ) ) {
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
	 * Gets the row of a slot or a filler of a channel's card.
	 *
	 * A row needs a change moving with the card, by `minimum_delta` and by
	 * `ROW_SHARE` of the card's change. A landing page, or the homepage of
	 * `Direct`, that moved further than the card is listed with its own change
	 * and no share. A device or a visitor type that moved further than the
	 * card is no row: it is a cut of the same visits as every other row, and
	 * says nothing a share could.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $kind      The row kind, such as `TARGET_PAGE`.
	 * @param array  $reduction The channel's reduction, as `get_reduction()` returns it.
	 * @param int    $delta     The card's change.
	 * @return array|null The row, or null.
	 */
	private function get_slot_row( $kind, array $reduction, $delta ) {
		switch ( $kind ) {
			case 'HOMEPAGE':
				$homepage = $reduction['homepage'];

				if ( null === $homepage || $homepage['delta'] * $delta <= 0 || ! $this->is_above_row_floors( $homepage['delta'], $delta ) ) {
					return null;
				}

				return $this->build_row( 'HOMEPAGE', 'Homepage', null, 'LANDING_PAGE', $homepage, $delta );
			case 'TARGET_PAGE':
				return $this->get_page_row( $reduction['page'], $delta );
			default:
				$value = 'VISITOR_TYPE' === $kind ? $reduction['visitor_type'] : $reduction['device'];

				if ( null === $value || $value['delta'] * $delta <= 0 || ! $this->is_above_row_floors( $value['delta'], $delta ) || abs( $value['delta'] ) > abs( $delta ) ) {
					return null;
				}

				list( $label, $attribute_kind ) = self::get_breakdown_labels( $kind );

				return $this->build_row( $kind, $label, $value['title'], $attribute_kind, $value, $delta );
		}
	}

	/**
	 * Gets the row of a landing page of a card: when it moved with the card,
	 * by `minimum_delta` and by `ROW_SHARE` of the card's change. A page that
	 * moved further than the card is listed with its own change and no share.
	 *
	 * @since n.e.x.t
	 *
	 * @param array|null $page  The page, with `title`, its path, `current`, `previous` and `delta`, or null.
	 * @param int        $delta The card's change.
	 * @return array|null The row, or null.
	 */
	private function get_page_row( $page, $delta ) {
		if ( null === $page || $page['delta'] * $delta <= 0 || ! $this->is_above_row_floors( $page['delta'], $delta ) ) {
			return null;
		}

		return $this->build_row( 'TARGET_PAGE', 'Target page', $page['title'], 'LANDING_PAGE', $page, $delta );
	}

	/**
	 * Gets the row label and the attribute kind of a device or a visitor type.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $kind The row kind, `VISITOR_TYPE` or `READER_DEVICE`.
	 * @return array The label and the attribute kind.
	 */
	private static function get_breakdown_labels( $kind ) {
		return 'VISITOR_TYPE' === $kind
			? array( 'Visitor type', 'USER_TYPE' )
			: array( 'Reader device', 'DEVICE' );
	}

	/**
	 * Builds a row measured in visits.
	 *
	 * A row moving with its card, and no larger than it, has its share of the
	 * card's change, and is a part of it from `DECOMPOSITION_ROW_SHARE`. Any
	 * other row is context with its own change and no share: the side of a
	 * net that moved against the card, or a row that moved further than the
	 * card because the card's other parts moved the other way, which never
	 * reads as more than all of its change.
	 *
	 * The panel's attribute marks a row that moved further than the card, the
	 * same way, as `oversized`, so the panel can say other parts moved the
	 * other way rather than show a bare larger number. A landing page's row
	 * carries the page's title, when it is known.
	 *
	 * @since n.e.x.t
	 *
	 * @param string      $kind           The row kind, such as `TARGET_PAGE`.
	 * @param string      $label          The row label, such as `Target page`.
	 * @param string|null $text           The row's name, or null for the homepage, which names no page.
	 * @param string      $attribute_kind The kind of the card's attribute, such as `LANDING_PAGE`.
	 * @param array       $value          The value, with `current`, `previous` and `delta`.
	 * @param int         $card_delta     The card's change.
	 * @param bool        $is_context     Optional. Whether the row is context with no share, and never oversized, whichever way it moved. Default false.
	 * @return array The row, with `cut`, `delta`, `share`, `wire` and `attribute`.
	 */
	private function build_row( $kind, $label, $text, $attribute_kind, array $value, $card_delta, $is_context = false ) {
		$delta         = (int) $value['delta'];
		$moves_with    = ! $is_context && $delta * $card_delta > 0;
		$oversized     = $moves_with && abs( $delta ) > abs( $card_delta );
		$title         = 'TARGET_PAGE' === $kind && null !== $text ? $this->get_page_title( $text ) : null;
		$share_percent = 0.0;
		$wire          = array(
			'kind'  => $kind,
			'role'  => 'CONTEXT',
			'label' => $label,
		);

		if ( null !== $text ) {
			$wire['value'] = array( 'text' => $text );

			// A page's row is named by its path, which the panel links, and
			// by its title, which the service names it by.
			if ( null !== $title ) {
				$wire['value']['title'] = $title;
			}
		}

		if ( $moves_with && ! $oversized ) {
			$ratio         = abs( $delta ) / abs( $card_delta );
			$share_percent = self::round1( $ratio * 100 );

			if ( $ratio >= self::DECOMPOSITION_ROW_SHARE ) {
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
			'attribute' => self::get_attribute(
				$attribute_kind,
				null === $text ? $this->home_path : $text,
				$value['current'],
				$value['previous'],
				$share_percent,
				$oversized,
				null === $title ? array() : array( 'title' => $title )
			),
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
	 * than the card's change. So a card's shares never add up past 100%. A
	 * row that moved further than the card is kept only as the first, and
	 * fills the card on its own.
	 *
	 * Two exceptions keep a second row:
	 * - Two parts from the same breakdown, such as two referring sites, that
	 *   each carried `SECOND_PART_SHARE` of the card's change and no more than
	 *   it, are both kept when together they carried more than it, each
	 *   without a share.
	 * - Below a part, such as a referring site, the card's landing page is
	 *   kept as context without a share, so the shares of two cuts never read
	 *   as adding up.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $candidates The candidate rows, in priority order.
	 * @param int   $card_delta The card's change.
	 * @return array List of rows, at most `MAX_ROWS`.
	 */
	private function keep_consistent_rows( array $candidates, $card_delta ) {
		$candidates    = array_values( $candidates );
		$visit_indexes = array_keys( array_filter( $candidates, fn( $row ) => null !== $row['cut'] ) );

		if ( count( $visit_indexes ) >= 2 && $this->is_net_pair( $candidates[ $visit_indexes[0] ], $candidates[ $visit_indexes[1] ] ) ) {
			$net_indexes = array_slice( $visit_indexes, 0, 2 );
			$rows        = array_filter(
				$candidates,
				fn( $row, $index ) => null === $row['cut'] || in_array( $index, $net_indexes, true ),
				ARRAY_FILTER_USE_BOTH
			);

			return array_slice( array_values( $rows ), 0, self::MAX_ROWS );
		}

		$kept             = array();
		$kept_visits      = array();
		$cut              = null;
		$covered          = 0;
		$has_context_page = false;

		// Whether a row is kept depends on the rows kept before it.
		foreach ( $candidates as $row ) {
			if ( null === $row['cut'] ) {
				$kept[] = $row;
				continue;
			}

			if ( null !== $cut && $row['cut'] !== $cut ) {
				if ( 'part' === $cut && 'TARGET_PAGE' === $row['wire']['kind'] && ! $has_context_page && count( $kept ) < self::MAX_ROWS ) {
					$kept[]           = self::clear_row_share( $row );
					$has_context_page = true;
				}

				continue;
			}

			if ( $covered > 0 && $covered + abs( $row['delta'] ) > abs( $card_delta ) ) {
				$first = 1 === count( $kept_visits ) ? $kept[ $kept_visits[0] ] : null;

				if ( 'part' !== $row['cut'] || null === $first || count( $kept ) >= self::MAX_ROWS || ! $this->is_second_part_pair( $first, $row, $card_delta ) ) {
					continue;
				}

				$kept[ $kept_visits[0] ] = self::clear_row_share( $first );
				$row                     = self::clear_row_share( $row );
			}

			$covered      += abs( $row['delta'] );
			$cut           = $row['cut'];
			$kept_visits[] = count( $kept );
			$kept[]        = $row;
		}

		return array_slice( $kept, 0, self::MAX_ROWS );
	}

	/**
	 * Checks whether two rows of parts each carried `SECOND_PART_SHARE` of
	 * their card's change, and no more than it.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $first      The first row.
	 * @param array $second     The second row.
	 * @param int   $card_delta The card's change.
	 * @return bool True when they did.
	 */
	private function is_second_part_pair( array $first, array $second, $card_delta ) {
		foreach ( array( $first, $second ) as $row ) {
			if ( abs( $row['delta'] ) > abs( $card_delta ) || abs( $row['delta'] ) < self::SECOND_PART_SHARE * abs( $card_delta ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Takes the share out of a row, which is then context.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $row The row.
	 * @return array The row.
	 */
	private static function clear_row_share( array $row ) {
		$row['share']                 = 0.0;
		$row['wire']['role']          = 'CONTEXT';
		$row['attribute']['sharePct'] = 0.0;

		unset( $row['wire']['share_of_parent_change_pct'] );

		return $row;
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
	 * Each is the value that moved most with the channel, when it carried
	 * `ROW_SHARE` of the channel's change. Only the largest is tried: a
	 * smaller value never takes its place. A value that moved further than
	 * the channel is kept, though only a page is a row then. A device whose
	 * share of the channel's change is within `DEVICE_MARGIN_PERCENT` points
	 * of its share of the channel's visits only shows where the channel's
	 * visitors already were, so it is left out. The homepage is the root and
	 * the other addresses of the homepage, added up.
	 *
	 * They are found from the channel's change as the reports count it, also
	 * for a channel's card for its other pages.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The channel.
	 * @return array The values, keyed by `page`, `homepage`, `device` and `visitor_type`, each with `title`, `current`, `previous` and `delta`, or null. The page also has `key`, and its `title` is its path.
	 */
	private function get_reduction( array $channel ) {
		if ( isset( $this->reductions[ $channel['name'] ] ) ) {
			return $this->reductions[ $channel['name'] ];
		}

		$delta     = $channel['reported_delta'];
		$reduction = array(
			'page'         => null,
			'homepage'     => null,
			'device'       => null,
			'visitor_type' => null,
		);

		if ( 0 !== $delta ) {
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

			$devices       = array();
			$visitor_types = array();
			$visits        = 0;

			foreach ( $this->get_channel_rows_of( 'channelBreakdowns', $channel ) as $row ) {
				$visits += (int) $row['current'];

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

			$device = $this->get_reduced_value( $devices, $delta );

			$reduction = array(
				'page'         => $this->get_reduced_value( $pages, $delta ),
				'homepage'     => self::DIRECT_CHANNEL === $channel['key'] ? self::get_homepage_value( $homepage_pages ) : null,
				'device'       => null !== $device && ! self::mirrors_its_visits( $device, $delta, $visits ) ? $device : null,
				'visitor_type' => $this->get_reduced_value( $visitor_types, $delta ),
			);
		}

		$this->reductions[ $channel['name'] ] = $reduction;

		return $reduction;
	}

	/**
	 * Gets the value that moved most with a channel, when it carried
	 * `ROW_SHARE` of the channel's change.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $values The values, each with `title`, `current`, `previous` and `delta`.
	 * @param int   $delta  The channel's change.
	 * @return array|null The value, or null.
	 */
	private function get_reduced_value( array $values, $delta ) {
		$largest = self::get_largest_moving( $values, $delta );

		return null !== $largest && abs( $largest['delta'] ) >= self::ROW_SHARE * abs( $delta ) ? $largest : null;
	}

	/**
	 * Checks whether a device's share of its channel's change is within
	 * `DEVICE_MARGIN_PERCENT` points of its share of the channel's visits.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $device The device, with `current` and `delta`.
	 * @param int   $delta  The channel's change.
	 * @param int   $visits The channel's visits in the selected period, on every device.
	 * @return bool True when it is.
	 */
	private static function mirrors_its_visits( array $device, $delta, $visits ) {
		if ( 0 === $delta || $visits <= 0 ) {
			return false;
		}

		return abs( abs( $device['delta'] ) / abs( $delta ) * 100 - $device['current'] / $visits * 100 ) <= self::DEVICE_MARGIN_PERCENT;
	}

	/**
	 * Tells whether a channel's change was spread across many of its landing
	 * pages: no page that moved with the channel carried `ROW_SHARE` of its
	 * change, the share a page needs to be a row.
	 *
	 * The Change drivers doc treats "no single driver" as a real answer
	 * ("Search fell 1,300, spread across many pages"), and §5.10 has no rule
	 * for it, so it is the plugin's own. Organic Search +169 on oi.ie, from
	 * 3 to 30 September, rose across 233 pages, none by more than 5 visits.
	 *
	 * Every page counts, the homepage and the pages no card names among them,
	 * since a page that can't be named still carried its part of the change.
	 * The homepage's addresses count as one page. The pages that moved with
	 * the channel must add up to at least its change, which puts more than
	 * `1 / ROW_SHARE` of them behind it. A report cut at its row limit can
	 * leave out the pages that carried the change, and then this says
	 * nothing.
	 *
	 * A channel's card for its other pages is measured against what is left
	 * of its change, without the page that took the first card.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $channel The channel.
	 * @return bool True when the change was spread across many pages.
	 */
	private function is_spread_across_pages( array $channel ) {
		$delta = $channel['delta'];

		if ( 0 === $delta ) {
			return false;
		}

		$excluded_key = null === $channel['other_pages'] ? null : $channel['other_pages']['key'];
		$pages        = array();

		foreach ( $this->get_channel_rows_of( 'channelPages', $channel ) as $row ) {
			$path = Page_Classifier::get_path( $row['page'] );
			$key  = Page_Classifier::is_root( $row['page'] ) || Page_Classifier::HOMEPAGE === $this->page_classifier->classify( $path )
				? ''
				: Page_Classifier::get_page_key( $path );

			if ( $excluded_key === $key ) {
				continue;
			}

			self::add_child(
				$pages,
				array(
					'key'   => $key,
					'title' => $key,
				),
				$row
			);
		}

		$moving = array_filter( $pages, fn( $page ) => $page['delta'] * $delta > 0 );
		$moved  = array_sum( array_map( fn( $page ) => abs( $page['delta'] ), $moving ) );

		if ( $moved < abs( $delta ) ) {
			return false;
		}

		$largest = self::get_largest_moving( $moving, $delta );

		return abs( $largest['delta'] ) < self::ROW_SHARE * abs( $delta );
	}

	/**
	 * Gets the posts the insight request lists as recent content: the
	 * `Insight_Request_Builder::MAX_RECENT_CONTENT` published in the period
	 * with the most visits in it, other than the homepage.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of `content` rows, each with `url`, `title` and `current`, its visits in the period.
	 */
	private function get_recent_posts() {
		if ( null !== $this->recent_posts ) {
			return $this->recent_posts;
		}

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

		$this->recent_posts = array_slice( $posts, 0, Insight_Request_Builder::MAX_RECENT_CONTENT );

		return $this->recent_posts;
	}

	/**
	 * Gets the post published in the period at a landing page's address,
	 * among the recent posts. A post whose title `Content_Screen` hides is left
	 * out, though it keeps its place among them, as in the service, which
	 * screens the request's list.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $path The landing page's path.
	 * @return array|null The post, as a `content` row with `url`, `title`, as plain text, which can be empty, and `current`, its visits in the period, or null.
	 */
	private function get_recent_post( $path ) {
		$page_key = Page_Classifier::get_page_key( $path );

		foreach ( $this->get_recent_posts() as $post ) {
			if ( Page_Classifier::get_page_key( $post['url'] ) !== $page_key || ! $this->page_classifier->is_displayable( $post['url'] ) ) {
				continue;
			}

			$title = self::to_plain_text( $post['title'] );

			if ( ! Content_Screen::is_hidden( $title ) ) {
				$post['title'] = $title;

				return $post;
			}
		}

		return null;
	}

	/**
	 * Gets the pages that moved most across every channel: the
	 * `MAX_CROSS_CHANNEL_PAGES` pages a card may name that moved most, each
	 * with the channels it brought visits through.
	 *
	 * A page is named by its title, when its page title is known, or as a
	 * recent post, by the post's title, and by its path otherwise.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of pages, most moved first, then by path. Each has `key`, `path`, `title`, `current`, `previous`, `delta`, and `channels`, the channels whose visits to it moved, most moved first, then by title, each with `key`, `title`, `current`, `previous` and `delta`.
	 */
	private function get_cross_channel_pages() {
		if ( null !== $this->cross_channel_pages ) {
			return $this->cross_channel_pages;
		}

		$pages = array();

		foreach ( $this->get_rows( 'channelPages' ) as $row ) {
			$path = Page_Classifier::get_path( $row['page'] );

			if ( '' === $path || ! $this->page_classifier->is_displayable( $path ) ) {
				continue;
			}

			$key         = Page_Classifier::get_page_key( $path );
			$channel_key = self::get_channel_key( $row['channel'] );

			if ( ! isset( $pages[ $key ] ) ) {
				$pages[ $key ] = array(
					'key'      => $key,
					'path'     => $path,
					'current'  => 0,
					'previous' => 0,
					'channels' => array(),
				);
			}

			$pages[ $key ]['current']  += (int) $row['current'];
			$pages[ $key ]['previous'] += (int) $row['previous'];

			self::add_child(
				$pages[ $key ]['channels'],
				array(
					'key'   => $channel_key,
					'title' => self::get_channel_title( $row['channel'] ),
				),
				$row
			);
		}

		$pages = array_values(
			array_filter(
				array_map(
					function ( $page ) {
						$channels = array_values( array_filter( $page['channels'], fn( $channel ) => 0 !== $channel['delta'] ) );

						usort(
							$channels,
							fn( $first, $second ) => ( abs( $second['delta'] ) <=> abs( $first['delta'] ) ) ?: strcmp( $first['title'], $second['title'] )
						);

						$page['delta']    = $page['current'] - $page['previous'];
						$page['channels'] = $channels;

						return $page;
					},
					$pages
				),
				fn( $page ) => 0 !== $page['delta']
			)
		);

		usort(
			$pages,
			fn( $first, $second ) => ( abs( $second['delta'] ) <=> abs( $first['delta'] ) ) ?: strcmp( $first['path'], $second['path'] )
		);

		$this->cross_channel_pages = array_map(
			function ( $page ) {
				$titles        = $this->get_recent_post_titles();
				$page['title'] = $this->get_page_title( $page['path'] ) ?? ( isset( $titles[ $page['key'] ] ) ? $titles[ $page['key'] ] : $page['path'] );

				return $page;
			},
			array_slice( $pages, 0, self::MAX_CROSS_CHANNEL_PAGES )
		);

		return $this->cross_channel_pages;
	}

	/**
	 * Gets the screened titles of the recent posts, keyed by page key. A post
	 * whose title is empty or hidden is left out.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The titles, keyed by page key.
	 */
	private function get_recent_post_titles() {
		if ( null !== $this->recent_post_titles ) {
			return $this->recent_post_titles;
		}

		$this->recent_post_titles = array();

		foreach ( $this->get_recent_posts() as $post ) {
			$title = self::get_screened_title( $post['title'] );

			if ( null !== $title && $this->page_classifier->is_displayable( $post['url'] ) ) {
				$this->recent_post_titles[ Page_Classifier::get_page_key( $post['url'] ) ] = $title;
			}
		}

		return $this->recent_post_titles;
	}

	/**
	 * Gets the title of the page at a path, as the page title lookup gets it,
	 * as plain text, when `Content_Screen` doesn't hide it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $path The page's path.
	 * @return string|null The title, or null without one.
	 */
	private function get_page_title( $path ) {
		if ( null === $this->page_title_lookup || '' === (string) $path ) {
			return null;
		}

		if ( ! array_key_exists( $path, $this->page_titles ) ) {
			$title = call_user_func( $this->page_title_lookup, $path );

			$this->page_titles[ $path ] = is_string( $title ) ? self::get_screened_title( $title ) : null;
		}

		return $this->page_titles[ $path ];
	}

	/**
	 * Gets a title as plain text, when `Content_Screen` doesn't hide it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $title The title.
	 * @return string|null The title, or null when it is empty or hidden.
	 */
	private static function get_screened_title( $title ) {
		$title = self::to_plain_text( $title );

		return '' === $title || Content_Screen::is_hidden( $title ) ? null : $title;
	}

	/**
	 * Gets a title as plain text, as the service reads one: without its HTML
	 * tags, with its HTML characters decoded and its runs of white space as
	 * one space, at most `MAX_TITLE_LENGTH` characters long, and trimmed.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text The title.
	 * @return string The title as plain text, or the title as it is when it isn't valid UTF-8, which `Content_Screen` hides.
	 */
	private static function to_plain_text( $text ) {
		$text = (string) $text;

		if ( ! preg_match( '//u', $text ) ) {
			return $text;
		}

		// A tag written with HTML characters is a tag once they are decoded.
		for ( $pass = 0; $pass < 2; $pass++ ) {
			$text = html_entity_decode( wp_strip_all_tags( $text ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		}

		$text = str_replace( array( '<', '>' ), ' ', $text );
		$text = (string) preg_replace( '/(?![\x{200C}\x{200D}])[\p{Cf}\p{Co}\p{Cn}]/u', '', $text );
		$text = trim( (string) preg_replace( '/[\p{Cc}\p{Z}\s]+/u', ' ', $text ) );

		if ( preg_match( '/^.{0,' . self::MAX_TITLE_LENGTH . '}/us', $text, $matches ) ) {
			$text = $matches[0];
		}

		return trim( $text );
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
	 * the homepage.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $homepage_rows The rows of `Direct`'s landing pages that are the homepage.
	 * @return array|null The homepage, with `current`, `previous` and `delta`, or null when `Direct` has no homepage row.
	 */
	private static function get_homepage_value( array $homepage_rows ) {
		if ( empty( $homepage_rows ) ) {
			return null;
		}

		$current  = array_sum( array_map( fn( $row ) => (int) $row['current'], $homepage_rows ) );
		$previous = array_sum( array_map( fn( $row ) => (int) $row['previous'], $homepage_rows ) );

		return array(
			'current'  => $current,
			'previous' => $previous,
			'delta'    => $current - $previous,
		);
	}

	/**
	 * Builds a card that moved.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $kind    The card kind, such as `CHANNEL`.
	 * @param string $title   The card's title.
	 * @param array  $figures The card's figures: `current`, the visits of the selected period, `previous`, the visits of the previous period, and `delta`, its change, which is less than their difference by the visits of a page taken out of it.
	 * @param string $role    The card's role, `PRIMARY` or `OFFSET`.
	 * @param array  $share   The card's share, with `share_basis`, null without one, and `traffic_impact_pct`, and `parent_channel` and `parent_channel_delta` for a part that took its channel's place.
	 * @param array  $rows    The card's rows, each with `wire` and `attribute`.
	 * @param array  $marks   Optional. The card's marks: `url`, the path of a page's card, which the panel links its title to, `spread`, whether the card's change was spread across many pages, as `is_spread_across_pages()` tells, which the panel says in place of its rows, and `other_pages`, whether the card is a channel's card for its other pages. Default empty array.
	 * @return array The card, with `key_factor` and `wire`. The `key_factor`'s `previous` is its `current` less its change. It has the share's basis as `shareBasis`, and the part's channel's title and change as `parentChannel` and `parentChannelChange`. A page's `key_factor` also has its path as `url`, a card whose change was spread across many pages has `spreadAcrossPages`, and a channel's card for its other pages has `otherPages`.
	 */
	private function build_card( $kind, $title, array $figures, $role, array $share, array $rows, array $marks = array() ) {
		list( $dimension, $entity_kind ) = self::CARD_KINDS[ $kind ];

		$current     = (int) $figures['current'];
		$delta       = (int) $figures['delta'];
		$excess      = $this->get_excess( $delta, $figures['previous'] );
		$gross       = $this->gain + $this->loss;
		$other_pages = ! empty( $marks['other_pages'] );
		$wire        = array(
			'dimension'   => $dimension,
			'entity_kind' => $entity_kind,
			// The service's title says the card's change is of the channel's
			// other pages, so it never reads as the channel's total.
			'title'       => $other_pages ? $title . self::OTHER_PAGES_SUFFIX : $title,
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

		// A card without a share basis has no share, which the service reads
		// from a missing `share_basis`.
		if ( null !== $share['share_basis'] ) {
			$wire['share_basis'] = $share['share_basis'];
		}

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
			'previous'   => $current - $delta,
			'sharePct'   => $share['traffic_impact_pct'],
			'shareBasis' => $share['share_basis'],
		);

		// A card that took its channel's place names the channel, so the
		// panel can say where the card's change came from.
		if ( isset( $share['parent_channel'] ) ) {
			$key_factor['parentChannel']       = $share['parent_channel'];
			$key_factor['parentChannelChange'] = $share['parent_channel_delta'];
		}

		$key_factor['attributes'] = array_column( $rows, 'attribute' );

		if ( isset( $marks['url'] ) ) {
			$key_factor['url'] = $marks['url'];
		}

		// The service's decomposition has no such field (§5.10), so only the
		// panel's card has it.
		if ( ! empty( $marks['spread'] ) ) {
			$key_factor['spreadAcrossPages'] = true;
		}

		// The panel names the channel's other pages in its own words.
		if ( $other_pages ) {
			$key_factor['otherPages'] = true;
		}

		return array(
			'wire'       => $wire,
			'key_factor' => $key_factor,
		);
	}

	/**
	 * Gets the share of a card that moved.
	 *
	 * A flat period has no rise or drop for a card's change to be a share of,
	 * so a card of a flat period has no share, and shows its change alone.
	 * Otherwise, an offsetting card's share is how much of the site's net
	 * change it offset, and `0` when it would reach
	 * `NET_CHANGE_SHARE_LIMIT_PERCENT`, so it never reads as all of the
	 * change. A primary card's share is of the movement in its own direction,
	 * or of the site's traffic when that movement can't hold it. The movement
	 * in the site's own direction doesn't count when it is under
	 * `MINIMUM_POOL_SHARE` of the site's net change, which happens when the
	 * channels count fewer visits than the site.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $delta            The card's change.
	 * @param string $role             The card's role.
	 * @param string $period_direction The period's direction.
	 * @return array The share, with `share_basis`, `NET_CHANGE`, `GROSS_CHANGE`, `SITE_TRAFFIC`, or null without one, and `traffic_impact_pct`.
	 */
	private function get_card_share( $delta, $role, $period_direction ) {
		if ( 'STABLE' === $period_direction ) {
			return array(
				'share_basis'        => null,
				'traffic_impact_pct' => 0.0,
			);
		}

		$total_delta = $this->closing - $this->opening;

		if ( 'OFFSET' === $role ) {
			$share_percent = 0 === $total_delta ? 0.0 : self::round1( abs( $delta ) / abs( $total_delta ) * 100 );

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

		$pool = $delta < 0 ? $loss : $gain;

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
	 * card, the largest primary card, so the side the period leaned towards
	 * reads as the smaller story.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $cards The cards, as `sort_cards()` sorts them.
	 * @return bool True when one does.
	 */
	private function has_larger_offset( array $cards ) {
		if ( empty( $cards ) ) {
			return false;
		}

		$lead_change = abs( $cards[0]['wire']['delta'] );

		foreach ( $cards as $card ) {
			if ( 'OFFSET' === $card['wire']['role'] && abs( $card['wire']['delta'] ) > $lead_change ) {
				return true;
			}
		}

		return false;
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
	 * Gets the rows of a breakdown of one channel.
	 *
	 * As the service matches them, a campaign is matched to the channel by
	 * the channel's key, so also under another name of it, and any other row
	 * by the channel's name in Analytics, in any case.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $contextual_data_key The key of the breakdown, such as `channelPages`.
	 * @param array  $channel             The channel.
	 * @return array List of rows.
	 */
	private function get_channel_rows_of( $contextual_data_key, array $channel ) {
		$by_key = 'channelCampaigns' === $contextual_data_key;

		return array_values(
			array_filter(
				$this->get_rows( $contextual_data_key ),
				fn( $row ) => $by_key
					? self::get_channel_key( $row['channel'] ) === $channel['key']
					: self::get_key( $row['channel'] ) === $channel['name']
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
	 * @param array  $extra     Optional. The attribute's other fields, such as `title`. Default empty array.
	 * @return array The attribute.
	 */
	private static function get_attribute( $kind, $label, $current, $previous, $share_pct, $oversized = false, array $extra = array() ) {
		return array_merge(
			array(
				'kind'      => $kind,
				'label'     => $label,
				'current'   => (int) $current,
				'previous'  => (int) $previous,
				'sharePct'  => $share_pct,
				'oversized' => $oversized,
			),
			$extra
		);
	}

	/**
	 * Gets the key a source or a campaign is matched by: its name in lower
	 * case, trimmed.
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
	 * Gets the key a channel is matched by: its name in Analytics in lower
	 * case, also when it is known by another name, such as `Uncategorized
	 * traffic` for `Unassigned`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The channel's name.
	 * @return string The key.
	 */
	private static function get_channel_key( $name ) {
		$key    = self::get_key( $name );
		$led_by = strpos( $key, ' (led by ' );

		if ( false !== $led_by ) {
			$key = trim( substr( $key, 0, $led_by ) );
		}

		return isset( self::CHANNEL_ALIASES[ $key ] ) ? self::CHANNEL_ALIASES[ $key ] : $key;
	}

	/**
	 * Gets the title the service gives a channel, such as `Cross-network ads`
	 * for Analytics' `Cross-network`, which is its name for any channel it
	 * doesn't rename.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The channel's name.
	 * @return string The title.
	 */
	private static function get_channel_title( $name ) {
		$key = self::get_key( $name );

		return isset( self::CHANNEL_TITLES[ $key ] ) ? self::CHANNEL_TITLES[ $key ] : trim( (string) $name );
	}

	/**
	 * Scales a count tuned on 28 days to the length of the period, as
	 * `round( count × d / 28 )`, at least 1.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $count          The count over 28 days.
	 * @param int $days_in_period The number of days in the period.
	 * @return int The count over the period.
	 */
	private static function scale_count( $count, $days_in_period ) {
		return max( 1, (int) round( $count * $days_in_period / 28 ) );
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
	 * Checks whether a row's figure didn't change.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $row The row, with `current` and `previous`.
	 * @return bool True when it didn't.
	 */
	private static function is_unchanged( array $row ) {
		return (int) $row['current'] === (int) $row['previous'];
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
		return self::round_half_away( $value * 10 ) / 10;
	}

	/**
	 * Rounds a number to a whole number, half away from zero, without a
	 * negative zero, as Go's `math.Round()`, which the service rounds with.
	 *
	 * It rounds the number exactly as it is, so `637.4999…`, ten times the
	 * share 51 of 80 visits comes out as, is 637. PHP's `round()` would first
	 * round it to 15 significant digits, 637.5, and then to 638.
	 *
	 * @since n.e.x.t
	 *
	 * @param float $value The number.
	 * @return float The rounded number.
	 */
	private static function round_half_away( $value ) {
		$size      = abs( $value );
		$truncated = floor( $size );
		$rounded   = $size - $truncated >= 0.5 ? $truncated + 1 : $truncated;

		// `-0.0` equals `0.0`, so this returns a positive zero for both.
		if ( 0.0 === $rounded ) {
			return 0.0;
		}

		return $value < 0 ? -$rounded : $rounded;
	}
}
