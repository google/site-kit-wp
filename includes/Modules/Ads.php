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

use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Assets\Script_Data;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Module_With_Tag_Trait;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Site_Health\Debug_Data;
use Google\Site_Kit\Modules\Ads\PAX_Config;
use Google\Site_Kit\Modules\Ads\Settings;
use Google\Site_Kit\Modules\Ads\Has_Tag_Guard;
use Google\Site_Kit\Modules\Ads\Tag_Matchers;
use Google\Site_Kit\Modules\Ads\Web_Tag;
use Google\Site_Kit\Core\Tags\Guards\Tag_Environment_Type_Guard;
use Google\Site_Kit\Core\Tags\Guards\Tag_Verify_Guard;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Ads\AMP_Tag;

/**
 * Class representing the Ads module.
 *
 * @since 1.121.0
 * @access private
 * @ignore
 */
final class Ads extends Module implements Module_With_Assets, Module_With_Debug_Fields, Module_With_Scopes, Module_With_Settings, Module_With_Tag, Module_With_Deactivation {
	use Module_With_Assets_Trait;
	use Module_With_Scopes_Trait;
	use Module_With_Settings_Trait;
	use Module_With_Tag_Trait;
	use Method_Proxy_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'ads';

	const SCOPE                 = 'https://www.googleapis.com/auth/adwords';
	const SUPPORT_CONTENT_SCOPE = 'https://www.googleapis.com/auth/supportcontent';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.121.0
	 */
	public function register() {
		$this->register_scopes_hook();
		// Ads tag placement logic.
		add_action( 'template_redirect', array( $this, 'register_tag' ) );

		add_filter( 'googlesitekit_inline_modules_data', $this->get_method_proxy( 'inline_modules_data' ) );
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.122.0
	 * @since 1.126.0 Added PAX assets.
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		$base_url = $this->context->url( 'dist/assets/' );

		$assets = array(
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

		if ( Feature_Flags::enabled( 'adsPax' ) ) {
			$input                      = $this->context->input();
			$is_googlesitekit_dashboard = 'googlesitekit-dashboard' === $input->filter( INPUT_GET, 'page' );
			$is_ads_slug                = 'ads' === $input->filter( INPUT_GET, 'slug' );
			$is_re_auth                 = $input->filter( INPUT_GET, 'reAuth' );

			$assets[] = new Script_Data(
				'googlesitekit-ads-pax-config',
				array(
					'global'        => '_googlesitekitPAXConfig',
					'data_callback' => function() {
						if ( ! current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
							return array();
						}

						$config = new PAX_Config( $this->context, $this->authentication->token() );

						return $config->get();
					},
				)
			);
			// Integrator should be included if either Ads module is connected already,
			// or we are on the Ads module setup screen.
			if (
				current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD ) &&
				(
					// Integrator should be included if either:
					// The Ads module is already connected.
					$this->is_connected() ||
					// Or the user is on the Ads module setup screen.
					is_admin() && $is_googlesitekit_dashboard && $is_ads_slug && $is_re_auth
				)
			) {
				$assets[] = new Script(
					'googlesitekit-ads-pax-integrator',
					array(
						// When updating, mirror the fixed version for google-pax-sdk in package.json.
						'src'          => 'https://www.gstatic.com/pax/1.0.9/pax_integrator.js',
						'execution'    => 'async',
						'dependencies' => array(
							'googlesitekit-ads-pax-config',
							'googlesitekit-modules-data',
						),
						'version'      => null,
					)
				);
			}
		}

		return $assets;
	}

	/**
	 * Populates module data to pass to JS via _googlesitekitModulesData.
	 *
	 * @since 1.126.0
	 *
	 * @param array $modules_data Inline modules data.
	 * @return array Inline modules data.
	 */
	private function inline_modules_data( $modules_data ) {
		if ( $this->is_connected() && Feature_Flags::enabled( 'adsPax' ) ) {
			// Add the data under the `ads` key to make it clear it's scoped to this module.
			$modules_data['ads'] = array(
				'supportedConversionEvents' => array(),
			);
		}

		return $modules_data;
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.126.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		if ( Feature_Flags::enabled( 'adsPax' ) ) {
			$granted_scopes = $this->authentication->get_oauth_client()->get_granted_scopes();
			$options        = $this->get_settings()->get();

			if ( in_array( self::SCOPE, $granted_scopes, true ) || ! empty( $options['extCustomerID'] ) ) {
				return array( self::SCOPE, self::SUPPORT_CONTENT_SCOPE );
			}
		}

		return array();
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
	 * @since 1.127.0 Add additional check to account for paxConversionID and extCustomerID as well when feature flag is enabled.
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$options = $this->get_settings()->get();

		if ( Feature_Flags::enabled( 'adsPax' ) ) {
			if ( empty( $options['conversionID'] ) && empty( $options['paxConversionID'] ) && empty( $options['extCustomerID'] ) ) {
				return false;
			}

			return parent::is_connected();
		}

		if ( empty( $options['conversionID'] ) ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.122.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Registers the Ads tag.
	 *
	 * @since 1.124.0
	 */
	public function register_tag() {
		$ads_conversion_id = $this->get_settings()->get()['conversionID'];
		$pax_conversion_id = $this->get_settings()->get()['paxConversionID'];

		// The PAX-supplied Conversion ID should take precedence over the
		// user-supplied one, if both exist.
		if ( Feature_Flags::enabled( 'adsPax' ) && ! empty( $pax_conversion_id ) ) {
			$ads_conversion_id = $pax_conversion_id;
		}

		$tag = $this->context->is_amp()
			? new AMP_Tag( $ads_conversion_id, self::MODULE_SLUG )
			: new Web_Tag( $ads_conversion_id, self::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Verify_Guard( $this->context->input() ) );
		$tag->use_guard( new Has_Tag_Guard( $ads_conversion_id ) );
		$tag->use_guard( new Tag_Environment_Type_Guard() );

		if ( ! $tag->can_register() ) {
			return;
		}

		$home_domain = URL::parse( $this->context->get_canonical_home_url(), PHP_URL_HOST );
		$tag->set_home_domain( $home_domain );

		$tag->register();
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.124.0
	 *
	 * @return array An array of all debug fields.
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		return array(
			'ads_conversion_tracking_id' => array(
				'label' => __( 'Ads Conversion Tracking ID', 'google-site-kit' ),
				'value' => $settings['conversionID'],
				'debug' => Debug_Data::redact_debug_value( $settings['conversionID'] ),
			),
		);
	}

	/**
	 * Returns the Module_Tag_Matchers instance.
	 *
	 * @since 1.124.0
	 *
	 * @return Module_Tag_Matchers Module_Tag_Matchers instance.
	 */
	public function get_tag_matchers() {
		return new Tag_Matchers();
	}

}
