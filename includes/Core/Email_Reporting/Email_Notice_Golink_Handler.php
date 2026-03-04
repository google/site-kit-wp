<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Notice_Golink_Handler
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Golinks\Golink_Handler_Interface;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Core\Email_Reporting\Notices\Analytics_Setup_Email_Notice;
use WP_User;

/**
 * Golink handler for in-email notice CTA URLs.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email_Notice_Golink_Handler implements Golink_Handler_Interface {

	/**
	 * Email notices resolver.
	 *
	 * @since n.e.x.t
	 * @var Email_Notices
	 */
	private $email_notices;

	/**
	 * Modules service.
	 *
	 * @since n.e.x.t
	 * @var Modules
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Email_Notices $email_notices Email notices resolver.
	 * @param Modules       $modules       Modules service.
	 */
	public function __construct( Email_Notices $email_notices, Modules $modules ) {
		$this->email_notices = $email_notices;
		$this->modules       = $modules;
	}

	/**
	 * Handles in-email notice CTA click redirects.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @return string Redirect destination URL.
	 */
	public function handle( Context $context ) {
		$notice_id = sanitize_key(
			(string) $context->input()->filter( INPUT_GET, 'notice_id', FILTER_DEFAULT )
		);

		$user = wp_get_current_user();

		if ( ! $user instanceof WP_User || ! $user->exists() ) {
			return $this->email_notices->get_default_redirect_url();
		}

		if (
			Analytics_Setup_Email_Notice::ID === $notice_id
			&& user_can( $user, Permissions::MANAGE_OPTIONS )
			&& ! $this->modules->is_module_active( Analytics_4::MODULE_SLUG )
		) {
			$this->modules->activate_module( Analytics_4::MODULE_SLUG );
		}

		$this->email_notices->dismiss_notice_for_user( $notice_id, $user );

		return $this->email_notices->get_notice_redirect_url( $notice_id, $user );
	}
}
