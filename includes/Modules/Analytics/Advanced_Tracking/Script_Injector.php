<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Script_Injector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Manifest;
use Google\Site_Kit\Core\Util\BC_Functions;

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
	 * @param array $events The map of Event objects, keyed by their unique ID.
	 */
	public function inject_event_script( $events ) {
		if ( empty( $events ) ) {
			return;
		}

		list( $filename ) = Manifest::get( 'analytics-advanced-tracking' );
		if ( ! $filename ) {
			// Get file contents of script and add it to the page, injecting event configurations into it.
			$filename = 'analytics-advanced-tracking.js';

		}

		$script_path = $this->context->path( "dist/assets/js/{$filename}" );

		// phpcs:ignore WordPress.WP.AlternativeFunctions, WordPressVIPMinimum.Performance.FetchingRemoteData
		$script_content = file_get_contents( $script_path );
		if ( ! $script_content ) {
			return;
		}

		$data_var = sprintf(
			'var _googlesitekitAnalyticsTrackingData = %s;',
			wp_json_encode( array_values( $events ) )
		);
		BC_Functions::wp_print_inline_script_tag( $data_var . "\n" . $script_content );
	}
}
