using System.Collections.Generic;
using System.Threading.Tasks;
using PetrolStations.Device.Core.Common.IOC;

namespace PetrolStations.Device.Core.Services.InAppBilling
{
    public interface IInAppBillingService : ISingletonDependency
    {
        Task<IList<IInAppBillingProduct>> GetProductsAsync(
            IInAppBillingItemType billingItemType,
            params string[] productIds
            );

        Task<IInAppBillingOrder> PurchaseConsumableAsync(
            IInAppBillingItemType purchaseType,
            string productId
            );
        
        Task<IList<IInAppBillingOrder>> RestorePurchasesAsync();
    }
}
