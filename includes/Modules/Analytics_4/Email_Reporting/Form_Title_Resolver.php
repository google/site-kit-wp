<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Form_Title_Resolver
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Form_Metadata;

/**
 * Gets the title the email report shows for each lead generation form.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Form_Title_Resolver {

	/**
	 * Datapoint that reads the stored title of each form.
	 *
	 * @since n.e.x.t
	 * @var Get_Form_Metadata
	 */
	private $form_metadata;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Get_Form_Metadata|null $form_metadata Optional. Datapoint that reads the stored title
	 *                                             of each form.
	 */
	public function __construct( ?Get_Form_Metadata $form_metadata = null ) {
		$this->form_metadata = $form_metadata ?? new Get_Form_Metadata( array( 'service' => '' ) );
	}

	/**
	 * Gets the title of each form.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $form_ids Form IDs the `googlesitekit_form_id` dimension reported
	 *                        (e.g. `array( '12', 'jnpfwoygltxurnayflew' )`).
	 * @return array Map of form ID to title, in the order the form IDs arrive
	 *               (e.g. `array( '12' => 'Contact form' )`).
	 */
	public function get_titles( array $form_ids ) {
		$metadata = $this->read_metadata( $form_ids );
		$titles   = array();

		foreach ( $form_ids as $form_id ) {
			$title = $metadata[ $form_id ]['title'] ?? null;

			// A form titled `0` keeps its own title. `Get_Form_Metadata` returns `null` for
			// a form with no title, so an empty check would replace `0` with `Form #0`.
			if ( null !== $title ) {
				$titles[ $form_id ] = $title;
				continue;
			}

			$titles[ $form_id ] = sprintf(
				/* translators: %s: form ID, such as "12". */
				__( 'Form #%s', 'google-site-kit' ),
				$form_id
			);
		}

		return $titles;
	}

	/**
	 * Reads the stored metadata of each form through the form metadata datapoint.
	 *
	 * This calls the datapoint directly rather than through its REST route, so
	 * `permission_callback()` never runs. The email report builds on a cron event, which
	 * has no request user to check, and the datapoint reads a form post title and nothing
	 * else.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $form_ids Form IDs the report grouped its rows by.
	 * @return array Map of form ID to metadata, holding a `title` for each.
	 */
	private function read_metadata( array $form_ids ) {
		$request = $this->form_metadata->create_request(
			new Data_Request(
				'GET',
				'modules',
				Analytics_4::MODULE_SLUG,
				'form-metadata',
				array( 'formIDs' => $form_ids )
			)
		);

		if ( is_wp_error( $request ) ) {
			return array();
		}

		return $request();
	}
}
