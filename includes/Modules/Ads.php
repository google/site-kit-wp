<?php
/**
 * Class Google\Site_Kit\Modules\Ads
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Modules\Ads\Settings;
use Google\Site_Kit\Modules\Ads\Conversion_Tracking;
use Google\Site_Kit\Modules\Ads\Conversion_Tracking\Event;
use Google\Site_Kit\Modules\Ads\Conversion_Tracking\Foo_Event_List;
use Google\Site_Kit\Modules\Ads\Conversion_Tracking\Event_List_Registry;

/**
 * Class representing the Ads module.
 *
 * @since 1.121.0
 * @access private
 * @ignore
 */
final class Ads extends Module implements Module_With_Assets, Module_With_Settings {
	use Module_With_Assets_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'ads';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.121.0
	 */
	public function register() {
		// @TODO Remove/move, this is POC code only.
		( new Conversion_Tracking( $this->context ) )->register();

		// @TODO Remove/move, this is POC code only.
		$foo_event = new Event(
			array(
				'action'   => 'load',
				'on'       => 'click',
				'selector' => 'body',
				'metadata' => array(
					'event_label' => 'foo',
				),
			)
		);

		// @TODO Remove/move, this is POC code only.
		$foo_event_list = new Foo_Event_List();

		// @TODO Remove/move, this is POC code only.
		$foo_event_list->add_event( $foo_event );

		// @TODO Remove/move, this is POC code only.
		$foo_event_list_registry = new Event_List_Registry();

		// @TODO Remove/move, this is POC code only.
		$foo_event_list_registry->register_list( $foo_event_list );

		// @TODO Remove/move, this is POC code that adds an event list via action hook.
		add_action(
			'googlesitekit_ads_register_event_lists',
			function ( Event_List_Registry $registry ) use ( $foo_event_list ) {
				$registry->register_list( $foo_event_list );
			}
		);

		// @TODO Remove this, it is forcing actions for testing Conversion_Tracking.
		do_action( 'googlesitekit_ads_init_tag' );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.122.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-ads',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-ads.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.121.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'ads',
			'name'        => _x( 'Ads', 'Service name', 'google-site-kit' ),
			'description' => __( 'Track conversions for your existing Google Ads campaigns', 'google-site-kit' ),
			'order'       => 1,
			'homepage'    => __( 'https://google.com/ads', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.122.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.122.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$options = $this->get_settings()->get();

		return parent::is_connected() && ! empty( $options['adsConversionID'] );
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.122.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

}
