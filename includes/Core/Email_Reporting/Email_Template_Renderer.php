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
	 * @since 1.173.0 Sections map is now optional for templates that don't use sections.
	 *
	 * @param Sections_Map|null $sections_map The sections map instance, or null for simple templates.
	 */
	public function __construct( Sections_Map $sections_map = null ) {
		$this->sections_map  = $sections_map;
		$this->templates_dir = realpath( __DIR__ . '/templates' );
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
				'get_asset_url'      => fn( $slug ) => Email_Assets::url( $slug ),
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
	 * @since 1.173.0 Added support for simple email templates.
	 *
	 * @param string $template_name The template name.
	 * @param array  $data          The data to render (metadata like subject, preheader, etc.).
	 * @return string The rendered plain text.
	 */
	public function render_text( $template_name, $data ) {
		// Handle simple email templates (invitation-email, subscription-confirmation, etc.).
		if ( 'email-report' !== $template_name ) {
			if ( empty( $data['body'] ) ) {
				$data['body'] = Body_Content_Map::get_body( $template_name );
			}

			return Plain_Text_Formatter::format_simple_email( $data );
		}

		// Render email report including sections.
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
