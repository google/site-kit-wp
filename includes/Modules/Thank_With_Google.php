<?php
/**
 * Class Google\Site_Kit\Modules\Thank_With_Google
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Owner_Trait;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Thank_With_Google\Settings;
use Google\Site_Kit\Modules\Thank_With_Google\Web_Tag;

/**
 * Class representing the Thank with Google module.
 *
 * @since 1.78.0
 * @access private
 * @ignore
 */
final class Thank_With_Google extends Module
	implements Module_With_Assets, Module_With_Deactivation, Module_With_Owner, Module_With_Settings {
	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Owner_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'thank-with-google';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.78.0
	 */
	public function register() {
		if ( ! $this->is_connected() ) {
			return;
		}

		add_action( 'template_redirect', $this->get_method_proxy( 'register_tag' ) );
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.78.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$settings = $this->get_settings()->get();

		if ( ! $settings ) {
			return false;
		}

		if ( ! $settings['publicationID'] ) {
			return false;
		}

		if ( ! $settings['colorTheme'] ) {
			return false;
		}

		if ( ! $settings['buttonPlacement'] ) {
			return false;
		}

		if ( ! $settings['buttonPostTypes'] ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.78.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.78.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => 'thank-with-google',
			'name'        => _x( 'Thank with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Let your supporters show appreciation of your work through virtual stickers and personal messages', 'google-site-kit' ),
			'order'       => 7,
			'homepage'    => __( 'https://publishercenter.google.com/', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.78.0
	 *
	 * @return Module_Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.78.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		return array(
			new Script(
				'googlesitekit-modules-thank-with-google',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules-thank-with-google.js',
					'dependencies' => array(
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-datastore-site',
						'googlesitekit-modules',
						'googlesitekit-vendor',
					),
				)
			),
		);
	}

	/**
	 * Gets map of datapoint to definition data for each.
	 *
	 * @since 1.79.0
	 * @return array Map of datapoints to their definitions.
	 */
	protected function get_datapoint_definitions() {
		return array(
			'GET:publications' => array( 'service' => '' ),
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.79.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 *
	 * @throws Invalid_Datapoint_Exception Thrown if the datapoint does not exist.
	 */
	protected function create_data_request( Data_Request $data ) {
		switch ( "{$data->method}:{$data->datapoint}" ) {
			case 'GET:publications':
				return function () {
					return array();
				};
		}

		return parent::create_data_request( $data );
	}

	/**
	 * Registers the Thank with Google tag.
	 *
	 * @since 1.80.0
	 */
	private function register_tag() {
		if ( $this->context->is_amp() ) {
			return;
		}

		$settings = $this->get_settings()->get();

		$tag = new Web_Tag( $settings['publicationID'], self::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( $tag->can_register() ) {
			$tag->set_button_placement( $settings['buttonPlacement'] );
			$tag->set_button_post_types( $settings['buttonPostTypes'] );

			$tag->register();
		}
	}

}
