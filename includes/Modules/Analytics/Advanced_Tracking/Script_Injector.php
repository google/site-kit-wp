<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Script_Injector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Manifest;

/**
 * Class for injecting JavaScript based on the registered event configurations.
 *
 * @since 1.18.0.
 * @access private
 * @ignore
 */
final class Script_Injector {

	/**
	 * Plugin context.
	 *
	 * @since 1.18.0.
	 * @var Context
	 */
	protected $context;

	/**
	 * Constructor.
	 *
	 * @since 1.18.0.
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Creates list of measurement event configurations and javascript to inject.
	 *
	 * @since 1.18.0.
	 *
	 * @param Event[] $events The list of Event objects.
	 */
	public function inject_event_script( $events ) {
		if ( empty( $events ) ) {
			return;
		}

		// Get file contents of script and add it to the page, injecting event configurations into it.
		$filename = 'analytics-advanced-tracking.js';
		if ( class_exists( '\Google\Site_Kit\Core\Assets\Manifest' ) && isset( Manifest::$assets['analytics-advanced-tracking'] ) ) {
			$filename = Manifest::$assets['analytics-advanced-tracking'];
		}

		$script_path = $this->context->path( "dist/assets/js/{$filename}" );

		// phpcs:ignore WordPress.WP.AlternativeFunctions, WordPressVIPMinimum.Performance.FetchingRemoteData
		$script_content = file_get_contents( $script_path );
		if ( ! $script_content ) {
			return;
		}

		?>
		<script>
			<?php
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo str_replace(
				// This string is defined as external in the Webpack config, and here it gets replaced with the
				// actual event configurations array.
				'SITEKIT_ANALYTICS_ADVANCED_TRACKING_EVENTS',
				wp_json_encode( $events ),
				$script_content
			);
			?>
		</script>
		<?php
	}
}
