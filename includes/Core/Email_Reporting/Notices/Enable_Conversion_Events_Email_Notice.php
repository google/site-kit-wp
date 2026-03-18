<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Notices\Enable_Conversion_Events_Email_Notice
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting\Notices;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Email_Reporting\Email_Notices;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Modules\Analytics_4;
use WP_User;

/**
 * Conversion events setup in-email notice definition.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Enable_Conversion_Events_Email_Notice implements Email_Notice_Interface {

	/**
	 * Notice ID.
	 *
	 * @since 1.175.0
	 */
	const ID = 'enable-conversion-events';

	/**
	 * Dismissal key.
	 *
	 * @since 1.175.0
	 */
	const DISMISSAL_SLUG = 'email-report-notice-enable-conversion-events';

	/**
	 * Target section key for this notice.
	 *
	 * @since 1.175.0
	 */
	const SECTION_KEY = 'is_my_site_helping_my_business_grow';

	/**
	 * Plugin context.
	 *
	 * @since 1.175.0
	 * @var Context
	 */
	private $context;

	/**
	 * Modules service.
	 *
	 * @since 1.175.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Golinks service.
	 *
	 * @since 1.175.0
	 * @var Golinks
	 */
	private $golinks;

	/**
	 * Conversion tracking settings.
	 *
	 * @since 1.175.0
	 * @var Conversion_Tracking_Settings
	 */
	private $conversion_tracking_settings;

	/**
	 * Conversion tracking service.
	 *
	 * @since 1.175.0
	 * @var Conversion_Tracking
	 */
	private $conversion_tracking;

	/**
	 * Constructor.
	 *
	 * @since 1.175.0
	 *
	 * @param Context                      $context                      Plugin context.
	 * @param Modules                      $modules                      Modules service.
	 * @param Golinks                      $golinks                      Golinks service.
	 * @param Conversion_Tracking_Settings $conversion_tracking_settings Conversion tracking settings.
	 * @param Conversion_Tracking          $conversion_tracking          Conversion tracking service.
	 */
	public function __construct(
		Context $context,
		Modules $modules,
		Golinks $golinks,
		Conversion_Tracking_Settings $conversion_tracking_settings,
		Conversion_Tracking $conversion_tracking
	) {
		$this->context                      = $context;
		$this->modules                      = $modules;
		$this->golinks                      = $golinks;
		$this->conversion_tracking_settings = $conversion_tracking_settings;
		$this->conversion_tracking          = $conversion_tracking;
	}

	/**
	 * Gets the notice ID.
	 *
	 * @since 1.175.0
	 *
	 * @return string Notice ID.
	 */
	public function get_id() {
		return self::ID;
	}

	/**
	 * Gets the notice placement.
	 *
	 * @since 1.175.0
	 *
	 * @return string Placement slug.
	 */
	public function get_placement() {
		return Email_Notices::PLACEMENT_SECTION;
	}

	/**
	 * Gets the target section key.
	 *
	 * @since 1.175.0
	 *
	 * @return string Section key.
	 */
	public function get_section_key() {
		return self::SECTION_KEY;
	}

	/**
	 * Gets dismissal key for prompt storage.
	 *
	 * @since 1.175.0
	 *
	 * @return string Dismissal key.
	 */
	public function get_dismissal_slug() {
		return self::DISMISSAL_SLUG;
	}

	/**
	 * Determines whether the notice should be shown to a user.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user User.
	 * @return bool True if notice should be displayed.
	 */
	public function should_display( WP_User $user ) {
		if ( ! user_can( $user, Permissions::MANAGE_OPTIONS ) ) {
			return false;
		}

		if ( ! $this->modules->is_module_connected( Analytics_4::MODULE_SLUG ) ) {
			return false;
		}

		if ( $this->conversion_tracking_settings->is_conversion_tracking_enabled() ) {
			return false;
		}

		$active_providers = $this->conversion_tracking->get_active_providers();

		return ! empty( $active_providers );
	}

	/**
	 * Gets display payload for a user.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user User.
	 * @return array Notice payload.
	 */
	public function get_payload( WP_User $user ) {
		if ( ! user_can( $user, Permissions::MANAGE_OPTIONS ) ) {
			return array();
		}

		return array(
			'title'            => __( 'Unlock your full funnel', 'google-site-kit' ),
			'body'             => __( 'The key metrics feature lets you track the entire user journey, from initial interest to a key event, so you can optimize your funnel and drive better results to achieve your goals.', 'google-site-kit' ),
			'learn_more_label' => __( 'Learn more', 'google-site-kit' ),
			'learn_more_url'   => add_query_arg( 'doc', 'key-metrics', 'https://sitekit.withgoogle.com/support/' ),
			'cta_label'        => __( 'Set up', 'google-site-kit' ),
			'cta_url'          => add_query_arg(
				'notice_id',
				self::ID,
				$this->golinks->get_url( Email_Notices::GOLINK_NOTICE )
			),
		);
	}

	/**
	 * Gets redirect URL for a notice CTA click.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user User.
	 * @return string Redirect URL.
	 */
	public function get_redirect_url( WP_User $user ) {
		if ( ! user_can( $user, Permissions::MANAGE_OPTIONS ) ) {
			return $this->golinks->get_url( 'dashboard' );
		}

		return sprintf(
			'%s#connected-services/%s/edit',
			$this->context->admin_url( 'settings' ),
			Analytics_4::MODULE_SLUG
		);
	}
}
