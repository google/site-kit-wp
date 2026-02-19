<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\REST_Email_Reporting_Controller
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Email\Email;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_User;

/**
 * Class for handling Email Reporting site settings via REST API.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
class REST_Email_Reporting_Controller {

	/**
	 * Invite rate limit transient key prefix.
	 *
	 * @since 1.173.0
	 * @var string
	 */
	const INVITE_RATE_LIMIT_TRANSIENT_KEY_PREFIX = 'googlesitekit_email_reporting_invite_user_';

	/**
	 * Invite rate limit window in seconds.
	 *
	 * @since 1.173.0
	 * @var int
	 */
	const INVITE_RATE_LIMIT_TTL = DAY_IN_SECONDS;

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @since 1.162.0
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * Modules instance.
	 *
	 * @since 1.170.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * User_Email_Reporting_Settings instance.
	 *
	 * @since 1.170.0
	 * @var User_Email_Reporting_Settings
	 */
	private $user_email_reporting_settings;

	/**
	 * Eligible_Subscribers_Query instance.
	 *
	 * @since 1.170.0
	 * @var Eligible_Subscribers_Query
	 */
	private $eligible_subscribers_query;

	/**
	 * Email_Log_Batch_Query instance.
	 *
	 * @since 1.172.0
	 * @var Email_Log_Batch_Query
	 */
	private $email_log_batch_query;

	/**
	 * Email sender instance.
	 *
	 * @since 1.173.0
	 * @var Email
	 */
	private $email_sender;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 * @since 1.170.0 Added modules and user email reporting settings dependencies.
	 * @since 1.173.0 Added eligible subscribers query and email sender dependencies and removed unused user options dependency.
	 *
	 * @param Email_Reporting_Settings      $settings                       Email_Reporting_Settings instance.
	 * @param Modules                       $modules                        Modules instance.
	 * @param User_Email_Reporting_Settings $user_email_reporting_settings  User email reporting settings instance.
	 * @param Eligible_Subscribers_Query    $eligible_subscribers_query     Eligible subscribers query instance.
	 * @param Email                         $email_sender                   Email sender instance.
	 */
	public function __construct(
		Email_Reporting_Settings $settings,
		Modules $modules,
		User_Email_Reporting_Settings $user_email_reporting_settings,
		Eligible_Subscribers_Query $eligible_subscribers_query,
		Email $email_sender
	) {
		$this->settings                      = $settings;
		$this->modules                       = $modules;
		$this->user_email_reporting_settings = $user_email_reporting_settings;
		$this->eligible_subscribers_query    = $eligible_subscribers_query;
		$this->email_log_batch_query         = new Email_Log_Batch_Query();
		$this->email_sender                  = $email_sender;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.162.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting',
						'/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.162.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_access = function () {
			return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
		};
		$can_manage = function () {
			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		return array(
			new REST_Route(
				'core/site/data/email-reporting',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->settings->get() );
						},
						'permission_callback' => $can_access,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$this->settings->set( $request['data']['settings'] );

							return new WP_REST_Response( $this->settings->get() );
						},
						'permission_callback' => $can_access,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'          => 'object',
										'required'      => true,
										'minProperties' => 1,
										'additionalProperties' => false,
										'properties'    => array(
											'enabled' => array(
												'type'     => 'boolean',
												'required' => true,
											),
										),
									),
								),
							),
						),
					),
				)
			),
			new REST_Route(
				'core/site/data/email-reporting-eligible-subscribers',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$meta_key       = $this->user_email_reporting_settings->get_meta_key();
							$eligible_users = $this->eligible_subscribers_query->get_eligible_users( get_current_user_id() );

							$data = array_map(
								function ( WP_User $user ) use ( $meta_key ) {
									return $this->map_user_to_response( $user, $meta_key );
								},
								$eligible_users
							);

							return new WP_REST_Response( array_values( $data ) );
						},
						'permission_callback' => $can_manage,
					),
				)
			),
			new REST_Route(
				'core/site/data/email-reporting-errors',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$errors = $this->email_log_batch_query->get_latest_batch_error();

							return new WP_REST_Response( is_string( $errors ) ? json_decode( $errors, true ) : array() );
						},
						'permission_callback' => $can_manage,
					),
				)
			),
			new REST_Route(
				'core/site/data/email-reporting-invite-user',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => array( $this, 'invite_user' ),
						'permission_callback' => $can_manage,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'userID' => array(
										'type'     => 'integer',
										'required' => true,
										'minimum'  => 1,
									),
								),
							),
						),
					),
				)
			),
		);
	}

	/**
	 * Sends an invitation email to a single eligible user.
	 *
	 * @since 1.173.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function invite_user( WP_REST_Request $request ) {
		$user_id = (int) $request['data']['userID'];

		if ( $user_id <= 0 ) {
			return $this->invite_error(
				'email_reporting_invalid_user_id',
				__( 'Invalid user ID.', 'google-site-kit' ),
				400
			);
		}

		$user = get_user_by( 'id', $user_id );
		if ( ! $user instanceof WP_User ) {
			return $this->invite_error(
				'email_reporting_invalid_user_id',
				__( 'Invalid user ID.', 'google-site-kit' ),
				400
			);
		}

		if ( ! $this->is_user_eligible_for_invite( $user_id ) ) {
			return $this->invite_error(
				'email_reporting_ineligible_user',
				__( 'The provided user is not eligible for invitation.', 'google-site-kit' ),
				400
			);
		}

		if ( $this->is_user_subscribed( $user_id ) ) {
			return $this->invite_error(
				'email_reporting_user_already_subscribed',
				__( 'The user is already subscribed to email reports.', 'google-site-kit' ),
				400
			);
		}

		if ( $this->is_invite_rate_limited( $user_id ) ) {
			return $this->invite_error(
				'email_reporting_invite_rate_limited',
				__( 'An invitation has already been sent to this user recently.', 'google-site-kit' ),
				429
			);
		}

		$template_renderer = new Email_Template_Renderer();
		$template_data     = $this->prepare_invitation_template_data();
		$html_content      = $template_renderer->render( 'invitation-email', $template_data );
		$text_content      = $template_renderer->render_text( 'invitation-email', $template_data );

		if ( '' === trim( $html_content ) || '' === trim( $text_content ) ) {
			return $this->invite_error(
				'email_reporting_invite_render_failed',
				__( 'Unable to render invitation email content.', 'google-site-kit' ),
				500
			);
		}

		$send_result = $this->email_sender->send(
			$user->user_email,
			$template_data['subject'],
			$html_content,
			array(),
			$text_content
		);

		if ( is_wp_error( $send_result ) ) {
			return $this->invite_error(
				$send_result->get_error_code(),
				$send_result->get_error_message(),
				500
			);
		}

		set_transient(
			$this->get_invite_rate_limit_transient_key( $user_id ),
			time(),
			self::INVITE_RATE_LIMIT_TTL
		);

		return new WP_REST_Response(
			array(
				'success' => true,
			)
		);
	}

	/**
	 * Maps a user to the REST response shape.
	 *
	 * @since 1.170.0
	 *
	 * @param WP_User $user     User object.
	 * @param string  $meta_key User meta key for email reporting settings.
	 * @return array
	 */
	private function map_user_to_response( WP_User $user, $meta_key ) {
		$settings = get_user_meta( $user->ID, $meta_key, true );

		return array(
			'id'          => (int) $user->ID,
			'displayName' => $user->display_name,
			'email'       => $user->user_email,
			'role'        => $this->get_primary_role( $user ),
			'subscribed'  => is_array( $settings ) && ! empty( $settings['subscribed'] ),
		);
	}

	/**
	 * Gets the primary role of the user.
	 *
	 * @since 1.170.0
	 *
	 * @param WP_User $user User object.
	 * @return string
	 */
	private function get_primary_role( WP_User $user ) {
		if ( empty( $user->roles ) ) {
			return '';
		}

		$roles = array_values( $user->roles );

		return (string) reset( $roles );
	}

	/**
	 * Determines whether a user is eligible to receive an invitation.
	 *
	 * @since 1.173.0
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	private function is_user_eligible_for_invite( $user_id ) {
		$eligible_users = $this->eligible_subscribers_query->get_eligible_users( get_current_user_id() );
		$eligible_ids   = wp_list_pluck( $eligible_users, 'ID' );

		return in_array( $user_id, array_map( 'intval', $eligible_ids ), true );
	}

	/**
	 * Determines whether a user is already subscribed to email reports.
	 *
	 * @since 1.173.0
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	private function is_user_subscribed( $user_id ) {
		$settings = get_user_meta( $user_id, $this->user_email_reporting_settings->get_meta_key(), true );

		return is_array( $settings ) && ! empty( $settings['subscribed'] );
	}

	/**
	 * Determines whether an invite for the user is currently rate-limited.
	 *
	 * @since 1.173.0
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	private function is_invite_rate_limited( $user_id ) {
		return false !== get_transient( $this->get_invite_rate_limit_transient_key( $user_id ) );
	}

	/**
	 * Gets the invite rate-limit transient key for a user.
	 *
	 * @since 1.173.0
	 *
	 * @param int $user_id User ID.
	 * @return string
	 */
	private function get_invite_rate_limit_transient_key( $user_id ) {
		return self::INVITE_RATE_LIMIT_TRANSIENT_KEY_PREFIX . (int) $user_id;
	}

	/**
	 * Creates a standardized invite endpoint error response.
	 *
	 * @since 1.173.0
	 *
	 * @param string $code    Error code.
	 * @param string $message Error message.
	 * @param int    $status  HTTP status code.
	 * @return WP_Error
	 */
	private function invite_error( $code, $message, $status ) {
		return new WP_Error(
			$code,
			$message,
			array(
				'status'  => (int) $status,
				'success' => false,
			)
		);
	}

	/**
	 * Prepares invitation email template data.
	 *
	 * @since 1.173.0
	 *
	 * @return array
	 */
	private function prepare_invitation_template_data() {
		$inviter       = wp_get_current_user();
		$inviter_email = $inviter instanceof WP_User ? $inviter->user_email : '';

		if ( ! is_email( $inviter_email ) ) {
			$inviter_email = (string) get_option( 'admin_email' );
		}

		$site_domain = $this->get_site_domain();

		return array(
			'subject'                => sprintf(
				/* translators: %s: Site domain. */
				__( 'Invitation to receive Site Kit reports for %s', 'google-site-kit' ),
				$site_domain
			),
			'preheader'              => sprintf(
				/* translators: %s: Inviter email address. */
				__( '%s invited you to receive periodic performance reports', 'google-site-kit' ),
				$inviter_email
			),
			'site'                   => array(
				'domain' => $site_domain,
				'url'    => home_url( '/' ),
			),
			'body'                   => Body_Content_Map::get_body( 'invitation-email' ),
			'inviter_email'          => $inviter_email,
			'learn_more_url'         => 'https://sitekit.withgoogle.com/documentation/email-reports/',
			'primary_call_to_action' => array(
				'label' => __( 'Get your report', 'google-site-kit' ),
				'url'   => admin_url( 'admin.php?page=googlesitekit-dashboard' ),
			),
			'footer'                 => array(
				'copy' => __( 'You received this email because your site admin invited you to use Site Kit email reports feature', 'google-site-kit' ),
			),
		);
	}

	/**
	 * Gets the site domain including subdirectory context.
	 *
	 * @since 1.173.0
	 *
	 * @return string
	 */
	private function get_site_domain() {
		$site_url = home_url( '/' );
		$parsed   = wp_parse_url( $site_url );

		if ( empty( $parsed['host'] ) ) {
			return $site_url;
		}

		$domain = $parsed['host'];

		if ( ! empty( $parsed['path'] ) && '/' !== $parsed['path'] ) {
			$domain .= untrailingslashit( $parsed['path'] );
		}

		return $domain;
	}
}
