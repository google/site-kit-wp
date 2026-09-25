<?php
/**
 * Class Google\Site_Kit\Core\Abilities\Subscribe_To_Email_Reports
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Abilities;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Frequency_Planner;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use WP_Error;

/**
 * Ability for managing a user's email report subscription.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Subscribe_To_Email_Reports extends Ability {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Gets the ability slug.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability slug.
	 */
	protected function get_slug() {
		return 'subscribe-to-email-reports';
	}

	/**
	 * Gets the translated ability label.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability label.
	 */
	protected function get_label() {
		return __( 'Subscribe to Email Reports', 'google-site-kit' );
	}

	/**
	 * Gets the translated ability description.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability description.
	 */
	protected function get_description() {
		return __( 'Subscribes a user to weekly, monthly, or quarterly Site Kit email reports, or unsubscribes them with frequency none. Defaults to the current user. Returns the user ID and saved subscription settings, and schedules a confirmation email for a new subscription.', 'google-site-kit' );
	}

	/**
	 * Gets the input schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for frequency and an optional user ID.
	 */
	protected function get_input_schema() {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'frequency' => array(
					'type'        => 'string',
					'enum'        => array(
						Email_Reporting_Settings::FREQUENCY_WEEKLY,
						Email_Reporting_Settings::FREQUENCY_MONTHLY,
						Email_Reporting_Settings::FREQUENCY_QUARTERLY,
						'none',
					),
					'description' => __( 'Email report frequency, or none to unsubscribe.', 'google-site-kit' ),
				),
				'user_id'   => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'description' => __( 'WordPress user ID. Defaults to the current user when omitted.', 'google-site-kit' ),
				),
			),
			'required'             => array( 'frequency' ),
			'additionalProperties' => false,
		);
	}

	/**
	 * Gets the output schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the user ID and saved subscription settings.
	 */
	protected function get_output_schema() {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'user_id'    => array(
					'type'        => 'integer',
					'description' => __( 'WordPress user ID whose subscription was updated.', 'google-site-kit' ),
				),
				'subscribed' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the user is subscribed to email reports.', 'google-site-kit' ),
				),
				'frequency'  => array(
					'type'        => 'string',
					'enum'        => array(
						Email_Reporting_Settings::FREQUENCY_WEEKLY,
						Email_Reporting_Settings::FREQUENCY_MONTHLY,
						Email_Reporting_Settings::FREQUENCY_QUARTERLY,
					),
					'description' => __( 'Saved report frequency, retained when unsubscribing.', 'google-site-kit' ),
				),
			),
			'required'             => array( 'user_id', 'subscribed' ),
			'additionalProperties' => false,
		);
	}

	/**
	 * Gets the ability category.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Site Kit category slug.
	 */
	protected function get_category() {
		return self::CATEGORY;
	}

	/**
	 * Gets additional ability metadata.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Empty metadata.
	 */
	protected function get_meta() {
		return array();
	}

	/**
	 * Gets instructions for using the ability.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Usage instructions.
	 */
	protected function get_instructions() {
		return __( 'Use none to unsubscribe without clearing the saved frequency. Updating your own subscription requires Site Kit dashboard access. Updating another user requires permission to manage Site Kit options; subscribing them also requires that they can view the dashboard. This does not enable email reporting for the site.', 'google-site-kit' );
	}

	/**
	 * Checks whether the ability only reads data.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always false.
	 */
	protected function is_readonly() {
		return false;
	}

	/**
	 * Checks whether the ability may perform destructive updates.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always true because existing subscription settings are replaced.
	 */
	protected function is_destructive() {
		return true;
	}

	/**
	 * Checks whether repeated execution has no additional effect.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always true; unchanged subscriptions do not schedule confirmations.
	 */
	protected function is_idempotent() {
		return true;
	}

	/**
	 * Checks permissions for the current user and requested recipient.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return bool|WP_Error True if allowed, false or an error otherwise.
	 */
	protected function check_permissions( $input = null ) {
		$user_id      = $this->get_user_id( $input );
		$is_self      = get_current_user_id() === $user_id;
		$required_cap = $is_self ? Permissions::VIEW_DASHBOARD : Permissions::MANAGE_OPTIONS;

		if ( ! current_user_can( $required_cap ) ) {
			return false;
		}

		if ( ! get_userdata( $user_id ) || ( is_multisite() && ! is_user_member_of_blog( $user_id ) ) ) {
			return new WP_Error(
				'email_reporting_invalid_user_id',
				__( 'Invalid user ID.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		if ( ! $is_self && 'none' !== $input['frequency'] && ! user_can( $user_id, Permissions::VIEW_DASHBOARD ) ) {
			return new WP_Error(
				'email_reporting_ineligible_user',
				__( 'The provided user cannot view the Site Kit dashboard.', 'google-site-kit' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Updates the user's subscription and schedules a confirmation email.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return array|WP_Error User ID and saved settings, or a scheduling error.
	 */
	protected function execute( $input = null ) {
		$user_id  = $this->get_user_id( $input );
		$settings = array( 'subscribed' => 'none' !== $input['frequency'] );

		if ( $settings['subscribed'] ) {
			$settings['frequency'] = $input['frequency'];
		}

		$email_reporting_settings = new Email_Reporting_Settings( new User_Options( $this->context, $user_id ) );
		$previous_settings        = $email_reporting_settings->get();
		$email_reporting_settings->merge( $settings );
		$updated_settings = $email_reporting_settings->get();

		$scheduler        = new Email_Reporting_Scheduler( new Frequency_Planner() );
		$scheduling_error = $scheduler->schedule_email_confirmation(
			$user_id,
			$previous_settings,
			$updated_settings
		);

		if ( is_wp_error( $scheduling_error ) ) {
			return $scheduling_error;
		}

		return array_merge( $updated_settings, array( 'user_id' => $user_id ) );
	}

	/**
	 * Resolves the target user at execution time.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $input Validated ability input.
	 * @return int Target user ID.
	 */
	private function get_user_id( array $input ) {
		return isset( $input['user_id'] ) ? (int) $input['user_id'] : get_current_user_id();
	}
}
