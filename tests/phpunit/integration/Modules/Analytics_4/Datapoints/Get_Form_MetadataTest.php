<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Form_MetadataTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Form_Metadata;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Form_MetadataTest extends TestCase {

	/**
	 * Get_Form_Metadata datapoint instance.
	 *
	 * @var Get_Form_Metadata
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// Mirror how WPForms registers its CPT in production: non-public, with a
		// custom capability type (whose capabilities are granted to no one) and
		// `map_meta_cap` disabled. Title resolution must not depend on post
		// capabilities, or it would fail for every real form plugin.
		register_post_type(
			'wpforms',
			array(
				'public'          => false,
				'capability_type' => 'wpforms_form',
				'map_meta_cap'    => false,
			)
		);

		// Mirror OptinMonster's own registration: the campaign post type is
		// non-public, which register_post_type() defaults to.
		register_post_type( 'omapi' );

		$this->datapoint = new Get_Form_Metadata( array( 'service' => '' ) );
	}

	public function tear_down() {
		unregister_post_type( 'wpforms' );
		unregister_post_type( 'omapi' );
		parent::tear_down();
	}

	private function data_request( array $form_ids ) {
		return new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'form-metadata',
			array( 'formIDs' => $form_ids )
		);
	}

	/**
	 * Creates an `omapi` campaign post and returns the slug WordPress stored.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $title  The campaign title.
	 * @param string $slug   The requested campaign slug.
	 * @param string $status Optional. The post status. Default 'publish'.
	 * @return string The stored campaign slug.
	 */
	private function create_omapi_campaign( $title, $slug, $status = 'publish' ) {
		$post_id = self::factory()->post->create(
			array(
				'post_title'  => $title,
				'post_name'   => $slug,
				'post_type'   => 'omapi',
				'post_status' => $status,
			)
		);

		// Return the slug WordPress stored, in case it differs from the
		// requested one.
		return get_post( $post_id )->post_name;
	}

	public function test_create_request__returns_title_for_known_post_type() {
		$form_id = self::factory()->post->create(
			array(
				'post_title' => 'Contact',
				'post_type'  => 'wpforms',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		$this->assertSame(
			array(
				$form_id => array(
					'title' => 'Contact',
				),
			),
			$request(),
			'A known form CPT should resolve its title.'
		);
	}

	public function test_create_request__does_not_disclose_non_form_post_titles() {
		// A non-form post type (e.g. a regular page/post) must not have its title
		// echoed back — only known form CPTs resolve a title.
		$form_id = self::factory()->post->create( array( 'post_title' => 'Some private page' ) );

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		$result = $request();
		$this->assertNull(
			$result[ $form_id ]['title'],
			'A non-form post type must not have its title disclosed.'
		);
	}

	public function test_create_request__does_not_disclose_unpublished_form_title() {
		$form_id = self::factory()->post->create(
			array(
				'post_title'  => 'Secret form',
				'post_type'   => 'wpforms',
				'post_status' => 'private',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		// Only published forms resolve a title; private/draft/trashed don't.
		$this->assertNull(
			$request()[ $form_id ]['title'],
			'An unpublished form title must not be disclosed.'
		);
	}

	public function test_create_request__returns_null_title_for_missing_post() {
		$missing_id = 99999;

		$request = $this->datapoint->create_request( $this->data_request( array( $missing_id ) ) );

		$this->assertSame(
			array(
				$missing_id => array(
					'title' => null,
				),
			),
			$request(),
			'A missing post should resolve null metadata under its requested ID.'
		);
	}

	public function test_create_request__returns_error_when_form_ids_not_array() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'form-metadata',
			array( 'formIDs' => 'not-an-array' )
		);

		$result = $this->datapoint->create_request( $data_request );

		$this->assertWPError( $result, 'Form metadata request with non-array form IDs should return a WP_Error.' );
		$this->assertSame(
			'missing_required_param',
			$result->get_error_code(),
			'A non-array formIDs parameter should return the missing parameter error.'
		);
	}

	public function test_create_request__drops_non_positive_and_empty_ids() {
		$form_id = self::factory()->post->create( array( 'post_title' => 'Real form' ) );

		$request = $this->datapoint->create_request(
			$this->data_request( array( $form_id, 0, -5, '-3', '' ) )
		);

		// Zero and negative numeric IDs never name a post, and an empty string
		// names nothing, so they drop out. A non-numeric slug resolves through
		// the slug path instead.
		$this->assertSame(
			array( $form_id ),
			array_keys( $request() ),
			'Non-positive numeric and empty form IDs should drop from the result.'
		);
	}

	public function test_create_request__resolves_an_optin_monster_campaign_title_by_slug() {
		$slug = $this->create_omapi_campaign( 'Newsletter Popup', 'newsletter-popup' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertSame(
			array(
				$slug => array(
					'title' => 'Newsletter Popup',
				),
			),
			$request(),
			'A published OptinMonster campaign should resolve its title by slug.'
		);
	}

	public function test_create_request__resolves_a_draft_optin_monster_campaign_title() {
		// OptinMonster saves a paused campaign as a draft, so a paused campaign
		// with historical conversions must still resolve its name.
		$slug = $this->create_omapi_campaign( 'Paused Popup', 'paused-popup', 'draft' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertSame(
			array(
				$slug => array(
					'title' => 'Paused Popup',
				),
			),
			$request(),
			'A draft OptinMonster campaign should still resolve its title.'
		);
	}

	public function test_create_request__returns_null_title_for_a_pending_campaign() {
		// Only a published or draft campaign resolves. Any other status, such
		// as a pending one, keeps the ID fallback.
		$slug = $this->create_omapi_campaign( 'Pending Popup', 'pending-popup', 'pending' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertNull(
			$request()[ $slug ]['title'],
			'A campaign outside the publish and draft statuses must not resolve a title.'
		);
	}

	public function test_create_request__returns_null_title_for_an_unknown_campaign_slug() {
		$slug = 'no-such-campaign';

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		// An unknown slug resolves to a null title, keyed by the requested
		// value, so the JS side keeps its ID fallback label for the tab.
		$this->assertSame(
			array(
				$slug => array(
					'title' => null,
				),
			),
			$request(),
			'An unknown campaign slug should resolve to a null title.'
		);
	}

	public function test_create_request__does_not_disclose_a_non_campaign_post_with_the_same_slug() {
		$slug = 'shared-campaign-slug';

		// The lookup targets the omapi post type alone, so a page or an
		// attachment sharing the slug must not resolve a title.
		self::factory()->post->create(
			array(
				'post_title' => 'Secret page',
				'post_name'  => $slug,
				'post_type'  => 'page',
			)
		);
		self::factory()->post->create(
			array(
				'post_title'  => 'Secret attachment',
				'post_name'   => $slug,
				'post_type'   => 'attachment',
				'post_status' => 'inherit',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		$this->assertNull(
			$request()[ $slug ]['title'],
			'A non-campaign post sharing the slug must not have its title disclosed.'
		);
	}

	public function test_create_request__decodes_an_ampersand_in_a_campaign_title() {
		$slug = $this->create_omapi_campaign( 'Tips & Tricks', 'tips-tricks' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		// get_the_title() returns the stored "&" as the "&#038;" entity. The tab
		// prints its label as plain text, so the response must hold the decoded
		// character.
		$this->assertSame(
			'Tips & Tricks',
			$request()[ $slug ]['title'],
			'A campaign title holding an ampersand should resolve without an HTML entity.'
		);
	}

	public function test_create_request__decodes_an_apostrophe_in_a_campaign_title() {
		$slug = $this->create_omapi_campaign( "Amara's Bookshop Sale", 'amaras-bookshop-sale' );

		$request = $this->datapoint->create_request( $this->data_request( array( $slug ) ) );

		// The title filters turn the straight apostrophe into the "&#8217;"
		// entity, which decodes back to the curly apostrophe character.
		$this->assertSame(
			'Amara’s Bookshop Sale',
			$request()[ $slug ]['title'],
			'A campaign title holding an apostrophe should resolve to the decoded character, not an HTML entity.'
		);
	}

	public function test_create_request__decodes_an_ampersand_in_a_form_post_title() {
		// The numeric post path shares the same title filters, so the decoding
		// covers every supported form plugin, not only OptinMonster.
		$form_id = self::factory()->post->create(
			array(
				'post_title' => 'Sales & Support',
				'post_type'  => 'wpforms',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		$this->assertSame(
			'Sales & Support',
			$request()[ $form_id ]['title'],
			'A form title holding an ampersand should resolve without an HTML entity.'
		);
	}

	public function test_is_shareable() {
		// Shareable so shared-dashboard viewers (view-only users) pass base-scope
		// validation and can read the breakdown tab labels.
		$this->assertTrue(
			$this->datapoint->is_shareable(),
			'The datapoint should be shareable for view-only dashboard users.'
		);
	}

	public function test_permission_callback() {
		// Non-sensitive site config shown with the breakdown, so it gates on
		// dashboard access rather than manage_options.
		$this->assertSame(
			current_user_can( Permissions::VIEW_DASHBOARD ),
			$this->datapoint->permission_callback(),
			'The datapoint permission should gate on the VIEW_DASHBOARD capability.'
		);
	}

	public function test_parse_response() {
		$test_data = array( 1 => array( 'title' => 'Contact' ) );

		$this->assertSame(
			$test_data,
			$this->datapoint->parse_response( $test_data, $this->data_request( array( 1 ) ) ),
			'The response should pass through without modification.'
		);
	}
}
