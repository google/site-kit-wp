<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Screen_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Admin\Screen;

/**
 * Trait for a module that includes a screen.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
trait Module_With_Screen_Trait {

	/**
	 * Module screen instance.
	 *
	 * @since 1.0.0
	 * @var Screen|null
	 */
	private $screen = null;

	/**
	 * Gets the screen instance to add for the module.
	 *
	 * @since 1.0.0
	 *
	 * @return Screen Screen instance.
	 */
	final public function get_screen() {
		if ( null === $this->screen ) {
			$this->screen = new Screen(
				Screens::PREFIX . 'module-' . $this->slug,
				array(
					'title'            => $this->name,
					'capability'       => Permissions::VIEW_MODULE_DETAILS,
					'enqueue_callback' => function( Assets $assets ) {
						$assets->enqueue_asset( 'googlesitekit-module' );
					},
					'render_callback'  => function( Context $context ) {
						$module_info = $this->prepare_info_for_js();
						?>
						<script type="text/javascript">var googlesitekitCurrentModule = <?php echo wp_json_encode( $module_info ); ?>;
						</script>
						<div id="js-googlesitekit-module" class="googlesitekit-page"></div>
						<?php
					},
				)
			);
		}

		return $this->screen;
	}

	/**
	 * Registers the hook to add the module screen.
	 *
	 * @since 1.0.0
	 */
	private function register_screen_hook() {
		add_filter(
			'googlesitekit_module_screens',
			function( array $screens ) {
				$screens[] = $this->get_screen();
				return $screens;
			}
		);
	}
}
