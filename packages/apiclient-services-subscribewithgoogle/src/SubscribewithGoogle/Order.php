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

class Order extends \Google\Collection
{
  protected $collection_key = 'stateDetails';
  /**
   * Output only. The time that the order was created.
   *
   * @var string
   */
  public $createTime;
  /**
   * Identifier. The resource name of the Order. Format:
   * `publications/{publication}/readers/{reader}/orders/{order}`.
   *
   * @var string
   */
  public $name;
  /**
   * This is the offer ID associated with the purchase, which corresponds to the
   * value in the 'External ID' column within the paywall section of the
   * Publisher Center. This is of the form SWGPD.dddd-dddd-dddd-dddd
   *
   * @var string
   */
  public $offerId;
  /**
   * Output only. Unique identifier of a purchase order. This is the id that is
   * displayed on the publisher center’s member page. This is of the form .dddd-
   * dddd-dddd-ddddd where is a string specific to the billable service.
   *
   * @var string
   */
  public $orderId;
  protected $paymentAddressType = PaymentAddress::class;
  protected $paymentAddressDataType = '';
  /**
   * The product title associated with the offer. Each subscription/plan title
   * follows the format 'publication name - offer name'. For contribution, this
   * will be 'publication name - (frequency) payment'
   *
   * @var string
   */
  public $planTitle;
  /**
   * The product ids of the order at the time of purchase.
   *
   * @var string[]
   */
  public $productIds;
  protected $recurrenceDetailsType = RecurrenceDetails::class;
  protected $recurrenceDetailsDataType = '';
  protected $stateDetailsType = StateDetails::class;
  protected $stateDetailsDataType = 'array';
  /**
   * Output only. The last time the order was updated.
   *
   * @var string
   */
  public $updateTime;

  /**
   * Output only. The time that the order was created.
   *
   * @param string $createTime
   */
  public function setCreateTime($createTime)
  {
    $this->createTime = $createTime;
  }
  /**
   * @return string
   */
  public function getCreateTime()
  {
    return $this->createTime;
  }
  /**
   * Identifier. The resource name of the Order. Format:
   * `publications/{publication}/readers/{reader}/orders/{order}`.
   *
   * @param string $name
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * This is the offer ID associated with the purchase, which corresponds to the
   * value in the 'External ID' column within the paywall section of the
   * Publisher Center. This is of the form SWGPD.dddd-dddd-dddd-dddd
   *
   * @param string $offerId
   */
  public function setOfferId($offerId)
  {
    $this->offerId = $offerId;
  }
  /**
   * @return string
   */
  public function getOfferId()
  {
    return $this->offerId;
  }
  /**
   * Output only. Unique identifier of a purchase order. This is the id that is
   * displayed on the publisher center’s member page. This is of the form .dddd-
   * dddd-dddd-ddddd where is a string specific to the billable service.
   *
   * @param string $orderId
   */
  public function setOrderId($orderId)
  {
    $this->orderId = $orderId;
  }
  /**
   * @return string
   */
  public function getOrderId()
  {
    return $this->orderId;
  }
  /**
   * The payment address of the buyer.
   *
   * @param PaymentAddress $paymentAddress
   */
  public function setPaymentAddress(PaymentAddress $paymentAddress)
  {
    $this->paymentAddress = $paymentAddress;
  }
  /**
   * @return PaymentAddress
   */
  public function getPaymentAddress()
  {
    return $this->paymentAddress;
  }
  /**
   * The product title associated with the offer. Each subscription/plan title
   * follows the format 'publication name - offer name'. For contribution, this
   * will be 'publication name - (frequency) payment'
   *
   * @param string $planTitle
   */
  public function setPlanTitle($planTitle)
  {
    $this->planTitle = $planTitle;
  }
  /**
   * @return string
   */
  public function getPlanTitle()
  {
    return $this->planTitle;
  }
  /**
   * The product ids of the order at the time of purchase.
   *
   * @param string[] $productIds
   */
  public function setProductIds($productIds)
  {
    $this->productIds = $productIds;
  }
  /**
   * @return string[]
   */
  public function getProductIds()
  {
    return $this->productIds;
  }
  /**
   * The recurrence details of the order.
   *
   * @param RecurrenceDetails $recurrenceDetails
   */
  public function setRecurrenceDetails(RecurrenceDetails $recurrenceDetails)
  {
    $this->recurrenceDetails = $recurrenceDetails;
  }
  /**
   * @return RecurrenceDetails
   */
  public function getRecurrenceDetails()
  {
    return $this->recurrenceDetails;
  }
  /**
   * The current and previous purchase order states that the message held.
   * (Sorted by PurchaseOrderData.update_time descending.)
   *
   * @param StateDetails[] $stateDetails
   */
  public function setStateDetails($stateDetails)
  {
    $this->stateDetails = $stateDetails;
  }
  /**
   * @return StateDetails[]
   */
  public function getStateDetails()
  {
    return $this->stateDetails;
  }
  /**
   * Output only. The last time the order was updated.
   *
   * @param string $updateTime
   */
  public function setUpdateTime($updateTime)
  {
    $this->updateTime = $updateTime;
  }
  /**
   * @return string
   */
  public function getUpdateTime()
  {
    return $this->updateTime;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Order::class, 'Google_Service_SubscribewithGoogle_Order');
