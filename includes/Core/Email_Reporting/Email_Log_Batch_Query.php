<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use WP_Query;

/**
 * Helper for querying and updating email log batches.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Email_Log_Batch_Query {

	const MAX_ATTEMPTS = 3;

	/**
	 * Email log statuses.
	 *
	 * @since 1.172.0
	 *
	 * @var string[]
	 */
	const EMAIL_LOG_STATUSES = array(
		Email_Log::STATUS_SENT,
		Email_Log::STATUS_FAILED,
		Email_Log::STATUS_SCHEDULED,
	);

	/**
	 * Gets the total count of email log entries by status.
	 *
	 * @since 1.173.0
	 *
	 * @param string $status Post status to count.
	 * @return int
	 */
	public function get_total_count_by_status( $status ) {
		if ( ! post_type_exists( Email_Log::POST_TYPE ) ) {
			return 0;
		}

		$query = new WP_Query(
			array(
				'post_type'              => Email_Log::POST_TYPE,
				'post_status'            => (string) $status,
				'posts_per_page'         => 1,
				'fields'                 => 'ids',
				'no_found_rows'          => false,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		return (int) $query->found_posts;
	}

	/**
	 * Gets sent/failed counts for a batch of email log entries.
	 *
	 * Returns zeros if any entry in the batch is still scheduled.
	 *
	 * @since 1.173.0
	 *
	 * @param array<int> $post_ids Post IDs in the batch.
	 * @return array{sent:int,failed:int}
	 */
	public function get_batch_counts( array $post_ids ) {
		$default = array(
			'sent'   => 0,
			'failed' => 0,
		);

		if ( empty( $post_ids ) ) {
			return $default;
		}

		foreach ( $post_ids as $post_id ) {
			if ( Email_Log::STATUS_SCHEDULED === get_post_status( $post_id ) ) {
				return $default;
			}
		}

		$counts = $default;

		foreach ( $post_ids as $post_id ) {
			$status = get_post_status( $post_id );

			if ( Email_Log::STATUS_SENT === $status ) {
				++$counts['sent'];
			} elseif ( Email_Log::STATUS_FAILED === $status ) {
				++$counts['failed'];
			}
		}

		return $counts;
	}

	/**
	 * Retrieves IDs for pending logs within a batch.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id     Batch identifier.
	 * @param int    $max_attempts Maximum delivery attempts allowed.
	 * @return array Pending post IDs that still require processing.
	 */
	public function get_pending_ids( $batch_id, $max_attempts = self::MAX_ATTEMPTS ) {
		$batch_id     = (string) $batch_id;
		$max_attempts = (int) $max_attempts;

		$query = $this->get_batch_query( $batch_id );

		$pending_ids = array();

		foreach ( $query->posts as $post_id ) {
			$status = get_post_status( $post_id );

			if ( Email_Log::STATUS_SENT === $status ) {
				continue;
			}

			if ( Email_Log::STATUS_FAILED === $status ) {
				$attempts = (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true );

				if ( $attempts >= $max_attempts ) {
					continue;
				}
			}

			$pending_ids[] = (int) $post_id;
		}

		return $pending_ids;
	}

	/**
	 * Builds a batch query object limited to a specific batch ID.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id Batch identifier.
	 * @return WP_Query Query returning IDs only.
	 */
	private function get_batch_query( $batch_id ) {
		return new WP_Query(
			array(
				'post_type'              => Email_Log::POST_TYPE,
				'post_status'            => self::EMAIL_LOG_STATUSES,
				// phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
				'posts_per_page'         => 10000,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'meta_query'             => array(
					array(
						'key'   => Email_Log::META_BATCH_ID,
						'value' => $batch_id,
					),
				),
			)
		);
	}

	/**
	 * Determines whether all posts in the batch completed delivery.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id     Batch identifier.
	 * @param int    $max_attempts Maximum delivery attempts allowed.
	 * @return bool True if the batch has no remaining pending posts.
	 */
	public function is_complete( $batch_id, $max_attempts = self::MAX_ATTEMPTS ) {
		return empty( $this->get_pending_ids( $batch_id, $max_attempts ) );
	}

	/**
	 * Increments the send attempt counter for a log post.
	 *
	 * @since 1.167.0
	 *
	 * @param int $post_id Log post ID.
	 * @return void Nothing returned.
	 */
	public function increment_attempt( $post_id ) {
		$post = get_post( $post_id );

		if ( ! $post || Email_Log::POST_TYPE !== $post->post_type ) {
			return;
		}

		$current_attempts = (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true );

		update_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, $current_attempts + 1 );
	}

	/**
	 * Updates the post status for a log post.
	 *
	 * @since 1.167.0
	 *
	 * @param int    $post_id Log post ID.
	 * @param string $status  New status slug.
	 * @return void Nothing returned.
	 */
	public function update_status( $post_id, $status ) {
		$post = get_post( $post_id );

		if ( ! $post || Email_Log::POST_TYPE !== $post->post_type ) {
			return;
		}

		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_status' => $status,
			)
		);
	}

	/**
	 * Gets the post IDs for the latest email log batch.
	 *
	 * @since 1.166.0
	 *
	 * @return array<int>
	 */
	public function get_latest_batch_post_ids() {
		$latest_post = new \WP_Query(
			array(
				'post_type'      => Email_Log::POST_TYPE,
				'post_status'    => self::EMAIL_LOG_STATUSES,
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);

		if ( empty( $latest_post->posts ) ) {
			return array();
		}

		$latest_post_id = (int) $latest_post->posts[0];
		$batch_id       = get_post_meta( $latest_post_id, Email_Log::META_BATCH_ID, true );

		if ( empty( $batch_id ) ) {
			return array();
		}

		$batch_query = new \WP_Query(
			array(
				'post_type'      => Email_Log::POST_TYPE,
				'post_status'    => self::EMAIL_LOG_STATUSES,
				// phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
				'posts_per_page' => 10000,
				'fields'         => 'ids',
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'meta_query'     => array(
					array(
						'key'   => Email_Log::META_BATCH_ID,
						'value' => $batch_id,
					),
				),
			)
		);

		return array_map( 'intval', $batch_query->posts );
	}

	/**
	 * Gets the error details of the first email log
	 * if ALL emails in the latest batch failed.
	 *
	 * @since 1.172.0
	 *
	 * @return string|null Error details or null if no error.
	 */
	public function get_latest_batch_error() {
		$batch_post_ids = $this->get_latest_batch_post_ids();

		if ( empty( $batch_post_ids ) ) {
			return null;
		}

		foreach ( $batch_post_ids as $post_id ) {
			$status = get_post_status( $post_id );

			$attempts = (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true );

			if ( Email_Log::STATUS_FAILED !== $status || $attempts < self::MAX_ATTEMPTS ) {
				return null;
			}
		}

		return get_post_meta( $batch_post_ids[0], Email_Log::META_ERROR_DETAILS, true );
	}
}
