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

/**
 * Class for mapping email report sections and their layout configuration.
 *
 * @since n.e.x.t
 */
class Sections_Map {

	/**
	 * Payload data for populating section templates.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $payload;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $payload The payload data to be used in sections.
	 */
	public function __construct( array $payload ) {
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
	 * @since n.e.x.t
	 *
	 * @return array Array of sections with their configuration.
	 */
	public function get_sections() {
		return array_merge(
			$this->get_business_growth_section(),
			$this->get_audience_engagement_section(),
			$this->get_traffic_insights_section()
		);
	}

	/**
	 * Gets the business growth section.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Section configuration array.
	 */
	protected function get_business_growth_section() {
		return array(
			'is_my_site_helping_my_business_grow' => array(
				'title'         => esc_html__( 'Is my site helping my business grow?', 'google-site-kit' ),
				'icon'          => 'trending-up',
				'section_parts' => array(
					'total_conversion_events' => array(
						'template' => 'metrics',
						'data'     => $this->payload['total_conversion_events'] ?? array(),
					),
					'products_added_to_cart'  => array(
						'template' => 'conversion-metrics',
						'data'     => $this->payload['products_added_to_cart'] ?? array(),
					),
					'purchases'               => array(
						'template' => 'conversion-metrics',
						'data'     => $this->payload['purchases'] ?? array(),
					),
				),
			),
		);
	}

	/**
	 * Gets the audience engagement section.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Section configuration array.
	 */
	protected function get_audience_engagement_section() {
		return array(
			'how_are_people_engaging_with_my_site' => array(
				'title'         => esc_html__( 'How are people engaging with my site?', 'google-site-kit' ),
				'icon'          => 'users',
				'section_parts' => array(
					'total_visitors'       => array(
						'template' => 'metrics',
						'data'     => $this->payload['total_visitors'] ?? array(),
					),
					'returning_visitors'   => array(
						'template' => 'metrics',
						'data'     => $this->payload['returning_visitors'] ?? array(),
					),
					'engaged_traffic_rate' => array(
						'template' => 'metrics',
						'data'     => $this->payload['engaged_traffic_rate'] ?? array(),
					),
					'new_visitors_chart'   => array(
						'template' => 'chart',
						'data'     => $this->payload['new_visitors_chart'] ?? array(),
					),
				),
			),
		);
	}

	/**
	 * Gets the traffic insights section.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Section configuration array.
	 */
	protected function get_traffic_insights_section() {
		return array(
			'where_is_my_traffic_coming_from' => array(
				'title'         => esc_html__( 'Where is my traffic coming from?', 'google-site-kit' ),
				'icon'          => 'globe',
				'section_parts' => array(
					'traffic_channels'      => array(
						'template' => 'table',
						'data'     => $this->payload['traffic_channels'] ?? array(),
					),
					'top_pages'             => array(
						'template' => 'table',
						'data'     => $this->payload['top_pages'] ?? array(),
					),
					'search_console_clicks' => array(
						'template' => 'metrics',
						'data'     => $this->payload['search_console_clicks'] ?? array(),
					),
				),
			),
		);
	}
}
