<?php
/**
 * Class Google\Site_Kit\Core\Admin\Dashboard
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Requires_Javascript_Trait;

/**
 * Class to handle all wp-admin Dashboard related functionality.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Dashboard {
	use Requires_Javascript_Trait;

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Assets Instance.
	 *
	 * @since 1.0.0
	 * @var Assets
	 */
	private $assets;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 * @param Assets  $assets  Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Assets $assets = null ) {
		$this->context = $context;

		if ( ! $assets ) {
			$assets = new Assets( $this->context );
		}
		$this->assets = $assets;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_action(
			'wp_dashboard_setup',
			function () {
				$this->add_widgets();
			}
		);

		$wp_dashboard_callback = function() {
			if ( 'dashboard' === get_current_screen()->id && current_user_can( Permissions::VIEW_DASHBOARD ) ) {
				// Enqueue fonts.
				$this->assets->enqueue_fonts();

				// Enqueue styles.
				$this->assets->enqueue_asset( 'googlesitekit-wp-dashboard-css' );

				// Enqueue scripts.
				$this->assets->enqueue_asset( 'googlesitekit-wp-dashboard' );
			}
		};

		add_action( 'admin_enqueue_scripts', $wp_dashboard_callback, 30 );
	}

	/**
	 * Add a Site Kit by Google widget to the WordPress admin dashboard.
	 *
	 * @since 1.0.0
	 */
	private function add_widgets() {
		// Only show the Dashboard Widget if the current user has access.
		if ( ! current_user_can( Permissions::VIEW_DASHBOARD ) ) {
			return;
		}

		wp_add_dashboard_widget(
			'google_dashboard_widget',
			__( 'Site Kit Summary', 'google-site-kit' ),
			function () {
				$this->render_googlesitekit_wp_dashboard();
			}
		);
	}

	/**
	 * Render the Site Kit WordPress Dashboard widget.
	 *
	 * @since 1.0.0
	 */
	private function render_googlesitekit_wp_dashboard() {
		do_action( 'googlesitekit_above_wp_dashboard_app' );

		$this->render_noscript_html();
		?>
		<div id="js-googlesitekit-wp-dashboard"></div>
		<?php
	}
}
