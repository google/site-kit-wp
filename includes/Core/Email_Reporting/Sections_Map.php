<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Sections_Map
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;

/**
 * Class for mapping email report sections and their layout configuration.
 *
 * @since 1.168.0
 */
class Sections_Map {

	/**
	 * Plugin context.
	 *
	 * @since 1.168.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Gets the mapping of section part keys to their display labels.
	 *
	 * @since 1.170.0
	 *
	 * @return array<string, string> Mapping of part keys to localized labels.
	 */
	public static function get_part_labels() {
		return array(
			'traffic_channels'      => __( 'Traffic channels by visitor count', 'google-site-kit' ),
			'top_ctr_keywords'      => __( 'Keywords with highest CTR in Search', 'google-site-kit' ),
			'popular_content'       => __( 'Pages with the most pageviews', 'google-site-kit' ),
			'top_pages_by_clicks'   => __( 'Pages with the most clicks from Search', 'google-site-kit' ),
			'top_authors'           => __( 'Top authors by pageviews', 'google-site-kit' ),
			'top_categories'        => __( 'Top categories by pageviews', 'google-site-kit' ),
			'keywords_ctr_increase' => __( 'Search keywords with the biggest increase in CTR', 'google-site-kit' ),
			'pages_clicks_increase' => __( 'Pages with the biggest increase in Search clicks', 'google-site-kit' ),
		);
	}

	/**
	 * Gets the label for a specific part key.
	 *
	 * @since 1.170.0
	 *
	 * @param string $part_key The part key to get the label for.
	 * @return string The localized label, or empty string if not found.
	 */
	public static function get_part_label( $part_key ) {
		$labels = self::get_part_labels();
		return $labels[ $part_key ] ?? '';
	}

	/**
	 * Payload data for populating section templates.
	 *
	 * @since 1.168.0
	 * @var array
	 */
	protected $payload;

	/**
	 * Constructor.
	 *
	 * @since 1.168.0
	 *
	 * @param Context $context Plugin context.
	 * @param array   $payload The payload data to be used in sections.
	 */
	public function __construct( Context $context, $payload ) {
		$this->context = $context;
		$this->payload = $payload;
	}

	/**
	 * Gets all sections for the email report.
	 *
	 * Returns an array describing the layout sections, where each section contains:
	 * - title: The section heading
	 * - icon: Icon identifier for the section
	 * - section_parts: Array of template parts with their data
	 *
	 * @since 1.168.0
	 *
	 * @return array Array of sections with their configuration.
	 */
	public function get_sections() {
		return array_merge(
			$this->get_business_growth_section(),
			$this->get_visitors_section(),
			$this->get_traffic_sources_section(),
			$this->get_attention_section(),
			$this->get_growth_drivers_section(),
			$this->get_growth_drivers_section()
		);
	}

	/**
	 * Gets the business growth section.
	 *
	 * @since 1.168.0
	 *
	 * @return array Section configuration array.
	 */
	protected function get_business_growth_section() {
		$section_parts           = array(
			'total_conversion_events' => array(
				'data' => $this->payload['total_conversion_events'] ?? array(),
			),
		);
		$conversion_metric_parts = array();

		foreach ( $this->payload as $key => $data ) {
			if ( 0 !== strpos( $key, 'conversion_event_' ) ) {
				continue;
			}

			$conversion_metric_parts[ $key ] = array(
				'data' => $data,
			);
		}

		if ( ! empty( $conversion_metric_parts ) ) {
			// Rank conversion events by event volume so we can surface only the top performers in the section.
			uasort(
				$conversion_metric_parts,
				function ( $a, $b ) {
					$value_a = $a['data']['value'] ?? 0;
					$value_b = $b['data']['value'] ?? 0;

					return floatval( $value_b ) <=> floatval( $value_a );
				}
			);

			$conversion_metric_parts = array_slice( $conversion_metric_parts, 0, 2, true );
			$section_parts           = array_merge( $section_parts, $conversion_metric_parts );
		}

		$section_parts = $this->filter_section_parts( $section_parts );
		if ( empty( $section_parts ) ) {
			return array();
		}

		return array(
			'is_my_site_helping_my_business_grow' => array(
				'title'            => esc_html__( 'Is my site helping my business grow?', 'google-site-kit' ),
				'icon'             => 'conversions',
				'section_template' => 'section-conversions',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => $section_parts,
			),
		);
	}

	/**
	 * Gets the visitors section.
	 *
	 * @since 1.168.0
	 *
	 * @return array Section configuration array.
	 */
	protected function get_visitors_section() {
		$section_parts = array();

		$section_parts['total_visitors'] = array(
			'data' => $this->payload['total_visitors'] ?? array(),
		);

		$section_parts['new_visitors'] = array(
			'data' => $this->payload['new_visitors'] ?? array(),
		);

		$section_parts['returning_visitors'] = array(
			'data' => $this->payload['returning_visitors'] ?? array(),
		);

		// Insert custom audience parts (if available) immediately after returning_visitors.
		if ( is_array( $this->payload ) ) {
			foreach ( $this->payload as $key => $data ) {
				if ( 0 !== strpos( $key, 'custom_audience_' ) ) {
					continue;
				}

				$section_parts[ $key ] = array(
					'data' => $data,
				);
			}
		}

		$section_parts['total_impressions'] = array(
			'data' => $this->payload['total_impressions'] ?? array(),
		);

		$section_parts['total_clicks'] = array(
			'data' => $this->payload['total_clicks'] ?? array(),
		);

		$section_parts = $this->filter_section_parts( $section_parts );
		if ( empty( $section_parts ) ) {
			return array();
		}

		return array(
			'how_many_people_are_finding_and_visiting_my_site' => array(
				'title'            => esc_html__( 'How many people are finding and visiting my site?', 'google-site-kit' ),
				'icon'             => 'visitors',
				'section_template' => 'section-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => $section_parts,
			),
		);
	}

	/**
	 * Gets the traffic sources section.
	 *
	 * @since 1.168.0
	 *
	 * @return array Section configuration array.
	 */
	protected function get_traffic_sources_section() {
		$section_parts = array(
			'traffic_channels' => array(
				'data' => $this->payload['traffic_channels'] ?? array(),
			),
			'top_ctr_keywords' => array(
				'data' => $this->payload['top_ctr_keywords'] ?? array(),
			),
		);

		$section_parts = $this->filter_section_parts( $section_parts );
		if ( empty( $section_parts ) ) {
			return array();
		}

		return array(
			'how_are_people_finding_me' => array(
				'title'            => esc_html__( 'How are people finding me?', 'google-site-kit' ),
				'icon'             => 'search',
				'section_template' => 'section-page-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => $section_parts,
			),
		);
	}

	/**
	 * Gets the attention section.
	 *
	 * @since 1.168.0
	 *
	 * @return array Section configuration array.
	 */
	protected function get_attention_section() {
		$section_parts = array(
			'popular_content'     => array(
				'data' => $this->payload['popular_content'] ?? array(),
			),
			'top_pages_by_clicks' => array(
				'data' => $this->payload['top_pages_by_clicks'] ?? array(),
			),
			'top_authors'         => array(
				'data' => $this->payload['top_authors'] ?? array(),
			),
			'top_categories'      => array(
				'data' => $this->payload['top_categories'] ?? array(),
			),
		);

		$section_parts = $this->filter_section_parts( $section_parts );
		if ( empty( $section_parts ) ) {
			return array();
		}

		return array(
			'whats_grabbing_their_attention' => array(
				'title'            => esc_html__( 'What’s grabbing their attention?', 'google-site-kit' ),
				'icon'             => 'views',
				'section_template' => 'section-page-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => $section_parts,
			),
		);
	}

	/**
	 * Gets the growth drivers section.
	 *
	 * @since 1.168.0
	 *
	 * @return array Section configuration array.
	 */
	protected function get_growth_drivers_section() {
		$section_parts = array(
			'keywords_ctr_increase' => array(
				'data' => $this->payload['keywords_ctr_increase'] ?? array(),
			),
			'pages_clicks_increase' => array(
				'data' => $this->payload['pages_clicks_increase'] ?? array(),
			),
		);

		$section_parts = $this->filter_section_parts( $section_parts );
		if ( empty( $section_parts ) ) {
			return array();
		}

		return array(
			'what_is_driving_growth_and_bringing_more_visitors' => array(
				'title'            => esc_html__( 'What is driving growth and bringing more visitors?', 'google-site-kit' ),
				'icon'             => 'growth',
				'section_template' => 'section-page-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => $section_parts,
			),
		);
	}

	/**
	 * Filters section parts to only include meaningful data.
	 *
	 * @since 1.171.0
	 *
	 * @param array $section_parts Section parts to filter.
	 * @return array Filtered section parts.
	 */
	protected function filter_section_parts( array $section_parts ) {
		$filtered = array();

		foreach ( $section_parts as $part_key => $part_config ) {
			$data = $part_config['data'] ?? null;
			if ( ! $this->has_data( $data ) ) {
				continue;
			}

			$filtered[ $part_key ] = $part_config;
		}

		return $filtered;
	}

	/**
	 * Determines whether a section part has meaningful data.
	 *
	 * @since 1.171.0
	 *
	 * @param mixed $data Section part data.
	 * @return bool Whether the data contains values to render.
	 */
	protected function has_data( $data ) {
		if ( empty( $data ) || ! is_array( $data ) ) {
			return false;
		}

		if ( isset( $data['values'] ) && is_array( $data['values'] ) ) {
			foreach ( $data['values'] as $value ) {
				if ( $this->has_non_zero_value( $value ) ) {
					return true;
				}
			}
		}

		if ( array_key_exists( 'value', $data ) ) {
			return $this->has_non_zero_value( $data['value'] );
		}

		return false;
	}

	/**
	 * Determines whether a value represents non-zero, meaningful data.
	 *
	 * @since 1.171.0
	 *
	 * @param mixed $value Value to evaluate.
	 * @return bool Whether the value is non-zero or non-empty.
	 */
	protected function has_non_zero_value( $value ) {
		if ( null === $value ) {
			return false;
		}

		if ( is_bool( $value ) ) {
			return $value;
		}

		if ( is_numeric( $value ) ) {
			return 0.0 !== (float) $value;
		}

		if ( is_string( $value ) ) {
			$trimmed = trim( $value );
			if ( '' === $trimmed ) {
				return false;
			}

			$normalized = str_replace( '%', '', $trimmed );
			if ( is_numeric( $normalized ) ) {
				return 0.0 !== (float) $normalized;
			}

			return true;
		}

		return ! empty( $value );
	}
}
