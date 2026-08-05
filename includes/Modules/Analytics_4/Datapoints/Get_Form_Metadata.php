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
	 * Post types where the `googlesitekit_form_id` dimension reports a post
	 * slug rather than a post ID.
	 *
	 * Each post type maps to the post statuses that may disclose a title.
	 *
	 * A plugin that reports a post ID belongs in FORM_POST_TYPES instead.
	 * Keeping the lists apart means a slug lookup searches only the post types
	 * that report slugs, so a page or an attachment holding the same slug never
	 * discloses its title.
	 *
	 * OptinMonster stores each campaign as an `omapi` post whose slug is the
	 * campaign ID the dimension reports, for example `jnpfwoygltxurnayflew`. It
	 * also saves a campaign as a draft whenever the campaign's remote status
	 * isn't active, so the list holds `draft` as well as `publish` and a paused
	 * campaign still resolves its title.
	 *
	 * @since 1.185.0
	 * @var array
	 */
	const FORM_SLUG_POST_TYPES = array(
		'omapi' => array( 'publish', 'draft' ),
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
				// Note: ensure the value returned matches what the
				// JS side requested precisely.
				//
				// Re-keying through `absint()`, for instance, would turn
				// "00123" into "123" and cause a mismatch in the JS.
				if ( is_numeric( $form_id ) ) {
					// A form post ID is a positive integer, so a zero or a
					// negative value names no form and never reaches the
					// result.
					if ( (int) $form_id <= 0 ) {
						continue;
					}

					$metadata[ $form_id ] = $this->resolve_form_metadata_by_id( (int) $form_id );
				} elseif ( is_string( $form_id ) && '' !== $form_id ) {
					// The `googlesitekit_form_id` dimension names a form in
					// FORM_SLUG_POST_TYPES by post slug rather than by post
					// ID, so a non-numeric, non-empty string takes the slug
					// lookup.
					$metadata[ $form_id ] = $this->resolve_form_metadata_by_slug( $form_id );
				}
			}

			return $metadata;
		};
	}

	/**
	 * Resolves metadata for a form the report names by post ID.
	 *
	 * The title comes from a published post in FORM_POST_TYPES.
	 * If nothing is found, it will try to get data from the Ninja Forms custom
	 * table, which keeps its forms outside the posts table.
	 *
	 * An ID that neither one matches resolves a null title.
	 *
	 * @since 1.182.0
	 * @since 1.185.0 Renamed from `resolve_form_metadata()`, since a second method now resolves a slug.
	 *
	 * @param int $form_id The form post ID.
	 * @return array {
	 *     Form metadata.
	 *
	 *     @type string|null $title Resolved title, or null when none could be found.
	 * }
	 */
	protected function resolve_form_metadata_by_id( $form_id ) {
		$title = '';

		$post_type = get_post_type( $form_id );

		if ( $post_type
			&& in_array( $post_type, self::FORM_POST_TYPES, true )
			&& 'publish' === get_post_status( $form_id ) ) {
			$title = get_the_title( $form_id );
		}

		// Ninja Forms stores forms in a custom table rather than as a Custom
		// Post Type.
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
	 * Resolves metadata for a form the report names by post slug.
	 *
	 * A slug that matches no post in FORM_SLUG_POST_TYPES resolves a null
	 * title, so the dashboard keeps its ID fallback label.
	 *
	 * @since 1.185.0
	 *
	 * @param string $slug The post slug the report names as the form ID. For example, `'jnpfwoygltxurnayflew'`, not `'12'`.
	 * @return array {
	 *     Form metadata.
	 *
	 *     @type string|null $title Resolved title, or null when no form matches the slug.
	 * }
	 */
	protected function resolve_form_metadata_by_slug( $slug ) {
		$form = get_page_by_path( $slug, OBJECT, array_keys( self::FORM_SLUG_POST_TYPES ) );

		$title = '';

		// `get_page_by_path()` matches only the post types it received, so the
		// map always holds the statuses for the post type it found.
		if ( $form && in_array( $form->post_status, self::FORM_SLUG_POST_TYPES[ $form->post_type ], true ) ) {
			$title = get_the_title( $form );
		}

		return array(
			'title' => $this->decode_title_entities( $title ),
		);
	}

	/**
	 * Decodes the HTML entities in a resolved title, and maps an empty title
	 * to null.
	 *
	 * `get_the_title()` runs the stored title through the `the_title` filters.
	 * One of those filters is `wptexturize()`, which rewrites "&" to `&#038;`
	 * and a single quote to an apostrophe (`&#8217;`).
	 *
	 * A Site Goals breakdown tab prints its label as plain text, so a tab for
	 * a form named "Tips & Tricks" would read "Tips &#038; Tricks"
	 * on screen. Every title passes through here, including the Ninja Forms
	 * one that skips those filters, so every plugin's title reaches the
	 * dashboard with its entities decoded. An empty title means nothing
	 * resolved, which maps to null.
	 *
	 * @since 1.185.0
	 *
	 * @param string $title The resolved title, empty when nothing matched.
	 * @return string|null Decoded title, or null when there is no title.
	 */
	protected function decode_title_entities( $title ) {
		if ( '' === $title ) {
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
