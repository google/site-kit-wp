<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Content_Map
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Golinks\Golinks;

/**
 * Class for mapping email template content (titles and body).
 *
 * Provides centralized content for simple email templates,
 * used by both HTML and plain text renderers. Body paragraphs may
 * contain safe inline HTML (e.g. strong tags) which the HTML
 * renderer preserves via wp_kses() and the plain text renderer
 * strips via wp_strip_all_tags().
 *
 * @since 1.173.0
 */
class Content_Map {

	/**
	 * Gets the title for a template.
	 *
	 * @since 1.174.0
	 *
	 * @param string $template_name The template name.
	 * @return string The title string (may contain sprintf placeholders).
	 */
	public static function get_title( $template_name ) {
		$titles = self::get_all_titles();

		return $titles[ $template_name ] ?? '';
	}

	/**
	 * Gets title with format arguments applied.
	 *
	 * @since 1.174.0
	 *
	 * @param string $template_name The template name.
	 * @param array  $args          Format arguments for sprintf substitution.
	 * @return string The resolved title string.
	 */
	public static function get_title_with_args( $template_name, $args = array() ) {
		$title = self::get_title( $template_name );

		if ( empty( $args ) || empty( $title ) ) {
			return $title;
		}

		return vsprintf( $title, $args );
	}

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
	 * Gets the graphic configuration for a template.
	 *
	 * Returns layout and rendering config for the graphic/icon used in
	 * simple email templates. The config controls the asset slug, position
	 * within the content card, dimensions, and title escape strategy.
	 *
	 * @since 1.176.0
	 *
	 * @param string $template_name The original template name (e.g. 'invitation-email').
	 * @return array {
	 *     Graphic configuration array, or empty array if unknown template.
	 *
	 *     @type string $slug         Asset slug for get_asset_url().
	 *     @type string $position     Position within card: 'top-center', 'top-left', or 'bottom-center'.
	 *     @type int    $width        Image width in pixels.
	 *     @type int    $height       Image height in pixels.
	 *     @type string $title_escape Title escape strategy: 'raw' (pre-escaped HTML) or 'esc_html'.
	 * }
	 */
	public static function get_graphic_config( $template_name ) {
		$configs = array(
			'invitation-email'          => array(
				'slug'         => 'invitation-envelope-graphic',
				'position'     => 'bottom-center',
				'width'        => 209,
				'height'       => 163,
				'title_escape' => 'raw',
			),
			'subscription-confirmation' => array(
				'slug'         => 'subscription-envelope-graphic',
				'position'     => 'top-center',
				'width'        => 177,
				'height'       => 143,
				'title_escape' => 'esc_html',
			),
			'error-email'               => array(
				'slug'         => 'warning-icon',
				'position'     => 'top-left',
				'width'        => 32,
				'height'       => 32,
				'title_escape' => 'esc_html',
			),
		);

		return $configs[ $template_name ] ?? array();
	}

	/**
	 * Gets all template title mappings.
	 *
	 * @since 1.174.0
	 *
	 * @return array Mapping of template names to title strings.
	 */
	protected static function get_all_titles() {
		return array(
			/* translators: 1: opening anchor tag with mailto link, 2: inviter email address, 3: closing anchor tag */
			'invitation-email'                       => __( '%1$s%2$s%3$s invited you to receive periodic performance reports', 'google-site-kit' ),
			'subscription-confirmation'              => __( 'Success! You’re subscribed to Site Kit reports', 'google-site-kit' ),
			'error-email'                            => __( 'Email reports are failing to send', 'google-site-kit' ),
			'error-email-permissions-search-console' => __( 'Action needed: your Site Kit report couldn’t be generated', 'google-site-kit' ),
			'error-email-permissions-analytics-4'    => __( 'Action needed: your Site Kit report couldn’t be generated', 'google-site-kit' ),
			'error-email-report-search-console'      => __( 'Action needed: your Site Kit report couldn’t be generated', 'google-site-kit' ),
			'error-email-report-analytics-4'         => __( 'Action needed: your Site Kit report couldn’t be generated', 'google-site-kit' ),
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
			'invitation-email'                       => array(
				__( 'Receive the most important insights about your site’s performance, key trends, and tailored metrics, powered by Site Kit, directly in your inbox.', 'google-site-kit' ),
				__( 'You can unsubscribe or change how often emails are sent anytime from your Site Kit dashboard.', 'google-site-kit' ),
			),
			'subscription-confirmation'              => array(
				__( 'You’re all set to receive your site performance reports.', 'google-site-kit' ),
				/* translators: %1$s: frequency (e.g., "monthly") wrapped in strong tags, %2$s: first report date wrapped in strong tags */
				__( 'You’ve successfully set your frequency to <strong>%1$s</strong>, and you can expect to receive your first report on <strong>%2$s</strong>.', 'google-site-kit' ),
				__( 'You can manage your subscription settings or change the report frequency anytime in your Site Kit dashboard.', 'google-site-kit' ),
			),
			'error-email'                            => array(
				__( 'We were unable to generate your report due to a server error. To fix this, contact your host. Report delivery will automatically resume once the issue is resolved.', 'google-site-kit' ),
			),
			// Opening/closing tag placeholders keep inline styles and HTML
			// out of translation strings. Inline color styles are required
			// because many email clients strip or ignore CSS classes.
			'error-email-permissions-search-console' => array(
				/* translators: 1: help link URL, 2: help link style CSS */
				__( 'We were unable to generate your reports due to insufficient permissions in Search Console. To fix this, contact your administrator or <a class="link" href="%1$s" style="%2$s">get help</a>.', 'google-site-kit' ),
				__( 'Report delivery will automatically resume once the issue is resolved.', 'google-site-kit' ),
			),
			'error-email-permissions-analytics-4'    => array(
				/* translators: 1: help link URL, 2: help link style CSS */
				__( 'We were unable to generate your reports due to insufficient permissions in Analytics. To fix this, contact your administrator or <a class="link" href="%1$s" style="%2$s">get help</a>.', 'google-site-kit' ),
				__( 'Report delivery will automatically resume once the issue is resolved.', 'google-site-kit' ),
			),
			'error-email-report-search-console'      => array(
				/* translators: 1: Search Console settings link URL, 2: Search Console settings link style CSS, 3: help link URL, 4: help link style CSS */
				__( 'We were unable to generate your report because data loading failed for Search Console. To fix this, go to <a class="link" href="%1$s" style="%2$s">Search Console settings</a> in Site Kit or <a class="link" href="%3$s" style="%4$s">get help</a>.', 'google-site-kit' ),
				__( 'Report delivery will automatically resume once the issue is resolved.', 'google-site-kit' ),
			),
			'error-email-report-analytics-4'         => array(
				/* translators: 1: Analytics settings link URL, 2: Analytics settings link style CSS, 3: help link URL, 4: help link style CSS */
				__( 'We were unable to generate your report because data loading failed for Analytics. To fix this, go to <a class="link" href="%1$s" style="%2$s">Analytics settings</a> in Site Kit or <a class="link" href="%3$s" style="%4$s">get help</a>.', 'google-site-kit' ),
				__( 'Report delivery will automatically resume once the issue is resolved.', 'google-site-kit' ),
			),
		);
	}

	/**
	 * Gets sprintf arguments for body placeholders.
	 *
	 * Maps each content key to the styled anchor tags that fill its
	 * `%s` / `%1$s` / `%2$s` placeholders. Keys without placeholders
	 * return an empty array.
	 *
	 * @since 1.176.0
	 *
	 * @param string  $content_key Content key (e.g. 'error-email-report-analytics-4').
	 * @param Golinks $golinks     Golinks instance for building URLs.
	 * @return array Ordered sprintf arguments for the body paragraphs.
	 */
	public static function get_body_args( $content_key, Golinks $golinks ) {
		$link_style        = 'color:#108080;text-decoration:underline;';
		$support_base      = 'https://sitekit.withgoogle.com/support/';
		$email_support_url = add_query_arg( 'doc', 'email-reporting-module-issues', $support_base );

		switch ( $content_key ) {
			case 'error-email-report-search-console':
				$settings_url = add_query_arg( 'module', 'search-console', $golinks->get_url( 'settings' ) );
				return array(
					$settings_url,
					$link_style,
					$email_support_url,
					$link_style,
				);

			case 'error-email-report-analytics-4':
				$settings_url = add_query_arg( 'module', 'analytics-4', $golinks->get_url( 'settings' ) );
				return array(
					$settings_url,
					$link_style,
					$email_support_url,
					$link_style,
				);

			case 'error-email-permissions-search-console':
				$permissions_url = add_query_arg( 'error_id', 'search-console_insufficient_permissions', $support_base );
				return array(
					$permissions_url,
					$link_style,
				);

			case 'error-email-permissions-analytics-4':
				$permissions_url = add_query_arg( 'error_id', 'analytics-4_insufficient_permissions', $support_base );
				return array(
					$permissions_url,
					$link_style,
				);

			default:
				return array();
		}
	}
}
