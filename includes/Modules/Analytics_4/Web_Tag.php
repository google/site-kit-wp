<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Analytics\Web_Tag as Analytics_Web_Tag;

/**
 * Class for Web tag.
 *
 * @since 1.31.0
 * @access private
 * @ignore
 */
class Web_Tag extends Analytics_Web_Tag implements Tag_Interface {

	use Method_Proxy_Trait;

	/**
	 * Custom dimensions data.
	 *
	 * @since 1.113.0
	 * @var array
	 */
	private $custom_dimensions;

	/**
	 * Sets custom dimensions data.
	 *
	 * @since 1.113.0
	 *
	 * @param string $custom_dimensions Custom dimensions data.
	 */
	public function set_custom_dimensions( $custom_dimensions ) {
		$this->custom_dimensions = $custom_dimensions;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.31.0
	 */
	public function register() {
		// Do not call parent::register() because we need to override what is registered in the Analytics::Web_Tag class.
		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_gtag_script' ), 20 );
		$this->do_init_tag_action();
	}

	/**
	 * Enqueues gtag script.
	 *
	 * @since 1.31.0
	 */
	protected function enqueue_gtag_script() {
		if ( did_action( 'googlesitekit_analytics_init_tag' ) ) {
			// If the gtag script is already registered in the Analytics module, then we need to add <MEASUREMENT_ID> configuration only.
			$this->add_inline_config(
				$this->tag_id,
				! empty( $this->custom_dimensions )
					? $this->custom_dimensions
					: array()
			);
		} else {
			// Otherwise register gtag as in the Analytics module knowing that we used Measurement ID from GA4 instead of Property ID.
			parent::enqueue_gtag_script();
		}
	}

	/**
	 * Gets the tag config as used in the gtag data vars.
	 *
	 * @since 1.113.0
	 *
	 * @return array Tag configuration.
	 */
	protected function get_tag_config() {
		$config = parent::get_tag_config();

		// Do not add custom dimensions if UA is enabled because they will be
		// added to the UA property instead of to the GA4 measurement ID.
		if ( did_action( 'googlesitekit_analytics_init_tag' ) ) {
			return $config;
		}

		if ( ! empty( $this->custom_dimensions ) ) {
			$config = array_merge( $config, $this->custom_dimensions );
		}

		return $config;
	}

}
