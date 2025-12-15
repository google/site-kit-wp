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
						'data'                => $this->payload['products_added_to_cart'] ?? array(),
						'top_traffic_channel' => $this->payload['products_added_to_cart_top_traffic_channel'] ?? '',
					),
					'purchases'               => array(
						'data'                => $this->payload['purchases'] ?? array(),
						'top_traffic_channel' => $this->payload['purchases_top_traffic_channel'] ?? '',
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
		return array(
			'how_many_people_are_finding_and_visiting_my_site' => array(
				'title'            => esc_html__( 'How many people are finding and visiting my site?', 'google-site-kit' ),
				'icon'             => 'visitors',
				'section_template' => 'section-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => array(
					'total_visitors'              => array(
						'data' => $this->payload['total_visitors'] ?? array(),
					),
					'new_visitors'                => array(
						'data' => $this->payload['new_visitors'] ?? array(),
					),
					'returning_visitors'          => array(
						'data' => $this->payload['returning_visitors'] ?? array(),
					),
					'subscribers'                 => array(
						'data' => $this->payload['subscribers'] ?? array(),
					),
					'total_impressions_on_search' => array(
						'data' => $this->payload['total_impressions_on_search'] ?? array(),
					),
					'total_clicks_from_search'    => array(
						'data' => $this->payload['total_clicks_from_search'] ?? array(),
					),
				),
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
					'traffic_channels_by_visitor_count'   => array(
						'data' => $this->payload['traffic_channels_by_visitor_count'] ?? array(),
					),
					'keywords_with_highest_ctr_in_search' => array(
						'data' => $this->payload['keywords_with_highest_ctr_in_search'] ?? array(),
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
					'pages_with_the_most_pageviews' => array(
						'data' => $this->payload['pages_with_the_most_pageviews'] ?? array(),
					),
					'pages_with_the_most_clicks_from_search' => array(
						'data' => $this->payload['pages_with_the_most_clicks_from_search'] ?? array(),
					),
					'top_authors_by_pageviews'      => array(
						'data' => $this->payload['top_authors_by_pageviews'] ?? array(),
					),
					'top_categories_by_pageviews'   => array(
						'data' => $this->payload['top_categories_by_pageviews'] ?? array(),
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
		return array(
			'what_is_driving_growth_and_bringing_more_visitors' => array(
				'title'            => esc_html__( 'What is driving growth and bringing more visitors?', 'google-site-kit' ),
				'icon'             => 'growth',
				'section_template' => 'section-page-metrics',
				'dashboard_url'    => $this->context->admin_url( 'dashboard' ),
				'section_parts'    => array(
					'search_keywords_with_the_biggest_increase_in_ctr' => array(
						'data' => $this->payload['search_keywords_with_the_biggest_increase_in_ctr'] ?? array(),
					),
					'pages_with_the_biggest_increase_in_search_clicks' => array(
						'data' => $this->payload['pages_with_the_biggest_increase_in_search_clicks'] ?? array(),
					),
				),
			),
		);
	}
}
