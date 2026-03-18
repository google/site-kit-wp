<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Notices
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Notices\Email_Notice_Interface;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Prompts\Dismissed_Prompts;
use Google\Site_Kit\Core\Storage\User_Options;
use InvalidArgumentException;
use WP_User;

/**
 * Repository for in-email notices and shared notice display logic.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Email_Notices {

	/**
	 * Golink key for in-email notice clicks.
	 *
	 * @since 1.175.0
	 */
	const GOLINK_NOTICE = 'email-report-notice';

	/**
	 * Header placement identifier.
	 *
	 * @since 1.175.0
	 */
	const PLACEMENT_HEADER = 'header';

	/**
	 * Section placement identifier.
	 *
	 * @since 1.175.0
	 */
	const PLACEMENT_SECTION = 'section';

	/**
	 * Maximum number of impressions before permanent dismissal.
	 *
	 * @since 1.175.0
	 */
	const MAX_NOTICE_IMPRESSIONS = 2;

	/**
	 * Plugin context.
	 *
	 * @since 1.175.0
	 * @var Context
	 */
	private $context;

	/**
	 * Golinks service.
	 *
	 * @since 1.175.0
	 * @var Golinks
	 */
	private $golinks;

	/**
	 * Registered notice definitions keyed by ID.
	 *
	 * @since 1.175.0
	 * @var array<string, Email_Notice_Interface>
	 */
	private $notices = array();

	/**
	 * Cached dismissed prompts instances keyed by user ID.
	 *
	 * @since 1.175.0
	 * @var array<int, Dismissed_Prompts>
	 */
	private $dismissed_prompts_instances = array();

	/**
	 * Constructor.
	 *
	 * @since 1.175.0
	 *
	 * @param Context $context Plugin context.
	 * @param Golinks $golinks Golinks service.
	 * @param array   $notices Optional. Notice definitions. Default empty.
	 */
	public function __construct( Context $context, Golinks $golinks, array $notices = array() ) {
		$this->context = $context;
		$this->golinks = $golinks;

		foreach ( $notices as $notice ) {
			if ( ! $notice instanceof Email_Notice_Interface ) {
				continue;
			}

			$this->register_notice( $notice );
		}
	}

	/**
	 * Registers a notice definition.
	 *
	 * @since 1.175.0
	 *
	 * @param Email_Notice_Interface $notice Notice definition.
	 * @throws InvalidArgumentException Thrown when a notice with the same ID is already registered.
	 */
	public function register_notice( Email_Notice_Interface $notice ) {
		$notice_id = sanitize_key( $notice->get_id() );

		if ( isset( $this->notices[ $notice_id ] ) ) {
			throw new InvalidArgumentException( sprintf( 'A notice is already registered for ID "%s".', $notice_id ) );
		}

		$this->notices[ $notice_id ] = $notice;
	}

	/**
	 * Gets eligible header notices for a user and tracks impressions.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user Recipient user.
	 * @return array Eligible header notices.
	 */
	public function get_header_notices( WP_User $user ) {
		return $this->get_notices_for_placement( $user, self::PLACEMENT_HEADER );
	}

	/**
	 * Gets eligible section notices for a user and section key.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user        Recipient user.
	 * @param string  $section_key Section key.
	 * @return array Eligible section notices.
	 */
	public function get_section_notices( WP_User $user, $section_key ) {
		return $this->get_notices_for_placement(
			$user,
			self::PLACEMENT_SECTION,
			(string) $section_key
		);
	}

	/**
	 * Gets registered section notice keys.
	 *
	 * @since 1.175.0
	 *
	 * @return string[] Unique section keys.
	 */
	public function get_section_notice_keys() {
		$section_keys = array();

		foreach ( $this->notices as $notice ) {
			if ( self::PLACEMENT_SECTION !== $notice->get_placement() ) {
				continue;
			}

			$section_key = sanitize_key( $notice->get_section_key() );
			if ( '' === $section_key ) {
				continue;
			}

			$section_keys[] = $section_key;
		}

		return array_values( array_unique( $section_keys ) );
	}

	/**
	 * Dismisses a notice for a user.
	 *
	 * @since 1.175.0
	 *
	 * @param string  $notice_id          Notice ID.
	 * @param WP_User $user               User who dismissed/clicked.
	 * @param int     $expires_in_seconds Optional TTL for dismissal. Default permanent.
	 */
	public function dismiss_notice_for_user( $notice_id, WP_User $user, $expires_in_seconds = Dismissed_Prompts::DISMISS_PROMPT_PERMANENTLY ) {
		$notice = $this->get_notice( $notice_id );
		if ( null === $notice ) {
			return;
		}

		$this->get_dismissed_prompts( $user->ID )->add(
			$notice->get_dismissal_slug(),
			$expires_in_seconds
		);
	}

	/**
	 * Resolves redirect URL for a notice CTA click.
	 *
	 * @since 1.175.0
	 *
	 * @param string  $notice_id Notice ID.
	 * @param WP_User $user      Current user.
	 * @return string Redirect URL.
	 */
	public function get_notice_redirect_url( $notice_id, WP_User $user ) {
		$notice = $this->get_notice( $notice_id );
		if ( null === $notice ) {
			return $this->get_default_redirect_url();
		}

		return (string) $notice->get_redirect_url( $user );
	}

	/**
	 * Gets the default dashboard redirect URL.
	 *
	 * @since 1.175.0
	 *
	 * @return string Redirect URL.
	 */
	public function get_default_redirect_url() {
		return $this->golinks->get_url( 'dashboard' );
	}

	/**
	 * Gets a registered notice by ID.
	 *
	 * @since 1.175.0
	 *
	 * @param string $notice_id Notice ID.
	 * @return Email_Notice_Interface|null Notice definition or null.
	 */
	private function get_notice( $notice_id ) {
		$notice_id = sanitize_key( (string) $notice_id );

		return $this->notices[ $notice_id ] ?? null;
	}

	/**
	 * Gets eligible notices for a placement and optional section key.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user        Recipient user.
	 * @param string  $placement   Placement slug.
	 * @param string  $section_key Optional. Section key for section placement.
	 * @return array Eligible notices.
	 */
	private function get_notices_for_placement( WP_User $user, $placement, $section_key = '' ) {
		$eligible_notices = array();
		$section_key      = sanitize_key( $section_key );

		foreach ( $this->notices as $notice ) {
			if ( $placement !== $notice->get_placement() ) {
				continue;
			}

			if ( self::PLACEMENT_SECTION === $placement && $notice->get_section_key() !== $section_key ) {
				continue;
			}

			if ( ! $this->is_notice_eligible( $notice, $user ) ) {
				continue;
			}

			$payload = $notice->get_payload( $user );
			if ( ! is_array( $payload ) ) {
				continue;
			}

			$eligible_notices[] = array(
				'id'               => $notice->get_id(),
				'title'            => isset( $payload['title'] ) ? (string) $payload['title'] : '',
				'body'             => isset( $payload['body'] ) ? (string) $payload['body'] : '',
				'learn_more_label' => isset( $payload['learn_more_label'] ) ? (string) $payload['learn_more_label'] : '',
				'learn_more_url'   => isset( $payload['learn_more_url'] ) ? (string) $payload['learn_more_url'] : '',
				'cta_label'        => isset( $payload['cta_label'] ) ? (string) $payload['cta_label'] : '',
				'cta_url'          => isset( $payload['cta_url'] ) ? (string) $payload['cta_url'] : '',
			);

			$this->track_notice_impression( $notice, $user );
		}

		return $eligible_notices;
	}

	/**
	 * Determines whether a notice is eligible for display for a user.
	 *
	 * @since 1.175.0
	 *
	 * @param Email_Notice_Interface $notice Notice definition.
	 * @param WP_User                $user   User.
	 * @return bool True if eligible.
	 */
	private function is_notice_eligible( Email_Notice_Interface $notice, WP_User $user ) {
		if ( ! $notice->should_display( $user ) ) {
			return false;
		}

		$prompt_state = $this->get_prompt_state( $notice, $user->ID );

		if ( $this->is_prompt_exhausted( $prompt_state ) ) {
			$this->dismiss_notice_for_user( $notice->get_id(), $user );
			return false;
		}

		if ( $this->is_prompt_dismissed( $prompt_state ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Tracks a notice impression.
	 *
	 * @since 1.175.0
	 *
	 * @param Email_Notice_Interface $notice Notice definition.
	 * @param WP_User                $user   User.
	 */
	private function track_notice_impression( Email_Notice_Interface $notice, WP_User $user ) {
		$this->get_dismissed_prompts( $user->ID )->add(
			$notice->get_dismissal_slug(),
			DAY_IN_SECONDS
		);
	}

	/**
	 * Gets prompt state for a notice and user.
	 *
	 * @since 1.175.0
	 *
	 * @param Email_Notice_Interface $notice  Notice definition.
	 * @param int                    $user_id User ID.
	 * @return array Prompt state.
	 */
	private function get_prompt_state( Email_Notice_Interface $notice, $user_id ) {
		$prompts        = $this->get_dismissed_prompts( $user_id )->get();
		$dismissal_slug = $notice->get_dismissal_slug();

		return ( isset( $prompts[ $dismissal_slug ] ) && is_array( $prompts[ $dismissal_slug ] ) )
			? $prompts[ $dismissal_slug ]
			: array();
	}

	/**
	 * Determines whether a prompt is currently dismissed.
	 *
	 * @since 1.175.0
	 *
	 * @param array $prompt_state Prompt state.
	 * @return bool True if dismissed.
	 */
	private function is_prompt_dismissed( array $prompt_state ) {
		$expires = isset( $prompt_state['expires'] ) ? (int) $prompt_state['expires'] : 0;

		if ( 0 === $expires ) {
			return ! empty( $prompt_state );
		}

		return $expires > time();
	}

	/**
	 * Determines whether a prompt has reached maximum impressions.
	 *
	 * @since 1.175.0
	 *
	 * @param array $prompt_state Prompt state.
	 * @return bool True if exhausted.
	 */
	private function is_prompt_exhausted( array $prompt_state ) {
		$count = isset( $prompt_state['count'] ) ? (int) $prompt_state['count'] : 0;

		return $count >= self::MAX_NOTICE_IMPRESSIONS;
	}

	/**
	 * Gets dismissed prompts instance for a specific user.
	 *
	 * @since 1.175.0
	 *
	 * @param int $user_id User ID.
	 * @return Dismissed_Prompts Dismissed prompts instance.
	 */
	private function get_dismissed_prompts( $user_id ) {
		$user_id = (int) $user_id;

		if ( ! isset( $this->dismissed_prompts_instances[ $user_id ] ) ) {
			$this->dismissed_prompts_instances[ $user_id ] = new Dismissed_Prompts(
				new User_Options( $this->context, $user_id )
			);
		}

		return $this->dismissed_prompts_instances[ $user_id ];
	}
}
