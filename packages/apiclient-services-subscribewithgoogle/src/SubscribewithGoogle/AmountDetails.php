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

class AmountDetails extends \Google\Model
{
  protected $canceledAmountType = PriceDetails::class;
  protected $canceledAmountDataType = '';
  protected $chargeableAmountType = PriceDetails::class;
  protected $chargeableAmountDataType = '';
  protected $chargedAmountType = PriceDetails::class;
  protected $chargedAmountDataType = '';
  protected $declinedAmountType = PriceDetails::class;
  protected $declinedAmountDataType = '';
  protected $refundedAmountType = PriceDetails::class;
  protected $refundedAmountDataType = '';

  /**
   * @param PriceDetails
   */
  public function setCanceledAmount(PriceDetails $canceledAmount)
  {
    $this->canceledAmount = $canceledAmount;
  }
  /**
   * @return PriceDetails
   */
  public function getCanceledAmount()
  {
    return $this->canceledAmount;
  }
  /**
   * @param PriceDetails
   */
  public function setChargeableAmount(PriceDetails $chargeableAmount)
  {
    $this->chargeableAmount = $chargeableAmount;
  }
  /**
   * @return PriceDetails
   */
  public function getChargeableAmount()
  {
    return $this->chargeableAmount;
  }
  /**
   * @param PriceDetails
   */
  public function setChargedAmount(PriceDetails $chargedAmount)
  {
    $this->chargedAmount = $chargedAmount;
  }
  /**
   * @return PriceDetails
   */
  public function getChargedAmount()
  {
    return $this->chargedAmount;
  }
  /**
   * @param PriceDetails
   */
  public function setDeclinedAmount(PriceDetails $declinedAmount)
  {
    $this->declinedAmount = $declinedAmount;
  }
  /**
   * @return PriceDetails
   */
  public function getDeclinedAmount()
  {
    return $this->declinedAmount;
  }
  /**
   * @param PriceDetails
   */
  public function setRefundedAmount(PriceDetails $refundedAmount)
  {
    $this->refundedAmount = $refundedAmount;
  }
  /**
   * @return PriceDetails
   */
  public function getRefundedAmount()
  {
    return $this->refundedAmount;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(AmountDetails::class, 'Google_Service_SubscribewithGoogle_AmountDetails');
