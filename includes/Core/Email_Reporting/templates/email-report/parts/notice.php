<?php
/**
 * In-email notice block for the email-report template.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array  $notice        Notice payload.
 * @var string $icon_star_url Star icon URL.
 */

$notice_title     = $notice['title'] ?? '';
$notice_body      = $notice['body'] ?? '';
$learn_more_label = $notice['learn_more_label'] ?? '';
$learn_more_url   = $notice['learn_more_url'] ?? '';
$cta_label        = $notice['cta_label'] ?? '';
$cta_url          = $notice['cta_url'] ?? '';

if ( empty( $notice_title ) && empty( $notice_body ) ) {
	return;
}
?>
<table role="presentation" width="100%" class="googlesitekit-email-report-notice" style="margin-bottom:24px;">
	<tr>
		<td class="googlesitekit-email-report-notice-surface"
			style="background-color:#E3D1FF; border-radius:24px; padding:14px 24px;">
			<div style="margin-bottom:6px;">
				<img src="<?php echo esc_url( $icon_star_url ); ?>" alt="" width="24" height="24"
					style="display:block; width:24px; height:24px;" />
			</div>
			<?php if ( ! empty( $notice_title ) ) : ?>
			<div style="font-size:14px; line-height:20px; font-weight:600; color:#462083;">
				<?php echo esc_html( $notice_title ); ?>
			</div>
			<?php endif; ?>
			<?php if ( ! empty( $notice_body ) ) : ?>
			<div style="font-size:14px; line-height:20px; letter-spacing: 0.25px; color:#462083; margin-bottom:16px;">
				<?php echo esc_html( $notice_body ); ?>
				<?php if ( ! empty( $learn_more_label ) && ! empty( $learn_more_url ) ) : ?>
				<a href="<?php echo esc_url( $learn_more_url ); ?>" style="color:#462083; text-decoration:underline;"
					rel="noopener" target="_blank"><?php echo esc_html( $learn_more_label ); ?></a>
				<?php endif; ?>
			</div>
			<?php endif; ?>
			<?php if ( ! empty( $cta_label ) && ! empty( $cta_url ) ) : ?>
			<table role="presentation" width="100%">
				<tr>
					<td align="right">
						<a href="<?php echo esc_url( $cta_url ); ?>"
							style="display:inline-block; background:#462083; color:#FFFFFF; font-size:14px; line-height:20px; font-weight:500; text-decoration:none; padding:6px 16px; border-radius:999px;"
							rel="noopener" target="_blank">
							<?php echo esc_html( $cta_label ); ?>
						</a>
					</td>
				</tr>
			</table>
			<?php endif; ?>
		</td>
	</tr>
</table>
