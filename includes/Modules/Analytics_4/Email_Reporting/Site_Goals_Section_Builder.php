<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Site_Goals_Section_Builder
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Payload_Processor;
use Google\Site_Kit\Modules\Analytics_4;

/**
 * Shapes the Site Goals reports into the two section payloads the email report reads.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Site_Goals_Section_Builder {

	/**
	 * Section key the online store card reads its payload under.
	 *
	 * @since n.e.x.t
	 */
	const ONLINE_STORE_SECTION_KEY = 'site_goals_online_store';

	/**
	 * Section key the lead generation card reads its payload under.
	 *
	 * @since n.e.x.t
	 */
	const LEAD_GENERATION_SECTION_KEY = 'site_goals_lead_generation';

	/**
	 * The value GA4 reports for a custom dimension an event never set.
	 *
	 * @since n.e.x.t
	 */
	const UNSET_DIMENSION_VALUE = '(not set)';

	/**
	 * Group labels a section uses when its results are not split by plugin or form.
	 *
	 * The results cover the whole site, so the section holds one group with no name, and
	 * the card shows no group title above its tiles.
	 *
	 * @since n.e.x.t
	 */
	const AGGREGATED_GROUP_LABELS = array( '' => '' );

	/**
	 * Names each ecommerce plugin the online store card can group its results by.
	 *
	 * A slug this list leaves out gets no group of its own, so its counts go into the
	 * "Other sources" group.
	 *
	 * @since n.e.x.t
	 */
	const ECOMMERCE_PROVIDER_LABELS = array(
		WooCommerce::CONVERSION_EVENT_PROVIDER_SLUG => 'WooCommerce',
		Easy_Digital_Downloads::CONVERSION_EVENT_PROVIDER_SLUG => 'Easy Digital Downloads',
	);

	/**
	 * Report processor instance.
	 *
	 * @since n.e.x.t
	 * @var Email_Report_Payload_Processor
	 */
	private $report_processor;

	/**
	 * Analytics data processor instance.
	 *
	 * @since n.e.x.t
	 * @var Report_Data_Processor
	 */
	private $data_processor;

	/**
	 * Form title resolver instance.
	 *
	 * @since n.e.x.t
	 * @var Form_Title_Resolver
	 */
	private $form_title_resolver;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Email_Report_Payload_Processor|null $report_processor    Optional. Report processor instance.
	 * @param Report_Data_Processor|null          $data_processor      Optional. Analytics data processor.
	 * @param Form_Title_Resolver|null            $form_title_resolver Optional. Form title resolver.
	 */
	public function __construct(
		?Email_Report_Payload_Processor $report_processor = null,
		?Report_Data_Processor $data_processor = null,
		?Form_Title_Resolver $form_title_resolver = null
	) {
		$this->report_processor    = $report_processor ?? new Email_Report_Payload_Processor();
		$this->data_processor      = $data_processor ?? new Report_Data_Processor();
		$this->form_title_resolver = $form_title_resolver ?? new Form_Title_Resolver();
	}

	/**
	 * Builds the online store and the lead generation section payloads.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $module_payload Module payload keyed by request key.
	 * @return array Section payloads. Empty when the payload holds no Site Goals report.
	 */
	public function build_sections( $module_payload ) {
		if ( ! is_array( $module_payload ) ) {
			return array();
		}

		return array_values(
			array_filter(
				array(
					$this->build_online_store_section( $module_payload ),
					$this->build_lead_generation_section( $module_payload ),
				)
			)
		);
	}

	/**
	 * Builds the online store section payload from the key action report and the engagement report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $module_payload Module payload keyed by request key.
	 * @return array Section payload, or an empty array when the report names no event.
	 */
	private function build_online_store_section( array $module_payload ) {
		$breaks_down_by_provider = ! empty( $module_payload[ Report_Request_Assembler::SITE_GOALS_ONLINE_STORE_PRIMARY_BY_PROVIDER_KEY ] );

		$primary_report = $breaks_down_by_provider
			? $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ONLINE_STORE_PRIMARY_BY_PROVIDER_KEY )
			: $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ONLINE_STORE_PRIMARY_KEY );

		$primary_rows  = $this->report_processor->extract_report_rows( $primary_report );
		$primary_event = $this->find_primary_event( $primary_rows );

		// Both tile labels name the event the report counted, so a report that names no
		// event builds no section.
		if ( '' === $primary_event ) {
			return array();
		}

		$engagement_report = $breaks_down_by_provider
			? $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ENGAGEMENT_BY_PROVIDER_KEY )
			: $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ENGAGEMENT_KEY );

		$group_dimension = $breaks_down_by_provider
			? Analytics_4::CUSTOM_EVENT_PREFIX . Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER
			: '';

		$counts = $this->data_processor->sum_metric_by_group( $primary_rows, $group_dimension, 'eventCount' );

		return $this->build_section(
			array(
				'section_key'   => self::ONLINE_STORE_SECTION_KEY,
				'counts'        => $counts,
				'sessions'      => $this->sum_sessions( $engagement_report, $group_dimension ),
				'group_labels'  => $breaks_down_by_provider
					? $this->get_provider_group_labels( $counts )
					: self::AGGREGATED_GROUP_LABELS,
				'metric_labels' => $this->get_online_store_metric_labels( $primary_event ),
				'prompt'        => $breaks_down_by_provider ? array() : $this->build_breakdown_prompt(
					/* translators: %s: the link text, "enable data breakdown". */
					__( 'Your events data may be grouped together across plugins. To see separate results by plugin, %s.', 'google-site-kit' )
				),
			)
		);
	}

	/**
	 * Builds the lead generation section payload from the key action report and the engagement report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $module_payload Module payload keyed by request key.
	 * @return array Section payload, or an empty array when the payload holds no lead report.
	 */
	private function build_lead_generation_section( array $module_payload ) {
		$breaks_down_by_form = ! empty( $module_payload[ Report_Request_Assembler::SITE_GOALS_LEAD_PRIMARY_BY_FORM_KEY ] );

		$primary_report = $breaks_down_by_form
			? $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_LEAD_PRIMARY_BY_FORM_KEY )
			: $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_LEAD_PRIMARY_KEY );

		if ( empty( $primary_report ) ) {
			return array();
		}

		$engagement_report = $breaks_down_by_form
			? $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ENGAGEMENT_BY_FORM_KEY )
			: $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ENGAGEMENT_KEY );

		$group_dimension = $breaks_down_by_form
			? Analytics_4::CUSTOM_EVENT_PREFIX . Analytics_4::CUSTOM_DIMENSION_FORM_ID
			: '';

		$counts = $this->data_processor->sum_metric_by_group(
			$this->report_processor->extract_report_rows( $primary_report ),
			$group_dimension,
			'eventCount'
		);

		return $this->build_section(
			array(
				'section_key'   => self::LEAD_GENERATION_SECTION_KEY,
				'counts'        => $counts,
				'sessions'      => $this->sum_sessions( $engagement_report, $group_dimension ),
				'group_labels'  => $breaks_down_by_form
					? $this->get_form_group_labels( $counts )
					: self::AGGREGATED_GROUP_LABELS,
				'metric_labels' => array(
					'rate'  => __( 'Form completion rate', 'google-site-kit' ),
					'total' => __( 'Total form completions', 'google-site-kit' ),
				),
				'prompt'        => $breaks_down_by_form ? array() : $this->build_breakdown_prompt(
					/* translators: %s: the link text, "enable data breakdown". */
					__( 'Your events data may be grouped together across forms. To see separate results by form, %s.', 'google-site-kit' )
				),
			)
		);
	}

	/**
	 * Builds one section payload from the counts each group holds.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $config {
	 *     Everything the section needs.
	 *
	 *     @type string $section_key   Section key the email report reads the payload under.
	 *     @type array  $counts        Key action counts, by group name and date range key.
	 *     @type array  $sessions      Session counts, by group name and date range key.
	 *     @type array  $group_labels  Map of group name to the label the card shows, in the
	 *                                 order the card shows the groups.
	 *     @type array  $metric_labels Tile labels, holding `rate` and `total`.
	 *     @type array  $prompt        Prompt asking the reader to turn the data breakdown on.
	 *                                 Empty when the section already breaks its results down.
	 * }
	 * @return array Section payload.
	 */
	private function build_section( array $config ) {
		$groups = array();

		foreach ( $config['group_labels'] as $group_name => $group_label ) {
			$groups[] = $this->build_group(
				$group_label,
				$config['counts'][ $group_name ] ?? array(),
				$config['sessions'][ $group_name ] ?? array(),
				$config['metric_labels']
			);
		}

		$unattributed_counts = $this->sum_unattributed_counts( $config['counts'], array_keys( $config['group_labels'] ) );

		if ( ( $unattributed_counts['date_range_0'] ?? 0.0 ) > 0.0 ) {
			$groups[] = $this->build_other_sources_group( $unattributed_counts, $config['metric_labels']['total'] );
		}

		list( $labels, $values, $trends ) = $this->flatten_groups( $groups );

		return array(
			'section_key'      => $config['section_key'],
			// Every tile carries its own label, so the section needs no fallback title.
			'title'            => '',
			'labels'           => $labels,
			'event_names'      => array(),
			'values'           => $values,
			'value_types'      => array_fill( 0, count( $values ), 'TYPE_STANDARD' ),
			'trends'           => $trends,
			'trend_types'      => array_fill( 0, count( $trends ), 'TYPE_STANDARD' ),
			'dimensions'       => array(),
			'dimension_values' => array(),
			'date_range'       => null,
			'groups'           => $groups,
			'prompt'           => $config['prompt'],
		);
	}

	/**
	 * Builds one group, holding the rate tile and the total tile.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $label         Label the card shows above the tiles.
	 * @param array  $counts        Key action counts of this group, by date range key.
	 * @param array  $sessions      Session counts of this group, by date range key.
	 * @param array  $metric_labels Tile labels, holding `rate` and `total`.
	 * @return array Group holding a `label` and its `metrics`.
	 */
	private function build_group( $label, array $counts, array $sessions, array $metric_labels ) {
		return array(
			'label'   => $label,
			'metrics' => array(
				$this->build_rate_metric( $counts, $sessions, $metric_labels['rate'] ),
				$this->build_total_metric( $counts, $metric_labels['total'] ),
			),
		);
	}

	/**
	 * Builds the group for the results that name no plugin and no form.
	 *
	 * The group holds the total alone, with no rate.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $counts      Key action counts of this group, by date range key.
	 * @param string $total_label Label of the total tile.
	 * @return array Group holding a `label` and its `metrics`.
	 */
	private function build_other_sources_group( array $counts, $total_label ) {
		return array(
			'label'   => __( 'Other sources', 'google-site-kit' ),
			'metrics' => array( $this->build_total_metric( $counts, $total_label ) ),
		);
	}

	/**
	 * Builds the rate tile, which divides the key action count by the session count.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $counts   Key action counts, by date range key.
	 * @param array  $sessions Session counts, by date range key.
	 * @param string $label    Label of the tile.
	 * @return array Tile holding a `label`, a `value`, and a `trend`.
	 */
	private function build_rate_metric( array $counts, array $sessions, $label ) {
		$current_rate  = $this->compute_rate( $counts['date_range_0'] ?? 0.0, $sessions['date_range_0'] ?? 0.0 );
		$previous_rate = $this->compute_rate( $counts['date_range_1'] ?? 0.0, $sessions['date_range_1'] ?? 0.0 );

		return array(
			'label' => $label,
			'value' => round( $current_rate * 100, 1 ) . '%',
			'trend' => $this->data_processor->compute_trend( $current_rate, $previous_rate ),
		);
	}

	/**
	 * Builds the total tile, which counts the key actions of the period.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $counts Key action counts, by date range key.
	 * @param string $label  Label of the tile.
	 * @return array Tile holding a `label`, a `value`, and a `trend`.
	 */
	private function build_total_metric( array $counts, $label ) {
		$current_count = $counts['date_range_0'] ?? 0.0;

		return array(
			'label' => $label,
			'value' => number_format_i18n( $current_count ),
			'trend' => $this->data_processor->compute_trend( $current_count, $counts['date_range_1'] ?? 0.0 ),
		);
	}

	/**
	 * Divides a key action count by a session count.
	 *
	 * @since n.e.x.t
	 *
	 * @param float $count    Key action count.
	 * @param float $sessions Session count.
	 * @return float Rate as a fraction, such as `0.038` for a rate of 3.8%. Zero when the period
	 *               holds no session, because a rate needs a session to divide by.
	 */
	private function compute_rate( $count, $sessions ) {
		if ( 0.0 === $sessions ) {
			return 0.0;
		}

		return $count / $sessions;
	}

	/**
	 * Adds up the counts of every group name the card shows no group for.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $counts      Key action counts, by group name and date range key.
	 * @param array $group_names Group names the card shows a group for.
	 * @return array Summed counts, by date range key.
	 */
	private function sum_unattributed_counts( array $counts, array $group_names ) {
		$unattributed = array();

		foreach ( $counts as $group_name => $totals ) {
			if ( in_array( $group_name, $group_names, true ) ) {
				continue;
			}

			foreach ( $totals as $date_range_key => $total ) {
				$unattributed[ $date_range_key ] = ( $unattributed[ $date_range_key ] ?? 0.0 ) + $total;
			}
		}

		return $unattributed;
	}

	/**
	 * Reads every group's tiles into the flat lists `Email_Report_Section_Builder` carries.
	 *
	 * The plain text email reads these lists rather than the groups. A section whose
	 * `values` list holds nothing never reaches the email.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $groups Groups the section holds.
	 * @return array Tuple of the labels, the values, and the trends.
	 */
	private function flatten_groups( array $groups ) {
		$labels = array();
		$values = array();
		$trends = array();

		foreach ( $groups as $group ) {
			foreach ( $group['metrics'] as $metric ) {
				$labels[] = $metric['label'];
				$values[] = $metric['value'];
				$trends[] = $metric['trend'];
			}
		}

		return array( $labels, $values, $trends );
	}

	/**
	 * Names each ecommerce plugin whose results get a group of their own.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $counts Key action counts, by provider slug and date range key.
	 * @return array Map of provider slug to plugin name, biggest count first.
	 */
	private function get_provider_group_labels( array $counts ) {
		$group_names = $this->sort_group_names(
			array_values( array_intersect( array_keys( $counts ), array_keys( self::ECOMMERCE_PROVIDER_LABELS ) ) ),
			$counts
		);

		$group_labels = array();

		foreach ( $group_names as $group_name ) {
			$group_labels[ $group_name ] = self::ECOMMERCE_PROVIDER_LABELS[ $group_name ];
		}

		return $group_labels;
	}

	/**
	 * Names each form whose results get a group of their own.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $counts Key action counts, by form ID and date range key.
	 * @return array Map of form ID to form name, biggest count first.
	 */
	private function get_form_group_labels( array $counts ) {
		$group_names = $this->sort_group_names(
			array_values( array_diff( array_keys( $counts ), array( '', self::UNSET_DIMENSION_VALUE ) ) ),
			$counts
		);

		return $this->form_title_resolver->get_titles( $group_names );
	}

	/**
	 * Orders group names by their key action count in the current period, biggest first.
	 *
	 * The reports ask GA4 for no order, so nothing else decides which group the card shows
	 * first. Two groups on the same count fall back to their names, so the order never
	 * changes between runs.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $group_names Group names to order.
	 * @param array $counts      Key action counts, by group name and date range key.
	 * @return array Group names, biggest count first.
	 */
	private function sort_group_names( array $group_names, array $counts ) {
		usort(
			$group_names,
			static function ( $first_group_name, $second_group_name ) use ( $counts ) {
				$first_count  = $counts[ $first_group_name ]['date_range_0'] ?? 0.0;
				$second_count = $counts[ $second_group_name ]['date_range_0'] ?? 0.0;

				if ( $first_count === $second_count ) {
					return strcmp( (string) $first_group_name, (string) $second_group_name );
				}

				return $first_count < $second_count ? 1 : -1;
			}
		);

		return $group_names;
	}

	/**
	 * Gets the tile labels for the event the online store report counted.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $primary_event Event name the report counted, `purchase` or `add_to_cart`.
	 * @return array Tile labels, holding `rate` and `total`.
	 */
	private function get_online_store_metric_labels( $primary_event ) {
		if ( 'purchase' === $primary_event ) {
			return array(
				'rate'  => __( 'Sales rate', 'google-site-kit' ),
				'total' => __( 'Total sales', 'google-site-kit' ),
			);
		}

		return array(
			'rate'  => __( 'Add to cart rate', 'google-site-kit' ),
			'total' => __( 'Products added to cart', 'google-site-kit' ),
		);
	}

	/**
	 * Builds the prompt that asks the reader to turn the data breakdown on.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text Whole sentence, holding one `%s` where the link goes.
	 * @return array Prompt holding the `text` and the `link_text` the card renders as a link.
	 */
	private function build_breakdown_prompt( $text ) {
		return array(
			'text'      => $text,
			'link_text' => __( 'enable data breakdown', 'google-site-kit' ),
		);
	}

	/**
	 * Reads the first event name the report rows carry.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $rows Report rows.
	 * @return string Event name, or an empty string when no row names one.
	 */
	private function find_primary_event( array $rows ) {
		foreach ( $rows as $row ) {
			$event_name = $row['dimensions']['eventName'] ?? '';

			if ( '' !== $event_name ) {
				return $event_name;
			}
		}

		return '';
	}

	/**
	 * Sums the session count of each group in the engagement report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $engagement_report Engagement report.
	 * @param string $group_dimension   Dimension whose value names the group. An empty string
	 *                                  sums every row into one group.
	 * @return array Session counts, by group name and date range key.
	 */
	private function sum_sessions( array $engagement_report, $group_dimension ) {
		return $this->data_processor->sum_metric_by_group(
			$this->report_processor->extract_report_rows( $engagement_report ),
			$group_dimension,
			'sessions'
		);
	}

	/**
	 * Reads one report out of the module payload.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $module_payload Module payload keyed by request key.
	 * @param string $request_key    Payload key the report sits under.
	 * @return array The report, or an empty array when the payload holds no report there.
	 */
	private function read_report( array $module_payload, $request_key ) {
		$report = $module_payload[ $request_key ] ?? array();

		return is_array( $report ) ? $report : array();
	}
}
