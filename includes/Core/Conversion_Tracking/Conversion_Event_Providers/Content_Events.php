<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Content_Events
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;

/**
 * Class for handling generic content engagement events.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Content_Events extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'content-events';

	/**
	 * Flag indicating whether content hooks have been bootstrapped.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	protected $bootstrapped = false;

	/**
	 * Gets the provider category.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Provider category.
	 */
	public function get_category() {
		return self::CATEGORY_CONTENT;
	}

	/**
	 * Checks if the provider is active.
	 *
	 * Content events are always active and not conditional on any third-party plugin or feature flag.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Content Events are always enabled, so this is always `true`.
	 */
	public function is_active() {
		return true;
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * Content engagement events are not conversion actions and should not be included
	 * in conversion-event enumerations for Ads or ACR.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array();
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since n.e.x.t
	 *
	 * @return Script Script instance.
	 */
	public function register_script() {
		$script = new Script(
			'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'       => $this->context->url( 'dist/assets/js/googlesitekit-events-provider-content-events.js' ),
				'execution' => 'defer',
			)
		);

		$script->register( $this->context );

		return $script;
	}

	/**
	 * Registers any actions/hooks for this provider.
	 *
	 * @since n.e.x.t
	 */
	public function register_hooks() {
		$bootstrap = function () {
			if ( ! $this->bootstrapped ) {
				$this->register_content_hooks();
				$this->bootstrapped = true;
			}
		};

		add_action( 'googlesitekit_analytics-4_init_tag', $bootstrap );
		add_action( 'googlesitekit_ads_init_tag', $bootstrap );
	}

	/**
	 * Registers content hooks once tag initialization occurs.
	 *
	 * @since n.e.x.t
	 */
	protected function register_content_hooks() {
		add_action(
			'wp_footer',
			function () {
				$script_handle = 'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG;
				$config        = $this->get_inline_config();

				$inline_script = join(
					"\n",
					array(
						'window._googlesitekit = window._googlesitekit || {};',
						sprintf( 'window._googlesitekit.contentEvents = %s;', wp_json_encode( $config ) ),
					)
				);

				wp_add_inline_script( $script_handle, $inline_script, 'before' );
			}
		);
	}

	/**
	 * Gets the inline config data for content events.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Inline config data.
	 */
	protected function get_inline_config() {
		return array(
			'postID'       => (int) get_queried_object_id(),
			'isSinglePost' => is_singular( 'post' ),
		);
	}
}
