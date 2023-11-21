<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Synchronize_Property
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;

/**
 * The base class for Synchronizing the Analytics 4 property.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Synchronize_Property {

	const CRON_SYNCHRONIZE_PROPERTY = 'googlesitekit_cron_synchronize_property_data';

	/**
	 * Analytics_4 instance.
	 *
	 * @since n.e.x.t
	 * @var Analytics_4
	 */
	protected $analytics_4;

	/**
	 * User_Options instance.
	 *
	 * @since n.e.x.t
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * User_Options instance.
	 *
	 * @since n.e.x.t
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Analytics_4    $analytics_4 Analytics 4 instance.
	 * @param User_Options   $user_options User_Options instance.
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct( Analytics_4 $analytics_4, User_Options $user_options, Authentication $authentication ) {
		$this->analytics_4    = $analytics_4;
		$this->user_options   = $user_options;
		$this->authentication = $authentication;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {

		add_action(
			self::CRON_SYNCHRONIZE_PROPERTY,
			function() {
				$owner_id         = $this->analytics_4->get_owner_id();
				$original_user_id = $this->user_options->get_user_id();

				$this->user_options->switch_user( $owner_id );

				if ( $this->authentication->is_authenticated() ) {
					$property = $this->retrieve_property();

					$this->synchronize_property_create_time( $property );
				}

				$this->user_options->switch_user( $original_user_id );
			}
		);
	}

	/**
	 * Schedules single cron which will synchronize the property data.
	 *
	 * @since n.e.x.t
	 */
	public function schedule_synchronize_property() {
		$create_time_has_value  = $this->check_for_setting_value( 'propertyCreateTime' );
		$analytics_4_connected  = $this->analytics_4->is_connected();
		$cron_already_scheduled = wp_next_scheduled( self::CRON_SYNCHRONIZE_PROPERTY );

		if ( ! $create_time_has_value && $analytics_4_connected && ! $cron_already_scheduled ) {
			wp_schedule_single_event( time(), self::CRON_SYNCHRONIZE_PROPERTY );
		}
	}

	/**
	 * Retrieve the Analytics 4 property.
	 *
	 * @since n.e.x.t
	 *
	 * @return GoogleAnalyticsAdminV1betaProperty|null $property Analytics 4 property object, or null if property is not found.
	 */
	protected function retrieve_property() {
		$property_id = $this->check_for_setting_value( 'propertyID', true );
		$property    = $this->analytics_4->get_data( 'property', array( 'propertyID' => $property_id ) );

		if ( is_wp_error( $property ) ) {
			return null;
		}

		return $property;
	}

	/**
	 * Synchronize the property create time data.
	 *
	 * @since n.e.x.t
	 *
	 * @param GoogleAnalyticsAdminV1betaProperty|null $property Analytics 4 property object, or null if property is not found.
	 */
	protected function synchronize_property_create_time( $property ) {
		if ( ! $property ) {
			return;
		}

		$create_time = new \DateTime( $property->createTime, new \DateTimeZone( 'UTC' ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		// Convert to Unix timestamp and then to milliseconds.
		$create_time_ms = (int) ( $create_time->getTimestamp() * 1000 );

		$this->analytics_4->get_settings()->merge(
			array(
				'propertyCreateTime' => $create_time_ms,
			)
		);
	}

	/**
	 * Check for setting value.
	 *
	 * @since n.e.x.t
	 *
	 * @param string  $setting_name Setting name for which to check value for.
	 * @param boolean $return_value Whether to return the value of found setting, or just boolean to mark setting has value or not.
	 * @return boolean|string If setting is present either Bollean, or value of the setting, otherwise false.
	 */
	protected function check_for_setting_value( $setting_name, $return_value = false ) {
		$settings = $this->analytics_4->get_settings()->get();

		if ( ! isset( $settings[ $setting_name ] ) ) {
			return false;
		}

		if ( isset( $settings[ $setting_name ] ) && empty( $settings[ $setting_name ] ) ) {
			return false;
		}

		// If it reached here, it means setting is present and has a value.
		if ( $return_value ) {
			return $settings[ $setting_name ];
		}

		return true;
	}
}
