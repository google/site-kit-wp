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
 * Resolves display metadata (title and originating plugin) for each
 * lead-generation form ID surfaced by the `googlesitekit_form_id` custom
 * dimension. Form plugins store their forms in different ways, so the title is
 * resolved with a multi-strategy lookup.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Form_Metadata extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * Maps a form post type to its originating plugin's display name.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	const PLUGIN_BY_POST_TYPE = array(
		'wpcf7_contact_form' => 'Contact Form 7',
		'wpforms'            => 'WPForms',
		'mc4wp-form'         => 'Mailchimp for WordPress',
		'popup'              => 'Popup Maker',
	);

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
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
				// Skip non positive-integer IDs, but key the result by the
				// original requested value so the JS side matches it back exactly
				// (re-keying via absint would drop e.g. "00123" to "123").
				if ( ! is_numeric( $form_id ) || (int) $form_id <= 0 ) {
					continue;
				}

				$metadata[ $form_id ] = $this->resolve_form_metadata( (int) $form_id );
			}

			return $metadata;
		};
	}

	/**
	 * Resolves metadata for a single form ID across the supported form plugins.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $form_id Form ID.
	 * @return array {
	 *     Form metadata.
	 *
	 *     @type string|null $title  Resolved title, or null when none could be found.
	 *     @type string|null $plugin Originating plugin display name, or null when unknown.
	 * }
	 */
	protected function resolve_form_metadata( $form_id ) {
		$title = '';

		// Resolve titles only for known form CPTs (Contact Form 7, WPForms,
		// Mailchimp/MC4WP, Popup Maker). Echoing `get_the_title()` for arbitrary
		// post types would let a view-only/shared-dashboard user enumerate titles
		// of unrelated posts/pages — including private or draft content — by
		// guessing IDs. The `read_post` check additionally blocks form posts the
		// current user isn't allowed to read (e.g. private/draft).
		$post_type = get_post_type( $form_id );
		$plugin    = $post_type
			? self::PLUGIN_BY_POST_TYPE[ $post_type ] ?? null
			: null;

		if ( $plugin && current_user_can( 'read_post', $form_id ) ) {
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
					$title  = $ninja_title;
					$plugin = 'Ninja Forms';
				}
			}
		}

		return array(
			'title'  => '' !== $title ? $title : null,
			'plugin' => $plugin,
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return bool True if the current user can view the dashboard, false otherwise.
	 */
	public function permission_callback() {
		return current_user_can( Permissions::VIEW_DASHBOARD );
	}
}
