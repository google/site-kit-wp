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
 * used by both HTML and plain text renderers. Body paragraphs may
 * contain safe inline HTML (e.g. strong tags) which the HTML
 * renderer preserves via wp_kses() and the plain text renderer
 * strips via wp_strip_all_tags().
 *
 * @since 1.173.0
 */
class Body_Content_Map {

	/**
	 * Gets the body content for a template.
	 *
	 * @since 1.173.0
	 *
	 * @param string $template_name The template name.
	 * @return array Array of body paragraphs (may contain HTML).
	 */
	public static function get_body( $template_name ) {
		$bodies = self::get_all_bodies();

		return $bodies[ $template_name ] ?? array();
	}

	/**
	 * Gets body content with format arguments applied.
	 *
	 * Retrieves paragraphs for the given template and substitutes
	 * any sprintf-style placeholders with the provided arguments.
	 *
	 * @since 1.173.0
	 *
	 * @param string $template_name The template name.
	 * @param array  $args          Format arguments for vsprintf substitution.
	 * @return array Array of resolved body paragraphs (may contain HTML).
	 */
	public static function get_body_with_args( $template_name, $args = array() ) {
		$body = self::get_body( $template_name );

		if ( empty( $args ) ) {
			return $body;
		}

		return array_map(
			function ( $paragraph ) use ( $args ) {
				return vsprintf( $paragraph, $args );
			},
			$body
		);
	}

	/**
	 * Gets all template body content mappings.
	 *
	 * @since 1.173.0
	 *
	 * @return array Mapping of template names to body paragraph arrays.
	 */
	protected static function get_all_bodies() {
		return array(
			'invitation-email'          => array(
				__( 'Receive the most important insights about your site’s performance, key trends, and tailored metrics, powered by Site Kit, directly in your inbox.', 'google-site-kit' ),
				__( 'You can unsubscribe or change how often emails are sent anytime from your Site Kit dashboard.', 'google-site-kit' ),
			),
			'subscription-confirmation' => array(
				__( 'You’re all set to receive your site performance reports.', 'google-site-kit' ),
				/* translators: %1$s: frequency (e.g., "monthly") wrapped in strong tags, %2$s: first report date wrapped in strong tags */
				__( 'You’ve successfully set your frequency to <strong>%1$s</strong>, and you can expect to receive your first report on <strong>%2$s</strong>.', 'google-site-kit' ),
				__( 'You can manage your subscription settings or change the report frequency anytime in your Site Kit dashboard.', 'google-site-kit' ),
			),
		);
	}
}
