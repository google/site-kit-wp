<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Form_Metadata
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use WP_Error;

/**
 * Class for the Site Goals lead-generation form metadata datapoint.
 *
 * Resolves the display title for each lead-generation form ID surfaced by the
 * `googlesitekit_form_id` custom dimension. Form plugins store their forms in
 * different ways, so the title is resolved with a multi-strategy lookup.
 *
 * @since 1.182.0
 * @access private
 * @ignore
 */
class Get_Form_Metadata extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * Post types whose titles may be disclosed as form names.
	 *
	 * Gates title resolution to known form CPTs, so unrelated post titles are
	 * never echoed back.
	 *
	 * @since 1.182.0
	 * @var array
	 */
	const FORM_POST_TYPES = array(
		'wpcf7_contact_form',
		'wpforms',
		'mc4wp-form',
		'popup',
	);

	/**
	 * Creates a request object.
	 *
	 * @since 1.182.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable|WP_Error Closure returning a map of form ID to metadata, or WP_Error on invalid input.
	 */
	public function create_request( Data_Request $data_request ) {
		$form_ids = $data_request['formIDs'];

		if ( ! is_array( $form_ids ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter must be an array: %s.', 'google-site-kit' ), 'formIDs' ),
				array( 'status' => 400 )
			);
		}

		return function () use ( $form_ids ) {
			$metadata = array();

			foreach ( $form_ids as $form_id ) {
				// Key each result by the original requested value so the JS side
				// matches it back exactly: re-keying via absint would drop
				// "00123" to "123".
				if ( is_numeric( $form_id ) ) {
					// A numeric ID names a form post, and a non-positive value
					// can't be one, so it drops out of the result.
					if ( (int) $form_id <= 0 ) {
						continue;
					}

					$metadata[ $form_id ] = $this->resolve_form_metadata( (int) $form_id );
				} elseif ( is_string( $form_id ) && '' !== $form_id ) {
					// A non-numeric string, such as an OptinMonster campaign
					// slug, resolves by slug instead.
					$metadata[ $form_id ] = $this->resolve_form_metadata( $form_id );
				}
			}

			return $metadata;
		};
	}

	/**
	 * Resolves metadata for a single form ID across the supported form plugins.
	 *
	 * @since 1.182.0
	 * @since n.e.x.t Accepts a non-numeric OptinMonster campaign slug as the form ID.
	 *
	 * @param int|string $form_id The form post ID, or an OptinMonster campaign slug.
	 * @return array {
	 *     Form metadata.
	 *
	 *     @type string|null $title Resolved title, or null when none could be found.
	 * }
	 */
	protected function resolve_form_metadata( $form_id ) {
		// OptinMonster reports a campaign slug rather than a post ID, so a
		// non-numeric ID resolves by slug. The early return also keeps such a
		// string away from the ID-based lookups below.
		if ( ! is_numeric( $form_id ) ) {
			return array(
				'title' => $this->decode_title_entities( $this->resolve_optin_monster_title( $form_id ) ),
			);
		}

		$title = '';

		$post_type = get_post_type( $form_id );

		if ( $post_type
			&& in_array( $post_type, self::FORM_POST_TYPES, true )
			&& 'publish' === get_post_status( $form_id ) ) {
			$title = get_the_title( $form_id );
		}

		// Ninja Forms stores forms in a custom table rather than as a CPT.
		if ( '' === $title && function_exists( 'Ninja_Forms' ) ) {
			// `form()` can return null or a model without a backing row for stale
			// or non-Ninja IDs, so guard before reading the setting.
			$ninja_form = Ninja_Forms()->form( $form_id );

			if ( is_object( $ninja_form ) && method_exists( $ninja_form, 'get_setting' ) ) {
				$ninja_title = $ninja_form->get_setting( 'title' );

				if ( ! empty( $ninja_title ) ) {
					$title = $ninja_title;
				}
			}
		}

		return array(
			'title' => $this->decode_title_entities( $title ),
		);
	}

	/**
	 * Resolves the campaign title for an OptinMonster campaign slug.
	 *
	 * OptinMonster stores each campaign as a post of its non-public `omapi`
	 * post type, whose slug is the campaign ID that the `googlesitekit_form_id`
	 * dimension reports. The lookup pins the post type list to `omapi` alone.
	 * With a string post type, `get_page_by_path()` also matches attachments,
	 * so an attachment sharing the slug could leak its title. OptinMonster
	 * saves a paused campaign as a draft, so a draft still resolves. A site
	 * without OptinMonster holds no `omapi` posts, the lookup returns null,
	 * and the caller's ID fallback applies.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $slug The campaign slug.
	 * @return string|null Campaign title, which can be empty, or null when no campaign matches the slug.
	 */
	protected function resolve_optin_monster_title( $slug ) {
		$campaign = get_page_by_path( $slug, OBJECT, array( 'omapi' ) );

		if ( ! $campaign || ! in_array( $campaign->post_status, array( 'publish', 'draft' ), true ) ) {
			return null;
		}

		return get_the_title( $campaign );
	}

	/**
	 * Decodes HTML entities in a resolved form title.
	 *
	 * WordPress passes a post title through the `the_title` filters, so
	 * `get_the_title()` returns "&" as `&#038;` and an apostrophe as `&#8217;`.
	 * The dashboard prints a breakdown tab label as plain text, so a label
	 * with an entity shows the entity itself on screen. Decoding here also
	 * keeps the post-based titles consistent with Ninja Forms, which stores
	 * its title raw. An empty title means nothing resolved, so it maps to
	 * null.
	 *
	 * @since n.e.x.t
	 *
	 * @param string|null $title The resolved title, or null when nothing matched.
	 * @return string|null Decoded title, or null when there is no title.
	 */
	protected function decode_title_entities( $title ) {
		if ( null === $title || '' === $title ) {
			return null;
		}

		return html_entity_decode( $title, ENT_QUOTES | ENT_HTML5, get_bloginfo( 'charset' ) );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.182.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}

	/**
	 * Checks whether the current user is allowed to access the datapoint.
	 *
	 * Form metadata is non-sensitive site configuration shown alongside the Site
	 * Goals breakdown, so any dashboard viewer (including shared-dashboard
	 * view-only users) may read it.
	 *
	 * @since 1.182.0
	 *
	 * @return bool True if the current user can view the dashboard, false otherwise.
	 */
	public function permission_callback() {
		return current_user_can( Permissions::VIEW_DASHBOARD );
	}
}
