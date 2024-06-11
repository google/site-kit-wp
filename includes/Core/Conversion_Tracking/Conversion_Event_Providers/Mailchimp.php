<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Mailchimp
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;

/**
 * Class for handling Mailchimp conversion events.
 *
 * @since 1.127.0
 * @access private
 * @ignore
 */
class Mailchimp extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'mailchimp';

	/**
	 * Checks if the Mailchimp plugin is active.
	 *
	 * @since 1.127.0
	 *
	 * @return bool True if Mailchimp is active, false otherwise.
	 */
	public function is_active() {
		return defined( 'MC4WP_VERSION' );
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * @since 1.127.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array( 'submit_lead_form' );
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.127.0
	 *
	 * @return Script Script instance.
	 */
	public function register_script() {
		$script = new Script(
			'gsk-cep-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'          => $this->context->url( 'dist/assets/js/mailchimp.js' ),
				'execution'    => 'defer',
				'dependencies' => array( 'mc4wp-forms-api' ),
			)
		);

		$script->register( $this->context );

		return $script;
	}

}
