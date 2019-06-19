<?php
/**
 * Class Google\Site_Kit\Core\Util\Debug_Bar
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Authentication\Authentication;

/**
 * Debug Bar class, extending the Debug_Bar_Panel from Debug Bar Plugin.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Debug_Bar extends \Debug_Bar_Panel {
	/**
	 * Panel menu title.
	 *
	 * @var string $title P
	 */
	public $title;

	/**
	 * Initial debug bar stuff
	 */
	public function init() {
		$this->title( esc_html__( 'Site Kit', 'google-site-kit' ) );
	}

	/**
	 * Show the menu item in Debug Bar.
	 */
	public function prerender() {
		$this->set_visible( true );
	}

	/**
	 * Show the contents of the panel
	 */
	public function render() {
		$authentication = new Authentication( \Google\Site_Kit\Plugin::instance()->context() );
		$google_client  = $authentication->get_oauth_client()->get_client();
		?>
		<h3 class="googlesitekit-debug-title"><?php esc_html_e( 'Site Kit by Google Debug Info', 'google-site-kit' ); ?></h3>
		<ol class="googlesitekit-debug-list">
			<li>
				<?php
				esc_html_e( 'Authentication Token is expired: ', 'google-site-kit' );
				( $google_client->isAccessTokenExpired() ) ? esc_html_e( 'Yes', 'google-site-kit' ) : esc_html_e( 'No', 'google-site-kit' );
				?>

			</li>
		</ol>
		<?php
	}
}
