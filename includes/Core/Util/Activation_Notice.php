<?php
/**
 * Class Google\Site_Kit\Core\Util\Activation_Notice
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Notice;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Util\Requires_Javascript_Trait;

/**
 * Class handling plugin activation.
 *
 * @since 1.10.0 Renamed from Activation.
 * @access private
 * @ignore
 */
final class Activation_Notice {
	use Requires_Javascript_Trait;

	/**
	 * Plugin context.
	 *
	 * @since 1.10.0
	 * @var Context
	 */
	private $context;

	/**
	 * Activation flag instance.
	 *
	 * @since 1.10.0
	 * @var Activation_Flag
	 */
	protected $activation_flag;

	/**
	 * Assets API instance.
	 *
	 * @since 1.10.0
	 * @var Assets
	 */
	protected $assets;

	/**
	 * Constructor.
	 *
	 * @since 1.10.0
	 *
	 * @param Context         $context         Plugin context.
	 * @param Activation_Flag $activation_flag Activation flag instance.
	 * @param Assets          $assets          Optional. The Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Activation_Flag $activation_flag,
		?Assets $assets = null
	) {
		$this->context         = $context;
		$this->activation_flag = $activation_flag;
		$this->assets          = $assets ?: new Assets( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.10.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_admin_notices',
			function ( $notices ) {
				$notices[] = $this->get_activation_notice();
				return $notices;
			}
		);

		add_action(
			'admin_enqueue_scripts',
			function ( $hook_suffix ) {
				if ( 'plugins.php' !== $hook_suffix || ! $this->activation_flag->get_activation_flag( is_network_admin() ) ) {
					return;
				}

				/**
				 * Prevent the default WordPress "Plugin Activated" notice from rendering.
				 *
				 * @link https://github.com/WordPress/WordPress/blob/e1996633228749cdc2d92bc04cc535d45367bfa4/wp-admin/plugins.php#L569-L570
				 */
				unset( $_GET['activate'] ); // phpcs:ignore WordPress.Security.NonceVerification, WordPress.VIP.SuperGlobalInputUsage

				$this->assets->enqueue_asset( 'googlesitekit-admin-css' );
				$this->assets->enqueue_asset( 'googlesitekit-activation' );
			}
		);
	}

	/**
	 * Gets the admin notice indicating that the plugin has just been activated.
	 *
	 * @since 1.10.0
	 *
	 * @return Notice Admin notice instance.
	 */
	private function get_activation_notice() {
		return new Notice(
			'activated',
			array(
				'content'         => function () {
					ob_start();
					?>
					<div class="googlesitekit-plugin">
						<?php $this->render_noscript_html(); ?>

						<div id="js-googlesitekit-activation" class="googlesitekit-activation googlesitekit-activation--loading">
							<div class="googlesitekit-activation__loading">
								<div role="progressbar" class="mdc-linear-progress mdc-linear-progress--indeterminate">
									<div class="mdc-linear-progress__buffering-dots"></div>
									<div class="mdc-linear-progress__buffer"></div>
									<div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
										<span class="mdc-linear-progress__bar-inner"></span>
									</div>
									<div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
										<span class="mdc-linear-progress__bar-inner"></span>
									</div>
								</div>
							</div>
						</div>
					</div>
					<?php
					return ob_get_clean();
				},
				'type'            => Notice::TYPE_SUCCESS,
				'active_callback' => function ( $hook_suffix ) {
					if ( 'plugins.php' !== $hook_suffix ) {
						return false;
					}
					$network_wide = is_network_admin();
					$flag         = $this->activation_flag->get_activation_flag( $network_wide );
					if ( $flag ) {
						// Unset the flag so that the notice only shows once.
						$this->activation_flag->delete_activation_flag( $network_wide );
					}
					return $flag;
				},
				'dismissible'     => true,
			)
		);
	}
}
