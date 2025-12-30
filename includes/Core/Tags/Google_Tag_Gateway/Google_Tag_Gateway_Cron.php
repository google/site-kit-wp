<?php
/**
 * Class Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Cron
 *
 * @package   Google\Site_Kit\Core\Tags\Google_Tag_Gateway
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Google_Tag_Gateway;

/**
 * Class to manage Google Tag Gateway cron tasks.
 *
 * @since 1.142.0
 * @since 1.157.0 Renamed from First_Party_Mode_Cron to Google_Tag_Gateway_Cron.
 * @access private
 * @ignore
 */
class Google_Tag_Gateway_Cron {

	const CRON_ACTION = 'googlesitekit_cron_google_tag_gateway_healthchecks';

	/**
	 * Cron callback reference.
	 *
	 * @var callable
	 */
	private $cron_callback;

	/**
	 * Google_Tag_Gateway_Settings instance.
	 *
	 * @var Google_Tag_Gateway_Settings
	 */
	private $google_tag_gateway_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.142.0
	 *
	 * @param Google_Tag_Gateway_Settings $google_tag_gateway_settings Google_Tag_Gateway_Settings instance.
	 * @param callable                    $callback                  Function to call on the cron action.
	 */
	public function __construct(
		Google_Tag_Gateway_Settings $google_tag_gateway_settings,
		callable $callback
	) {
		$this->google_tag_gateway_settings = $google_tag_gateway_settings;
		$this->cron_callback               = $callback;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.142.0
	 */
	public function register() {
		add_action( self::CRON_ACTION, $this->cron_callback );
	}

	/**
	 * Schedules cron if not already set.
	 *
	 * @since 1.142.0
	 */
	public function maybe_schedule_cron() {
		$settings    = $this->google_tag_gateway_settings->get();
		$gtg_enabled = $settings['isEnabled'];

		if (
			$gtg_enabled &&
			! wp_next_scheduled( self::CRON_ACTION ) &&
			! wp_installing()
		) {
			wp_schedule_event( time(), 'hourly', self::CRON_ACTION );
		}
	}
}
