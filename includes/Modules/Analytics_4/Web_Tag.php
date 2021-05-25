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
class Web_Tag extends Analytics_Web_Tag {

	use Method_Proxy_Trait;

	/**
	 * Constructor.
	 *
	 * @since 1.33.0
	 *
	 * @param string $tag_id Tag ID.
	 * @param string $module_slug Module slug.
	 */
	public function __construct( $tag_id, $module_slug ) {
		parent::__construct( 'G-' . $tag_id, $module_slug );
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
			$config = sprintf( 'gtag("config", "%s");', esc_js( $this->tag_id ) );
			wp_add_inline_script( 'google_gtagjs', $config );
		} else {
			// Otherwise register gtag as in the Analytics module knowing that we used Measurement ID from GA4 instead of Property ID.
			parent::enqueue_gtag_script();
		}
	}

}
