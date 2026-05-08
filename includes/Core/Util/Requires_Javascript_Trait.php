<?php
/**
 * Trait Google\Site_Kit\Core\Util\Requires_Javascript_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Trait to display no javascript fallback message.
 *
 * @since 1.5.0
 * @access private
 * @ignore
 */
trait Requires_Javascript_Trait {

	/**
	 * Outputs a fallback message when Javascript is disabled.
	 *
	 * @since 1.5.0
	 */
	protected function render_noscript_html() {
		?>
			<noscript>
				<div class="googlesitekit-noscript notice notice-warning">
					<div class="mdc-layout-grid">
						<div class="mdc-layout-grid__inner">
							<div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
								<p class="googlesitekit-noscript__text">
									<?php
										esc_html_e( 'The Site Kit by Google plugin requires JavaScript to be enabled in your browser.', 'google-site-kit' )
									?>
								</p>
							</div>
						</div>
					</div>
				</div>
			</noscript>
		<?php
	}
}
