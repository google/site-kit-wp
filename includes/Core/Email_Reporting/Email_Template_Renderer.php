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
	 * CDN base URL for email assets.
	 *
	 * TODO: Change to the production URL when the assets are uploaded to production bucket in #11551.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	const EMAIL_ASSETS_BASE_URL = 'https://storage.googleapis.com/pue-email-assets-dev/';

	/**
	 * The sections map instance.
	 *
	 * @since n.e.x.t
	 * @var Sections_Map
	 */
	protected $sections_map;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Sections_Map $sections_map The sections map instance.
	 */
	public function __construct( Sections_Map $sections_map ) {
		$this->sections_map = $sections_map;
	}

	/**
	 * Gets the full URL for an email asset.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $asset_name The asset filename (e.g., 'icon-conversions.png').
	 * @return string The full URL to the asset.
	 */
	public function get_email_asset_url( $asset_name ) {
		return self::EMAIL_ASSETS_BASE_URL . ltrim( $asset_name, '/' );
	}

	/**
	 * Renders the email template with the given data.
	 *
	 * @since n.e.x.t
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

		// TODO: check the data is correctly coming through from the payload data.

		$sections = $this->sections_map->get_sections();

		// Create a callable for templates to use for asset URLs.
		$get_asset_url = function ( $asset_path ) {
			return $this->get_email_asset_url( $asset_path );
		};

		$template_data = array_merge(
			$data,
			array(
				'sections'      => $sections,
				'get_asset_url' => fn( $asset_path ) => $this->get_email_asset_url( $asset_path ),
			)
		);

		return $this->render_template( $main_template_file, $template_data );
	}

	/**
	 * Renders a template file with the given data.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $template_file The template file path.
	 * @param array  $data          The data to render (used within the template file).
	 * @return string The rendered HTML.
	 */
	protected function render_template( $template_file, $data ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
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
