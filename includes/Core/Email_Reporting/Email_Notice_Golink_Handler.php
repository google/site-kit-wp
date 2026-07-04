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

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Golinks\Golink_Handler_Interface;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Core\Email_Reporting\Notices\Analytics_Setup_Email_Notice;
use WP_User;

/**
 * Golink handler for in-email notice CTA URLs.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Email_Notice_Golink_Handler implements Golink_Handler_Interface {

	/**
	 * Email notices resolver.
	 *
	 * @since 1.175.0
	 * @var Email_Notices
	 */
	private $email_notices;

	/**
	 * Modules service.
	 *
	 * @since 1.175.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Authentication service.
	 *
	 * @since 1.175.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Constructor.
	 *
	 * @since 1.175.0
	 *
	 * @param Email_Notices  $email_notices  Email notices resolver.
	 * @param Modules        $modules        Modules service.
	 * @param Authentication $authentication Authentication service.
	 */
	public function __construct( Email_Notices $email_notices, Modules $modules, Authentication $authentication ) {
		$this->email_notices  = $email_notices;
		$this->modules        = $modules;
		$this->authentication = $authentication;
	}

	/**
	 * Handles in-email notice CTA click redirects.
	 *
	 * @since 1.175.0
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

		$redirect_url = $this->email_notices->get_notice_redirect_url( $notice_id, $user );

		if (
			Analytics_Setup_Email_Notice::ID === $notice_id
			&& user_can( $user, Permissions::MANAGE_OPTIONS )
		) {
			if ( ! $this->modules->is_module_active( Analytics_4::MODULE_SLUG ) ) {
				$this->modules->activate_module( Analytics_4::MODULE_SLUG );
			}

			$oauth_client                  = $this->authentication->get_oauth_client();
			$needs_module_reauthentication = $oauth_client->needs_reauthentication();

			// Activation happens in this same request and does not re-run module register hooks,
			// so module scopes may not yet be reflected in needs_reauthentication().
			if ( ! $needs_module_reauthentication ) {
				try {
					$module = $this->modules->get_module( Analytics_4::MODULE_SLUG );
				} catch ( Exception $e ) {
					$module = null;
				}

				if ( $module instanceof Module_With_Scopes ) {
					$needs_module_reauthentication = ! $oauth_client->has_sufficient_scopes( $module->get_scopes() );
				}
			}

			if ( $needs_module_reauthentication ) {
				$redirect_url = add_query_arg(
					array(
						'redirect' => rawurlencode( $redirect_url ),
						'status'   => 'true',
					),
					$this->authentication->get_connect_url()
				);
			}
		}

		$this->email_notices->dismiss_notice_for_user( $notice_id, $user );

		return $redirect_url;
	}
}
