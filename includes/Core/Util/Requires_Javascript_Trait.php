<?php
/**
 * Trait Google\Site_Kit\Core\Util\Requires_Javascript_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Trait to display no javascript fallback message.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Requires_Javascript_Trait {

	/**
	 * Display fallback message when Javascript is disabled
	 *
	 * @since n.e.x.t
	 *
	 * @return string noscript HTML tag,
	 */
	protected function get_noscript_html() {

		ob_start();

		?>
			<noscript>
				<div class="googlesitekit-noscript notice notice-warning">
					<div class="mdc-layout-grid">
						<div class="mdc-layout-grid__inner">
							<div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
								<h3 class="googlesitekit-heading-3 googlesitekit-noscript__title">
									<?php
										esc_html_e( 'The Site Kit by Google plugin requires JavaScript to be enabled in your browser.', 'google-site-kit' )
									?>
								</h3>
							</div>
						</div>
					</div>
				</div>
			</noscript>
		<?php

		return ob_get_clean();
	}
}
