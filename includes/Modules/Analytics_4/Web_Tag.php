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

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Tags\Gtag_JS;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for Web tag.
 *
 * @since 1.31.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag implements Tag_Interface {

	use Method_Proxy_Trait, Tag_With_DNS_Prefetch_Trait;

	/**
	 * Custom dimensions data.
	 *
	 * @since 1.113.0
	 * @var array
	 */
	private $custom_dimensions;

	/**
	 * Home domain name.
	 *
	 * @since 1.24.0
	 * @var string
	 */
	private $home_domain;

	/**
	 * Ads conversion ID.
	 *
	 * @since 1.32.0
	 * @var string
	 */
	private $ads_conversion_id;

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
	 * Sets the current home domain.
	 *
	 * @since 1.24.0
	 *
	 * @param string $domain Domain name.
	 */
	public function set_home_domain( $domain ) {
		$this->home_domain = $domain;
	}

	/**
	 * Sets the ads conversion ID.
	 *
	 * @since 1.32.0
	 *
	 * @param string $ads_conversion_id Ads ID.
	 */
	public function set_ads_conversion_id( $ads_conversion_id ) {
		$this->ads_conversion_id = $ads_conversion_id;
	}

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.31.0
	 */
	public function register() {
		Gtag_JS::enqueue( $this->tag_id );

		add_action( 'googlesitekit_gtag', array( $this, 'gtag_commands' ) );

		$this->do_init_tag_action();
	}

	public function gtag_commands( $gtag ) {
		$config = array();

		if ( ! empty( $this->home_domain ) ) {
			$config['linker'] = array( 'domains' => array( $this->home_domain ) );
		}

		if ( ! empty( $this->custom_dimensions ) ) {
			$config = array_merge( $config, $this->custom_dimensions );
		}

		/**
		 * Filters the gtag configuration options for the Analytics snippet.
		 *
		 * You can use the {@see 'googlesitekit_amp_gtag_opt'} filter to do the same for gtag in AMP.
		 *
		 * @since 1.24.0
		 *
		 * @see https://developers.google.com/gtagjs/devguide/configure
		 *
		 * @param array $config gtag config options.
		 */
		$gtag_opt = apply_filters( 'googlesitekit_gtag_opt', $config );

		if ( ! empty( $gtag_opt['linker'] ) ) {
			$gtag( 'set', 'linker', $gtag_opt['linker'] );
		}

		unset( $gtag_opt['linker'] );

		$gtag( 'config', $this->tag_id, (object) $gtag_opt );

		if ( $this->ads_conversion_id ) {
			$gtag( 'config', $this->ads_conversion_id );
		}
	}

	/**
	 * Outputs gtag snippet.
	 *
	 * @since 1.24.0
	 */
	protected function render() {
		// Do nothing, gtag script is enqueued.
	}
}
