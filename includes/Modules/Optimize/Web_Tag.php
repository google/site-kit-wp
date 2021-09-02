<?php
/**
 * Class Google\Site_Kit\Modules\Optimize\Web_Tag
 *
 * @package   Google\Site_Kit\Modules\Optimize
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Optimize;

use Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait;
use Google\Site_Kit\Core\Util\BC_Functions;

/**
 * Class for Web tag.
 *
 * @since 1.39.0
 * @access private
 * @ignore
 */
class Web_Tag extends Module_Web_Tag {

	use Method_Proxy_Trait;

	/**
	 * Registers tag hooks.
	 *
	 * @since 1.39.0
	 */
	public function register() {
		add_action( 'wp_head', $this->get_method_proxy_once( 'render' ), 1 );

		$this->do_init_tag_action();
	}

	/**
	 * Outputs the Optimize anti-flicker script tag.
	 *
	 * @since 1.39.0
	 */
	protected function render() {

		$anti_flicker_script = sprintf(
			"(function(a,s,y,n,c,h,i,d,e){s.className+=' '+y;h.start=1*new Date;
			h.end=i=function(){s.className=s.className.replace(RegExp(' ?'+y),'')};
			(a[n]=a[n]||[]).hide=h;setTimeout(function(){i();h.end=null},c);h.timeout=c;
			})(window,document.documentElement,'async-hide','dataLayer',4000,
			{'%s':true});",
			esc_js( $this->tag_id )
		);

		printf( "\n<!-- %s -->\n", esc_html__( 'Anti-flicker snippet added by Site Kit', 'google-site-kit' ) );
		echo '<style>.async-hide { opacity: 0 !important} </style>';
		BC_Functions::wp_print_inline_script_tag( $anti_flicker_script );
		printf( "\n<!-- %s -->\n", esc_html__( 'End Anti-flicker snippet added by Site Kit', 'google-site-kit' ) );
	}

}
