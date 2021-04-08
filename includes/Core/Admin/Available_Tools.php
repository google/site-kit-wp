<?php
/**
 * Class Google\Site_Kit\Core\Admin\Available_Tools
 *
 * @package   Google\Site_Kit\Core\Admin
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\Reset;

/**
 * Class for extending available tools for Site Kit.
 *
 * @since 1.30.0
 * @access private
 * @ignore
 */
class Available_Tools {
	use Method_Proxy_Trait;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.30.0
	 */
	public function register() {
		add_action( 'tool_box', $this->get_method_proxy( 'render_tool_box' ) );
	}

	/**
	 * Renders tool box output.
	 *
	 * @since 1.30.0
	 */
	private function render_tool_box() {
		if ( ! current_user_can( Permissions::SETUP ) ) {
			return;
		}
		?>
		<div class="card">
			<h2 class="title"><?php esc_html_e( 'Reset Site Kit', 'google-site-kit' ); ?></h2>
			<p>
				<?php
				esc_html_e(
					'Resetting will disconnect all users and remove all Site Kit settings and data within WordPress. You and any other users who wish to use Site Kit will need to reconnect to restore access.',
					'google-site-kit'
				)
				?>
			</p>
			<p>
				<a
					class="button button-primary"
					href="<?php echo esc_url( Reset::url() ); ?>"
				>
					<?php esc_html_e( 'Reset Site Kit', 'google-site-kit' ); ?>
				</a>
			</p>
		</div>
		<?php
	}
}
