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
 * Picks the key factor cards of the benchmarking response: the drivers that
 * explain most of the site's change in visits, each with the values inside it
 * that moved most.
 *
 * A driver is a channel, a landing page, a search keyword, a referring site or
 * a campaign. A device or a visitor type only ever describes a driver, as one
 * of its attributes, since it describes visits that a driver already counts.
 *
 * Picking takes two steps, since some attributes of a landing page, a campaign
 * or a referring site come from reports filtered on it. `select_drivers()`
 * picks the drivers, the response builder runs the reports that
 * `get_driver_reports()` names for each of them, and `build()` gives each
 * driver its attributes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Key_Factors {

	/**
	 * The most cards the response has.
	 *
	 * @since n.e.x.t
	 */
	const MAX_CARDS = 3;

	/**
	 * The most attributes a card has.
	 *
	 * @since n.e.x.t
	 */
	const MAX_ATTRIBUTES = 2;

	/**
	 * The smallest change, in visits or clicks, a landing page, a search
	 * keyword, a referring site or a campaign needs to become a card. Below it,
	 * its channel is the accurate thing to name.
	 *
	 * @since n.e.x.t
	 */
	const ELEVATION_MINIMUM_DELTA = 10;

	/**
	 * The smallest share of the site's change, in percent, a landing page, a
	 * search keyword, a referring site or a campaign needs to become a card.
	 *
	 * @since n.e.x.t
	 */
	const ELEVATION_MINIMUM_SHARE_PERCENT = 15;

	/**
	 * How many percentage points a device's or a visitor type's own change must
	 * differ from its card's change to be an attribute. A device that changed as
	 * much as its card only shows where the card's visitors already were.
	 *
	 * @since n.e.x.t
	 */
	const ATTRIBUTE_MINIMUM_DIVERGENCE_PERCENT = 5;

	/**
	 * The channel of every search keyword's visits.
	 *
	 * @since n.e.x.t
	 */
	const SEARCH_CHANNEL = 'Organic Search';

	/**
	 * The channels whose sources are referring sites. A source of any other
	 * channel, such as a paid one, is a platform.
	 *
	 * @since n.e.x.t
	 */
	const REFERRING_SITE_CHANNELS = array( 'Referral', 'Organic Social' );

	/**
	 * The sources Analytics reports for Facebook, which count as one referring
	 * site, so a rise split across them counts as one site's rise.
	 *
	 * @since n.e.x.t
	 */
	const FACEBOOK_SOURCES = array( 'facebook.com', 'm.facebook.com', 'l.facebook.com', 'lm.facebook.com', 'fb' );

	/**
	 * The label of the referring site that `FACEBOOK_SOURCES` count as.
	 *
	 * @since n.e.x.t
	 */
	const FACEBOOK_LABEL = 'Facebook';

	/**
	 * The paid channels of the default channel grouping.
	 *
	 * @since n.e.x.t
	 */
	const PAID_CHANNELS = array( 'Paid Search', 'Paid Social', 'Paid Shopping', 'Paid Video', 'Paid Other', 'Display', 'Cross-network' );

	/**
	 * The attribute kinds a channel card can show, in the order that breaks a
	 * tie, keyed by channel. A paid channel takes `PAID_CHANNEL_ATTRIBUTE_KINDS`,
	 * and any other channel takes `OTHER_CHANNEL_ATTRIBUTE_KINDS`.
	 *
	 * @since n.e.x.t
	 */
	const CHANNEL_ATTRIBUTE_KINDS = array(
		'Organic Search' => array( 'SEARCH_KEYWORD', 'LANDING_PAGE', 'USER_TYPE', 'DEVICE' ),
		// A direct visit has no referrer to name, so the page it lands on is
		// the clue that is left.
		'Direct'         => array( 'LANDING_PAGE', 'USER_TYPE', 'DEVICE' ),
		'Referral'       => array( 'REFERRING_SITE', 'LANDING_PAGE', 'USER_TYPE', 'DEVICE' ),
		'Organic Social' => array( 'REFERRING_SITE', 'CAMPAIGN', 'LANDING_PAGE', 'USER_TYPE', 'DEVICE' ),
		'Email'          => array( 'CAMPAIGN', 'LANDING_PAGE', 'USER_TYPE', 'DEVICE' ),
		'Organic Video'  => array( 'PLATFORM', 'LANDING_PAGE', 'DEVICE' ),
		'Unassigned'     => array( 'LANDING_PAGE' ),
	);

	/**
	 * The attribute kinds a paid channel's card can show, in the order that
	 * breaks a tie.
	 *
	 * @since n.e.x.t
	 */
	const PAID_CHANNEL_ATTRIBUTE_KINDS = array( 'CAMPAIGN', 'PLATFORM', 'USER_TYPE', 'LANDING_PAGE', 'DEVICE' );

	/**
	 * The attribute kinds the card of a channel that `CHANNEL_ATTRIBUTE_KINDS`
	 * doesn't list can show, in the order that breaks a tie.
	 *
	 * @since n.e.x.t
	 */
	const OTHER_CHANNEL_ATTRIBUTE_KINDS = array( 'LANDING_PAGE', 'USER_TYPE', 'DEVICE' );

	/**
	 * The attribute kinds the card of each other driver kind can show, in the
	 * order that breaks a tie.
	 *
	 * @since n.e.x.t
	 */
	const DRIVER_ATTRIBUTE_KINDS = array(
		'CONTENT'        => array( 'TRAFFIC_CHANNEL', 'SEARCH_KEYWORD', 'USER_TYPE', 'DEVICE', 'REFERRING_SITE' ),
		'CAMPAIGN'       => array( 'TRAFFIC_CHANNEL', 'LANDING_PAGE', 'USER_TYPE', 'DEVICE' ),
		'REFERRING_SITE' => array( 'LANDING_PAGE', 'USER_TYPE', 'DEVICE' ),
		'SEARCH_KEYWORD' => array( 'LANDING_PAGE', 'DEVICE' ),
	);

	/**
	 * Where a card's visits broken down by each attribute kind come from,
	 * keyed by `{driver kind}:{attribute kind}`. Each entry lists the
	 * contextual data key or the name of one of the driver's own reports, the
	 * field that names the driver in its rows, or null when every row counts,
	 * and the field that names the attribute's value.
	 *
	 * A channel takes every attribute from the contextual data. A landing page
	 * takes its channels and its search keywords from the contextual data, and
	 * the rest from its own reports, as do a campaign and a referring site. A
	 * search keyword's attributes count its clicks.
	 *
	 * @since n.e.x.t
	 */
	const ATTRIBUTE_ROWS = array(
		'CHANNEL:SEARCH_KEYWORD'      => array( 'searchQueries', null, 'label' ),
		'CHANNEL:LANDING_PAGE'        => array( 'channelPages', 'channel', 'page' ),
		'CHANNEL:USER_TYPE'           => array( 'channelBreakdowns', 'channel', 'userType' ),
		'CHANNEL:DEVICE'              => array( 'channelBreakdowns', 'channel', 'device' ),
		'CHANNEL:REFERRING_SITE'      => array( 'channelSources', 'channel', 'source' ),
		'CHANNEL:PLATFORM'            => array( 'channelSources', 'channel', 'source' ),
		'CHANNEL:CAMPAIGN'            => array( 'channelCampaigns', 'channel', 'campaign' ),
		'CONTENT:TRAFFIC_CHANNEL'     => array( 'channelPages', 'page', 'channel' ),
		'CONTENT:SEARCH_KEYWORD'      => array( 'searchQueryPages', 'page', 'query' ),
		'CONTENT:USER_TYPE'           => array( 'audience', null, 'userType' ),
		'CONTENT:DEVICE'              => array( 'audience', null, 'device' ),
		'CONTENT:REFERRING_SITE'      => array( 'sources', null, 'source' ),
		'CAMPAIGN:TRAFFIC_CHANNEL'    => array( 'channelCampaigns', 'campaign', 'channel' ),
		'CAMPAIGN:LANDING_PAGE'       => array( 'pages', null, 'page' ),
		'CAMPAIGN:USER_TYPE'          => array( 'audience', null, 'userType' ),
		'CAMPAIGN:DEVICE'             => array( 'audience', null, 'device' ),
		'REFERRING_SITE:LANDING_PAGE' => array( 'pages', null, 'page' ),
		'REFERRING_SITE:USER_TYPE'    => array( 'audience', null, 'userType' ),
		'REFERRING_SITE:DEVICE'       => array( 'audience', null, 'device' ),
		'SEARCH_KEYWORD:LANDING_PAGE' => array( 'searchQueryPages', 'query', 'page' ),
		'SEARCH_KEYWORD:DEVICE'       => array( 'searchQueryDevices', 'query', 'device' ),
	);

	/**
	 * The reports filtered on a driver that its attributes need, keyed by
	 * driver kind. `audience` counts the driver's visits by device and visitor
	 * type, `sources` by channel and source, and `pages` by landing page. A
	 * channel and a search keyword take every attribute from the contextual
	 * data, so they need none.
	 *
	 * @since n.e.x.t
	 */
	const DRIVER_REPORTS = array(
		'CONTENT'        => array( 'audience', 'sources' ),
		'CAMPAIGN'       => array( 'audience', 'pages' ),
		'REFERRING_SITE' => array( 'audience', 'pages' ),
	);

	/**
	 * The rows the drivers are picked from, keyed by contextual data key.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $contextual_data;

	/**
	 * Row_Scorer instance, which scores and drops the candidates.
	 *
	 * @since n.e.x.t
	 * @var Row_Scorer
	 */
	private $row_scorer;

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
	 * Constructor.
	 *
	 * The site's visits are the sum of the `channelBreakdowns` rows, so a
	 * candidate's change is compared with the same visits that the channels
	 * split into.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by contextual data key, as `Contextual_Data_Validator::validate()` returns them.
	 */
	public function __construct( array $contextual_data ) {
		$this->contextual_data = $contextual_data;

		$site_visits = array(
			'current'  => 0,
			'previous' => 0,
		);

		// A session has exactly one channel, so the channels' rises less their
		// falls are the site's own change.
		foreach ( self::sum_by( $this->get_rows( 'channelBreakdowns' ), 'channel' ) as $channel ) {
			$delta = $channel['current'] - $channel['previous'];

			$site_visits['current']  += $channel['current'];
			$site_visits['previous'] += $channel['previous'];

			if ( $delta > 0 ) {
				$this->gain += $delta;
			} else {
				$this->loss -= $delta;
			}
		}

		$this->row_scorer = new Row_Scorer( $site_visits['current'], $site_visits['previous'] );
	}

	/**
	 * Picks the drivers of the cards.
	 *
	 * Every channel, landing page, search keyword, referring site and campaign
	 * is a candidate. A candidate whose value is a placeholder, such as
	 * `(not set)`, or that `Row_Scorer` drops, is left out. A landing page, a
	 * search keyword, a referring site or a campaign also needs
	 * `ELEVATION_MINIMUM_DELTA` and `ELEVATION_MINIMUM_SHARE_PERCENT`, and one
	 * that has both takes its parent channel out of the candidates when both
	 * moved the same way, so the same visits are never two cards. The
	 * candidates left are ranked by score,
	 * then by the position of their kind in `Wire_Format::KEY_FACTOR_KINDS`,
	 * then by label, and the first `MAX_CARDS` are the drivers.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of drivers, in rank order. Each has `kind`, `label`, `current`, `previous` and `sharePct`. A referring site also has `sources`, the values of `sessionSource` it counts.
	 */
	public function select_drivers() {
		$candidates = array_merge(
			$this->get_candidates( 'CHANNEL', self::sum_by( $this->get_rows( 'channelBreakdowns' ), 'channel' ) ),
			$this->get_candidates( 'CONTENT', self::sum_by( $this->get_rows( 'channelPages' ), 'page' ) ),
			$this->get_candidates( 'SEARCH_KEYWORD', self::sum_by( $this->get_rows( 'searchQueries' ), 'label' ) ),
			$this->get_candidates( 'REFERRING_SITE', $this->sum_by_site( $this->get_referring_site_rows( $this->get_rows( 'channelSources' ) ) ) ),
			$this->get_candidates( 'CAMPAIGN', self::sum_by( $this->get_rows( 'channelCampaigns' ), 'campaign' ) )
		);

		$channel_changes = array();

		foreach ( self::sum_by( $this->get_rows( 'channelBreakdowns' ), 'channel' ) as $channel ) {
			$channel_changes[ $channel['label'] ] = $channel['current'] - $channel['previous'];
		}

		$suppressed_channels = array();

		foreach ( $candidates as $candidate ) {
			if ( 'CHANNEL' === $candidate['kind'] ) {
				continue;
			}

			$parent_channel = $this->get_parent_channel( $candidate );

			// A driver that moved against its channel is no part of the
			// channel's change, so the channel stays a candidate. A page that
			// fell while its channel grew would otherwise hide the growth.
			if ( isset( $channel_changes[ $parent_channel ] ) && $channel_changes[ $parent_channel ] * ( $candidate['current'] - $candidate['previous'] ) > 0 ) {
				$suppressed_channels[] = $parent_channel;
			}
		}

		$candidates = array_filter(
			$candidates,
			fn( $candidate ) => 'CHANNEL' !== $candidate['kind'] || ! in_array( $candidate['label'], $suppressed_channels, true )
		);

		// `usort()` isn't stable on PHP 7.4. So the kind and the label order
		// candidates with the same score, to come back in the same order on
		// every run.
		usort(
			$candidates,
			fn( $first, $second ) => ( $second['score'] <=> $first['score'] )
				?: ( Wire_Format::KEY_FACTOR_KINDS[ $first['kind'] ] - Wire_Format::KEY_FACTOR_KINDS[ $second['kind'] ] )
				?: strcmp( $first['label'], $second['label'] )
		);

		return array_map(
			function ( $candidate ) {
				$driver = array(
					'kind'     => $candidate['kind'],
					'label'    => $candidate['label'],
					'current'  => $candidate['current'],
					'previous' => $candidate['previous'],
					'sharePct' => $candidate['sharePct'],
				);

				if ( 'REFERRING_SITE' === $candidate['kind'] ) {
					$driver['sources'] = $this->get_site_sources( $candidate['label'] );
				}

				return $driver;
			},
			array_slice( $candidates, 0, self::MAX_CARDS )
		);
	}

	/**
	 * Gets the reports filtered on a driver that its attributes need.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $driver A driver, as `select_drivers()` returns it.
	 * @return array List of report names: `audience`, `sources` or `pages`. Empty when the driver needs none.
	 */
	public static function get_driver_reports( array $driver ) {
		return isset( self::DRIVER_REPORTS[ $driver['kind'] ] ) ? self::DRIVER_REPORTS[ $driver['kind'] ] : array();
	}

	/**
	 * Gets the dimension filters that keep only a driver's visits.
	 *
	 * A referring site's visits are those of its sources through a referring
	 * site channel, so its attributes are parts of its own visits.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $driver A driver, as `select_drivers()` returns it.
	 * @return array The dimension filters, keyed by dimension name, each a list of the values to keep. Empty for a channel or a search keyword.
	 */
	public static function get_driver_filters( array $driver ) {
		switch ( $driver['kind'] ) {
			case 'CONTENT':
				return array( 'landingPage' => array( $driver['label'] ) );
			case 'CAMPAIGN':
				return array( 'sessionCampaignName' => array( $driver['label'] ) );
			case 'REFERRING_SITE':
				return array(
					'sessionSource'                 => $driver['sources'],
					'sessionDefaultChannelGrouping' => self::REFERRING_SITE_CHANNELS,
				);
			default:
				return array();
		}
	}

	/**
	 * Builds the cards from the drivers, each with its attributes.
	 *
	 * A card can show the attribute kinds its driver lists, in
	 * `CHANNEL_ATTRIBUTE_KINDS` or `DRIVER_ATTRIBUTE_KINDS`. Each kind is
	 * represented by its value that moved most in the card's direction, and
	 * the `MAX_ATTRIBUTES` kinds whose values moved most are the card's
	 * attributes. A value qualifies when it moved in the card's direction by at
	 * least `Row_Scorer::MINIMUM_ABSOLUTE_DELTA` and isn't a placeholder. A
	 * device or a visitor type also needs its own change to differ from the
	 * card's by `ATTRIBUTE_MINIMUM_DIVERGENCE_PERCENT`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $drivers        The drivers, as `select_drivers()` returns them.
	 * @param array $driver_reports Optional. The rows of each driver's reports, keyed by the driver's position in `$drivers`, then by report name. An `audience` row has `device` and `userType`, a `sources` row has `channel` and `source`, and a `pages` row has `page`. Each row also has `current` and `previous`. Default empty array.
	 * @return array List of cards, in rank order. Each has `kind`, `label`, `current`, `previous`, `sharePct` and `attributes`, at most `MAX_ATTRIBUTES`, most moved first. Each attribute has `kind`, `label`, `current`, `previous` and `sharePct`.
	 */
	public function build( array $drivers, array $driver_reports = array() ) {
		$cards = array();

		foreach ( array_values( $drivers ) as $index => $driver ) {
			$cards[] = array(
				'kind'       => $driver['kind'],
				'label'      => $driver['label'],
				'current'    => $driver['current'],
				'previous'   => $driver['previous'],
				'sharePct'   => $driver['sharePct'],
				'attributes' => $this->get_attributes( $driver, isset( $driver_reports[ $index ] ) ? $driver_reports[ $index ] : array() ),
			);
		}

		return $cards;
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

			$sums[ $label ]['current']  += $row['current'];
			$sums[ $label ]['previous'] += $row['previous'];
		}

		return array_values( $sums );
	}

	/**
	 * Gets the candidates of one kind, each with its share and its score.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $kind The kind of the candidates, such as `CHANNEL`.
	 * @param array  $rows The candidates' visits, or clicks for a search keyword, each with `label`, `current` and `previous`.
	 * @return array List of the candidates that stay, each with `kind`, `label`, `current`, `previous`, `sharePct` and `score`.
	 */
	private function get_candidates( $kind, array $rows ) {
		$candidates = array();

		foreach ( $rows as $row ) {
			if ( Insight_Request_Builder::is_placeholder( $row['label'] ) || $this->row_scorer->is_excluded_row( $row ) ) {
				continue;
			}

			$delta     = $row['current'] - $row['previous'];
			$share_pct = $this->get_share_percent( $delta );

			if ( 'CHANNEL' !== $kind && ( abs( $delta ) < self::ELEVATION_MINIMUM_DELTA || $share_pct < self::ELEVATION_MINIMUM_SHARE_PERCENT ) ) {
				continue;
			}

			$candidates[] = array(
				'kind'     => $kind,
				'label'    => $row['label'],
				'current'  => $row['current'],
				'previous' => $row['previous'],
				'sharePct' => $share_pct,
				'score'    => $this->row_scorer->score_row( $kind, $row ),
			);
		}

		return $candidates;
	}

	/**
	 * Gets a change as a share of the site's change in the same direction: of
	 * every channel's rise for a rise, and of every channel's fall for a fall.
	 *
	 * A channel that fell on a growing site is a share of everything the site
	 * lost, rather than a negative share of its net gain.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $delta The change, in visits or clicks.
	 * @return float The share in percent, at most `100`, rounded to `Wire_Format::SHARE_DECIMAL_PLACES`, or `0` when the site has no change in that direction.
	 */
	private function get_share_percent( $delta ) {
		$basis = $delta > 0 ? $this->gain : $this->loss;

		if ( $basis <= 0 ) {
			return 0.0;
		}

		return round( min( 100, abs( $delta ) * 100 / $basis ), Wire_Format::SHARE_DECIMAL_PLACES );
	}

	/**
	 * Gets the channel a landing page, a search keyword, a referring site or a
	 * campaign takes out of the candidates.
	 *
	 * A search keyword's channel is `SEARCH_CHANNEL`. Any other driver's channel
	 * is the one whose share of the driver moved most in the driver's direction,
	 * and the channel name breaks a tie.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $candidate The candidate, with `kind`, `label`, `current` and `previous`.
	 * @return string|null The channel, or null when the driver has no channel rows.
	 */
	private function get_parent_channel( array $candidate ) {
		switch ( $candidate['kind'] ) {
			case 'SEARCH_KEYWORD':
				return self::SEARCH_CHANNEL;
			case 'CONTENT':
				$channels = self::sum_by( $this->get_rows( 'channelPages', 'page', $candidate['label'] ), 'channel' );
				break;
			case 'CAMPAIGN':
				$channels = self::sum_by( $this->get_rows( 'channelCampaigns', 'campaign', $candidate['label'] ), 'channel' );
				break;
			case 'REFERRING_SITE':
				$channels = self::sum_by( $this->get_site_rows( $candidate['label'] ), 'channel' );
				break;
			default:
				return null;
		}

		$direction = $candidate['current'] >= $candidate['previous'] ? 1 : -1;

		usort(
			$channels,
			fn( $first, $second ) => ( ( $second['current'] - $second['previous'] ) * $direction <=> ( $first['current'] - $first['previous'] ) * $direction )
				?: strcmp( $first['label'], $second['label'] )
		);

		return empty( $channels ) ? null : $channels[0]['label'];
	}

	/**
	 * Gets the attribute kinds a driver's card can show.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $driver The driver, with `kind` and `label`.
	 * @return array List of attribute kinds, in the order that breaks a tie.
	 */
	private function get_attribute_kinds( array $driver ) {
		if ( 'CHANNEL' !== $driver['kind'] ) {
			return isset( self::DRIVER_ATTRIBUTE_KINDS[ $driver['kind'] ] ) ? self::DRIVER_ATTRIBUTE_KINDS[ $driver['kind'] ] : array();
		}

		if ( isset( self::CHANNEL_ATTRIBUTE_KINDS[ $driver['label'] ] ) ) {
			return self::CHANNEL_ATTRIBUTE_KINDS[ $driver['label'] ];
		}

		return in_array( $driver['label'], self::PAID_CHANNELS, true ) ? self::PAID_CHANNEL_ATTRIBUTE_KINDS : self::OTHER_CHANNEL_ATTRIBUTE_KINDS;
	}

	/**
	 * Gets the attributes of a driver's card.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $driver  The driver, as `select_drivers()` returns it.
	 * @param array $reports The rows of the driver's reports, keyed by report name.
	 * @return array List of attributes, at most `MAX_ATTRIBUTES`, most moved first.
	 */
	private function get_attributes( array $driver, array $reports ) {
		$representatives = array();

		foreach ( $this->get_attribute_kinds( $driver ) as $position => $kind ) {
			$value = $this->get_attribute_value( $driver, $kind, $this->get_attribute_rows( $driver, $kind, $reports ) );

			if ( null !== $value ) {
				$representatives[] = array(
					'position' => $position,
					'kind'     => $kind,
					'value'    => $value,
				);
			}
		}

		usort(
			$representatives,
			fn( $first, $second ) => ( abs( $second['value']['current'] - $second['value']['previous'] ) <=> abs( $first['value']['current'] - $first['value']['previous'] ) )
				?: $first['position'] - $second['position']
		);

		return array_map(
			fn( $representative ) => array(
				'kind'     => $representative['kind'],
				'label'    => $representative['value']['label'],
				'current'  => $representative['value']['current'],
				'previous' => $representative['value']['previous'],
				'sharePct' => $this->get_share_percent( $representative['value']['current'] - $representative['value']['previous'] ),
			),
			array_slice( $representatives, 0, self::MAX_ATTRIBUTES )
		);
	}

	/**
	 * Gets the value that represents an attribute kind on a driver's card: the
	 * qualifying value that moved most, with the label breaking a tie.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $driver The driver, with `current` and `previous`.
	 * @param string $kind   The attribute kind, such as `DEVICE`.
	 * @param array  $rows   The driver's visits broken down by the attribute, each with `label`, `current` and `previous`.
	 * @return array|null The value, with `label`, `current` and `previous`, or null when no value qualifies.
	 */
	private function get_attribute_value( array $driver, $kind, array $rows ) {
		$direction      = $driver['current'] >= $driver['previous'] ? 1 : -1;
		$driver_change  = Row_Scorer::get_self_change_percent( $driver );
		$is_audience    = in_array( $kind, array( 'DEVICE', 'USER_TYPE' ), true );
		$representative = null;

		foreach ( $rows as $row ) {
			$delta = $row['current'] - $row['previous'];

			if ( Insight_Request_Builder::is_placeholder( $row['label'] ) || $delta * $direction < Row_Scorer::MINIMUM_ABSOLUTE_DELTA ) {
				continue;
			}

			if ( $is_audience && abs( Row_Scorer::get_self_change_percent( $row ) - $driver_change ) < self::ATTRIBUTE_MINIMUM_DIVERGENCE_PERCENT ) {
				continue;
			}

			if ( null === $representative ) {
				$representative = $row;
				continue;
			}

			$representative_delta = abs( $representative['current'] - $representative['previous'] );

			if ( abs( $delta ) > $representative_delta || ( abs( $delta ) === $representative_delta && strcmp( $row['label'], $representative['label'] ) < 0 ) ) {
				$representative = $row;
			}
		}

		return $representative;
	}

	/**
	 * Gets a driver's visits broken down by an attribute kind.
	 *
	 * The visits of a driver's card come from `ATTRIBUTE_ROWS`. A source is
	 * counted as the referring site it belongs to, and the sources of a
	 * landing page's own report count only its visits through a referring site
	 * channel, since its other sources are platforms.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $driver  The driver, with `kind` and `label`.
	 * @param string $kind    The attribute kind, such as `LANDING_PAGE`.
	 * @param array  $reports The rows of the driver's reports, keyed by report name.
	 * @return array List of values, each with `label`, `current` and `previous`.
	 */
	private function get_attribute_rows( array $driver, $kind, array $reports ) {
		$rows_key = "{$driver['kind']}:{$kind}";

		if ( ! isset( self::ATTRIBUTE_ROWS[ $rows_key ] ) ) {
			return array();
		}

		list( $source, $driver_field, $field ) = self::ATTRIBUTE_ROWS[ $rows_key ];

		if ( in_array( $source, array( 'audience', 'sources', 'pages' ), true ) ) {
			$rows = isset( $reports[ $source ] ) ? $reports[ $source ] : array();
		} else {
			$rows = $this->get_rows( $source, $driver_field, null === $driver_field ? null : $driver['label'] );
		}

		if ( 'source' !== $field ) {
			return self::sum_by( $rows, $field );
		}

		return $this->sum_by_site( 'CHANNEL' === $driver['kind'] ? $rows : $this->get_referring_site_rows( $rows ) );
	}

	/**
	 * Gets the rows of a contextual data key, optionally only those with one
	 * value of a field.
	 *
	 * @since n.e.x.t
	 *
	 * @param string      $contextual_data_key The key, such as `channelPages`.
	 * @param string|null $field               Optional. The field to match. Default null, for every row.
	 * @param string|null $value               Optional. The value the field must have. Default null.
	 * @return array List of rows.
	 */
	private function get_rows( $contextual_data_key, $field = null, $value = null ) {
		$rows = isset( $this->contextual_data[ $contextual_data_key ] ) ? $this->contextual_data[ $contextual_data_key ] : array();

		if ( null === $field ) {
			return array_values( $rows );
		}

		return array_values(
			array_filter(
				$rows,
				fn( $row ) => $row[ $field ] === $value
			)
		);
	}

	/**
	 * Keeps the rows of a channel and source breakdown whose channel's sources
	 * are referring sites.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $rows The rows, each with `channel` and `source`.
	 * @return array List of the rows of `REFERRING_SITE_CHANNELS`.
	 */
	private function get_referring_site_rows( array $rows ) {
		return array_values(
			array_filter(
				$rows,
				fn( $row ) => in_array( $row['channel'], self::REFERRING_SITE_CHANNELS, true )
			)
		);
	}

	/**
	 * Gets the `channelSources` rows of one referring site.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $site The referring site, as `get_site_label()` names it.
	 * @return array List of the rows of the site's sources through `REFERRING_SITE_CHANNELS`.
	 */
	private function get_site_rows( $site ) {
		return array_values(
			array_filter(
				$this->get_referring_site_rows( $this->get_rows( 'channelSources' ) ),
				fn( $row ) => self::get_site_label( $row['source'] ) === $site
			)
		);
	}

	/**
	 * Gets the values of `sessionSource` a referring site counts.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $site The referring site, as `get_site_label()` names it.
	 * @return array List of sources, sorted, so the reports filtered on them are the same on every run.
	 */
	private function get_site_sources( $site ) {
		$sources = array_values( array_unique( array_column( $this->get_site_rows( $site ), 'source' ) ) );

		sort( $sources, SORT_STRING );

		return $sources;
	}

	/**
	 * Adds up the visits of the rows of each referring site.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $rows The rows, each with `source`, `current` and `previous`.
	 * @return array List of sums, one per site, each with the site as `label`, `current` and `previous`.
	 */
	private function sum_by_site( array $rows ) {
		return self::sum_by(
			array_map(
				fn( $row ) => array(
					'site'     => self::get_site_label( $row['source'] ),
					'current'  => $row['current'],
					'previous' => $row['previous'],
				),
				$rows
			),
			'site'
		);
	}

	/**
	 * Gets the referring site a source counts as.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $source The value of `sessionSource`.
	 * @return string `FACEBOOK_LABEL` for one of `FACEBOOK_SOURCES`, otherwise the source itself.
	 */
	private static function get_site_label( $source ) {
		return in_array( strtolower( trim( $source ) ), self::FACEBOOK_SOURCES, true ) ? self::FACEBOOK_LABEL : $source;
	}
}
