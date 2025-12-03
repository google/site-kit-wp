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
 * @since n.e.x.t
 */
class Sections_Map {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

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
	 * @since n.e.x.t
	 *
	 * @return array Array of sections with their configuration.
	 */
	public function get_sections() {
		$sections = array();

		$business_growth = $this->get_business_growth_section();
		if ( ! empty( $business_growth ) ) {
			$sections = array_merge( $sections, $business_growth );
		}

		// TODO: Add each new section here in follow up issues which implement additional sections.
		return $sections;
	}

	/**
	 * Gets the business growth section.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Section configuration array.
	 */
	protected function get_business_growth_section() {
		// If no conversion data is present in payload it means user do not have conversion tracking set up
		// or no data is received yet and we can skip this section.
		if ( empty( $this->payload['total_conversion_events'] ) || ! isset( $this->payload['total_conversion_events'] ) ) {
			return null;
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
}
