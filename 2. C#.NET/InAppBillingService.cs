using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using PetrolStations.Device.Core.Extensions;
using PetrolStations.Device.Core.Services.EventBus;
using PetrolStations.Device.Core.Services.InAppBilling.Events;
using Plugin.InAppBilling;

namespace PetrolStations.Device.Core.Services.InAppBilling
{
    public class InAppBillingService : IInAppBillingService
    {
        public InAppBillingService()
        {
            Logger = NullLogger.Instance;
            EventBus = NullEventBus.Instance;
        }

        public ILogger Logger { get; set; }
        public IEventBus EventBus { get; set; }

        /// <summary>
        /// InTestingMode mode working only for UWP
        /// https://github.com/jamesmontemagno/InAppBillingPlugin/blob/2cb604bacb5675ab1346952c7ade78c6d703375e/docs/TestingAndTroubleshooting.md#turning-on-testing-mode
        /// </summary>
        private static IInAppBilling Billing
            => CrossInAppBilling.Current;

        public async Task<IList<IInAppBillingProduct>> GetProductsAsync(
            IInAppBillingItemType billingItemType,
            params string[] productIds
            )
        {
            try
            {
                await ConnectAsync();
                return await GetProductsInternalAsync(
                    billingItemType, productIds
                    );
            }
            catch (Exception ex)
            {
                Logger.LogError(ex);
                throw;
            }
            finally
            {
                await DisconnectAsync();
            }
        }

        private async Task<IList<IInAppBillingProduct>> GetProductsInternalAsync(
            IInAppBillingItemType billingItemType,
            params string[] productIds
            )
        {
            var itemType = GetItemType(billingItemType);

            var products = await Billing.GetProductInfoAsync(itemType, productIds);

            var result = products
                .Select(e => new InAppBillingProduct(e))
                .ToList<IInAppBillingProduct>();
            return result;
        }

        public async Task<IInAppBillingOrder> PurchaseConsumableAsync(
            IInAppBillingItemType itemType,
            string productId
            )
        {
            try
            {
                await ConnectAsync();
                return await PurchaseConsumableInternalAsync(
                    itemType, productId
                    );
            }
            // https://jamesmontemagno.github.io/InAppBillingPlugin/HandlingExceptions.html
            catch (InAppBillingPurchaseException ex)
            {
                Logger.LogError(ex);
                throw new InAppBillingServicePurchaseException(ex);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex);
                throw;
            }
            finally
            {
                await DisconnectAsync();
            }
        }

        private async Task<IInAppBillingOrder> PurchaseConsumableInternalAsync(
            IInAppBillingItemType billingItemType,
            string productId
            )
        {
            var itemType = GetItemType(billingItemType);

            //check purchases
            var purchase = await Billing.PurchaseAsync(productId, itemType);

            //possibility that a null came through.
            if (purchase == null)
            {
                throw new InAppBillingServicePurchaseException(
                    InAppBillingPurchaseErrorType.NullResponse
                    );
            }

            var purchaseState = purchase.State;
            if (purchaseState == PurchaseState.Canceled ||
                purchaseState == PurchaseState.Unknown ||
                purchaseState == PurchaseState.Failed)
            {
                throw new InAppBillingServicePurchaseException(purchase.State);
            }

            if (purchaseState == PurchaseState.PaymentPending ||
                purchaseState == PurchaseState.Purchasing ||
                purchaseState == PurchaseState.Deferred)
            {
                var order = MapToOrder(purchase, billingItemType);

                await PublishPendingEventAsync(order);

                throw new InAppBillingServicePendingPurchaseException(
                    order, purchase.State
                    );
            }

            if (purchaseState != PurchaseState.Purchased)
            {
                throw new InAppBillingServicePurchaseException(PurchaseState.Unknown);
            }

            return await ConsumePurchaseAsync(purchase, billingItemType);
        }

        private ItemType GetItemType(IInAppBillingItemType itemType)
        {
            if (itemType == IInAppBillingItemType.InAppPurchase)
            {
                return ItemType.InAppPurchase;
            }

            if (itemType == IInAppBillingItemType.Subscription)
            {
                return ItemType.Subscription;
            }

            throw new NotImplementedException(
                $"{nameof(IInAppBillingItemType)}: {itemType}"
                );
        }

        public async Task<IList<IInAppBillingOrder>> RestorePurchasesAsync()
        {
            try
            {
                await ConnectAsync();

                var subscriptions = await RestorePurchasesAsync(
                    IInAppBillingItemType.Subscription
                    );

                var inAppPurchases = await RestorePurchasesAsync(
                    IInAppBillingItemType.InAppPurchase
                    );

                var result = new List<IInAppBillingOrder>(
                    subscriptions.Count + inAppPurchases.Count
                    );

                result.AddRange(subscriptions);
                result.AddRange(inAppPurchases);
                return result;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex);
                return new List<IInAppBillingOrder>();
            }
            finally
            {
                await DisconnectAsync();
            }
        }

        private async Task<IList<IInAppBillingOrder>> RestorePurchasesAsync(
            IInAppBillingItemType billingItemType
            )
        {
            try
            {
                var itemType = GetItemType(billingItemType);

                var purchases = await Billing.GetPurchasesAsync(itemType);
                if (purchases == null)
                {
                    return new List<IInAppBillingOrder>();
                }

                return await EnsureConsumePurchasesAsync(
                    purchases, billingItemType
                    );
            }
            catch (InAppBillingPurchaseException ex)
            {
#if DEBUG
                if (ex.PurchaseError == PurchaseError.RestoreFailed)
                {
                    return Array.Empty<IInAppBillingOrder>();
                }
#endif
                Logger.LogError(ex);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex);
            }
            return Array.Empty<IInAppBillingOrder>();
        }

        private async Task ConnectAsync()
        {
            var connected = await Billing.ConnectAsync();
            if (connected)
            {
                return;
            }

            throw new InAppBillingServicePurchaseException(
                InAppBillingPurchaseErrorType.ConnectFailed
                );
        }

        private async Task DisconnectAsync()
        {
            try
            {
                await Billing.DisconnectAsync();
            }
            catch (Exception ex)
            {
                Logger.LogError(ex);
            }
        }

        private async Task<IList<IInAppBillingOrder>> EnsureConsumePurchasesAsync(
            IEnumerable<InAppBillingPurchase> purchases,
            IInAppBillingItemType billingItemType
            )
        {
            var orders = new List<IInAppBillingOrder>();
            foreach (var purchase in purchases)
            {
                if (purchase.IsAcknowledged)
                {
                    continue;
                }

                try
                {
                    var order = await ConsumePurchaseAsync(purchase, billingItemType);
                    orders.Add(order);
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex);
                }
            }
            return orders;
        }

        private async Task<IInAppBillingOrder> ConsumePurchaseAsync(
            InAppBillingPurchase purchase,
            IInAppBillingItemType billingItemType
            )
        {
            // purchased, we can now consume the item or do it later
            // here you may want to call your backend or process something in your app.

            // You must acknowledge all purchases within 3 days, by calling AcknowledgePurchaseAsync
            // or the Consume API if it a consumable.
            var wasConsumed = await Billing.ConsumePurchaseAsync(
                purchase.ProductId,
                purchase.PurchaseToken
                );

            // After upgrading from 4x to 5x version using PurchaseToken
            // will fail but next call with TransactionIdentifier will success
            if (!wasConsumed)
            {
                wasConsumed = await Billing.ConsumePurchaseAsync(
                    purchase.ProductId,
                    purchase.TransactionIdentifier
                );
            }

            if (!wasConsumed)
            {
                throw new InAppBillingServicePurchaseException(
                    InAppBillingPurchaseErrorType.ConsumePurchaseFailed
                    );
            }

            var order = MapToOrder(purchase, billingItemType);

            await PublishSuccessEventAsync(order);

            return order;
        }

        private IInAppBillingOrder MapToOrder(InAppBillingPurchase purchase, IInAppBillingItemType itemType)
        {
            return new InAppBillingOrder(purchase, itemType);
        }

        private async Task PublishSuccessEventAsync(IInAppBillingOrder order)
        {
            await PublishEventAsync(new InAppBillingOrderNotification(order));
        }

        private async Task PublishPendingEventAsync(IInAppBillingOrder order)
        {
            await PublishEventAsync(new InAppBillingPendingOrderNotification(order));
        }

        private async Task PublishEventAsync(INotification notification)
        {
            try
            {
                await EventBus.PublishAsync(notification);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex);
            }
        }
    }
}
