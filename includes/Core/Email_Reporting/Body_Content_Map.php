<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Body_Content_Map
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Class for mapping email template body content.
 *
 * Provides centralized body content for simple email templates,
 * used by both HTML and plain text renderers.
 *
 * @since n.e.x.t
 */
class Body_Content_Map {

	/**
	 * Gets the body content for a template.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $template_name The template name.
	 * @return array Array of body paragraphs.
	 */
	public static function get_body( $template_name ) {
		$bodies = self::get_all_bodies();

		return $bodies[ $template_name ] ?? array();
	}

	/**
	 * Gets all template body content mappings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Mapping of template names to body paragraph arrays.
	 */
	protected static function get_all_bodies() {
		return array(
			'invitation-email' => array(
				__( 'Receive the most important insights about your site\'s performance, key trends, and tailored metrics, powered by Site Kit, directly in your inbox.', 'google-site-kit' ),
				__( 'You can easily unsubscribe or change the reports frequency anytime from your Site Kit dashboard.', 'google-site-kit' ),
			),
		);
	}
}
