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
		// If no conversion data is present in payload it means user do not have conversion tracking set up
		// or no data is received yet and we can skip this section.
		if ( empty( $this->payload['total_conversion_events'] ) || ! isset( $this->payload['total_conversion_events'] ) ) {
			return array();
		}

		return array(
			'is_my_site_helping_my_business_grow' => array(
				'title'            => esc_html__( 'Is my site helping my business grow?', 'google-site-kit' ),
				'icon'             => 'conversions',
				'section_template' => 'section-conversions',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => array(
					'total_conversion_events' => array(
						'data' => $this->payload['total_conversion_events'] ?? array(),
					),
					'products_added_to_cart'  => array(
						'data' => $this->payload['products_added_to_cart'] ?? array(),
					),
					'purchases'               => array(
						'data' => $this->payload['purchases'] ?? array(),
					),
				),
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
		return array(
			'how_are_people_finding_me' => array(
				'title'            => esc_html__( 'How are people finding me?', 'google-site-kit' ),
				'icon'             => 'search',
				'section_template' => 'section-page-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => array(
					'traffic_channels' => array(
						'data' => $this->payload['traffic_channels'] ?? array(),
					),
					'top_ctr_keywords' => array(
						'data' => $this->payload['top_ctr_keywords'] ?? array(),
					),
				),
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
		return array(
			'whats_grabbing_their_attention' => array(
				'title'            => esc_html__( 'What’s grabbing their attention?', 'google-site-kit' ),
				'icon'             => 'views',
				'section_template' => 'section-page-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => array(
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
				),
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
		if ( empty( $this->payload['keywords_ctr_increase'] ) && empty( $this->payload['pages_clicks_increase'] ) ) {
			return array();
		}

		return array(
			'what_is_driving_growth_and_bringing_more_visitors' => array(
				'title'            => esc_html__( 'What is driving growth and bringing more visitors?', 'google-site-kit' ),
				'icon'             => 'growth',
				'section_template' => 'section-page-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => array(
					'keywords_ctr_increase' => array(
						'data' => $this->payload['keywords_ctr_increase'] ?? array(),
					),
					'pages_clicks_increase' => array(
						'data' => $this->payload['pages_clicks_increase'] ?? array(),
					),
				),
			),
		);
	}
}
