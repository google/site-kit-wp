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

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;

/**
 * The base class for Synchronizing the Analytics 4 property.
 *
 * @since 1.116.0
 * @access private
 * @ignore
 */
class Synchronize_Property {

	const CRON_SYNCHRONIZE_PROPERTY = 'googlesitekit_cron_synchronize_property_data';

	/**
	 * Analytics_4 instance.
	 *
	 * @since 1.116.0
	 * @var Analytics_4
	 */
	protected $analytics_4;

	/**
	 * User_Options instance.
	 *
	 * @since 1.116.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.116.0
	 *
	 * @param Analytics_4  $analytics_4 Analytics 4 instance.
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( Analytics_4 $analytics_4, User_Options $user_options ) {
		$this->analytics_4  = $analytics_4;
		$this->user_options = $user_options;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.116.0
	 */
	public function register() {

		add_action(
			self::CRON_SYNCHRONIZE_PROPERTY,
			function () {
				$this->synchronize_property_data();
			}
		);
	}

	/**
	 * Cron callback for synchronizing the property.
	 *
	 * @since 1.116.0
	 */
	protected function synchronize_property_data() {
		$owner_id     = $this->analytics_4->get_owner_id();
		$restore_user = $this->user_options->switch_user( $owner_id );

		if ( user_can( $owner_id, Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
			$property = $this->retrieve_property();

			$this->synchronize_property_create_time( $property );
		}

		$restore_user();
	}

	/**
	 * Schedules single cron which will synchronize the property data.
	 *
	 * @since 1.116.0
	 */
	public function maybe_schedule_synchronize_property() {
		$settings = $this->analytics_4->get_settings()->get();

		$create_time_has_value  = (bool) $settings['propertyCreateTime'];
		$analytics_4_connected  = $this->analytics_4->is_connected();
		$cron_already_scheduled = wp_next_scheduled( self::CRON_SYNCHRONIZE_PROPERTY );

		if ( ! $create_time_has_value && $analytics_4_connected && ! $cron_already_scheduled ) {
			wp_schedule_single_event(
				// Schedule the task to run in 30 minutes.
				time() + ( 30 * MINUTE_IN_SECONDS ),
				self::CRON_SYNCHRONIZE_PROPERTY
			);
		}
	}

	/**
	 * Retrieve the Analytics 4 property.
	 *
	 * @since 1.116.0
	 *
	 * @return GoogleAnalyticsAdminV1betaProperty|null $property Analytics 4 property object, or null if property is not found.
	 */
	protected function retrieve_property() {
		$settings = $this->analytics_4->get_settings()->get();

		$property_id = $settings['propertyID'];
		$property    = $this->analytics_4->get_data( 'property', array( 'propertyID' => $property_id ) );

		if ( is_wp_error( $property ) ) {
			return null;
		}

		return $property;
	}

	/**
	 * Synchronize the property create time data.
	 *
	 * @since 1.116.0
	 *
	 * @param GoogleAnalyticsAdminV1betaProperty|null $property Analytics 4 property object, or null if property is not found.
	 */
	protected function synchronize_property_create_time( $property ) {
		if ( ! $property ) {
			return;
		}

		$create_time_ms = self::convert_time_to_unix_ms( $property->createTime ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		$this->analytics_4->get_settings()->merge(
			array(
				'propertyCreateTime' => $create_time_ms,
			)
		);
	}

	/**
	 * Convert to Unix timestamp and then to milliseconds.
	 *
	 * @since 1.116.0
	 *
	 * @param string $date_time Date in date-time format.
	 */
	public static function convert_time_to_unix_ms( $date_time ) {
		$date_time_object = new \DateTime( $date_time, new \DateTimeZone( 'UTC' ) );

		return (int) ( $date_time_object->getTimestamp() * 1000 );
	}
}
