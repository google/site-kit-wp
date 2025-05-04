<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Core\Tags\Tag_With_Linker_Interface;
use Google\Site_Kit\Core\Tags\Tag_With_Linker_Trait;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for Web tag.
 *
 * @since 1.124.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag implements Tag_With_Linker_Interface {

	use Method_Proxy_Trait;
	use Tag_With_Linker_Trait;

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.124.0
	 */
	public function register() {
		// Set a lower priority here to let Analytics sets up its tag first.
		add_action(
			'googlesitekit_setup_gtag',
			$this->get_method_proxy( 'setup_gtag' ),
			20
		);

		$this->do_init_tag_action();
	}

	/**
	 * Outputs gtag snippet.
	 *
	 * @since 1.124.0
	 */
	protected function render() {
		// Do nothing, gtag script is enqueued.
	}

	/**
	 * Configures gtag script.
	 *
	 * @since 1.124.0
	 *
	 * @param GTag $gtag GTag instance.
	 */
	protected function setup_gtag( $gtag ) {
		$gtag->add_tag( $this->tag_id );

		$filter_google_gtagjs = function ( $tag, $handle ) {
			if ( GTag::HANDLE !== $handle ) {
				return $tag;
			}

			// Retain this comment for detection of Site Kit placed tag.
			$snippet_comment = sprintf( "\n<!-- %s -->\n", esc_html__( 'Google Ads snippet added by Site Kit', 'google-site-kit' ) );

			return $snippet_comment . $tag;
		};

		add_filter( 'script_loader_tag', $filter_google_gtagjs, 10, 2 );
	}
}
