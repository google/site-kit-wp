<?php
/**
 * Class Google\Site_Kit\Core\Admin\Dashboard
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Modules;
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
	 * Modules instance.
	 *
	 * @since 1.7.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Authentication instance.
	 *
	 * @since 1.120.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 * @param Assets  $assets  Optional. Assets API instance. Default is a new instance.
	 * @param Modules $modules Optional. Modules instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		?Assets $assets = null,
		?Modules $modules = null
	) {
		$this->context = $context;
		$this->assets  = $assets ?: new Assets( $this->context );
		$this->modules = $modules ?: new Modules( $this->context );

		$this->authentication = new Authentication( $this->context );
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
	}

	/**
	 * Add a Site Kit by Google widget to the WordPress admin dashboard.
	 *
	 * @since 1.0.0
	 */
	private function add_widgets() {
		if ( ! current_user_can( Permissions::VIEW_WP_DASHBOARD_WIDGET ) ) {
			return;
		}

		// Enqueue styles.
		$this->assets->enqueue_asset( 'googlesitekit-wp-dashboard-css' );

		// Enqueue scripts.
		$this->assets->enqueue_asset( 'googlesitekit-wp-dashboard' );
		$this->modules->enqueue_assets();

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
	 * @since 1.120.0 Added the `data-view-only` attribute.
	 */
	private function render_googlesitekit_wp_dashboard() {
		$active_modules                 = $this->modules->get_active_modules();
		$analytics_connected            = isset( $active_modules['analytics-4'] ) && $active_modules['analytics-4']->is_connected();
		$search_console_connected       = isset( $active_modules['search-console'] ) && $active_modules['search-console']->is_connected();
		$is_view_only                   = ! $this->authentication->is_authenticated();
		$can_view_shared_analytics      = current_user_can( Permissions::READ_SHARED_MODULE_DATA, 'analytics-4' );
		$can_view_shared_search_console = current_user_can( Permissions::READ_SHARED_MODULE_DATA, 'search-console' );
		$display_analytics_data         = ( ! $is_view_only && $analytics_connected ) || ( $is_view_only && $can_view_shared_analytics );
		$display_search_console_data    = ( ! $is_view_only && $search_console_connected ) || ( $is_view_only && $can_view_shared_search_console );

		$class_names = array();

		if ( $analytics_connected && $display_analytics_data ) {
			$class_names[] = 'googlesitekit-wp-dashboard-analytics_active_and_connected';
		}

		if ( $search_console_connected && $display_search_console_data ) {
			$class_names[] = 'googlesitekit-wp-dashboard-search_console_active_and_connected';
		}

		if ( ! $analytics_connected && ! $is_view_only ) {
			$class_names[] = 'googlesitekit-wp-dashboard-analytics-activate-cta';
		}

		$class_names = implode( ' ', $class_names );

		$this->render_noscript_html();
		?>
		<div id="js-googlesitekit-wp-dashboard" data-view-only="<?php echo esc_attr( $is_view_only ); ?>" class="googlesitekit-plugin <?php echo esc_attr( $class_names ); ?>">
			<div class="googlesitekit-wp-dashboard googlesitekit-wp-dashboard-loading">
			<?php

				$this->render_loading_container( 'googlesitekit-wp-dashboard__cta' );
			?>

				<div class="googlesitekit-wp-dashboard-stats">
				<?php
				if ( $display_analytics_data ) {
					$this->render_loading_container( 'googlesitekit-wp-dashboard-loading__can_view_analytics' );
				}

				if ( $display_search_console_data ) {
					$this->render_loading_container( 'googlesitekit-wp-dashboard-loading__search_console_active_and_connected' );
				}

				if ( ! $analytics_connected && ! $is_view_only ) {
					$this->render_loading_container( 'googlesitekit-wp-dashboard-stats__cta' );
				}

				if ( $display_analytics_data ) {
					$this->render_loading_container( 'googlesitekit-unique-visitors-chart-widget' );
					$this->render_loading_container( 'googlesitekit-search-console-widget' );
				}
				?>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Render the loading container when data is not available and being fetched.
	 *
	 * @since 1.144.0
	 * @param string $class_names Class names to add to the container.
	 * @return void
	 */
	private function render_loading_container( $class_names ) {
		?>
		<div class="googlesitekit-preview-block <?php echo esc_attr( $class_names ); ?>">
			<div class="googlesitekit-preview-block__wrapper"></div>
		</div>
		<?php
	}
}
