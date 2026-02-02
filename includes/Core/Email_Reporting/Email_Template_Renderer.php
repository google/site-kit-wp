<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Template_Renderer
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Class for rendering email templates.
 *
 * @since 1.168.0
 */
class Email_Template_Renderer {

	/**
	 * CDN base URL for email assets.
	 *
	 * TODO: Change to the production URL when the assets are uploaded to production bucket in #11551.
	 *
	 * @since 1.168.0
	 * @var string
	 */
	const EMAIL_ASSETS_BASE_URL = 'https://storage.googleapis.com/pue-email-assets-dev/';

	/**
	 * Asset paths mapping.
	 *
	 * Maps asset filenames to their versioned folder paths.
	 * Format: 'asset-filename.png' => 'version/template-name'
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	const EMAIL_ASSET_PATHS = array(
		// email-report assets (1.168.0).
		'site-kit-logo.png'               => '1.168.0/email-report',
		'shooting-stars-graphic.png'      => '1.168.0/email-report',
		'icon-conversions.png'            => '1.168.0/email-report',
		'icon-growth.png'                 => '1.168.0/email-report',
		'icon-link-arrow.png'             => '1.168.0/email-report',
		'icon-search.png'                 => '1.168.0/email-report',
		'icon-views.png'                  => '1.168.0/email-report',
		'icon-visitors.png'               => '1.168.0/email-report',
		'conversions-timeline-green.png'  => '1.168.0/email-report',
		'conversions-timeline-red.png'    => '1.168.0/email-report',
		'notification-icon-star.png'      => '1.168.0/email-report',
		// invitation-email assets (1.172.0).
		'invitation-envelope-graphic.png' => '1.172.0/invitation-email',
	);

	/**
	 * The sections map instance.
	 *
	 * @since 1.168.0
	 * @var Sections_Map|null
	 */
	protected $sections_map;

	/**
	 * The base templates directory path.
	 *
	 * @since 1.168.0
	 * @var string
	 */
	protected $templates_dir;

	/**
	 * Cache of verified template file paths.
	 *
	 * Used to avoid repeated file_exists() calls for the same files.
	 *
	 * @since 1.168.0
	 * @var array
	 */
	protected $cached_files = array();

	/**
	 * Constructor.
	 *
	 * @since 1.168.0
	 * @since n.e.x.t Sections map is now optional for templates that don't use sections.
	 *
	 * @param Sections_Map|null $sections_map The sections map instance, or null for simple templates.
	 */
	public function __construct( Sections_Map $sections_map = null ) {
		$this->sections_map  = $sections_map;
		$this->templates_dir = realpath( __DIR__ . '/templates' );
	}

	/**
	 * Gets the full URL for an email asset.
	 *
	 * Constructs a URL following the folder structure:
	 * {base_url}/{version}/{template-name}/{asset-filename}
	 *
	 * @since 1.168.0
	 * @since n.e.x.t Updated to use asset-specific path mapping.
	 *
	 * @param string $asset_name The asset filename (e.g., 'icon-conversions.png').
	 * @return string The full URL to the asset.
	 */
	public function get_email_asset_url( $asset_name ) {
		$asset_name = ltrim( $asset_name, '/' );
		$asset_path = self::EMAIL_ASSET_PATHS[ $asset_name ] ?? '1.168.0/email-report';

		return self::EMAIL_ASSETS_BASE_URL . $asset_path . '/' . $asset_name;
	}

	/**
	 * Renders the email template with the given data.
	 *
	 * @since 1.168.0
	 *
	 * @param string $template_name The template name.
	 * @param array  $data          The data to render (metadata like subject, preheader, etc.).
	 * @return string The rendered HTML.
	 */
	public function render( $template_name, $data ) {
		$main_template_file = $this->get_template_file( $template_name );
		if ( ! $main_template_file || ! file_exists( $main_template_file ) ) {
			return '';
		}

		$sections = $this->sections_map ? $this->sections_map->get_sections() : array();

		$shared_parts_dir   = $this->templates_dir . '/parts';
		$template_parts_dir = $this->templates_dir . '/' . $template_name . '/parts';

		$template_data = array_merge(
			$data,
			array(
				'sections'           => $sections,
				'get_asset_url'      => fn( $asset_path ) => $this->get_email_asset_url( $asset_path ),
				'render_part'        => fn( $part_name, $vars = array() ) => $this->render_part_file( $template_parts_dir . '/' . $part_name . '.php', $vars ),
				'render_shared_part' => fn( $part_name, $vars = array() ) => $this->render_part_file( $shared_parts_dir . '/' . $part_name . '.php', $vars ),
			)
		);

		return $this->render_template( $main_template_file, $template_data );
	}

	/**
	 * Renders a template file with the given data.
	 *
	 * @since 1.168.0
	 *
	 * @param string $template_file The template file path.
	 * @param array  $data          The data to render (used within the template file).
	 * @return string The rendered HTML.
	 */
	protected function render_template( $template_file, $data ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Data is used within the template parts so is no strictly unused.
		ob_start();
		include $template_file;
		return ob_get_clean();
	}

	/**
	 * Renders a template part file with the given variables.
	 *
	 * Unlike render_template(), this method extracts variables into the
	 * template scope for more convenient access within partial templates.
	 *
	 * File paths are validated to ensure they are within the plugin's
	 * templates directory for security. Verified files are cached to
	 * avoid repeated file_exists() calls.
	 *
	 * @since 1.168.0
	 *
	 * @param string $file The template part file path.
	 * @param array  $vars The variables to extract into the template scope.
	 */
	protected function render_part_file( $file, $vars = array() ) {
		if ( isset( $this->cached_files[ $file ] ) ) {
			extract( $vars, EXTR_SKIP ); // phpcs:ignore WordPress.PHP.DontExtract.extract_extract
			include $this->cached_files[ $file ];
			return;
		}

		$real_path = realpath( $file );
		if ( false === $real_path ) {
			return;
		}

		// Ensure the file is within the templates directory for security.
		if ( 0 !== strpos( $real_path, $this->templates_dir . DIRECTORY_SEPARATOR ) ) {
			return;
		}

		$this->cached_files[ $file ] = $real_path;

		extract( $vars, EXTR_SKIP ); // phpcs:ignore WordPress.PHP.DontExtract.extract_extract
		include $real_path;
	}

	/**
	 * Renders the email template as plain text.
	 *
	 * Generates a plain text version of the email by walking the same
	 * structured section data as the HTML renderer, using the
	 * Plain_Text_Formatter for formatting.
	 *
	 * @since 1.170.0
	 * @since n.e.x.t Added support for invitation-email template.
	 *
	 * @param string $template_name The template name.
	 * @param array  $data          The data to render (metadata like subject, preheader, etc.).
	 * @return string The rendered plain text.
	 */
	public function render_text( $template_name, $data ) {
		// Handle invitation email separately.
		if ( 'invitation-email' === $template_name ) {
			return Plain_Text_Formatter::format_invitation_email( $data );
		}

		// Handle email-report template with sections.
		$sections = $this->sections_map ? $this->sections_map->get_sections() : array();

		$output = Plain_Text_Formatter::format_header(
			$data['site']['domain'] ?? '',
			$data['date_range']['label'] ?? ''
		);

		foreach ( $sections as $section_key => $section ) {
			if ( empty( $section['section_parts'] ) ) {
				continue;
			}
			$output .= Plain_Text_Formatter::format_section( $section );
		}

		$output .= Plain_Text_Formatter::format_footer(
			$data['primary_call_to_action'] ?? array(),
			$data['footer'] ?? array()
		);

		return $output;
	}

	/**
	 * Resolves the template file path.
	 *
	 * @since 1.168.0
	 *
	 * @param string $template_name The template name.
	 * @param string $part_name     The part name.
	 * @return string The template file path, or empty string if not found.
	 */
	protected function get_template_file( $template_name, $part_name = '' ) {
		$file = array( __DIR__, 'templates', $template_name );

		if ( ! empty( $part_name ) ) {
			array_push( $file, 'parts', $part_name . '.php' );
		} else {
			array_push( $file, 'template.php' );
		}

		$file = join( DIRECTORY_SEPARATOR, $file );
		if ( file_exists( $file ) ) {
			return $file;
		}

		return '';
	}
}
