using System.Net;
using System.Threading.Tasks;
using Abp.Dependency;
using DT.Messenger.App.MessengerServices.Dto;
using DT.Messenger.Intercommunication;
using DT.Messenger.Intercommunication.Authentication.Dto;
using DT.Messenger.Intercommunication.Authentication.Interfaces;

namespace DT.Messenger.App.MessengerServices.NodeClient
{
    public interface INodeAppFacade : ISingletonDependency
        , IAuthDataRetriever
    {
        Task<ResolveNodeOutputDto> GetTargetNodeUrl(long userId);

        Task ConnectNodeAsync(IPAddress nodeIpAddress, IConnectNodeRequest request);
        Task<KeepAliveResult> KeepNodeAliveAsync(IPAddress nodeIpAddress);

        Task<AuthorizationDto> AuthorizeUserAsync(IPAddress nodeIpAddress, int tenantId, long userId);
        Task DisconnectUserAsync(IPAddress nodeIpAddress, long userId);

        Task HandleAuthorizationTokenFailed(string failedBearerToken);
    }
}
