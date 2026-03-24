<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Notices\Analytics_Setup_Email_Notice
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting\Notices;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Notices;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Modules\Analytics_4;
use WP_User;

/**
 * Analytics setup in-email notice definition.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Analytics_Setup_Email_Notice implements Email_Notice_Interface {

	/**
	 * Notice ID.
	 *
	 * @since 1.175.0
	 */
	const ID = 'analytics-setup';

	/**
	 * Dismissal key.
	 *
	 * @since 1.175.0
	 */
	const DISMISSAL_SLUG = 'email-report-notice-analytics-setup';

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
	 * Constructor.
	 *
	 * @since 1.175.0
	 *
	 * @param Context $context Plugin context.
	 * @param Modules $modules Modules service.
	 * @param Golinks $golinks Golinks service.
	 */
	public function __construct( Context $context, Modules $modules, Golinks $golinks ) {
		$this->context = $context;
		$this->modules = $modules;
		$this->golinks = $golinks;
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
		return Email_Notices::PLACEMENT_HEADER;
	}

	/**
	 * Gets the target section key.
	 *
	 * @since 1.175.0
	 *
	 * @return string Empty for header notices.
	 */
	public function get_section_key() {
		return '';
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

		if ( $this->modules->is_module_connected( Analytics_4::MODULE_SLUG ) ) {
			return false;
		}

		$disconnected_at = $this->modules->get_module_disconnected_at( Analytics_4::MODULE_SLUG );

		// Mirrors the existing "never connected" condition in dashboard notice logic.
		return empty( $disconnected_at );
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
			'title'            => __( 'Understand how visitors interact with your content', 'google-site-kit' ),
			'body'             => __( 'Get a deeper understanding of your customers. Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ),
			'learn_more_label' => __( 'Learn more', 'google-site-kit' ),
			'learn_more_url'   => add_query_arg( 'doc', 'ga4', 'https://sitekit.withgoogle.com/support/' ),
			'cta_label'        => __( 'Set up Analytics', 'google-site-kit' ),
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

		return add_query_arg(
			array(
				'slug'   => Analytics_4::MODULE_SLUG,
				'reAuth' => 'true',
			),
			$this->golinks->get_url( 'dashboard' )
		);
	}
}
