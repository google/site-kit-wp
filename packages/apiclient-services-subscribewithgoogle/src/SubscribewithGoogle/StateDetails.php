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

class StateDetails extends \Google\Model
{
  protected $amountType = Money::class;
  protected $amountDataType = '';
  protected $amountDetailsType = AmountDetails::class;
  protected $amountDetailsDataType = '';
  protected $merchantRevenueDataType = MerchantRevenueData::class;
  protected $merchantRevenueDataDataType = '';
  /**
   * Output only. The state of current state details.
   *
   * @var string
   */
  public $orderState;
  /**
   * The time that this order was last modified at this state.
   *
   * @var string
   */
  public $time;

  /**
   * The amount/price of the product/service this line item represents. If the
   * purchased quantity is specified, this is the price of one single unit. The
   * amount will be tax inclusive if amount_includes_tax is set to true.
   *
   * @param Money $amount
   */
  public function setAmount(Money $amount)
  {
    $this->amount = $amount;
  }
  /**
   * @return Money
   */
  public function getAmount()
  {
    return $this->amount;
  }
  /**
   * The detail amount breakdown in buyer’s currency
   *
   * @param AmountDetails $amountDetails
   */
  public function setAmountDetails(AmountDetails $amountDetails)
  {
    $this->amountDetails = $amountDetails;
  }
  /**
   * @return AmountDetails
   */
  public function getAmountDetails()
  {
    return $this->amountDetails;
  }
  /**
   * The merchant revenue data of the state.
   *
   * @param MerchantRevenueData $merchantRevenueData
   */
  public function setMerchantRevenueData(MerchantRevenueData $merchantRevenueData)
  {
    $this->merchantRevenueData = $merchantRevenueData;
  }
  /**
   * @return MerchantRevenueData
   */
  public function getMerchantRevenueData()
  {
    return $this->merchantRevenueData;
  }
  /**
   * Output only. The state of current state details.
   *
   * @param string $orderState
   */
  public function setOrderState($orderState)
  {
    $this->orderState = $orderState;
  }
  /**
   * @return string
   */
  public function getOrderState()
  {
    return $this->orderState;
  }
  /**
   * The time that this order was last modified at this state.
   *
   * @param string $time
   */
  public function setTime($time)
  {
    $this->time = $time;
  }
  /**
   * @return string
   */
  public function getTime()
  {
    return $this->time;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(StateDetails::class, 'Google_Service_SubscribewithGoogle_StateDetails');
