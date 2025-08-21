<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Reset_Audiences
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Prompts\Dismissed_Prompts;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4;

/**
 * Class to reset Audience Segmentation Settings across multiple users.
 *
 * @since 1.137.0
 * @access private
 * @ignore
 */
class Reset_Audiences {

	/**
	 * User_Options instance.
	 *
	 * @since 1.137.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Dismissed_Prompts instance.
	 *
	 * @since 1.137.0
	 * @var Dismissed_Prompts
	 */
	protected $dismissed_prompts;

	/**
	 * Dismissed_Items instance.
	 *
	 * @since 1.137.0
	 * @var Dismissed_Items
	 */
	protected $dismissed_items;

	/**
	 * Audience Settings instance.
	 *
	 * @since 1.137.0
	 * @var Audience_Settings
	 */
	protected $audience_settings;

	const AUDIENCE_SEGMENTATION_DISMISSED_PROMPTS = array( 'audience_segmentation_setup_cta-notification' );

	const AUDIENCE_SEGMENTATION_DISMISSED_ITEMS = array(
		'audience-segmentation-add-group-notice',
		'setup-success-notification-audiences',
		'settings_visitor_groups_setup_success_notification',
		'audience-segmentation-no-audiences-banner',
		'audience-tile-*',
	);

	/**
	 * Constructor.
	 *
	 * @since 1.137.0
	 *
	 * @param User_Options $user_options User option API.
	 */
	public function __construct( ?User_Options $user_options = null ) {
		$this->user_options      = $user_options;
		$this->dismissed_prompts = new Dismissed_Prompts( $this->user_options );
		$this->dismissed_items   = new Dismissed_Items( $this->user_options );
		$this->audience_settings = new Audience_Settings( $this->user_options );
	}

	/**
	 * Reset audience specific settings for all SK users.
	 *
	 * @since 1.137.0
	 */
	public function reset_audience_data() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$users = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT DISTINCT user_id
				FROM $wpdb->usermeta
				WHERE meta_key IN (%s, %s)
				LIMIT 100 -- Arbitrary limit to avoid unbounded user iteration.",
				$this->user_options->get_meta_key( Dismissed_Items::OPTION ),
				$this->user_options->get_meta_key( Dismissed_Prompts::OPTION ),
			)
		);

		if ( $users ) {
			$backup_user_id = $this->user_options->get_user_id();

			foreach ( $users as $user_id ) {
				$this->user_options->switch_user( $user_id );

				// Remove Audience Segmentation specific dismissed prompts.
				foreach ( self::AUDIENCE_SEGMENTATION_DISMISSED_PROMPTS as $prompt ) {
					$this->dismissed_prompts->remove( $prompt );
				}

				// Remove Audience Segmentation specific dismissed items.
				foreach ( self::AUDIENCE_SEGMENTATION_DISMISSED_ITEMS as $item ) {
					// Support wildcard matches, in order to delete all dismissed items prefixed with audience-tile-*.
					if ( strpos( $item, '*' ) !== false ) {
						$dismissed_items = $this->dismissed_items->get();

						foreach ( array_keys( $dismissed_items ) as $existing_item ) {
							if ( str_starts_with( $existing_item, rtrim( $item, '*' ) ) ) {
								$this->dismissed_items->remove( $existing_item );
							}
						}
					} else {
						// For non-wildcard items, remove them directly.
						$this->dismissed_items->remove( $item );
					}
				}

				// Reset the user's audience settings.
				if ( $this->audience_settings->has() ) {
					$this->audience_settings->merge(
						array(
							'configuredAudiences' => null,
							'didSetAudiences'     => false,
						),
					);
				}
			}

			// Restore original user.
			$this->user_options->switch_user( $backup_user_id );
		}
	}
}
