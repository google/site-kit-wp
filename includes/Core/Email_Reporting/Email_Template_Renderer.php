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
 * @since n.e.x.t
 */
class Email_Template_Renderer {

	/**
	 * Renders the email template with the given data.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $template_name The template name.
	 * @param array  $data          The data to render.
	 * @return string The rendered HTML.
	 */
	public function render( $template_name, array $data ) {
		$main_template_file = $this->get_template_file( $template_name );
		if ( ! $main_template_file || ! file_exists( $main_template_file ) ) {
			return '';
		}

		$sections_map = new Sections_Map( $data );
		$sections     = $sections_map->get_sections();

		foreach ( $sections as &$section ) {
			if ( empty( $section['section_parts'] ) ) {
				continue;
			}

			foreach ( $section['section_parts'] as $part_key => $part_config ) {
				if ( ! isset( $data[ $part_key ] ) ) {
					continue;
				}

				$template_file = $this->get_template_file( $template_name, $part_config['template'] );
				if ( $template_file && file_exists( $template_file ) ) {
					$section['output'] = $this->render_template( $template_file, $section['data'] );
				}
			}
		}

		return $this->render_template( $main_template_file, $sections );
	}

	/**
	 * Renders a template file with the given data.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $template_file The template file path.
	 * @param array  $data          The data to render.
	 * @return string The rendered HTML.
	 */
	protected function render_template( $template_file, array $data ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		ob_start();
		include $template_file;
		return ob_get_clean();
	}

	/**
	 * Resolves the template file path.
	 *
	 * @since n.e.x.t
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
