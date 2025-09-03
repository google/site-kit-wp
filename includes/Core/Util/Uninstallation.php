<?php
/**
 * Class Google\Site_Kit\Core\Util\Uninstallation
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Cron;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Cron;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Cron;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_AdSenseLinked;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_AdsLinked;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_Property;

/**
 * Utility class for handling uninstallation of the plugin.
 *
 * @since 1.20.0
 * @access private
 * @ignore
 */
class Uninstallation {

	/**
	 * Plugin context.
	 *
	 * @since 1.20.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @since 1.20.0
	 * @var Options
	 */
	private $options;

	/**
	 * List of scheduled events.
	 *
	 * @since 1.136.0
	 * @var array
	 */
	const SCHEDULED_EVENTS = array(
		Conversion_Reporting_Cron::CRON_ACTION,
		OAuth_Client::CRON_REFRESH_PROFILE_DATA,
		Remote_Features_Cron::CRON_ACTION,
		Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED,
		Synchronize_AdsLinked::CRON_SYNCHRONIZE_ADS_LINKED,
		Synchronize_Property::CRON_SYNCHRONIZE_PROPERTY,
		Google_Tag_Gateway_Cron::CRON_ACTION,
	);

	/**
	 * Constructor.
	 *
	 * This class and its logic must be instantiated early in the WordPress
	 * bootstrap lifecycle because the 'uninstall.php' script runs decoupled
	 * from regular action hooks like 'init'.
	 *
	 * @since 1.20.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Options instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		?Options $options = null
	) {
		$this->context = $context;
		$this->options = $options ?: new Options( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.20.0
	 */
	public function register() {
		add_action(
			'googlesitekit_uninstallation',
			function () {
				$this->uninstall();
				$this->clear_scheduled_events();
			}
		);

		add_action(
			'googlesitekit_deactivation',
			function () {
				$this->clear_scheduled_events();
			}
		);

		add_action(
			'googlesitekit_reset',
			function () {
				$this->clear_scheduled_events();
			}
		);
	}

	/**
	 * Runs necessary logic for uninstallation of the plugin.
	 *
	 * If connected to the proxy, it will issue a request to unregister the site.
	 *
	 * @since 1.20.0
	 */
	private function uninstall() {
		$credentials = new Credentials( new Encrypted_Options( $this->options ) );
		if ( $credentials->has() && $credentials->using_proxy() ) {
			$google_proxy = new Google_Proxy( $this->context );
			$google_proxy->unregister_site( $credentials );
		}
	}

	/**
	 * Clears all scheduled events.
	 *
	 * @since 1.136.0
	 */
	private function clear_scheduled_events() {
		foreach ( self::SCHEDULED_EVENTS as $event ) {
			// Only clear scheduled events that are set, important in E2E
			// testing.
			if ( (bool) wp_next_scheduled( $event ) ) {
				wp_unschedule_hook( $event );
			}
		}
	}
}
