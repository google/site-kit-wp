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
 * Builds the Site Goals section payloads for the Analytics 4 email report.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Site_Goals_Section_Builder {

	/**
	 * Section key of the online store payload.
	 *
	 * @since n.e.x.t
	 */
	const ONLINE_STORE_SECTION_KEY = 'site_goals_online_store';

	/**
	 * Section key of the lead generation payload.
	 *
	 * @since n.e.x.t
	 */
	const LEAD_GENERATION_SECTION_KEY = 'site_goals_lead_generation';

	/**
	 * The value GA4 reports for a custom dimension an event did not set.
	 *
	 * @since n.e.x.t
	 */
	const UNSET_DIMENSION_VALUE = '(not set)';

	/**
	 * The value GA4 reports when a report holds more dimension values than it counts one
	 * by one. This single row adds up every value it stopped naming.
	 *
	 * @since n.e.x.t
	 */
	const OTHER_DIMENSION_VALUE = '(other)';

	/**
	 * Group labels of a section that does not split its results. It holds one group,
	 * whose name and label are both empty.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	const AGGREGATED_GROUP_LABELS = array( '' => '' );

	/**
	 * Names each ecommerce plugin the online store section can group its results by.
	 *
	 * A slug this list leaves out gets no group of its own, so its counts go into the
	 * "Other sources" group.
	 *
	 * @since n.e.x.t
	 * @var array
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
	 * @return array Section payloads, at most one for the online store and one for lead generation.
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
		$is_split_by_provider = ! empty( $module_payload[ Report_Request_Assembler::SITE_GOALS_ONLINE_STORE_PRIMARY_BY_PROVIDER_KEY ] );

		$primary_report = $is_split_by_provider
			? $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ONLINE_STORE_PRIMARY_BY_PROVIDER_KEY )
			: $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ONLINE_STORE_PRIMARY_KEY );

		$primary_rows  = $this->report_processor->extract_report_rows( $primary_report );
		$primary_event = $this->find_primary_event( $primary_rows );

		// Both tile labels depend on the event the report counted. A report that names
		// no event gets no section.
		if ( '' === $primary_event ) {
			return array();
		}

		$engagement_report = $is_split_by_provider
			? $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ENGAGEMENT_BY_PROVIDER_KEY )
			: $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ENGAGEMENT_KEY );

		$group_dimension = $is_split_by_provider
			? Analytics_4::CUSTOM_EVENT_PREFIX . Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER
			: '';

		$counts = $this->data_processor->sum_metric_by_group( $primary_rows, $group_dimension, 'eventCount' );

		return $this->build_section(
			array(
				'section_key'   => self::ONLINE_STORE_SECTION_KEY,
				'counts'        => $counts,
				'sessions'      => $this->sum_sessions( $engagement_report, $group_dimension ),
				'group_labels'  => $is_split_by_provider
					? $this->get_provider_group_labels( $counts )
					: self::AGGREGATED_GROUP_LABELS,
				'metric_labels' => $this->get_online_store_metric_labels( $primary_event ),
				'prompt'        => $is_split_by_provider ? array() : $this->build_breakdown_prompt(
					/* translators: %s: link text, "enable data breakdown". */
					__( 'Your events data might be grouped together across plugins. To see separate results by plugin, %s.', 'google-site-kit' )
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
		$is_split_by_form = ! empty( $module_payload[ Report_Request_Assembler::SITE_GOALS_LEAD_PRIMARY_BY_FORM_KEY ] );

		$primary_report = $is_split_by_form
			? $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_LEAD_PRIMARY_BY_FORM_KEY )
			: $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_LEAD_PRIMARY_KEY );

		if ( empty( $primary_report ) ) {
			return array();
		}

		$engagement_report = $is_split_by_form
			? $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ENGAGEMENT_BY_FORM_KEY )
			: $this->read_report( $module_payload, Report_Request_Assembler::SITE_GOALS_ENGAGEMENT_KEY );

		$group_dimension = $is_split_by_form
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
				'group_labels'  => $is_split_by_form
					? $this->get_form_group_labels( $counts )
					: self::AGGREGATED_GROUP_LABELS,
				'metric_labels' => array(
					'rate'  => __( 'Form completion rate', 'google-site-kit' ),
					'total' => __( 'Total form completions', 'google-site-kit' ),
				),
				'prompt'        => $is_split_by_form ? array() : $this->build_breakdown_prompt(
					/* translators: %s: link text, "enable data breakdown". */
					__( 'Your events data might be grouped together across forms. To see separate results by form, %s.', 'google-site-kit' )
				),
			)
		);
	}

	/**
	 * Builds one section payload from the counts each group holds.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $section_input {
	 *     What the section is built from.
	 *
	 *     @type string $section_key   Section key the payload sits under.
	 *     @type array  $counts        Key action counts, by group name and date range key.
	 *     @type array  $sessions      Session counts, by group name and date range key.
	 *     @type array  $group_labels  Map of group name to its label, in the order the section
	 *                                 shows the groups.
	 *     @type array  $metric_labels Tile labels, holding `rate` and `total`.
	 *     @type array  $prompt        Prompt asking the reader to turn the data breakdown on.
	 *                                 Empty when the section already splits its results.
	 * }
	 * @return array Section payload.
	 */
	private function build_section( array $section_input ) {
		$groups = array();

		foreach ( $section_input['group_labels'] as $group_name => $group_label ) {
			$groups[] = $this->build_group(
				$group_label,
				$section_input['counts'][ $group_name ] ?? array(),
				$section_input['sessions'][ $group_name ] ?? array(),
				$section_input['metric_labels']
			);
		}

		$other_sources_counts = $this->sum_other_sources_counts( $section_input['counts'], array_keys( $section_input['group_labels'] ) );

		if ( ( $other_sources_counts['date_range_0'] ?? 0.0 ) > 0.0 ) {
			$groups[] = $this->build_other_sources_group( $other_sources_counts, $section_input['metric_labels']['total'] );
		}

		list( $labels, $values, $trends ) = $this->collect_flat_lists( $groups );

		return array(
			'section_key'      => $section_input['section_key'],
			// The email never shows this title. `Email_Report_Section_Builder` fills an
			// empty title with the section key, and `Email_Template_Formatter` labels the
			// section from the first tile instead.
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
			'prompt'           => $section_input['prompt'],
		);
	}

	/**
	 * Builds one group, holding the rate tile and the total tile.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $label         Label of the group, such as a plugin name or a form title.
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
	 * Builds the "Other sources" group, which counts the key actions that sit in no
	 * other group.
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
			// `Sections_Map::has_non_zero_value()` reads this value back through
			// `is_numeric()`, so the rate keeps a dot and never the locale's separator.
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
		$session_count = (float) $sessions;

		if ( 0.0 === $session_count ) {
			return 0.0;
		}

		return (float) $count / $session_count;
	}

	/**
	 * Adds up the counts of every group name the section shows no group for.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $counts      Key action counts, by group name and date range key.
	 * @param array $group_names Group names the section shows a group for.
	 * @return array Summed counts, by date range key.
	 */
	private function sum_other_sources_counts( array $counts, array $group_names ) {
		$other_sources = array();

		foreach ( $counts as $group_name => $totals ) {
			if ( in_array( $group_name, $group_names, true ) ) {
				continue;
			}

			foreach ( $totals as $date_range_key => $total ) {
				$other_sources[ $date_range_key ] = ( $other_sources[ $date_range_key ] ?? 0.0 ) + $total;
			}
		}

		return $other_sources;
	}

	/**
	 * Collects every group's tiles into the flat lists a section part carries.
	 *
	 * `Email_Report_Section_Builder` leaves out a section whose `values` list holds nothing.
	 * `Email_Template_Formatter` reads the first label and the first value out of these lists.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $groups Groups the section holds.
	 * @return array The labels, the values and the trends, in that order.
	 */
	private function collect_flat_lists( array $groups ) {
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
	 * A row that names no form gets no group of its own, so its counts go into the
	 * "Other sources" group.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $counts Key action counts, by form ID and date range key.
	 * @return array Map of form ID to its title, biggest count first.
	 */
	private function get_form_group_labels( array $counts ) {
		$unnamed_forms = array( '', self::UNSET_DIMENSION_VALUE, self::OTHER_DIMENSION_VALUE );

		$group_names = $this->sort_group_names(
			array_values( array_diff( array_keys( $counts ), $unnamed_forms ) ),
			$counts
		);

		return $this->form_title_resolver->get_titles( $group_names );
	}

	/**
	 * Orders group names by their key action count in the current period, biggest first.
	 *
	 * The reports ask GA4 for no order, so this method sets it. Two groups with the same
	 * count are ordered by name, so every run shows the same order.
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
	 * @return array Prompt holding the `text` and the `link_text` that fills its `%s`.
	 */
	private function build_breakdown_prompt( $text ) {
		return array(
			'text'      => $text,
			'link_text' => __( 'enable data breakdown', 'google-site-kit' ),
		);
	}

	/**
	 * Reads the key action the online store report counted.
	 *
	 * Every row of this report carries the same event name, because the request asks for
	 * one event. A row can still arrive with no name, so this returns the first name it
	 * finds.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $rows Report rows.
	 * @return string Event name, `purchase` or `add_to_cart`, or an empty string when no row names an event.
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
