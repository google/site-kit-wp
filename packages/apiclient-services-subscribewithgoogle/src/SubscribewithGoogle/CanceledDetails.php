<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle;

class CanceledDetails extends \Google\Model
{
  /**
   * Unspecified.
   */
  public const CANCEL_REASON_CANCEL_REASON_UNSPECIFIED = 'CANCEL_REASON_UNSPECIFIED';
  /**
   * Plan was canceled due to fraud.
   */
  public const CANCEL_REASON_FRAUD = 'FRAUD';
  /**
   * Plan was canceled due to buyer's remorse.
   */
  public const CANCEL_REASON_REMORSE = 'REMORSE';
  /**
   * Plan was canceled due to an accidental purchase.
   */
  public const CANCEL_REASON_ACCIDENTAL_PURCHASE = 'ACCIDENTAL_PURCHASE';
  /**
   * Plan was canceled due to non-payment.
   */
  public const CANCEL_REASON_PAST_DUE = 'PAST_DUE';
  /**
   * Plan was canceled due to account closure.
   */
  public const CANCEL_REASON_ACCOUNT_CLOSED = 'ACCOUNT_CLOSED';
  /**
   * Plan was canceled for other reasons.
   */
  public const CANCEL_REASON_OTHER = 'OTHER';
  /**
   * Plan was canceled due to friendly fraud, such as a family member making a
   * purchase without the account owner's knowledge.
   */
  public const CANCEL_REASON_FRIENDLY_FRAUD = 'FRIENDLY_FRAUD';
  /**
   * Plan was canceled due to an upgrade or downgrade.
   */
  public const CANCEL_REASON_UPGRADE_DOWNGRADE = 'UPGRADE_DOWNGRADE';
  /**
   * Specifies the cancelation for this plan.
   *
   * @var string
   */
  public $cancelReason;

  /**
   * Specifies the cancelation for this plan.
   *
   * Accepted values: CANCEL_REASON_UNSPECIFIED, FRAUD, REMORSE,
   * ACCIDENTAL_PURCHASE, PAST_DUE, ACCOUNT_CLOSED, OTHER, FRIENDLY_FRAUD,
   * UPGRADE_DOWNGRADE
   *
   * @param self::CANCEL_REASON_* $cancelReason
   */
  public function setCancelReason($cancelReason)
  {
    $this->cancelReason = $cancelReason;
  }
  /**
   * @return self::CANCEL_REASON_*
   */
  public function getCancelReason()
  {
    return $this->cancelReason;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(CanceledDetails::class, 'Google_Service_SubscribewithGoogle_CanceledDetails');
